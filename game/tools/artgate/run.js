/**
 * Art gate harness (GATES.md A1–A4, A6, A7) — slice s13 machine rows.
 *
 * Boots the register sample scene headless on both renderer backends,
 * captures shots 1–4 with post on and off, evaluates the machine rows in
 * the page bundle (shared pure modules — the same code Vitest covers),
 * writes a JSON report + screenshot evidence to tools/artgate/report/,
 * and exits non-zero if any row fails.
 *
 * Usage: node tools/artgate/run.js [--port N] [--report DIR]
 */

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

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
      report.generatedAt = new Date().toISOString();
      report.budgets = budgets;
      report.shots = SHOTS;
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
