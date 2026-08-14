/**
 * The nasty-geometry test level plus a brute-force reference implementation of
 * `CollisionQueries` (DECISIONS.md D8: "a nasty-geometry test level ships with
 * the controller").
 *
 * The level is triangle soup built from boxes and quads, every vertex quantized
 * to 1mm, triangle order fixed by insertion. It is the oracle the controller's
 * property tests run against, so the queries here mirror the algorithm and the
 * determinism tie-breaks of `src/view/collision.ts` exactly — same convex
 * ternary/bisection sweep, same contact normal, same earliest-fraction rule —
 * only without the BVH. A brute-force scan plus a per-triangle AABB reject is
 * fast enough for the property tests and has no acceleration structure whose
 * bugs could hide a controller bug.
 */

import type {
  Capsule,
  CapsuleSweepHit,
  CapsuleSweepQuery,
  CollisionQueries,
  GroundProbeHit,
  GroundProbeQuery,
  RaycastHit,
  RaycastQuery,
  Vec3,
} from "./types";
import { add, addScaled, clamp, cross, dot, lengthSq, normalize, scale, sub, vec } from "./vec";

export interface LevelTriangle {
  readonly index: number;
  readonly a: Vec3;
  readonly b: Vec3;
  readonly c: Vec3;
}

export interface NastyLevel {
  readonly triangles: readonly LevelTriangle[];
  /** Inner playable extent of the closed perimeter. */
  readonly bounds: {
    readonly minX: number;
    readonly maxX: number;
    readonly minZ: number;
    readonly maxZ: number;
  };
}

/** Closest pair between a segment and a triangle. */
export interface ClosestPair {
  readonly distance: number;
  readonly onSegment: Vec3;
  readonly onTriangle: Vec3;
}

const QUANTUM = 1000;
const CONTACT_EPSILON = 1e-7;
const FRACTION_TIE_EPSILON = 1e-9;
const MINIMUM_STEPS = 40;
const REFINEMENT_STEPS = 28;
const DEGENERATE_EPSILON = 1e-12;

/** D8: collision vertices are quantized to 1mm so the mesh hash is stable. */
const quantize = (value: number): number => {
  const rounded = Math.round(value * QUANTUM);
  return rounded === 0 ? 0 : rounded / QUANTUM;
};

const quantizeVec = (value: Vec3): Vec3 => vec(quantize(value.x), quantize(value.y), quantize(value.z));

const addTriangle = (out: LevelTriangle[], a: Vec3, b: Vec3, c: Vec3): void => {
  out.push({ index: out.length, a: quantizeVec(a), b: quantizeVec(b), c: quantizeVec(c) });
};

/** Two triangles fanned from `p0`; the face normal follows `cross(p1 - p0, p2 - p0)`. */
const addQuad = (out: LevelTriangle[], p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3): void => {
  addTriangle(out, p0, p1, p2);
  addTriangle(out, p0, p2, p3);
};

/** Axis-aligned box as 12 outward-wound triangles. */
const addBox = (out: LevelTriangle[], min: Vec3, max: Vec3): void => {
  addQuad(out, vec(min.x, min.y, min.z), vec(min.x, min.y, max.z), vec(min.x, max.y, max.z), vec(min.x, max.y, min.z));
  addQuad(out, vec(max.x, min.y, max.z), vec(max.x, min.y, min.z), vec(max.x, max.y, min.z), vec(max.x, max.y, max.z));
  addQuad(out, vec(min.x, min.y, min.z), vec(max.x, min.y, min.z), vec(max.x, min.y, max.z), vec(min.x, min.y, max.z));
  addQuad(out, vec(min.x, max.y, max.z), vec(max.x, max.y, max.z), vec(max.x, max.y, min.z), vec(min.x, max.y, min.z));
  addQuad(out, vec(max.x, min.y, min.z), vec(min.x, min.y, min.z), vec(min.x, max.y, min.z), vec(max.x, max.y, min.z));
  addQuad(out, vec(min.x, min.y, max.z), vec(max.x, min.y, max.z), vec(max.x, max.y, max.z), vec(min.x, max.y, max.z));
};

