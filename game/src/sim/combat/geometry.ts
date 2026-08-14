export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface Capsule {
  readonly a: Vec3;
  readonly b: Vec3;
  readonly radius: number;
}

export interface Aabb {
  readonly min: Vec3;
  readonly max: Vec3;
}

export interface GridActor {
  readonly id: number;
  readonly capsules: readonly Capsule[];
}

export interface WeaponSweepHit {
  readonly substep: number;
  readonly tickFractionStart: number;
  readonly tickFractionEnd: number;
}

export interface WeaponSweepConfig {
  readonly epsilonMeters: number;
  readonly substepsPerTick: number;
}

export const WEAPON_SWEEP_SUBSTEPS = 3 as const;

// Floating-point degeneracy tolerance only. Gameplay contact tolerance is the
// data-owned epsilonMeters passed to sweepWeaponCapsule.
const EPSILON = 1e-12;

const add = (left: Vec3, right: Vec3): Vec3 => ({
  x: left.x + right.x,
  y: left.y + right.y,
  z: left.z + right.z,
});

const subtract = (left: Vec3, right: Vec3): Vec3 => ({
  x: left.x - right.x,
  y: left.y - right.y,
  z: left.z - right.z,
});

const scale = (vector: Vec3, scalar: number): Vec3 => ({
  x: vector.x * scalar,
  y: vector.y * scalar,
  z: vector.z * scalar,
});

const dot = (left: Vec3, right: Vec3): number =>
  left.x * right.x + left.y * right.y + left.z * right.z;

const cross = (left: Vec3, right: Vec3): Vec3 => ({
  x: left.y * right.z - left.z * right.y,
  y: left.z * right.x - left.x * right.z,
  z: left.x * right.y - left.y * right.x,
});

const lengthSquared = (vector: Vec3): number => dot(vector, vector);

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.max(minimum, Math.min(maximum, value));

const lerp = (from: Vec3, to: Vec3, fraction: number): Vec3 =>
  add(from, scale(subtract(to, from), fraction));

const assertVec3 = (value: Vec3, label: string): void => {
  if (![value.x, value.y, value.z].every(Number.isFinite)) {
    throw new Error(`${label} must contain finite coordinates.`);
  }
};

const assertCapsule = (value: Capsule, label: string): void => {
  assertVec3(value.a, `${label}.a`);
  assertVec3(value.b, `${label}.b`);
  if (!Number.isFinite(value.radius) || value.radius < 0) {
    throw new Error(`${label}.radius must be finite and non-negative.`);
  }
};

export const segmentDistanceSquared = (
  firstA: Vec3,
  firstB: Vec3,
  secondA: Vec3,
  secondB: Vec3,
): number => {
  assertVec3(firstA, "firstA");
  assertVec3(firstB, "firstB");
  assertVec3(secondA, "secondA");
  assertVec3(secondB, "secondB");

  const firstDirection = subtract(firstB, firstA);
  const secondDirection = subtract(secondB, secondA);
  const origins = subtract(firstA, secondA);
  const firstLength = dot(firstDirection, firstDirection);
  const secondLength = dot(secondDirection, secondDirection);
  const secondProjection = dot(secondDirection, origins);

  let firstFraction: number;
  let secondFraction: number;

  if (firstLength <= EPSILON && secondLength <= EPSILON) {
    return lengthSquared(origins);
  }

  if (firstLength <= EPSILON) {
    firstFraction = 0;
    secondFraction = clamp(secondProjection / secondLength, 0, 1);
  } else {
    const firstProjection = dot(firstDirection, origins);
    if (secondLength <= EPSILON) {
      secondFraction = 0;
      firstFraction = clamp(-firstProjection / firstLength, 0, 1);
    } else {
      const directionsProjection = dot(firstDirection, secondDirection);
      const denominator =
        firstLength * secondLength - directionsProjection * directionsProjection;
      firstFraction =
        denominator > EPSILON
          ? clamp(
              (directionsProjection * secondProjection -
                firstProjection * secondLength) /
                denominator,
              0,
              1,
            )
          : 0;
      secondFraction =
        (directionsProjection * firstFraction + secondProjection) /
        secondLength;

      if (secondFraction < 0) {
        secondFraction = 0;
        firstFraction = clamp(-firstProjection / firstLength, 0, 1);
      } else if (secondFraction > 1) {
        secondFraction = 1;
        firstFraction = clamp(
          (directionsProjection - firstProjection) / firstLength,
          0,
          1,
        );
      }
    }
  }

  const closestDelta = subtract(
    add(firstA, scale(firstDirection, firstFraction)),
    add(secondA, scale(secondDirection, secondFraction)),
  );
  return lengthSquared(closestDelta);
};

