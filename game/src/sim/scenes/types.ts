/**
 * Staged-scene DTOs. The module owns this state (W1-SHARED rule 3) and never
 * touches `src/sim/state.ts`. View later reads {@link ScenePresentation}.
 */

export const SCENE_STATE_VERSION = 1 as const;

export type InterruptPolicy = "none";

export type VerbOrder = "fixed" | "free" | "choice";

export type NamesKind = "kill" | "witness" | "notebook";

export interface CombatEngagement {
  /** True while a combat engagement is live. Integration binds this flag. */
  readonly engaged: boolean;
}

export interface SevenSlotComposition {
  readonly field: string;
  readonly axis: string;
  readonly threshold: string;
  readonly witness: string;
  readonly light: string;
  readonly memory: string;
  readonly border: string;
}

export interface SceneExit {
  readonly allVerbsApplied?: boolean;
  readonly afterAnyVerb?: boolean;
  readonly afterTicks?: number;
}

export type SceneOpEvent =
  | { readonly type: "teach-flag"; readonly flag: string }
  | { readonly type: "notebook-line"; readonly textKey: string }
  | { readonly type: "dose-prepared" }
  | { readonly type: "hud-border-wake" }
  | { readonly type: "hud-border-state"; readonly state: string }
  | { readonly type: "hearth-dim" }
  | { readonly type: "hearth-arrive" }
  | { readonly type: "hearth-rest-request" }
  | { readonly type: "hearth-refill-request" }
  | { readonly type: "hearth-respawn-request" }
  | { readonly type: "hearth-bank-request" }
  | { readonly type: "hearth-level-request" }
  | { readonly type: "hearth-craft-request" }
  | { readonly type: "hearth-leave" }
  | { readonly type: "names-witness"; readonly kind: NamesKind; readonly sourceId: string }
  | { readonly type: "vial-inherited" }
  | { readonly type: "item-reveal-request"; readonly itemId: string }
  | { readonly type: "item-revealed" }
  | { readonly type: "ceremony-started" }
  | { readonly type: "ceremony-ended" }
  | { readonly type: "invulnerable-hold" }
  | { readonly type: "turn-cleanse-request" }
  | { readonly type: "arena-hearth-light"; readonly hearthId: string }
  | { readonly type: "unwritten-mark"; readonly set: number }
  | { readonly type: "caleb-misname" }
  | { readonly type: "slice-exit" };

export interface VerbEffect {
  readonly textKeys?: readonly string[];
  readonly textFromItem?: boolean;
  readonly flags?: Readonly<Record<string, number>>;
  readonly addFlags?: Readonly<Record<string, number>>;
  readonly events?: readonly SceneOpEvent[];
}

export interface SceneStep {
  readonly id: string;
  readonly stagedAnchorId: string | null;
  readonly propAnchorId?: string;
  readonly verbs: readonly string[];
  readonly verbOrder: VerbOrder;
  readonly interrupt: InterruptPolicy;
  readonly exit: SceneExit;
  readonly verbEffects: Readonly<Record<string, VerbEffect>>;
  readonly onEnter?: VerbEffect;
  readonly onExit?: VerbEffect;
}

export interface ItemTextBinding {
  readonly textKeys: readonly string[];
}

export interface SceneParams {
  readonly ceremonyHoldTicks: number;
  readonly ceremonyPulsePercent: number;
  readonly hearthDimPercent: number;
  readonly hearthDimRampSteps: number;
  readonly annaStartingDoses: number;
  readonly stagedFovDegrees: number;
  readonly items: Readonly<Record<string, ItemTextBinding>>;
}

export interface SceneScript {
  readonly id: string;
  readonly beat: number | string;
  readonly registerLocked: boolean;
  readonly repeatable: boolean;
  readonly interrupt: InterruptPolicy;
  readonly composition: SevenSlotComposition | null;
  readonly steps: readonly SceneStep[];
}

export interface SceneCatalog {
  readonly params: SceneParams;
  readonly scripts: Readonly<Record<string, SceneScript>>;
}

export interface EnterContext {
  readonly itemId?: string;
  readonly hearthId?: string;
}