const FLOOR_MIN = -12;
const FLOOR_MAX = 12;
const FLOOR_CELL = 2;
const SEAM_MIN = 8;
const SEAM_MAX = 12;
const SEAM_CELL = 0.25;
const WALL_THICKNESS = 1;
const WALL_HEIGHT = 4;
const STAIR_STEPS = 5;
const STAIR_TREAD = 0.8;
const STAIR_START_X = -6;
const STAIR_TOP_X = -2;
const STAIR_LANDING_X = 2;
const LOW_STAIR_RISE = 0.34;
const HIGH_STAIR_RISE = 0.36;
const RAMP_START_X = -6;
const RAMP_END_X = -3;
const RAMP_WALL_MAX_X = -2.6;
const RAMP_RUN = 3;
const DOORWAY_WIDTH = 0.72;
const DOORWAY_CENTRE_X = 6;
const DOORWAY_MIN_Z = 5.9;
const DOORWAY_MAX_Z = 6.1;
const DOORWAY_HEIGHT = 3;
const WEDGE_APEX = vec(-8, 0, 11);
const WEDGE_ARM_LENGTH = 4;
const WEDGE_WALL_HEIGHT = 3;

const RAMPS = [
  { degrees: 44, laneMinZ: -4.5, laneMaxZ: -2.5 },
  { degrees: 46, laneMinZ: -2, laneMaxZ: 0 },
  { degrees: 50, laneMinZ: 0.5, laneMaxZ: 2.5 },
] as const;

/** Both arms are 4m long; the 25 degree opening between them points toward -z. */
const WEDGE_ARMS = [
  { degrees: 257.5, mirrored: false },
  { degrees: 282.5, mirrored: true },
] as const;

/**
 * Floor cell at y = 0. `flipped` swaps the split diagonal, which is how the
 * seam patch produces opposed edges for the capsule to slide across.
 */
const addFloorCell = (
  out: LevelTriangle[],
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
  flipped: boolean,
): void => {
  const nearLeft = vec(minX, 0, minZ);
  const nearRight = vec(maxX, 0, minZ);
  const farRight = vec(maxX, 0, maxZ);
  const farLeft = vec(minX, 0, maxZ);
  if (flipped) {
    addTriangle(out, nearLeft, farLeft, farRight);
    addTriangle(out, nearLeft, farRight, nearRight);
    return;
  }
  addQuad(out, farLeft, farRight, nearRight, nearLeft);
};

const addFloor = (out: LevelTriangle[]): void => {
  for (let minX = FLOOR_MIN; minX < FLOOR_MAX; minX += FLOOR_CELL) {
    for (let minZ = FLOOR_MIN; minZ < FLOOR_MAX; minZ += FLOOR_CELL) {
      if (minX >= SEAM_MIN && minZ >= SEAM_MIN) {
        continue;
      }
      addFloorCell(out, minX, minX + FLOOR_CELL, minZ, minZ + FLOOR_CELL, false);
    }
  }
};

const addSeamPatch = (out: LevelTriangle[]): void => {
  const cells = (SEAM_MAX - SEAM_MIN) / SEAM_CELL;
  for (let i = 0; i < cells; i += 1) {
    for (let j = 0; j < cells; j += 1) {
      const minX = SEAM_MIN + i * SEAM_CELL;
      const minZ = SEAM_MIN + j * SEAM_CELL;
      addFloorCell(out, minX, minX + SEAM_CELL, minZ, minZ + SEAM_CELL, (i + j) % 2 === 1);
    }
  }
};

/** Four boxes; inner faces sit exactly on the floor edges, thickness grows outward. */
const addPerimeterWalls = (out: LevelTriangle[]): void => {
  const outer = FLOOR_MAX + WALL_THICKNESS;
  addBox(out, vec(-outer, 0, -outer), vec(FLOOR_MIN, WALL_HEIGHT, outer));
  addBox(out, vec(FLOOR_MAX, 0, -outer), vec(outer, WALL_HEIGHT, outer));
  addBox(out, vec(FLOOR_MIN, 0, -outer), vec(FLOOR_MAX, WALL_HEIGHT, FLOOR_MIN));
  addBox(out, vec(FLOOR_MIN, 0, FLOOR_MAX), vec(FLOOR_MAX, WALL_HEIGHT, outer));
};

/** Nested boxes: step `i` runs from its own nosing all the way back to the landing. */
const addStaircase = (out: LevelTriangle[], rise: number, laneMinZ: number, laneMaxZ: number): void => {
  for (let step = 0; step < STAIR_STEPS; step += 1) {
    addBox(
      out,
      vec(STAIR_START_X + STAIR_TREAD * step, 0, laneMinZ),
      vec(STAIR_TOP_X, rise * (step + 1), laneMaxZ),
    );
  }
  addBox(out, vec(STAIR_TOP_X, 0, laneMinZ), vec(STAIR_LANDING_X, rise * STAIR_STEPS, laneMaxZ));
};

