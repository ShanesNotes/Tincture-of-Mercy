import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { plazaGraph } from "./fixtures";
import { compileWalkGraph } from "./nav";
import { applyLocomotion, createWolfAiState, stepWolfAi } from "./pack";
import { parseWolfAiParams } from "./params";
import { ScriptedCombatActions } from "./scripted_combat";
import { inTokenRing, pickTokenCandidate, ringTokenHolders, tokenGrantScore } from "./token";
import type { LosQuery, WolfActorState } from "./types";

const params = parseWolfAiParams(
  JSON.parse(
    readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../data/wolf_ai_params.json"), "utf8"),
  ) as unknown,
);

const clearLos: LosQuery = { raycast: () => null };

const baseWolf = (id: string, role: WolfActorState["role"], x: number, z: number): WolfActorState => ({
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

describe("pack token", () => {
  const target = { x: 0, y: 0, z: 0, yaw: 0 };

  it("grants at most one token inside the 3.5m ring", () => {
    const wolves = [
      baseWolf("wolf-a", "lunger", 1, 0),
      baseWolf("wolf-b", "harrier", 0, 1),
      baseWolf("wolf-c", "baiter", -1, 0),
    ];
    const winner = pickTokenCandidate(wolves, target, 10, params);
    expect(winner).not.toBeNull();
    const granted = wolves.map((wolf) => ({ ...wolf, hasToken: wolf.id === winner?.id }));
    expect(ringTokenHolders(granted, target, params)).toHaveLength(1);
  });

  it("scores lunger above harrier above baiter at equal pose", () => {
    const lunger = tokenGrantScore(baseWolf("wolf-b", "lunger", 1, 0), target, 10, params);
    const harrier = tokenGrantScore(baseWolf("wolf-c", "harrier", 1, 0), target, 10, params);
    const baiter = tokenGrantScore(baseWolf("wolf-a", "baiter", 1, 0), target, 10, params);
    expect(lunger).toBeGreaterThan(harrier);
    expect(harrier).toBeGreaterThan(baiter);
  });

  it("breaks score ties by lexicographic actor id", () => {
    const twins = [
      baseWolf("wolf-m", "lunger", 1, 0),
      baseWolf("wolf-k", "lunger", 1, 0),
    ];
    expect(pickTokenCandidate(twins, target, 10, params)?.id).toBe("wolf-k");
  });

  it("penalizes a wolf still inside its attack cooldown", () => {
    const fresh = tokenGrantScore(baseWolf("wolf-a", "lunger", 1, 0), target, 200, params);
    const tired = tokenGrantScore(
      { ...baseWolf("wolf-a", "lunger", 1, 0), lastAttackTick: 190 },
      target,
      200,
      params,
    );
    expect(fresh).toBeGreaterThan(tired);
  });

  it("releases the token exactly 45t after attack resolution", () => {
    const combat = new ScriptedCombatActions(params);
    const graph = compileWalkGraph(plazaGraph());
    let state = createWolfAiState(
      [{ id: "wolf-a", x: 1, y: 0, z: 1, yaw: 0 }],
      { x: 0, y: 0, z: 0 },
      params,
    );
    const dt = 1 / params.tickHz;
    let firstResolvedTick: number | null = null;

    for (let step = 0; step < 400; step += 1) {
      const result = stepWolfAi(
        state,
        { target: { x: 0, y: 0, z: 0, yaw: 0 } },
        { params, los: clearLos, combat, graph },
      );
      state = applyLocomotion(result.state, result.locomotion, dt);
      if (firstResolvedTick === null && state.pack.tokenResolvedTick !== null) {
        firstResolvedTick = state.pack.tokenResolvedTick;
      }
      const resolvedAt = firstResolvedTick;
      if (
        resolvedAt !== null &&
        state.events.some(
          (entry) =>
            entry.kind === "token_release" &&
            entry.tick === resolvedAt + params.token.releaseTicksAfterResolution,
        )
      ) {
        break;
      }
    }

    expect(firstResolvedTick).not.toBeNull();
    const release = state.events.find(
      (entry) =>
        entry.kind === "token_release" && entry.tick === (firstResolvedTick ?? 0) + params.token.releaseTicksAfterResolution,
    );
    expect(release?.tick).toBe((firstResolvedTick ?? 0) + params.token.releaseTicksAfterResolution);
  });

  it("never breaks the ring invariant across 10k ticks with four wolves (F10)", () => {
    const combat = new ScriptedCombatActions(params);
    const graph = compileWalkGraph(plazaGraph());
    let state = createWolfAiState(
      [
        { id: "wolf-a", x: 3, y: 0, z: 0, yaw: Math.PI },
        { id: "wolf-b", x: -3, y: 0, z: 0, yaw: 0 },
        { id: "wolf-c", x: 0, y: 0, z: 3, yaw: Math.PI },
        { id: "wolf-d", x: 0, y: 0, z: -3, yaw: 0 },
      ],
      { x: 0, y: 0, z: 0 },
      params,
    );
    const dt = 1 / params.tickHz;
    const target = { x: 0, y: 0, z: 0, yaw: 0 };
    let grants = 0;

    for (let step = 0; step < 10_000; step += 1) {
      const movingTarget = {
        x: Math.sin(step * 0.01) * 1.2,
        y: 0,
        z: Math.cos(step * 0.01) * 1.2,
        yaw: step * 0.01,
      };
      const result = stepWolfAi(
        state,
        { target: movingTarget },
        { params, los: clearLos, combat, graph },
      );
      state = applyLocomotion(result.state, result.locomotion, dt);
      const holders = ringTokenHolders(state.wolves, movingTarget, params);
      expect(holders.length).toBeLessThanOrEqual(1);
      const flagged = state.wolves.filter((wolf) => wolf.hasToken);
      expect(flagged.length).toBeLessThanOrEqual(1);
      grants += result.state.events.length > state.events.length ? 0 : 0;
    }

    grants = state.events.filter((entry) => entry.kind === "token_grant").length;
    expect(grants).toBeGreaterThan(0);
    expect(inTokenRing({ x: 0, y: 0, z: 0 }, target, params)).toBe(true);
  });
});
