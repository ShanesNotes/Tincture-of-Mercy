import { describe, expect, it } from "vitest";

import {
  cameraBasis,
  createCameraState,
  holdFrame,
  presentCamera,
  releaseFrame,
  stepCamera,
} from "./state";
import type { CameraState, CameraStepInput, StagedFrameSpec } from "./state";
import { CAMERA_PARAMS } from "./params";
import { degreesToRadians, radiansToDegrees, type Vec3 } from "./math";

const params = CAMERA_PARAMS;
const required = params.attend.framingMarginFraction;
const feet: Vec3 = { x: 0, y: 0, z: 0 };
const clearProbe = (): number => 1;
const alwaysVisible = (): boolean => true;

const baseInput = (overrides: Partial<CameraStepInput> = {}): CameraStepInput => ({
  playerPosition: feet,
  playerMoveYaw: null,
  attendTargetPosition: null,
  orbit: { x: 0, y: 0 },
  aspect: 16 / 9,
  damageContext: false,
  probe: clearProbe,
  lineOfSight: alwaysVisible,
  ...overrides,
});

const run = (
  state: CameraState,
  ticks: number,
  overrides: Partial<CameraStepInput> | ((tick: number) => Partial<CameraStepInput>) = {},
): CameraState => {
  let current = state;
  for (let tick = 0; tick < ticks; tick += 1) {
    const step = typeof overrides === "function" ? overrides(tick) : overrides;
    current = stepCamera(current, params, baseInput(step));
  }
  return current;
};

const fresh = (): CameraState => createCameraState(params, feet);

describe("createCameraState", () => {
  it("starts behind and above the player at rest distance", () => {
    const state = fresh();
    expect(state.mode).toBe("free-follow");
    expect(state.distanceMeters).toBe(params.follow.restDistanceMeters);
    expect(radiansToDegrees(state.pitchRadians)).toBeCloseTo(params.follow.restPitchDegrees, 9);
    expect(state.position.z).toBeGreaterThan(state.pivot.z);
    expect(state.position.y).toBeGreaterThan(state.pivot.y);
    expect(state.fovDegrees).toBe(params.fov.defaultDegrees);
  });
});

describe("player orbit", () => {
  it("turns the camera by the orbit rate and marks the mode", () => {
    const state = stepCamera(fresh(), params, baseInput({ orbit: { x: 1, y: 0 } }));
    expect(state.mode).toBe("player-orbit");
    expect(state.idleTicks).toBe(0);
    expect(radiansToDegrees(state.yawRadians)).toBeCloseTo(-params.orbit.yawDegreesPerTick, 9);
  });

  it("clamps pitch to the orbit limits in both directions", () => {
    const down = run(fresh(), 120, { orbit: { x: 0, y: -1 } });
    const up = run(fresh(), 120, { orbit: { x: 0, y: 1 } });
    expect(radiansToDegrees(down.pitchRadians)).toBeCloseTo(params.orbit.pitchMinDegrees, 9);
    expect(radiansToDegrees(up.pitchRadians)).toBeCloseTo(params.orbit.pitchMaxDegrees, 9);
  });

  it("never rolls, however long it is orbited", () => {
    const state = run(fresh(), 400, (tick) => ({
      orbit: { x: Math.sin(tick * 0.1), y: Math.cos(tick * 0.07) },
    }));
    expect(cameraBasis(state).right.y).toBe(0);
  });
});

describe("free follow", () => {
  it("holds the player's chosen yaw until the auto-align delay elapses (F1: move stick is not the camera stick)", () => {
    const turned = stepCamera(fresh(), params, baseInput({ orbit: { x: 1, y: 0 } }));
    const held = run(turned, params.follow.autoAlignDelayTicks - 1, {
      playerMoveYaw: degreesToRadians(90),
    });
    expect(held.mode).toBe("player-orbit");
    expect(held.yawRadians).toBe(turned.yawRadians);
  });

  it("springs back behind the player once the delay elapses", () => {
    const turned = stepCamera(fresh(), params, baseInput({ orbit: { x: 1, y: 0 } }));
    const aligned = run(turned, params.follow.autoAlignDelayTicks + 200, {
      playerMoveYaw: degreesToRadians(90),
    });
    expect(aligned.mode).toBe("free-follow");
    expect(radiansToDegrees(aligned.yawRadians)).toBeCloseTo(90, 4);
    expect(aligned.distanceMeters).toBeCloseTo(params.follow.restDistanceMeters, 6);
  });

  it("stands still when the player stands still", () => {
    const idle = run(fresh(), 200);
    expect(idle.yawRadians).toBe(0);
  });
});

