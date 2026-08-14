import { describe, expect, it } from "vitest";

import { advanceActorClocks, mergeHitstop } from "./hitstop";

describe("actor-local hitstop", () => {
  it("freezes exactly the awarded number of subsequent actor ticks", () => {
    let clocks = {
      actionTick: 7,
      combatClock: 20,
      hitstopRemaining: 3,
      inputClock: 18,
    };

    for (let frozenTick = 0; frozenTick < 3; frozenTick += 1) {
      const result = advanceActorClocks(clocks);
      expect(result.frozen).toBe(true);
      clocks = result.clocks;
      expect(clocks).toMatchObject({ actionTick: 7, combatClock: 20, inputClock: 18 });
    }

    expect(clocks.hitstopRemaining).toBe(0);
    expect(advanceActorClocks(clocks)).toEqual({
      clocks: {
        actionTick: 8,
        combatClock: 21,
        hitstopRemaining: 0,
        inputClock: 19,
      },
      frozen: false,
    });
  });

  it("combines simultaneous hitstop awards by maximum rather than addition", () => {
    expect(mergeHitstop(6, 8)).toBe(8);
    expect(mergeHitstop(9, 5)).toBe(9);
  });
});
