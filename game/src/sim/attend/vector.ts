import type { AttendVec3 } from "./types";

export const subtract = (a: AttendVec3, b: AttendVec3): AttendVec3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
});

export const dot = (a: AttendVec3, b: AttendVec3): number => a.x * b.x + a.y * b.y + a.z * b.z;

export const length = (value: AttendVec3): number => Math.sqrt(dot(value, value));

/** Returns the zero vector when the input is degenerate — callers guard on length. */
export const normalize = (value: AttendVec3): AttendVec3 => {
  const magnitude = length(value);
  if (magnitude === 0) {
    return { x: 0, y: 0, z: 0 };
  }
  return { x: value.x / magnitude, y: value.y / magnitude, z: value.z / magnitude };
};

/**
 * Slack for inclusive range/cone comparisons so a target authored exactly on the
 * boundary is never excluded by floating-point dust. Numeric hygiene, not tuning.
 */
export const BOUNDARY_EPSILON = 1e-9;

export const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(Math.max(value, minimum), maximum);

export const degreesToRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/** Angle in radians between two vectors; 0 when either is degenerate. */
export const angleBetween = (a: AttendVec3, b: AttendVec3): number => {
  const magnitudes = length(a) * length(b);
  if (magnitudes === 0) {
    return 0;
  }
  return Math.acos(clamp(dot(a, b) / magnitudes, -1, 1));
};
