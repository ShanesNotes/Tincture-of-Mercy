/**
 * Gate row logic — pure evaluation of the art-gate machine rows (GATES.md
 * A1–A4, A6, A7 as scoped by slice s13) over captured frame stats. Runs in
 * the browser bundle (the harness passes all captures into one page call)
 * and in Vitest on synthetic fixtures. Produces the JSON report shape the
 * `artgate` npm script writes to disk.
 */

import type { FrameStats } from "./analysis";
import type { RegisterConfig } from "./config";

export type BackendName = "webgpu" | "webgl2";

export interface LawAudit {
  /** A2: renderer-law config flags (fog/DoF/blur/shake/FOV-punch) all off. */
  readonly bannedFlagsEnabled: readonly string[];
  /** L4: lights found in the scene graph that bypassed the emblem registry. */
  readonly unregisteredLights: readonly string[];
  /** PA15/D4: materials not bound to a register palette binding. */
  readonly unboundMaterials: readonly string[];
  /** L5: scene.fog must be null (no continuous fog). */
  readonly sceneFogPresent: boolean;
  /** D2: vertical FOV inside 38–48°. */
  readonly cameraFov: number;
  /** D2: no camera roll. */
  readonly cameraRoll: number;
  /** Reverse-Z depth buffer active (D2). */
  readonly reversedDepth: boolean;
}

export interface CaptureMeta {
  readonly backend: BackendName;
  readonly shot: string;
  readonly post: boolean;
  readonly silhouette: boolean;
}

export interface Capture {
  readonly meta: CaptureMeta;
  readonly stats: FrameStats;
}

export interface RowMeasurement {
  readonly capture: string;
  readonly value: number;
  readonly pass: boolean;
}

export interface GateRow {
  readonly id: string;
  readonly title: string;
  readonly pass: boolean;
  readonly detail: string;
  readonly measurements: readonly RowMeasurement[];
}

export interface GateReport {
  readonly rows: readonly GateRow[];
  readonly pass: boolean;
  readonly captures: number;
  readonly backends: readonly BackendName[];
}

const captureLabel = (meta: CaptureMeta): string =>
  `${meta.backend}/${meta.shot}/post-${meta.post ? "on" : "off"}`;

const row = (
  id: string,
  title: string,
  measurements: RowMeasurement[],
  detail: string,
  extraFailures = 0,
): GateRow => {
  const failures = measurements.filter((m) => !m.pass).length + extraFailures;
  return {
    id,
    title,
    pass: failures === 0,
    detail: failures === 0 ? detail : `${detail} — ${failures} failing measurement(s)`,
    measurements,
  };
};

const auditViolations = (audit: LawAudit, config: RegisterConfig): readonly string[] => {
  const violations: string[] = [];
  for (const flag of audit.bannedFlagsEnabled) {
    violations.push(`L1 banned flag enabled: ${flag}`);
  }
  for (const light of audit.unregisteredLights) {
    violations.push(`L4 unregistered light in scene graph: ${light}`);
  }
  for (const material of audit.unboundMaterials) {
    violations.push(`PA15 material not bound to register palette: ${material}`);
  }
  if (audit.sceneFogPresent) {
    violations.push("L5: scene.fog present (continuous fog is banned).");
  }
  if (audit.cameraFov < 38 || audit.cameraFov > 48) {
    violations.push(`D2: camera FOV ${audit.cameraFov} outside 38–48°.`);
  }
  if (Math.abs(audit.cameraRoll) > 0.001) {
    violations.push(`D2: camera roll ${audit.cameraRoll} (roll is banned).`);
  }
  if (!audit.reversedDepth) {
    violations.push("D2: reverse-Z depth buffer not active.");
  }
  void config;
  return violations;
};

/**
 * Evaluate the full machine-row set. `captures` must cover every shot on
 * every backend with post on, plus the post-off re-run set for A7; a missing
 * expected capture fails the affected rows (the harness is part of the gate).
 */
