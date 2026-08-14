import { describe, expect, it } from "vitest";

import {
  createTickClock,
  mapTickToAudioTime,
  observeFrame,
  specTickToAudioTime,
  TICK_SECONDS,
} from "./clock";
import { loadCommittedAudioParams } from "./load_params";

const params = loadCommittedAudioParams();

describe("tick → AudioContext clock", () => {
  it("maps ticks at 60 Hz from the origin", () => {
    const clock = createTickClock(0, 1.5);
    expect(specTickToAudioTime(clock, 0)).toBe(1.5);
    expect(specTickToAudioTime(clock, 60)).toBeCloseTo(2.5, 10);
    expect(mapTickToAudioTime(clock, 30)).toBeCloseTo(2, 10);
  });

  it("keeps scheduled-vs-spec inside F4 ±10ms under simulated rAF jitter", () => {
    let clock = createTickClock(0, 0);
    let seed = 0x544f_4d31;
    const nextUnit = (): number => {
      seed = Math.imul(seed ^ (seed << 13), 0x5bd1_e995) >>> 0;
      return (seed & 0xffff) / 0xffff;
    };

    for (let tick = 0; tick <= 180; tick += 1) {
      const jitterSeconds = (nextUnit() * 2 - 1) * 0.008;
      const observed = specTickToAudioTime(clock, tick) + jitterSeconds;
      clock = observeFrame(clock, tick, observed, params.clock);
    }

    for (const tick of [12, 48, 90, 150]) {
      const spec = specTickToAudioTime(clock, tick);
      const mapped = mapTickToAudioTime(clock, tick);
      expect(Math.abs((mapped - spec) * 1000)).toBeLessThanOrEqual(params.clock.impactWindowMs);
    }
  });

  it("rematerializes origin on a pause-sized hitch instead of chasing it", () => {
    let clock = createTickClock(0, 0);
    clock = observeFrame(clock, 10, 10 * TICK_SECONDS + 0.2, params.clock);
    expect(clock.originTick).toBe(10);
    expect(clock.originAudioTime).toBeCloseTo(10 * TICK_SECONDS + 0.2, 10);
    expect(clock.driftSeconds).toBe(0);
    expect(mapTickToAudioTime(clock, 10)).toBeCloseTo(clock.originAudioTime, 10);
  });
});
