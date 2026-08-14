/**
 * Ember's cost — the Numbness ladder (D6, TEXT_BIBLE §2).
 *
 * Each Ember dose adds a permanent stack: -8% Tincture healing, +25% Turn buildup,
 * +1 register-degradation step. Stat penalties are never restored. Only the words
 * come back, and only while a Hearth vigil holds:
 *
 *     textStep = clamp(stacks - vigilRestore, 0, 3)
 *
 * `vigilRestore` is capped at 1 by data (`maxVigilRestore`), so permanent stacks
 * still bite no matter how often the player rests.
 */

import { DEFAULT_META_PARAMS } from "./data";
import { derivedAttribute } from "./progression";
import type { MetaModifiers, MetaParams, MetaState } from "./types";

const clamp = (value: number, low: number, high: number): number =>
  Math.min(high, Math.max(low, value));

/** TEXT_BIBLE §2 formula. The one number the polyphonic text system reads. */
export const textStep = (state: MetaState, params: MetaParams = DEFAULT_META_PARAMS): number => {
  const { registerStepPerStack, maxTextStep } = params.tincture.numbness;
  return clamp(state.numbnessStacks * registerStepPerStack - state.vigilRestore, 0, maxTextStep);
};

/** Percent multiplier on Tincture healing from Numbness alone (never below 0). */
export const numbnessHealingPercent = (
  state: MetaState,
  params: MetaParams = DEFAULT_META_PARAMS,
): number =>
  Math.max(
    0,
    100 - params.tincture.numbness.healingPenaltyPercentPerStack * state.numbnessStacks,
  );

/** Percent multiplier on incoming Turn buildup. s11 owns the meter and reads this. */
export const turnBuildupPercent = (
  state: MetaState,
  params: MetaParams = DEFAULT_META_PARAMS,
): number =>
  100 + params.tincture.numbness.turnBuildupPercentPerStack * state.numbnessStacks;

/**
 * Scale a Tincture heal: Spirit potency first, then the Numbness penalty, each
 * floored. Integer-only so replays stay byte-stable. Ember is NOT a Tincture — it
 * is Strange Fire — and is never scaled by this (D6).
 */
export const scaleTinctureHeal = (
  base: number,
  state: MetaState,
  params: MetaParams = DEFAULT_META_PARAMS,
): number => {
  const potency = derivedAttribute(state, "spirit", params);
  const afterPotency = Math.floor((base * potency) / 100);
  return Math.floor((afterPotency * numbnessHealingPercent(state, params)) / 100);
};

/** Everything combat and the text system read back out of the mercy loop. */
export const metaModifiers = (
  state: MetaState,
  params: MetaParams = DEFAULT_META_PARAMS,
): MetaModifiers => {
  let steadyDelta = 0;
  let breathRegenPercent = 100;
  let damagePercent = 100;

  for (const effect of state.effects) {
    if (effect.delayTicks > 0) {
      continue;
    }
    steadyDelta += effect.steadyDelta;
    breathRegenPercent = Math.floor((breathRegenPercent * effect.breathRegenPercent) / 100);
    damagePercent = Math.floor((damagePercent * effect.damagePercent) / 100);
  }

  return {
    tinctureHealingPercent: Math.floor(
      (derivedAttribute(state, "spirit", params) * numbnessHealingPercent(state, params)) / 100,
    ),
    turnBuildupPercent: turnBuildupPercent(state, params),
    steadyDelta,
    breathRegenPercent,
    damagePercent,
    textStep: textStep(state, params),
  };
};
