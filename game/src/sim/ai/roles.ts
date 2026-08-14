import { compareId } from "./math";
import type { WolfAiParams } from "./params";
import type { WolfAttackId, WolfRole } from "./types";

export const assignRoles = (livingIds: readonly string[]): ReadonlyMap<string, WolfRole> => {
  const ids = [...livingIds].sort(compareId);
  const assigned = new Map<string, WolfRole>();
  if (ids.length === 0) {
    return assigned;
  }
  if (ids.length === 1) {
    const only = ids[0];
    if (only !== undefined) {
      assigned.set(only, "lunger");
    }
    return assigned;
  }

  const baiter = ids[0];
  const lunger = ids[1];
  if (baiter !== undefined) {
    assigned.set(baiter, "baiter");
  }
  if (lunger !== undefined) {
    assigned.set(lunger, "lunger");
  }
  for (const id of ids.slice(2)) {
    assigned.set(id, "harrier");
  }
  return assigned;
};

export const roleAttack = (role: WolfRole): WolfAttackId => {
  if (role === "lunger") {
    return "lunge";
  }
  if (role === "harrier") {
    return "flank_bite";
  }
  return "feint";
};

export const circleRadiusForTier = (params: WolfAiParams, aggressionTier: number): number => {
  const shrunk =
    params.roles.circleRadiusM * (1 - params.roles.aggression.circleShrinkPerTier * aggressionTier);
  return Math.max(params.roles.aggression.minCircleRadiusM, shrunk);
};

export const feintIntervalForTier = (params: WolfAiParams, aggressionTier: number): number => {
  const shrunk =
    params.roles.feintIntervalTicks - params.roles.aggression.feintIntervalShrinkPerTier * aggressionTier;
  return Math.max(params.roles.aggression.minFeintIntervalTicks, shrunk);
};

export const shouldFlee = (pulse: number, maxPulse: number, params: WolfAiParams): boolean =>
  maxPulse > 0 && pulse / maxPulse < params.flee.pulseRatio;
