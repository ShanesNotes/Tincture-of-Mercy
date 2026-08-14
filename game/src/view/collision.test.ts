import { BufferGeometry, Float32BufferAttribute } from "three";
import { MeshBVH } from "three-mesh-bvh";
import { describe, expect, it } from "vitest";

import { MeshBvhCollisionWorld } from "./collision";

const WALL_TRIANGLES = [
  0, -2, -2, 0, 2, -2, 0, 2, 2,
  0, -2, -2, 0, 2, 2, 0, -2, 2,
] as const;

function makeWorld(positions: readonly number[] = WALL_TRIANGLES): MeshBvhCollisionWorld {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));

  return new MeshBvhCollisionWorld(new MeshBVH(geometry, { indirect: true }));
}

describe("MeshBvhCollisionWorld", () => {
  it("returns the nearest ray hit as plain data", () => {
    const hit = makeWorld().raycast({
      origin: { x: -2, y: 0, z: 0 },
      direction: { x: 2, y: 0, z: 0 },
      maxDistance: 4,
    });

    expect(hit).toEqual({
      distance: 2,
      point: { x: 0, y: 0, z: 0 },
      normal: { x: -1, y: 0, z: 0 },
      triangleIndex: 0,
    });
  });

  it("sweeps through a thin wall even when both endpoints are clear", () => {
    const hit = makeWorld().sweepCapsule({
      capsule: {
        start: { x: -2, y: -0.5, z: 0 },
        end: { x: -2, y: 0.5, z: 0 },
        radius: 0.25,
      },
      displacement: { x: 4, y: 0, z: 0 },
    });

    expect(hit).not.toBeNull();
    expect(hit?.fraction).toBeCloseTo(0.4375, 5);
    expect(hit?.point.x).toBeCloseTo(0, 8);
    expect(hit?.point.y).toBeGreaterThanOrEqual(-0.5);
    expect(hit?.point.y).toBeLessThanOrEqual(0.5);
    expect(hit?.point.z).toBeCloseTo(0, 8);
    expect(hit?.normal.x).toBeCloseTo(-1, 8);
    expect(hit?.normal.y).toBeCloseTo(0, 8);
    expect(hit?.normal.z).toBeCloseTo(0, 8);
  });

  it("uses the lowest triangle index to break equal-time ties", () => {
    const rootThree = Math.sqrt(3);
    const tiltedPlaneY = rootThree / 16;
    const equalTimePlanes = [
      0, -4, -4, 0, 4, -4, 0, 0, 4,
      0.0625 + 2 * rootThree, tiltedPlaneY - 2, -4,
      0.0625 - 2 * rootThree, tiltedPlaneY + 2, -4,
      0.0625, tiltedPlaneY, 4,
    ];
    const hit = makeWorld(equalTimePlanes).sweepCapsule({
      capsule: {
        start: { x: -2, y: 0, z: 0 },
        end: { x: -2, y: 0, z: 0 },
        radius: 0.25,
      },
      displacement: { x: 4, y: 0, z: 0 },
    });

    expect(hit?.triangleIndex).toBe(0);
  });

  it("detects a grazing edge contact without relying on discrete poses", () => {
    const world = makeWorld([
      0, 0, -2, 0, 0, 2, 0, 2, 0,
    ]);
    const hit = world.sweepCapsule({
      capsule: {
        start: { x: -2, y: -0.249, z: 0 },
        end: { x: -2, y: -0.249, z: 0 },
        radius: 0.25,
      },
      displacement: { x: 4, y: 0, z: 0 },
    });

    expect(hit).not.toBeNull();
    expect(hit?.fraction).toBeGreaterThan(0.49);
    expect(hit?.fraction).toBeLessThan(0.5);

    const tangentHit = world.sweepCapsule({
      capsule: {
        start: { x: -2, y: -0.25, z: 0 },
        end: { x: -2, y: -0.25, z: 0 },
        radius: 0.25,
      },
      displacement: { x: 4, y: 0, z: 0 },
    });
    expect(tangentHit?.fraction).toBeCloseTo(0.5, 6);
  });
});
