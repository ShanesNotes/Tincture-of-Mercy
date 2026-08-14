import { expect, test, type Page } from '@playwright/test';

const expectCleanTickingBoot = async (
  page: Page,
  url: string,
  expectedBackends: readonly string[],
): Promise<void> => {
  const browserErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => {
    browserErrors.push(error.message);
  });

  await page.goto(url);

  const body = page.locator('body');
  await expect(body).toHaveAttribute('data-boot-status', 'ready');
  await expect(page.getByTestId('game-canvas')).toBeVisible();

  const backend = await body.getAttribute('data-renderer-backend');
  expect(expectedBackends).toContain(backend);

  await expect(body).toHaveAttribute('data-sim-tick', /^\d+$/);
  const initialTick = Number(await body.getAttribute('data-sim-tick'));
  expect(Number.isSafeInteger(initialTick)).toBe(true);
  await expect
    .poll(async () => Number(await body.getAttribute('data-sim-tick')))
    .toBeGreaterThan(initialTick);

  expect(browserErrors).toEqual([]);
};

test('boots a ticking renderer without browser errors', async ({ page }) => {
  await expectCleanTickingBoot(page, '/', ['webgpu', 'webgl2']);
});

test('boots the explicit WebGL2 fallback without browser errors', async ({ page }) => {
  await expectCleanTickingBoot(page, '/?renderer=webgl2', ['webgl2']);
});

test('pauses on blur and resumes only after input', async ({ page }) => {
  await page.goto('/?renderer=webgl2');
  const body = page.locator('body');
  await expect(body).toHaveAttribute('data-boot-status', 'ready');
  await expect(body).toHaveAttribute('data-sim-tick', /^\d+$/);

  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.waitForTimeout(100);
  const pausedTick = await body.getAttribute('data-sim-tick');
  await page.waitForTimeout(100);
  await expect(body).toHaveAttribute('data-sim-tick', pausedTick ?? '');

  await page.keyboard.press('Space');
  await expect
    .poll(async () => Number(await body.getAttribute('data-sim-tick')))
    .toBeGreaterThan(Number(pausedTick));
});
