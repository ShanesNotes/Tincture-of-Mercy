/**
 * Camera math — deterministic, headless, and free of three.
 *
 * Conventions match three's default camera basis: the camera looks down its own
 * -Z, yaw rotates about +Y, pitch about the camera's +X, roll is never applied
 * (D2 / renderer law L1). Angles are radians unless a name says degrees.
 */

export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface CameraBasis {
  readonly forward: Vec3;
  readonly right: Vec3;
  readonly up: Vec3;
}

export interface CameraPose {
  readonly position: Vec3;
  readonly yawRadians: number;
  readonly pitchRadians: number;
}

/** A body's on-screen extent, sampled as four silhouette extremes. */
export interface Silhouette {
  /** Centre of the body, not its feet. */
  readonly center: Vec3;
  readonly radiusMeters: number;
  readonly halfHeightMeters: number;
}

export const WORLD_UP: Vec3 = { x: 0, y: 1, z: 0 };
export const TWO_PI = Math.PI * 2;

export const add = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });

export const subtract = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
});

export const scale = (value: Vec3, factor: number): Vec3 => ({
  x: value.x * factor,
  y: value.y * factor,
  z: value.z * factor,
});

export const dot = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;

export const length = (value: Vec3): number => Math.sqrt(dot(value, value));

export const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(Math.max(value, minimum), maximum);

export const degreesToRadians = (degrees: number): number => (degrees * Math.PI) / 180;

export const radiansToDegrees = (radians: number): number => (radians * 180) / Math.PI;

/** Basis of a yaw/pitch camera with world up — roll is structurally impossible. */
export const basisFromAngles = (yawRadians: number, pitchRadians: number): CameraBasis => {
  const cosYaw = Math.cos(yawRadians);
  const sinYaw = Math.sin(yawRadians);
  const cosPitch = Math.cos(pitchRadians);
  const sinPitch = Math.sin(pitchRadians);
  return {
    forward: { x: -sinYaw * cosPitch, y: sinPitch, z: -cosYaw * cosPitch },
    right: { x: cosYaw, y: 0, z: -sinYaw },
    up: { x: sinYaw * sinPitch, y: cosPitch, z: cosYaw * sinPitch },
  };
};

/** Yaw whose forward points along `direction` (horizontal component only). */
export const yawTowards = (direction: Vec3): number => Math.atan2(-direction.x, -direction.z);

/** Pitch whose forward rises along `direction`. */
export const pitchTowards = (direction: Vec3): number =>
  Math.atan2(direction.y, Math.hypot(direction.x, direction.z));

/** Signed shortest angular delta from `from` to `to`, in [-PI, PI). */
export const shortestAngleDelta = (from: number, to: number): number => {
  const delta = (((to - from) % TWO_PI) + TWO_PI * 1.5) % TWO_PI;
  return delta - Math.PI;
};

/** Exponential approach; `rate` is the fraction closed per tick. */
export const approach = (current: number, target: number, rate: number): number => {
  const closed = clamp(rate, 0, 1);
  // Land exactly on the ends so a full step (alpha 1) is bit-exact, not near.
  if (closed === 1) {
    return target;
  }
  return current + (target - current) * closed;
};

/** Exponential approach along the short way round the circle. */
export const approachAngle = (current: number, target: number, rate: number): number =>
  current + shortestAngleDelta(current, target) * clamp(rate, 0, 1);

export const poseAt = (
  pivot: Vec3,
  yawRadians: number,
  pitchRadians: number,
  distanceMeters: number,
): CameraPose => ({
  position: subtract(pivot, scale(basisFromAngles(yawRadians, pitchRadians).forward, distanceMeters)),
  yawRadians,
  pitchRadians,
});

/**
 * Fraction of the screen between a world point and the nearest viewport edge.
 * 0.5 is dead centre, 0 is exactly on the edge, negative is off screen, and
 * -Infinity means the point is at or behind the camera plane.
 */
export const pointMargin = (
  pose: CameraPose,
  fovDegrees: number,
  aspect: number,
  point: Vec3,
): number => {
  const basis = basisFromAngles(pose.yawRadians, pose.pitchRadians);
  const delta = subtract(point, pose.position);
  const depth = dot(delta, basis.forward);
  if (depth <= 0) {
    return Number.NEGATIVE_INFINITY;
  }
  const halfHeight = Math.tan(degreesToRadians(fovDegrees) / 2);
  const ndcY = dot(delta, basis.up) / (depth * halfHeight);
  const ndcX = dot(delta, basis.right) / (depth * halfHeight * aspect);
  return Math.min((1 - Math.abs(ndcX)) / 2, (1 - Math.abs(ndcY)) / 2);
};

/** Four silhouette extremes: top, bottom, and both camera-relative sides. */
export const silhouettePoints = (
  silhouette: Silhouette,
  basis: CameraBasis,
): readonly Vec3[] => [
  add(silhouette.center, scale(WORLD_UP, silhouette.halfHeightMeters)),
  add(silhouette.center, scale(WORLD_UP, -silhouette.halfHeightMeters)),
  add(silhouette.center, scale(basis.right, silhouette.radiusMeters)),
  add(silhouette.center, scale(basis.right, -silhouette.radiusMeters)),
];

/**
 * Worst-case screen margin across every sampled silhouette — the number GATES
 * F9 reads ("both bodies on screen with >=12% margin").
 */
export const framingMargin = (
  pose: CameraPose,
  fovDegrees: number,
  aspect: number,
  silhouettes: readonly Silhouette[],
): number => {
  const basis = basisFromAngles(pose.yawRadians, pose.pitchRadians);
  let worst = Number.POSITIVE_INFINITY;
  for (const silhouette of silhouettes) {
    for (const point of silhouettePoints(silhouette, basis)) {
      worst = Math.min(worst, pointMargin(pose, fovDegrees, aspect, point));
    }
  }
  return worst === Number.POSITIVE_INFINITY ? 0 : worst;
};

export interface ScalarSolve {
  readonly value: number;
  readonly satisfied: boolean;
}

/**
 * Smallest value in [lower, upper] that satisfies a monotone predicate, by fixed
 * -iteration bisection so the result is bit-stable for identical inputs.
 */
export const solveMinimalScalar = (
  lower: number,
  upper: number,
  iterations: number,
  satisfies: (value: number) => boolean,
): ScalarSolve => {
  if (satisfies(lower)) {
    return { value: lower, satisfied: true };
  }
  if (!satisfies(upper)) {
    return { value: upper, satisfied: false };
  }
  let low = lower;
  let high = upper;
  for (let step = 0; step < iterations; step += 1) {
    const middle = (low + high) / 2;
    if (satisfies(middle)) {
      high = middle;
    } else {
      low = middle;
    }
  }
  return { value: high, satisfied: true };
};
