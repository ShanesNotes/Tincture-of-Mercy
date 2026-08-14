export interface BreathState {
  readonly value: number;
  readonly max: number;
  readonly ticksSinceSpend: number;
}

export interface BreathSpendResult {
  readonly state: BreathState;
  readonly spent: boolean;
}

export interface BreathRegenParams {
  readonly regenPerSecond: number;
  readonly ticksPerSecond: number;
  readonly regenDelayTicks: number;
  readonly guardingMultiplier: number;
}

export interface SteadyState {
  readonly buildup: number;
  readonly cleanTicks: number;
}

export interface SteadyOutcomeBands {
  readonly flinch: number;
  readonly stagger: number;
  readonly knockdown: number;
}

export type SteadyOutcome = "none" | "flinch" | "stagger" | "knockdown";
export type SteadyDamageType =
  | "standard"
  | "strike"
  | "pierce"
  | "slash"
  | "wither";

export interface SteadyHitParams {
  readonly bands: SteadyOutcomeBands;
  readonly witherMultiplier: number;
  readonly hyperarmorBonus: number;
}

export interface SteadyHitResult {
  readonly state: SteadyState;
  readonly appliedBuildup: number;
  readonly outcome: SteadyOutcome;
}

export interface ResourceTickWindow {
  readonly startTick: number;
  readonly endTickExclusive: number;
}

const assertFiniteNonNegative = (value: number, label: string): void => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be finite and non-negative.`);
  }
};

const assertNonNegativeSafeInteger = (value: number, label: string): void => {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative safe integer.`);
  }
};

const assertBreathState = (state: BreathState): void => {
  assertFiniteNonNegative(state.max, "Maximum Breath");
  assertFiniteNonNegative(state.value, "Current Breath");
  assertNonNegativeSafeInteger(state.ticksSinceSpend, "Ticks since Breath spend");
  if (state.value > state.max) {
    throw new Error("Current Breath cannot exceed maximum Breath.");
  }
};

const assertBreathParams = (params: BreathRegenParams): void => {
  assertFiniteNonNegative(params.regenPerSecond, "Breath regen rate");
  assertFiniteNonNegative(params.guardingMultiplier, "Guarding regen multiplier");
  assertNonNegativeSafeInteger(params.regenDelayTicks, "Breath regen delay");
  if (!Number.isFinite(params.ticksPerSecond) || params.ticksPerSecond <= 0) {
    throw new Error("Simulation tick rate must be finite and positive.");
  }
};

const assertSteadyState = (state: SteadyState): void => {
  assertFiniteNonNegative(state.buildup, "Steady buildup");
  assertNonNegativeSafeInteger(state.cleanTicks, "Steady clean ticks");
};

const assertOutcomeBands = (bands: SteadyOutcomeBands): void => {
  assertFiniteNonNegative(bands.flinch, "Flinch threshold");
  assertFiniteNonNegative(bands.stagger, "Stagger threshold");
  assertFiniteNonNegative(bands.knockdown, "Knockdown threshold");
  if (bands.flinch > bands.stagger || bands.stagger > bands.knockdown) {
    throw new Error("Steady outcome bands must be ordered.");
  }
};

export const trySpendBreath = (
  state: BreathState,
  cost: number,
): BreathSpendResult => {
  assertBreathState(state);
  assertFiniteNonNegative(cost, "Breath cost");
  if (cost > state.value) {
    return { state, spent: false };
  }
  if (cost === 0) {
    return { state, spent: true };
  }
  return {
    state: {
      ...state,
      value: state.value - cost,
      ticksSinceSpend: 0,
    },
    spent: true,
  };
};

export const tickBreathRegen = (
  state: BreathState,
  params: BreathRegenParams,
  guarding: boolean,
): BreathState => {
  assertBreathState(state);
  assertBreathParams(params);
  const ticksSinceSpend = state.ticksSinceSpend + 1;
  assertNonNegativeSafeInteger(ticksSinceSpend, "Advanced Breath clean ticks");
  if (ticksSinceSpend < params.regenDelayTicks || state.value === state.max) {
    return { ...state, ticksSinceSpend };
  }

  const multiplier = guarding ? params.guardingMultiplier : 1;
  const regenerated =
    (params.regenPerSecond / params.ticksPerSecond) * multiplier;
  return {
    ...state,
    value: Math.min(state.max, state.value + regenerated),
    ticksSinceSpend,
  };
};

export const tickSteadyReset = (
  state: SteadyState,
  resetAfterCleanTicks: number,
): SteadyState => {
  assertSteadyState(state);
  assertNonNegativeSafeInteger(resetAfterCleanTicks, "Steady reset delay");
  const cleanTicks = Math.min(resetAfterCleanTicks, state.cleanTicks + 1);
  return {
    buildup: cleanTicks >= resetAfterCleanTicks ? 0 : state.buildup,
    cleanTicks,
  };
};

export const resolveSteadyOutcome = (
  buildup: number,
  bands: SteadyOutcomeBands,
  hyperarmorBonus: number,
): SteadyOutcome => {
  assertFiniteNonNegative(buildup, "Steady buildup");
  assertOutcomeBands(bands);
  assertFiniteNonNegative(hyperarmorBonus, "Hyperarmor bonus");
  if (buildup >= bands.knockdown + hyperarmorBonus) {
    return "knockdown";
  }
  if (buildup >= bands.stagger + hyperarmorBonus) {
    return "stagger";
  }
  if (buildup >= bands.flinch + hyperarmorBonus) {
    return "flinch";
  }
  return "none";
};

export const applySteadyHit = (
  state: SteadyState,
  baseBuildup: number,
  damageType: SteadyDamageType,
  params: SteadyHitParams,
): SteadyHitResult => {
  assertSteadyState(state);
  assertFiniteNonNegative(baseBuildup, "Base Steady buildup");
  assertFiniteNonNegative(params.witherMultiplier, "Wither buildup multiplier");
  const appliedBuildup =
    damageType === "wither"
      ? baseBuildup * params.witherMultiplier
      : baseBuildup;
  const nextState =
    appliedBuildup === 0
      ? state
      : { buildup: state.buildup + appliedBuildup, cleanTicks: 0 };
  return {
    state: nextState,
    appliedBuildup,
    outcome: resolveSteadyOutcome(
      nextState.buildup,
      params.bands,
      params.hyperarmorBonus,
    ),
  };
};

export const isHyperarmorActive = (
  actionTick: number,
  window: ResourceTickWindow,
): boolean => {
  assertNonNegativeSafeInteger(actionTick, "Action tick");
  assertNonNegativeSafeInteger(window.startTick, "Hyperarmor start tick");
  assertNonNegativeSafeInteger(
    window.endTickExclusive,
    "Hyperarmor end tick",
  );
  if (window.endTickExclusive < window.startTick) {
    throw new Error("Hyperarmor window end cannot precede its start.");
  }
  return actionTick >= window.startTick && actionTick < window.endTickExclusive;
};
