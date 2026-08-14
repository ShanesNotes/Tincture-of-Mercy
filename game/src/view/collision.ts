import { Box3, DoubleSide, Line3, Ray, Vector3 } from "three";
import { type ExtendedTriangle, MeshBVH } from "three-mesh-bvh";

export interface Vec3Dto {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface RaycastQuery {
  readonly origin: Vec3Dto;
  readonly direction: Vec3Dto;
  readonly maxDistance: number;
}

export interface RaycastHit {
  readonly distance: number;
  readonly point: Vec3Dto;
  readonly normal: Vec3Dto;
  readonly triangleIndex: number;
}

export interface CapsuleDto {
  readonly start: Vec3Dto;
  readonly end: Vec3Dto;
  readonly radius: number;
}

export interface CapsuleSweepQuery {
  readonly capsule: CapsuleDto;
  readonly displacement: Vec3Dto;
}

export interface CapsuleSweepHit {
  readonly fraction: number;
  readonly point: Vec3Dto;
  readonly normal: Vec3Dto;
  readonly triangleIndex: number;
}

export interface CollisionWorld {
  raycast(query: RaycastQuery): RaycastHit | null;
  sweepCapsule(query: CapsuleSweepQuery): CapsuleSweepHit | null;
}

const CONTACT_EPSILON = 1e-7;
const FRACTION_TIE_EPSILON = 1e-9;
const MINIMUM_STEPS = 56;
const REFINEMENT_STEPS = 48;

interface TriangleSweepHit {
  readonly fraction: number;
  readonly point: Vector3;
  readonly normal: Vector3;
  readonly triangleIndex: number;
}

export class MeshBvhCollisionWorld implements CollisionWorld {
  readonly #bvh: MeshBVH;

  constructor(bvh: MeshBVH) {
    this.#bvh = bvh;
  }

  raycast(query: RaycastQuery): RaycastHit | null {
    assertVec3(query.origin, "ray origin");
    assertVec3(query.direction, "ray direction");
    assertNonNegative(query.maxDistance, "ray maxDistance");

    const direction = fromDto(query.direction);
    if (direction.lengthSq() === 0) {
      throw new RangeError("ray direction must be non-zero");
    }
    direction.normalize();

    const hit = this.#bvh.raycastFirst(
      new Ray(fromDto(query.origin), direction),
      DoubleSide,
      0,
      query.maxDistance,
    );
    if (hit === null) {
      return null;
    }

    const normal = hit.face?.normal.clone() ?? direction.clone().negate();
    if (normal.dot(direction) > 0) {
      normal.negate();
    }

    return {
      distance: hit.distance,
      point: toDto(hit.point),
      normal: toDto(normal),
      triangleIndex: hit.faceIndex ?? -1,
    };
  }

  sweepCapsule(query: CapsuleSweepQuery): CapsuleSweepHit | null {
    assertVec3(query.capsule.start, "capsule start");
    assertVec3(query.capsule.end, "capsule end");
    assertNonNegative(query.capsule.radius, "capsule radius");
    assertVec3(query.displacement, "capsule displacement");

    const start = fromDto(query.capsule.start);
    const end = fromDto(query.capsule.end);
    const displacement = fromDto(query.displacement);
    const sweptBounds = makeSweptBounds(start, end, displacement, query.capsule.radius);
    let earliest: TriangleSweepHit | null = null;

    this.#bvh.shapecast({
      intersectsBounds: (bounds) => bounds.intersectsBox(sweptBounds),
      intersectsTriangle: (triangle, triangleIndex) => {
        const candidate = sweepTriangle(
          triangle,
          triangleIndex,
          start,
          end,
          query.capsule.radius,
          displacement,
        );
        if (candidate !== null && isEarlier(candidate, earliest)) {
          earliest = candidate;
        }
        return false;
      },
    });

    if (earliest === null) {
      return null;
    }

    const hit: TriangleSweepHit = earliest;
    return {
      fraction: hit.fraction,
      point: toDto(hit.point),
      normal: toDto(hit.normal),
      triangleIndex: hit.triangleIndex,
    };
  }
}

