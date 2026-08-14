import type { Vec3 } from "./types";

export const TAU = Math.PI * 2;

export const hypot2 = (x: number, z: number): number => Math.hypot(x, z);

export const distXz = (a: Vec3, b: Vec3): number => hypot2(a.x - b.x, a.z - b.z);

export const dist3 = (a: Vec3, b: Vec3): number => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

export const wrapAngle = (radians: number): number => {
  let value = radians;
  while (value > Math.PI) {
    value -= TAU;
  }
  while (value < -Math.PI) {
    value += TAU;
  }
  return value;
};

export const yawToward = (from: Vec3, to: Vec3): number => Math.atan2(to.x - from.x, to.z - from.z);

export const angleDelta = (fromYaw: number, toYaw: number): number => wrapAngle(toYaw - fromYaw);

export const degToRad = (degrees: number): number => (degrees * Math.PI) / 180;

export const compareId = (a: string, b: string): number => {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
};

export const sortById = <T extends { readonly id: string }>(items: readonly T[]): T[] =>
  [...items].sort((left, right) => compareId(left.id, right.id));

export const quantizeMm = (value: number): number => Math.round(value * 1000);

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const blockedEdgeKey = (from: string, to: string): string => `${from}->${to}`;
