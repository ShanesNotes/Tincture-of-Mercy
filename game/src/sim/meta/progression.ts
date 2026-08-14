/**
 * Names, attributes and Burden (D6, PRD R5).
 *
 * Names accrue as `carried` from kill / witness / notebook events. Carried Names are
 * what the Open Page drops. Writing them into the notebook at a Hearth banks them,
 * and only banked Names buy attribute points ("Attributes are spent from banked
 * Names at Hearths" — D6).
 */

import { DEFAULT_META_PARAMS } from "./data";
import type { MetaEvent, MetaResult } from "./events";
import type {
  AttributeCurve,
  AttributeId,
  BurdenBand,
  MetaParams,
  MetaState,
  NamesSourceKind,
  ProgressionParams,
} from "./types";

export const ATTRIBUTE_IDS: readonly AttributeId[] = [
  "pulse",
  "breath",
  "hands",
  "steady",
  "spirit",
  "sight",
];

/** Piecewise-linear attribute curve from `progression_params.json`. Integer by construction. */
export const attributeValue = (points: number, curve: AttributeCurve): number => {
  let value = curve.base;
  let previous = 0;
  for (const segment of curve.segments) {
    value += Math.max(0, Math.min(points, segment.toPoints) - previous) * segment.perPoint;
    previous = segment.toPoints;
  }
  return value;
};

/** The derived value of one attribute in the unit declared by its curve. */
export const derivedAttribute = (
  state: MetaState,
  attribute: AttributeId,
  params: MetaParams = DEFAULT_META_PARAMS,
): number =>
  attributeValue(state.names.attributes[attribute], params.progression.attributes[attribute]);

/** Cost in Names of the next attribute point, given the points already written. */
export const levelCost = (spent: number, progression: ProgressionParams): number => {
  const { costBase, costLinear, costQuad } = progression.level;
  return costBase + costLinear * spent + costQuad * spent * spent;
};

/** Cost of the next point for this state. */
export const nextLevelCost = (
  state: MetaState,
  params: MetaParams = DEFAULT_META_PARAMS,
): number => levelCost(state.names.spent, params.progression);

const namesEvent = (state: MetaState, delta: number): MetaEvent => ({
  type: "names-changed",
  tick: state.tick,
  delta,
  carried: state.names.carried,
  banked: state.names.banked,
});

/**
 * Accrue Names from a witnessed outcome. Unknown source ids are a programming
 * error and throw — the award table is data and must stay complete.
 */
export const awardNames = (
  state: MetaState,
  kind: NamesSourceKind,
  sourceId: string,
  params: MetaParams = DEFAULT_META_PARAMS,
): MetaResult => {
  const amount = params.progression.names.awards[kind][sourceId];
  if (amount === undefined) {
    throw new Error(`Unknown Names award: ${kind}.${sourceId}`);
  }
  if (amount === 0) {
    return { state, events: [] };
  }

  const next: MetaState = {
    ...state,
    names: { ...state.names, carried: state.names.carried + amount },
  };
  return { state: next, events: [namesEvent(next, amount)] };
};

/** Write the carried Names into the notebook. Hearth work only (D6). */
export const bankNames = (state: MetaState): MetaResult => {
  if (!state.atHearth || state.names.carried === 0) {
    return { state, events: [] };
  }

  const delta = state.names.carried;
  const next: MetaState = {
    ...state,
    names: { ...state.names, carried: 0, banked: state.names.banked + delta },
  };
  return { state: next, events: [namesEvent(next, 0)] };
};

/** Spend banked Names on one attribute point. Hearth work only. */
export const spendNames = (
  state: MetaState,
  attribute: AttributeId,
  params: MetaParams = DEFAULT_META_PARAMS,
): MetaResult => {
  const cost = nextLevelCost(state, params);
  const atCap =
    state.names.attributes[attribute] >= params.progression.level.maxPointsPerAttribute;
  if (!state.atHearth || atCap || state.names.banked < cost) {
    return { state, events: [] };
  }

  const next: MetaState = {
    ...state,
    names: {
      ...state.names,
      banked: state.names.banked - cost,
      spent: state.names.spent + 1,
      attributes: {
        ...state.names.attributes,
        [attribute]: state.names.attributes[attribute] + 1,
      },
    },
  };
  return { state: next, events: [namesEvent(next, -cost)] };
};

/* -------------------------------------------------------------------- Burden */

export const burdenCapacity = (
  state: MetaState,
  params: MetaParams = DEFAULT_META_PARAMS,
): number => {
  const { capacityBase, capacityPerSteadyPoint } = params.progression.burden;
  return capacityBase + capacityPerSteadyPoint * state.names.attributes.steady;
};

/** Set the total weight of equipped gear (D6: Burden is derived from gear). */
export const setGearWeight = (state: MetaState, gearWeight: number): MetaState => ({
  ...state,
  gearWeight,
});

/**
 * Burden band, TUNING_V0 § Movement & defense verbatim:
 * Light (<30%) · Medium (30-70%) · Heavy (>70%). Compared as integers so a load
 * sitting exactly on a threshold never rounds into the wrong band.
 */
export const burdenBand = (
  state: MetaState,
  params: MetaParams = DEFAULT_META_PARAMS,
): BurdenBand => {
  const capacity = burdenCapacity(state, params);
  const { lightMaxPercent, mediumMaxPercent } = params.progression.burden;
  const scaled = state.gearWeight * 100;
  if (scaled < capacity * lightMaxPercent) {
    return "light";
  }
  return scaled <= capacity * mediumMaxPercent ? "medium" : "heavy";
};
