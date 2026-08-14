/**
 * The vendored bible must never drift from the canon artifact
 * (TEXT_BIBLE §0: the JSON is the shipping artifact). Any canon-side string
 * change fails here until the copy is re-vendored — see bible.ts header.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

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
