import { describe, expect, it } from "vitest";

import { TICK_MS } from "../sim/tick";
import { FixedTickLoop } from "./loop";

const createLoop = () => {
  const alphas: number[] = [];
  let ticks = 0;
  const loop = new FixedTickLoop({
    render: (alpha) => alphas.push(alpha),
    sampleInput: () => undefined,
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

  it("pauses on lifecycle blur until input resumes it", () => {
    const harness = createLoop();
    harness.loop.advance(TICK_MS);
    harness.loop.pauseUntilInput();
    harness.loop.advance(TICK_MS * 3);

    expect(harness.ticks()).toBe(1);
    expect(harness.loop.awaitingResumeInput).toBe(true);

    harness.loop.resumeFromInput();
    harness.loop.advance(TICK_MS);

    expect(harness.ticks()).toBe(2);
  });

  describe("non-pause menu transitions (hearth / death)", () => {
    // Slice contract: 0 <= acc < TICK_MS at all times; no negative alpha; no
    // eaten ticks. Hearth and Open Page menus never pause the sim, so their
    // open/close transitions must leave the accumulator alone.
    const expectLoopInvariant = (loop: FixedTickLoop, alphas: readonly number[]): void => {
      for (const alpha of alphas) {
        expect(alpha).toBeGreaterThanOrEqual(0);
        expect(alpha).toBeLessThan(1);
      }
      expect(loop.counters.alpha).toBeGreaterThanOrEqual(0);
      expect(loop.counters.alpha).toBeLessThan(1);
    };

    it("hearth menu opening mid-catch-up eats no ticks and keeps alpha non-negative", () => {
      const alphas: number[] = [];
      let ticks = 0;
      const self: { current?: FixedTickLoop } = {};
      const loop = new FixedTickLoop({
        render: (alpha) => alphas.push(alpha),
        sampleInput: () => undefined,
        step: () => {
          ticks += 1;
          if (ticks === 1) {
            // Walking into the Hearth fires applyMenu("hearth") mid-step:
            // setMenuPaused(false) because the Hearth menu does not pause.
            self.current?.setMenuPaused(false);
          }
        },
      });
      self.current = loop;

      loop.advance(TICK_MS * 2.5);

      expect(ticks).toBe(2);
      expectLoopInvariant(loop, alphas);

      // The leftover half tick survives the transition instead of being eaten.
      loop.advance(TICK_MS / 2);
      expect(ticks).toBe(3);
      expectLoopInvariant(loop, alphas);
    });

    it("hearth menu opening between frames preserves the pending fraction", () => {
      const alphas: number[] = [];
      let ticks = 0;
      const loop = new FixedTickLoop({
        render: (alpha) => alphas.push(alpha),
        sampleInput: () => undefined,
        step: () => {
          ticks += 1;
        },
      });

      loop.advance(TICK_MS / 2);
      loop.setMenuPaused(false); // hearth menu opens; sim keeps running
      loop.advance(TICK_MS / 2);

      expect(ticks).toBe(1);
      expectLoopInvariant(loop, alphas);
    });

    it("death overlay opening and closing eats no accumulated time", () => {
      const alphas: number[] = [];
      let ticks = 0;
      const loop = new FixedTickLoop({
        render: (alpha) => alphas.push(alpha),
        sampleInput: () => undefined,
        step: () => {
          ticks += 1;
        },
      });

      loop.advance(TICK_MS / 2);
      // The Open Page stands over a living world, then the player closes it.
      // Neither edge pauses, so neither may touch the accumulator.
      loop.setMenuPaused(false); // death overlay opens
      loop.setMenuPaused(false); // "death-acknowledged" closes it
      loop.advance(TICK_MS / 2);

      expect(ticks).toBe(1);
      expectLoopInvariant(loop, alphas);
    });

    it("a true pause opening mid-catch-up never drives alpha negative", () => {
      const alphas: number[] = [];
      let ticks = 0;
      const self: { current?: FixedTickLoop } = {};
      const loop = new FixedTickLoop({
        render: (alpha) => alphas.push(alpha),
        sampleInput: () => undefined,
        step: () => {
          ticks += 1;
          if (ticks === 1) {
            self.current?.setMenuPaused(true); // pause menu opens mid-step
          }
        },
      });
      self.current = loop;

      loop.advance(TICK_MS * 2.5);

      expect(ticks).toBe(1);
      expectLoopInvariant(loop, alphas);

      loop.setMenuPaused(false);
      loop.advance(TICK_MS);
      expect(ticks).toBe(2);
      expectLoopInvariant(loop, alphas);
    });
  });

  it("samples input before stepping the next simulation tick", () => {
    const calls: string[] = [];
    const loop = new FixedTickLoop({
      render: () => calls.push("render"),
      sampleInput: () => calls.push("sample"),
      step: () => calls.push("step"),
    });

    loop.advance(TICK_MS);

    expect(calls).toEqual(["sample", "step", "render"]);
  });
});
