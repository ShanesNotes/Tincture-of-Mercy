/**
 * Menu intents (slice contract: menus emit intents, no persistence — s15 owns
 * saves). Hearth verbs map onto the scene system's SceneOpEvent types
 * (src/sim/scenes/types.ts) so integration can route them unchanged.
 */

export type PauseIntent =
  | { readonly type: "resume" }
  | { readonly type: "open-settings" }
  | { readonly type: "quit-to-title" };

export type SettingsIntent =
  | { readonly type: "set-audio-bus"; readonly bus: string; readonly value: number }
  | { readonly type: "set-reduced-feedback"; readonly enabled: boolean }
  | { readonly type: "remap-gamepad"; readonly action: string }
  | { readonly type: "close-settings" };

/** Scene-system intent event types (SceneOpEvent in src/sim/scenes/types.ts). */
export type HearthIntentType =
  | "hearth-rest-request"
  | "hearth-refill-request"
  | "hearth-respawn-request"
  | "hearth-level-request"
  | "hearth-leave";

export type HearthIntent = {
  readonly type: HearthIntentType;
  readonly hearthId: string;
};

export type DeathIntent = { readonly type: "death-acknowledged" };

export type MenuIntent = PauseIntent | SettingsIntent | HearthIntent | DeathIntent;

export type MenuIntentHandler = (intent: MenuIntent) => void;
