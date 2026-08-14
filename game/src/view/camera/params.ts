import rawCameraParams from "../../data/camera_params.json";

/**
 * Camera tuning parameters, loaded from `src/data/camera_params.json`.
 * Provenance for every group is recorded in the data file's `_source` block.
 */

export interface FovParams {
  readonly defaultDegrees: number;
  readonly minDegrees: number;
  readonly maxDegrees: number;
}

export interface DepthParams {
  readonly nearMeters: number;
  readonly farMeters: number;
  readonly reverseZ: boolean;
}

export interface FollowParams {
  readonly pivotHeightMeters: number;
  readonly restDistanceMeters: number;
  readonly minDistanceMeters: number;
  readonly maxDistanceMeters: number;
  readonly restPitchDegrees: number;
  readonly yawSpringPerTick: number;
  readonly pitchSpringPerTick: number;
  readonly distanceSpringPerTick: number;
  readonly autoAlignDelayTicks: number;
}

export interface OrbitParams {
  readonly yawDegreesPerTick: number;
  readonly pitchDegreesPerTick: number;
  readonly pitchMinDegrees: number;
  readonly pitchMaxDegrees: number;
  readonly invertPitch: boolean;
}

export interface CollisionParams {
  readonly probeRadiusMeters: number;
  readonly skinMeters: number;
  readonly returnSpringPerTick: number;
}

export interface SilhouetteParams {
  readonly radiusMeters: number;
  readonly heightMeters: number;
}

export interface AttendCameraParams {
  readonly framingMarginFraction: number;
  readonly pivotHeightMeters: number;
  readonly minDistanceMeters: number;
  readonly maxDistanceMeters: number;
  readonly distanceSpringPerTick: number;
  readonly distanceSolveIterations: number;
  readonly basePitchDegrees: number;
  readonly targetHeightWeight: number;
  readonly yawSpringPerTick: number;
  readonly recoveryYawSpringPerTick: number;
  readonly occlusionSnapTicks: number;
  readonly occlusionRecoveryStartTicks: number;
  readonly playerSilhouette: SilhouetteParams;
  readonly targetSilhouette: SilhouetteParams;
}

export interface CameraParams {
  readonly fov: FovParams;
  readonly depth: DepthParams;
  readonly follow: FollowParams;
  readonly orbit: OrbitParams;
  readonly collision: CollisionParams;
  readonly attend: AttendCameraParams;
}

const asRecord = (value: unknown, label: string): Record<string, unknown> => {
  if (typeof value !== "object" || value === null) {
    throw new TypeError(`camera params: ${label} must be an object`);
  }
  return value as Record<string, unknown>;
};

const readNumber = (source: Record<string, unknown>, label: string, key: string): number => {
  const value = source[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new RangeError(`camera params: ${label}.${key} must be a finite number`);
  }
  return value;
};

const readBoolean = (source: Record<string, unknown>, label: string, key: string): boolean => {
  const value = source[key];
  if (typeof value !== "boolean") {
    throw new RangeError(`camera params: ${label}.${key} must be a boolean`);
  }
  return value;
};

const readGroup = <T>(
  raw: Record<string, unknown>,
  label: string,
  read: (source: Record<string, unknown>) => T,
): T => read(asRecord(raw[label], label));

const readSilhouette = (source: Record<string, unknown>, label: string): SilhouetteParams => {
  const group = asRecord(source[label], label);
  return {
    radiusMeters: readNumber(group, label, "radiusMeters"),
    heightMeters: readNumber(group, label, "heightMeters"),
  };
};

