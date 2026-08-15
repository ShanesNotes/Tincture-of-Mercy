import { describe, expect, it } from "vitest";

import {
  A5_MIN_STATES,
  assembleRows,
  buildA5Row,
  buildFullA7Row,
  markPostOff,
} from "../../../tools/artgate/rows.js";
import type { FrameStats } from "./analysis";
import { REGISTER_CONFIG } from "./config";
import { evaluateGate, type Capture, type GateRow, type LawAudit } from "./gateRows";

const baseStats = (overrides: Partial<FrameStats> = {}): FrameStats => ({
  width: 64,
  height: 64,
  totalPixels: 4096,
  covenantCoverage: 0.97,
  meanDeltaE: 1.2,
  p99DeltaE: 5.5,
  oxbloodCoverage: 0.01,
  goldCoverage: 0.02,
  familyShares: { parchment: 0.5, ink: 0.2, green: 0.3 },
  grayscaleBands: 6,
  grayscaleStdDev: 40,
  inkEdgeDensity: 0.03,
  ...overrides,
});

const cleanAudit = (overrides: Partial<LawAudit> = {}): LawAudit => ({
  bannedFlagsEnabled: [],
  unregisteredLights: [],
  unboundMaterials: [],
  sceneFogPresent: false,
  cameraFov: 44,
  cameraRoll: 0,
  reversedDepth: true,
  ...overrides,
});

/** A complete capture matrix: 4 shots × 2 backends, post on + post off. */
const fullCaptures = (stats: (shot: string, post: boolean) => FrameStats): Capture[] => {
  const captures: Capture[] = [];
  for (const backend of ["webgpu", "webgl2"] as const) {
    for (const post of [true, false]) {
      for (const shot of REGISTER_CONFIG.shots) {
        captures.push({
          meta: { backend, shot: shot.name, post, silhouette: shot.silhouette },
          stats: stats(shot.name, post),
        });
      }
    }
  }
  return captures;
};

const fullAudits = (audit: () => LawAudit): Record<string, LawAudit> => ({
  webgpu: audit(),
  webgl2: audit(),
});

describe("evaluateGate", () => {
  it("passes all rows on a clean complete matrix", () => {
    const report = evaluateGate(fullCaptures(() => baseStats()), fullAudits(cleanAudit), REGISTER_CONFIG);
    expect(report.rows.map((r) => r.id)).toEqual(["A1", "A2", "A3", "A4", "A6", "A7"]);
    expect(report.pass).toBe(true);
    for (const rowResult of report.rows) {
      expect(rowResult.pass, `${rowResult.id}: ${rowResult.detail}`).toBe(true);
    }
  });

  it("fails A1 when covenant coverage drops below 92%", () => {
    const report = evaluateGate(
      fullCaptures(() => baseStats({ covenantCoverage: 0.8 })),
      fullAudits(cleanAudit),
      REGISTER_CONFIG,
    );
    const a1 = report.rows.find((r) => r.id === "A1");
    expect(a1?.pass).toBe(false);
    expect(report.pass).toBe(false);
  });

  it("fails A2 when an unregistered light is found (L4)", () => {
    const report = evaluateGate(
      fullCaptures(() => baseStats()),
      fullAudits(() => cleanAudit({ unregisteredLights: ["AmbientLight"] })),
      REGISTER_CONFIG,
    );
    const a2 = report.rows.find((r) => r.id === "A2");
    expect(a2?.pass).toBe(false);
    expect(a2?.detail).toContain("AmbientLight");
  });

  it("fails A2 when a banned L1 flag is enabled", () => {
    const report = evaluateGate(
      fullCaptures(() => baseStats()),
      fullAudits(() => cleanAudit({ bannedFlagsEnabled: ["fog"] })),
      REGISTER_CONFIG,
    );
    expect(report.rows.find((r) => r.id === "A2")?.pass).toBe(false);
  });

  it("fails A3 when oxblood coverage exceeds 5% (L8)", () => {
    const report = evaluateGate(
      fullCaptures(() => baseStats({ oxbloodCoverage: 0.08 })),
      fullAudits(cleanAudit),
      REGISTER_CONFIG,
    );
    expect(report.rows.find((r) => r.id === "A3")?.pass).toBe(false);
  });

  it("fails A4 when grayscale structure collapses", () => {
    const report = evaluateGate(
      fullCaptures(() => baseStats({ grayscaleBands: 2, grayscaleStdDev: 10 })),
      fullAudits(cleanAudit),
      REGISTER_CONFIG,
    );
    expect(report.rows.find((r) => r.id === "A4")?.pass).toBe(false);
  });

  it("fails A6 when silhouette shots carry no ink outline", () => {
    const report = evaluateGate(
      fullCaptures((_shot, post) => baseStats({ inkEdgeDensity: post ? 0.0005 : 0.03 })),
      fullAudits(cleanAudit),
      REGISTER_CONFIG,
    );
    expect(report.rows.find((r) => r.id === "A6")?.pass).toBe(false);
  });

  it("fails A7 when the no-post baseline drops the covenant (L12)", () => {
    const report = evaluateGate(
      fullCaptures((_shot, post) => baseStats({ covenantCoverage: post ? 0.97 : 0.7 })),
      fullAudits(cleanAudit),
      REGISTER_CONFIG,
    );
    const a7 = report.rows.find((r) => r.id === "A7");
    expect(a7?.pass).toBe(false);
    expect(report.pass).toBe(false);
  });

  it("fails closed when captures are missing", () => {
    const onlyOne = fullCaptures(() => baseStats()).slice(0, 1);
    const report = evaluateGate(onlyOne, fullAudits(cleanAudit), REGISTER_CONFIG);
    expect(report.pass).toBe(false);
  });
});

