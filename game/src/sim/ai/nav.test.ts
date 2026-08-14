import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  blockedCorridorGraph,
  dropGraph,
  gridGraph,
  islandGraph,
  leashHallGraph,
  plazaGraph,
} from "./fixtures";
import {
  assignPackSlots,
  boundedSeparation,
  compileWalkGraph,
  findPath,
  nearestNodeId,
  seekVelocity,
} from "./nav";
import { applyLocomotion, createWolfAiState, stepWolfAi } from "./pack";
import { parseWolfAiParams } from "./params";
import { ScriptedCombatActions } from "./scripted_combat";
import { blockedEdgeKey } from "./math";
import type { LosQuery, WolfActorState } from "./types";

const params = parseWolfAiParams(
  JSON.parse(
    readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../data/wolf_ai_params.json"), "utf8"),
  ) as unknown,
);

const clearLos: LosQuery = { raycast: () => null };

const dummyWolf = (id: string, x: number, z: number, role: WolfActorState["role"] = "lunger"): WolfActorState => ({
  id,
  role,
  x,
  y: 0,
  z,
  yaw: 0,
  pulse: 100,
  maxPulse: 100,
  alert: "alert",
  alertTimer: 180,
  confirmTimer: 0,
  lastKnownX: 0,
  lastKnownY: 0,
  lastKnownZ: 0,
  hasToken: false,
  lastAttackTick: null,
  action: null,
  mode: "engage",
  fleeReturnTick: null,
  path: [],
  pathIndex: 0,
  assignedSlot: null,
  crowdFailure: "none",
  circleSign: 1,
  feintReadyTick: 90,
  alive: true,
});

