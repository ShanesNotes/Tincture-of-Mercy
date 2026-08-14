export interface GroundPosition {
  readonly x: number;
  readonly z: number;
}

const TAU = Math.PI * 2;

export const normalizeRadians = (radians: number): number => {
  if (!Number.isFinite(radians)) {
    throw new Error("Facing must be finite.");
  }

  const wrapped = ((radians + Math.PI) % TAU + TAU) % TAU - Math.PI;
  return wrapped === -Math.PI ? Math.PI : wrapped;
};

export const rotateTowardTarget = (
  facingRadians: number,
  origin: GroundPosition,
  target: GroundPosition,
  maxTurnRadians: number,
): number => {
  if (!Number.isFinite(maxTurnRadians) || maxTurnRadians < 0) {
    throw new Error("Tracking turn cap must be a finite non-negative value.");
  }

  const deltaX = target.x - origin.x;
  const deltaZ = target.z - origin.z;
  if (deltaX === 0 && deltaZ === 0) {
    return normalizeRadians(facingRadians);
  }

  const desired = Math.atan2(deltaX, deltaZ);
  const delta = normalizeRadians(desired - facingRadians);
  const clamped = Math.max(-maxTurnRadians, Math.min(maxTurnRadians, delta));
  return normalizeRadians(facingRadians + clamped);
};
