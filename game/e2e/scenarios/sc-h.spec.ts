import { expect, test } from "@playwright/test";

import { Gauntlet, KEY, playerOf } from "./harness";

/**
 * SC-H — two Embers, and the page's own language going numb.
 *
 * Ember's cost is the Numbness ladder (D6, TEXT_BIBLE §2): each dose is a
 * permanent stack that drags the border's verdict band out of the Church
 * register and into the State's. This row drives the apparatus at the seam the
 * live world feeds it — `hudInputFromWorld` hands the border `numbnessStacks`
 * straight off `MetaState` — and proves the degradation is visible.
 *
 * The sim half is scripted in the second row below: `WorldInputFrame.useEmber`
 * turns the next started drink into an Ember dose, and the shipped page binds
 * it to holding G while pressing R. This first row still drives the HUD
 * directly, because it is the *apparatus* under test here, not the world.
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

/** `tincture_params.json` numbness — two doses, two permanent stacks. */
const EMBERS_TO_SWALLOW = 2;

const inheritAnnaVial = async (run: Awaited<ReturnType<typeof Gauntlet.boot>>): Promise<void> => {
  await run.waitFor(
    "the prologue holds the frame",
    (snapshot) => snapshot.scenes.activeId === "cabin_prologue",
    15_000,
  );
  for (let step = 0; step < 5; step += 1) {
    await run.tap(KEY.interact);
    await run.advanceTicks(12, 15_000);
  }
  await run.waitFor(
    "the prologue is written",
    (snapshot) => snapshot.scenes.completed.includes("cabin_prologue"),
    15_000,
  );
  await run.walkNorthTo(-8, 80);
  await run.hold(KEY.back);
  await run.waitFor("back in the cabin", (snapshot) => snapshot.zoneId === "CABIN", 30_000);
  await run.release(KEY.back);
  await run.waitFor(
    "Anna's gravity holds the frame",
    (snapshot) => snapshot.scenes.activeId === "anna_gravity",
    30_000,
  );
  for (let step = 0; step < 8; step += 1) {
    await run.tap(KEY.interact);
    await run.advanceTicks(12, 15_000);
  }
  await run.waitFor("the vial is inherited", (snapshot) => snapshot.meta.inherited === true, 30_000);
};

test("SC-H: swallow two Embers through the world's own input path", async ({ page }) => {
  test.setTimeout(300_000);
  const run = await Gauntlet.boot(page, "sc-h-world", { debug: true });
  const opening = await run.capture("boot: no Embers swallowed, the register is the Church's");
  expect(opening.meta.numbnessStacks, "the slice opens with a clean register").toBe(0);
  expect(opening.meta.doses, "the flask is Anna's until WitnessDeath").toBe(0);
  expect(opening.meta.ember ?? 0, "her Embers stay in the chest").toBe(0);

  await inheritAnnaVial(run);
  const inherited = await run.capture("inherited: borrowed mercy, two Embers in the pouch");
  expect(inherited.meta.inherited).toBe(true);
  expect(inherited.meta.ember ?? 0, "the unused chest Embers transfer").toBe(2);

  // The shipped binding: hold G, press R. The modifier is read on the frame the
  // drink *starts*, so it stays held across the whole swallow.
  await run.hold(KEY.ember);
  for (let dose = 0; dose < EMBERS_TO_SWALLOW; dose += 1) {
    const before = await run.snapshot();
    await run.tap(KEY.flask);
    const swallowed = await run.waitFor(
      `Ember ${String(dose + 1)} reached MetaState`,
      (snapshot) => snapshot.meta.numbnessStacks > before.meta.numbnessStacks,
      60_000,
    );
    await run.capture(
      `Ember ${String(dose + 1)}: ${String(swallowed.meta.numbnessStacks)} permanent stacks`,
    );
    // Let the drink clip finish before the next edge, the way a player must.
    await run.waitFor("the drink is finished", (s) => playerOf(s).actionId === null, 60_000);
  }
  await run.release(KEY.ember);

  const numbed = await run.snapshot();
  expect(numbed.meta.numbnessStacks, "two Embers must leave two permanent stacks").toBe(
    EMBERS_TO_SWALLOW,
  );
  // The Ember is not a Tincture dose: it costs the register, not the vial.
  expect(numbed.meta.doses, "an Ember must not spend a Tincture dose").toBe(inherited.meta.doses);
  expect(numbed.meta.turnBuildupPercent, "GATES F12: Numbness Turn % must fire").toBe(150);
  expect(numbed.meta.damagePercent, "GATES F12: Ember surge damage must fire").toBe(125);
  expect(numbed.meta.breathRegenPercent, "GATES F12: Ember breath regen must fire").toBe(135);
  expect(numbed.meta.steadyDelta, "GATES F12: Ember Steady must fire").toBe(15);

  // The apparatus is downstream of the same MetaState the reducer just wrote:
  // the border must be reading the world, not a fixture.
  await expect
    .poll(async () => {
      const raw = await page.locator("body").getAttribute("data-hud-border");
      return (JSON.parse(raw ?? "{}") as { numbnessStep?: number }).numbnessStep ?? -1;
    })
    .toBe(EMBERS_TO_SWALLOW);

  // Plain R, with G released, must still be an ordinary Tincture dose.
  const beforePlain = await run.snapshot();
  await run.tap(KEY.flask);
  const drank = await run.waitFor(
    "the plain drink committed a dose",
    (snapshot) => snapshot.meta.doses < beforePlain.meta.doses,
    60_000,
  );
  await run.capture("plain flask: a dose is spent and no stack is added");
  expect(drank.meta.numbnessStacks, "a Tincture dose must not add a Numbness stack").toBe(
    EMBERS_TO_SWALLOW,
  );

  run.writeReplayEvidence("world-ember", {
    stacks: drank.meta.numbnessStacks,
    dosesAfterEmbers: numbed.meta.doses,
    dosesAfterPlainDrink: drank.meta.doses,
    borderStep: EMBERS_TO_SWALLOW,
  });
  run.finish({
    scenario: "SC-H Ember through the world input path",
    stacks: drank.meta.numbnessStacks,
  });
  expect(run.errors, "the Ember path must not raise a browser error").toEqual([]);
});
