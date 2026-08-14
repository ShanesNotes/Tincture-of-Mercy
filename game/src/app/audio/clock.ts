import type { ClockParams } from "./types";

export const TICK_SECONDS = 1 / 60;

export interface TickClock {
  readonly originTick: number;
  readonly originAudioTime: number;
  readonly driftSeconds: number;
}

export const createTickClock = (originTick: number, originAudioTime: number): TickClock => ({
  originTick,
  originAudioTime,
  driftSeconds: 0,
});

/** Ideal sim-tick → AudioContext mapping. Gates compare scheduled times against this. */
export const specTickToAudioTime = (clock: TickClock, tick: number): number =>
  clock.originAudioTime + (tick - clock.originTick) * TICK_SECONDS;

/** Drift-corrected mapping used for source.start(when). */
export const mapTickToAudioTime = (clock: TickClock, tick: number): number =>
  specTickToAudioTime(clock, tick) + clock.driftSeconds;

/**
 * Fold a presenter-frame observation into the clock.
 * rAF jitter is low-passed; only a hitch/pause-sized error rematerializes origin
 * so scheduled-vs-spec stays inside the F4 ±10ms window.
 */
export const observeFrame = (
  clock: TickClock,
  committedTick: number,
  audioTime: number,
  params: ClockParams,
): TickClock => {
  const expected = specTickToAudioTime(clock, committedTick);
  const rawDrift = audioTime - expected;
  if (Math.abs(rawDrift) >= params.snapThresholdSeconds) {
    return createTickClock(committedTick, audioTime);
  }
  return {
    originTick: clock.originTick,
    originAudioTime: clock.originAudioTime,
    driftSeconds: clock.driftSeconds + (rawDrift - clock.driftSeconds) * params.driftSmooth,
  };
};
