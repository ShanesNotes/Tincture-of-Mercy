import { normalizeRadians, type GroundPosition } from "./tracking";

export interface GuardParams {
  readonly absorption: number;
  readonly breathCostMultiplier: number;
}

export interface GuardResolution {
  readonly blocked: true;
  readonly breathAfter: number;
  readonly breathCost: number;
  readonly guardBroken: boolean;
  readonly pulseDamage: number;
}

const stableDecimal = (value: number): number => Math.round(value * 1_000_000_000) / 1_000_000_000;

export const resolveGuard = (
  incomingDamage: number,
  breath: number,
  params: GuardParams,
): GuardResolution => {
  if (
    !Number.isFinite(incomingDamage) ||
    incomingDamage < 0 ||
    !Number.isFinite(breath) ||
    breath < 0 ||
    !Number.isFinite(params.absorption) ||
    params.absorption < 0 ||
    params.absorption > 1 ||
    !Number.isFinite(params.breathCostMultiplier) ||
    params.breathCostMultiplier < 0
  ) {
    throw new Error("Guard inputs must be finite non-negative values and absorption must be in [0, 1].");
  }

  const breathCost = stableDecimal(incomingDamage * params.breathCostMultiplier);
  const breathAfter = stableDecimal(Math.max(0, breath - breathCost));
  return {
    blocked: true,
    breathAfter,
    breathCost,
    guardBroken: breathAfter === 0,
    pulseDamage: stableDecimal(incomingDamage * (1 - params.absorption)),
  };
};

export const isInsideRearCone = (
  attacker: GroundPosition,
  target: GroundPosition,
  targetFacingRadians: number,
  rearConeHalfAngleRadians: number,
): boolean => {
  if (!Number.isFinite(rearConeHalfAngleRadians) || rearConeHalfAngleRadians < 0) {
    throw new Error("Rear cone angle must be a finite non-negative value.");
  }

  const deltaX = attacker.x - target.x;
  const deltaZ = attacker.z - target.z;
  if (deltaX === 0 && deltaZ === 0) {
    return false;
  }

  const attackerDirection = Math.atan2(deltaX, deltaZ);
  const rearDirection = normalizeRadians(targetFacingRadians + Math.PI);
  return Math.abs(normalizeRadians(attackerDirection - rearDirection)) <= rearConeHalfAngleRadians;
};

export const isRiposteWindowOpen = (
  combatClock: number,
  openedAt: number,
  durationTicks: number,
): boolean => {
  if (
    !Number.isSafeInteger(combatClock) ||
    !Number.isSafeInteger(openedAt) ||
    !Number.isSafeInteger(durationTicks) ||
    durationTicks < 0
  ) {
    throw new Error("Riposte clocks must be safe integers and duration must be non-negative.");
  }
  return combatClock >= openedAt && combatClock < openedAt + durationTicks;
};