const addRamps = (out: LevelTriangle[]): void => {
  for (const ramp of RAMPS) {
    const height = quantize(RAMP_RUN * Math.tan((ramp.degrees * Math.PI) / 180));
    // Wound from the +z lane edge so the incline's face normal points up.
    addQuad(
      out,
      vec(RAMP_START_X, 0, ramp.laneMaxZ),
      vec(RAMP_END_X, height, ramp.laneMaxZ),
      vec(RAMP_END_X, height, ramp.laneMinZ),
      vec(RAMP_START_X, 0, ramp.laneMinZ),
    );
    addBox(out, vec(RAMP_END_X, 0, ramp.laneMinZ), vec(RAMP_WALL_MAX_X, height + 1, ramp.laneMaxZ));
  }
};

const addDoorway = (out: LevelTriangle[]): void => {
  const half = DOORWAY_WIDTH / 2;
  addBox(
    out,
    vec(FLOOR_MIN, 0, DOORWAY_MIN_Z),
    vec(DOORWAY_CENTRE_X - half, DOORWAY_HEIGHT, DOORWAY_MAX_Z),
  );
  addBox(
    out,
    vec(DOORWAY_CENTRE_X + half, 0, DOORWAY_MIN_Z),
    vec(FLOOR_MAX, DOORWAY_HEIGHT, DOORWAY_MAX_Z),
  );
};

const addWedge = (out: LevelTriangle[]): void => {
  for (const arm of WEDGE_ARMS) {
    const theta = (arm.degrees * Math.PI) / 180;
    const endX = WEDGE_APEX.x + WEDGE_ARM_LENGTH * Math.cos(theta);
    const endZ = WEDGE_APEX.z + WEDGE_ARM_LENGTH * Math.sin(theta);
    const apexTop = vec(WEDGE_APEX.x, WEDGE_WALL_HEIGHT, WEDGE_APEX.z);
    const endBottom = vec(endX, 0, endZ);
    const endTop = vec(endX, WEDGE_WALL_HEIGHT, endZ);
    // Mirrored winding on the second arm keeps both faces looking into the opening.
    if (arm.mirrored) {
      addQuad(out, WEDGE_APEX, apexTop, endTop, endBottom);
      continue;
    }
    addQuad(out, WEDGE_APEX, endBottom, endTop, apexTop);
  }
};

const addLedge = (out: LevelTriangle[]): void => {
  addBox(out, vec(4, 0, -11), vec(10, 2, -6));
};

const addCeilings = (out: LevelTriangle[]): void => {
  // Impassable: 1.2m clearance, less than the 1.75m capsule.
  addBox(out, vec(0, 1.2, 8.5), vec(6, 1.7, 11.5));
  // Step blocker: 1.9m clearance is standable, but a 0.35m step-up is not.
  addBox(out, vec(4, 1.9, -2), vec(10, 2.4, 2));
  addBox(out, vec(6, 0, -2), vec(10, 0.3, 2));
};

export const createNastyLevel = (): NastyLevel => {
  const out: LevelTriangle[] = [];
  addFloor(out);
  addSeamPatch(out);
  addPerimeterWalls(out);
  addStaircase(out, LOW_STAIR_RISE, -11, -9);
  addStaircase(out, HIGH_STAIR_RISE, -8, -6);
  addRamps(out);
  addDoorway(out);
  addWedge(out);
  addLedge(out);
  addCeilings(out);
  return {
    triangles: out,
    bounds: { minX: FLOOR_MIN, maxX: FLOOR_MAX, minZ: FLOOR_MIN, maxZ: FLOOR_MAX },
  };
};

/**
 * Capsule foot positions (the lowest point of the capsule) for the controller's
 * property tests. `lowCeilingApproach` and its slab sit at +z rather than the
 * originally sketched (2.5, 0, 6): the sketched slab covered the 0.72m doorway,
 * which made the doorway untestable for a 1.75m capsule.
 */
