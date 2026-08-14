import type { AttendCameraParams, CameraParams } from "./params";
import {
  add,
  approach,
  approachAngle,
  basisFromAngles,
  clamp,
  degreesToRadians,
  framingMargin,
  length,
  pitchTowards,
  poseAt,
  scale,
  solveMinimalScalar,
  subtract,
  yawTowards,
  WORLD_UP,
  type CameraBasis,
  type CameraPose,
  type Silhouette,
  type Vec3,
} from "./math";

export const CAMERA_STATE_VERSION = 1 as const;

export type CameraMode = "free-follow" | "player-orbit" | "attend" | "staged";

/** A staged plate frame. D2 allows these only in no-damage beats. */
export interface StagedFrameSpec {
  /** Named beat: hearth-rest, anna-gravity, item-revelation, boss-introduction, birdie-coda. */
  readonly beat: string;
  readonly pivot: Vec3;
  readonly yawRadians: number;
  readonly pitchRadians: number;
  readonly distanceMeters: number;
  readonly fovDegrees: number;
}

/** Sphere probe against static geometry: 0..1 fraction of the segment travelled. */
export type CameraProbe = (from: Vec3, to: Vec3, radiusMeters: number) => number;

export type CameraLineOfSight = (from: Vec3, to: Vec3) => boolean;

export interface CameraStepInput {
  /** Player feet position. */
  readonly playerPosition: Vec3;
  /** Yaw the player is moving along, or null when standing still. */
  readonly playerMoveYaw: number | null;
  /** Attend target aim point, or null when not attending. */
  readonly attendTargetPosition: Vec3 | null;
  /** Camera stick, already deadzoned: x = yaw, y = pitch. Never the move stick (F1). */
  readonly orbit: { readonly x: number; readonly y: number };
  readonly aspect: number;
  /** True whenever the active verbs are combat verbs — releases staged frames (D2). */
  readonly damageContext: boolean;
  readonly probe: CameraProbe;
  readonly lineOfSight: CameraLineOfSight;
}

export interface CameraState {
  readonly version: typeof CAMERA_STATE_VERSION;
  readonly mode: CameraMode;
  readonly yawRadians: number;
  readonly pitchRadians: number;
  readonly distanceMeters: number;
  readonly fovDegrees: number;
  readonly pivot: Vec3;
  readonly position: Vec3;
  /** Ticks since the orbit stick was last touched. */
  readonly idleTicks: number;
  /** Consecutive ticks the attend target has been occluded (GATES F9 caps at 8). */
  readonly occludedTicks: number;
  /**
   * Worst silhouette margin this tick; >= framingMarginFraction satisfies F9.
   * Zero outside Attend, where two-body framing does not apply.
   */
  readonly framingMargin: number;
  readonly framingSatisfied: boolean;
  readonly collisionPulledIn: boolean;
  readonly staged: StagedFrameSpec | null;
}

const pivotFor = (playerPosition: Vec3, heightMeters: number): Vec3 =>
  add(playerPosition, scale(WORLD_UP, heightMeters));

export const createCameraState = (params: CameraParams, playerPosition: Vec3): CameraState => {
  const pivot = pivotFor(playerPosition, params.follow.pivotHeightMeters);
  const pitchRadians = degreesToRadians(params.follow.restPitchDegrees);
  const pose = poseAt(pivot, 0, pitchRadians, params.follow.restDistanceMeters);
  return {
    version: CAMERA_STATE_VERSION,
    mode: "free-follow",
    yawRadians: 0,
    pitchRadians,
    distanceMeters: params.follow.restDistanceMeters,
    fovDegrees: params.fov.defaultDegrees,
    pivot,
    position: pose.position,
    idleTicks: params.follow.autoAlignDelayTicks,
    occludedTicks: 0,
    framingMargin: 0,
    framingSatisfied: true,
    collisionPulledIn: false,
    staged: null,
  };
};

/**
 * Enter a staged plate frame. D2: staged framing is legal only in no-damage
 * beats, so the guard flag is checked before the handoff, never after.
 */
