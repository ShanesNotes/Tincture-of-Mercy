/**
 * Art gate harness (GATES.md A1–A7) — slice s13 machine rows plus the F5
 * repair rows (A5 border verdict, full A7 no-post baseline).
 *
 * Boots the register sample scene headless on both renderer backends,
 * captures shots 1–4 with post on and off, evaluates the s13-scoped rows in
 * the page bundle (shared pure modules — the same code Vitest covers), then
 * boots `?scene=hud` to screenshot the manuscript border across distinct
 * world states for A5 (the image-diff method of e2e/hud.spec.ts). A5 and
 * the full A1–A6 no-post baseline (A7) are composed from that evidence by
 * tools/artgate/rows.js. Writes a JSON report + screenshot evidence to
 * tools/artgate/report/ and exits non-zero if any row fails.
 *
 * Usage: node tools/artgate/run.js [--port N] [--report DIR]
 */

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

import { assembleRows, buildA5Row, buildFullA7Row, markPostOff } from "./rows.js";

const GAME_DIR = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const args = process.argv.slice(2);
const argValue = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && index + 1 < args.length ? args[index + 1] : fallback;
};
const PORT = Number(argValue("port", "4313"));
const REPORT_DIR = argValue("report", join(GAME_DIR, "tools", "artgate", "report"));
const BASE_URL = `http://127.0.0.1:${PORT}`;

const SHOTS = [1, 2, 3, 4];
// A5 world states: the same fixture set e2e/hud.spec.ts diffs
// (HUD_FIXTURES_FOR_DIFF) — four distinct verdict states, exceeding the
// ≥3 the gate asks for.
const BORDER_STATES = ["cabin_vigil", "road_wild", "warden_ceremony", "turned"];
// Both backends sit the gate (GATES.md protocol). The default boot prefers
// WebGPU; `renderer=webgl2` forces the fallback. The actual backend is read
// from the page so a WebGPU-less environment is reported honestly.
const BACKENDS = [
  { label: "auto", param: "" },
  { label: "webgl2", param: "renderer=webgl2" },
];

const waitForServer = async (url, timeoutMs) => {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      const response = await fetch(url, { method: "HEAD" });
      if (response.ok) return;
    } catch {
      // not up yet
    }
    if (Date.now() > deadline) {
      throw new Error(`Dev server did not start at ${url} within ${timeoutMs}ms.`);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
};

const startServer = () => {
  const child = spawn(
    "npm",
    ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(PORT), "--strictPort"],
    { cwd: GAME_DIR, stdio: ["ignore", "pipe", "pipe"] },
  );
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));
  return child;
};

const captureShot = async (page, backendParam, shot, post, screenshotPath) => {
  const url = `${BASE_URL}/?scene=register&shot=${shot}&post=${post ? "on" : "off"}${
    backendParam === "" ? "" : `&${backendParam}`
  }`;
  await page.goto(url);
  await page.waitForSelector('body[data-boot-status="ready"]', { timeout: 60_000 });
  const backend = await page.getAttribute("body", "data-renderer-backend");
  await page.evaluate(() => globalThis.__registerArtgate.renderFrame());
  await page.screenshot({ path: screenshotPath });
  const capture = await page.evaluate(() => globalThis.__registerArtgate.capture());
  const audit = await page.evaluate(() => globalThis.__registerArtgate.audit());
  const budget = await page.evaluate(() => globalThis.__registerArtgate.budget());
  return { backend, capture, audit, budget };
};

/**
 * A5 evidence: boot `?scene=hud` and screenshot the hud-border element once
 * per world state, exactly as e2e/hud.spec.ts drives it. The border is a
 * DOM/CSS overlay — the renderer post pipeline never touches it — but the
 * no-post pass still re-runs the diff so A7 re-checks A5 honestly.
 */
const captureBorderStates = async (page, post) => {
  await page.goto(`${BASE_URL}/?scene=hud&post=${post ? "on" : "off"}`);
  await page.waitForSelector('body[data-boot-status="ready"]', { timeout: 60_000 });
  await page.waitForSelector('body[data-hud-mounted="true"]', { timeout: 60_000 });
  // Browser-context callbacks reach their globals through `globalThis` — this
  // file is linted as Node, where `document` and `requestAnimationFrame` are
  // not defined names.
  await page.evaluate(() => globalThis.document.fonts.ready.then(() => undefined));
  const border = page.getByTestId("hud-border");
  const shots = [];
  for (const state of BORDER_STATES) {
    await page.evaluate((name) => globalThis.__hud.setFixture(name), state);
    // Let the descriptor stamp and the webfonts settle before the shot.
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          globalThis.requestAnimationFrame(() => globalThis.requestAnimationFrame(resolve)),
        ),
    );
    const png = await border.screenshot();
    const name = `border_${state}_${post ? "post" : "nopost"}`;
    writeFileSync(join(REPORT_DIR, "shots", `${name}.png`), png);
    console.log(`captured ${name}`);
    shots.push({ state, png });
  }
  return shots;
};

