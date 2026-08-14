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
  dot,
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
 * Attempts to climb a blocking edge: lift, carry the motion forward, drop onto
 * the tread.
 *
 * Two details are load-bearing.
 *
 * The lift is `stepHeight - skin`, not `stepHeight`. A grounded capsule already
 * floats one skin width above its surface, so lifting by the full step height
 * would put the capsule's underside at `stepHeight + skin` above the ground and
 * quietly climb risers taller than the authored limit.
 *
 * The forward carry is at least `radius + 2 * skin`, even when the tick only
 * asked for a centimetre. A capsule is supported by what is under its axis, and
 * contact with a riser leaves the axis roughly a radius short of it — so a step
 * that only advanced the requested distance would come down on the tread's lip,
 * be rejected as unwalkable, and the actor would never climb stairs at walking
 * speed. Committing the clearance instead makes the climb take exactly one
 * tick, at the cost of a bounded forward pop on the tick a step is taken.
 */
const tryStepUp = (
  queries: CollisionQueries,
  params: MotionParams,
  position: Vec3,
  remaining: Vec3,
): StepResult | null => {
  const { stepHeight } = params.collision;
  const { skin, radius } = params.capsule;
  const horizontal: Vec3 = { x: remaining.x, y: 0, z: remaining.z };
  const horizontalDistance = length(horizontal);
  const lift = stepHeight - skin;
  if (horizontalDistance <= MOVE_EPSILON || lift <= 0) {
    return null;
  }

  const liftHit = queries.sweepCapsule({
    capsule: capsuleAtFoot(position, params),
    displacement: { x: 0, y: lift, z: 0 },
  });
  if (liftHit !== null && liftHit.fraction * lift - skin < lift - MOVE_EPSILON) {
    return null;
  }
  const lifted: Vec3 = { x: position.x, y: position.y + lift, z: position.z };

  const direction = scale(horizontal, 1 / horizontalDistance);
  const carry = Math.max(horizontalDistance, radius + skin * 2);
  const forwardHit = queries.sweepCapsule({
    capsule: capsuleAtFoot(lifted, params),
    displacement: scale(direction, carry),
  });
  const forwardTravel =
    forwardHit === null ? carry : clamp(forwardHit.fraction * carry - skin, 0, carry);
  if (forwardTravel <= skin) {
    return null;
  }
  const advanced = addScaled(lifted, direction, forwardTravel);

  const dropHit = queries.sweepCapsule({
    capsule: capsuleAtFoot(advanced, params),
    displacement: { x: 0, y: -stepHeight, z: 0 },
  });
  if (dropHit === null || !isWalkable(dropHit.normal, params)) {
    return null;
  }
  const drop = clamp(dropHit.fraction * stepHeight - skin, 0, stepHeight);
  const landed: Vec3 = { x: advanced.x, y: advanced.y - drop, z: advanced.z };

  // Stand on top of what was landed on, never balanced against its lip.
  if (landed.y < dropHit.point.y - MOVE_EPSILON) {
    return null;
  }

  const climb = landed.y - position.y;
  if (climb <= MOVE_EPSILON || climb > stepHeight + MOVE_EPSILON) {
    return null;
  }

  const consumed = clamp(forwardTravel / horizontalDistance, 0, 1);
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

    if (travel <= 0 && dot(direction, hit.normal) >= 0) {
      // Already touching a surface the motion is leaving rather than entering.
      // Sliding along it here is the classic sticky-wall bug; nudge clear and
      // let the next sweep decide instead.
      position = addScaled(position, hit.normal, skin);
      continue;
    }

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