export const holdFrame = (
  state: CameraState,
  spec: StagedFrameSpec,
  guard: { readonly damageContext: boolean },
): CameraState => {
  if (guard.damageContext) {
    throw new Error(
      `D2 forbids a staged camera frame in a damage context (beat "${spec.beat}").`,
    );
  }
  return {
    ...state,
    mode: "staged",
    staged: spec,
    yawRadians: spec.yawRadians,
    pitchRadians: spec.pitchRadians,
    distanceMeters: spec.distanceMeters,
    fovDegrees: spec.fovDegrees,
    pivot: spec.pivot,
    position: poseAt(spec.pivot, spec.yawRadians, spec.pitchRadians, spec.distanceMeters).position,
    occludedTicks: 0,
  };
};

/** Hand the frame back to the free camera. */
export const releaseFrame = (state: CameraState): CameraState =>
  state.staged === null ? state : { ...state, mode: "free-follow", staged: null };

const orbitMagnitude = (input: CameraStepInput): number =>
  Math.hypot(input.orbit.x, input.orbit.y);

const clampPitch = (params: CameraParams, pitchRadians: number): number =>
  clamp(
    pitchRadians,
    degreesToRadians(params.orbit.pitchMinDegrees),
    degreesToRadians(params.orbit.pitchMaxDegrees),
  );

const silhouettesFor = (
  attend: AttendCameraParams,
  playerPosition: Vec3,
  targetPosition: Vec3,
): readonly Silhouette[] => [
  {
    center: add(playerPosition, scale(WORLD_UP, attend.playerSilhouette.heightMeters / 2)),
    radiusMeters: attend.playerSilhouette.radiusMeters,
    halfHeightMeters: attend.playerSilhouette.heightMeters / 2,
  },
  {
    center: targetPosition,
    radiusMeters: attend.targetSilhouette.radiusMeters,
    halfHeightMeters: attend.targetSilhouette.heightMeters / 2,
  },
];

interface AttendFraming {
  readonly yawRadians: number;
  readonly pitchRadians: number;
  readonly distanceMeters: number;
  readonly fovDegrees: number;
  readonly pose: CameraPose;
  readonly margin: number;
  readonly satisfied: boolean;
}

/**
 * Two-body framing: aim between player and target, then take the smallest
 * distance (and, only if distance alone cannot do it, the widest legal FOV)
 * that keeps both silhouettes inside the F9 margin. Distance is given up
 * instantly and taken back on a spring, so the margin never regresses.
 */
const solveAttendFraming = (
  state: CameraState,
  params: CameraParams,
  input: CameraStepInput,
  targetPosition: Vec3,
  yawRate: number,
): AttendFraming => {
  const { attend } = params;
  const pivot = pivotFor(input.playerPosition, attend.pivotHeightMeters);
  const toTarget = subtract(targetPosition, pivot);
  const desiredYaw = yawTowards(toTarget);
  const desiredPitch = clampPitch(
    params,
    degreesToRadians(attend.basePitchDegrees) + pitchTowards(toTarget) * attend.targetHeightWeight,
  );
  const yawRadians = approachAngle(state.yawRadians, desiredYaw, yawRate);
  const pitchRadians = approachAngle(state.pitchRadians, desiredPitch, yawRate);
  const silhouettes = silhouettesFor(attend, input.playerPosition, targetPosition);
  const required = attend.framingMarginFraction;

  const marginAt = (distanceMeters: number, fovDegrees: number): number =>
    framingMargin(
      poseAt(pivot, yawRadians, pitchRadians, distanceMeters),
      fovDegrees,
      input.aspect,
      silhouettes,
    );

  const distanceSolve = solveMinimalScalar(
    attend.minDistanceMeters,
    attend.maxDistanceMeters,
    attend.distanceSolveIterations,
    (distanceMeters) => marginAt(distanceMeters, params.fov.defaultDegrees) >= required,
  );
  let fovDegrees = params.fov.defaultDegrees;
  if (!distanceSolve.satisfied && params.fov.maxDegrees > params.fov.defaultDegrees) {
    const fovSolve = solveMinimalScalar(
      params.fov.defaultDegrees,
      params.fov.maxDegrees,
      attend.distanceSolveIterations,
      (candidate) => marginAt(distanceSolve.value, candidate) >= required,
    );
    fovDegrees = fovSolve.value;
  }

  const distanceMeters =
    distanceSolve.value > state.distanceMeters
      ? distanceSolve.value
      : approach(state.distanceMeters, distanceSolve.value, attend.distanceSpringPerTick);
  const pose = poseAt(pivot, yawRadians, pitchRadians, distanceMeters);
  const margin = framingMargin(pose, fovDegrees, input.aspect, silhouettes);
  return {
    yawRadians,
    pitchRadians,
    distanceMeters,
    fovDegrees,
    pose,
    margin,
    satisfied: margin >= required,
  };
};

