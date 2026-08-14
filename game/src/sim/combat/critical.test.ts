import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { compileCombatData } from "./data";
import { requestBackstab, requestRiposte } from "./critical";
import { createCombatSimulation, stepCombatSimulation } from "./simulation";

const json = (path: string): unknown =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const data = compileCombatData(
  json("../../data/frame_data.json"),
  json("../../data/combat_params.json"),
);

const initial = () =>
  createCombatSimulation(data, [
    {
      actorClass: "kalev",
      facingRadians: 0,
      id: "kalev",
      position: { x: 0, y: 0, z: -1 },
      pulse: 100,
      steadyClass: "kalev",
    },
    {
      actorClass: "wolf",
      facingRadians: 0,
      id: "target",
      position: { x: 0, y: 0, z: 0 },
      pulse: 100,
      steadyClass: "wolf",
    },
    {
      actorClass: "wolf",
      facingRadians: 0,
      id: "bystander",
      position: { x: 2, y: 0, z: 0 },
      pulse: 100,
      steadyClass: "wolf",
    },
  ]);

describe("critical action requests", () => {
  it("creates the committed backstab only inside the authored rear cone", () => {
    const state = initial();
    const kalev = state.combat.actors.kalev;
    expect(kalev).toBeDefined();
    if (kalev === undefined) {
      throw new Error("Expected Kalev in the combat fixture.");
    }
    expect(requestBackstab(data, state, "kalev", "target", 4)).toMatchObject({
      actorId: "kalev",
      moveId: "backstab",
    });
    const outside = {
      ...state,
      combat: {
        ...state.combat,
        actors: {
          ...state.combat.actors,
          kalev: { ...kalev, position: { x: 1, y: 0, z: 0 } },
        },
      },
    };
    expect(requestBackstab(data, outside, "kalev", "target", 4)).toBeNull();
    const forged = stepCombatSimulation(data, outside, {
      commands: [
        {
          actorId: "kalev",
          criticalTargetId: "target",
          edge: { action: "attack", pressed: true, sequence: 10, tick: 0 },
          moveId: "backstab",
        },
      ],
      swings: [],
    });
    expect(forged.state.combat.actors.kalev?.action).toBeNull();
  });

  it("creates a riposte only while the target's actor-local window is open", () => {
    const state = initial();
    const targetDamage = state.damageActors.target;
    const targetCombat = state.combat.actors.target;
    expect(targetDamage).toBeDefined();
    expect(targetCombat).toBeDefined();
    if (targetDamage === undefined || targetCombat === undefined) {
      throw new Error("Expected target in the combat fixture.");
    }
    const opened = {
      ...state,
      damageActors: {
        ...state.damageActors,
        target: { ...targetDamage, riposteUntilClock: 90 },
      },
    };
    expect(requestRiposte(data, opened, "kalev", "target", 5)).toMatchObject({
      moveId: "riposte",
    });
    const expired = {
      ...opened,
      combat: {
        ...opened.combat,
        actors: {
          ...opened.combat.actors,
          target: {
            ...targetCombat,
            buffer: { ...targetCombat.buffer, inputClock: 90 },
          },
        },
      },
    };
    expect(requestRiposte(data, expired, "kalev", "target", 5)).toBeNull();
  });

  it("binds an authorized critical to the eligible target", () => {
    const state = initial();
    const command = requestBackstab(data, state, "kalev", "target", 20);
    if (command === null) throw new Error("Expected an eligible backstab.");
    const started = stepCombatSimulation(data, state, {
      commands: [command],
      swings: [],
    }).state;
    const kalev = started.combat.actors.kalev;
    if (kalev?.action === null || kalev?.action === undefined) {
      throw new Error("Expected the authorized backstab to start.");
    }
    const active = {
      ...started,
      combat: {
        ...started.combat,
        actors: {
          ...started.combat.actors,
          kalev: { ...kalev, action: { ...kalev.action, tick: 20 } },
        },
      },
    };
    const result = stepCombatSimulation(data, active, {
      commands: [],
      swings: [
        {
          attackerId: "kalev",
          currentWeapon: {
            a: { x: 2, y: 0.5, z: 0 },
            b: { x: 2, y: 1.5, z: 0 },
            radius: 0.05,
          },
          previousWeapon: {
            a: { x: -2, y: 0.5, z: 0 },
            b: { x: -2, y: 1.5, z: 0 },
            radius: 0.05,
          },
          targets: ["bystander", "target"].map((id) => ({
            hurtboxes: [
              {
                a: { x: 0, y: 0.5, z: 0 },
                b: { x: 0, y: 1.5, z: 0 },
                radius: 0.35,
              },
            ],
            id,
          })),
        },
      ],
    });

    expect(result.state.damageActors.target?.pulse).toBe(0);
    expect(result.state.damageActors.bystander?.pulse).toBe(100);
  });
});
