import { describe, expect, it } from "vitest";

import {
  approachAngle,
  basisFromAngles,
  degreesToRadians,
  dot,
  framingMargin,
  length,
  pitchTowards,
  pointMargin,
  poseAt,
  shortestAngleDelta,
  silhouettePoints,
  solveMinimalScalar,
  subtract,
  yawTowards,
  type Silhouette,
  type Vec3,
} from "./math";

const origin: Vec3 = { x: 0, y: 0, z: 0 };
const angleSweep = [-170, -90, -33, 0, 21, 90, 179].map(degreesToRadians);
const pitchSweep = [-55, -12, 0, 25, 42].map(degreesToRadians);

describe("basisFromAngles", () => {
  it("looks down -Z at rest", () => {
    const basis = basisFromAngles(0, 0);
    expect(basis.forward.x).toBeCloseTo(0, 12);
    expect(basis.forward.y).toBeCloseTo(0, 12);
    expect(basis.forward.z).toBeCloseTo(-1, 12);
    expect(basis.right.x).toBeCloseTo(1, 12);
    expect(basis.up.y).toBeCloseTo(1, 12);
  });

  it("stays orthonormal and roll-free across the sweep", () => {
    for (const yaw of angleSweep) {
      for (const pitch of pitchSweep) {
        const basis = basisFromAngles(yaw, pitch);
        expect(length(basis.forward)).toBeCloseTo(1, 12);
        expect(length(basis.right)).toBeCloseTo(1, 12);
        expect(length(basis.up)).toBeCloseTo(1, 12);
        expect(dot(basis.forward, basis.right)).toBeCloseTo(0, 12);
        expect(dot(basis.forward, basis.up)).toBeCloseTo(0, 12);
        expect(dot(basis.right, basis.up)).toBeCloseTo(0, 12);
        // Roll is structurally impossible: screen-right never leaves the ground plane.
        expect(basis.right.y).toBe(0);
      }
    }
  });
});

describe("yawTowards / pitchTowards", () => {
  it("round-trips an arbitrary direction back into a forward vector", () => {
    const direction: Vec3 = { x: 3, y: 1.5, z: -4 };
    const magnitude = length(direction);
    const basis = basisFromAngles(yawTowards(direction), pitchTowards(direction));
    expect(basis.forward.x).toBeCloseTo(direction.x / magnitude, 12);
    expect(basis.forward.y).toBeCloseTo(direction.y / magnitude, 12);
    expect(basis.forward.z).toBeCloseTo(direction.z / magnitude, 12);
  });
});

describe("shortestAngleDelta", () => {
  it.each([
    [0, 0, 0],
    [0, Math.PI / 2, Math.PI / 2],
    [0, -Math.PI / 2, -Math.PI / 2],
    [Math.PI * 0.9, -Math.PI * 0.9, Math.PI * 0.2],
    [-Math.PI * 0.9, Math.PI * 0.9, -Math.PI * 0.2],
  ])("goes the short way from %f to %f", (from, to, expected) => {
    expect(shortestAngleDelta(from, to)).toBeCloseTo(expected, 12);
  });

  it("never returns a delta outside half a turn", () => {
    for (const from of angleSweep) {
      for (const to of angleSweep) {
        expect(Math.abs(shortestAngleDelta(from, to))).toBeLessThanOrEqual(Math.PI);
      }
    }
  });
});

describe("approachAngle", () => {
  it("crosses the wrap seam instead of unwinding the long way", () => {
    const stepped = approachAngle(Math.PI * 0.95, -Math.PI * 0.95, 0.5);
    expect(Math.abs(stepped)).toBeGreaterThan(Math.PI * 0.95);
  });

  it("clamps the rate to a single tick of travel", () => {
    expect(approachAngle(0, 1, 5)).toBeCloseTo(1, 12);
    expect(approachAngle(0, 1, -5)).toBeCloseTo(0, 12);
  });
});

describe("pointMargin", () => {
  const pose = poseAt(origin, 0, 0, 5);

  it("reads half a screen at dead centre", () => {
    expect(pointMargin(pose, 44, 1.6, origin)).toBeCloseTo(0.5, 12);
  });

  it("reads zero exactly on the top edge", () => {
    const depth = 5;
    const edgeY = depth * Math.tan(degreesToRadians(44) / 2);
    expect(pointMargin(pose, 44, 1.6, { x: 0, y: edgeY, z: 0 })).toBeCloseTo(0, 12);
  });

  it("reads 12% margin at 76% of the way to the edge", () => {
    const depth = 5;
    const edgeY = depth * Math.tan(degreesToRadians(44) / 2);
    expect(pointMargin(pose, 44, 1.6, { x: 0, y: edgeY * 0.76, z: 0 })).toBeCloseTo(0.12, 12);
  });

  it("rejects points at or behind the lens", () => {
    expect(pointMargin(pose, 44, 1.6, { x: 0, y: 0, z: 6 })).toBe(Number.NEGATIVE_INFINITY);
  });
});

describe("framingMargin", () => {
  const player: Silhouette = {
    center: { x: 0, y: 0.9, z: 0 },
    radiusMeters: 0.45,
    halfHeightMeters: 0.9,
  };
  const target: Silhouette = {
    center: { x: 0, y: 0.7, z: -4 },
    radiusMeters: 0.55,
    halfHeightMeters: 0.7,
  };
  const bodies: readonly Silhouette[] = [player, target];

  it("improves monotonically as the camera pulls back", () => {
    let previous = Number.NEGATIVE_INFINITY;
    for (let distance = 2; distance <= 12; distance += 0.5) {
      const margin = framingMargin(poseAt({ x: 0, y: 1.35, z: 0 }, 0, 0, distance), 44, 1.6, bodies);
      expect(margin).toBeGreaterThan(previous);
      previous = margin;
    }
  });

  it("samples four extremes per silhouette", () => {
    const points = silhouettePoints(player, basisFromAngles(0, 0));
    expect(points).toHaveLength(4);
    expect(
      points.map((point) => Number(length(subtract(point, player.center)).toFixed(6))),
    ).toEqual([0.9, 0.9, 0.45, 0.45]);
  });
});

describe("solveMinimalScalar", () => {
  it("returns the lower bound when it already satisfies", () => {
    expect(solveMinimalScalar(1, 9, 24, (value) => value >= 0)).toEqual({ value: 1, satisfied: true });
  });

  it("reports failure at the upper bound", () => {
    expect(solveMinimalScalar(1, 9, 24, (value) => value >= 20)).toEqual({
      value: 9,
      satisfied: false,
    });
  });

  it("bisects onto the threshold and stays above it", () => {
    const solved = solveMinimalScalar(1, 9, 24, (value) => value >= 4.321);
    expect(solved.satisfied).toBe(true);
    expect(solved.value).toBeGreaterThanOrEqual(4.321);
    expect(solved.value).toBeLessThan(4.3211);
  });

  it("is bit-stable for identical inputs", () => {
    const predicate = (value: number): boolean => value * value >= 7;
    expect(solveMinimalScalar(0, 10, 24, predicate)).toEqual(solveMinimalScalar(0, 10, 24, predicate));
  });
});
