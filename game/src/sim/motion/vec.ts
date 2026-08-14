import type { Vec3 } from "./types";

export const ZERO: Vec3 = { x: 0, y: 0, z: 0 };
export const UP: Vec3 = { x: 0, y: 1, z: 0 };

export const vec = (x: number, y: number, z: number): Vec3 => ({ x, y, z });

export const add = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });

export const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });

export const scale = (a: Vec3, s: number): Vec3 => ({ x: a.x * s, y: a.y * s, z: a.z * s });

export const addScaled = (a: Vec3, b: Vec3, s: number): Vec3 => ({
  x: a.x + b.x * s,
  y: a.y + b.y * s,
  z: a.z + b.z * s,
});

export const dot = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;

export const cross = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});

export const lengthSq = (a: Vec3): number => a.x * a.x + a.y * a.y + a.z * a.z;

export const length = (a: Vec3): number => Math.sqrt(lengthSq(a));

export const horizontalLength = (a: Vec3): number => Math.sqrt(a.x * a.x + a.z * a.z);

/** Returns the zero vector for degenerate input rather than NaN — sweeps must never see NaN. */
export const normalize = (a: Vec3): Vec3 => {
  const magnitude = length(a);
  return magnitude === 0 ? ZERO : scale(a, 1 / magnitude);
};

/** Removes the component of `a` along the unit vector `normal`. */
export const projectOnPlane = (a: Vec3, normal: Vec3): Vec3 => addScaled(a, normal, -dot(a, normal));

/** Unit XZ direction of `a`, or the zero vector when `a` is vertical. */
export const horizontalNormalize = (a: Vec3): Vec3 => {
  const magnitude = Math.sqrt(a.x * a.x + a.z * a.z);
  return magnitude === 0 ? ZERO : { x: a.x / magnitude, y: 0, z: a.z / magnitude };
};

export const clamp = (value: number, low: number, high: number): number =>
  value < low ? low : value > high ? high : value;

/** Rotates an XZ vector by `yaw` radians about +Y (yaw 0 leaves +Z as +Z). */
export const rotateYaw = (x: number, z: number, yaw: number): { x: number; z: number } => {
  const cosine = Math.cos(yaw);
  const sine = Math.sin(yaw);
  return { x: x * cosine + z * sine, z: -x * sine + z * cosine };
};

/** Shortest signed angular difference from `from` to `to`, in (-PI, PI]. */
export const angleDelta = (from: number, to: number): number => {
  const twoPi = Math.PI * 2;
  let delta = (to - from) % twoPi;
  if (delta > Math.PI) {
    delta -= twoPi;
  }
  if (delta <= -Math.PI) {
    delta += twoPi;
  }
  return delta;
};

/** Wraps an angle into (-PI, PI]. */
export const wrapAngle = (angle: number): number => angleDelta(0, angle);