export interface ActiveScene {
  readonly scriptId: string;
  readonly stepIndex: number;
  readonly ticksInStep: number;
  readonly ticksInScene: number;
  readonly appliedVerbs: readonly string[];
  readonly textKeys: readonly string[];
  readonly itemId: string | null;
  readonly hearthId: string | null;
}

export interface SceneState {
  readonly version: typeof SCENE_STATE_VERSION;
  readonly tick: number;
  readonly active: ActiveScene | null;
  readonly flags: Readonly<Record<string, number>>;
  readonly completed: readonly string[];
}

export interface ScenePresentation {
  readonly scriptId: string | null;
  readonly stepId: string | null;
  readonly stagedAnchorId: string | null;
  readonly propAnchorId: string | null;
  readonly availableVerbs: readonly string[];
  readonly textKeys: readonly string[];
  readonly registerLocked: boolean;
  readonly flags: Readonly<Record<string, number>>;
  readonly titleCard: false;
}

export type SceneEvent =
  | { readonly type: "scene-entered"; readonly tick: number; readonly scriptId: string; readonly anchorId: string | null }
  | { readonly type: "scene-exited"; readonly tick: number; readonly scriptId: string }
  | { readonly type: "scene-step"; readonly tick: number; readonly scriptId: string; readonly stepId: string }
  | { readonly type: "verb-applied"; readonly tick: number; readonly scriptId: string; readonly stepId: string; readonly verb: string; readonly textKeys: readonly string[] }
  | { readonly type: "verb-rejected"; readonly tick: number; readonly scriptId: string; readonly verb: string; readonly reason: "unknown" | "already-applied" | "order" | "inactive" }
  | { readonly type: "camera-hold"; readonly tick: number; readonly anchorId: string }
  | { readonly type: "camera-release"; readonly tick: number; readonly anchorId: string }
  | { readonly type: "hearth-dim"; readonly tick: number; readonly rampSteps: number; readonly percent: number }
  | { readonly type: "hud-border-wake"; readonly tick: number }
  | { readonly type: "hud-border-state"; readonly tick: number; readonly state: string }
  | { readonly type: "teach-flag"; readonly tick: number; readonly flag: string }
  | { readonly type: "dose-prepared"; readonly tick: number; readonly remaining: number }
  | { readonly type: "vial-inherited"; readonly tick: number; readonly doses: number }
  | { readonly type: "notebook-line"; readonly tick: number; readonly textKey: string }
  | { readonly type: "names-witness"; readonly tick: number; readonly kind: NamesKind; readonly sourceId: string }
  | { readonly type: "hearth-arrive"; readonly tick: number; readonly hearthId: string }
  | { readonly type: "hearth-rest-request"; readonly tick: number; readonly hearthId: string }
  | { readonly type: "hearth-refill-request"; readonly tick: number; readonly hearthId: string }
  | { readonly type: "hearth-respawn-request"; readonly tick: number; readonly hearthId: string }
  | { readonly type: "hearth-bank-request"; readonly tick: number; readonly hearthId: string }
  | { readonly type: "hearth-level-request"; readonly tick: number; readonly hearthId: string }
  | { readonly type: "hearth-craft-request"; readonly tick: number; readonly hearthId: string }
  | { readonly type: "hearth-leave"; readonly tick: number; readonly hearthId: string }
  | { readonly type: "item-reveal-request"; readonly tick: number; readonly itemId: string }
  | { readonly type: "item-revealed"; readonly tick: number; readonly itemId: string; readonly textKeys: readonly string[] }
  | { readonly type: "ceremony-started"; readonly tick: number; readonly holdTicks: number }
  | { readonly type: "ceremony-ended"; readonly tick: number }
  | { readonly type: "invulnerable-hold"; readonly tick: number; readonly ticks: number; readonly dealsDamage: false }
  | { readonly type: "turn-cleanse-request"; readonly tick: number }
  | { readonly type: "arena-hearth-light"; readonly tick: number; readonly hearthId: string }
  | { readonly type: "unwritten-mark"; readonly tick: number; readonly set: boolean }
  | { readonly type: "caleb-misname"; readonly tick: number; readonly textKey: "npc.birdie.caleb_misname" }
  | { readonly type: "slice-exit"; readonly tick: number }
  | { readonly type: "title-card"; readonly tick: number; readonly shown: false };

export interface SceneResult {
  readonly state: SceneState;
  readonly events: readonly SceneEvent[];
}
