import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { parseWolfAiParams } from "./params";
import { canHear, canSee, nextAlert, samplePerception } from "./perception";
import type { LosQuery, SoundEvent, WolfActorState } from "./types";

const params = parseWolfAiParams(
  JSON.parse(
    readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../data/wolf_ai_params.json"), "utf8"),
  ) as unknown,
);

const wolfAt = (x: number, z: number, yaw = 0): WolfActorState => ({
  id: "wolf-a",
  role: "lunger",
  x,
  y: 0,
  z,
  yaw,
  pulse: 100,
  maxPulse: 100,
  alert: "unaware",
  alertTimer: 0,
  confirmTimer: 0,
  lastKnownX: x,
  lastKnownY: 0,
  lastKnownZ: z,
  hasToken: false,
  lastAttackTick: null,
  action: null,
  mode: "idle",
  fleeReturnTick: null,
  path: [],
  pathIndex: 0,
  assignedSlot: null,
  crowdFailure: "none",
  circleSign: 1,
  feintReadyTick: 90,
  alive: true,
});

const clearLos: LosQuery = { raycast: () => null };
const wallLos: LosQuery = { raycast: () => ({ distance: 1 }) };

describe("perception", () => {
  it("sees a target inside the cone and range with clear LOS", () => {
    expect(canSee(wolfAt(0, 0, 0), { x: 0, y: 0, z: 8 }, clearLos, params)).toBe(true);
  });

  it("does not see a target outside the sight cone", () => {
    expect(canSee(wolfAt(0, 0, 0), { x: 8, y: 0, z: 0 }, clearLos, params)).toBe(false);
  });

  it("does not see a target beyond sight range", () => {
    expect(canSee(wolfAt(0, 0, 0), { x: 0, y: 0, z: 30 }, clearLos, params)).toBe(false);
  });

  it("blocks sight when the injected raycast hits before the target", () => {
    expect(canSee(wolfAt(0, 0, 0), { x: 0, y: 0, z: 8 }, wallLos, params)).toBe(false);
  });

  it("hears footsteps, attacks, and howls at their authored radii", () => {
    const wolf = { x: 0, y: 0, z: 0 };
    const at = (kind: SoundEvent["kind"], z: number): SoundEvent => ({
      kind,
      position: { x: 0, y: 0, z },
      tick: 0,
    });
    expect(canHear(wolf, at("footstep", 7.9), params)).toBe(true);
    expect(canHear(wolf, at("footstep", 8.1), params)).toBe(false);
    expect(canHear(wolf, at("attack", 13.9), params)).toBe(true);
    expect(canHear(wolf, at("attack", 14.1), params)).toBe(false);
    expect(canHear(wolf, at("howl", 31.9), params)).toBe(true);
    expect(canHear(wolf, at("howl", 32.1), params)).toBe(false);
  });

  it("promotes unaware → suspicious on sound and expires back to unaware", () => {
    const heard = nextAlert("unaware", 0, 0, false, true, params);
    expect(heard.alert).toBe("suspicious");
    expect(heard.alertTimer).toBe(params.perception.suspiciousTicks);

    let alert = heard;
    for (let step = 0; step < params.perception.suspiciousTicks; step += 1) {
      alert = nextAlert(alert.alert, alert.alertTimer, alert.confirmTimer, false, false, params);
    }
    expect(alert.alert).toBe("unaware");
  });

  it("promotes to alert on sight and decays to suspicious after the hold timer", () => {
    const seen = nextAlert("unaware", 0, 0, true, false, params);
    expect(seen.alert).toBe("alert");
    expect(seen.alertTimer).toBe(params.perception.alertHoldTicks);

    let alert = seen;
    for (let step = 0; step < params.perception.alertHoldTicks; step += 1) {
      alert = nextAlert(alert.alert, alert.alertTimer, alert.confirmTimer, false, false, params);
    }
    expect(alert.alert).toBe("suspicious");
  });

  it("promotes suspicious → alert after enough sustained hearing", () => {
    let alert = nextAlert("unaware", 0, 0, false, true, params);
    for (let step = 0; step < params.perception.suspiciousToAlertTicks; step += 1) {
      alert = nextAlert(alert.alert, alert.alertTimer, alert.confirmTimer, false, true, params);
    }
    expect(alert.alert).toBe("alert");
  });

  it("is deterministic for the same stimulus sequence", () => {
    const wolf = wolfAt(0, 0);
    const sounds: SoundEvent[] = [
      { kind: "footstep", position: { x: 0, y: 0, z: 2 }, tick: 1 },
    ];
    const first = samplePerception(wolf, { x: 40, y: 0, z: 40 }, sounds, clearLos, params);
    const second = samplePerception(wolf, { x: 40, y: 0, z: 40 }, sounds, clearLos, params);
    expect(second).toEqual(first);
  });
});