export const NASTY_LEVEL_LANDMARKS = {
  /** Open floor, clear of every feature. */
  flatStart: vec(0, 0, 3.5),
  /** Drive +x to climb the 0.34m stairs. */
  lowStairsFoot: vec(-7, 0, -10),
  /** Drive +x; the 0.36m stairs must refuse. */
  highStairsFoot: vec(-7, 0, -7),
  /** Drive +x up the 44 degree ramp. */
  slope44Foot: vec(-7, 0, -3.5),
  /** Drive +x up the 46 degree ramp. */
  slope46Foot: vec(-7, 0, -1),
  /** Drive +x up the 50 degree ramp. */
  slope50Foot: vec(-7, 0, 1.5),
  /** Drive +z through the 0.72m gap. */
  doorwayApproach: vec(6, 0, 4),
  /** Drive -z into the 25 degree apex. */
  wedgeApproach: vec(-8, 0, 8),
  /** Drive +x off the 2m ledge. */
  ledgeTop: vec(7, 2, -8.5),
  /** Drive +x; blocked by the 1.2m slab. */
  lowCeilingApproach: vec(-1.5, 0, 10),
  /** Drive +x; the 0.3m step must be refused under the 1.9m ceiling. */
  ceilingStepApproach: vec(4.5, 0, 0),
  /** Fine alternating tessellation. */
  seamPatch: vec(10, 0, 10),
} satisfies Record<string, Vec3>;

/*
 * Segment/triangle closest-pair kernel.
 *
 * The sweep search below evaluates this on the order of 10^7 times per property
 * test run, so it is written in scalars and reports through module scratch
 * rather than allocating a result per evaluation. The sim is single threaded
 * and every caller consumes the scratch immediately.
 */

let scratchDistanceSq = 0;
let scratchSegmentX = 0;
let scratchSegmentY = 0;
let scratchSegmentZ = 0;
let scratchTriangleX = 0;
let scratchTriangleY = 0;
let scratchTriangleZ = 0;
let segmentStartX = 0;
let segmentStartY = 0;
let segmentStartZ = 0;
let segmentEndX = 0;
let segmentEndY = 0;
let segmentEndZ = 0;

const considerCandidate = (
  distanceSq: number,
  sx: number,
  sy: number,
  sz: number,
  tx: number,
  ty: number,
  tz: number,
): void => {
  if (distanceSq >= scratchDistanceSq) {
    return;
  }
  scratchDistanceSq = distanceSq;
  scratchSegmentX = sx;
  scratchSegmentY = sy;
  scratchSegmentZ = sz;
  scratchTriangleX = tx;
  scratchTriangleY = ty;
  scratchTriangleZ = tz;
};

/** True when `p`, assumed to lie in the triangle's plane, is inside it. `n` need not be unit. */
const projectsInsideTriangle = (
  px: number,
  py: number,
  pz: number,
  a: Vec3,
  b: Vec3,
  c: Vec3,
  nx: number,
  ny: number,
  nz: number,
): boolean => {
  const side = (from: Vec3, to: Vec3): number => {
    const ex = to.x - from.x;
    const ey = to.y - from.y;
    const ez = to.z - from.z;
    const fx = px - from.x;
    const fy = py - from.y;
    const fz = pz - from.z;
    return (ey * fz - ez * fy) * nx + (ez * fx - ex * fz) * ny + (ex * fy - ey * fx) * nz;
  };
  return side(a, b) >= 0 && side(b, c) >= 0 && side(c, a) >= 0;
};

/** Closest pair between the scratch segment and the segment `e0` -> `e1`. */
const considerEdge = (e0: Vec3, e1: Vec3): void => {
  const d1x = segmentEndX - segmentStartX;
  const d1y = segmentEndY - segmentStartY;
  const d1z = segmentEndZ - segmentStartZ;
  const d2x = e1.x - e0.x;
  const d2y = e1.y - e0.y;
  const d2z = e1.z - e0.z;
  const rx = segmentStartX - e0.x;
  const ry = segmentStartY - e0.y;
  const rz = segmentStartZ - e0.z;
  const a = d1x * d1x + d1y * d1y + d1z * d1z;
  const e = d2x * d2x + d2y * d2y + d2z * d2z;
  const f = d2x * rx + d2y * ry + d2z * rz;

  let s = 0;
  let t = 0;
  if (a <= DEGENERATE_EPSILON && e <= DEGENERATE_EPSILON) {
    s = 0;
    t = 0;
  } else if (a <= DEGENERATE_EPSILON) {
    t = clamp(f / e, 0, 1);
  } else {
    const c = d1x * rx + d1y * ry + d1z * rz;
    if (e <= DEGENERATE_EPSILON) {
      s = clamp(-c / a, 0, 1);
    } else {
      const b = d1x * d2x + d1y * d2y + d1z * d2z;
      const denominator = a * e - b * b;
      s = denominator > 0 ? clamp((b * f - c * e) / denominator, 0, 1) : 0;
      t = (b * s + f) / e;
      if (t < 0) {
        t = 0;
        s = clamp(-c / a, 0, 1);
      } else if (t > 1) {
        t = 1;
        s = clamp((b - c) / a, 0, 1);
      }
    }
  }

  const sx = segmentStartX + d1x * s;
  const sy = segmentStartY + d1y * s;
  const sz = segmentStartZ + d1z * s;
  const tx = e0.x + d2x * t;
  const ty = e0.y + d2y * t;
  const tz = e0.z + d2z * t;
  const dx = sx - tx;
  const dy = sy - ty;
  const dz = sz - tz;
  considerCandidate(dx * dx + dy * dy + dz * dz, sx, sy, sz, tx, ty, tz);
};

