/**
 * The deterministic character controller: locomotion state machine, jump,
 * fall damage, root-displacement hosting, and the collision correction that
 * every one of them is subject to.
 *
 * `stepMotion` is a pure function of (state, input, queries, params). Given the
 * same four it always produces the same fifth — no clocks, no randomness, no
 * hidden state. Later slices compose `MotionState` into the wider sim state;
 * this module never reaches outward.
 */

import { fallDamageFraction, sampleCurve, type MotionParams } from "./params";
import { capsuleAtFoot, moveAndSlide, resolveGround, MOVE_EPSILON } from "./resolve";
import type {
  Capsule,
  CollisionQueries,
  DisplacementHost,
  LocomotionState,
  MotionEvent,
  MotionInput,
  MotionState,
  MotionStep,
  RootDisplacementClip,
  Vec3,
} from "./types";
import {
  UP,
  addScaled,
  angleDelta,
  clamp,
  horizontalLength,
  length,
  rotateYaw,
  scale,
  sub,
  wrapAngle,
} from "./vec";

export const MOTION_STATE_VERSION = 1 as const;

export const createMotionState = (
  position: Vec3,
  facing: number,
  breath: number,
): MotionState => ({
  version: MOTION_STATE_VERSION,
  tick: 0,
  position,
  velocity: { x: 0, y: 0, z: 0 },
  facing: wrapAngle(facing),
  locomotion: "idle",
  grounded: false,
  groundNormal: UP,
  breath,
  lagTicks: 0,
  fallStartY: position.y,
  displacement: null,
  contactCount: 0,
});

/**
 * Places a fresh state on the surface under `position`, so level authors need
 * not know exact floor heights. `maxDrop` is how far down to look — a level
 * authoring distance, not a tuning constant — and the actor is left airborne
 * above `position` if nothing is found within it.
 */
export const spawnMotionState = (
  queries: CollisionQueries,
  params: MotionParams,
  position: Vec3,
  facing: number,
  breath: number,
  maxDrop: number,
): MotionState => {
  if (!Number.isFinite(maxDrop) || maxDrop < 0) {
    throw new RangeError("spawn maxDrop must be finite and non-negative");
  }
  const spawned = createMotionState(position, facing, breath);
  const hit = queries.sweepCapsule({
    capsule: capsuleAtFoot(position, params),
    displacement: { x: 0, y: -maxDrop, z: 0 },
  });
  const settled: Vec3 =
    hit === null
      ? position
      : {
          x: position.x,
          y: position.y - Math.max(0, hit.fraction * maxDrop - params.capsule.skin),
          z: position.z,
        };
  const ground = resolveGround(queries, params, settled, 0);
  return {
    ...spawned,
    position: ground.position,
    grounded: ground.grounded,
    groundNormal: ground.groundNormal,
    fallStartY: ground.position.y,
  };
};

const assertClip = (clip: RootDisplacementClip): void => {
  if (!Number.isSafeInteger(clip.ticks) || clip.ticks < 2) {
    throw new RangeError("displacement clip must declare at least two ticks");
  }
  if (clip.rootXZ.length !== clip.ticks) {
    throw new RangeError("displacement clip rootXZ length must equal ticks");
  }
  for (const sample of clip.rootXZ) {
    if (!Number.isFinite(sample[0]) || !Number.isFinite(sample[1])) {
      throw new RangeError("displacement clip rootXZ samples must be finite");
    }
  }
};

const assertInput = (input: MotionInput): void => {
  if (!Number.isFinite(input.moveX) || !Number.isFinite(input.moveZ)) {
    throw new RangeError("motion input move components must be finite");
  }
};

/** Analog magnitude to a ground speed: a walk band below the threshold, interpolating to run above it. */
const targetSpeedFor = (params: MotionParams, magnitude: number, sprinting: boolean): number => {
  const { walk, run, sprintMultiplier, walkInputThreshold } = params.speeds;
  if (magnitude <= 0) {
    return 0;
  }
  if (sprinting) {
    return run * sprintMultiplier;
  }
  if (magnitude <= walkInputThreshold) {
    return (walk * magnitude) / walkInputThreshold;
  }
  return walk + ((run - walk) * (magnitude - walkInputThreshold)) / (1 - walkInputThreshold);
};

const groundedLocomotion = (
  params: MotionParams,
  speed: number,
  sprinting: boolean,
): LocomotionState => {
  if (speed <= params.speeds.idleThreshold) {
    return "idle";
  }
  if (sprinting) {
    return "sprint";
  }
  return speed <= params.speeds.walk + MOVE_EPSILON ? "walk" : "run";
};

interface DisplacementAdvance {
  readonly host: DisplacementHost | null;
  readonly delta: Vec3;
}

