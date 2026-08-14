/**
 * Slice s15 — the mercy loop (vial · Ember/Numbness · Names · the Open Page · save/load).
 *
 * The module is headless, pure and dependency-zero: it never imports outside
 * `src/sim/meta/` (W1-SHARED rules 3 and 4). Composition with the combat/controller
 * modules happens at integration; this file declares the whole seam.
 */

export const META_STATE_VERSION = 1 as const;

/* ------------------------------------------------------------------ identity */

export type PouchItemId =
  | "pulseleaf"
  | "arbor"
  | "acebark"
  | "phrine"
  | "cillin"
  | "zyl"
  | "honey"
  | "cedar"
  | "wool"
  | "cotton"
  | "salt"
  | "myrrh"
  | "oil"
  | "furos"
  | "ember";

export type TinctureVariantId =
  | "pulseleaf_draught"
  | "honeyed_draw"
  | "salt_wash"
  | "cedar_wool_compress"
  | "bitter_phrine";

export type AttributeId = "pulse" | "breath" | "hands" | "steady" | "spirit" | "sight";

export type BurdenBand = "light" | "medium" | "heavy";

export type NamesSourceKind = "kill" | "witness" | "notebook";

/** The boss-arena run-state machine (slice contract deliverable 6). */
export type ArenaPhase =
  | "outside"
  | "entered"
  | "inFight"
  | "victoryNoRespawn"
  | "deathReset";

export type LifePhase = "alive" | "dead";

export type ActiveEffectId =
  | "honeyed_draw"
  | "cedar_wool_compress"
  | "bitter_phrine_instability"
  | "ember_surge";

/* --------------------------------------------------------------------- stats */

/**
 * The minimal actor-stat DTO the mercy loop reads and writes. s11 owns the real
 * actor stats; integration binds its player stats to this shape. Everything the
 * Tincture cannot express (poise value, Breath regen rate, damage) is returned as
 * a modifier from {@link MetaModifiers} instead of mutated here.
 */
export interface MercyStats {
  readonly pulse: number;
  readonly maxPulse: number;
  readonly breath: number;
  readonly maxBreath: number;
  /** The Turn (Wither) buildup. s11 owns the meter; the Tincture only cleanses it. */
  readonly turn: number;
}

/** Everything the combat core and the polyphonic text system read back out. */
export interface MetaModifiers {
  /** Multiplier percent applied to Tincture healing (Numbness + Spirit potency). */
  readonly tinctureHealingPercent: number;
  /** Multiplier percent applied to incoming Turn buildup (Numbness). */
  readonly turnBuildupPercent: number;
  /** Additive Steady (poise) delta from active Tincture effects. */
  readonly steadyDelta: number;
  /** Multiplier percent applied to Breath regeneration. */
  readonly breathRegenPercent: number;
  /** Multiplier percent applied to outgoing damage (Ember surge). */
  readonly damagePercent: number;
  /** TEXT_BIBLE §2: textStep = clamp(stacks - vigilRestore, 0, 3). */
  readonly textStep: number;
}

/* -------------------------------------------------------------------- params */

export interface VialParams {
  readonly baseDoses: number;
  readonly dosesPerUpgradeTier: number;
  readonly maxUpgradeTier: number;
  readonly defaultVariant: TinctureVariantId;
  readonly upgradeCost: Readonly<Partial<Record<PouchItemId, number>>>;
}

export interface InstantVariantParams {
  readonly kind: "instant";
  readonly healPulse: number;
  readonly healBreath: number;
  readonly cleansesTurn: boolean;
}

export interface OverTimeVariantParams {
  readonly kind: "overTime";
  readonly totalHealPulse: number;
  readonly ticks: number;
  readonly intervalTicks: number;
}

export interface CleanseVariantParams {
  readonly kind: "cleanse";
  readonly healPulse: number;
  readonly cleansesTurn: boolean;
}

export interface SurgeVariantParams {
  readonly kind: "surge";
  readonly healBreath: number;
  readonly steadyDelta: number;
  readonly ticks: number;
}

export interface DeferredVariantParams {
  readonly kind: "deferred";
  readonly healPulse: number;
  readonly delayTicks: number;
  readonly windowTicks: number;
  readonly breathRegenPercent: number;
  readonly steadyDelta: number;
}

export type VariantParams =
  | InstantVariantParams
  | OverTimeVariantParams
  | CleanseVariantParams
  | SurgeVariantParams
  | DeferredVariantParams;

