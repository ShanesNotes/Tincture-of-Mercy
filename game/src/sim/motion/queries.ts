import type {
  CapsuleSweepHit,
  CapsuleSweepQuery,
  CollisionQueries,
  RaycastHit,
  RaycastQuery,
} from "./types";

/**
 * The static-world adapter the view supplies (`MeshBvhCollisionWorld` in
 * `src/view/collision.ts`) offers raycast and capsule sweep but no ground
 * probe. This is the seam that completes it, so composition needs no glue and
 * the sim still never names the view.
 */
export interface SweptWorld {
  raycast(query: RaycastQuery): RaycastHit | null;
  sweepCapsule(query: CapsuleSweepQuery): CapsuleSweepHit | null;
}

export const withDerivedGroundProbe = (world: SweptWorld): CollisionQueries => ({
  raycast: (query) => world.raycast(query),
  sweepCapsule: (query) => world.sweepCapsule(query),
  probeGround: (query) => {
    if (!Number.isFinite(query.maxDistance) || query.maxDistance < 0) {
      throw new RangeError("ground probe maxDistance must be finite and non-negative");
    }
    const hit = world.sweepCapsule({
      capsule: query.capsule,
      displacement: { x: 0, y: -query.maxDistance, z: 0 },
    });
    return hit === null
      ? null
      : {
          distance: hit.fraction * query.maxDistance,
          point: hit.point,
          normal: hit.normal,
          triangleIndex: hit.triangleIndex,
        };
  },
});
