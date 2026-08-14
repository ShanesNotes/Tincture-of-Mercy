import { expect, test, type Page } from '@playwright/test';

import type { VfxBudgetReport, VfxStateSnapshot } from '../src/view/vfx/scene';

/**
 * s27 VFX e2e (slice contract deliverable 6): drives the scripted-timeline
 * demo scene (`?scene=vfx&auto=0`) and asserts the four contract rows —
 * (a) bloom present within 2 ticks of a scripted hit, (b) zero bloom on a
 * scripted whiff (F4: no juice on air), (c) the L8/A3 oxblood budget on
 * counted bloom pixels, (d) the parchment inversion lasting exactly 1 frame —
 * plus the gold-licensing, Wither, flask/Ember, and tag-glint rows.
 *
 * The WebGL2 backend is forced so captures run identically in headless CI
 * (the artgate e2e's portable lane).
 */

const URL = '/?scene=vfx&auto=0&renderer=webgl2';

const bootVfx = async (page: Page): Promise<void> => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await page.goto(URL);
  await expect(page.locator('body')).toHaveAttribute('data-boot-status', 'ready');
  await expect(page.locator('body')).toHaveAttribute('data-scene', 'vfx');
  await expect(page.locator('body')).toHaveAttribute('data-renderer-backend', 'webgl2');
  expect(browserErrors).toEqual([]);
};

const vfxState = (page: Page): Promise<VfxStateSnapshot> =>
  page.evaluate(() => {
    const api = window.__vfx;
    if (api === undefined) throw new Error('window.__vfx missing');
    return api.state();
  });

const vfxTick = (page: Page): Promise<number> =>
  page.evaluate(() => {
    const api = window.__vfx;
    if (api === undefined) throw new Error('window.__vfx missing');
    return api.tick();
  });

/** Step the demo until `targetTick` has been applied (state.tick === target). */
const advanceThrough = async (page: Page, targetTick: number): Promise<void> => {
  const current = await vfxTick(page);
  const steps = targetTick + 1 - current;
  if (steps <= 0) return;
  await page.evaluate((n) => window.__vfx?.advance(n), steps);
  expect(await vfxState(page)).toMatchObject({ tick: targetTick });
};

test('(a) the ink-bloom lands within 2 ticks of a scripted hit, at the nearest margin', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await bootVfx(page);

  // Scripted light hit at tick 40, impact direction due east.
  await advanceThrough(page, 40);
  const state = await vfxState(page);
  expect(state.blooms).toHaveLength(1);
  const bloom = state.blooms[0];
  expect(bloom?.hitstopClass).toBe('light');
  expect(bloom?.anchor).toBe('e');
  // F4: the VFX fired within 2 ticks of the sim event.
  expect((bloom?.startTick ?? 0) - (bloom?.eventTick ?? 0)).toBeLessThanOrEqual(2);

  // The border apparatus renders the bleed at the east margin anchor.
  await expect(page.locator('body')).toHaveAttribute('data-vfx-bloom-anchor', 'e');
  const bloomNode = page.getByTestId('vfx-bloom');
  await expect(bloomNode).toHaveCount(1);
  await expect(bloomNode.first()).toHaveAttribute('data-hitstop-class', 'light');
  const box = await bloomNode.first().boundingBox();
  expect(box).not.toBeNull();
  expect((box?.x ?? 0) + (box?.width ?? 0) / 2).toBeGreaterThan(1000); // east half of a 1280px frame

  // The bloom always decays fully: light class = 8 ticks total.
  await advanceThrough(page, 47);
  expect((await vfxState(page)).blooms).toHaveLength(1);
  await advanceThrough(page, 48);
  expect((await vfxState(page)).blooms).toHaveLength(0);
  await expect(page.getByTestId('vfx-bloom')).toHaveCount(0);
});

test('(b) a scripted whiff produces zero bloom — no juice on air (F4)', async ({ page }) => {
  test.setTimeout(120_000);
  await bootVfx(page);

  // The scripted whiff at tick 10 stands alone (nearest hit is tick 40).
  await advanceThrough(page, 10);
  const atWhiff = await vfxState(page);
  expect(atWhiff.blooms).toHaveLength(0);
  expect(atWhiff.strokeCount).toBe(0);
  expect(atWhiff.inversion).toBe(false);
  await expect(page.locator('body')).toHaveAttribute('data-vfx-bloom-count', '0');
  await expect(page.getByTestId('vfx-bloom')).toHaveCount(0);

  // Still nothing several ticks later.
  await advanceThrough(page, 20);
  expect((await vfxState(page)).blooms).toHaveLength(0);
});

