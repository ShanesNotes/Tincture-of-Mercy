import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  combatRulesFromData,
  compileCombatData,
  createCombatState,
  stepCombat,
} from "./index";

const json = (path: string): unknown =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));

describe("combat module interface", () => {
  it("compiles the authored tables into a headless reducer without runtime JSON imports", () => {
    const data = compileCombatData(
      json("../../data/frame_data.json"),
      json("../../data/combat_params.json"),
    );
    const rules = combatRulesFromData(data);
    const initial = createCombatState(rules, [
      {
        actorClass: "kalev",
        facingRadians: 0,
        id: "kalev",
        position: { x: 0, y: 0, z: 0 },
      },
    ]);
    const result = stepCombat(rules, initial, [
      {
        actorId: "kalev",
        edge: { action: "attack", pressed: true, sequence: 0, tick: 0 },
      },
    ]);

    expect(result.state.actors.kalev?.action?.id).toBe("light1");
    expect(result.state.actors.kalev?.breath.value).toBe(86);
    expect(data.params.breath.costs).toMatchObject({ jump: 22, sprintPerSecond: 11 });
  });

  it("selects roll clocks, cost, cancel point, and i-frames from the actor's Burden band", () => {
    const data = compileCombatData(
      json("../../data/frame_data.json"),
      json("../../data/combat_params.json"),
    );
    const rules = combatRulesFromData(data);
    const initial = createCombatState(rules, [
      {
        actorClass: "kalev",
        facingRadians: 0,
        id: "light-kalev",
        position: { x: 0, y: 0, z: 0 },
        rollBand: "light",
      },
    ]);
    let result = stepCombat(rules, initial, [
      {
        actorId: "light-kalev",
        edge: { action: "roll", pressed: true, sequence: 0, tick: 0 },
      },
    ]);

    expect(result.state.actors["light-kalev"]?.action?.id).toBe("roll_light");
    expect(result.state.actors["light-kalev"]?.breath.value).toBe(82);
    expect(rules.moves.roll_light?.action).toEqual({
      active: 15,
      recovery: 23,
      startup: 2,
    });
    expect(rules.moves.roll_light?.cancelRules).toContainEqual({
      fromTick: 20,
      into: "attack",
    });
    expect(rules.moves.roll_light?.iframeWindow).toEqual({
      endTickExclusive: 17,
      startTick: 2,
    });

    while ((result.state.actors["light-kalev"]?.action?.tick ?? 0) < 18) {
      result = stepCombat(rules, result.state, []);
    }
    result = stepCombat(rules, result.state, [
      {
        actorId: "light-kalev",
        edge: { action: "flask", pressed: true, sequence: 1, tick: 18 },
      },
    ]);
    while (result.state.actors["light-kalev"]?.action?.id === "roll_light") {
      const worldTick = result.state.worldTick;
      result = stepCombat(rules, result.state, []);
      if (result.state.actors["light-kalev"]?.action?.id === "flask_drink") {
        expect(worldTick).toBe(26);
      }
    }
    expect(result.state.actors["light-kalev"]?.action?.id).toBe("flask_drink");
  });
});
