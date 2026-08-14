import { describe, expect, it } from "vitest";

import { createCombatState, isActorInvulnerable, stepCombat } from "./engine";
import type { CombatRules } from "./engine";

const rules: CombatRules = {
  bufferWindows: { attack: 10, flask: 12, roll: 12 },
  breath: {
    guardingMultiplier: 0.4,
    max: 100,
    regenDelayTicks: 33,
    regenPerSecond: 45,
    tickRate: 60,
  },
  moves: {
    charged: {
      action: { active: 1, recovery: 6, startup: 2 },
      breathCost: 10,
      chargeHoldMaxTicks: 12,
    },
    flask: {
      action: { active: 10, recovery: 30, startup: 20 },
      breathCost: 0,
      committed: true,
    },
    light1: {
      action: { active: 4, recovery: 20, startup: 11 },
      breathCost: 14,
      trackingUntilTick: 8,
      turnRateRadiansPerTick: Math.PI / 12,
    },
    compound: {
      action: { active: 8, recovery: 12, startup: 20 },
      breathCost: 0,
      trackingUntilTick: 14,
      trackingWindows: [
        { endTickExclusive: 4, startTick: 0 },
        { endTickExclusive: 15, startTick: 10 },
      ],
      turnRateRadiansPerTick: Math.PI / 12,
    },
    roll_medium: {
      action: { active: 13, recovery: 28, startup: 2 },
      breathCost: 22,
      cancelRules: [{ fromTick: 22, into: "attack" }],
      iframeWindow: { endTickExclusive: 15, startTick: 2 },
    },
  },
  recoveryCancelTailTicks: 6,
};

const roster = [
  {
    actorClass: "kalev",
    facingRadians: 0,
    id: "kalev",
    position: { x: 0, y: 0, z: 0 },
  },
  {
    actorClass: "wolf",
    facingRadians: Math.PI,
    id: "wolf",
    position: { x: 10, y: 0, z: 0 },
  },
] as const;