describe("deterministic navigation", () => {
  it("breaks A* f-ties by lexicographic node id", () => {
    const graph = compileWalkGraph({
      nodes: [
        { id: "start", x: 0, y: 0, z: 0 },
        { id: "aaa", x: 1, y: 0, z: 1 },
        { id: "zzz", x: 1, y: 0, z: -1 },
        { id: "goal", x: 2, y: 0, z: 0 },
      ],
      edges: [
        { from: "start", to: "aaa" },
        { from: "start", to: "zzz" },
        { from: "aaa", to: "goal" },
        { from: "zzz", to: "goal" },
      ],
      offMeshLinks: [],
    });
    expect(findPath(graph, "start", "goal")).toEqual(["start", "aaa", "goal"]);
  });

  it("finds the shortest grid path stably", () => {
    const graph = compileWalkGraph(gridGraph());
    const path = findPath(graph, "n00", "n22");
    expect(path).not.toBeNull();
    expect(path?.[0]).toBe("n00");
    expect(path?.[path.length - 1]).toBe("n22");
    expect(findPath(graph, "n00", "n22")).toEqual(path);
  });

  it("traverses off-mesh drop links one way", () => {
    const graph = compileWalkGraph(dropGraph());
    expect(findPath(graph, "a0", "b1")).toEqual(["a0", "a1", "b0", "b1"]);
    expect(findPath(graph, "b1", "a0")).toBeNull();
  });

  it("follows a path with a desired velocity aimed at the next waypoint", () => {
    const graph = compileWalkGraph(gridGraph());
    const path = findPath(graph, "n00", "n20");
    expect(path).toEqual(["n00", "n10", "n20"]);
    const start = graph.nodes.get("n00");
    const next = graph.nodes.get("n10");
    expect(start).toBeDefined();
    expect(next).toBeDefined();
    if (start === undefined || next === undefined) {
      return;
    }
    const velocity = seekVelocity(start, next, params.speeds.stalkMps, [], params);
    expect(velocity.x).toBeGreaterThan(0);
    expect(Math.abs(velocity.z)).toBeLessThan(0.01);
  });

  it("caps local avoidance so separation cannot exceed the authored bound", () => {
    const self = { x: 0, y: 0, z: 0 };
    const crowd = [
      { x: 0.1, y: 0, z: 0 },
      { x: -0.1, y: 0, z: 0.05 },
      { x: 0, y: 0, z: -0.1 },
    ];
    const sep = boundedSeparation(self, crowd, params);
    const magnitude = Math.hypot(sep.x, sep.z);
    expect(magnitude).toBeLessThanOrEqual(params.nav.avoidanceMaxMps + 1e-9);
  });

  it("leashes and resets when the target walks past 25m from home", () => {
    const combat = new ScriptedCombatActions(params);
    const graph = compileWalkGraph(leashHallGraph());
    let state = createWolfAiState(
      [{ id: "wolf-a", x: 1, y: 0, z: 0, yaw: 0 }],
      { x: 0, y: 0, z: 0 },
      params,
    );
    const result = stepWolfAi(
      state,
      { target: { x: 30, y: 0, z: 0, yaw: 0 } },
      { params, los: clearLos, combat, graph },
    );
    state = result.state;
    expect(state.wolves[0]?.mode).toBe("leash_reset");
    expect(state.events.some((entry) => entry.kind === "leash_reset")).toBe(true);
    expect(nearestNodeId(graph, { x: 0, y: 0, z: 0 })).toBe("h0");
  });

  it("re-plans around a blocked corridor edge", () => {
    const graph = compileWalkGraph(blockedCorridorGraph());
    const open = findPath(graph, "start", "end");
    expect(open).toEqual(["start", "mid", "end"]);
    const blocked = findPath(graph, "start", "end", new Set([blockedEdgeKey("start", "mid")]));
    expect(blocked).toEqual(["start", "alt1", "alt2", "end"]);
  });

  it("falls back to the outer ring when pack slots are contended", () => {
    const wolves = [
      dummyWolf("wolf-a", 3, 0, "baiter"),
      dummyWolf("wolf-b", -3, 0, "lunger"),
      dummyWolf("wolf-c", 0, 3, "harrier"),
      dummyWolf("wolf-d", 0, -3, "harrier"),
    ];
    const claimed = new Set([0, 1, 2]);
    const slots = assignPackSlots(wolves, { x: 0, y: 0, z: 0, yaw: 0 }, claimed, params, 0);
    const outer = [...slots.values()].filter((slot) => slot.outerQueue);
    expect(outer.length).toBeGreaterThan(0);
    expect(Math.hypot(outer[0]?.dest.x ?? 0, outer[0]?.dest.z ?? 0)).toBeCloseTo(
      params.nav.slotOuterRadiusM,
      5,
    );

    const combat = new ScriptedCombatActions(params);
    const graph = compileWalkGraph(plazaGraph());
    let state = createWolfAiState(
      wolves.map((wolf) => ({ id: wolf.id, x: wolf.x, y: 0, z: wolf.z })),
      { x: 0, y: 0, z: 0 },
      params,
    );
    for (let step = 0; step < 30; step += 1) {
      const result = stepWolfAi(
        state,
        { target: { x: 0, y: 0, z: 0, yaw: 0 } },
        { params, los: clearLos, combat, graph },
      );
      state = applyLocomotion(result.state, result.locomotion, 1 / params.tickHz);
    }
    expect(state.wolves.some((wolf) => wolf.crowdFailure === "slot_outer_queue" || wolf.assignedSlot !== null)).toBe(
      true,
    );
  });

  it("loiters when the target sits on an unreachable island", () => {
    const combat = new ScriptedCombatActions(params);
    const graph = compileWalkGraph(islandGraph());
    let state = createWolfAiState([{ id: "wolf-a", x: 0, y: 0, z: 0 }], { x: 0, y: 0, z: 0 }, params);
    for (let step = 0; step < 8; step += 1) {
      const result = stepWolfAi(
        state,
        { target: { x: 21, y: 0, z: 0, yaw: 0 } },
        { params, los: clearLos, combat, graph },
      );
      state = result.state;
    }
    expect(state.wolves[0]?.mode).toBe("loiter");
    expect(state.wolves[0]?.crowdFailure).toBe("unreachable_loiter");
    expect(state.events.some((entry) => entry.kind === "loiter")).toBe(true);
  });
});
