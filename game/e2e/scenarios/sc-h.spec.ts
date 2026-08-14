import { expect, test } from "@playwright/test";

import { Gauntlet } from "./harness";

/**
 * SC-H — two Embers, and the page's own language going numb.
 *
 * Ember's cost is the Numbness ladder (D6, TEXT_BIBLE §2): each dose is a
 * permanent stack that drags the border's verdict band out of the Church
 * register and into the State's. This row drives the apparatus at the seam the
 * live world feeds it — `hudInputFromWorld` hands the border `numbnessStacks`
 * straight off `MetaState` — and proves the degradation is visible.
 *
 * BLOCKER (sim half): nothing in the assembled world can swallow an Ember.
 * `beginEmberUse` (`src/sim/meta/tincture.ts`) has no caller outside its unit
 * tests: `INPUT_BUFFER_WINDOWS` binds no `ember` action, `playerCommands`
 * forwards only attack/heavy/roll/flask, and no scene script in
 * `scene_scripts.json` emits an ember verb. So "Ember use x2" cannot be
 * scripted through any input path, and the two stacks below are set on the
 * HUD directly. A `WorldInputFrame` seam for Ember (or a hearth verb that
 * routes to `beginEmberUse`) would close this row.
 */

const BASE_STATE = {
  pulse: 210,
  maxPulse: 300,
  breath: 100,
  maxBreath: 100,
  doses: 1,
  maxDoses: 3,
  namesCarried: 4,
  turn: 80,
  turnCap: 100,
  hearth: "unlit" as const,
  bossPhase: "none" as const,
  unwrittenTag: false,
  numbnessStacks: 0,
  vigilRestore: 0,
  registerLocked: false,
  zone: "wild" as const,
};

interface BorderDescriptor {
  readonly numbnessStep?: number;
  readonly [key: string]: unknown;
}

test("SC-H: two Ember stacks degrade the border's verdict, visibly", async ({ page }) => {
  test.setTimeout(180_000);
  const run = await Gauntlet.bootScene(page, "sc-h", "/?scene=hud&renderer=webgl2");
  await expect(page.locator("body")).toHaveAttribute("data-hud-mounted", "true");

  const border = page.getByTestId("hud-border");
  const verdict = page.getByTestId("hud-verdict");

  const setStacks = async (stacks: number): Promise<void> => {
    await page.evaluate(
      ([base, numbnessStacks]) => {
        const handle = window.__hud;
        if (handle === undefined) throw new Error("window.__hud missing");
        handle.setState({ ...(base as typeof BASE_STATE), numbnessStacks: numbnessStacks as number });
      },
      [BASE_STATE, stacks] as const,
    );
  };

  const descriptor = async (): Promise<BorderDescriptor> => {
    const raw = await page.locator("body").getAttribute("data-hud-border");
    expect(raw, "the border must publish its descriptor").not.toBeNull();
    return JSON.parse(raw ?? "{}") as BorderDescriptor;
  };

  const readings: { stacks: number; step: number; text: string; register: string | null }[] = [];
  const shots: Buffer[] = [];

  for (const stacks of [0, 1, 2]) {
    await setStacks(stacks);
    await expect
      .poll(async () => (await descriptor()).numbnessStep ?? -1)
      .toBe(stacks);
    const reading = {
      stacks,
      step: (await descriptor()).numbnessStep ?? -1,
      text: (await verdict.textContent()) ?? "",
      register: await verdict.getAttribute("data-register"),
    };
    readings.push(reading);
    shots.push(await border.screenshot());
    await run.captureRaw(`ember-${String(stacks)}`, {
      embersSwallowed: stacks,
      ...reading,
      descriptor: await descriptor(),
    });
  }

  const [clean, first, second] = readings;
  expect(clean?.step).toBe(0);
  expect(first?.step, "the first Ember must step the text register once").toBe(1);
  expect(second?.step, "the second Ember must step it again").toBe(2);
  expect(
    second?.text,
    "after two Embers the verdict band must not still read in the Church register",
  ).not.toBe(clean?.text);
  expect(second?.register, "two stacks must have pulled the band into the State register").toBe(
    "state",
  );

  // A5-style proof: the degradation is real presented pixels, not a data
  // attribute nobody draws.
  const [pixelsClean, pixelsFirst, pixelsSecond] = shots;
  expect(
    pixelsClean !== undefined &&
      pixelsSecond !== undefined &&
      Buffer.compare(pixelsClean, pixelsSecond) !== 0,
    "two Embers must change the rendered border, not just its data attributes",
  ).toBe(true);
  // The first stack is a text-register step the border may render identically;
  // recorded rather than asserted, because only the descriptor promises it.
  const firstStackChangedPixels =
    pixelsClean !== undefined &&
    pixelsFirst !== undefined &&
    Buffer.compare(pixelsClean, pixelsFirst) !== 0;

  run.writeReplayEvidence("numbness-ladder", { readings, firstStackChangedPixels });
  run.finish({ scenario: "SC-H Ember x2 -> Numbness", readings });
  expect(run.errors).toEqual([]);
});

test.fixme("SC-H: swallow two Embers through the world's own input path", async ({ page }) => {
  // Blocked: `beginEmberUse` is unreachable from `stepWorld`. There is no
  // `ember` InputAction, no scene verb that emits one, and `playerCommands`
  // forwards only attack / heavy / roll / flask. Until a world-level Ember
  // seam exists, the Numbness stacks the HUD renders can only be injected.
  void page;
});
