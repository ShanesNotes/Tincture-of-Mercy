/**
 * The vial — Anna's medicine (D6, PRD R6, TUNING_V0 § Tincture).
 *
 * Committed-use flow. The drink clip's frame data belongs to s11; this module owns
 * charge accounting and effect application. The interruption rule shipped here is
 * **dose-consumed-at-drink-tick**: `beginUse` only reserves the action, the dose is
 * decremented in `commitUse` (called by the combat action clock on the drink tick),
 * and `cancelUse` before that tick costs nothing. A player staggered out of the
 * wind-up keeps the dose; a player staggered after the swallow does not.
 *
 * Ember is in the same pouch (slot 15) but is not a Tincture: it is never scaled by
 * Numbness, it cannot be crafted, and each dose adds a permanent Numbness stack.
 */

import { DEFAULT_META_PARAMS } from "./data";
import type { MetaEvent, MetaStatsResult } from "./events";
import { scaleTinctureHeal, textStep } from "./numbness";
import type {
  ActiveEffect,
  MercyStats,
  MetaParams,
  MetaState,
  PouchItemId,
  TinctureVariantId,
  VariantParams,
} from "./types";

const clampStats = (stats: MercyStats): MercyStats => ({
  ...stats,
  pulse: Math.min(stats.maxPulse, Math.max(0, stats.pulse)),
  breath: Math.min(stats.maxBreath, Math.max(0, stats.breath)),
  turn: Math.max(0, stats.turn),
});

const withEffect = (
  effects: readonly ActiveEffect[],
  effect: ActiveEffect,
): readonly ActiveEffect[] => [...effects.filter((e) => e.id !== effect.id), effect];

const neutralEffect = (id: ActiveEffect["id"], remainingTicks: number): ActiveEffect => ({
  id,
  delayTicks: 0,
  remainingTicks,
  healPerPulse: 0,
  ticksToNextPulse: 0,
  intervalTicks: 0,
  steadyDelta: 0,
  breathRegenPercent: 100,
  damagePercent: 100,
});

/* ------------------------------------------------------------------ the vial */

export const maxDoses = (state: MetaState, params: MetaParams = DEFAULT_META_PARAMS): number => {
  const { baseDoses, dosesPerUpgradeTier } = params.tincture.vial;
  return baseDoses + dosesPerUpgradeTier * state.vial.upgradeTier;
};

/** Hearth refill — the doses are drawn again (D6: renewed at each Hearth). */
export const refillVial = (
  state: MetaState,
  params: MetaParams = DEFAULT_META_PARAMS,
): MetaState => ({ ...state, vial: { ...state.vial, doses: maxDoses(state, params) } });

const hasIngredients = (
  state: MetaState,
  cost: Readonly<Partial<Record<PouchItemId, number>>>,
): boolean =>
  Object.entries(cost).every(
    ([item, count]) => state.pouch[item as PouchItemId] >= (count ?? 0),
  );

const spendIngredients = (
  state: MetaState,
  cost: Readonly<Partial<Record<PouchItemId, number>>>,
): Readonly<Record<PouchItemId, number>> => {
  const pouch = { ...state.pouch };
  for (const [item, count] of Object.entries(cost)) {
    pouch[item as PouchItemId] -= count ?? 0;
  }
  return pouch;
};

/**
 * The Tincture Wheel: combine pouch ingredients into one of the five canon
 * variants. Hearth work only. The vial's whole draw is prepared as that variant.
 */
export const craftVariant = (
  state: MetaState,
  variant: TinctureVariantId,
  params: MetaParams = DEFAULT_META_PARAMS,
): MetaState => {
  const recipe = params.tincture.recipes[variant];
  if (!state.atHearth || !hasIngredients(state, recipe)) {
    return state;
  }
  return {
    ...state,
    pouch: spendIngredients(state, recipe),
    vial: { ...state.vial, variant },
  };
};