function sweepTriangle(
  triangle: ExtendedTriangle,
  triangleIndex: number,
  start: Vector3,
  end: Vector3,
  radius: number,
  displacement: Vector3,
): TriangleSweepHit | null {
  const segment = new Line3();
  const trianglePoint = new Vector3();
  const capsulePoint = new Vector3();
  const distanceAt = (fraction: number): number => {
    setSegmentAtFraction(segment, start, end, displacement, fraction);
    return triangle.closestPointToSegment(segment, trianglePoint, capsulePoint);
  };

  if (distanceAt(0) <= radius) {
    return makeTriangleHit(
      triangle,
      triangleIndex,
      trianglePoint,
      capsulePoint,
      displacement,
      0,
    );
  }

  const minimumFraction = findMinimumDistanceFraction(distanceAt);
  const minimumDistance = distanceAt(minimumFraction);
  if (minimumDistance > radius + CONTACT_EPSILON) {
    return null;
  }

  const contactFraction =
    minimumDistance >= radius
      ? minimumFraction
      : refineContact(distanceAt, radius, minimumFraction);
  distanceAt(contactFraction);
  return makeTriangleHit(
    triangle,
    triangleIndex,
    trianglePoint,
    capsulePoint,
    displacement,
    contactFraction,
  );
}

function findMinimumDistanceFraction(distanceAt: (fraction: number) => number): number {
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
}

function refineContact(
  distanceAt: (fraction: number) => number,
  radius: number,
  collidingFraction: number,
): number {
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
}

function makeTriangleHit(
  triangle: ExtendedTriangle,
  triangleIndex: number,
  trianglePoint: Vector3,
  capsulePoint: Vector3,
  displacement: Vector3,
  fraction: number,
): TriangleSweepHit {
  return {
    fraction,
    point: trianglePoint.clone(),
    normal: contactNormal(triangle, trianglePoint, capsulePoint, displacement),
    triangleIndex,
  };
}

function setSegmentAtFraction(
  target: Line3,
  start: Vector3,
  end: Vector3,
  displacement: Vector3,
  fraction: number,
): void {
  target.start.copy(start).addScaledVector(displacement, fraction);
  target.end.copy(end).addScaledVector(displacement, fraction);
}

function contactNormal(
  triangle: ExtendedTriangle,
  trianglePoint: Vector3,
  capsulePoint: Vector3,
  displacement: Vector3,
): Vector3 {
  const normal = capsulePoint.clone().sub(trianglePoint);
  if (normal.lengthSq() > CONTACT_EPSILON * CONTACT_EPSILON) {
    return normal.normalize();
  }

  triangle.getNormal(normal);
  if (normal.dot(displacement) > 0) {
    normal.negate();
  }
  return normal;
}

function makeSweptBounds(
  start: Vector3,
  end: Vector3,
  displacement: Vector3,
  radius: number,
): Box3 {
  const movedStart = start.clone().add(displacement);
  const movedEnd = end.clone().add(displacement);
  return new Box3()
    .setFromPoints([start, end, movedStart, movedEnd])
    .expandByScalar(radius + CONTACT_EPSILON);
}

function isEarlier(candidate: TriangleSweepHit, current: TriangleSweepHit | null): boolean {
  if (current === null) {
    return true;
  }

  const difference = candidate.fraction - current.fraction;
  return (
    difference < -FRACTION_TIE_EPSILON ||
    (Math.abs(difference) <= FRACTION_TIE_EPSILON &&
      candidate.triangleIndex < current.triangleIndex)
  );
}

function fromDto(value: Vec3Dto): Vector3 {
  return new Vector3(value.x, value.y, value.z);
}

function toDto(value: Vector3): Vec3Dto {
  return {
    x: withoutNegativeZero(value.x),
    y: withoutNegativeZero(value.y),
    z: withoutNegativeZero(value.z),
  };
}

function withoutNegativeZero(value: number): number {
  return value === 0 ? 0 : value;
}

function assertVec3(value: Vec3Dto, label: string): void {
  if (![value.x, value.y, value.z].every(Number.isFinite)) {
    throw new RangeError(`${label} must contain finite components`);
  }
}

function assertNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} must be finite and non-negative`);
  }
}
