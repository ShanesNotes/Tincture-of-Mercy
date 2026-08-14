import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { plazaGraph } from "./fixtures";
import { compileWalkGraph } from "./nav";
import { applyLocomotion, createWolfAiState, stepWolfAi } from "./pack";
import { parseWolfAiParams } from "./params";
import { assignRoles, shouldFlee } from "./roles";
import { ScriptedCombatActions } from "./scripted_combat";
import type { LosQuery } from "./types";

const params = parseWolfAiParams(
  JSON.parse(
    readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../data/wolf_ai_params.json"), "utf8"),
  ) as unknown,
);

const clearLos: LosQuery = { raycast: () => null };

describe("pack roles", () => {
  it("assigns Lunger / Baiter+Lunger / all three / extra Harriers by pack size", () => {
    expect(Object.fromEntries(assignRoles(["wolf-a"]))).toEqual({ "wolf-a": "lunger" });
    expect(Object.fromEntries(assignRoles(["wolf-b", "wolf-a"]))).toEqual({
      "wolf-a": "baiter",
      "wolf-b": "lunger",
    });
    expect(Object.fromEntries(assignRoles(["wolf-c", "wolf-a", "wolf-b"]))).toEqual({
      "wolf-a": "baiter",
      "wolf-b": "lunger",
      "wolf-c": "harrier",
    });
    expect(Object.fromEntries(assignRoles(["wolf-d", "wolf-a", "wolf-c", "wolf-b"]))).toEqual({
      "wolf-a": "baiter",
      "wolf-b": "lunger",
      "wolf-c": "harrier",
      "wolf-d": "harrier",
    });
  });

  it("reassigns roles when a wolf dies", () => {
    const combat = new ScriptedCombatActions(params);
    const graph = compileWalkGraph(plazaGraph());
    let state = createWolfAiState(
      [
        { id: "wolf-a", x: 2, y: 0, z: 0 },
        { id: "wolf-b", x: -2, y: 0, z: 0 },
        { id: "wolf-c", x: 0, y: 0, z: 2 },
      ],
      { x: 0, y: 0, z: 0 },
      params,
    );
    expect(state.wolves.map((wolf) => wolf.role)).toEqual(["baiter", "lunger", "harrier"]);

    const result = stepWolfAi(
      state,
      { target: { x: 0, y: 0, z: 0, yaw: 0 }, deadIds: ["wolf-a"] },
      { params, los: clearLos, combat, graph },
    );
    state = result.state;
    const living = state.wolves.filter((wolf) => wolf.alive);
    expect(living).toHaveLength(2);
    expect(living.find((wolf) => wolf.id === "wolf-b")?.role).toBe("baiter");
    expect(living.find((wolf) => wolf.id === "wolf-c")?.role).toBe("lunger");
    expect(state.events.some((entry) => entry.kind === "role_assign" && entry.tick > 0)).toBe(true);
  });

  it("emits a 30t lunge, a 16t harrier bite, and baiter feints", () => {
    const combat = new ScriptedCombatActions(params);
    const graph = compileWalkGraph(plazaGraph());
    let state = createWolfAiState(
      [
        { id: "wolf-a", x: 2, y: 0, z: 1, yaw: Math.PI },
        { id: "wolf-b", x: -1, y: 0, z: 2, yaw: Math.PI },
        { id: "wolf-c", x: 1, y: 0, z: -2, yaw: 0 },
      ],
      { x: 0, y: 0, z: 0 },
      params,
    );
    const dt = 1 / params.tickHz;
    for (let step = 0; step < 600; step += 1) {
      const result = stepWolfAi(
        state,
        { target: { x: 0, y: 0, z: 0, yaw: 0 } },
        { params, los: clearLos, combat, graph },
      );
      state = applyLocomotion(result.state, result.locomotion, dt);
    }

    const actions = state.events.filter((entry) => entry.kind === "role_action").map((entry) => entry.detail);
    expect(actions).toContain("lunge");
    expect(actions).toContain("flank_bite");
    expect(actions).toContain("feint");
    expect(params.telegraphs.lunge.startupTicks).toBe(30);
    expect(params.telegraphs.harrier.startupTicks).toBe(16);
  });

  it("escalates aggression by +1 on howl", () => {
    const combat = new ScriptedCombatActions(params);
    const graph = compileWalkGraph(plazaGraph());
    const state = createWolfAiState([{ id: "wolf-a", x: 1, y: 0, z: 1 }], { x: 0, y: 0, z: 0 }, params);
    const next = stepWolfAi(
      state,
      { target: { x: 0, y: 0, z: 0, yaw: 0 }, howlRequested: true },
      { params, los: clearLos, combat, graph },
    ).state;
    expect(next.pack.aggressionTier).toBe(1);
    expect(next.pack.howlCount).toBe(1);
    expect(next.events.some((entry) => entry.kind === "howl")).toBe(true);
  });

  it("flees below 25% Pulse and returns after 2400t", () => {
    expect(shouldFlee(24, 100, params)).toBe(true);
    expect(shouldFlee(25, 100, params)).toBe(false);

    const combat = new ScriptedCombatActions(params);
    const graph = compileWalkGraph(plazaGraph());
    let state = createWolfAiState(
      [{ id: "wolf-a", x: 1, y: 0, z: 1, pulse: 24, maxPulse: 100 }],
      { x: 0, y: 0, z: 0 },
      params,
    );
    const first = stepWolfAi(
      state,
      { target: { x: 0, y: 0, z: 0, yaw: 0 } },
      { params, los: clearLos, combat, graph },
    ).state;
    expect(first.wolves[0]?.mode).toBe("flee");
    expect(first.wolves[0]?.fleeReturnTick).toBe(1 + params.flee.returnTicks);

    state = first;
    for (let step = 0; step < params.flee.returnTicks; step += 1) {
      state = stepWolfAi(
        state,
        { target: { x: 0, y: 0, z: 0, yaw: 0 }, pulseOverrides: { "wolf-a": 24 } },
        { params, los: clearLos, combat, graph },
      ).state;
    }
    expect(state.wolves[0]?.mode).toBe("return");
    expect(state.events.some((entry) => entry.kind === "return")).toBe(true);
  });
});