describe("combat reducer", () => {
  it("starts a paid action on its input tick and advances an integer action clock", () => {
    const initial = createCombatState(rules, roster);
    const first = stepCombat(rules, initial, [
      {
        actorId: "kalev",
        edge: { action: "attack", pressed: true, sequence: 0, tick: 0 },
        moveId: "light1",
      },
    ]);

    expect(first.state.worldTick).toBe(1);
    expect(first.state.actors.kalev?.breath.value).toBe(86);
    expect(first.state.actors.kalev?.action).toMatchObject({ id: "light1", tick: 1 });
    expect(first.events[0]).toMatchObject({
      actionId: "light1",
      actorId: "kalev",
      kind: "action_started",
      tick: 0,
    });
  });

  it("consumes a buffered roll-cancel attack on the first actionable tick", () => {
    let state = createCombatState(rules, roster);
    state = stepCombat(rules, state, [
      {
        actorId: "kalev",
        edge: { action: "roll", pressed: true, sequence: 0, tick: 0 },
        moveId: "roll_medium",
      },
    ]).state;

    for (let tick = 1; tick <= 17; tick += 1) {
      state = stepCombat(rules, state, []).state;
    }
    state = stepCombat(rules, state, [
      {
        actorId: "kalev",
        edge: { action: "attack", pressed: true, sequence: 1, tick: 18 },
        moveId: "light1",
      },
    ]).state;

    while (state.actors.kalev?.action?.id === "roll_medium") {
      const priorTick = state.worldTick;
      const result = stepCombat(rules, state, []);
      state = result.state;
      if (state.actors.kalev?.action?.id === "light1") {
        expect(priorTick).toBe(22);
        break;
      }
    }

    expect(state.actors.kalev?.action?.id).toBe("light1");
  });

  it("captures input during hitstop without aging it or advancing the actor", () => {
    let state = createCombatState(rules, roster);
    const kalev = state.actors.kalev;
    if (kalev === undefined) throw new Error("Test roster is missing Kalev.");
    state = {
      ...state,
      actors: {
        ...state.actors,
        kalev: { ...kalev, hitstopRemaining: 3 },
      },
    };

    state = stepCombat(rules, state, [
      {
        actorId: "kalev",
        edge: { action: "attack", pressed: true, sequence: 0, tick: 0 },
        moveId: "light1",
      },
    ]).state;
    expect(state.actors.kalev?.action).toBeNull();
    expect(state.actors.kalev?.buffer.inputClock).toBe(0);

    state = stepCombat(rules, state, []).state;
    state = stepCombat(rules, state, []).state;
    expect(state.actors.kalev?.action).toBeNull();
    expect(state.actors.kalev?.buffer.inputClock).toBe(0);

    state = stepCombat(rules, state, []).state;
    expect(state.actors.kalev?.action?.id).toBe("light1");
  });

  it("tracks only through the authored commit tick and exposes i-frames from sim state", () => {
    let state = createCombatState(rules, roster);
    state = stepCombat(rules, state, [
      {
        actorId: "kalev",
        edge: { action: "attack", pressed: true, sequence: 0, tick: 0 },
        moveId: "light1",
        targetPosition: { x: 10, z: 0 },
      },
    ]).state;
    expect(state.actors.kalev?.facingRadians).toBeCloseTo(Math.PI / 12);

    for (let tick = 1; tick <= 8; tick += 1) {
      state = stepCombat(rules, state, [
        { actorId: "kalev", targetPosition: { x: -10, z: 0 } },
      ]).state;
    }
    const committedFacing = state.actors.kalev?.facingRadians;
    state = stepCombat(rules, state, [
      { actorId: "kalev", targetPosition: { x: 10, z: 0 } },
    ]).state;
    expect(state.actors.kalev?.facingRadians).toBe(committedFacing);

    let roll = createCombatState(rules, roster);
    roll = stepCombat(rules, roll, [
      {
        actorId: "kalev",
        edge: { action: "roll", pressed: true, sequence: 0, tick: 0 },
        moveId: "roll_medium",
      },
    ]).state;
    expect(isActorInvulnerable(rules, roll, "kalev")).toBe(false);
    roll = stepCombat(rules, roll, []).state;
    expect(isActorInvulnerable(rules, roll, "kalev")).toBe(true);
  });

  it("does not track through gaps between compound authored windows", () => {
    let state = createCombatState(rules, roster);
    state = stepCombat(rules, state, [
      {
        actorId: "kalev",
        edge: { action: "attack", pressed: true, sequence: 0, tick: 0 },
        moveId: "compound",
        targetPosition: { x: 10, z: 0 },
      },
    ]).state;
    for (let tick = 1; tick < 4; tick += 1) {
      state = stepCombat(rules, state, [
        { actorId: "kalev", targetPosition: { x: 10, z: 0 } },
      ]).state;
    }
    const afterFirstWindow = state.actors.kalev?.facingRadians;
    for (let tick = 4; tick < 9; tick += 1) {
      state = stepCombat(rules, state, [
        { actorId: "kalev", targetPosition: { x: -10, z: 0 } },
      ]).state;
    }
    expect(state.actors.kalev?.facingRadians).toBe(afterFirstWindow);
  });

  it("holds a committed item action for its full table duration", () => {
    let state = createCombatState(rules, roster);
    state = stepCombat(rules, state, [
      {
        actorId: "kalev",
        edge: { action: "flask", pressed: true, sequence: 0, tick: 0 },
        moveId: "flask",
      },
    ]).state;
    for (let tick = 1; tick < 55; tick += 1) {
      state = stepCombat(rules, state, []).state;
    }
    state = stepCombat(rules, state, [
      {
        actorId: "kalev",
        edge: { action: "attack", pressed: true, sequence: 1, tick: 55 },
        moveId: "light1",
      },
    ]).state;
    expect(state.actors.kalev?.action?.id).toBe("flask");
    while (state.actors.kalev?.action?.id === "flask") {
      state = stepCombat(rules, state, []).state;
    }
    expect(state.actors.kalev?.action?.id).toBe("light1");
    expect(state.worldTick).toBe(61);
  });

  it("extends a chargeable action causally from press until release", () => {
    let state = createCombatState(rules, roster);
    state = stepCombat(rules, state, [
      {
        actorId: "kalev",
        edge: { action: "attack", pressed: true, sequence: 0, tick: 0 },
        moveId: "charged",
      },
    ]).state;
    expect(state.actors.kalev?.action).toMatchObject({
      chargeHoldTicks: 1,
      charging: true,
      id: "charged",
      tick: 1,
    });
    for (let tick = 1; tick < 10; tick += 1) {
      state = stepCombat(rules, state, []).state;
    }
    state = stepCombat(rules, state, [
      {
        actorId: "kalev",
        edge: { action: "attack", pressed: false, sequence: 1, tick: 10 },
      },
    ]).state;
    expect(state.actors.kalev?.action).toMatchObject({
      chargeHoldTicks: 10,
      charging: false,
      tick: 11,
    });
    while (state.actors.kalev?.action !== null) {
      state = stepCombat(rules, state, []).state;
    }
    expect(state.worldTick).toBe(20);
  });
});