export const capsulesIntersect = (first: Capsule, second: Capsule): boolean => {
  assertCapsule(first, "first capsule");
  assertCapsule(second, "second capsule");
  const combinedRadius = first.radius + second.radius;
  return (
    segmentDistanceSquared(first.a, first.b, second.a, second.b) <=
    combinedRadius * combinedRadius + EPSILON
  );
};

const pointSegmentDistanceSquared = (
  point: Vec3,
  start: Vec3,
  end: Vec3,
): number => {
  const direction = subtract(end, start);
  const denominator = lengthSquared(direction);
  if (denominator <= EPSILON) {
    return lengthSquared(subtract(point, start));
  }
  const fraction = clamp(dot(subtract(point, start), direction) / denominator, 0, 1);
  return lengthSquared(subtract(point, add(start, scale(direction, fraction))));
};

const pointTriangleDistanceSquared = (
  point: Vec3,
  first: Vec3,
  second: Vec3,
  third: Vec3,
): number => {
  const firstEdge = subtract(second, first);
  const secondEdge = subtract(third, first);
  if (lengthSquared(cross(firstEdge, secondEdge)) <= EPSILON) {
    return Math.min(
      pointSegmentDistanceSquared(point, first, second),
      pointSegmentDistanceSquared(point, second, third),
      pointSegmentDistanceSquared(point, third, first),
    );
  }

  const fromFirst = subtract(point, first);
  const firstDot = dot(firstEdge, fromFirst);
  const secondDot = dot(secondEdge, fromFirst);
  if (firstDot <= 0 && secondDot <= 0) {
    return lengthSquared(fromFirst);
  }

  const fromSecond = subtract(point, second);
  const thirdDot = dot(firstEdge, fromSecond);
  const fourthDot = dot(secondEdge, fromSecond);
  if (thirdDot >= 0 && fourthDot <= thirdDot) {
    return lengthSquared(fromSecond);
  }

  const firstArea = firstDot * fourthDot - thirdDot * secondDot;
  if (firstArea <= 0 && firstDot >= 0 && thirdDot <= 0) {
    const fraction = firstDot / (firstDot - thirdDot);
    return lengthSquared(subtract(point, add(first, scale(firstEdge, fraction))));
  }

  const fromThird = subtract(point, third);
  const fifthDot = dot(firstEdge, fromThird);
  const sixthDot = dot(secondEdge, fromThird);
  if (sixthDot >= 0 && fifthDot <= sixthDot) {
    return lengthSquared(fromThird);
  }

  const secondArea = fifthDot * secondDot - firstDot * sixthDot;
  if (secondArea <= 0 && secondDot >= 0 && sixthDot <= 0) {
    const fraction = secondDot / (secondDot - sixthDot);
    return lengthSquared(subtract(point, add(first, scale(secondEdge, fraction))));
  }

  const thirdArea = thirdDot * sixthDot - fifthDot * fourthDot;
  if (
    thirdArea <= 0 &&
    fourthDot - thirdDot >= 0 &&
    fifthDot - sixthDot >= 0
  ) {
    const fraction =
      (fourthDot - thirdDot) /
      (fourthDot - thirdDot + fifthDot - sixthDot);
    return lengthSquared(
      subtract(point, add(second, scale(subtract(third, second), fraction))),
    );
  }

  const denominator = 1 / (firstArea + secondArea + thirdArea);
  const secondWeight = secondArea * denominator;
  const thirdWeight = firstArea * denominator;
  const closest = add(
    first,
    add(scale(firstEdge, secondWeight), scale(secondEdge, thirdWeight)),
  );
  return lengthSquared(subtract(point, closest));
};

const segmentIntersectsTriangle = (
  start: Vec3,
  end: Vec3,
  first: Vec3,
  second: Vec3,
  third: Vec3,
): boolean => {
  const direction = subtract(end, start);
  const firstEdge = subtract(second, first);
  const secondEdge = subtract(third, first);
  const determinantVector = cross(direction, secondEdge);
  const determinant = dot(firstEdge, determinantVector);
  if (Math.abs(determinant) <= EPSILON) {
    return false;
  }
  const inverse = 1 / determinant;
  const fromFirst = subtract(start, first);
  const firstWeight = dot(fromFirst, determinantVector) * inverse;
  if (firstWeight < -EPSILON || firstWeight > 1 + EPSILON) {
    return false;
  }
  const secondWeight = dot(direction, cross(fromFirst, firstEdge)) * inverse;
  if (
    secondWeight < -EPSILON ||
    firstWeight + secondWeight > 1 + EPSILON
  ) {
    return false;
  }
  const segmentFraction = dot(secondEdge, cross(fromFirst, firstEdge)) * inverse;
  return segmentFraction >= -EPSILON && segmentFraction <= 1 + EPSILON;
};