const pickRow = (report, id) => {
  const found = report.rows.find((r) => r.id === id);
  if (found === undefined) {
    throw new Error(`Gate row ${id} missing from the page evaluation.`);
  }
  return found;
};

const main = async () => {
  mkdirSync(join(REPORT_DIR, "shots"), { recursive: true });

  const server = startServer();
  let exitCode = 1;
  try {
    await waitForServer(BASE_URL, 60_000);
    const browser = await chromium.launch({
      headless: true,
      args: ["--enable-unsafe-webgpu", "--enable-features=Vulkan", "--use-angle=swiftshader"],
    });
    try {
      const page = await browser.newPage({
        viewport: { width: 1000, height: 620 },
        deviceScaleFactor: 1,
      });
      const pageErrors = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));

      const captures = [];
      const audits = {};
      const budgets = {};
      const seen = new Set();

      for (const backend of BACKENDS) {
        for (const post of [true, false]) {
          for (const shot of SHOTS) {
            const name = `${backend.label}_shot${shot}_${post ? "post" : "nopost"}`;
            const result = await captureShot(
              page,
              backend.param,
              shot,
              post,
              join(REPORT_DIR, "shots", `${name}.png`),
            );
            captures.push(result.capture);
            const actual = result.capture.meta.backend;
            budgets[actual] = result.budget;
            if (!seen.has(actual)) {
              seen.add(actual);
              audits[actual] = result.audit;
            }
            console.log(
              `captured ${name} (backend=${actual}): covenant=${(
                result.capture.stats.covenantCoverage * 100
              ).toFixed(2)}% red=${(result.capture.stats.oxbloodCoverage * 100).toFixed(3)}%`,
            );
          }
        }
      }

      if (pageErrors.length > 0) {
        console.error("page errors:", pageErrors);
        throw new Error("Register scene produced page errors.");
      }

      const report = await page.evaluate(
        ({ captures: c, audits: a }) => globalThis.__registerArtgate.evaluateRows(c, a),
        { captures, audits },
      );

      // A7 restoration (F5): the s13 module measures A1/A3/A4/A6 over post-on
      // captures only, so re-run it with the post-off frames' flag flipped to
      // get those rows evaluated on no-post evidence — the same shared code,
      // the same thresholds. A2's audit is post-independent; A5 re-runs on
      // the no-post border captures below.
      const postOffCaptures = captures.filter((c) => !c.meta.post);
      const flipped = postOffCaptures.map((c) => ({ ...c, meta: { ...c.meta, post: true } }));
      const postOffReport = await page.evaluate(
        ({ captures: c, audits: a }) => globalThis.__registerArtgate.evaluateRows(c, a),
        { captures: [...flipped, ...postOffCaptures], audits },
      );

      // A5 (F5): the border verdict diff lives in the HUD scene, not the
      // register plate. Captured last because it navigates the page away.
      const borderOn = await captureBorderStates(page, true);
      const borderOff = await captureBorderStates(page, false);
      if (pageErrors.length > 0) {
        console.error("page errors:", pageErrors);
        throw new Error("HUD scene produced page errors.");
      }

      const a5Row = buildA5Row(borderOn);
      const a5OffRow = {
        ...buildA5Row(borderOff, "A7/A5"),
        title: "A7/A5 no-post border verdict diff",
      };
      const a7Row = buildFullA7Row({
        a1: markPostOff(pickRow(postOffReport, "A1")),
        a2: pickRow(report, "A2"),
        a3: markPostOff(pickRow(postOffReport, "A3")),
        a4: markPostOff(pickRow(postOffReport, "A4")),
        a5: a5OffRow,
        a6: markPostOff(pickRow(postOffReport, "A6")),
      });
      const basePass = report.pass;
      report.rows = assembleRows(report.rows, a5Row, a7Row);
      report.pass = basePass && a5Row.pass && a7Row.pass;

      report.generatedAt = new Date().toISOString();
      report.budgets = budgets;
      report.shots = SHOTS;
      report.borderStates = BORDER_STATES;
      report.backendsAttempted = BACKENDS.map((b) => b.label);
      report.captureStats = captures;

      writeFileSync(join(REPORT_DIR, "artgate-report.json"), `${JSON.stringify(report, null, 2)}\n`);

      console.log("\nart gate machine rows:");
      for (const row of report.rows) {
        console.log(`  ${row.pass ? "PASS" : "FAIL"}  ${row.id}  ${row.title}`);
        for (const measurement of row.measurements.filter((m) => !m.pass)) {
          console.log(`        failing: ${measurement.capture} = ${measurement.value}`);
        }
      }
      console.log(`\noverall: ${report.pass ? "PASS" : "FAIL"} — report at ${REPORT_DIR}`);
      exitCode = report.pass ? 0 : 1;
    } finally {
      await browser.close();
    }
  } finally {
    server.kill("SIGTERM");
  }
  process.exit(exitCode);
};

await main();
