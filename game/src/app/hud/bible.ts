/**
 * The polyphonic string set (TEXT_BIBLE.md §0): `text_bible_v0.json` is the
 * shipping artifact and the HUD never carries a literal string of its own.
 *
 * The canon JSON lives in `design_system/v1_0_threejs_soulslike/` (outside the
 * Vite dev server's filesystem allowance), so it is vendored here as
 * `text_bible_v0.json`; `bible.test.ts` fails the build if the vendored copy
 * drifts from the design_system source. Re-vendor with:
 *   cp design_system/v1_0_threejs_soulslike/text_bible_v0.json game/src/app/hud/
 */

import rawBible from "./text_bible_v0.json";

/** Mirrors `TextBibleEntry` in src/sim/scenes/text.ts; the HUD keeps its own seam (W1-SHARED rule 3). */
export interface HudBibleEntry {
  readonly folk: string | null;
  readonly church: string | null;
  readonly state: string | null;
  readonly numb1?: string;
  readonly numb2?: string;
  readonly numb3?: string;
}

export type HudBible = Readonly<Record<string, HudBibleEntry>>;

export const TEXT_BIBLE: HudBible = rawBible as HudBible;

/** TEXT_BIBLE §8.11: consumers skip keys with a leading underscore. */
export const bibleEntry = (key: string): HudBibleEntry | undefined =>
  key.startsWith("_") ? undefined : TEXT_BIBLE[key];
