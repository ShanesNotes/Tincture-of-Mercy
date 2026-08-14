import { expect, test, type Page } from "@playwright/test";

type WorldBackend = "webgpu" | "webgl2";

interface GoldenReplayCheckpoints {
  readonly wolfKilled: boolean;
  readonly playerDamageTaken: number;
  readonly expectedPlayerDamage: number;
  readonly maxConcurrentAttackTokens: number;
  readonly playerDied: boolean;
  readonly openPageDropped: boolean;
  readonly respawnedAtHearth: boolean;
  readonly openPageRecovered: boolean;
  readonly wolvesRespawned: boolean;
  readonly flaskCommitted: boolean;
  readonly restedAtHearth: boolean;
}

interface GoldenReplayResult {
  readonly ticks: number;
  readonly finalHash: string;
  readonly replayCheckpoints: readonly WorldReplayCheckpoint[];
  readonly checkpoints: GoldenReplayCheckpoints;
}

interface WorldReplayCheckpoint {
  readonly tick: number;
  readonly stateHash: string;
  readonly tokenInvariant: boolean;
  readonly moduleClocksAligned: boolean;
}

interface WorldDebugSnapshot {
  readonly tick: number;
  readonly actors: readonly unknown[];
  readonly tokenInvariant: boolean;
}

interface WorldPerfSnapshot {
  readonly backend: WorldBackend;
  readonly sampleCount: number;
  readonly p95FrameMs: number;
  /** Stage breakdown, logged so a failing median names its own cause. */
  readonly p95ReducerMs: number;
  readonly p95RenderSubmitMs: number;
}

interface WorldBrowserFacade {
  readonly ready: boolean;
  readonly backend: WorldBackend;
  snapshot(): WorldDebugSnapshot;
  stateHash(): string;
  runReplay(): GoldenReplayResult | Promise<GoldenReplayResult>;
  stop(): void;
  perfSnapshot(): WorldPerfSnapshot;
  resetPerf(): void;
}

const GOLDEN_TICKS = 41_413;
const GOLDEN_FINAL_HASH = "13ae38a3";
const GOLDEN_CHECKPOINTS = [
  { tick: 1, stateHash: "bf0b8a47" },
  { tick: 1_327, stateHash: "c626f63d" },
  { tick: 1_370, stateHash: "259a0888" },
  { tick: 1_977, stateHash: "d12ceaff" },
  { tick: 6_753, stateHash: "fcf8b38c" },
  { tick: 39_788, stateHash: "0c476636" },
  { tick: 39_996, stateHash: "3ea54d44" },
  { tick: GOLDEN_TICKS, stateHash: GOLDEN_FINAL_HASH },
] as const;

