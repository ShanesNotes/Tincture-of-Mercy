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
}

interface WorldBrowserFacade {
  readonly ready: boolean;
  readonly backend: WorldBackend;
  snapshot(): WorldDebugSnapshot;
  stateHash(): string;
  runReplay(): GoldenReplayResult | Promise<GoldenReplayResult>;
  stop(): void;
  perfSnapshot(): WorldPerfSnapshot;
}

const GOLDEN_TICKS = 41_413;
const GOLDEN_FINAL_HASH = "4a8d3191";
const GOLDEN_CHECKPOINTS = [
  { tick: 1, stateHash: "73913a9e" },
  { tick: 1_327, stateHash: "c49ac06c" },
  { tick: 1_370, stateHash: "b29f5137" },
  { tick: 1_977, stateHash: "0086ccfd" },
  { tick: 6_753, stateHash: "7488b404" },
  { tick: 39_788, stateHash: "89469d9a" },
  { tick: 39_996, stateHash: "e1201422" },
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
  expect(publicState.snapshot.actors).toHaveLength(11);
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

  test("three-wolf yard fight stays within the WebGPU frame-time floor at 1080p", async ({
    page,
  }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 1_920, height: 1_080 });
    const errors = await bootWorld(page, "webgpu");

    await page.evaluate(async () => {
      const world = (window as unknown as { __TINCTURE_WORLD__?: WorldBrowserFacade })
        .__TINCTURE_WORLD__;
      if (world === undefined) {
        throw new Error("window.__TINCTURE_WORLD__ is missing");
      }
      await world.runReplay();
      await new Promise<void>((resolve) => {
        let remaining = 35;
        const waitForFrame = (): void => {
          remaining -= 1;
          if (remaining === 0) {
            resolve();
          } else {
            requestAnimationFrame(waitForFrame);
          }
        };
        requestAnimationFrame(waitForFrame);
      });
    });
    const measured = await page.evaluate(() => {
      const world = (window as unknown as { __TINCTURE_WORLD__?: WorldBrowserFacade })
        .__TINCTURE_WORLD__;
      if (world === undefined) {
        throw new Error("window.__TINCTURE_WORLD__ is missing");
      }
      return { perf: world.perfSnapshot(), devicePixelRatio: window.devicePixelRatio };
    });
    const { perf } = measured;
    console.info(
      `[world-perf] backend=${perf.backend} viewport=1920x1080 dpr=${measured.devicePixelRatio} ` +
      `samples=${perf.sampleCount} p95=${perf.p95FrameMs.toFixed(3)}ms`,
    );

    expect(perf.backend).toBe("webgpu");
    expect(perf.sampleCount).toBeGreaterThanOrEqual(30);
    expect(perf.p95FrameMs).toBeGreaterThan(0);
    expect(perf.p95FrameMs).toBeLessThanOrEqual(16.7);
    expect(errors).toEqual([]);
  });
});
