/**
 * The border descriptor — a pure, serializable render spec for the whole
 * manuscript apparatus. The DOM applier consumes this and nothing else, so
 * the L10/A5 state-diff check (borderDiff.test.ts) can assert enumerable,
 * image-diffable verdict states without a browser: distinct world states must
 * produce distinct descriptors.
 */

import { HUD_PARAMS, type HudParams } from "./params";
import type { BossPhase, HearthVerdict, HudModel, ZoneCharacter } from "./types";

export interface BorderDescriptor {
  readonly hearth: HearthVerdict;
  readonly zone: ZoneCharacter;
  readonly bossPhase: BossPhase;
  readonly unwrittenTag: boolean;
  /** Numbness register step currently driving the surface text (0–3). */
  readonly numbnessStep: number;
  /** Quantized Turn narrowing stop (0 = open margin). */
  readonly turnStep: number;
  /** D6/HB3: margin inset in px, identical on all four sides — the page closing in. */
  readonly marginInsetPx: number;
  /** HB4/HB5: stepped lit-vellum fractions (multiples of 1/litStops). */
  readonly pulseFraction: number;
  readonly breathFraction: number;
  readonly pulseStop: number;
  readonly breathStop: number;
  /** Countable emblems, never digits (HB10). */
  readonly doses: number;
  readonly maxDoses: number;
  readonly tallyGroups: number;
  readonly tallyRemainder: number;
  /** HB6: at Turn cap the border itself carries the Turned verdict, never a flash. */
  readonly turned: boolean;
  /** HB9: gold in the border is reserved for the lit-Hearth seal. */
  readonly vigilSeal: boolean;
  /** HB11/HB2: ornament family by zone character — carved warmth vs bare thorn. */
  readonly ornamentFamily: "filigree" | "thorn";
  /** Footer verdict band text key (text_bible), or null when the band is silent. */
  readonly footerKey: string | null;
}

/**
 * Footer verdict precedence: the Turned verdict outranks Turn warnings, which
 * outrank the hearth state. Boss phase and the unwritten tag are their own
 * border marks (corner/footer emblem), not footer text — the UI never names
 * the Warden (CM26), so no boss title string exists to show.
 */
export const footerKeyFor = (model: HudModel): string | null => {
  if (model.turned) {
    return "ui.turn.turned";
  }
  if (model.turnStep >= 2) {
    return "ui.turn.near";
  }
  if (model.turnStep >= 1) {
    return "ui.turn.rising";
  }
  if (model.hearth === "lit") {
    return "ui.hearth.vigil_save";
  }
  return null;
};

export const descriptorFromModel = (
  model: HudModel,
  params: HudParams = HUD_PARAMS,
): BorderDescriptor => ({
  hearth: model.hearth,
  zone: model.zone,
  bossPhase: model.bossPhase,
  unwrittenTag: model.unwrittenTag,
  numbnessStep: model.textStep,
  turnStep: model.turnStep,
  marginInsetPx:
    params.turn.baseInsetPx + model.turnStep * params.turn.insetPerStepPx,
  pulseFraction: model.pulseFraction,
  breathFraction: model.breathFraction,
  pulseStop: model.pulseStop,
  breathStop: model.breathStop,
  doses: model.doses,
  maxDoses: model.maxDoses,
  tallyGroups: model.tallies.groups,
  tallyRemainder: model.tallies.remainder,
  turned: model.turned,
  vigilSeal: model.hearth === "lit",
  ornamentFamily: model.zone === "domestic" ? "filigree" : "thorn",
  footerKey: footerKeyFor(model),
});

/** Stable serialization for diff assertions (key order fixed by construction). */
export const serializeDescriptor = (descriptor: BorderDescriptor): string =>
  JSON.stringify(descriptor);