/**
 * Advances the hosted root-displacement clip by one tick.
 *
 * `rootXZ` follows `game/tools/blender/SIDECAR_SCHEMA.md`: one cumulative
 * `[x, z]` sample per tick in clip-local space. The per-tick delta is rotated
 * into world space by the facing latched when the clip began. s11 decides when
 * a roll happens; this module only applies its displacement and lets collision
 * correct it.
 */
const advanceDisplacement = (
  host: DisplacementHost,
  tick: number,
  events: MotionEvent[],
): DisplacementAdvance => {
  const from = host.clip.rootXZ[host.tick];
  const to = host.clip.rootXZ[host.tick + 1];
  if (from === undefined || to === undefined) {
    events.push({ type: "displacementEnded", tick, clipId: host.clip.clipId });
    return { host: null, delta: { x: 0, y: 0, z: 0 } };
  }

  const rotated = rotateYaw(to[0] - from[0], to[1] - from[1], host.facing);
  const nextTick = host.tick + 1;
  const delta: Vec3 = { x: rotated.x, y: 0, z: rotated.z };
  if (nextTick >= host.clip.ticks - 1) {
    events.push({ type: "displacementEnded", tick, clipId: host.clip.clipId });
    return { host: null, delta };
  }
  return { host: { clip: host.clip, tick: nextTick, facing: host.facing }, delta };
};