export interface EmberParams {
  readonly startingDoses: number;
  readonly craftable: boolean;
  readonly restoresPulseFully: boolean;
  readonly restoresBreathFully: boolean;
  readonly cleansesTurn: boolean;
  readonly surgeTicks: number;
  readonly surgeDamagePercent: number;
  readonly surgeBreathRegenPercent: number;
  readonly surgeSteadyDelta: number;
}

export interface NumbnessParams {
  readonly healingPenaltyPercentPerStack: number;
  readonly turnBuildupPercentPerStack: number;
  readonly registerStepPerStack: number;
  readonly maxTextStep: number;
  readonly maxVigilRestore: number;
}

export interface PouchParams {
  readonly items: readonly PouchItemId[];
  readonly nonCraftable: readonly PouchItemId[];
  readonly starting: Readonly<Record<PouchItemId, number>>;
}

export interface TinctureParams {
  readonly version: number;
  readonly vial: VialParams;
  readonly variants: Readonly<Record<TinctureVariantId, VariantParams>>;
  readonly ember: EmberParams;
  readonly numbness: NumbnessParams;
  readonly pouch: PouchParams;
  readonly recipes: Readonly<Record<TinctureVariantId, Readonly<Partial<Record<PouchItemId, number>>>>>;
}

export interface CurveSegment {
  readonly toPoints: number;
  readonly perPoint: number;
}

export interface AttributeCurve {
  readonly unit: string;
  readonly base: number;
  readonly segments: readonly CurveSegment[];
}

export interface LevelParams {
  readonly costBase: number;
  readonly costLinear: number;
  readonly costQuad: number;
  readonly maxPointsPerAttribute: number;
}

export interface NamesParams {
  readonly awards: Readonly<Record<NamesSourceKind, Readonly<Record<string, number>>>>;
}

export interface BurdenParams {
  readonly capacityBase: number;
  readonly capacityPerSteadyPoint: number;
  readonly lightMaxPercent: number;
  readonly mediumMaxPercent: number;
}

export interface ProgressionParams {
  readonly version: number;
  readonly attributes: Readonly<Record<AttributeId, AttributeCurve>>;
  readonly level: LevelParams;
  readonly names: NamesParams;
  readonly burden: BurdenParams;
  readonly openPage: { readonly recoveryRadiusM: number };
  readonly respawn: { readonly bossEnemyIds: readonly string[] };
}

export interface MetaParams {
  readonly tincture: TinctureParams;
  readonly progression: ProgressionParams;
}

/* --------------------------------------------------------------------- state */

export interface VialState {
  readonly doses: number;
  readonly upgradeTier: number;
  readonly variant: TinctureVariantId;
}

/** A drink that has started but not yet reached its drink tick (s11 owns the clip). */
export interface PendingUse {
  readonly kind: "tincture" | "ember";
  readonly variant: TinctureVariantId | null;
}

export interface ActiveEffect {
  readonly id: ActiveEffectId;
  /** Ticks before the effect becomes active (Bitter Phrine's deferred window). */
  readonly delayTicks: number;
  readonly remainingTicks: number;
  /** Over-time healing: already scaled by potency and Numbness at drink time. */
  readonly healPerPulse: number;
  readonly ticksToNextPulse: number;
  readonly intervalTicks: number;
  readonly steadyDelta: number;
  readonly breathRegenPercent: number;
  readonly damagePercent: number;
}

export interface NamesState {
  /** Accrued but not yet written into the notebook — these drop at the death site. */
  readonly carried: number;
  /** Written into the notebook at a Hearth — safe, and the only pool levels spend. */
  readonly banked: number;
  /** Total attribute points already written (drives the level cost curve). */
  readonly spent: number;
  readonly attributes: Readonly<Record<AttributeId, number>>;
}

export interface WorldPosition {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface OpenPageState {
  readonly names: number;
  readonly position: WorldPosition;
  readonly droppedAtTick: number;
}

export interface MetaState {
  readonly version: typeof META_STATE_VERSION;
  readonly tick: number;
  readonly vial: VialState;
  readonly pouch: Readonly<Record<PouchItemId, number>>;
  readonly numbnessStacks: number;
  readonly vigilRestore: number;
  readonly pending: PendingUse | null;
  readonly effects: readonly ActiveEffect[];
  readonly names: NamesState;
  readonly gearWeight: number;
  readonly openPage: OpenPageState | null;
  readonly life: LifePhase;
  readonly arena: ArenaPhase;
  /** Enemy ids defeated since the last Hearth rest, kept sorted for determinism. */
  readonly defeated: readonly string[];
  readonly atHearth: boolean;
  readonly lastHearthId: string | null;
}