/**
 * Distance from segment `p`->`q` to triangle `a,b,c`, leaving the closest pair
 * in module scratch. The minimum is attained either where the segment crosses
 * the face, at a segment endpoint projected into the face, or between the
 * segment and one of the three edges (which also covers the vertices).
 */
const solveClosestSegmentTriangle = (
  px: number,
  py: number,
  pz: number,
  qx: number,
  qy: number,
  qz: number,
  a: Vec3,
  b: Vec3,
  c: Vec3,
): number => {
  segmentStartX = px;
  segmentStartY = py;
  segmentStartZ = pz;
  segmentEndX = qx;
  segmentEndY = qy;
  segmentEndZ = qz;
  scratchDistanceSq = Number.POSITIVE_INFINITY;

  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const abz = b.z - a.z;
  const acx = c.x - a.x;
  const acy = c.y - a.y;
  const acz = c.z - a.z;
  const nx = aby * acz - abz * acy;
  const ny = abz * acx - abx * acz;
  const nz = abx * acy - aby * acx;
  const nLengthSq = nx * nx + ny * ny + nz * nz;

  if (nLengthSq > 0) {
    const inverse = 1 / Math.sqrt(nLengthSq);
    const ux = nx * inverse;
    const uy = ny * inverse;
    const uz = nz * inverse;
    const dp = (px - a.x) * ux + (py - a.y) * uy + (pz - a.z) * uz;
    const dq = (qx - a.x) * ux + (qy - a.y) * uy + (qz - a.z) * uz;

    if (dp * dq < 0) {
      const crossing = dp / (dp - dq);
      const ix = px + (qx - px) * crossing;
      const iy = py + (qy - py) * crossing;
      const iz = pz + (qz - pz) * crossing;
      if (projectsInsideTriangle(ix, iy, iz, a, b, c, nx, ny, nz)) {
        considerCandidate(0, ix, iy, iz, ix, iy, iz);
        return 0;
      }
    }

    const startX = px - ux * dp;
    const startY = py - uy * dp;
    const startZ = pz - uz * dp;
    if (projectsInsideTriangle(startX, startY, startZ, a, b, c, nx, ny, nz)) {
      considerCandidate(dp * dp, px, py, pz, startX, startY, startZ);
    }

    const endX = qx - ux * dq;
    const endY = qy - uy * dq;
    const endZ = qz - uz * dq;
    if (projectsInsideTriangle(endX, endY, endZ, a, b, c, nx, ny, nz)) {
      considerCandidate(dq * dq, qx, qy, qz, endX, endY, endZ);
    }
  }

  considerEdge(a, b);
  considerEdge(b, c);
  considerEdge(c, a);
  return Math.sqrt(scratchDistanceSq);
};

/** Allocating wrapper around the kernel, for tests and one-off queries. */
export const closestSegmentTriangle = (
  start: Vec3,
  end: Vec3,
  triangle: LevelTriangle,
): ClosestPair => {
  const distance = solveClosestSegmentTriangle(
    start.x,
    start.y,
    start.z,
    end.x,
    end.y,
    end.z,
    triangle.a,
    triangle.b,
    triangle.c,
  );
  return {
    distance,
    onSegment: vec(scratchSegmentX, scratchSegmentY, scratchSegmentZ),
    onTriangle: vec(scratchTriangleX, scratchTriangleY, scratchTriangleZ),
  };
};

/**
 * Minimum distance from the capsule's segment to any triangle in the level.
 * Used by property tests to assert non-penetration: a capsule of radius `r` is
 * clear exactly while this is >= `r`.
 */
