import { describe, expect, it } from "vitest";

import type { FrameStats } from "./analysis";
import { REGISTER_CONFIG } from "./config";
import { evaluateGate, type Capture, type LawAudit } from "./gateRows";

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
