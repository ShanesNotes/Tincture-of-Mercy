/**
 * The polyphonic string set (TEXT_BIBLE.md §0): `text_bible_v0.json` is the
 * shipping artifact and the HUD never carries a literal string of its own.
 *
 * The canon JSON lives in `design_system/v1_0_threejs_soulslike/` (outside the
 * Vite dev server's filesystem allowance), so it is vendored here as
 * `text_bible_v0.json`; `bible.test.ts` fails the build if the vendored copy
 * drifts from the design_system source. Re-vendor with:
 *   cp design_system/v1_0_threejs_soulslike/text_bible_v0.json game/src/app/hud/
 *
 * `src/data/text_addendum_v0.json` layers PROPOSED strings under that canon —
 * keys the shipping artifact does not author yet. Canon always wins; see
 * `TEXT_ADDENDUM` / `isProposedKey` below and the addendum's `_meta`.
 */

import rawAddendum from "../../data/text_addendum_v0.json";
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

const CANON_BIBLE: HudBible = rawBible as HudBible;

/**
 * Proposed strings the canon bible does not author yet (s19; see the file's
 * `_meta`). Every entry is a proposal, not canon, and adoption is the owner's
 * call — a string enters `text_bible_v0.json` only by amending TEXT_BIBLE.md.
 */
export const TEXT_ADDENDUM: HudBible = rawAddendum;

/**
 * Canon over proposal: the addendum is spread first, so a colliding key always
 * resolves to the shipping artifact. `bible.test.ts` fails the build if any key
 * collides at all — a proposal that canon has since answered must be dropped.
 */
export const TEXT_BIBLE: HudBible = { ...TEXT_ADDENDUM, ...CANON_BIBLE };

/** TEXT_BIBLE §8.11: consumers skip keys with a leading underscore. */
export const bibleEntry = (key: string): HudBibleEntry | undefined =>
  key.startsWith("_") ? undefined : TEXT_BIBLE[key];

/** True for a key the addendum proposes and canon does not author. */
export const isProposedKey = (key: string): boolean =>
  !key.startsWith("_") &&
  TEXT_ADDENDUM[key] !== undefined &&
  CANON_BIBLE[key] === undefined;