/**
 * F5 coverage: the harness-side rows the s13-scoped evaluateGate does not
 * emit — A5 (HUD border verdict image diff) and the full A1–A6 no-post
 * baseline (A7). The pure composition lives in tools/artgate/rows.js so the
 * node harness and this test run the same code.
 */
describe("artgate full row assembly (A5 + full A7)", () => {
  const passRow = (id: string): GateRow => ({
    id,
    title: `${id} stub`,
    pass: true,
    detail: "ok",
    measurements: [{ capture: `${id} capture`, value: 1, pass: true }],
  });
  const failRow = (id: string): GateRow => ({
    ...passRow(id),
    pass: false,
    measurements: [{ capture: `${id} capture`, value: 0, pass: false }],
  });
  const distinctStates = (count: number) =>
    Array.from({ length: count }, (_, index) => ({
      state: `state-${index}`,
      png: Buffer.from(`border-pixels-${index}`),
    }));

  it("assembles the full A1–A7 row list from the s13 base rows", () => {
    const base = evaluateGate(fullCaptures(() => baseStats()), fullAudits(cleanAudit), REGISTER_CONFIG);
    const rows = assembleRows(
      base.rows,
      buildA5Row(distinctStates(4)),
      buildFullA7Row({
        a1: passRow("A1"),
        a2: passRow("A2"),
        a3: passRow("A3"),
        a4: passRow("A4"),
        a5: passRow("A5"),
        a6: passRow("A6"),
      }),
    );
    expect(rows.map((r) => r.id)).toEqual(["A1", "A2", "A3", "A4", "A5", "A6", "A7"]);
  });

  it("A5 passes when ≥3 border states differ as rendered bytes", () => {
    const row = buildA5Row(distinctStates(4));
    expect(row.pass).toBe(true);
    expect(row.measurements).toHaveLength(3); // adjacent pairs
    expect(row.measurements.every((m) => m.pass)).toBe(true);
  });

  it("A5 fails closed with fewer than 3 states", () => {
    const row = buildA5Row(distinctStates(A5_MIN_STATES - 1));
    expect(row.pass).toBe(false);
    expect(row.detail).toContain("state");
  });

  it("A5 fails when an adjacent state pair renders identically", () => {
    const same = Buffer.from("identical-border");
    const row = buildA5Row([
      { state: "a", png: same },
      { state: "b", png: Buffer.from(same) },
      { state: "c", png: Buffer.from("different") },
    ]);
    expect(row.pass).toBe(false);
    const failing = row.measurements.find((m) => !m.pass);
    expect(failing?.capture).toBe("a vs b");
  });

  it("full A7 passes only when all of A1–A6 re-pass post-off", () => {
    const passing = buildFullA7Row({
      a1: passRow("A1"),
      a2: passRow("A2"),
      a3: passRow("A3"),
      a4: passRow("A4"),
      a5: passRow("A5"),
      a6: passRow("A6"),
    });
    expect(passing.pass).toBe(true);
    expect(passing.title).toContain("A1–A6");

    const a6Fails = buildFullA7Row({
      a1: passRow("A1"),
      a2: passRow("A2"),
      a3: passRow("A3"),
      a4: passRow("A4"),
      a5: passRow("A5"),
      a6: failRow("A6"),
    });
    expect(a6Fails.pass).toBe(false);
    expect(a6Fails.detail).toContain("5/6");
    expect(a6Fails.measurements.some((m) => !m.pass)).toBe(true);
  });

  it("markPostOff relabels second-pass measurements as post-off evidence", () => {
    const row: GateRow = {
      id: "A1",
      title: "stub",
      pass: true,
      detail: "ok",
      measurements: [{ capture: "webgpu/plate/post-on", value: 1, pass: true }],
    };
    expect(markPostOff(row).measurements[0]?.capture).toBe("webgpu/plate/post-off");
  });
});