export const closestDistanceToLevel = (level: NastyLevel, capsule: Capsule): number => {
  const segmentMinX = Math.min(capsule.start.x, capsule.end.x);
  const segmentMaxX = Math.max(capsule.start.x, capsule.end.x);
  const segmentMinY = Math.min(capsule.start.y, capsule.end.y);
  const segmentMaxY = Math.max(capsule.start.y, capsule.end.y);
  const segmentMinZ = Math.min(capsule.start.z, capsule.end.z);
  const segmentMaxZ = Math.max(capsule.start.z, capsule.end.z);

  let best = Number.POSITIVE_INFINITY;
  for (const triangle of level.triangles) {
    // Box gap is a lower bound on the true distance, so this reject is exact.
    const gapX = axisGap(
      Math.min(triangle.a.x, triangle.b.x, triangle.c.x),
      Math.max(triangle.a.x, triangle.b.x, triangle.c.x),
      segmentMinX,
      segmentMaxX,
    );
    const gapY = axisGap(
      Math.min(triangle.a.y, triangle.b.y, triangle.c.y),
      Math.max(triangle.a.y, triangle.b.y, triangle.c.y),
      segmentMinY,
      segmentMaxY,
    );
    const gapZ = axisGap(
      Math.min(triangle.a.z, triangle.b.z, triangle.c.z),
      Math.max(triangle.a.z, triangle.b.z, triangle.c.z),
      segmentMinZ,
      segmentMaxZ,
    );
    if (gapX * gapX + gapY * gapY + gapZ * gapZ >= best * best) {
      continue;
    }

    const distance = solveClosestSegmentTriangle(
      capsule.start.x,
      capsule.start.y,
      capsule.start.z,
      capsule.end.x,
      capsule.end.y,
      capsule.end.z,
      triangle.a,
      triangle.b,
      triangle.c,
    );
    if (distance < best) {
      best = distance;
    }
  }
  return best;
};

const axisGap = (minA: number, maxA: number, minB: number, maxB: number): number => {
  if (minA > maxB) {
    return minA - maxB;
  }
  if (minB > maxA) {
    return minB - maxA;
  }
  return 0;
};

interface TriangleEntry {
  readonly triangle: LevelTriangle;
  readonly minX: number;
  readonly minY: number;
  readonly minZ: number;
  readonly maxX: number;
  readonly maxY: number;
  readonly maxZ: number;
}

interface Bounds {
  readonly minX: number;
  readonly minY: number;
  readonly minZ: number;
  readonly maxX: number;
  readonly maxY: number;
  readonly maxZ: number;
}

const toEntry = (triangle: LevelTriangle): TriangleEntry => ({
  triangle,
  minX: Math.min(triangle.a.x, triangle.b.x, triangle.c.x),
  minY: Math.min(triangle.a.y, triangle.b.y, triangle.c.y),
  minZ: Math.min(triangle.a.z, triangle.b.z, triangle.c.z),
  maxX: Math.max(triangle.a.x, triangle.b.x, triangle.c.x),
  maxY: Math.max(triangle.a.y, triangle.b.y, triangle.c.y),
  maxZ: Math.max(triangle.a.z, triangle.b.z, triangle.c.z),
});

const makeSweptBounds = (capsule: Capsule, displacement: Vec3): Bounds => {
  const corners = [
    capsule.start,
    capsule.end,
    add(capsule.start, displacement),
    add(capsule.end, displacement),
  ];
  const padding = capsule.radius + CONTACT_EPSILON;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;
  for (const corner of corners) {
    minX = Math.min(minX, corner.x);
    minY = Math.min(minY, corner.y);
    minZ = Math.min(minZ, corner.z);
    maxX = Math.max(maxX, corner.x);
    maxY = Math.max(maxY, corner.y);
    maxZ = Math.max(maxZ, corner.z);
  }
  return {
    minX: minX - padding,
    minY: minY - padding,
    minZ: minZ - padding,
    maxX: maxX + padding,
    maxY: maxY + padding,
    maxZ: maxZ + padding,
  };
};

const overlaps = (entry: TriangleEntry, bounds: Bounds): boolean =>
  entry.minX <= bounds.maxX &&
  entry.maxX >= bounds.minX &&
  entry.minY <= bounds.maxY &&
  entry.maxY >= bounds.minY &&
  entry.minZ <= bounds.maxZ &&
  entry.maxZ >= bounds.minZ;

const triangleNormal = (triangle: LevelTriangle): Vec3 =>
  normalize(cross(sub(triangle.b, triangle.a), sub(triangle.c, triangle.a)));