describe("collision", () => {
  it("pulls in to the probe fraction, minus skin, and flags it", () => {
    const halfway = stepCamera(fresh(), params, baseInput({ probe: () => 0.5 }));
    expect(halfway.collisionPulledIn).toBe(true);
    expect(halfway.distanceMeters).toBeCloseTo(
      params.follow.restDistanceMeters * 0.5 - params.collision.skinMeters,
      9,
    );
  });

  it("never goes below the minimum follow distance", () => {
    const flush = run(fresh(), 20, { probe: () => 0 });
    expect(flush.distanceMeters).toBe(params.follow.minDistanceMeters);
  });

  it("keeps the camera short of the contact point so it cannot clip geometry", () => {
    const fraction = 0.35;
    const contact = params.follow.restDistanceMeters * fraction;
    const state = stepCamera(fresh(), params, baseInput({ probe: () => fraction }));
    expect(state.distanceMeters).toBeLessThan(contact);
  });

  it("reports a clear probe as no pull-in", () => {
    expect(stepCamera(fresh(), params, baseInput()).collisionPulledIn).toBe(false);
  });
});

describe("attend framing (GATES F9)", () => {
  const target: Vec3 = { x: 0, y: 0.7, z: -6 };

  it("keeps both silhouettes inside the 12% margin on a standing target", () => {
    let state = fresh();
    for (let tick = 0; tick < 180; tick += 1) {
      state = stepCamera(state, params, baseInput({ attendTargetPosition: target }));
      expect(state.mode).toBe("attend");
      expect(state.framingMargin).toBeGreaterThanOrEqual(required);
      expect(state.framingSatisfied).toBe(true);
    }
  });

  it("holds the margin from the first tick of a 90 degree acquisition swing", () => {
    const side: Vec3 = { x: 6, y: 0.7, z: 0 };
    let state = fresh();
    for (let tick = 0; tick < 120; tick += 1) {
      state = stepCamera(state, params, baseInput({ attendTargetPosition: side }));
      expect(state.framingMargin).toBeGreaterThanOrEqual(required);
    }
    expect(radiansToDegrees(state.yawRadians)).toBeCloseTo(-90, 3);
  });

  it("holds the margin through a full strafe around the target", () => {
    const centre: Vec3 = { x: 0, y: 0.7, z: 0 };
    const radius = 4;
    const radiansPerTick = 6 / 60 / radius;
    let state = fresh();
    let worst = Number.POSITIVE_INFINITY;
    for (let tick = 0; tick < 400; tick += 1) {
      const angle = tick * radiansPerTick;
      state = stepCamera(
        state,
        params,
        baseInput({
          attendTargetPosition: centre,
          playerPosition: { x: Math.sin(angle) * radius, y: 0, z: Math.cos(angle) * radius },
        }),
      );
      worst = Math.min(worst, state.framingMargin);
    }
    expect(worst).toBeGreaterThanOrEqual(required);
  });

  it("widens the FOV only inside the D2 band", () => {
    const state = run(fresh(), 60, { attendTargetPosition: { x: 9, y: 2.5, z: -9 } });
    expect(state.fovDegrees).toBeGreaterThanOrEqual(params.fov.defaultDegrees);
    expect(state.fovDegrees).toBeLessThanOrEqual(params.fov.maxDegrees);
  });

  it("gives ground to level geometry even when framing wants more distance", () => {
    const state = run(fresh(), 30, { attendTargetPosition: target, probe: () => 0.5 });
    expect(state.collisionPulledIn).toBe(true);
    expect(state.distanceMeters).toBeGreaterThanOrEqual(params.attend.minDistanceMeters);
  });
});

describe("attend occlusion recovery (GATES F9)", () => {
  const target: Vec3 = { x: 0, y: 0.7, z: -6 };
  // A pillar that hides the target from any lens further than 3m off the pivot.
  const pillar = (from: Vec3): boolean => Math.hypot(from.x, from.z) < 3;

  it("never lets the target stay occluded for more than 8 consecutive ticks", () => {
    let state = fresh();
    let worst = 0;
    for (let tick = 0; tick < 240; tick += 1) {
      state = stepCamera(
        state,
        params,
        baseInput({ attendTargetPosition: target, lineOfSight: pillar }),
      );
      worst = Math.max(worst, state.occludedTicks);
    }
    expect(worst).toBeLessThanOrEqual(params.attend.occlusionSnapTicks);
  });

  it("recovers sight by closing to the minimum attend distance", () => {
    let state = fresh();
    let recoveredAt = -1;
    for (let tick = 0; tick < 20 && recoveredAt < 0; tick += 1) {
      state = stepCamera(
        state,
        params,
        baseInput({ attendTargetPosition: target, lineOfSight: pillar }),
      );
      if (state.occludedTicks === 0 && tick > 0) {
        recoveredAt = tick;
      }
    }
    expect(recoveredAt).toBeGreaterThan(0);
    expect(state.distanceMeters).toBe(params.attend.minDistanceMeters);
  });

  it("does not back off while the target is hidden", () => {
    let state = fresh();
    let previous = state.distanceMeters;
    for (let tick = 0; tick < 7; tick += 1) {
      state = stepCamera(
        state,
        params,
        baseInput({ attendTargetPosition: target, lineOfSight: pillar }),
      );
      expect(state.distanceMeters).toBeLessThanOrEqual(previous + 1e-9);
      previous = state.distanceMeters;
    }
  });

  it("keeps the counter at zero while the target is visible", () => {
    const state = run(fresh(), 60, { attendTargetPosition: target });
    expect(state.occludedTicks).toBe(0);
  });
});

