/**
 * The vendored bible must never drift from the canon artifact
 * (TEXT_BIBLE §0: the JSON is the shipping artifact). Any canon-side string
 * change fails here until the copy is re-vendored — see bible.ts header.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { MENU_CHROME } from "../menus/logic";
import { bibleEntry, isProposedKey, TEXT_ADDENDUM, TEXT_BIBLE } from "./bible";
import vendored from "./text_bible_v0.json";

const canon = JSON.parse(
  readFileSync(
    new URL(
      "../../../../design_system/v1_0_threejs_soulslike/text_bible_v0.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as Record<string, unknown>;

const addendum = JSON.parse(
  readFileSync(new URL("../../data/text_addendum_v0.json", import.meta.url), "utf8"),
) as Record<string, Record<string, unknown>>;

const proposedKeys = Object.keys(addendum).filter((key) => !key.startsWith("_"));

describe("vendored text bible", () => {
  it("is byte-identical in content to the design_system source", () => {
    expect(vendored).toEqual(canon);
  });

  it("satisfies the TEXT_BIBLE invariants (≥80 keys, every entry has a folk field)", () => {
    const entries = Object.values(vendored) as Record<string, unknown>[];
    expect(entries.length).toBeGreaterThanOrEqual(80);
    for (const entry of entries) {
      expect(entry).toHaveProperty("folk");
    }
  });
});

/**
 * The addendum (src/data/text_addendum_v0.json) proposes strings canon does not
 * author. It may never shadow canon, and it may never pretend to be canon.
 */
describe("proposed addendum", () => {
  it("proposes no key the canon bible already defines", () => {
    const canonKeys = new Set(Object.keys(vendored));
    for (const key of proposedKeys) {
      expect(canonKeys.has(key), `${key} is already canon — drop it from the addendum`).toBe(
        false,
      );
    }
    expect(proposedKeys.length).toBeGreaterThan(0);
  });

  it("gives every entry the three registers and the PROPOSED marker", () => {
    expect(addendum._meta?._status).toContain("PROPOSED");
    for (const key of proposedKeys) {
      const entry = addendum[key];
      expect(entry, key).toBeDefined();
      expect(entry, key).toHaveProperty("folk");
      expect(entry, key).toHaveProperty("church");
      expect(entry, key).toHaveProperty("state");
      expect(entry?.proposed, key).toBe(true);
      expect(typeof entry?.folk, key).toBe("string");
    }
  });

  it("isProposedKey separates proposal from canon (and skips _meta)", () => {
    for (const key of proposedKeys) {
      expect(isProposedKey(key), key).toBe(true);
    }
    for (const key of ["ui.prompt.interact", "ui.death.message", "boss.aftermath.write_prompt"]) {
      expect(isProposedKey(key), key).toBe(false);
    }
    expect(isProposedKey("_meta")).toBe(false);
    expect(isProposedKey("ui.nothing.here")).toBe(false);
  });

  it("merges into the TEXT_BIBLE surface without disturbing canon", () => {
    expect(bibleEntry("ui.prompt.dose_anna")?.folk).toBe("Give Anna the dose");
    expect(bibleEntry("ui.coda.end_card")?.folk).toBe("The Ironwood ends here. The walking does not.");
    expect(bibleEntry("boss.aftermath.walk_away_prompt")?.church).toBe("Leave him uncommemorated");
    expect(Object.keys(TEXT_ADDENDUM).length).toBe(proposedKeys.length + 1);
    for (const [key, entry] of Object.entries(vendored)) {
      expect(TEXT_BIBLE[key], key).toEqual(entry);
    }
  });

  it("resolves every menu-chrome key the settings panel needs", () => {
    for (const [key, chrome] of Object.entries(MENU_CHROME)) {
      const entry = bibleEntry(key);
      expect(entry, key).toBeDefined();
      // Adoption must not change a pixel: the proposal is the chrome verbatim.
      expect(entry?.folk, key).toBe(chrome.folk);
      expect(entry?.numb3, key).toBe(chrome.numb3);
    }
  });
});
