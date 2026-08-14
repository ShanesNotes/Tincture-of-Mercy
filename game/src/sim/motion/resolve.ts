/**
 * Swept-capsule collision resolution: move-and-slide, step-offset climbing,
 * slope limiting, ground snapping and ceiling stops. Every world query goes
 * through the injected `CollisionQueries`; this file is pure arithmetic.
 */

import type { MotionParams } from "./params";
import type { Capsule, CollisionQueries, Vec3 } from "./types";
import {
  UP,
  addScaled,
  clamp,
  horizontalLength,
  length,
  lengthSq,
  projectOnPlane,
  scale,
} from "./vec";

/** Movement shorter than this is treated as no movement; well under 1mm vertex quantisation. */
export const MOVE_EPSILON = 1e-9;

/** The capsule whose lowest point sits at `foot`. */
export const capsuleAtFoot = (foot: Vec3, params: MotionParams): Capsule => ({
  start: { x: foot.x, y: foot.y + params.capsule.radius, z: foot.z },
  end: { x: foot.x, y: foot.y + params.capsule.height - params.capsule.radius, z: foot.z },
  radius: params.capsule.radius,
});

/** A surface is standable when its normal is no steeper than the slope limit. */
export const isWalkable = (normal: Vec3, params: MotionParams): boolean =>
  normal.y >= params.collision.walkableNormalY - MOVE_EPSILON;

/**
 * Deflects `motion` along a contact plane.
 *
 * Walkable contacts slide on the true plane, which is how walking up a ramp
 * works. Unwalkable contacts do the same but may never end up rising faster
 * than the motion already was — without that clamp, pressing into a steep
 * slope or an acute corner converts horizontal push into free height.
 */
const slideAlong = (motion: Vec3, normal: Vec3, walkable: boolean): Vec3 => {
  const projected = projectOnPlane(motion, normal);
  if (walkable) {
    return projected;
  }
  const rise = motion.y > 0 ? motion.y : 0;
  return projected.y > rise ? { x: projected.x, y: rise, z: projected.z } : projected;
};

interface StepResult {
  readonly position: Vec3;
  readonly remaining: Vec3;
}

/**
 * Attempts to climb a blocking edge: lift by the step height, carry the
 * remaining horizontal motion, then drop back onto the tread. Rejected when the
 * lift is obstructed (low ceilings), when the landing is missing or too steep,
 * or when the resulting climb is not a genuine climb of at most `stepHeight`.
 */
const tryStepUp = (
  queries: CollisionQueries,
  params: MotionParams,
  position: Vec3,
  remaining: Vec3,
): StepResult | null => {
  const { stepHeight } = params.collision;
  const { skin } = params.capsule;
  const horizontal: Vec3 = { x: remaining.x, y: 0, z: remaining.z };
  const horizontalDistance = length(horizontal);
  if (horizontalDistance <= MOVE_EPSILON || stepHeight <= 0) {
    return null;
  }

  const liftHit = queries.sweepCapsule({
    capsule: capsuleAtFoot(position, params),
    displacement: { x: 0, y: stepHeight, z: 0 },
  });
  if (liftHit !== null && liftHit.fraction * stepHeight - skin < stepHeight - MOVE_EPSILON) {
    return null;
  }
  const lifted: Vec3 = { x: position.x, y: position.y + stepHeight, z: position.z };

  const direction = scale(horizontal, 1 / horizontalDistance);
  const forwardHit = queries.sweepCapsule({
    capsule: capsuleAtFoot(lifted, params),
    displacement: horizontal,
  });
  const forwardTravel =
    forwardHit === null
      ? horizontalDistance
      : clamp(forwardHit.fraction * horizontalDistance - skin, 0, horizontalDistance);
  if (forwardTravel <= skin) {
    return null;
  }
  const advanced = addScaled(lifted, direction, forwardTravel);

  const dropDistance = stepHeight + skin;
  const dropHit = queries.sweepCapsule({
    capsule: capsuleAtFoot(advanced, params),
    displacement: { x: 0, y: -dropDistance, z: 0 },
  });
  if (dropHit === null || !isWalkable(dropHit.normal, params)) {
    return null;
  }
  const drop = clamp(dropHit.fraction * dropDistance - skin, 0, dropDistance);
  const landed: Vec3 = { x: advanced.x, y: advanced.y - drop, z: advanced.z };

  const climb = landed.y - position.y;
  if (climb <= MOVE_EPSILON || climb > stepHeight + MOVE_EPSILON) {
    return null;
  }

  const consumed = forwardTravel / horizontalDistance;
  return {
    position: landed,
    remaining: {
      x: remaining.x * (1 - consumed),
      y: 0,
      z: remaining.z * (1 - consumed),
    },
  };
};