/** Validates raw camera JSON, enforcing the D2 FOV band and reverse-Z sanity. */
export const parseCameraParams = (raw: unknown): CameraParams => {
  const source = asRecord(raw, "root");

  const fov = readGroup(source, "fov", (group) => ({
    defaultDegrees: readNumber(group, "fov", "defaultDegrees"),
    minDegrees: readNumber(group, "fov", "minDegrees"),
    maxDegrees: readNumber(group, "fov", "maxDegrees"),
  }));
  const depth = readGroup(source, "depth", (group) => ({
    nearMeters: readNumber(group, "depth", "nearMeters"),
    farMeters: readNumber(group, "depth", "farMeters"),
    reverseZ: readBoolean(group, "depth", "reverseZ"),
  }));
  const follow = readGroup(source, "follow", (group) => ({
    pivotHeightMeters: readNumber(group, "follow", "pivotHeightMeters"),
    restDistanceMeters: readNumber(group, "follow", "restDistanceMeters"),
    minDistanceMeters: readNumber(group, "follow", "minDistanceMeters"),
    maxDistanceMeters: readNumber(group, "follow", "maxDistanceMeters"),
    restPitchDegrees: readNumber(group, "follow", "restPitchDegrees"),
    yawSpringPerTick: readNumber(group, "follow", "yawSpringPerTick"),
    pitchSpringPerTick: readNumber(group, "follow", "pitchSpringPerTick"),
    distanceSpringPerTick: readNumber(group, "follow", "distanceSpringPerTick"),
    autoAlignDelayTicks: readNumber(group, "follow", "autoAlignDelayTicks"),
  }));
  const orbit = readGroup(source, "orbit", (group) => ({
    yawDegreesPerTick: readNumber(group, "orbit", "yawDegreesPerTick"),
    pitchDegreesPerTick: readNumber(group, "orbit", "pitchDegreesPerTick"),
    pitchMinDegrees: readNumber(group, "orbit", "pitchMinDegrees"),
    pitchMaxDegrees: readNumber(group, "orbit", "pitchMaxDegrees"),
    invertPitch: readBoolean(group, "orbit", "invertPitch"),
  }));
  const collision = readGroup(source, "collision", (group) => ({
    probeRadiusMeters: readNumber(group, "collision", "probeRadiusMeters"),
    skinMeters: readNumber(group, "collision", "skinMeters"),
    returnSpringPerTick: readNumber(group, "collision", "returnSpringPerTick"),
  }));
  const attend = readGroup(source, "attend", (group) => ({
    framingMarginFraction: readNumber(group, "attend", "framingMarginFraction"),
    pivotHeightMeters: readNumber(group, "attend", "pivotHeightMeters"),
    minDistanceMeters: readNumber(group, "attend", "minDistanceMeters"),
    maxDistanceMeters: readNumber(group, "attend", "maxDistanceMeters"),
    distanceSpringPerTick: readNumber(group, "attend", "distanceSpringPerTick"),
    distanceSolveIterations: readNumber(group, "attend", "distanceSolveIterations"),
    basePitchDegrees: readNumber(group, "attend", "basePitchDegrees"),
    targetHeightWeight: readNumber(group, "attend", "targetHeightWeight"),
    yawSpringPerTick: readNumber(group, "attend", "yawSpringPerTick"),
    recoveryYawSpringPerTick: readNumber(group, "attend", "recoveryYawSpringPerTick"),
    occlusionSnapTicks: readNumber(group, "attend", "occlusionSnapTicks"),
    occlusionRecoveryStartTicks: readNumber(group, "attend", "occlusionRecoveryStartTicks"),
    playerSilhouette: readSilhouette(group, "playerSilhouette"),
    targetSilhouette: readSilhouette(group, "targetSilhouette"),
  }));

  assertCameraParams({ fov, depth, follow, orbit, collision, attend });
  return { fov, depth, follow, orbit, collision, attend };
};

const assertCameraParams = (params: CameraParams): void => {
  const { attend, collision, depth, follow, fov, orbit } = params;
  if (fov.minDegrees < 38 || fov.maxDegrees > 48 || fov.minDegrees > fov.maxDegrees) {
    throw new RangeError("camera params: D2 fixes the vertical FOV band at 38-48 degrees");
  }
  if (fov.defaultDegrees < fov.minDegrees || fov.defaultDegrees > fov.maxDegrees) {
    throw new RangeError("camera params: default FOV must sit inside the band");
  }
  if (depth.nearMeters <= 0 || depth.farMeters <= depth.nearMeters) {
    throw new RangeError("camera params: reverse-Z still needs 0 < near < far");
  }
  if (follow.minDistanceMeters <= 0 || follow.maxDistanceMeters < follow.restDistanceMeters) {
    throw new RangeError("camera params: follow distances must be ordered and positive");
  }
  if (orbit.pitchMinDegrees >= orbit.pitchMaxDegrees) {
    throw new RangeError("camera params: orbit pitch limits must be ordered");
  }
  if (
    follow.restPitchDegrees < orbit.pitchMinDegrees ||
    follow.restPitchDegrees > orbit.pitchMaxDegrees
  ) {
    throw new RangeError("camera params: rest pitch must sit inside the orbit pitch limits");
  }
  if (collision.probeRadiusMeters <= 0 || collision.skinMeters <= 0) {
    throw new RangeError("camera params: collision probe radius and skin must be positive");
  }
  if (attend.framingMarginFraction < 0.12) {
    throw new RangeError("camera params: GATES F9 requires at least a 12% framing margin");
  }
  if (attend.occlusionSnapTicks > 8 || attend.occlusionRecoveryStartTicks > attend.occlusionSnapTicks) {
    throw new RangeError("camera params: GATES F9 caps occlusion at 8 consecutive ticks");
  }
  if (attend.maxDistanceMeters < attend.minDistanceMeters || attend.minDistanceMeters <= 0) {
    throw new RangeError("camera params: attend distances must be ordered and positive");
  }
  if (!Number.isSafeInteger(attend.distanceSolveIterations) || attend.distanceSolveIterations < 1) {
    throw new RangeError("camera params: the distance solve needs a whole iteration count");
  }
};

export const CAMERA_PARAMS: CameraParams = parseCameraParams(rawCameraParams);
