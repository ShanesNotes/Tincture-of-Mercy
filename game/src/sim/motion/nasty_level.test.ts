import { describe, expect, it } from "vitest";

import { SeededRng } from "../rng";
import {
  BruteForceQueries,
  NASTY_LEVEL_LANDMARKS,
  closestDistanceToLevel,
  closestSegmentTriangle,
  createNastyLevel,
  type LevelTriangle,
} from "./nasty_level";
import type { Capsule, Vec3 } from "./types";
import { vec } from "./vec";

const CAPSULE_RADIUS = 0.35;
const CAPSULE_HEIGHT = 1.75;
/** 3 * tan(44 deg), quantized to 1mm exactly as the fixture does. */
const RAMP_44_RISE = 2.897;

const level = createNastyLevel();
const queries = new BruteForceQueries(level);

/** Capsule whose lowest point is `foot`. */
const capsuleAt = (foot: Vec3): Capsule => ({
  start: vec(foot.x, foot.y + CAPSULE_RADIUS, foot.z),
  end: vec(foot.x, foot.y + CAPSULE_HEIGHT - CAPSULE_RADIUS, foot.z),
  radius: CAPSULE_RADIUS,
});

const lifted = (foot: Vec3, height: number): Vec3 => vec(foot.x, foot.y + height, foot.z);

const isQuantized = (value: number): boolean => Math.round(value * 1000) / 1000 === value;

/**
 * Sweep normals come out of a normalize of the contact offset, so an axis
 * aligned contact lands within an ulp of the axis rather than on it.
 */
const expectNormal = (actual: Vec3 | undefined, expected: Vec3, label?: string): void => {
  expect(actual?.x, label).toBeCloseTo(expected.x, 12);
  expect(actual?.y, label).toBeCloseTo(expected.y, 12);
  expect(actual?.z, label).toBeCloseTo(expected.z, 12);
};

const components = (triangle: LevelTriangle): readonly number[] => [
  triangle.a.x,
  triangle.a.y,
  triangle.a.z,
  triangle.b.x,
  triangle.b.y,
  triangle.b.z,
  triangle.c.x,
  triangle.c.y,
  triangle.c.z,
];

/** Right isoceles triangle in the y = 0 plane, used for the hand-computed distance cases. */
const flatTriangle: LevelTriangle = { index: 0, a: vec(0, 0, 0), b: vec(2, 0, 0), c: vec(0, 0, 2) };

describe("nasty level geometry", () => {
  it("builds a stable triangle soup", () => {
    expect(level.triangles.length).toBe(1102);
    expect(level.bounds).toEqual({ minX: -12, maxX: 12, minZ: -12, maxZ: 12 });
  });

  it("numbers triangles by insertion order and quantizes every vertex to 1mm", () => {
    let position = 0;
    for (const triangle of level.triangles) {
      expect(triangle.index).toBe(position);
      for (const value of components(triangle)) {
        expect(Number.isFinite(value)).toBe(true);
        expect(isQuantized(value)).toBe(true);
      }
      position += 1;
    }
  });

  it("leaves no hole where the coarse floor cells were replaced by the seam patch", () => {
    const rng = new SeededRng(0x5eed_0001);
    for (let sample = 0; sample < 64; sample += 1) {
      const x = 8 + (rng.nextUint32() / 0x1_0000_0000) * 4;
      const z = 8 + (rng.nextUint32() / 0x1_0000_0000) * 4;
      const hit = queries.raycast({
        origin: vec(x, 5, z),
        direction: vec(0, -1, 0),
        maxDistance: 10,
      });
      expect(hit).not.toBeNull();
      expect(hit?.distance).toBeCloseTo(5, 9);
      expect(hit?.normal).toEqual(vec(0, 1, 0));
    }
  });

  it("covers the whole playable extent with an upward-facing surface", () => {
    const rng = new SeededRng(0x5eed_0002);
    for (let sample = 0; sample < 200; sample += 1) {
      const x = -11.9 + (rng.nextUint32() / 0x1_0000_0000) * 23.8;
      const z = -11.9 + (rng.nextUint32() / 0x1_0000_0000) * 23.8;
      const hit = queries.raycast({
        origin: vec(x, 5, z),
        direction: vec(0, -1, 0),
        maxDistance: 10,
      });
      expect(hit).not.toBeNull();
      expect(hit?.distance).toBeLessThanOrEqual(5);
      // Steepest authored surface is the 50 degree ramp: cos(50 deg) = 0.643.
      expect(hit?.normal.y).toBeGreaterThan(0.6);
    }
  });

  it("produces identical triangles from separately constructed levels", () => {
    const other = createNastyLevel();

    expect(other.triangles).toEqual(level.triangles);
    expect(JSON.stringify(other.triangles)).toBe(JSON.stringify(level.triangles));
  });
});

