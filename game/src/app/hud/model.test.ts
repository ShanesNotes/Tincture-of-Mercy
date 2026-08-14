/**
 * HudModel derivation from fixture states (slice contract test row 1):
 * every meter, every stop, the tally decomposition, the textStep formula,
 * and the Turn narrowing quantization.
 */

import { describe, expect, it } from "vitest";

import { HUD_FIXTURES, HUD_FIXTURE_ORDER } from "./fixtures";
import type { HudInput } from "./types";
import { deriveHudModel, namesToTallies, stopForRatio, textStepFor, turnStepFor } from "./model";
import { HUD_PARAMS } from "./params";

const fixture = (name: (typeof HUD_FIXTURE_ORDER)[number]): HudInput => HUD_FIXTURES[name];

describe("stopForRatio (HB5: stepped, never continuous)", () => {
  it("quantizes to exactly litStops+1 discrete stops", () => {
    const stops = new Set<number>();
    for (let i = 0; i <= 100; i += 1) {
      stops.add(stopForRatio(i / 100));
    }
    expect([...stops].sort((a, b) => a - b)).toEqual([0, 1, 2, 3]);
  });

  it("is monotonic non-decreasing across the whole range", () => {
    let previous = 0;
    for (let i = 0; i <= 100; i += 1) {
      const stop = stopForRatio(i / 100);
      expect(stop).toBeGreaterThanOrEqual(previous);
      previous = stop;
    }
  });

  it("empty is its own stop", () => {
    expect(stopForRatio(0)).toBe(0);
    expect(stopForRatio(-0.5)).toBe(0);
  });
});

describe("namesToTallies (HB4: five-bar groups, never digits)", () => {
  it("decomposes into groups of five plus a remainder", () => {
    expect(namesToTallies(0)).toEqual({ groups: 0, remainder: 0 });
    expect(namesToTallies(4)).toEqual({ groups: 0, remainder: 4 });
    expect(namesToTallies(5)).toEqual({ groups: 1, remainder: 0 });
    expect(namesToTallies(13)).toEqual({ groups: 2, remainder: 3 });
  });

  it("never yields five loose strokes", () => {
    for (let n = 0; n < 64; n += 1) {
      const { groups, remainder } = namesToTallies(n);
      expect(remainder).toBeLessThan(HUD_PARAMS.tallies.groupSize);
      expect(groups * HUD_PARAMS.tallies.groupSize + remainder).toBe(n);
    }
  });
});

describe("textStepFor (TEXT_BIBLE §2)", () => {
  it("applies clamp(stacks − vigilRestore, 0, 3)", () => {
    expect(textStepFor(0, 0, false)).toBe(0);
    expect(textStepFor(2, 0, false)).toBe(2);
    expect(textStepFor(2, 1, false)).toBe(1);
    expect(textStepFor(3, 1, false)).toBe(2);
    expect(textStepFor(9, 0, false)).toBe(3);
    expect(textStepFor(0, 1, false)).toBe(0);
  });

  it("L-T4: a register lock holds the surface at step 0", () => {
    expect(textStepFor(3, 0, true)).toBe(0);
  });
});

describe("turnStepFor (D6: margin narrowing, never a bar)", () => {
  it("quantizes buildup below the cap into narrowing stops", () => {
    expect(turnStepFor(0, 100)).toEqual({ turnStep: 0, turned: false });
    expect(turnStepFor(20, 100).turnStep).toBe(0);
    expect(turnStepFor(40, 100).turnStep).toBe(1);
    expect(turnStepFor(80, 100).turnStep).toBe(2);
  });

  it("at cap the actor is Turned (HB6)", () => {
    expect(turnStepFor(100, 100)).toEqual({
      turnStep: HUD_PARAMS.turn.narrowingSteps,
      turned: true,
    });
    expect(turnStepFor(120, 100).turned).toBe(true);
  });

  it("a zero cap never divides", () => {
    expect(turnStepFor(5, 0)).toEqual({ turnStep: 0, turned: false });
  });
});

describe("deriveHudModel over the fixture set", () => {
  it("derives every fixture without throwing and keeps fractions stepped", () => {
    for (const name of HUD_FIXTURE_ORDER) {
      const model = deriveHudModel(fixture(name));
      const stops = HUD_PARAMS.meters.litStops;
      expect(model.pulseFraction * stops).toBe(model.pulseStop);
      expect(model.breathFraction * stops).toBe(model.breathStop);
      expect(model.textStep).toBeGreaterThanOrEqual(0);
      expect(model.textStep).toBeLessThanOrEqual(3);
    }
  });

  it("cabin_vigil: lit hearth, full measures, vigil restore holds textStep down", () => {
    const model = deriveHudModel(fixture("cabin_vigil"));
    expect(model.hearth).toBe("lit");
    expect(model.pulseStop).toBe(HUD_PARAMS.meters.litStops);
    expect(model.breathStop).toBe(HUD_PARAMS.meters.litStops);
    expect(model.textStep).toBe(0);
    expect(model.tallies).toEqual({ groups: 0, remainder: 4 });
  });

  it("numbness_2: two Ember stacks degrade the surface two steps", () => {
    const model = deriveHudModel(fixture("numbness_2"));
    expect(model.textStep).toBe(2);
    expect(model.unwrittenTag).toBe(true);
    expect(model.tallies).toEqual({ groups: 2, remainder: 3 });
  });

  it("turned fixture reaches the Turned verdict", () => {
    const model = deriveHudModel(fixture("turned"));
    expect(model.turned).toBe(true);
    expect(model.doses).toBe(0);
  });
});
