/**
 * K1 / D8 — production ground-probe vs 45° slopes.
 *
 * The view adapter used to answer probeGround with a downward ray minus
 * radius. On a 45° face that leaves the capsule embedded:
 *   (radius + skin) * cos(45°) - radius ≈ −0.088
 * Sweep semantics (sim/motion/queries.ts) rest at one skin of vertical
 * clearance. This file drives that adapter with MeshBvhCollisionWorld — the
 * same class load.ts uses on the baked Ironwood mesh.
 */

import { readFileSync } from "node:fs";

import { BufferGeometry, Float32BufferAttribute } from "three";
import { MeshBVH } from "three-mesh-bvh";
import { describe, expect, it } from "vitest";

import {
  capsuleAtFoot,
  parseMotionParams,
  spawnMotionState,
  stepMotion,
  type CollisionQueries,
  type MotionInput,
  type MotionParams,
  type Vec3,
} from "../../sim/motion";
import { MeshBvhCollisionWorld } from "../collision";
import { createProductionCollisionQueries } from "./load";

const params: MotionParams = parseMotionParams(
  JSON.parse(readFileSync(new URL("../../data/motion_params.json", import.meta.url), "utf8")),
);

const idle: MotionInput = { moveX: 0, moveZ: 0, sprint: false, jump: false };

interface CollisionDocument {
  readonly triangles: readonly (readonly [number, number, number])[];
  readonly vertices: readonly (readonly [number, number, number])[];
}

const quantize = (value: number): number => Math.round(value * 1000) / 1000;

const geometryFrom = (
  vertices: readonly (readonly [number, number, number])[],
  triangles: readonly (readonly [number, number, number])[],
): BufferGeometry => {
  const positions: number[] = [];
  const indices: number[] = [];
  for (const vertex of vertices) positions.push(vertex[0], vertex[1], vertex[2]);
  for (const triangle of triangles) indices.push(triangle[0], triangle[1], triangle[2]);
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  return geometry;
};

/** 45° ramp, vertices quantized to 1 mm (D8). Plane is y = x. */
const ramp45Geometry = (): BufferGeometry =>
  geometryFrom(
    [
      [quantize(0), quantize(0), quantize(-1)],
      [quantize(4), quantize(4), quantize(1)],
      [quantize(4), quantize(4), quantize(-1)],
      [quantize(0), quantize(0), quantize(1)],
    ],
    [
      [0, 1, 2],
      [0, 3, 1],
    ],
  );

const bakedIronwoodGeometry = (): BufferGeometry => {
  const vertices: number[] = [];
  const indices: number[] = [];
  for (const zone of ["arena", "cabin", "forest", "road", "road_coda", "woodline", "yard"]) {
    const collision = JSON.parse(
      readFileSync(new URL(`../../../assets/build/levels/${zone}.collision.json`, import.meta.url), "utf8"),
    ) as CollisionDocument;
    const offset = vertices.length / 3;
    for (const vertex of collision.vertices) vertices.push(...vertex);
    for (const triangle of collision.triangles) {
      indices.push(triangle[0] + offset, triangle[1] + offset, triangle[2] + offset);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  return geometry;
};

const queriesFor = (geometry: BufferGeometry): CollisionQueries =>
  createProductionCollisionQueries(new MeshBvhCollisionWorld(new MeshBVH(geometry)));

const signedClearance = (position: Vec3, planePoint: Vec3, normal: Vec3): number => {
  const start = capsuleAtFoot(position, params).start;
  const along =
    (start.x - planePoint.x) * normal.x +
    (start.y - planePoint.y) * normal.y +
    (start.z - planePoint.z) * normal.z;
  return along - params.capsule.radius;
};

const idleOn = (queries: CollisionQueries, spawn: Vec3, ticks: number) => {
  let state = spawnMotionState(queries, params, spawn, 0, 100, 6);
  for (let tick = 0; tick < ticks; tick += 1) {
    state = stepMotion(state, idle, queries, params).state;
  }
  return state;
};

describe("production probeGround (D8 45°)", () => {
  it("slope_tick_repro: idle rest on a 45° face reads +skin, not −0.088 embed", () => {
    const geometry = ramp45Geometry();
    const queries = queriesFor(geometry);
    const state = idleOn(queries, { x: 2, y: 3, z: 0 }, 45);

    const hit = queries.probeGround({
      capsule: capsuleAtFoot(state.position, params),
      maxDistance: params.collision.groundSnapMeters + params.capsule.skin,
    });
    expect(state.grounded).toBe(true);
    expect(hit).not.toBeNull();
    expect(hit?.distance).toBeCloseTo(params.capsule.skin, 5);

    const invSqrt2 = 1 / Math.SQRT2;
    const clearance = signedClearance(
      state.position,
      { x: 0, y: 0, z: 0 },
      { x: -invSqrt2, y: invSqrt2, z: 0 },
    );
    // Finder repro on the raycast adapter: (r+skin)cos45 − r ≈ −0.088.
    // Sweep rest must not penetrate the plane.
    expect(clearance).toBeGreaterThan(0);
    expect(clearance).toBeCloseTo(params.capsule.skin * invSqrt2, 4);

    const exactSkin = queries.probeGround({
      capsule: capsuleAtFoot(state.position, params),
      maxDistance: params.capsule.skin,
    });
    expect(exactSkin).not.toBeNull();
    expect(exactSkin?.distance).toBeCloseTo(params.capsule.skin, 5);

    geometry.dispose();
  });

  it("bakes the same adapter over Ironwood collision and rests at +skin on the yard floor", () => {
    const geometry = bakedIronwoodGeometry();
    const queries = queriesFor(geometry);
    const state = idleOn(queries, { x: 0, y: 2, z: 0 }, 30);
    const hit = queries.probeGround({
      capsule: capsuleAtFoot(state.position, params),
      maxDistance: params.collision.groundSnapMeters + params.capsule.skin,
    });
    expect(state.grounded).toBe(true);
    expect(hit).not.toBeNull();
    expect(hit?.distance).toBeCloseTo(params.capsule.skin, 4);
    geometry.dispose();
  });
});