describe("closestSegmentTriangle", () => {
  it("measures a segment endpoint standing above the face interior", () => {
    const pair = closestSegmentTriangle(vec(0.5, 1, 0.5), vec(0.5, 2, 0.5), flatTriangle);

    expect(pair.distance).toBeCloseTo(1, 12);
    expect(pair.onSegment.y).toBeCloseTo(1, 12);
    expect(pair.onTriangle).toEqual(vec(0.5, 0, 0.5));
  });

  it("measures a segment beside an edge", () => {
    const pair = closestSegmentTriangle(vec(1, 0, -1), vec(1, 1, -1), flatTriangle);

    expect(pair.distance).toBeCloseTo(1, 12);
    expect(pair.onTriangle.x).toBeCloseTo(1, 12);
    expect(pair.onTriangle.z).toBeCloseTo(0, 12);
    expect(pair.onSegment).toEqual(vec(1, 0, -1));
  });

  it("measures a segment beyond a vertex", () => {
    const pair = closestSegmentTriangle(vec(4, 0, 0), vec(4, 1, 0), flatTriangle);

    expect(pair.distance).toBeCloseTo(2, 12);
    expect(pair.onTriangle).toEqual(vec(2, 0, 0));
    expect(pair.onSegment).toEqual(vec(4, 0, 0));
  });

  it("measures a segment lying parallel to the face", () => {
    const pair = closestSegmentTriangle(vec(0.5, 0.5, 0.5), vec(1, 0.5, 0.6), flatTriangle);

    expect(pair.distance).toBeCloseTo(0.5, 12);
    expect(pair.onTriangle.y).toBeCloseTo(0, 12);
  });

  it("reports zero where the segment passes through the face", () => {
    const pair = closestSegmentTriangle(vec(0.5, -1, 0.5), vec(0.5, 1, 0.5), flatTriangle);

    expect(pair.distance).toBe(0);
    expect(pair.onSegment).toEqual(pair.onTriangle);
    expect(pair.onTriangle.y).toBeCloseTo(0, 12);
  });

  it("reports zero for a segment that ends exactly on the face", () => {
    const pair = closestSegmentTriangle(vec(0.5, 0, 0.5), vec(0.5, 1, 0.5), flatTriangle);

    expect(pair.distance).toBe(0);
  });
});

describe("raycast", () => {
  it("hits the floor straight down", () => {
    const hit = queries.raycast({ origin: vec(0, 5, 3.5), direction: vec(0, -1, 0), maxDistance: 10 });

    expect(hit).not.toBeNull();
    expect(hit?.distance).toBeCloseTo(5, 12);
    expect(hit?.point).toEqual(vec(0, 0, 3.5));
    expect(hit?.normal).toEqual(vec(0, 1, 0));
  });

  it("hits the inner face of the perimeter wall", () => {
    const hit = queries.raycast({ origin: vec(0, 1, 0), direction: vec(1, 0, 0), maxDistance: 20 });

    expect(hit).not.toBeNull();
    expect(hit?.distance).toBeCloseTo(12, 12);
    expect(hit?.normal).toEqual(vec(-1, 0, 0));
  });

  it("returns null for a ray into empty air", () => {
    expect(
      queries.raycast({ origin: vec(0, 3, 0), direction: vec(0, 1, 0), maxDistance: 10 }),
    ).toBeNull();
  });

  it("returns null when maxDistance stops short of the surface", () => {
    expect(
      queries.raycast({ origin: vec(0, 5, 3.5), direction: vec(0, -1, 0), maxDistance: 4 }),
    ).toBeNull();
  });

  it("rejects malformed queries", () => {
    expect(() =>
      queries.raycast({ origin: vec(0, Number.NaN, 0), direction: vec(0, -1, 0), maxDistance: 1 }),
    ).toThrow(RangeError);
    expect(() =>
      queries.raycast({ origin: vec(0, 1, 0), direction: vec(0, 0, 0), maxDistance: 1 }),
    ).toThrow(RangeError);
    expect(() =>
      queries.raycast({ origin: vec(0, 1, 0), direction: vec(0, -1, 0), maxDistance: -1 }),
    ).toThrow(RangeError);
  });
});