export const stepMotion = (
  state: MotionState,
  input: MotionInput,
  queries: CollisionQueries,
  params: MotionParams,
): MotionStep => {
  assertInput(input);
  const events: MotionEvent[] = [];
  const tick = state.tick + 1;
  const seconds = 1 / params.tickHz;

  // --- root-displacement hosting -------------------------------------------
  let host = state.displacement;
  if (input.cancelDisplacement === true && host !== null) {
    events.push({ type: "displacementEnded", tick, clipId: host.clip.clipId });
    host = null;
  }
  if (input.beginDisplacement !== undefined) {
    assertClip(input.beginDisplacement);
    if (host !== null) {
      events.push({ type: "displacementEnded", tick, clipId: host.clip.clipId });
    }
    host = { clip: input.beginDisplacement, tick: 0, facing: state.facing };
    events.push({ type: "displacementStarted", tick, clipId: input.beginDisplacement.clipId });
  }

  let displacementDelta: Vec3 = { x: 0, y: 0, z: 0 };
  if (host !== null) {
    const advanced = advanceDisplacement(host, tick, events);
    host = advanced.host;
    displacementDelta = advanced.delta;
  }

  // --- intent ---------------------------------------------------------------
  const displaced = state.displacement !== null || input.beginDisplacement !== undefined;
  const committed = state.lagTicks > 0 || displaced;
  const magnitude = committed ? 0 : clamp(Math.hypot(input.moveX, input.moveZ), 0, 1);
  const hasInput = magnitude > 0;

  let breath = state.breath;
  const sprinting =
    input.sprint &&
    !committed &&
    state.grounded &&
    breath > 0 &&
    magnitude > params.speeds.walkInputThreshold;
  if (sprinting) {
    const drain = Math.min(breath, params.breath.sprintDrainPerSecond * seconds);
    breath -= drain;
    if (drain > 0) {
      events.push({ type: "breathSpent", tick, amount: drain, reason: "sprint" });
    }
  }

  // --- facing ---------------------------------------------------------------
  const currentSpeed = horizontalLength(state.velocity);
  const speedFraction = clamp(currentSpeed / params.speeds.run, 0, 1);
  const authority = state.grounded ? 1 : params.air.controlFactor;
  let facing = state.facing;
  if (hasInput) {
    // Yaw 0 faces −Z, so the desired yaw is the stick direction negated.
    const desiredFacing = Math.atan2(-input.moveX, -input.moveZ);
    const turnStep = sampleCurve(params.turnRateCurve, speedFraction) * authority * seconds;
    const delta = angleDelta(state.facing, desiredFacing);
    facing = wrapAngle(state.facing + clamp(delta, -turnStep, turnStep));
  }

  // --- horizontal velocity --------------------------------------------------
  const targetSpeed = targetSpeedFor(params, magnitude, sprinting);
  const desired: Vec3 = {
    x: -Math.sin(facing) * targetSpeed,
    y: 0,
    z: -Math.cos(facing) * targetSpeed,
  };
  const horizontal: Vec3 = { x: state.velocity.x, y: 0, z: state.velocity.z };
  const rate = hasInput
    ? sampleCurve(params.acceleration.groundCurve, speedFraction)
    : params.acceleration.groundDeceleration;
  const maxDelta = rate * authority * seconds;
  const difference = sub(desired, horizontal);
  const differenceLength = length(difference);
  const nextHorizontal =
    differenceLength <= maxDelta
      ? desired
      : addScaled(horizontal, scale(difference, 1 / differenceLength), maxDelta);

  // --- vertical velocity, jump ---------------------------------------------
  let verticalVelocity = state.grounded ? 0 : state.velocity.y;
  let jumped = false;
  if (
    input.jump &&
    state.grounded &&
    !committed &&
    breath >= params.jump.breathCost
  ) {
    verticalVelocity = params.jump.launchSpeed;
    breath -= params.jump.breathCost;
    jumped = true;
    events.push({ type: "jumped", tick, breathCost: params.jump.breathCost });
    events.push({ type: "breathSpent", tick, amount: params.jump.breathCost, reason: "jump" });
  }
  const verticalBefore = verticalVelocity;
  if (!state.grounded || jumped) {
    verticalVelocity = Math.max(
      verticalVelocity - params.gravity.metersPerSecondSquared * seconds,
      -params.gravity.terminalSpeedMetersPerSecond,
    );
  }

  // --- move -----------------------------------------------------------------
  const velocity: Vec3 = { x: nextHorizontal.x, y: verticalVelocity, z: nextHorizontal.z };
  // Vertical uses the trapezoid of the pre- and post-gravity velocity, which is
  // the exact integral of constant acceleration. Plain Euler would undershoot
  // the authored 1.2m apex by several centimetres.
  const displacement: Vec3 = {
    x: velocity.x * seconds + displacementDelta.x,
    y: ((verticalBefore + verticalVelocity) / 2) * seconds + displacementDelta.y,
    z: velocity.z * seconds + displacementDelta.z,
  };
  const move = moveAndSlide(
    queries,
    params,
    state.position,
    displacement,
    velocity,
    state.grounded && !jumped,
  );
  const ground = resolveGround(queries, params, move.position, move.velocity.y);

  // --- landing, fall damage -------------------------------------------------
  let lagTicks = state.lagTicks > 0 ? state.lagTicks - 1 : 0;
  let locomotion: LocomotionState | null = null;
  let fallStartY = state.fallStartY;

  if (ground.grounded) {
    if (!state.grounded) {
      const fallMeters = Math.max(0, fallStartY - ground.position.y);
      const pulseFraction = fallDamageFraction(params, fallMeters);
      const landingLag =
        pulseFraction > 0
          ? params.landing.fallDamageLagTicks
          : fallMeters >= params.landing.hardLandingMeters
            ? params.landing.hardLagTicks
            : params.landing.softLagTicks;
      events.push({ type: "landed", tick, fallMeters, lagTicks: landingLag });
      if (pulseFraction > 0) {
        events.push({ type: "fallDamage", tick, fallMeters, pulseFraction });
        locomotion = "fallDamage";
      } else {
        locomotion = "land";
      }
      lagTicks = landingLag;
    }
    fallStartY = ground.position.y;
  } else if (ground.touching) {
    // Sliding down a surface too steep to stand on is not a fall.
    fallStartY = ground.position.y;
  } else if (state.grounded) {
    fallStartY = state.position.y;
  } else if (ground.position.y > fallStartY) {
    fallStartY = ground.position.y;
  }

  if (locomotion === null) {
    if (host !== null) {
      locomotion = "displaced";
    } else if (!ground.grounded) {
      locomotion = jumped ? "jump" : "airborne";
    } else if (lagTicks > 0) {
      locomotion = state.locomotion === "fallDamage" ? "fallDamage" : "land";
    } else {
      locomotion = groundedLocomotion(params, horizontalLength(move.velocity), sprinting);
    }
  }

  const settledVelocity: Vec3 = ground.grounded
    ? { x: move.velocity.x, y: 0, z: move.velocity.z }
    : move.velocity;

  return {
    state: {
      version: MOTION_STATE_VERSION,
      tick,
      position: ground.position,
      velocity: settledVelocity,
      facing,
      locomotion,
      grounded: ground.grounded,
      groundNormal: ground.groundNormal,
      breath,
      lagTicks,
      fallStartY,
      displacement: host,
      contactCount: move.contacts,
    },
    events,
  };
};

/** The collision capsule occupied by `state`, for debugging, invariants and later slices' queries. */
export const motionCapsule = (state: MotionState, params: MotionParams): Capsule =>
  capsuleAtFoot(state.position, params);

const stableStateJson = (state: MotionState): string =>
  JSON.stringify([
    state.version,
    state.tick,
    state.position.x,
    state.position.y,
    state.position.z,
    state.velocity.x,
    state.velocity.y,
    state.velocity.z,
    state.facing,
    state.locomotion,
    state.grounded,
    state.groundNormal.x,
    state.groundNormal.y,
    state.groundNormal.z,
    state.breath,
    state.lagTicks,
    state.fallStartY,
    state.displacement === null
      ? null
      : [state.displacement.clip.clipId, state.displacement.tick, state.displacement.facing],
    state.contactCount,
  ]);

/** FNV-1a over a stable projection of the state — the determinism fingerprint replays compare. */
export const hashMotionState = (state: MotionState): string => {
  let hash = 0x811c_9dc5;
  for (const character of stableStateJson(state)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 0x0100_0193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};
