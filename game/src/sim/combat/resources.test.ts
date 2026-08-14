import { describe, expect, it } from "vitest";

import {
  applySteadyHit,
  isHyperarmorActive,
  resolveSteadyOutcome,
  tickBreathRegen,
  tickSteadyReset,
  trySpendBreath,
  type BreathRegenParams,
  type BreathState,
  type SteadyOutcomeBands,
  type SteadyState,
} from "./resources";

const breathRegen: BreathRegenParams = {
  regenPerSecond: 45,
  ticksPerSecond: 60,
  regenDelayTicks: 33,
  guardingMultiplier: 0.4,
};

const outcomes: SteadyOutcomeBands = {
  flinch: 10,
  stagger: 20,
  knockdown: 30,
};

describe("Breath", () => {
  it("spends atomically and denies costs above the current reserve", () => {
    const initial: BreathState = {
      value: 22,
      max: 100,
      ticksSinceSpend: 80,
    };
    const spent = trySpendBreath(initial, 22);

    expect(spent.spent).toBe(true);
    expect(spent.state).toEqual({ value: 0, max: 100, ticksSinceSpend: 0 });
    expect(initial.value).toBe(22);

    const denied = trySpendBreath(spent.state, 1);
    expect(denied).toEqual({ state: spent.state, spent: false });
  });

  it("starts regen on the configured clean tick and scales it while guarding", () => {
    let state: BreathState = {
      value: 0,
      max: 100,
      ticksSinceSpend: 0,
    };
    for (let tick = 1; tick < 33; tick += 1) {
      state = tickBreathRegen(state, breathRegen, false);
      expect(state.value).toBe(0);
    }

    state = tickBreathRegen(state, breathRegen, false);
    expect(state.value).toBe(0.75);
    state = tickBreathRegen(state, breathRegen, true);
    expect(state.value).toBeCloseTo(1.05);
  });

  it("clamps regeneration to max Breath", () => {
    const result = tickBreathRegen(
      { value: 99.8, max: 100, ticksSinceSpend: 33 },
      breathRegen,
      false,
    );
    expect(result.value).toBe(100);
  });
});

describe("Steady", () => {
  it("fully resets buildup on the configured clean tick", () => {
    let state: SteadyState = { buildup: 18, cleanTicks: 0 };
    for (let tick = 1; tick < 90; tick += 1) {
      state = tickSteadyReset(state, 90);
      expect(state.buildup).toBe(18);
    }

    expect(tickSteadyReset(state, 90)).toEqual({
      buildup: 0,
      cleanTicks: 90,
    });
  });

  it("resolves ordered class outcome bands with hyperarmor added to poise", () => {
    expect(resolveSteadyOutcome(9, outcomes, 0)).toBe("none");
    expect(resolveSteadyOutcome(10, outcomes, 0)).toBe("flinch");
    expect(resolveSteadyOutcome(20, outcomes, 0)).toBe("stagger");
    expect(resolveSteadyOutcome(30, outcomes, 0)).toBe("knockdown");
    expect(resolveSteadyOutcome(30, outcomes, 25)).toBe("none");
    expect(resolveSteadyOutcome(35, outcomes, 25)).toBe("flinch");
  });

  it("applies the passed Wither multiplier and resets the clean clock on hit", () => {
    const result = applySteadyHit(
      { buildup: 6, cleanTicks: 44 },
      10,
      "wither",
      {
        bands: outcomes,
        witherMultiplier: 1.4,
        hyperarmorBonus: 0,
      },
    );

    expect(result.appliedBuildup).toBe(14);
    expect(result.state).toEqual({ buildup: 20, cleanTicks: 0 });
    expect(result.outcome).toBe("stagger");
  });

  it("queries half-open hyperarmor windows without owning their tuning", () => {
    const authoredHeavyWindow = { startTick: 18, endTickExclusive: 30 };

    expect(isHyperarmorActive(17, authoredHeavyWindow)).toBe(false);
    expect(isHyperarmorActive(18, authoredHeavyWindow)).toBe(true);
    expect(isHyperarmorActive(29, authoredHeavyWindow)).toBe(true);
    expect(isHyperarmorActive(30, authoredHeavyWindow)).toBe(false);
  });
});