/** Möller–Trumbore, double sided. Returns the hit distance, or -1 for a miss. */
const intersectTriangle = (
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  maxDistance: number,
  triangle: LevelTriangle,
): number => {
  const { a, b, c } = triangle;
  const e1x = b.x - a.x;
  const e1y = b.y - a.y;
  const e1z = b.z - a.z;
  const e2x = c.x - a.x;
  const e2y = c.y - a.y;
  const e2z = c.z - a.z;
  const hx = dy * e2z - dz * e2y;
  const hy = dz * e2x - dx * e2z;
  const hz = dx * e2y - dy * e2x;
  const determinant = e1x * hx + e1y * hy + e1z * hz;
  if (determinant > -DEGENERATE_EPSILON && determinant < DEGENERATE_EPSILON) {
    return -1;
  }

  const inverse = 1 / determinant;
  const sx = ox - a.x;
  const sy = oy - a.y;
  const sz = oz - a.z;
  const u = (sx * hx + sy * hy + sz * hz) * inverse;
  if (u < 0 || u > 1) {
    return -1;
  }

  const qx = sy * e1z - sz * e1y;
  const qy = sz * e1x - sx * e1z;
  const qz = sx * e1y - sy * e1x;
  const v = (dx * qx + dy * qy + dz * qz) * inverse;
  if (v < 0 || u + v > 1) {
    return -1;
  }

  const distance = (e2x * qx + e2y * qy + e2z * qz) * inverse;
  return distance < 0 || distance > maxDistance ? -1 : distance;
};

/**
 * Contact hit for one triangle. Reads the kernel scratch, so it must be called
 * immediately after the `distanceAt` evaluation it describes.
 */
const makeTriangleHit = (
  triangle: LevelTriangle,
  displacement: Vec3,
  fraction: number,
): CapsuleSweepHit => {
  const onTriangle = vec(scratchTriangleX, scratchTriangleY, scratchTriangleZ);
  const onSegment = vec(scratchSegmentX, scratchSegmentY, scratchSegmentZ);
  const offset = sub(onSegment, onTriangle);
  const normal =
    lengthSq(offset) > CONTACT_EPSILON * CONTACT_EPSILON
      ? normalize(offset)
      : flipToOppose(triangleNormal(triangle), displacement);
  return {
    fraction,
    point: withoutNegativeZeros(onTriangle),
    normal: withoutNegativeZeros(normal),
    triangleIndex: triangle.index,
  };
};

const flipToOppose = (normal: Vec3, direction: Vec3): Vec3 =>
  dot(normal, direction) > 0 ? scale(normal, -1) : normal;

/**
 * `d(fraction)` is convex in `fraction` (both shapes convex, the translation
 * linear), so the minimum can be ternary searched and the first contact
 * bisected below it.
 */
const sweepTriangle = (
  triangle: LevelTriangle,
  capsule: Capsule,
  displacement: Vec3,
): CapsuleSweepHit | null => {
  const distanceAt = (fraction: number): number =>
    solveClosestSegmentTriangle(
      capsule.start.x + displacement.x * fraction,
      capsule.start.y + displacement.y * fraction,
      capsule.start.z + displacement.z * fraction,
      capsule.end.x + displacement.x * fraction,
      capsule.end.y + displacement.y * fraction,
      capsule.end.z + displacement.z * fraction,
      triangle.a,
      triangle.b,
      triangle.c,
    );

  if (distanceAt(0) <= capsule.radius) {
    return makeTriangleHit(triangle, displacement, 0);
  }

  const minimumFraction = findMinimumDistanceFraction(distanceAt);
  const minimumDistance = distanceAt(minimumFraction);
  if (minimumDistance > capsule.radius + CONTACT_EPSILON) {
    return null;
  }

  const contactFraction =
    minimumDistance >= capsule.radius
      ? minimumFraction
      : refineContact(distanceAt, capsule.radius, minimumFraction);
  distanceAt(contactFraction);
  return makeTriangleHit(triangle, displacement, contactFraction);
};

const findMinimumDistanceFraction = (distanceAt: (fraction: number) => number): number => {
  let lower = 0;
  let upper = 1;

  for (let step = 0; step < MINIMUM_STEPS; step += 1) {
    const third = (upper - lower) / 3;
    const left = lower + third;
    const right = upper - third;
    if (distanceAt(left) <= distanceAt(right)) {
      upper = right;
    } else {
      lower = left;
    }
  }

  const middle = (lower + upper) * 0.5;
  return distanceAt(1) < distanceAt(middle) ? 1 : middle;
};

