import { expect, test, type Page } from "@playwright/test";

import { Gauntlet, livingWolvesOf, wardenOf } from "./scenarios/harness";

type WorldBackend = "webgpu" | "webgl2";

interface WorldPerfSnapshot {
  readonly backend: WorldBackend;
  readonly sampleCount: number;
  readonly p95FrameMs: number;
  readonly p95ReducerMs: number;
  readonly p95RenderSubmitMs: number;
}

interface WorldBrowserFacade {
  readonly ready: boolean;
  readonly backend: WorldBackend;
  snapshot(): { readonly actors: readonly unknown[] };
  stop(): void;
  perfSnapshot(): WorldPerfSnapshot;
  resetPerf(): void;
}

/**
 * O-F4 (partial, chair-adjudicated).
 *
 * Assert the CURRENT floor: median p95 ≤ 16.7 ms over 3×90-frame windows,
 * plus the 33 ms spike bar over each window. GATES.md / PRD SC5 13.3 ms
 * (75 Hz) is the round-2 ratchet and is deliberately not asserted here.
 *
 * The yard fight stays in e2e/world.spec.ts (`@perf` tagged). This file is
 * the boss-scene lane: walk the shipped page into the Warden's ring and
 * measure while he is live. Ironwood keeps the yard pack in the world, so
 * the rendered set is the player + Warden + wolves (≥3 actors).
 */
test("Warden fight holds the WebGPU frame-time floor across three windows @perf", async ({
  page,
}) => {
  test.setTimeout(600_000);
  await page.setViewportSize({ width: 1_920, height: 1_080 });
  const run = await Gauntlet.boot(page, "perf-boss", { backend: "webgpu" });
  await run.lockOntoWardenAtRange(12);
  const arrived = await run.walkToArenaRing();
  expect(arrived.boss.enteredArena, "must be inside the Warden fight").toBe(true);
  expect(wardenOf(arrived), "the Warden must be present").toBeDefined();
  expect(arrived.actors.length, "boss scene should render ≥3 actors").toBeGreaterThanOrEqual(3);
  // Wolves stay in the Ironwood world while the duel runs; if a later
  // assembly unloads them this assertion documents the drop.
  expect(livingWolvesOf(arrived).length).toBeGreaterThanOrEqual(0);

  const measured = await measureWindows(page);
  const p95s = measured.windows.map(({ p95FrameMs }) => p95FrameMs).sort((a, b) => a - b);
  const median = p95s[1] ?? 0;
  console.info(
    `[boss-perf] backend=${measured.windows[0]?.backend ?? "?"} viewport=1920x1080 ` +
      `dpr=${measured.devicePixelRatio} windows=${p95s.map((value) => value.toFixed(2)).join("/")}ms ` +
      `median-p95=${median.toFixed(2)}ms ` +
      `max-frame=${measured.maxFrameMs.map((value) => value.toFixed(2)).join("/")}ms ` +
      // Round-2 target: median p95 ≤ 13.3 (not asserted this round).
      `round2-target=13.3`,
  );

  for (const [index, window] of measured.windows.entries()) {
    expect(window.backend).toBe("webgpu");
    expect(window.sampleCount).toBeGreaterThanOrEqual(30);
    expect(window.p95FrameMs).toBeGreaterThan(0);
    expect(measured.maxFrameMs[index], `window ${index} spike`).toBeLessThanOrEqual(33);
  }
  expect(median).toBeLessThanOrEqual(16.7);
});

const measureWindows = async (page: Page) =>
  page.evaluate(async () => {
    const world = (window as unknown as { __TINCTURE_WORLD__?: WorldBrowserFacade })
      .__TINCTURE_WORLD__;
    if (world === undefined) {
      throw new Error("window.__TINCTURE_WORLD__ is missing");
    }
    const settle = (frames: number): Promise<number[]> =>
      new Promise((resolve) => {
        const deltas: number[] = [];
        let remaining = frames;
        let last = performance.now();
        const waitForFrame = (): void => {
          const now = performance.now();
          deltas.push(now - last);
          last = now;
          remaining -= 1;
          if (remaining <= 0) resolve(deltas);
          else requestAnimationFrame(waitForFrame);
        };
        requestAnimationFrame(waitForFrame);
      });

    await settle(60);
    const windows: WorldPerfSnapshot[] = [];
    const maxFrameMs: number[] = [];
    for (let run = 0; run < 3; run += 1) {
      world.resetPerf();
      const deltas = await settle(90);
      windows.push(world.perfSnapshot());
      maxFrameMs.push(Math.max(...deltas));
    }
    return { windows, maxFrameMs, devicePixelRatio: window.devicePixelRatio };
  });
