/**
 * Pure menu logic (headless-testable half of the menus). DOM builders in
 * menus.ts stamp these models; nothing here touches the document.
 *
 * MENU CHROME NOTE (flagged like a TEXT_BIBLE §8 dispute): text_bible_v0.json
 * authors no `ui.menu.*` / `ui.settings.*` keys (§9 namespace), and a string
 * may not be added to the bible without a TEXT_BIBLE amendment — which is the
 * owner's call, not this slice's. The pause/settings chrome therefore lives
 * here in bible-entry shape and renders through the same `renderEntry`
 * ladder, so Numbness degrades it like any other surface. Where the bible
 * already has the word (Attend, Drink, Take a look) the bible key is used.
 * Strings follow §7 authoring rules: folk ≤14 words, no quest-log register,
 * no triumph language.
 */

import type { HearthIntentType } from "./intents";

/**
 * Hearth rest verbs → scene-system intent events (SceneOpEvent types in
 * src/sim/scenes/types.ts). The verb text keys are TEXT_BIBLE §5 `ui.hearth.*`;
 * the mapping is D6's rest-point loop: vigil = rest, kindling renews the
 * vial, waiting passes the world (respawn), writing Names = leveling, and
 * the exit verb is "Bank the fire and go". The scene system's
 * `hearth-bank-request`/`hearth-craft-request` events are reserved for the
 * Tincture-Wheel crafting seam and are not bound to a menu verb yet (skeleton).
 */
export const HEARTH_VERBS = [
  { key: "ui.hearth.approach", intent: "hearth-rest-request" },
  { key: "ui.hearth.light", intent: "hearth-refill-request" },
  { key: "ui.hearth.wait", intent: "hearth-respawn-request" },
  { key: "ui.hearth.remember", intent: "hearth-level-request" },
  { key: "ui.hearth.leave", intent: "hearth-leave" },
] as const satisfies readonly { key: string; intent: HearthIntentType }[];

export type HearthVerb = (typeof HEARTH_VERBS)[number];

/**
 * Death overlay lines ("the page falls open" moment). TEXT_BIBLE §5: no death
 * string contains "died"/"failed"/"try again"; the second death adds the
 * Open Page loss line. Returns text_bible keys only.
 */
export const deathOverlayKeys = (pageLost: boolean): readonly string[] =>
  pageLost
    ? ["ui.death.message", "ui.death.open_page_lost"]
    : ["ui.death.message"];

/** Settings panel model. Bus ids mirror the audio runtime's gain buses (src/app/audio/types.ts). */
export interface SettingsModel {
  readonly buses: readonly { readonly id: string; readonly value: number }[];
  readonly reducedFeedback: boolean;
  /** Display-only gamepad remap table (slice contract: display + intents, no persistence). */
  readonly bindings: readonly { readonly action: string; readonly control: string }[];
}

export const defaultSettings = (): SettingsModel => ({
  buses: [
    { id: "master", value: 80 },
    { id: "sfx", value: 80 },
    { id: "ambience", value: 70 },
  ],
  reducedFeedback: false,
  bindings: [
    { action: "attack-light", control: "pad/square" },
    { action: "attack-heavy", control: "pad/triangle" },
    { action: "roll", control: "pad/circle" },
    { action: "guard", control: "pad/l1" },
    { action: "tincture", control: "pad/r1" },
    { action: "attend", control: "pad/r3" },
    { action: "interact", control: "pad/cross" },
  ],
});

/**
 * Menu-chrome strings (see header note). Same `{folk, church, state, numb*}`
 * shape as the bible; rendered through `renderEntry`, never read raw.
 */
export const MENU_CHROME = {
  "ui.menu.resume": {
    folk: "Back to the road",
    church: "Return to the way",
    state: "Resume session",
    numb1: "Back to the road",
    numb2: "Back.",
    numb3: "Resume",
  },
  "ui.menu.settings": {
    folk: "Adjustments",
    church: "Putting things in order",
    state: "Configuration",
    numb1: "Adjustments",
    numb2: "Settings.",
    numb3: "Configuration",
  },
  "ui.menu.quit": {
    folk: "Close the book",
    church: "Lay it down",
    state: "End session",
    numb1: "Close the book",
    numb2: "Close it.",
    numb3: "Terminate",
  },
  "ui.menu.back": {
    folk: "Back",
    church: "Return",
    state: "Back",
    numb1: "Back",
    numb2: "Back.",
    numb3: "Return",
  },
  "ui.settings.bus.master": {
    folk: "Every sound",
    church: "The whole of it",
    state: "Master level",
    numb1: "Every sound",
    numb2: "All sound.",
    numb3: "Master",
  },
  "ui.settings.bus.sfx": {
    folk: "Blows and chimes",
    church: "The sounds of doing",
    state: "Effects level",
    numb1: "Blows and chimes",
    numb2: "Effects.",
    numb3: "SFX",
  },
  "ui.settings.bus.ambience": {
    folk: "The room and the weather",
    church: "The air of the place",
    state: "Ambience level",
    numb1: "The room and the weather",
    numb2: "Ambience.",
    numb3: "Ambience",
  },
  "ui.settings.reduced_feedback": {
    folk: "Less of the jolt",
    church: "A gentler telling",
    state: "Reduced feedback",
    numb1: "Less of the jolt",
    numb2: "Reduced feedback.",
    numb3: "Reduced feedback",
  },
  "ui.settings.remap": {
    folk: "Move it",
    church: "Assign otherwise",
    state: "Reassign",
    numb1: "Move it",
    numb2: "Reassign.",
    numb3: "Reassign",
  },
  "ui.settings.bind.attack-light": {
    folk: "Light blow",
    church: "The quick stroke",
    state: "Attack, light",
    numb1: "Light blow",
    numb2: "Attack (light).",
    numb3: "ATK-L",
  },
  "ui.settings.bind.attack-heavy": {
    folk: "Heavy blow",
    church: "The committed stroke",
    state: "Attack, heavy",
    numb1: "Heavy blow",
    numb2: "Attack (heavy).",
    numb3: "ATK-H",
  },
  "ui.settings.bind.roll": {
    folk: "The roll",
    church: "The avoidance",
    state: "Evasion",
    numb1: "The roll",
    numb2: "Dodge.",
    numb3: "EVADE",
  },
  "ui.settings.bind.guard": {
    folk: "Hold it off",
    church: "The ward",
    state: "Guard",
    numb1: "Hold it off",
    numb2: "Guard.",
    numb3: "GUARD",
  },
} as const;

export type MenuChromeId = keyof typeof MENU_CHROME;

/** Bindings whose labels the bible already authors (bible key wins over chrome). */
export const BINDING_BIBLE_KEYS: Readonly<Record<string, string>> = {
  tincture: "ui.tincture.drink",
  attend: "ui.attend.label",
  interact: "ui.prompt.interact",
};

/** Resolve the text key for a binding row: bible where it exists, chrome otherwise. */
export const bindingLabelKey = (action: string): string =>
  BINDING_BIBLE_KEYS[action] ?? `ui.settings.bind.${action}`;
