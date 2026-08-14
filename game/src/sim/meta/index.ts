/**
 * s15 — the mercy loop. Public surface of `src/sim/meta`.
 *
 * Headless and composable: the module owns its own state DTO and never touches
 * `src/sim/state.ts` (W1-SHARED rule 3). Integration composes it beside the combat
 * and controller modules, feeding it the player's stats DTO and reading back
 * {@link metaModifiers} plus the typed event stream.
 */

import { arenaOnRespawn } from "./arena";
import { DEFAULT_META_PARAMS } from "./data";
import type { MetaEvent, MetaResult, MetaStatsResult } from "./events";
import { textStep } from "./numbness";
import { respawnEnemies } from "./openPage";
import { ATTRIBUTE_IDS, derivedAttribute } from "./progression";
import { clearEffects, refillVial, stepEffects } from "./tincture";
import { META_STATE_VERSION } from "./types";
import type { AttributeId, MercyStats, MetaParams, MetaState } from "./types";

export * from "./arena";
export * from "./data";
export * from "./events";
export * from "./numbness";
export * from "./openPage";
export * from "./progression";
export * from "./save";
export * from "./tincture";
export * from "./types";

const zeroedAttributes = (): Record<AttributeId, number> => {
  const attributes = {} as Record<AttributeId, number>;
  for (const id of ATTRIBUTE_IDS) {
    attributes[id] = 0;
  }
  return attributes;
};

export const createMetaState = (params: MetaParams = DEFAULT_META_PARAMS): MetaState => ({
  version: META_STATE_VERSION,
  tick: 0,
  vial: {
    doses: params.tincture.vial.baseDoses,
    upgradeTier: 0,
    variant: params.tincture.vial.defaultVariant,
  },
  pouch: { ...params.tincture.pouch.starting },
  numbnessStacks: 0,
  vigilRestore: 0,
  pending: null,
  effects: [],
  names: { carried: 0, banked: 0, spent: 0, attributes: zeroedAttributes() },
  gearWeight: 0,
  openPage: null,
  life: "alive",
  arena: "outside",
  defeated: [],
  atHearth: false,
  lastHearthId: null,
});

/** A full-health stats DTO derived from the current attributes. */
export const createMercyStats = (
  state: MetaState,
  params: MetaParams = DEFAULT_META_PARAMS,
): MercyStats => {
  const maxPulse = derivedAttribute(state, "pulse", params);
  const maxBreath = derivedAttribute(state, "breath", params);
  return { pulse: maxPulse, maxPulse, breath: maxBreath, maxBreath, turn: 0 };
};

const numbnessEvents = (
  before: MetaState,
  after: MetaState,
  params: MetaParams,
): readonly MetaEvent[] => {
  const step = textStep(after, params);
  return textStep(before, params) === step
    ? []
    : [
        {
          type: "numbness-changed",
          tick: after.tick,
          stacks: after.numbnessStacks,
          textStep: step,
        },
      ];
};

/** One sim tick of the mercy loop: advance the clock, run the vial's effects. */
export const stepMeta = (state: MetaState, stats: MercyStats): MetaStatsResult => {
  const stepped = stepEffects({ ...state, tick: state.tick + 1 }, stats);
  return { state: stepped.state, stats: stepped.stats, events: [] };
};

export const arriveAtHearth = (state: MetaState, hearthId: string): MetaState => ({
  ...state,
  atHearth: true,
  lastHearthId: hearthId,
});

export const leaveHearth = (state: MetaState): MetaState =>
  state.atHearth ? { ...state, atHearth: false } : state;

/**
 * First hostile contact after leaving the Hearth. The vigil's partial restoration
 * of the world's language ends here (TEXT_BIBLE §2) — the stacks themselves never do.
 */
export const hostileContact = (
  state: MetaState,
  params: MetaParams = DEFAULT_META_PARAMS,
): MetaResult => {
  if (state.vigilRestore === 0 && !state.atHearth) {
    return { state, events: [] };
  }
  const next: MetaState = { ...state, vigilRestore: 0, atHearth: false };
  return { state: next, events: numbnessEvents(state, next, params) };
};

/**
 * Keeping vigil: doses drawn again, wounds closed, the Turn washed out, the
 * standard enemies returned, and some of the words came back.
 */
export const hearthRest = (
  state: MetaState,
  stats: MercyStats,
  hearthId: string,
  params: MetaParams = DEFAULT_META_PARAMS,
): MetaStatsResult => {
  const rested: MetaState = {
    ...respawnEnemies(clearEffects(refillVial(state, params)), params),
    life: "alive",
    pending: null,
    atHearth: true,
    lastHearthId: hearthId,
    vigilRestore: params.tincture.numbness.maxVigilRestore,
  };

  const events: MetaEvent[] = [
    {
      type: "hearth-rested",
      tick: rested.tick,
      hearthId,
      doses: rested.vial.doses,
    },
    ...numbnessEvents(state, rested, params),
  ];

  return {
    state: rested,
    stats: { ...stats, pulse: stats.maxPulse, breath: stats.maxBreath, turn: 0 },
    events,
  };
};

/** Death → respawn: the fire held, you did not. Resets the arena, then rests. */
export const respawnAtHearth = (
  state: MetaState,
  stats: MercyStats,
  hearthId: string,
  params: MetaParams = DEFAULT_META_PARAMS,
): MetaStatsResult =>
  state.life === "dead"
    ? hearthRest(arenaOnRespawn(state), stats, hearthId, params)
    : { state, stats, events: [] };
