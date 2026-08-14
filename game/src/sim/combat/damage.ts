export type DamageType = "standard" | "strike" | "pierce" | "slash" | "wither";

export interface DamageNegation {
  readonly pierce: number;
  readonly slash: number;
  readonly standard: number;
  readonly strike: number;
  readonly wither: number;
}

export interface CombatPosition {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface AuthoredDisplacement {
  readonly forward: number;
  readonly right: number;
}

const stableDecimal = (value: number): number => Math.round(value * 1_000_000_000) / 1_000_000_000;

export const applyDamageNegation = (rawDamage: number, negation: number): number => {
  if (
    !Number.isFinite(rawDamage) ||
    rawDamage < 0 ||
    !Number.isFinite(negation) ||
    negation < 0 ||
    negation > 1
  ) {
    throw new Error("Damage must be non-negative and negation must be in [0, 1].");
  }
  return stableDecimal(rawDamage * (1 - negation));
};

export const scalePoiseDamage = (
  poiseDamage: number,
  damageType: DamageType,
  witherMultiplier: number,
): number => {
  if (
    !Number.isFinite(poiseDamage) ||
    poiseDamage < 0 ||
    !Number.isFinite(witherMultiplier) ||
    witherMultiplier < 0
  ) {
    throw new Error("Poise damage and its Wither multiplier must be finite non-negative values.");
  }
  return stableDecimal(poiseDamage * (damageType === "wither" ? witherMultiplier : 1));
};

export const applyAuthoredDisplacement = (
  position: CombatPosition,
  attackerFacingRadians: number,
  displacement: AuthoredDisplacement,
): CombatPosition => {
  const forwardX = Math.sin(attackerFacingRadians);
  const forwardZ = Math.cos(attackerFacingRadians);
  const rightX = Math.cos(attackerFacingRadians);
  const rightZ = -Math.sin(attackerFacingRadians);
  return {
    x: stableDecimal(
      position.x + forwardX * displacement.forward + rightX * displacement.right,
    ),
    y: position.y,
    z: stableDecimal(
      position.z + forwardZ * displacement.forward + rightZ * displacement.right,
    ),
  };
};