const refineContact = (
  distanceAt: (fraction: number) => number,
  radius: number,
  collidingFraction: number,
): number => {
  let lower = 0;
  let upper = collidingFraction;

  for (let step = 0; step < REFINEMENT_STEPS; step += 1) {
    const middle = (lower + upper) * 0.5;
    if (distanceAt(middle) <= radius) {
      upper = middle;
    } else {
      lower = middle;
    }
  }

  return upper;
};

const isEarlier = (candidate: CapsuleSweepHit, current: CapsuleSweepHit | null): boolean => {
  if (current === null) {
    return true;
  }

  const difference = candidate.fraction - current.fraction;
  return (
    difference < -FRACTION_TIE_EPSILON ||
    (Math.abs(difference) <= FRACTION_TIE_EPSILON && candidate.triangleIndex < current.triangleIndex)
  );
};

const withoutNegativeZeros = (value: Vec3): Vec3 =>
  vec(value.x === 0 ? 0 : value.x, value.y === 0 ? 0 : value.y, value.z === 0 ? 0 : value.z);

const assertVec3 = (value: Vec3, label: string): void => {
  if (![value.x, value.y, value.z].every(Number.isFinite)) {
    throw new RangeError(`${label} must contain finite components`);
  }
};

const assertNonNegative = (value: number, label: string): void => {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} must be finite and non-negative`);
  }
};

/**
 * Reference `CollisionQueries` over the raw triangle list. Triangles are scanned
 * in ascending index order and rejected by AABB before the expensive search, so
 * ties resolve to the lower index without extra bookkeeping.
 */
export class BruteForceQueries implements CollisionQueries {
  readonly #entries: readonly TriangleEntry[];

  public constructor(level: NastyLevel) {
    this.#entries = level.triangles.map(toEntry);
  }

  public raycast(query: RaycastQuery): RaycastHit | null {
    assertVec3(query.origin, "ray origin");
    assertVec3(query.direction, "ray direction");
    assertNonNegative(query.maxDistance, "ray maxDistance");
    if (lengthSq(query.direction) === 0) {
      throw new RangeError("ray direction must be non-zero");
    }

    const direction = normalize(query.direction);
    let bestDistance = Number.POSITIVE_INFINITY;
    let bestTriangle: LevelTriangle | null = null;
    for (const entry of this.#entries) {
      const distance = intersectTriangle(
        query.origin.x,
        query.origin.y,
        query.origin.z,
        direction.x,
        direction.y,
        direction.z,
        query.maxDistance,
        entry.triangle,
      );
      if (distance >= 0 && distance < bestDistance) {
        bestDistance = distance;
        bestTriangle = entry.triangle;
      }
    }

    if (bestTriangle === null) {
      return null;
    }

    return {
      distance: bestDistance,
      point: withoutNegativeZeros(addScaled(query.origin, direction, bestDistance)),
      normal: withoutNegativeZeros(flipToOppose(triangleNormal(bestTriangle), direction)),
      triangleIndex: bestTriangle.index,
    };
  }

  public sweepCapsule(query: CapsuleSweepQuery): CapsuleSweepHit | null {
    assertVec3(query.capsule.start, "capsule start");
    assertVec3(query.capsule.end, "capsule end");
    assertNonNegative(query.capsule.radius, "capsule radius");
    assertVec3(query.displacement, "capsule displacement");

    const bounds = makeSweptBounds(query.capsule, query.displacement);
    let earliest: CapsuleSweepHit | null = null;
    for (const entry of this.#entries) {
      if (!overlaps(entry, bounds)) {
        continue;
      }
      const candidate = sweepTriangle(entry.triangle, query.capsule, query.displacement);
      if (candidate !== null && isEarlier(candidate, earliest)) {
        earliest = candidate;
      }
    }
    return earliest;
  }

  public probeGround(query: GroundProbeQuery): GroundProbeHit | null {
    assertNonNegative(query.maxDistance, "ground probe maxDistance");

    const hit = this.sweepCapsule({
      capsule: query.capsule,
      displacement: vec(0, -query.maxDistance, 0),
    });
    if (hit === null) {
      return null;
    }

    return {
      distance: hit.fraction * query.maxDistance,
      point: hit.point,
      normal: hit.normal,
      triangleIndex: hit.triangleIndex,
    };
  }
}