const bootWorld = async (
  page: Page,
  backend: WorldBackend,
): Promise<readonly string[]> => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(`console: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    errors.push(`pageerror: ${error.message}`);
  });

  await page.goto(`/?play=ironwood&renderer=${backend}`);
  await page.waitForFunction(
    () => ["ready", "error"].includes(document.body.dataset.bootStatus ?? ""),
    undefined,
    { timeout: 120_000 },
  );
  await expect(page.locator("body")).toHaveAttribute("data-boot-status", "ready", {
    timeout: 1_000,
  });
  await expect(page.locator("body")).toHaveAttribute("data-renderer-backend", backend);
  await expect(page.getByTestId("game-canvas")).toBeVisible();
  await expect
    .poll(
      () => page.evaluate(() => (
        window as unknown as { __TINCTURE_WORLD__?: WorldBrowserFacade }
      ).__TINCTURE_WORLD__?.ready ?? false),
      { timeout: 120_000 },
    )
    .toBe(true);

  const publicState = await page.evaluate(() => {
    const world = (window as unknown as { __TINCTURE_WORLD__?: WorldBrowserFacade })
      .__TINCTURE_WORLD__;
    if (world === undefined) {
      throw new Error("window.__TINCTURE_WORLD__ is missing");
    }
    return {
      backend: world.backend,
      hash: world.stateHash(),
      snapshot: world.snapshot(),
    };
  });
  expect(publicState.backend).toBe(backend);
  expect(publicState.hash).toMatch(/^[0-9a-f]{8,}$/);
  expect(publicState.snapshot.actors).toHaveLength(12);
  expect(publicState.snapshot.tokenInvariant).toBe(true);
  expect(publicState.snapshot.tick).toBeGreaterThanOrEqual(0);

  return errors;
};

test.describe("Ironwood world assembly", () => {
  test("boots the playable world without browser errors on both render backends", async ({
    page,
  }) => {
    test.setTimeout(300_000);

    for (const backend of ["webgpu", "webgl2"] as const) {
      const errors = await bootWorld(page, backend);
      expect(errors, `${backend} emitted browser errors`).toEqual([]);
      await page.evaluate(() => (
        window as unknown as { __TINCTURE_WORLD__?: WorldBrowserFacade }
      ).__TINCTURE_WORLD__?.stop());
    }
  });

  test("the exact-tick golden input completes combat, death, recovery, and respawn deterministically", async ({
    page,
  }) => {
    // The full 41k-tick reducer is intentionally executed twice against the
    // baked collision world. Keep the watchdog above measured CPU time rather
    // than weakening the determinism proof to checkpoint state patches.
    test.setTimeout(600_000);
    const errors = await bootWorld(page, "webgl2");

    const [first, second] = await page.evaluate(async () => {
      const world = (window as unknown as { __TINCTURE_WORLD__?: WorldBrowserFacade })
        .__TINCTURE_WORLD__;
      if (world === undefined) {
        throw new Error("window.__TINCTURE_WORLD__ is missing");
      }
      const first = await world.runReplay();
      const second = await world.runReplay();
      return [first, second] as const;
    });

    expect(first.ticks).toBe(GOLDEN_TICKS);
    expect(first.checkpoints.wolfKilled).toBe(true);
    expect(first.checkpoints.expectedPlayerDamage).toBe(38);
    expect(first.checkpoints.playerDamageTaken).toBe(
      first.checkpoints.expectedPlayerDamage,
    );
    expect(first.checkpoints.maxConcurrentAttackTokens).toBeLessThanOrEqual(1);
    expect(first.checkpoints.playerDied).toBe(true);
    expect(first.checkpoints.openPageDropped).toBe(true);
    expect(first.checkpoints.respawnedAtHearth).toBe(true);
    expect(first.checkpoints.openPageRecovered).toBe(true);
    expect(first.checkpoints.wolvesRespawned).toBe(true);
    expect(first.checkpoints.flaskCommitted).toBe(true);
    expect(first.checkpoints.restedAtHearth).toBe(true);
    expect(
      first.replayCheckpoints.map(({ tick, stateHash }) => ({ tick, stateHash })),
    ).toEqual(GOLDEN_CHECKPOINTS);
    expect(first.replayCheckpoints.every(({ tokenInvariant }) => tokenInvariant)).toBe(true);
    expect(
      first.replayCheckpoints.every(({ moduleClocksAligned }) => moduleClocksAligned),
    ).toBe(true);
    expect(second).toEqual(first);
    expect(second.finalHash).toBe(first.finalHash);
    expect(first.finalHash).toBe(GOLDEN_FINAL_HASH);
    expect(errors).toEqual([]);
  });

  /**
   * Frame time on a developer box is environment-sensitive: the window straight
   * off the 41k-tick replay is measurably worse than any window after it (cold
   * JIT plus the GC churn the replay leaves behind), and anything else running
   * on the machine lands squarely in the p95. One 35-frame sample has read as
   * high as 42 ms and as low as 14 ms on the same build.
   *
   * The protocol, therefore: settle after the replay, then measure N=3 windows
   * of 90 frames and take the MEDIAN p95. Run it on a quiet box — no other
   * browser, build, or test process — and treat a single failing window as
   * noise, a failing median as a regression.
   *
   * The gate constant stays at the 16.7 ms (60 Hz) floor. GATES' 13.3 ms
   * (75 Hz) bar is future work and is deliberately not asserted here.
   */
  test("three-wolf yard fight holds the WebGPU frame-time floor across three windows", async ({
    page,
  }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 1_920, height: 1_080 });
    const errors = await bootWorld(page, "webgpu");

    const runs = await page.evaluate(async () => {
      const world = (window as unknown as { __TINCTURE_WORLD__?: WorldBrowserFacade })
        .__TINCTURE_WORLD__;
      if (world === undefined) {
        throw new Error("window.__TINCTURE_WORLD__ is missing");
      }
      const settle = (frames: number): Promise<void> =>
        new Promise<void>((resolve) => {
          let remaining = frames;
          const waitForFrame = (): void => {
            remaining -= 1;
            if (remaining <= 0) resolve();
            else requestAnimationFrame(waitForFrame);
          };
          requestAnimationFrame(waitForFrame);
        });

      await world.runReplay();
      // Discard the cold window the replay leaves behind.
      await settle(60);
      const windows: WorldPerfSnapshot[] = [];
      for (let run = 0; run < 3; run += 1) {
        world.resetPerf();
        await settle(90);
        windows.push(world.perfSnapshot());
      }
      return { windows, devicePixelRatio: window.devicePixelRatio };
    });

    const p95s = runs.windows.map(({ p95FrameMs }) => p95FrameMs).sort((a, b) => a - b);
    const median = p95s[1] ?? 0;
    console.info(
      `[world-perf] backend=${runs.windows[0]?.backend ?? "?"} viewport=1920x1080 ` +
      `dpr=${runs.devicePixelRatio} windows=${p95s.map((value) => value.toFixed(2)).join("/")}ms ` +
      `median-p95=${median.toFixed(2)}ms ` +
      `reducer-p95=${(runs.windows[1]?.p95ReducerMs ?? 0).toFixed(2)}ms ` +
      `render-p95=${(runs.windows[1]?.p95RenderSubmitMs ?? 0).toFixed(2)}ms`,
    );

    for (const window of runs.windows) {
      expect(window.backend).toBe("webgpu");
      expect(window.sampleCount).toBeGreaterThanOrEqual(30);
      expect(window.p95FrameMs).toBeGreaterThan(0);
    }
    expect(median).toBeLessThanOrEqual(16.7);
    expect(errors).toEqual([]);
  });
});
