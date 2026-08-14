import { expect, test, type Page } from '@playwright/test';

/**
 * s16 HUD e2e (slice contract test row): the scene mounts over the canvas,
 * meters respond to scripted state changes, and the border verdict states
 * diff as real rendered pixels (A5-style, ≥4 states).
 */

const HUD_FIXTURES_FOR_DIFF = ['cabin_vigil', 'road_wild', 'warden_ceremony', 'turned'] as const;

const bootHud = async (page: Page, url: string): Promise<void> => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await page.goto(url);
  await expect(page.locator('body')).toHaveAttribute('data-boot-status', 'ready');
  await expect(page.locator('body')).toHaveAttribute('data-hud-mounted', 'true');
  expect(browserErrors).toEqual([]);
};

const borderState = async (page: Page): Promise<Record<string, unknown>> => {
  const raw = await page.locator('body').getAttribute('data-hud-border');
  expect(raw).not.toBeNull();
  return JSON.parse(raw as string) as Record<string, unknown>;
};

test('?scene=hud mounts the border over the game canvas', async ({ page }) => {
  await bootHud(page, '/?scene=hud');
  await expect(page.getByTestId('game-canvas')).toBeVisible();
  await expect(page.getByTestId('hud-border')).toBeVisible();
  await expect(page.getByTestId('hud-pulse')).toBeVisible();
  await expect(page.getByTestId('hud-breath')).toBeVisible();
  await expect(page.getByTestId('hud-doses')).toBeVisible();
  await expect(page.getByTestId('hud-tallies')).toBeVisible();

  // cabin_vigil fixture: lit hearth seal wakes, vigil line in the verdict band.
  const state = await borderState(page);
  expect(state.hearth).toBe('lit');
  await expect(page.getByTestId('hud-seal')).toBeVisible();
  await expect(page.getByTestId('hud-verdict')).toHaveText('The fire holds. Vigil kept.');
});

test('meters respond to scripted state changes', async ({ page }) => {
  await bootHud(page, '/?scene=hud');

  const setState = (patch: Record<string, unknown>) =>
    page.evaluate((delta) => {
      const handle = window.__hud;
      if (handle === undefined) {
        throw new Error('window.__hud missing');
      }
      const current = JSON.parse(
        document.body.dataset.hudBorder ?? '{}',
      ) as Record<string, unknown>;
      void current;
      handle.setState({
        pulse: 100,
        maxPulse: 100,
        breath: 100,
        maxBreath: 100,
        doses: 3,
        maxDoses: 3,
        namesCarried: 0,
        turn: 0,
        turnCap: 100,
        hearth: 'unlit',
        bossPhase: 'none',
        unwrittenTag: false,
        numbnessStacks: 0,
        vigilRestore: 0,
        registerLocked: false,
        zone: 'wild',
        ...delta,
      });
    }, patch);

  // Pulse drops: the lit-vellum stop steps down (HB5 stepped, never continuous).
  await setState({ pulse: 100 });
  await expect(page.getByTestId('hud-border')).toHaveAttribute('data-pulse-stop', '3');
  await setState({ pulse: 50 });
  await expect(page.getByTestId('hud-border')).toHaveAttribute('data-pulse-stop', '2');
  await setState({ pulse: 10 });
  await expect(page.getByTestId('hud-border')).toHaveAttribute('data-pulse-stop', '1');

  // Doses render as countable drop emblems (HB10: never digits).
  await setState({ doses: 2 });
  await expect(page.getByTestId('hud-doses').locator('.hb-drop-filled')).toHaveCount(2);

  // Names render as five-bar tally groups at the colophon (HB4).
  await setState({ namesCarried: 13 });
  await expect(page.getByTestId('hud-tallies').locator('.hb-tally-group')).toHaveCount(2);
  await expect(page.getByTestId('hud-tallies').locator('.hb-tally-loose')).toHaveCount(3);

  // The Turn narrows the margin (D6: never a bar) and the band warns.
  await setState({ turn: 80 });
  const narrowed = await borderState(page);
  expect(narrowed.marginInsetPx).toBeGreaterThan(28);
  await expect(page.getByTestId('hud-verdict')).toHaveText('Not much page left.');

  // Numbness drags the verdict band to the State register (HB8).
  await setState({ turn: 80, numbnessStacks: 3 });
  await expect(page.getByTestId('hud-verdict')).toHaveText('Index approaching threshold.');
  await expect(page.getByTestId('hud-verdict')).toHaveAttribute('data-register', 'state');
});