/** Hearth upgrade tier: +1 dose per tier, paid in pouch materials. */
export const upgradeVial = (
  state: MetaState,
  params: MetaParams = DEFAULT_META_PARAMS,
): MetaState => {
  const { maxUpgradeTier, upgradeCost } = params.tincture.vial;
  if (
    !state.atHearth ||
    state.vial.upgradeTier >= maxUpgradeTier ||
    !hasIngredients(state, upgradeCost)
  ) {
    return state;
  }
  return {
    ...state,
    pouch: spendIngredients(state, upgradeCost),
    vial: { ...state.vial, upgradeTier: state.vial.upgradeTier + 1 },
  };
};

/* --------------------------------------------------------------- the drinking */

/** Reserve a drink. No dose is spent until the drink tick. */
export const beginTinctureUse = (state: MetaState): MetaState =>
  state.pending !== null || state.vial.doses <= 0
    ? state
    : { ...state, pending: { kind: "tincture", variant: state.vial.variant } };

/** Reserve an Ember swallow. Ember is counted in the pouch, slot 15. */
export const beginEmberUse = (state: MetaState): MetaState =>
  state.pending !== null || state.pouch.ember <= 0
    ? state
    : { ...state, pending: { kind: "ember", variant: null } };

/** Interrupted before the drink tick — the dose survives. */
export const cancelUse = (state: MetaState): MetaState =>
  state.pending === null ? state : { ...state, pending: null };

const applyVariant = (
  state: MetaState,
  stats: MercyStats,
  variant: VariantParams,
  params: MetaParams,
): { readonly state: MetaState; readonly stats: MercyStats; readonly healedPulse: number } => {
  switch (variant.kind) {
    case "instant": {
      const healed = scaleTinctureHeal(variant.healPulse, state, params);
      return {
        state,
        stats: clampStats({
          ...stats,
          pulse: stats.pulse + healed,
          breath: stats.breath + scaleTinctureHeal(variant.healBreath, state, params),
          turn: variant.cleansesTurn ? 0 : stats.turn,
        }),
        healedPulse: healed,
      };
    }
    case "cleanse": {
      const healed = scaleTinctureHeal(variant.healPulse, state, params);
      return {
        state,
        stats: clampStats({
          ...stats,
          pulse: stats.pulse + healed,
          turn: variant.cleansesTurn ? 0 : stats.turn,
        }),
        healedPulse: healed,
      };
    }
    case "overTime": {
      const pulses = variant.ticks / variant.intervalTicks;
      const healPerPulse = Math.floor(
        scaleTinctureHeal(variant.totalHealPulse, state, params) / pulses,
      );
      const effect: ActiveEffect = {
        ...neutralEffect("honeyed_draw", variant.ticks),
        healPerPulse,
        ticksToNextPulse: variant.intervalTicks,
        intervalTicks: variant.intervalTicks,
      };
      return {
        state: { ...state, effects: withEffect(state.effects, effect) },
        stats,
        healedPulse: 0,
      };
    }
    case "surge": {
      const effect: ActiveEffect = {
        ...neutralEffect("cedar_wool_compress", variant.ticks),
        steadyDelta: variant.steadyDelta,
      };
      return {
        state: { ...state, effects: withEffect(state.effects, effect) },
        stats: clampStats({
          ...stats,
          breath: stats.breath + scaleTinctureHeal(variant.healBreath, state, params),
        }),
        healedPulse: 0,
      };
    }
    case "deferred": {
      const healed = scaleTinctureHeal(variant.healPulse, state, params);
      const effect: ActiveEffect = {
        ...neutralEffect("bitter_phrine_instability", variant.windowTicks),
        delayTicks: variant.delayTicks,
        steadyDelta: variant.steadyDelta,
        breathRegenPercent: variant.breathRegenPercent,
      };
      return {
        state: { ...state, effects: withEffect(state.effects, effect) },
        stats: clampStats({ ...stats, pulse: stats.pulse + healed }),
        healedPulse: healed,
      };
    }
  }
};