export const evaluateGate = (
  captures: readonly Capture[],
  audits: Readonly<Record<string, LawAudit>>,
  config: RegisterConfig,
): GateReport => {
  const postOn = captures.filter((c) => c.meta.post);
  const postOff = captures.filter((c) => !c.meta.post);
  const backends = [...new Set(captures.map((c) => c.meta.backend))];
  const thresholds = config.gates;

  const expectedPostOn = backends.length * config.shots.length;
  const missing: string[] = [];
  if (postOn.length < expectedPostOn) {
    missing.push(`expected ${expectedPostOn} post-on captures, received ${postOn.length}`);
  }
  if (postOff.length === 0) {
    missing.push("no post-off captures: A7 cannot be evaluated");
  }

  // A1 — palette covenant (L2): ≥92% pixels within ΔE 6 of declared colors.
  const a1 = row(
    "A1",
    "Palette covenant: ≥92% of pixels within ΔE 6 of tokens + declared ramps",
    postOn.map((c) => ({
      capture: captureLabel(c.meta),
      value: c.stats.covenantCoverage,
      pass: c.stats.covenantCoverage >= thresholds.a1Coverage,
    })),
    `threshold ${(thresholds.a1Coverage * 100).toFixed(0)}% coverage at ΔE 6`,
    missing.length,
  );

  // A2 — renderer law asserts (L1/L4/L5/D2/PA15), one audit per backend.
  const a2Measurements: RowMeasurement[] = Object.entries(audits).map(([backend, audit]) => {
    const violations = auditViolations(audit, config);
    return {
      capture: backend,
      value: violations.length,
      pass: violations.length === 0,
    };
  });
  const allViolations = Object.entries(audits).flatMap(([backend, audit]) =>
    auditViolations(audit, config).map((v) => `${backend}: ${v}`),
  );
  const a2: GateRow = {
    id: "A2",
    title: "Renderer law asserts: no fog/DoF/blur/shake flags; lights registered; materials bound",
    pass: a2Measurements.every((m) => m.pass),
    detail:
      allViolations.length === 0
        ? "no renderer-law violations on any backend"
        : allViolations.join("; "),
    measurements: a2Measurements,
  };

  // A3 — red precision (L8): oxblood hue-mask ≤5% coverage.
  const a3 = row(
    "A3",
    "Red precision: oxblood mask ≤5% frame coverage",
    postOn.map((c) => ({
      capture: captureLabel(c.meta),
      value: c.stats.oxbloodCoverage,
      pass: c.stats.oxbloodCoverage <= thresholds.a3OxbloodCoverage,
    })),
    `threshold ≤${(thresholds.a3OxbloodCoverage * 100).toFixed(0)}% coverage`,
    missing.length,
  );

  // A4 — grayscale survival: value-only readability.
  const a4 = row(
    "A4",
    "Grayscale survival: contrast bands readable in value-only conversion",
    postOn.map((c) => ({
      capture: captureLabel(c.meta),
      value: c.stats.grayscaleBands,
      pass:
        c.stats.grayscaleBands >= thresholds.a4MinBands &&
        c.stats.grayscaleStdDev >= thresholds.a4MinStdDev,
    })),
    `threshold ≥${thresholds.a4MinBands} bands and σ≥${thresholds.a4MinStdDev}`,
    missing.length,
  );

  // A6 — ink outline present on character silhouettes (post-on only).
  const silhouetteCaptures = postOn.filter((c) => c.meta.silhouette);
  const [a6Min, a6Max] = [thresholds.a6EdgeDensity[0] ?? 0, thresholds.a6EdgeDensity[1] ?? 1];
  const a6 = row(
    "A6",
    "Ink outline present on character silhouettes (edge-density band)",
    silhouetteCaptures.map((c) => ({
      capture: captureLabel(c.meta),
      value: c.stats.inkEdgeDensity,
      pass: c.stats.inkEdgeDensity >= a6Min && c.stats.inkEdgeDensity <= a6Max,
    })),
    `threshold edge density within [${a6Min}, ${a6Max}]`,
    silhouetteCaptures.length === 0 ? 1 : 0,
  );

  // A7 — no-post baseline (L12): A1/A3/A4 re-pass with all post disabled.
  const a7Rows = postOff.flatMap((c): readonly GateRow[] => [
    row(
      `A7.${captureLabel(c.meta)}.covenant`,
      "A7/A1 no-post palette covenant",
      [
        {
          capture: captureLabel(c.meta),
          value: c.stats.covenantCoverage,
          pass: c.stats.covenantCoverage >= thresholds.a1Coverage,
        },
      ],
      "post disabled",
    ),
    row(
      `A7.${captureLabel(c.meta)}.red`,
      "A7/A3 no-post red precision",
      [
        {
          capture: captureLabel(c.meta),
          value: c.stats.oxbloodCoverage,
          pass: c.stats.oxbloodCoverage <= thresholds.a3OxbloodCoverage,
        },
      ],
      "post disabled",
    ),
    row(
      `A7.${captureLabel(c.meta)}.grayscale`,
      "A7/A4 no-post grayscale survival",
      [
        {
          capture: captureLabel(c.meta),
          value: c.stats.grayscaleBands,
          pass:
            c.stats.grayscaleBands >= thresholds.a4MinBands &&
            c.stats.grayscaleStdDev >= thresholds.a4MinStdDev,
        },
      ],
      "post disabled",
    ),
  ]);
  const a7: GateRow = {
    id: "A7",
    title: "No-post baseline: A1/A3/A4 re-pass with all post disabled (L12)",
    pass: a7Rows.every((r) => r.pass) && postOff.length > 0,
    detail:
      postOff.length === 0
        ? "no post-off captures"
        : `${a7Rows.filter((r) => r.pass).length}/${a7Rows.length} no-post sub-rows pass`,
    measurements: a7Rows.flatMap((r) => r.measurements),
  };

  const rows: readonly GateRow[] = [a1, a2, a3, a4, a6, a7];
  return {
    rows,
    pass: rows.every((r) => r.pass) && missing.length === 0,
    captures: captures.length,
    backends,
  };
};
