/**
 * World lighting state driven by the scene stream (O-F10).
 *
 * The scene system emits `hearth-dim` when Anna's death is witnessed, carrying
 * its own declared ramp (`percent`, `rampSteps`) straight off scene_scripts —
 * ENCOUNTERS ⚓ / ART_BIBLE EN9: "~18%, rendered as exactly one declared ramp
 * step down, not a continuous fade". Until this module the event reached
 * nothing at all.
 *
 * Pure and headless: it holds the hearth emblem's level as a number, applies
 * the step at most `rampSteps` times, and never touches three.js. The world
 * runtime publishes the level on its debug snapshot; whatever draws the hearth
 * reads it there. Thresholds are never authored here — the event carries them.
 */

/** Full hearth. The level is a multiplier on the emblem's authored intensity. */
export const HEARTH_LEVEL_FULL = 1;

/** The scene payload this module consumes, narrowed to what lighting needs. */
export interface HearthDimSignal {
  readonly percent: number;
  readonly rampSteps: number;
}

export interface WorldLightingState {
  /** Declared ramp steps taken down, never more than the event's `rampSteps`. */
  readonly hearthDimSteps: number;
  /** Hearth emblem intensity multiplier after those steps. */
  readonly hearthEmblemLevel: number;
}

export const createWorldLighting = (): WorldLightingState => ({
  hearthDimSteps: 0,
  hearthEmblemLevel: HEARTH_LEVEL_FULL,
});

/**
 * Take one declared step down, stepped and clamped. A second `hearth-dim` on
 * a one-step ramp changes nothing: EN9 licenses exactly one step, and a scene
 * replayed twice must not fade the hearth twice.
 */
export const applyHearthDim = (
  state: WorldLightingState,
  signal: HearthDimSignal,
): WorldLightingState => {
  const steps = Math.min(state.hearthDimSteps + 1, Math.max(signal.rampSteps, 0));
  if (steps === state.hearthDimSteps) {
    return state;
  }
  const perStep = signal.percent / 100;
  return {
    hearthDimSteps: steps,
    hearthEmblemLevel: Math.max(0, HEARTH_LEVEL_FULL - perStep * steps),
  };
};

export const consumeLightingEvents = (
  state: WorldLightingState,
  signals: readonly HearthDimSignal[],
): WorldLightingState => signals.reduce(applyHearthDim, state);