const segmentTriangleDistanceSquared = (
  start: Vec3,
  end: Vec3,
  first: Vec3,
  second: Vec3,
  third: Vec3,
): number => {
  if (segmentIntersectsTriangle(start, end, first, second, third)) {
    return 0;
  }
  return Math.min(
    pointTriangleDistanceSquared(start, first, second, third),
    pointTriangleDistanceSquared(end, first, second, third),
    segmentDistanceSquared(start, end, first, second),
    segmentDistanceSquared(start, end, second, third),
    segmentDistanceSquared(start, end, third, first),
  );
};

const normalize = (vector: Vec3): Vec3 => {
  const vectorLength = Math.sqrt(lengthSquared(vector));
  return vectorLength <= EPSILON
    ? { x: 0, y: 0, z: 0 }
    : scale(vector, 1 / vectorLength);
};

const deterministicPerpendicular = (direction: Vec3): Vec3 => {
  const axis =
    Math.abs(direction.x) <= Math.abs(direction.y) &&
    Math.abs(direction.x) <= Math.abs(direction.z)
      ? { x: 1, y: 0, z: 0 }
      : Math.abs(direction.y) <= Math.abs(direction.z)
        ? { x: 0, y: 1, z: 0 }
        : { x: 0, y: 0, z: 1 };
  return normalize(cross(direction, axis));
};

const slerpDirection = (from: Vec3, to: Vec3, fraction: number): Vec3 => {
  const cosine = clamp(dot(from, to), -1, 1);
  if (cosine > 1 - 1e-8) {
    return normalize(lerp(from, to, fraction));
  }
  if (cosine < -1 + 1e-8) {
    const perpendicular = deterministicPerpendicular(from);
    return add(
      scale(from, Math.cos(Math.PI * fraction)),
      scale(perpendicular, Math.sin(Math.PI * fraction)),
    );
  }
  const angle = Math.acos(cosine);
  const sine = Math.sin(angle);
  return add(
    scale(from, Math.sin((1 - fraction) * angle) / sine),
    scale(to, Math.sin(fraction * angle) / sine),
  );
};

const interpolateWeaponPose = (
  previous: Capsule,
  current: Capsule,
  fraction: number,
): Capsule => {
  const base = lerp(previous.a, current.a, fraction);
  const previousOffset = subtract(previous.b, previous.a);
  const currentOffset = subtract(current.b, current.a);
  const previousLength = Math.sqrt(lengthSquared(previousOffset));
  const currentLength = Math.sqrt(lengthSquared(currentOffset));
  let tip: Vec3;

  if (previousLength <= EPSILON || currentLength <= EPSILON) {
    tip = lerp(previous.b, current.b, fraction);
  } else {
    const direction = slerpDirection(
      scale(previousOffset, 1 / previousLength),
      scale(currentOffset, 1 / currentLength),
      fraction,
    );
    const interpolatedLength =
      previousLength + (currentLength - previousLength) * fraction;
    tip = add(base, scale(direction, interpolatedLength));
  }

  return {
    a: base,
    b: tip,
    radius: previous.radius + (current.radius - previous.radius) * fraction,
  };
};

const sweptPoseIntersects = (
  start: Capsule,
  end: Capsule,
  hurtbox: Capsule,
  epsilonMeters: number,
): boolean => {
  const combinedRadius =
    Math.max(start.radius, end.radius) + hurtbox.radius + epsilonMeters;
  const threshold = combinedRadius * combinedRadius + EPSILON;
  return (
    segmentTriangleDistanceSquared(
      hurtbox.a,
      hurtbox.b,
      start.a,
      start.b,
      end.b,
    ) <= threshold ||
    segmentTriangleDistanceSquared(
      hurtbox.a,
      hurtbox.b,
      start.a,
      end.b,
      end.a,
    ) <= threshold
  );
};