describe("sweepCapsule", () => {
  it("stops a downward sweep exactly one radius above the floor", () => {
    const hit = queries.sweepCapsule({
      capsule: capsuleAt(vec(0, 1, 3.5)),
      displacement: vec(0, -2, 0),
    });

    // Segment bottom starts at y = 1.35 and must stop at y = 0.35: half the sweep.
    expect(hit).not.toBeNull();
    expect(hit?.fraction).toBeCloseTo(0.5, 8);
    expectNormal(hit?.normal, vec(0, 1, 0));
    expect(hit?.point.y).toBeCloseTo(0, 8);
  });

  it("stops a horizontal sweep at one radius from the wall", () => {
    const hit = queries.sweepCapsule({
      capsule: capsuleAt(vec(0, 0.5, 4)),
      displacement: vec(20, 0, 0),
    });

    expect(hit).not.toBeNull();
    const fraction = hit?.fraction ?? 0;
    expect(fraction * 20).toBeCloseTo(11.65, 7);
    expectNormal(hit?.normal, vec(-1, 0, 0));
    expect(hit?.point.x).toBeCloseTo(12, 9);
  });

  it("returns null for a sweep through open space", () => {
    expect(
      queries.sweepCapsule({ capsule: capsuleAt(vec(0, 5, 0)), displacement: vec(1, 0, 0) }),
    ).toBeNull();
  });

  it("admits a 0.35 radius capsule down the centre of the 0.72m doorway", () => {
    expect(
      queries.sweepCapsule({
        capsule: capsuleAt(vec(6, 0.1, 4)),
        displacement: vec(0, 0, 3.5),
      }),
    ).toBeNull();
  });

  it("refuses the same capsule offset 0.05m sideways", () => {
    const hit = queries.sweepCapsule({
      capsule: capsuleAt(vec(6.05, 0.1, 4)),
      displacement: vec(0, 0, 3.5),
    });

    // Contact is the vertical jamb edge at (6.36, 5.9): dz = sqrt(0.35^2 - 0.31^2).
    const contactZ = 5.9 - Math.sqrt(CAPSULE_RADIUS ** 2 - 0.31 ** 2);
    expect(hit).not.toBeNull();
    expect(hit?.fraction).toBeCloseTo((contactZ - 4) / 3.5, 6);
    expect(hit?.point.x).toBeCloseTo(6.36, 6);
    expect(hit?.normal.x).toBeCloseTo(-0.31 / CAPSULE_RADIUS, 5);
  });

  it("rejects malformed queries", () => {
    expect(() =>
      queries.sweepCapsule({
        capsule: { start: vec(0, 1, 0), end: vec(0, Number.POSITIVE_INFINITY, 0), radius: 0.35 },
        displacement: vec(1, 0, 0),
      }),
    ).toThrow(RangeError);
    expect(() =>
      queries.sweepCapsule({
        capsule: { start: vec(0, 1, 0), end: vec(0, 2, 0), radius: -0.35 },
        displacement: vec(1, 0, 0),
      }),
    ).toThrow(RangeError);
  });

  it("returns byte-identical numbers for a repeated sweep", () => {
    const query = { capsule: capsuleAt(vec(10, 0.4, 10)), displacement: vec(0.3, -0.9, 0.2) };
    const first = queries.sweepCapsule(query);
    const second = queries.sweepCapsule(query);

    expect(first).not.toBeNull();
    expect(second).toEqual(first);
    expect(Object.is(second?.fraction, first?.fraction)).toBe(true);
    expect(Object.is(second?.normal.x, first?.normal.x)).toBe(true);
    expect(Object.is(second?.normal.y, first?.normal.y)).toBe(true);
    expect(Object.is(second?.normal.z, first?.normal.z)).toBe(true);
    expect(second?.triangleIndex).toBe(first?.triangleIndex);
  });
});

