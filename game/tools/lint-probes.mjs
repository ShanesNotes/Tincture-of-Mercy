/**
 * ESLint regression probes for the sim-time and sim-boundary bans (O-F9, K12).
 *
 * Each forbidden shape is fed to eslint on stdin with a src/sim filename so
 * the same config the repo uses rejects it. A miss (exit 0) fails this script.
 *
 *   npm run lint:probes
 */

import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const GAME_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
const ESLINT = join(GAME_DIR, "node_modules", ".bin", "eslint");

const probes = [
  {
    name: "Math.random()",
    filename: "src/sim/lint_probe.ts",
    source: "export const x = Math.random();\n",
  },
  {
    name: "globalThis.Math.random()",
    filename: "src/sim/lint_probe.ts",
    source: "export const x = globalThis.Math.random();\n",
  },
  {
    name: "const r = Math.random",
    filename: "src/sim/lint_probe.ts",
    source: "const r = Math.random;\nexport const x = r();\n",
  },
  {
    name: "new Date().getTime()",
    filename: "src/sim/lint_probe.ts",
    source: "export const x = new Date().getTime();\n",
  },
  {
    name: "Date.now()",
    filename: "src/sim/lint_probe.ts",
    source: "export const x = Date.now();\n",
  },
  {
    name: "globalThis.Date.now()",
    filename: "src/sim/lint_probe.ts",
    source: "export const x = globalThis.Date.now();\n",
  },
  {
    name: "performance.now()",
    filename: "src/sim/lint_probe.ts",
    source: "export const x = performance.now();\n",
  },
  {
    name: "require('three') in .js",
    filename: "src/sim/lint_probe.js",
    source: 'const three = require("three");\nexport { three };\n',
  },
  {
    name: "require('three') in .cjs",
    filename: "src/sim/lint_probe.cjs",
    source: 'const three = require("three");\nmodule.exports = three;\n',
  },
  {
    name: "import 'three' in .mjs",
    filename: "src/sim/lint_probe.mjs",
    source: 'import * as three from "three";\nexport { three };\n',
  },
];

const control = {
  name: "pure arithmetic (must pass)",
  filename: "src/sim/lint_probe.ts",
  source: "export const x = 1 + 1;\n",
};

const lintStdin = (filename, source) =>
  spawnSync(ESLINT, ["--stdin", "--stdin-filename", filename, "--format", "json"], {
    cwd: GAME_DIR,
    input: source,
    encoding: "utf8",
  });

const restrictionFired = (stdout) => {
  try {
    const reports = JSON.parse(stdout);
    return reports.some((report) =>
      (report.messages ?? []).some(
        (message) =>
          message.ruleId === "no-restricted-syntax" || message.ruleId === "no-restricted-imports",
      ),
    );
  } catch {
    return false;
  }
};

let failed = false;

const controlResult = lintStdin(control.filename, control.source);
if (controlResult.status !== 0) {
  console.error(`CONTROL FAIL: ${control.name} was rejected\n${controlResult.stdout}\n${controlResult.stderr}`);
  failed = true;
} else {
  console.log(`CONTROL PASS: ${control.name}`);
}

for (const probe of probes) {
  const result = lintStdin(probe.filename, probe.source);
  if (restrictionFired(result.stdout)) {
    console.log(`PROBE HIT: ${probe.name}`);
    continue;
  }
  console.error(`PROBE MISS: ${probe.name} was not rejected`);
  if (result.stdout) console.error(result.stdout);
  if (result.stderr) console.error(result.stderr);
  failed = true;
}

process.exit(failed ? 1 : 0);
