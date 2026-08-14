import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  MOTION_PARAMS_SCHEMA,
  fallDamageFraction,
  parseMotionParams,
  sampleCurve,
} from "./params";

const rawText = readFileSync(new URL("../../data/motion_params.json", import.meta.url), "utf8");
const raw: unknown = JSON.parse(rawText);
const params = parseMotionParams(raw);

const mutate = (change: (draft: Record<string, unknown>) => void): unknown => {
  const draft = JSON.parse(rawText) as Record<string, unknown>;
  change(draft);
  return draft;
};

describe("motion_params.json carries the D8 / TUNING_V0 numbers", () => {
  it("declares the versioned schema", () => {
    expect(params.schema).toBe(MOTION_PARAMS_SCHEMA);
    expect(params.tickHz).toBe(60);
  });

  it("matches the D8 capsule and collision spec", () => {
    expect(params.capsule.radius).toBe(0.35);
    expect(params.capsule.height).toBe(1.75);
    expect(params.capsule.skin).toBe(0.02);
    expect(params.collision.stepHeight).toBe(0.35);
    expect(params.collision.groundSnapMeters).toBe(0.15);
    expect(params.collision.maxContacts).toBe(4);
  });

  it("ships the 45 degree slope limit and keeps 50 documented rather than active", () => {
    expect(params.collision.slopeLimitDegrees).toBe(45);
    expect(params.collision.walkableNormalY).toBeCloseTo(Math.SQRT1_2, 12);
    // 44 walkable, 46 not, at the shipped limit.
    expect(Math.cos((44 * Math.PI) / 180)).toBeGreaterThan(params.collision.walkableNormalY);
    expect(Math.cos((46 * Math.PI) / 180)).toBeLessThan(params.collision.walkableNormalY);

    const sources = (raw as { _sources: Record<string, string> })._sources;
    expect(sources["collision.slopeLimitDegrees"]).toMatch(/50/);
    expect(sources["collision.slopeLimitDegrees"]).toMatch(/SHIPPING 45/);
  });

  it("matches the D8 / TUNING_V0 movement numbers", () => {
    expect(params.gravity.metersPerSecondSquared).toBe(20);
    expect(params.jump.apexMeters).toBe(1.2);
    expect(params.jump.breathCost).toBe(22);
    expect(params.breath.sprintDrainPerSecond).toBe(11);
    expect(params.speeds.run).toBe(6);
    expect(params.fallDamage.safeMeters).toBe(6);
  });

  it("derives the jump launch speed from gravity and apex rather than storing it", () => {
    expect(params.jump.launchSpeed).toBeCloseTo(Math.sqrt(2 * 20 * 1.2), 12);
    expect(Object.keys(raw as Record<string, unknown>)).not.toContain("launchSpeed");
  });

  it("documents provenance for every authored group", () => {
    const sources = (raw as { _sources: Record<string, string> })._sources;
    for (const key of ["capsule.radius", "jump.breathCost", "speeds.run", "fallDamage.curve"]) {
      expect(typeof sources[key]).toBe("string");
    }
  });
});

describe("parseMotionParams", () => {
  it("rejects a wrong schema", () => {
    expect(() => parseMotionParams(mutate((draft) => (draft["schema"] = "nope")))).toThrow(RangeError);
  });

  it("rejects a non-object", () => {
    expect(() => parseMotionParams(null)).toThrow(RangeError);
    expect(() => parseMotionParams([])).toThrow(RangeError);
  });

  it("rejects a capsule thinner than it is tall", () => {
    expect(() =>
      parseMotionParams(
        mutate((draft) => {
          (draft["capsule"] as Record<string, unknown>)["height"] = 0.5;
        }),
      ),
    ).toThrow(/height must exceed/);
  });

  it("rejects a slope limit at or past vertical", () => {
    expect(() =>
      parseMotionParams(
        mutate((draft) => {
          (draft["collision"] as Record<string, unknown>)["slopeLimitDegrees"] = 90;
        }),
      ),
    ).toThrow(/below 90/);
  });

  it("rejects a non-integer contact budget", () => {
    expect(() =>
      parseMotionParams(
        mutate((draft) => {
          (draft["collision"] as Record<string, unknown>)["maxContacts"] = 2.5;
        }),
      ),
    ).toThrow(/integer/);
  });

  it("rejects a lethal fall no deeper than the safe fall", () => {
    expect(() =>
      parseMotionParams(
        mutate((draft) => {
          (draft["fallDamage"] as Record<string, unknown>)["lethalMeters"] = 6;
        }),
      ),
    ).toThrow(/must exceed safeMeters/);
  });

  it("rejects curves that are not strictly increasing", () => {
    expect(() =>
      parseMotionParams(
        mutate((draft) => {
          draft["turnRateCurve"] = [
            [0, 1],
            [0, 2],
          ];
        }),
      ),
    ).toThrow(/strictly increasing/);
  });

  it("rejects a run speed no faster than a walk", () => {
    expect(() =>
      parseMotionParams(
        mutate((draft) => {
          (draft["speeds"] as Record<string, unknown>)["run"] = 2;
        }),
      ),
    ).toThrow(/must exceed walk/);
  });
});

describe("sampleCurve", () => {
  const curve = [
    [0, 0],
    [0.5, 10],
    [1, 12],
  ] as const;

  it("returns endpoints outside the authored domain", () => {
    expect(sampleCurve(curve, -5)).toBe(0);
    expect(sampleCurve(curve, 5)).toBe(12);
  });

  it("hits authored points exactly", () => {
    expect(sampleCurve(curve, 0)).toBe(0);
    expect(sampleCurve(curve, 0.5)).toBe(10);
    expect(sampleCurve(curve, 1)).toBe(12);
  });

  it("interpolates linearly between points", () => {
    expect(sampleCurve(curve, 0.25)).toBeCloseTo(5, 12);
    expect(sampleCurve(curve, 0.75)).toBeCloseTo(11, 12);
  });
});

describe("fallDamageFraction", () => {
  it("is exactly zero at and below the safe height", () => {
    expect(fallDamageFraction(params, 0)).toBe(0);
    expect(fallDamageFraction(params, 5.999_999)).toBe(0);
    expect(fallDamageFraction(params, 6)).toBe(0);
  });

  it("is strictly positive the instant the safe height is passed", () => {
    expect(fallDamageFraction(params, 6.000_001)).toBeGreaterThan(0);
    expect(fallDamageFraction(params, 6.000_001)).toBeLessThan(0.001);
  });

  it("is exactly lethal at and beyond the lethal height", () => {
    expect(fallDamageFraction(params, 14)).toBe(1);
    expect(fallDamageFraction(params, 40)).toBe(1);
  });

  it("rises monotonically between the thresholds", () => {
    let previous = 0;
    for (let meters = 6; meters <= 14; meters += 0.25) {
      const damage = fallDamageFraction(params, meters);
      expect(damage).toBeGreaterThanOrEqual(previous);
      expect(damage).toBeLessThanOrEqual(1);
      previous = damage;
    }
  });

  it("reaches the curve's midpoint at the midpoint fall", () => {
    expect(fallDamageFraction(params, 10)).toBeCloseTo(0.42, 12);
  });
});