describe("probeGround", () => {
  it("reports the fall distance to the surface under every landmark", () => {
    for (const [name, foot] of Object.entries(NASTY_LEVEL_LANDMARKS)) {
      const hit = queries.probeGround({
        capsule: capsuleAt(lifted(foot, 0.1)),
        maxDistance: 0.5,
      });

      expect(hit, name).not.toBeNull();
      expect(hit?.distance, name).toBeCloseTo(0.1, 8);
      expect(hit?.point.y, name).toBeCloseTo(foot.y, 8);
      expectNormal(hit?.normal, vec(0, 1, 0), name);
    }
  });

  it("reports the staircase landing rather than the floor", () => {
    const hit = queries.probeGround({ capsule: capsuleAt(vec(0, 2.2, -10)), maxDistance: 1 });

    expect(hit).not.toBeNull();
    expect(hit?.distance).toBeCloseTo(0.5, 8);
    expect(hit?.point.y).toBeCloseTo(1.7, 8);
  });

  it("reports the 44 degree ramp face with its true normal", () => {
    const surfaceY = ((-4.5 + 6) / 3) * RAMP_44_RISE;
    const cosine = 3 / Math.hypot(RAMP_44_RISE, 3);
    const hit = queries.probeGround({
      capsule: capsuleAt(vec(-4.5, surfaceY + 0.5, -3.2)),
      maxDistance: 1,
    });

    expect(hit).not.toBeNull();
    expect(hit?.normal.y).toBeCloseTo(cosine, 9);
    expect(hit?.normal.y).toBeCloseTo(Math.cos((44 * Math.PI) / 180), 3);
    expect(hit?.normal.x).toBeLessThan(0);
    // A sphere settles r/cos(theta) - r higher above an incline than above the flat.
    expect(hit?.distance).toBeCloseTo(0.5 - CAPSULE_RADIUS * (1 / cosine - 1), 6);
  });

  it("returns null when nothing is within reach", () => {
    expect(
      queries.probeGround({ capsule: capsuleAt(vec(0, 5, 0)), maxDistance: 1 }),
    ).toBeNull();
  });

  it("rejects a negative reach", () => {
    expect(() =>
      queries.probeGround({ capsule: capsuleAt(vec(0, 1, 0)), maxDistance: -1 }),
    ).toThrow(RangeError);
  });
});

describe("closestDistanceToLevel", () => {
  it("returns the radius for a capsule resting on the floor", () => {
    // Segment-to-triangle: the segment's lowest point sits one radius up.
    expect(closestDistanceToLevel(level, capsuleAt(vec(0, 0, 3.5)))).toBeCloseTo(CAPSULE_RADIUS, 12);
  });

  it("adds the lift for a capsule hovering above the floor", () => {
    expect(closestDistanceToLevel(level, capsuleAt(vec(0, 1, 3.5)))).toBeCloseTo(
      CAPSULE_RADIUS + 1,
      12,
    );
  });

  it("agrees with the sweep contact: a swept capsule ends exactly one radius clear", () => {
    const capsule = capsuleAt(vec(0, 0.5, 4));
    const displacement = vec(20, 0, 0);
    const hit = queries.sweepCapsule({ capsule, displacement });
    const fraction = hit?.fraction ?? 0;
    const settled: Capsule = {
      start: vec(capsule.start.x + displacement.x * fraction, capsule.start.y, capsule.start.z),
      end: vec(capsule.end.x + displacement.x * fraction, capsule.end.y, capsule.end.z),
      radius: capsule.radius,
    };

    expect(closestDistanceToLevel(level, settled)).toBeCloseTo(CAPSULE_RADIUS, 6);
  });

  it("reports zero when the capsule segment intersects geometry", () => {
    // Foot at 0.6 pushes the segment (0.95 .. 2.0) straight through the 1.2m slab.
    expect(closestDistanceToLevel(level, capsuleAt(vec(1, 0.6, 10)))).toBe(0);
  });
});
