import { describe, expect, it } from "vitest";

import { TICK_MS } from "../sim/tick";
import { FixedTickLoop } from "./loop";

const createLoop = () => {
  const alphas: number[] = [];
  let ticks = 0;
  const loop = new FixedTickLoop({
    render: (alpha) => alphas.push(alpha),
    step: () => {
      ticks += 1;
    },
  });
  return { alphas, loop, ticks: () => ticks };
};

describe("FixedTickLoop", () => {
  it.each([60, 120, 144])("steps exactly 60 ticks across one second at %i Hz", (hz) => {
    const harness = createLoop();

    for (let frame = 0; frame < hz; frame += 1) {
      harness.loop.advance(1000 / hz);
    }

    expect(harness.ticks()).toBe(60);
    expect(harness.loop.counters.simTicks).toBe(60);
    expect(harness.loop.counters.alpha).toBeCloseTo(0, 8);
  });

  it("clamps catch-up to five ticks and reports discarded debt", () => {
    const harness = createLoop();

    harness.loop.advance(TICK_MS * 9);

    expect(harness.ticks()).toBe(5);
    expect(harness.loop.counters.clampedFrames).toBe(1);
    expect(harness.loop.counters.discardedMs).toBeCloseTo(TICK_MS * 4, 8);
  });

  it("discards hidden debt and waits for input before resuming", () => {
    const harness = createLoop();
    harness.loop.advance(TICK_MS / 2);
    harness.loop.setVisibility(true);
    harness.loop.advance(1_000);
    harness.loop.setVisibility(false);
    harness.loop.advance(TICK_MS);

    expect(harness.ticks()).toBe(0);
    expect(harness.loop.awaitingResumeInput).toBe(true);

    harness.loop.resumeFromInput();
    harness.loop.advance(TICK_MS);

    expect(harness.ticks()).toBe(1);
    expect(harness.loop.awaitingResumeInput).toBe(false);
  });
});