export const sweepWeaponCapsule = (
  previous: Capsule,
  current: Capsule,
  hurtbox: Capsule,
  config: WeaponSweepConfig = {
    epsilonMeters: 0,
    substepsPerTick: WEAPON_SWEEP_SUBSTEPS,
  },
): WeaponSweepHit | null => {
  assertCapsule(previous, "previous weapon capsule");
  assertCapsule(current, "current weapon capsule");
  assertCapsule(hurtbox, "hurtbox capsule");
  if (!Number.isFinite(config.epsilonMeters) || config.epsilonMeters < 0) {
    throw new Error("Weapon sweep epsilon must be finite and non-negative.");
  }
  if (!Number.isSafeInteger(config.substepsPerTick) || config.substepsPerTick <= 0) {
    throw new Error("Weapon sweep substeps must be a positive safe integer.");
  }

  for (let substep = 0; substep < config.substepsPerTick; substep += 1) {
    const tickFractionStart = substep / config.substepsPerTick;
    const tickFractionEnd = (substep + 1) / config.substepsPerTick;
    const start = interpolateWeaponPose(previous, current, tickFractionStart);
    const end = interpolateWeaponPose(previous, current, tickFractionEnd);
    if (sweptPoseIntersects(start, end, hurtbox, config.epsilonMeters)) {
      return { substep, tickFractionStart, tickFractionEnd };
    }
  }
  return null;
};

export const capsuleBounds = (value: Capsule): Aabb => {
  assertCapsule(value, "capsule");
  return {
    min: {
      x: Math.min(value.a.x, value.b.x) - value.radius,
      y: Math.min(value.a.y, value.b.y) - value.radius,
      z: Math.min(value.a.z, value.b.z) - value.radius,
    },
    max: {
      x: Math.max(value.a.x, value.b.x) + value.radius,
      y: Math.max(value.a.y, value.b.y) + value.radius,
      z: Math.max(value.a.z, value.b.z) + value.radius,
    },
  };
};

const assertBounds = (bounds: Aabb): void => {
  assertVec3(bounds.min, "bounds.min");
  assertVec3(bounds.max, "bounds.max");
  if (
    bounds.min.x > bounds.max.x ||
    bounds.min.y > bounds.max.y ||
    bounds.min.z > bounds.max.z
  ) {
    throw new Error("Bounds minimum must not exceed its maximum.");
  }
};

const cellKey = (x: number, y: number, z: number): string => `${x},${y},${z}`;

export class UniformCapsuleGrid {
  private readonly cells = new Map<string, number[]>();

  public constructor(
    public readonly cellSize: number,
    actors: readonly GridActor[] = [],
  ) {
    if (!Number.isFinite(cellSize) || cellSize <= 0) {
      throw new Error("Grid cell size must be finite and positive.");
    }
    this.rebuild(actors);
  }

  public rebuild(actors: readonly GridActor[]): void {
    this.cells.clear();
    for (const actor of actors) {
      if (!Number.isSafeInteger(actor.id)) {
        throw new Error("Grid actor IDs must be safe integers.");
      }
      for (const actorCapsule of actor.capsules) {
        this.insertBounds(actor.id, capsuleBounds(actorCapsule));
      }
    }
  }

  public queryCapsule(query: Capsule): readonly number[] {
    return this.queryBounds(capsuleBounds(query));
  }

  public queryBounds(bounds: Aabb): readonly number[] {
    const ids = new Set<number>();
    this.forEachCell(bounds, (key) => {
      const bucket = this.cells.get(key);
      if (bucket !== undefined) {
        for (const id of bucket) {
          ids.add(id);
        }
      }
    });
    return [...ids].sort((left, right) => left - right);
  }

  private insertBounds(id: number, bounds: Aabb): void {
    this.forEachCell(bounds, (key) => {
      const bucket = this.cells.get(key);
      if (bucket === undefined) {
        this.cells.set(key, [id]);
      } else {
        bucket.push(id);
      }
    });
  }

  private forEachCell(bounds: Aabb, visit: (key: string) => void): void {
    assertBounds(bounds);
    const minimumX = Math.floor(bounds.min.x / this.cellSize);
    const minimumY = Math.floor(bounds.min.y / this.cellSize);
    const minimumZ = Math.floor(bounds.min.z / this.cellSize);
    const maximumX = Math.floor(bounds.max.x / this.cellSize);
    const maximumY = Math.floor(bounds.max.y / this.cellSize);
    const maximumZ = Math.floor(bounds.max.z / this.cellSize);

    for (let x = minimumX; x <= maximumX; x += 1) {
      for (let y = minimumY; y <= maximumY; y += 1) {
        for (let z = minimumZ; z <= maximumZ; z += 1) {
          visit(cellKey(x, y, z));
        }
      }
    }
  }
}

export const queryGridCandidates = (
  actors: readonly GridActor[],
  query: Capsule,
  cellSize: number,
): readonly number[] =>
  new UniformCapsuleGrid(cellSize, actors).queryCapsule(query);