describe("staged frames (D2)", () => {
  const spec: StagedFrameSpec = {
    beat: "anna-gravity",
    pivot: { x: 0, y: 1.2, z: 0 },
    yawRadians: degreesToRadians(15),
    pitchRadians: degreesToRadians(-4),
    distanceMeters: 3.1,
    fovDegrees: 40,
  };

  it("refuses to stage a frame in a damage context", () => {
    expect(() => holdFrame(fresh(), spec, { damageContext: true })).toThrow(/D2/);
  });

  it("takes the frame exactly as specified in a no-damage beat", () => {
    const staged = holdFrame(fresh(), spec, { damageContext: false });
    expect(staged.mode).toBe("staged");
    expect(staged.staged).toEqual(spec);
    expect(staged.fovDegrees).toBe(spec.fovDegrees);
    expect(staged.distanceMeters).toBe(spec.distanceMeters);
  });

  it("holds the frame while the beat lasts", () => {
    const staged = holdFrame(fresh(), spec, { damageContext: false });
    const held = run(staged, 60, { orbit: { x: 1, y: 1 }, playerPosition: { x: 4, y: 0, z: 4 } });
    expect(held).toEqual(staged);
  });

  it("releases the instant the verbs become combat verbs", () => {
    const staged = holdFrame(fresh(), spec, { damageContext: false });
    const released = stepCamera(staged, params, baseInput({ damageContext: true }));
    expect(released.mode).not.toBe("staged");
    expect(released.staged).toBeNull();
  });

  it("releases by hand as well", () => {
    const staged = holdFrame(fresh(), spec, { damageContext: false });
    expect(releaseFrame(staged).staged).toBeNull();
    expect(releaseFrame(fresh())).toEqual(fresh());
  });
});

describe("presentCamera", () => {
  const previous = fresh();
  const current = run(fresh(), 30, { orbit: { x: 1, y: -0.5 } });

  it("returns the tick ends at alpha 0 and 1", () => {
    expect(presentCamera(previous, current, 0).position).toEqual(previous.position);
    expect(presentCamera(previous, current, 1).position).toEqual(current.position);
    expect(presentCamera(previous, current, 1).yawRadians).toBeCloseTo(current.yawRadians, 12);
  });

  it("blends the middle of the tick", () => {
    const middle = presentCamera(previous, current, 0.5);
    expect(middle.position.x).toBeCloseTo((previous.position.x + current.position.x) / 2, 12);
    expect(middle.fovDegrees).toBeCloseTo((previous.fovDegrees + current.fovDegrees) / 2, 12);
  });

  it("clamps a stray alpha and takes the short way round the yaw seam", () => {
    expect(presentCamera(previous, current, 4).yawRadians).toBeCloseTo(current.yawRadians, 12);
    const west = { ...previous, yawRadians: degreesToRadians(179) };
    const east = { ...current, yawRadians: degreesToRadians(-179) };
    expect(Math.abs(radiansToDegrees(presentCamera(west, east, 0.5).yawRadians))).toBeCloseTo(
      180,
      6,
    );
  });
});

describe("determinism", () => {
  it("replays identically from identical inputs", () => {
    const script = (tick: number): Partial<CameraStepInput> => ({
      orbit: { x: Math.sin(tick * 0.3), y: Math.cos(tick * 0.11) },
      playerPosition: { x: tick * 0.02, y: 0, z: -tick * 0.01 },
      attendTargetPosition: tick > 40 ? { x: 3, y: 0.7, z: -5 } : null,
    });
    expect(run(fresh(), 120, script)).toEqual(run(fresh(), 120, script));
  });

  it("never mutates the state handed to it", () => {
    const before = fresh();
    const snapshot = structuredClone(before);
    stepCamera(before, params, baseInput({ attendTargetPosition: { x: 1, y: 0.7, z: -4 } }));
    expect(before).toEqual(snapshot);
  });
});
