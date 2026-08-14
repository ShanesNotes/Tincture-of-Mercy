import { expect, test, type Page } from "@playwright/test";

interface DebugSnap {
  readonly unlocked: boolean;
  readonly scheduled: readonly { readonly cueId: string; readonly deltaMs: number; readonly hitstopTicks: number }[];
  readonly maxAbsImpactDeltaMs: number;
}

const bootAudio = async (page: Page): Promise<DebugSnap> => {
  await page.goto("/?renderer=webgl2");
  const body = page.locator("body");
  await expect(body).toHaveAttribute("data-boot-status", "ready");

  return page.evaluate(`(async () => {
    const audio = await import("/src/app/audio/index.ts");
    const raw = await fetch("/src/data/audio_params.json").then((response) => response.json());
    const params = audio.parseAudioParams(raw);
    const context = new audio.FakeAudioContext();
    const runtime = audio.createAudioRuntime({ params, context });
    window.__TINCTURE_AUDIO__ = runtime;
    return runtime.debug.snapshot();
  })()`) as Promise<DebugSnap>;
};

test("boots muted until a gesture, then a scripted input schedules impact cues", async ({
  page,
}) => {
  const before = await bootAudio(page);
  expect(before.unlocked).toBe(false);
  expect(before.scheduled).toEqual([]);

  await page.locator('[data-testid="game-canvas"]').click();

  const after = await page.evaluate(async () => {
    const host = window as unknown as {
      __TINCTURE_AUDIO__?: {
        unlockFromGesture: () => Promise<void>;
        ingest: (events: readonly { type: string; tick: number; weight: string }[]) => void;
        syncClock: (tick: number, audioTime: number) => void;
        debug: { snapshot: () => { unlocked: boolean; scheduled: { cueId: string; deltaMs: number; hitstopTicks: number }[]; maxAbsImpactDeltaMs: number } };
      };
    };
    const runtime = host.__TINCTURE_AUDIO__;
    if (runtime === undefined) {
      throw new Error("audio runtime missing");
    }
    await runtime.unlockFromGesture();
    runtime.syncClock(0, 0);
    runtime.ingest([{ type: "combat.hit", tick: 18, weight: "light" }]);
    return runtime.debug.snapshot();
  });

  expect(after.unlocked).toBe(true);
  expect(after.scheduled.map((entry) => entry.cueId)).toEqual(["hit.light", "impact.light"]);
  expect(after.maxAbsImpactDeltaMs).toBeLessThanOrEqual(10);
  const impact = after.scheduled.find((entry) => entry.cueId === "impact.light");
  expect(impact?.hitstopTicks).toBe(3);
  expect(Math.abs(impact?.deltaMs ?? 99)).toBeLessThanOrEqual(10);
});
