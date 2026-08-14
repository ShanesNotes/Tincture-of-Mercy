import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { compileCombatData } from "./data";
import {
  createCombatSimulation,
  stepCombatSimulation,
  type CombatSwingFrame,
} from "./simulation";

const json = (path: string): unknown =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));

const data = compileCombatData(
  json("../../data/frame_data.json"),
  json("../../data/combat_params.json"),
);

const collisionSweep = (attackerId: string, targetId: string): CombatSwingFrame => ({
  attackerId,
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
  targets: [
    {
      hurtboxes: [
        {
          a: { x: 0, y: 0.5, z: 0 },
          b: { x: 0, y: 1.5, z: 0 },
          radius: 0.35,
        },
      ],
      id: targetId,
    },
  ],
});

describe("combat simulation composition", () => {
  it("steps actions and same-tick damage through one headless reducer", () => {
    let state = createCombatSimulation(data, [
      {
        actorClass: "kalev",
        facingRadians: 0,
        id: "kalev",
        position: { x: 0, y: 0, z: 0 },
        pulse: 100,
        steadyClass: "kalev",
      },
      {
        actorClass: "wolf",
        facingRadians: Math.PI,
        id: "dummy",
        position: { x: 0, y: 0, z: 2 },
        pulse: 50,
        steadyClass: "wolf",
      },
    ]);

    state = stepCombatSimulation(data, state, {
      commands: [
        {
          actorId: "kalev",
          edge: { action: "attack", pressed: true, sequence: 0, tick: 0 },
        },
      ],
      swings: [],
    }).state;
    for (let tick = 1; tick < 11; tick += 1) {
      state = stepCombatSimulation(data, state, { commands: [], swings: [] }).state;
    }

    const result = stepCombatSimulation(data, state, {
      commands: [],
      swings: [collisionSweep("kalev", "dummy")],
    });

    expect(result.state.damageActors.dummy?.pulse).toBe(22);
    expect(result.state.combat.actors.kalev?.hitstopRemaining).toBe(3);
    expect(result.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "damage", targetId: "dummy" }),
        expect.objectContaining({ kind: "stagger", targetId: "dummy" }),
      ]),
    );
    expect(result.stateHash).toMatch(/^[0-9a-f]{8}$/u);
  });

  it("forces guard down and rejects actions for the full actor-clock guard-break stagger", () => {
    let state = createCombatSimulation(data, [
      {
        actorClass: "kalev",
        facingRadians: 0,
        id: "attacker",
        position: { x: 0, y: 0, z: 0 },
        pulse: 100,
        steadyClass: "kalev",
      },
      {
        actorClass: "kalev",
        facingRadians: Math.PI,
        id: "guard",
        position: { x: 0, y: 0, z: 2 },
        pulse: 100,
        steadyClass: "kalev",
      },
    ]);
    const attacker = state.combat.actors.attacker;
    const guard = state.combat.actors.guard;
    const guardDamage = state.damageActors.guard;
    if (attacker === undefined || guard === undefined || guardDamage === undefined) {
      throw new Error("Guard-break fixture is missing an actor.");
    }
    state = {
      ...state,
      combat: {
        ...state.combat,
        actors: {
          ...state.combat.actors,
          attacker: {
            ...attacker,
            action: {
              chargeHoldTicks: 0,
              charging: false,
              id: "heavy",
              instanceId: 0,
              tick: 24,
            },
          },
          guard: {
            ...guard,
            breath: { ...guard.breath, value: 10 },
            guarding: true,
          },
        },
        nextActionInstance: 1,
      },
      damageActors: {
        ...state.damageActors,
        guard: { ...guardDamage, breath: 10, guarding: true },
      },
    };
    state = stepCombatSimulation(data, state, {
      commands: [],
      swings: [collisionSweep("attacker", "guard")],
    }).state;

    expect(state.combat.actors.guard?.guarding).toBe(false);
    expect(state.damageActors.guard).toMatchObject({
      guarding: false,
      staggerUntilClock: 61,
    });
    let sequence = 1;
    while ((state.damageActors.guard?.combatClock ?? 0) < 61) {
      state = stepCombatSimulation(data, state, {
        commands: [
          {
            actorId: "guard",
            edge: { action: "flask", pressed: true, sequence, tick: sequence },
          },
        ],
        guarding: [{ actorId: "guard", value: true }],
        swings: [],
      }).state;
      expect(state.combat.actors.guard?.action).toBeNull();
      expect(state.combat.actors.guard?.guarding).toBe(false);
      sequence += 1;
    }
    state = stepCombatSimulation(data, state, {
      commands: [
        {
          actorId: "guard",
          edge: { action: "flask", pressed: true, sequence, tick: sequence },
        },
      ],
      swings: [],
    }).state;
    expect(state.combat.actors.guard?.action?.id).toBe("flask_drink");
  });

  it("derives hits only from active action sweeps and resolves i-frames at tick start", () => {
    const initial = createCombatSimulation(data, [
      {
        actorClass: "kalev",
        facingRadians: 0,
        id: "attacker",
        position: { x: 0, y: 0, z: 0 },
        pulse: 100,
        steadyClass: "kalev",
      },
      {
        actorClass: "kalev",
        facingRadians: Math.PI,
        id: "target",
        position: { x: 0, y: 0, z: 2 },
        pulse: 100,
        steadyClass: "kalev",
      },
    ]);
    const idle = stepCombatSimulation(data, initial, {
      commands: [],
      swings: [collisionSweep("attacker", "target")],
    });
    expect(idle.state.damageActors.target?.pulse).toBe(100);
    expect(idle.events).toEqual([]);

    const attacker = initial.combat.actors.attacker;
    const target = initial.combat.actors.target;
    if (attacker === undefined || target === undefined) {
      throw new Error("I-frame fixture is missing an actor.");
    }
    const atRollTick = (tick: number) => ({
      ...initial,
      combat: {
        ...initial.combat,
        actors: {
          ...initial.combat.actors,
          attacker: {
            ...attacker,
            action: {
              chargeHoldTicks: 0,
              charging: false,
              id: "light1",
              instanceId: 0,
              tick: 11,
            },
          },
          target: {
            ...target,
            action: {
              chargeHoldTicks: 0,
              charging: false,
              id: "roll_medium",
              instanceId: 1,
              tick,
            },
          },
        },
        nextActionInstance: 2,
      },
    });
    const beforeIframes = stepCombatSimulation(data, atRollTick(1), {
      commands: [],
      swings: [collisionSweep("attacker", "target")],
    });
    expect(beforeIframes.state.damageActors.target?.pulse).toBe(72);

    const finalIframeTick = stepCombatSimulation(data, atRollTick(14), {
      commands: [],
      swings: [collisionSweep("attacker", "target")],
    });
    expect(finalIframeTick.state.damageActors.target?.pulse).toBe(100);
    expect(finalIframeTick.state.rehitLedger).toEqual([]);
    const firstVulnerableTick = stepCombatSimulation(
      data,
      finalIframeTick.state,
      {
        commands: [],
        swings: [collisionSweep("attacker", "target")],
      },
    );
    expect(firstVulnerableTick.state.damageActors.target?.pulse).toBe(72);

    const atChargedTick = (tick: number) => ({
      ...initial,
      combat: {
        ...initial.combat,
        actors: {
          ...initial.combat.actors,
          attacker: {
            ...attacker,
            action: {
              chargeHoldTicks: 45,
              charging: false,
              id: "charged",
              instanceId: 0,
              tick,
            },
          },
        },
        nextActionInstance: 1,
      },
    });
    const heldCharge = stepCombatSimulation(data, atChargedTick(24), {
      commands: [],
      swings: [collisionSweep("attacker", "target")],
    });
    expect(heldCharge.state.damageActors.target?.pulse).toBe(100);
    const releasedCharge = stepCombatSimulation(data, atChargedTick(69), {
      commands: [],
      swings: [collisionSweep("attacker", "target")],
    });
    expect(releasedCharge.state.damageActors.target?.pulse).toBe(22);
  });

  it("interrupts a non-hyperarmored action with the authored reaction clip", () => {
    const initial = createCombatSimulation(data, [
      {
        actorClass: "kalev",
        facingRadians: 0,
        id: "attacker",
        position: { x: 0, y: 0, z: 0 },
        pulse: 100,
        steadyClass: "kalev",
      },
      {
        actorClass: "wolf",
        facingRadians: Math.PI,
        id: "target",
        position: { x: 0, y: 0, z: 2 },
        pulse: 100,
        steadyClass: "wolf",
      },
    ]);
    const attacker = initial.combat.actors.attacker;
    const target = initial.combat.actors.target;
    if (attacker === undefined || target === undefined) {
      throw new Error("Reaction fixture is missing an actor.");
    }
    const state = {
      ...initial,
      combat: {
        ...initial.combat,
        actors: {
          ...initial.combat.actors,
          attacker: {
            ...attacker,
            action: {
              chargeHoldTicks: 0,
              charging: false,
              id: "light1",
              instanceId: 0,
              tick: 11,
            },
          },
          target: {
            ...target,
            action: {
              chargeHoldTicks: 0,
              charging: false,
              id: "lunge",
              instanceId: 1,
              tick: 10,
            },
          },
        },
        nextActionInstance: 2,
      },
    };
    const result = stepCombatSimulation(data, state, {
      commands: [],
      swings: [collisionSweep("attacker", "target")],
    });

    expect(result.state.combat.actors.target?.action).toMatchObject({
      id: "flinch",
      tick: 0,
    });
    expect(result.events).toContainEqual(
      expect.objectContaining({ kind: "stagger", severity: "flinch" }),
    );

    const armored = {
      ...state,
      combat: {
        ...state.combat,
        actors: {
          ...state.combat.actors,
          target: {
            ...target,
            action: {
              chargeHoldTicks: 0,
              charging: false,
              id: "heavy",
              instanceId: 1,
              tick: 18,
            },
          },
        },
      },
    };
    const armoredResult = stepCombatSimulation(data, armored, {
      commands: [],
      swings: [collisionSweep("attacker", "target")],
    });
    expect(
      armoredResult.events.some((event) => event.kind === "stagger"),
    ).toBe(false);
    expect(armoredResult.state.combat.actors.target?.action?.id).toBe("heavy");
  });
});
