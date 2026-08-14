/**
 * Menu logic coverage (slice contract: menus emit intents, no persistence;
 * Hearth menu wired to scene-system intent events). DOM click-through is
 * covered by e2e/hud.spec.ts; here the pure halves.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { bibleEntry } from "../hud/bible";
import { renderString } from "../hud/text";
import {
  bindingLabelKey,
  deathOverlayKeys,
  defaultSettings,
  HEARTH_VERBS,
  MENU_CHROME,
} from "./logic";
import { renderUiString } from "./menus";

/** SceneOpEvent hearth intent types, quoted from src/sim/scenes/types.ts. */
const SCENE_HEARTH_EVENTS = [
  "hearth-rest-request",
  "hearth-refill-request",
  "hearth-respawn-request",
  "hearth-bank-request",
  "hearth-level-request",
  "hearth-craft-request",
  "hearth-leave",
] as const;

describe("HEARTH_VERBS", () => {
  it("covers the five TEXT_BIBLE §5 rest verbs", () => {
    expect(HEARTH_VERBS.map((v) => v.key)).toEqual([
      "ui.hearth.approach",
      "ui.hearth.light",
      "ui.hearth.wait",
      "ui.hearth.remember",
      "ui.hearth.leave",
    ]);
    for (const verb of HEARTH_VERBS) {
      expect(bibleEntry(verb.key), verb.key).toBeDefined();
    }
  });

  it("maps every verb to a real scene-system intent event", () => {
    for (const verb of HEARTH_VERBS) {
      expect(SCENE_HEARTH_EVENTS, verb.intent).toContain(verb.intent);
    }
  });
});

describe("deathOverlayKeys", () => {
  it("the page falls open; the second death adds the Open Page loss line", () => {
    expect(deathOverlayKeys(false)).toEqual(["ui.death.message"]);
    expect(deathOverlayKeys(true)).toEqual(["ui.death.message", "ui.death.open_page_lost"]);
    for (const key of deathOverlayKeys(true)) {
      expect(bibleEntry(key), key).toBeDefined();
    }
  });
});

describe("menu chrome (TEXT_BIBLE v0 authors no ui.menu.*/ui.settings.* keys)", () => {
  it("chrome entries render through the same Numbness ladder", () => {
    expect(renderUiString("ui.menu.resume", { textStep: 0 }).text).toBe("Back to the road");
    expect(renderUiString("ui.menu.resume", { textStep: 3 }).text).toBe("Resume");
    expect(renderUiString("ui.menu.resume", { textStep: 3 }).stateRegister).toBe(true);
    expect(renderUiString("ui.menu.resume", { textStep: 3, lock: true }).text).toBe(
      "Back to the road",
    );
  });

  it("bible keys win over chrome where both could apply", () => {
    expect(bindingLabelKey("attend")).toBe("ui.attend.label");
    expect(bindingLabelKey("roll")).toBe("ui.settings.bind.roll");
    expect(renderUiString(bindingLabelKey("attend"), { textStep: 0 }).text).toBe("Attend");
  });

  it("every settings key the panel uses resolves to non-empty text", () => {
    const model = defaultSettings();
    const keys = [
      ...model.buses.map((bus) => `ui.settings.bus.${bus.id}`),
      "ui.settings.reduced_feedback",
      "ui.settings.remap",
      ...model.bindings.map((binding) => bindingLabelKey(binding.action)),
      "ui.menu.back",
      "ui.menu.resume",
      "ui.menu.settings",
      "ui.menu.quit",
    ];
    for (const key of keys) {
      const rendered = renderUiString(key, { textStep: 0 });
      expect(rendered.absent, key).toBe(false);
      expect(rendered.text.length, key).toBeGreaterThan(0);
    }
  });

  it("chrome strings keep the §7 folk length cap (≤14 words)", () => {
    for (const entry of Object.values(MENU_CHROME)) {
      expect(entry.folk.split(/\s+/).length).toBeLessThanOrEqual(14);
    }
  });

  it("death overlay and hearth verbs stay Numbness-aware through renderString", () => {
    expect(renderString("ui.death.message", { textStep: 3 }).text).toBe(
      "Outcome failure recorded.",
    );
    expect(renderString("ui.hearth.remember", { textStep: 2 }).text).toBe("Write / file");
  });
});

describe("fonts referenced by the HUD (slice fonts note)", () => {
  const fontFiles = [
    "IMFellEnglish-Regular.ttf",
    "IMFellEnglish-Italic.ttf",
    "EBGaramond[wght].ttf",
    "EBGaramond-Italic[wght].ttf",
    "Caveat[wght].ttf",
  ];

  it("every @font-face file exists under game/assets/fonts", () => {
    for (const file of fontFiles) {
      const url = new URL(`../../../assets/fonts/${file}`, import.meta.url);
      expect(() => readFileSync(url), file).not.toThrow();
    }
  });
});