test('(c) counted bloom pixels respect the ≤5% oxblood budget on every scripted hit', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await bootVfx(page);

  const budget = (p: Page): Promise<VfxBudgetReport> =>
    p.evaluate(() => {
      const api = window.__vfx;
      if (api === undefined) throw new Error('window.__vfx missing');
      return api.budget();
    });

  // Every scripted bloom tick: light 40, heavy 90, charged 140, blocked 190,
  // guard-break 240, critical 360, death 420.
  for (const tick of [40, 90, 140, 190, 240, 360, 420]) {
    await advanceThrough(page, tick);
    const report = await budget(page);
    expect(report.bloomAreaPx).toBeGreaterThan(0);
    expect(
      report.bloomCoverage,
      `bloom at tick ${tick} covers ${(report.bloomCoverage * 100).toFixed(2)}% of the frame`,
    ).toBeLessThanOrEqual(report.maxOxbloodCoverage);
  }

  // The world capture at the worst (critical) tick: oxblood hue-mask under
  // the same ceiling — the margin bloom is DOM-side and counted above; the
  // canvas carries only the vial's named fill stamp.
  const stats = await page.evaluate(() => {
    const api = window.__vfx;
    if (api === undefined) throw new Error('window.__vfx missing');
    return api.captureStats();
  });
  expect(stats.oxbloodCoverage).toBeLessThanOrEqual(0.05);
});

test('(d) the parchment inversion holds exactly 1 frame on the critical, and on death', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await bootVfx(page);

  // Critical hit at tick 360.
  await advanceThrough(page, 359);
  expect((await vfxState(page)).inversion).toBe(false);
  await advanceThrough(page, 360);
  expect((await vfxState(page)).inversion).toBe(true);
  await expect(page.locator('body')).toHaveAttribute('data-vfx-inversion', '1');
  await expect(page.getByTestId('vfx-inversion')).toBeVisible();
  const inverted = await page.screenshot();
  await advanceThrough(page, 361);
  expect((await vfxState(page)).inversion).toBe(false);
  await expect(page.locator('body')).toHaveAttribute('data-vfx-inversion', '0');
  await expect(page.getByTestId('vfx-inversion')).toBeHidden();
  const settled = await page.screenshot();
  expect(
    Buffer.compare(inverted, settled) !== 0,
    'the inversion frame must read as a real presented-pixel change',
  ).toBe(true);

  // Death at tick 420: inversion again exactly 1 frame, plus the page hook.
  await advanceThrough(page, 420);
  const onDeath = await vfxState(page);
  expect(onDeath.inversion).toBe(true);
  expect(onDeath.deathPage).toBe(true);
  await advanceThrough(page, 421);
  expect((await vfxState(page)).inversion).toBe(false);
  expect((await vfxState(page)).deathPage).toBe(true);
  await advanceThrough(page, 450);
  expect((await vfxState(page)).deathPage).toBe(false);
});

test('gold is licensed only for guard-break and riposte (AD6/L9)', async ({ page }) => {
  test.setTimeout(180_000);
  await bootVfx(page);

  // Ordinary hits flash ink strokes only.
  for (const tick of [40, 90, 140, 190]) {
    await advanceThrough(page, tick);
    const state = await vfxState(page);
    expect(state.strokeCount).toBeGreaterThan(0);
    expect(state.goldStrokeCount).toBe(0);
  }

  // Guard-break (tick 240) and riposte (tick 300): the earned opening in gold.
  await advanceThrough(page, 240);
  expect((await vfxState(page)).goldStrokeCount).toBeGreaterThan(0);
  await advanceThrough(page, 300);
  expect((await vfxState(page)).goldStrokeCount).toBeGreaterThan(0);
});

test('wither, flask, ember, and tag-glint rows fire on schedule and expire', async ({ page }) => {
  test.setTimeout(240_000);
  await bootVfx(page);

  // Wither at tick 500, density 0.7 → capped motes + stepped margin band.
  await advanceThrough(page, 500);
  let state = await vfxState(page);
  expect(state.witherMotes).toBe(17); // round(0.7 × 24-mote cap)
  expect(state.witherMotes).toBeLessThanOrEqual(24);
  expect(state.witherBand).toBe(0.5);
  await advanceThrough(page, 650);
  state = await vfxState(page);
  expect(state.witherMotes).toBe(0);
  expect(state.witherBand).toBe(0);

  // Flask at tick 700: the vial emblem pulses for the drink, then idles.
  await advanceThrough(page, 700);
  expect((await vfxState(page)).flaskPulse).toBe(true);
  await advanceThrough(page, 720);
  expect((await vfxState(page)).flaskPulse).toBe(false);

  // Ember at tick 760: gold-to-grey sweep, exactly 60t, then gone.
  await advanceThrough(page, 760);
  state = await vfxState(page);
  expect(state.emberSweep).toBe(true);
  expect(state.emberDesat).toBe(0);
  await advanceThrough(page, 790);
  expect((await vfxState(page)).emberDesat).toBe(1);
  await advanceThrough(page, 820);
  state = await vfxState(page);
  expect(state.emberSweep).toBe(false);
  expect(state.emberDesat).toBe(0);

  // Tag chime at tick 860: the tin glint pairs the audio tell, then expires.
  await advanceThrough(page, 860);
  expect((await vfxState(page)).tagGlints).toBe(1);
  await advanceThrough(page, 870);
  expect((await vfxState(page)).tagGlints).toBe(0);

  // L4: every light in the demo is a registered emblem emitter.
  const unregistered = await page.evaluate(() => {
    const api = window.__vfx;
    if (api === undefined) throw new Error('window.__vfx missing');
    return api.auditLights();
  });
  expect(unregistered).toEqual([]);
});