const commitTincture = (
  state: MetaState,
  stats: MercyStats,
  variantId: TinctureVariantId,
  params: MetaParams,
): MetaStatsResult => {
  const applied = applyVariant(state, stats, params.tincture.variants[variantId], params);
  const dosesLeft = state.vial.doses - 1;
  const next: MetaState = {
    ...applied.state,
    pending: null,
    vial: { ...applied.state.vial, doses: dosesLeft },
  };
  return {
    state: next,
    stats: applied.stats,
    events: [
      {
        type: "dose-used",
        tick: next.tick,
        variant: variantId,
        dosesLeft,
        healedPulse: applied.healedPulse,
      },
    ],
  };
};

const commitEmber = (
  state: MetaState,
  stats: MercyStats,
  params: MetaParams,
): MetaStatsResult => {
  const ember = params.tincture.ember;
  const dosesLeft = state.pouch.ember - 1;
  const surge: ActiveEffect = {
    ...neutralEffect("ember_surge", ember.surgeTicks),
    steadyDelta: ember.surgeSteadyDelta,
    breathRegenPercent: ember.surgeBreathRegenPercent,
    damagePercent: ember.surgeDamagePercent,
  };
  const next: MetaState = {
    ...state,
    pending: null,
    pouch: { ...state.pouch, ember: dosesLeft },
    numbnessStacks: state.numbnessStacks + 1,
    effects: withEffect(state.effects, surge),
  };
  const events: readonly MetaEvent[] = [
    { type: "ember-used", tick: next.tick, dosesLeft, numbnessStacks: next.numbnessStacks },
    {
      type: "numbness-changed",
      tick: next.tick,
      stacks: next.numbnessStacks,
      textStep: textStep(next, params),
    },
  ];

  return {
    state: next,
    stats: clampStats({
      ...stats,
      pulse: ember.restoresPulseFully ? stats.maxPulse : stats.pulse,
      breath: ember.restoresBreathFully ? stats.maxBreath : stats.breath,
      turn: ember.cleansesTurn ? 0 : stats.turn,
    }),
    events,
  };
};

/**
 * The drink tick. Charges are spent here and nowhere else.
 * Called by the combat action clock at the frame-data drink tick.
 */
export const commitUse = (
  state: MetaState,
  stats: MercyStats,
  params: MetaParams = DEFAULT_META_PARAMS,
): MetaStatsResult => {
  const pending = state.pending;
  if (pending === null) {
    return { state, stats, events: [] };
  }
  if (pending.kind === "ember") {
    return state.pouch.ember <= 0
      ? { state: { ...state, pending: null }, stats, events: [] }
      : commitEmber(state, stats, params);
  }
  // The variant reserved at the wind-up is the variant swallowed.
  return state.vial.doses <= 0 || pending.variant === null
    ? { state: { ...state, pending: null }, stats, events: [] }
    : commitTincture(state, stats, pending.variant, params);
};

/* ------------------------------------------------------------------- effects */

/** Advance every active effect by one tick, delivering over-time healing. */
export const stepEffects = (
  state: MetaState,
  stats: MercyStats,
): { readonly state: MetaState; readonly stats: MercyStats } => {
  if (state.effects.length === 0) {
    return { state, stats };
  }

  const kept: ActiveEffect[] = [];
  let healed = 0;

  for (const effect of state.effects) {
    if (effect.delayTicks > 0) {
      kept.push({ ...effect, delayTicks: effect.delayTicks - 1 });
      continue;
    }

    let ticksToNextPulse = effect.ticksToNextPulse;
    if (effect.healPerPulse > 0) {
      ticksToNextPulse -= 1;
      if (ticksToNextPulse <= 0) {
        healed += effect.healPerPulse;
        ticksToNextPulse = effect.intervalTicks;
      }
    }

    const remainingTicks = effect.remainingTicks - 1;
    if (remainingTicks > 0) {
      kept.push({ ...effect, remainingTicks, ticksToNextPulse });
    }
  }

  return {
    state: { ...state, effects: kept },
    stats: healed === 0 ? stats : clampStats({ ...stats, pulse: stats.pulse + healed }),
  };
};

/** Hearth rest and death both clear the transient effects the vial left behind. */
export const clearEffects = (state: MetaState): MetaState =>
  state.effects.length === 0 ? state : { ...state, effects: [] };
