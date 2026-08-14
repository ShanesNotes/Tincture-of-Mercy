/**
 * HudModel derivation (slice contract deliverable: "HudModel derivation from
 * fixture states (all meters/steps)"). Pure and headless — the view and the
 * state-diff harness both consume this, never the DOM.
 */

import { HUD_PARAMS, type HudParams } from "./params";
import type { HudInput, HudModel, TallyCount } from "./types";

const clamp = (value: number, low: number, high: number): number =>
  Math.min(high, Math.max(low, value));

/**
 * Quantize a fill ratio to a lit stop (HB5: stepped, never continuous).
 * ratio <= 0 is the empty stop; otherwise the first threshold it fits.
 */
export const stopForRatio = (ratio: number, params: HudParams = HUD_PARAMS): number => {
  if (ratio <= 0) {
    return 0;
  }
  const thresholds = params.meters.stopThresholds;
  for (let i = 0; i < thresholds.length; i += 1) {
    if (ratio <= (thresholds[i] as number)) {
      return i + 1;
    }
  }
  return thresholds.length;
};

/** HB4: Names are hand-counted — five-bar tally groups plus a remainder, never a digit. */
export const namesToTallies = (
  namesCarried: number,
  params: HudParams = HUD_PARAMS,
): TallyCount => {
  const count = Math.max(0, Math.floor(namesCarried));
  return {
    groups: Math.floor(count / params.tallies.groupSize),
    remainder: count % params.tallies.groupSize,
  };
};

/** TEXT_BIBLE §2 verbatim; L-T4 register locks hold the surface at folk step 0. */
export const textStepFor = (
  numbnessStacks: number,
  vigilRestore: number,
  registerLocked: boolean,
  params: HudParams = HUD_PARAMS,
): number =>
  registerLocked
    ? 0
    : clamp(Math.floor(numbnessStacks) - Math.floor(vigilRestore), 0, params.text.maxStep);

/** D6: the Turn renders as margin narrowing in declared stops; at cap the actor is Turned (HB6). */
export const turnStepFor = (
  turn: number,
  turnCap: number,
  params: HudParams = HUD_PARAMS,
): { readonly turnStep: number; readonly turned: boolean } => {
  if (turnCap <= 0 || turn <= 0) {
    return { turnStep: 0, turned: false };
  }
  if (turn >= turnCap) {
    return { turnStep: params.turn.narrowingSteps, turned: true };
  }
  const ratio = turn / turnCap;
  const steps = params.turn.narrowingSteps;
  // Below cap: 0..steps-1, evenly divided; the cap itself is the final stop + verdict.
  const step = clamp(Math.ceil(ratio * steps) - 1, 0, steps - 1);
  return { turnStep: step, turned: false };
};

/** Derive the whole render-ready model from one input snapshot. */
export const deriveHudModel = (input: HudInput, params: HudParams = HUD_PARAMS): HudModel => {
  const pulseStop = stopForRatio(
    input.maxPulse > 0 ? input.pulse / input.maxPulse : 0,
    params,
  );
  const breathStop = stopForRatio(
    input.maxBreath > 0 ? input.breath / input.maxBreath : 0,
    params,
  );
  const { turnStep, turned } = turnStepFor(input.turn, input.turnCap, params);
  return {
    pulseStop,
    breathStop,
    pulseFraction: pulseStop / params.meters.litStops,
    breathFraction: breathStop / params.meters.litStops,
    doses: Math.max(0, Math.floor(input.doses)),
    maxDoses: Math.max(0, Math.floor(input.maxDoses)),
    tallies: namesToTallies(input.namesCarried, params),
    turnStep,
    turned,
    textStep: textStepFor(input.numbnessStacks, input.vigilRestore, input.registerLocked, params),
    hearth: input.hearth,
    bossPhase: input.bossPhase,
    unwrittenTag: input.unwrittenTag,
    zone: input.zone,
  };
};
