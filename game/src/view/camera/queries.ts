import type { AttendCollisionQueries } from "../../sim/attend";
import type { CollisionWorld } from "../collision";
import { clamp, subtract, type Vec3 } from "./math";
import type { CameraLineOfSight, CameraProbe } from "./state";

/** Keeps a probe or line-of-sight ray from hitting the surface it starts on. */
const RAY_EPSILON_METERS = 1e-3;

/** Adapts the static-world BVH to the plain-data raycast Attend injects. */
export const createAttendCollisionQueries = (world: CollisionWorld): AttendCollisionQueries => ({
  raycast: (query) =>
    world.raycast({
      origin: query.origin,
      direction: query.direction,
      maxDistance: query.maxDistance,
    }),
});

/**
 * Sphere-cast from the pivot toward the desired camera position; returns the
 * fraction of the segment the camera may travel before touching geometry.
 */
export const createCameraProbe = (world: CollisionWorld): CameraProbe => {
  return (from: Vec3, to: Vec3, radiusMeters: number): number => {
    const displacement = subtract(to, from);
    const hit = world.sweepCapsule({
      capsule: { start: from, end: from, radius: radiusMeters },
      displacement,
    });
    return hit === null ? 1 : clamp(hit.fraction, 0, 1);
  };
};

/** Camera-side occlusion test: is the attend target visible from the lens? */
export const createCameraLineOfSight = (world: CollisionWorld): CameraLineOfSight => {
  return (from: Vec3, to: Vec3): boolean => {
    const delta = subtract(to, from);
    const distance = Math.hypot(delta.x, delta.y, delta.z);
    if (distance <= RAY_EPSILON_METERS) {
      return true;
    }
    return (
      world.raycast({
        origin: from,
        direction: delta,
        maxDistance: distance - RAY_EPSILON_METERS,
      }) === null
    );
  };
};
