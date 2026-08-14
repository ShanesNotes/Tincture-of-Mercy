export const AUDIO_PARAMS_VERSION = 1 as const;

export type VoiceClass = "impact" | "foley" | "vocal" | "ui" | "ambience" | "sting";

export type DuckGroup = "none" | "combat" | "ambience" | "sting" | "ui";

export type GainBus = "master" | "sfx" | "ambience";

export type CueLayer = "body" | "impact";

export type SeedPolicy = "tick" | "none";

export type WeaponClass = "hearth_iron" | "wolf" | "warden_axe";

export type AttackWeight = "light" | "heavy" | "charged";

export type SurfaceTag = "needle" | "wood" | "damp_snow" | "stone";

export type FlaskPhase = "startup" | "drink" | "recovery";

export type WolfVocal = "stalk_growl" | "lunge_snarl" | "flinch" | "death";

export type PagePhase = "drop" | "recover";

export interface CueDef {
  readonly file: string;
  readonly gain: number;
  readonly voiceClass: VoiceClass;
  readonly priority: number;
  readonly duckGroup: DuckGroup;
  readonly bus: GainBus;
  readonly layer: CueLayer;
  readonly loop: boolean;
  readonly offsetTicks: number;
  readonly hitstopTicks: number;
  readonly pitchJitterCents: number;
  readonly seedPolicy: SeedPolicy;
  readonly source: string;
}

export interface ClockParams {
  readonly driftSmooth: number;
  readonly snapThresholdSeconds: number;
  readonly impactWindowMs: number;
}

export interface ReducedFeedbackParams {
  readonly dropLayers: readonly CueLayer[];
  readonly bodyGainScale: number;
}

export interface AudioParams {
  readonly version: typeof AUDIO_PARAMS_VERSION;
  readonly tickHz: number;
  readonly hitstopTicks: {
    readonly light: number;
    readonly heavy: number;
    readonly charged: number;
    readonly blocked: number;
    readonly guard_break: number;
    readonly critical: number;
  };
  readonly onsetLeadTicks: number;
  readonly buses: { readonly master: number; readonly sfx: number; readonly ambience: number };
  readonly voiceCaps: Record<VoiceClass, number>;
  readonly ducking: Readonly<Record<string, Readonly<Record<string, number>>>>;
  readonly reducedFeedback: ReducedFeedbackParams;
  readonly clock: ClockParams;
  readonly placeholderDir: string;
  readonly bindings: Readonly<Record<string, Readonly<Record<string, readonly string[]>>>>;
  readonly cues: Readonly<Record<string, CueDef>>;
}

/**
 * Presenter-facing event union. Combat/meta slices emit structurally compatible
 * records (see fromAiEvent / fromMetaEvent). This module does not edit presenter.ts.
 */
export type AudioSourceEvent =
  | {
      readonly type: "combat.attack_whiff";
      readonly tick: number;
      readonly weaponClass: WeaponClass;
      readonly weight?: AttackWeight;
    }
  | { readonly type: "combat.hit"; readonly tick: number; readonly weight: AttackWeight }
  | { readonly type: "combat.blocked"; readonly tick: number }
  | { readonly type: "combat.guard_break"; readonly tick: number }
  | { readonly type: "combat.critical"; readonly tick: number }
  | { readonly type: "foley.footstep"; readonly tick: number; readonly surface: SurfaceTag }
  | { readonly type: "foley.roll"; readonly tick: number }
  | { readonly type: "meta.flask"; readonly tick: number; readonly phase: FlaskPhase }
  | { readonly type: "ai.wolf_vocal"; readonly tick: number; readonly vocal: WolfVocal }
  | { readonly type: "ai.howl"; readonly tick: number }
  | { readonly type: "world.tag_chime"; readonly tick: number }
  | { readonly type: "ambience.hearth"; readonly tick: number; readonly on: boolean }
  | { readonly type: "ambience.forest"; readonly tick: number; readonly on: boolean }
  | { readonly type: "ambience.wither"; readonly tick: number; readonly on: boolean }
  | { readonly type: "meta.death"; readonly tick: number }
  | { readonly type: "meta.page"; readonly tick: number; readonly phase: PagePhase }
  | { readonly type: "meta.names_bank"; readonly tick: number };

export interface ResolvedCue {
  readonly cueId: string;
  readonly cue: CueDef;
  readonly eventTick: number;
  readonly scheduleTick: number;
  readonly seed: number;
}

export interface VoiceSlot {
  readonly id: string;
  readonly cueId: string;
  readonly voiceClass: VoiceClass;
  readonly priority: number;
  readonly startedTick: number;
}

export interface ScheduledDelta {
  readonly cueId: string;
  readonly eventTick: number;
  readonly scheduleTick: number;
  readonly specAudioTime: number;
  readonly scheduledAudioTime: number;
  readonly deltaMs: number;
  readonly hitstopTicks: number;
}

export interface AudioDebugSnapshot {
  readonly unlocked: boolean;
  readonly paused: boolean;
  readonly reducedFeedback: boolean;
  readonly contextState: string;
  readonly scheduled: readonly ScheduledDelta[];
  readonly maxAbsImpactDeltaMs: number;
}