interface FreeFraming {
  readonly yawRadians: number;
  readonly pitchRadians: number;
  readonly distanceMeters: number;
  readonly idleTicks: number;
  readonly mode: CameraMode;
}

const solveFreeFraming = (
  state: CameraState,
  params: CameraParams,
  input: CameraStepInput,
): FreeFraming => {
  const { follow, orbit } = params;
  if (orbitMagnitude(input) > 0) {
    const pitchSign = orbit.invertPitch ? -1 : 1;
    return {
      mode: "player-orbit",
      idleTicks: 0,
      yawRadians:
        state.yawRadians - input.orbit.x * degreesToRadians(orbit.yawDegreesPerTick),
      pitchRadians: clampPitch(
        params,
        state.pitchRadians + pitchSign * input.orbit.y * degreesToRadians(orbit.pitchDegreesPerTick),
      ),
      distanceMeters: approach(
        state.distanceMeters,
        follow.restDistanceMeters,
        follow.distanceSpringPerTick,
      ),
    };
  }

  const idleTicks = state.idleTicks + 1;
  const aligning = idleTicks >= follow.autoAlignDelayTicks && input.playerMoveYaw !== null;
  return {
    mode: idleTicks >= follow.autoAlignDelayTicks ? "free-follow" : "player-orbit",
    idleTicks,
    yawRadians: aligning
      ? approachAngle(state.yawRadians, input.playerMoveYaw ?? 0, follow.yawSpringPerTick)
      : state.yawRadians,
    pitchRadians: approachAngle(
      state.pitchRadians,
      degreesToRadians(follow.restPitchDegrees),
      follow.pitchSpringPerTick,
    ),
    distanceMeters: approach(
      state.distanceMeters,
      follow.restDistanceMeters,
      follow.distanceSpringPerTick,
    ),
  };
};

/**
 * Pull the camera in along the pivot->camera segment until the sphere probe
 * clears static geometry. Collision outranks framing: never clip the level.
 */
const applyCollision = (
  params: CameraParams,
  input: CameraStepInput,
  pivot: Vec3,
  pose: CameraPose,
  distanceMeters: number,
  minimumDistance: number,
): { readonly distanceMeters: number; readonly pulledIn: boolean } => {
  const fraction = clamp(
    input.probe(pivot, pose.position, params.collision.probeRadiusMeters),
    0,
    1,
  );
  if (fraction >= 1) {
    return { distanceMeters, pulledIn: false };
  }
  const cleared = Math.max(
    minimumDistance,
    distanceMeters * fraction - params.collision.skinMeters,
  );
  return { distanceMeters: Math.min(distanceMeters, cleared), pulledIn: true };
};

