/**
 * HUD constants (W1-SHARED rule 5: no magic numbers). TUNING_V0.md does not
 * tune the border's presentation geometry, so these values are authored here
 * with their law citations; the gameplay numbers they reference (dose counts,
 * Numbness ladder depth) come from TUNING_V0 / TEXT_BIBLE as noted.
 */
export const HUD_PARAMS = {
  version: 1,
  meters: {
    /** HB5: all border meters are stepped, 2–3 stops, never continuous. We render 3 lit stops + empty. */
    litStops: 3,
    /**
     * Stop thresholds as ratios of the measure. Equal thirds are the authored
     * quantization (no TUNING row governs the HUD; HB5 only bounds 2–3 stops).
     */
    stopThresholds: [1 / 3, 2 / 3, 1] as readonly number[],
    /** HB4: Breath is the right margin's *shorter* responding measure — fraction of the Pulse column's height. */
    breathMeasureFraction: 0.62,
  },
  turn: {
    /** HB3/D6: Turn advance narrows the margin from all four sides, in declared stops (EN9 stepped-ramp spirit). */
    narrowingSteps: 3,
    /** Presentation geometry (authored): base page inset and the narrowing per Turn stop. */
    baseInsetPx: 28,
    insetPerStepPx: 14,
  },
  tallies: {
    /** HB4: Names render as graphite tally marks, grouped five-bar tallies, never digits. */
    groupSize: 5,
  },
  text: {
    /** TEXT_BIBLE §2: textStep = clamp(stacks − vigilRestore, 0, maxTextStep). */
    maxStep: 3,
  },
} as const;

export type HudParams = typeof HUD_PARAMS;
