import { angleDelta, compareId, distXz, yawToward } from "./math";
import type { WolfAiParams } from "./params";
import type { PackState, Vec3, WolfActorState, WolfRole } from "./types";

export const inTokenRing = (wolf: Vec3, target: Vec3, params: WolfAiParams): boolean =>
  distXz(wolf, target) <= params.token.ringRadiusM;

export const ringTokenHolders = (
  wolves: readonly WolfActorState[],
  target: Vec3,
  params: WolfAiParams,
): readonly WolfActorState[] =>
  wolves.filter((wolf) => wolf.alive && wolf.hasToken && inTokenRing(wolf, target, params));

const roleWeight = (role: WolfRole, params: WolfAiParams): number => {
  if (role === "lunger") {
    return params.roles.tokenScore.lungeRole;
  }
  if (role === "harrier") {
    return params.roles.tokenScore.harrierRole;
  }
  return params.roles.tokenScore.baiterRole;
};

const angleQuality = (wolf: WolfActorState, target: Vec3 & { readonly yaw: number }): number => {
  const toTarget = yawToward(wolf, target);
  const facingTarget = Math.abs(angleDelta(wolf.yaw, toTarget));
  const flank = Math.abs(angleDelta(target.yaw + Math.PI / 2, toTarget));
  if (wolf.role === "harrier") {
    return Math.round((1 - Math.min(flank, Math.PI - flank) / (Math.PI / 2)) * 1000);
  }
  if (wolf.role === "lunger") {
    return Math.round((1 - facingTarget / Math.PI) * 1000);
  }
  return Math.round((1 - facingTarget / Math.PI) * 400);
};

const cooldownQuality = (
  wolf: WolfActorState,
  tick: number,
  params: WolfAiParams,
): number => {
  if (wolf.lastAttackTick === null) {
    return 1000;
  }
  const elapsed = tick - wolf.lastAttackTick;
  if (elapsed >= params.roles.attackCooldownTicks) {
    return 1000;
  }
  return Math.max(0, Math.floor((elapsed / params.roles.attackCooldownTicks) * 1000));
};

export const tokenGrantScore = (
  wolf: WolfActorState,
  target: Vec3 & { readonly yaw: number },
  tick: number,
  params: WolfAiParams,
): number => {
  const weights = params.roles.tokenScore;
  return (
    roleWeight(wolf.role, params) +
    angleQuality(wolf, target) * weights.angleWeight +
    cooldownQuality(wolf, tick, params) * weights.cooldownWeight
  );
};

export const pickTokenCandidate = (
  wolves: readonly WolfActorState[],
  target: Vec3 & { readonly yaw: number },
  tick: number,
  params: WolfAiParams,
): WolfActorState | null => {
  let best: WolfActorState | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const wolf of wolves) {
    if (!wolf.alive || wolf.alert !== "alert") {
      continue;
    }
    if (wolf.mode !== "engage") {
      continue;
    }
    if (!inTokenRing(wolf, target, params)) {
      continue;
    }

    const score = tokenGrantScore(wolf, target, tick, params);
    if (
      best === null ||
      score > bestScore ||
      (score === bestScore && compareId(wolf.id, best.id) < 0)
    ) {
      best = wolf;
      bestScore = score;
    }
  }

  return best;
};

export const assertRingInvariant = (
  wolves: readonly WolfActorState[],
  target: Vec3,
  params: WolfAiParams,
): void => {
  const holders = ringTokenHolders(wolves, target, params);
  if (holders.length > 1) {
    const ids = holders.map((wolf) => wolf.id).join(",");
    throw new Error(`F10 token invariant broken: ${holders.length} holders in ring (${ids})`);
  }
};

export const dueToRelease = (pack: PackState, tick: number): boolean =>
  pack.tokenReleaseTick !== null && tick >= pack.tokenReleaseTick;