export interface MoveResult {
  readonly position: Vec3;
  readonly velocity: Vec3;
  /** Contacts resolved this move; bounded by `collision.maxContacts`. */
  readonly contacts: number;
  readonly hitCeiling: boolean;
  readonly steppedUp: boolean;
}

/**
 * Sweeps the capsule along `displacement`, sliding on each contact, for at most
 * `collision.maxContacts` iterations. Because every advance is a swept query,
 * the capsule can never pass through geometry regardless of speed: when the
 * iteration budget runs out the leftover motion is simply dropped.
 */
export const moveAndSlide = (
  queries: CollisionQueries,
  params: MotionParams,
  foot: Vec3,
  displacement: Vec3,
  velocity: Vec3,
  allowStep: boolean,
): MoveResult => {
  const { skin } = params.capsule;
  let position = foot;
  let remaining = displacement;
  let currentVelocity = velocity;
  let contacts = 0;
  let hitCeiling = false;
  let steppedUp = false;

  for (let iteration = 0; iteration < params.collision.maxContacts; iteration += 1) {
    const distance = length(remaining);
    if (distance <= MOVE_EPSILON) {
      break;
    }

    const hit = queries.sweepCapsule({
      capsule: capsuleAtFoot(position, params),
      displacement: remaining,
    });
    if (hit === null) {
      position = addScaled(position, remaining, 1);
      break;
    }

    contacts += 1;
    const direction = scale(remaining, 1 / distance);
    const travel = clamp(hit.fraction * distance - skin, 0, distance);
    position = addScaled(position, direction, travel);
    const left = scale(direction, distance - travel);
    const walkable = isWalkable(hit.normal, params);

    if (allowStep && !walkable && horizontalLength(left) > MOVE_EPSILON) {
      const stepped = tryStepUp(queries, params, position, left);
      if (stepped !== null) {
        position = stepped.position;
        remaining = stepped.remaining;
        steppedUp = true;
        continue;
      }
    }

    if (hit.normal.y < 0 && currentVelocity.y > 0) {
      hitCeiling = true;
      currentVelocity = { x: currentVelocity.x, y: 0, z: currentVelocity.z };
    }

    const wallNormal = lengthSq(hit.normal) === 0 ? UP : hit.normal;
    remaining = slideAlong(left, wallNormal, walkable);
    currentVelocity = slideAlong(currentVelocity, wallNormal, walkable);
  }

  return { position, velocity: currentVelocity, contacts, hitCeiling, steppedUp };
};

export interface GroundResult {
  readonly position: Vec3;
  readonly grounded: boolean;
  readonly groundNormal: Vec3;
  /** True when any surface — walkable or not — is within snap range below the capsule. */
  readonly touching: boolean;
}

/**
 * Snaps the capsule onto a walkable surface within `groundSnapMeters`, leaving
 * exactly one skin width of clearance so the next tick's sweeps start free of
 * the floor. Surfaces steeper than the slope limit report `touching` but never
 * `grounded`: gravity and the slide rule carry the actor down them.
 */
export const resolveGround = (
  queries: CollisionQueries,
  params: MotionParams,
  position: Vec3,
  verticalVelocity: number,
): GroundResult => {
  if (verticalVelocity > 0) {
    return { position, grounded: false, groundNormal: UP, touching: false };
  }

  const { skin } = params.capsule;
  const probeDistance = params.collision.groundSnapMeters + skin;
  const hit = queries.probeGround({
    capsule: capsuleAtFoot(position, params),
    maxDistance: probeDistance,
  });
  if (hit === null) {
    return { position, grounded: false, groundNormal: UP, touching: false };
  }
  if (!isWalkable(hit.normal, params)) {
    return { position, grounded: false, groundNormal: hit.normal, touching: true };
  }

  const drop = clamp(hit.distance - skin, -skin, probeDistance);
  return {
    position: { x: position.x, y: position.y - drop, z: position.z },
    grounded: true,
    groundNormal: hit.normal,
    touching: true,
  };
};