/** One deterministic camera tick. Consumes sim state; owns no timing of its own. */
export const stepCamera = (
  state: CameraState,
  params: CameraParams,
  input: CameraStepInput,
): CameraState => {
  if (state.mode === "staged" && state.staged !== null) {
    if (!input.damageContext) {
      return state;
    }
    return stepCamera(releaseFrame(state), params, input);
  }

  // Attend owns yaw and pitch outright; the orbit stick is a switch flick there
  // (handled by sim/attend), never a camera nudge.
  const targetPosition = input.attendTargetPosition;
  if (targetPosition !== null) {
    return stepAttendCamera(state, params, input, targetPosition);
  }

  const framing = solveFreeFraming(state, params, input);
  const pivot = pivotFor(input.playerPosition, params.follow.pivotHeightMeters);
  const pose = poseAt(pivot, framing.yawRadians, framing.pitchRadians, framing.distanceMeters);
  const collided = applyCollision(
    params,
    input,
    pivot,
    pose,
    framing.distanceMeters,
    params.follow.minDistanceMeters,
  );
  const finalPose = poseAt(
    pivot,
    framing.yawRadians,
    framing.pitchRadians,
    collided.distanceMeters,
  );
  return {
    ...state,
    mode: framing.mode,
    yawRadians: framing.yawRadians,
    pitchRadians: framing.pitchRadians,
    distanceMeters: collided.distanceMeters,
    fovDegrees: params.fov.defaultDegrees,
    pivot,
    position: finalPose.position,
    idleTicks: framing.idleTicks,
    occludedTicks: 0,
    framingMargin: 0,
    framingSatisfied: true,
    collisionPulledIn: collided.pulledIn,
    staged: null,
  };
};

const stepAttendCamera = (
  state: CameraState,
  params: CameraParams,
  input: CameraStepInput,
  targetPosition: Vec3,
): CameraState => {
  const { attend } = params;
  const recovering = state.occludedTicks >= attend.occlusionRecoveryStartTicks;
  const baseRate = recovering ? attend.recoveryYawSpringPerTick : attend.yawSpringPerTick;

  let framing = solveAttendFraming(state, params, input, targetPosition, baseRate);
  if (!framing.satisfied && baseRate < attend.recoveryYawSpringPerTick) {
    const recovered = solveAttendFraming(
      state,
      params,
      input,
      targetPosition,
      attend.recoveryYawSpringPerTick,
    );
    if (recovered.margin > framing.margin) {
      framing = recovered;
    }
  }

  const pivot = pivotFor(input.playerPosition, attend.pivotHeightMeters);
  const collided = applyCollision(
    params,
    input,
    pivot,
    framing.pose,
    framing.distanceMeters,
    attend.minDistanceMeters,
  );
  // Sight outranks framing: while the target is hidden the camera may close in
  // but never back off, so the F9 occlusion clause cannot lose to the margin one.
  let distanceMeters =
    state.occludedTicks > 0
      ? Math.min(collided.distanceMeters, state.distanceMeters)
      : collided.distanceMeters;
  let pose = poseAt(pivot, framing.yawRadians, framing.pitchRadians, distanceMeters);
  let occludedTicks = input.lineOfSight(pose.position, targetPosition)
    ? 0
    : state.occludedTicks + 1;

  if (occludedTicks >= attend.occlusionSnapTicks) {
    const snapDistance = attend.minDistanceMeters;
    const snapPose = poseAt(
      pivot,
      yawTowards(subtract(targetPosition, pivot)),
      framing.pitchRadians,
      snapDistance,
    );
    if (input.lineOfSight(snapPose.position, targetPosition)) {
      distanceMeters = snapDistance;
      pose = snapPose;
      occludedTicks = 0;
    }
  }

  const margin = framingMargin(
    pose,
    framing.fovDegrees,
    input.aspect,
    silhouettesFor(attend, input.playerPosition, targetPosition),
  );
  return {
    ...state,
    mode: "attend",
    yawRadians: pose.yawRadians,
    pitchRadians: pose.pitchRadians,
    distanceMeters,
    fovDegrees: framing.fovDegrees,
    pivot,
    position: pose.position,
    idleTicks: 0,
    occludedTicks,
    framingMargin: margin,
    framingSatisfied: margin >= attend.framingMarginFraction,
    collisionPulledIn: collided.pulledIn,
    staged: null,
  };
};

/** Distance from the pivot at which the camera currently sits. */
export const cameraDistanceTo = (state: CameraState): number =>
  length(subtract(state.position, state.pivot));

/** Camera basis for the current state — used by the three rig and by tests. */
export const cameraBasis = (state: CameraState): CameraBasis =>
  basisFromAngles(state.yawRadians, state.pitchRadians);
