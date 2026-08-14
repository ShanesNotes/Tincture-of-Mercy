import { expect, test, type Page } from '@playwright/test';

import type { FrameStats } from '../src/view/register/analysis';
import type { BackendName, GateReport } from '../src/view/register/gateRows';

/**
 * Art gate e2e (slice s13): drives the register sample scene on the forced
 * WebGL2 backend (the portable lane; the full `npm run artgate` harness
 * covers WebGPU as well), captures shots 1–4 with post on and off, and
 * asserts every machine row passes. The full JSON report lands in
 * tools/artgate/report/ when run via the harness; here the report is
 * evaluated in-page from the same shared modules.
 */

interface CaptureRecord {
  meta: { backend: BackendName; shot: string; post: boolean; silhouette: boolean };
  stats: FrameStats;
}

const SHOTS = [1, 2, 3, 4] as const;

const captureShot = async (page: Page, shot: number, post: boolean): Promise<CaptureRecord> => {
  await page.goto(`/?scene=register&shot=${shot}&renderer=webgl2&post=${post ? 'on' : 'off'}`);
  await expect(page.locator('body')).toHaveAttribute('data-boot-status', 'ready');
  await expect(page.locator('body')).toHaveAttribute('data-renderer-backend', 'webgl2');
  const capture = await page.evaluate(() => {
    const api = window.__registerArtgate;
    if (api === undefined) {
      throw new Error('register artgate API missing');
    }
    api.renderFrame();
    return api.capture();
  });
  return capture as CaptureRecord;
};

test('art gate machine rows pass on the WebGL2 backend', async ({ page }) => {
  test.setTimeout(180_000);
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  const captures: CaptureRecord[] = [];
  for (const post of [true, false]) {
    for (const shot of SHOTS) {
      captures.push(await captureShot(page, shot, post));
    }
  }

  const audit = await page.evaluate(() => {
    const api = window.__registerArtgate;
    if (api === undefined) {
      throw new Error('register artgate API missing');
    }
    return api.audit();
  });

  const report = (await page.evaluate(
    ({ captures: pageCaptures, audits }) => {
      const api = window.__registerArtgate;
      if (api === undefined) {
        throw new Error('register artgate API missing');
      }
      return api.evaluateRows(pageCaptures, audits);
    },
    { captures, audits: { webgl2: audit } },
  )) as GateReport;

  expect(pageErrors).toEqual([]);
  expect(report.rows.map((row) => row.id)).toEqual(['A1', 'A2', 'A3', 'A4', 'A6', 'A7']);
  for (const row of report.rows) {
    expect(row.pass, `${row.id}: ${row.detail}`).toBe(true);
  }
  expect(report.pass).toBe(true);
});

test('no-post baseline still renders the scene (L12)', async ({ page }) => {
  await page.goto('/?scene=register&shot=1&renderer=webgl2&post=off');
  await expect(page.locator('body')).toHaveAttribute('data-boot-status', 'ready');
  await expect(page.locator('body')).toHaveAttribute('data-post', 'off');
  const stats = (await page.evaluate(async () => {
    const api = window.__registerArtgate;
    if (api === undefined) {
      throw new Error('register artgate API missing');
    }
    return (await api.capture()).stats;
  })) as FrameStats;
  // The no-post frame carries real content, not a blank canvas.
  expect(stats.covenantCoverage).toBeGreaterThan(0.9);
  expect(stats.grayscaleBands).toBeGreaterThanOrEqual(4);
});