test('A5-style border verdict diff: ≥4 states render visibly differently', async ({ page }) => {
  test.setTimeout(120_000);
  await bootHud(page, '/?scene=hud');
  const border = page.getByTestId('hud-border');
  const shots: Buffer[] = [];
  for (const fixture of HUD_FIXTURES_FOR_DIFF) {
    await page.evaluate((name) => window.__hud?.setFixture(name), fixture);
    await expect
      .poll(async () => (await borderState(page)).numbnessStep !== undefined)
      .toBe(true);
    shots.push(await border.screenshot());
  }
  // Every adjacent pair must differ as rendered pixels (A5 asks for ≥3 states).
  for (const [index, b] of shots.entries()) {
    const a = shots[index - 1];
    if (a === undefined) {
      continue;
    }
    expect(
      Buffer.compare(a, b) !== 0,
      `${HUD_FIXTURES_FOR_DIFF[index - 1] ?? '?'} vs ${HUD_FIXTURES_FOR_DIFF[index] ?? '?'} screenshots must differ`,
    ).toBe(true);
  }
});

test('item card gallery renders bible-driven cards with em-dash silences', async ({ page }) => {
  await bootHud(page, '/?scene=hud&view=cards');
  const cards = page.getByTestId('hud-card');
  await expect(cards).toHaveCount(10);

  const cedarDog = cards.nth(3);
  await expect(cedarDog.locator('.hud-card-name')).toHaveText('the cedar dog');
  // The State has no word for the cedar dog (TEXT_BIBLE §1): em-dash silence.
  await expect(cedarDog.locator('.hud-card-state')).toHaveText('—');

  const vial = cards.nth(1);
  await expect(vial.locator('.hud-card-name')).toHaveText('the Tincture');
  await expect(vial.locator('.hud-card-church')).toHaveText('mercy you can carry');
  await expect(vial.locator('.hud-card-state')).toHaveText('E-3 stabilizer');
});

test('menus emit intents and the death overlay stays inside the border', async ({ page }) => {
  await bootHud(page, '/?scene=hud&menu=pause');
  await expect(page.getByTestId('hud-menu-pause')).toBeVisible();
  await page.getByTestId('menu-resume').click();
  const intents = await page.evaluate(() => window.__hudIntents ?? []);
  expect(intents).toEqual([{ type: 'resume' }]);
  await expect(page.getByTestId('hud-menu-pause')).toHaveCount(0);

  // Hearth verbs fire scene-system intent events.
  await page.goto('/?scene=hud&menu=hearth');
  await page.getByTestId('hearth-verb-hearth-rest-request').click();
  await page.getByTestId('hearth-verb-hearth-leave').click();
  const hearthIntents = await page.evaluate(() => window.__hudIntents ?? []);
  expect(hearthIntents).toEqual([
    { type: 'hearth-rest-request', hearthId: 'cabin' },
    { type: 'hearth-leave', hearthId: 'cabin' },
  ]);

  // Death: "the page falls open" — border-integrated, not a modal.
  await page.goto('/?scene=hud&menu=death');
  await expect(page.getByTestId('hud-menu-death')).toBeVisible();
  await expect(page.getByTestId('hud-death-line').first()).toHaveText('The page falls open.');
  await expect(page.getByTestId('hud-border')).toBeVisible();

  // The second death adds the Open Page line; Numbness degrades the message.
  await page.goto('/?scene=hud&menu=death&pageLost=1&fixture=numbness_2');
  await expect(page.getByTestId('hud-death-line').first()).toHaveText('Page open.');
  await expect(page.getByTestId('hud-death-line').nth(1)).toHaveText('Entries lapsed.');
});
