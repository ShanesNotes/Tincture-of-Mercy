import type { AttendParams } from "./params";
import type {
  AttendActor,
  AttendCollisionQueries,
  AttendStickSample,
  AttendVec3,
  AttendViewer,
} from "./types";
import {
  BOUNDARY_EPSILON,
  angleBetween,
  clamp,
  degreesToRadians,
  dot,
  length,
  normalize,
  subtract,
} from "./vector";

/** Pull the LOS ray short of the target surface so the target itself never blocks it. */
const LINE_OF_SIGHT_EPSILON_METERS = 1e-3;

export interface AttendCandidate {
  readonly id: string;
  /** Angle between viewer forward and the actor direction, radians. */
  readonly angleRadians: number;
  readonly distanceMeters: number;
  /** Signed screen-space bearing: negative left, positive right, radians. */
  readonly screenBearingRadians: number;
  /** TUNING_V0 score: 0.7 angle + 0.3 distance, both normalised to [0,1]. */
  readonly score: number;
}

export const hasLineOfSight = (
  queries: AttendCollisionQueries,
  from: AttendVec3,
  to: AttendVec3,
): boolean => {
  const delta = subtract(to, from);
  const distance = length(delta);
  if (distance <= LINE_OF_SIGHT_EPSILON_METERS) {
    return true;
  }
  const hit = queries.raycast({
    origin: from,
    direction: normalize(delta),
    maxDistance: distance - LINE_OF_SIGHT_EPSILON_METERS,
  });
  return hit === null;
};

/**
 * TUNING_V0 scoring: `0.7 * angleScore + 0.3 * distanceScore`, where each term
 * falls linearly from 1 (dead centre / touching) to 0 (cone edge / max range).
 */
export const scoreCandidate = (
  angleRadians: number,
  distanceMeters: number,
  params: AttendParams,
): number => {
  const halfCone = degreesToRadians(params.acquisitionHalfConeDegrees);
  const angleScore = halfCone === 0 ? 0 : 1 - clamp(angleRadians / halfCone, 0, 1);
  const distanceScore =
    params.acquisitionRangeMeters === 0
      ? 0
      : 1 - clamp(distanceMeters / params.acquisitionRangeMeters, 0, 1);
  return params.angleScoreWeight * angleScore + params.distanceScoreWeight * distanceScore;
};

const compareCandidates = (a: AttendCandidate, b: AttendCandidate): number => {
  if (a.score !== b.score) {
    return b.score - a.score;
  }
  if (a.distanceMeters !== b.distanceMeters) {
    return a.distanceMeters - b.distanceMeters;
  }
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
};

const describeCandidate = (
  viewer: AttendViewer,
  actor: AttendActor,
  params: AttendParams,
): AttendCandidate => {
  const delta = subtract(actor.position, viewer.position);
  const distanceMeters = length(delta);
  const angleRadians = angleBetween(viewer.forward, delta);
  const direction = normalize(delta);
  const forward = normalize(viewer.forward);
  const right = normalize(viewer.right);
  return {
    id: actor.id,
    angleRadians,
    distanceMeters,
    screenBearingRadians: Math.atan2(dot(right, direction), dot(forward, direction)),
    score: scoreCandidate(angleRadians, distanceMeters, params),
  };
};

/**
 * Acquisition set: alive, inside the 15m range, inside the 34-degree half-cone,
 * and visible. Cone and range edges are inclusive. Ordering is total and
 * deterministic (score desc, then distance asc, then id asc).
 */
export const collectCandidates = (
  viewer: AttendViewer,
  actors: readonly AttendActor[],
  params: AttendParams,
  queries: AttendCollisionQueries,
): readonly AttendCandidate[] => {
  const halfCone = degreesToRadians(params.acquisitionHalfConeDegrees);
  const candidates: AttendCandidate[] = [];

  for (const actor of actors) {
    if (!actor.alive) {
      continue;
    }
    const candidate = describeCandidate(viewer, actor, params);
    if (candidate.distanceMeters > params.acquisitionRangeMeters + BOUNDARY_EPSILON) {
      continue;
    }
    if (candidate.angleRadians > halfCone + BOUNDARY_EPSILON) {
      continue;
    }
    if (!hasLineOfSight(queries, viewer.position, actor.position)) {
      continue;
    }
    candidates.push(candidate);
  }

  return candidates.sort(compareCandidates);
};

export const selectAcquisition = (
  viewer: AttendViewer,
  actors: readonly AttendActor[],
  params: AttendParams,
  queries: AttendCollisionQueries,
): AttendCandidate | null => collectCandidates(viewer, actors, params, queries)[0] ?? null;

export type FlickSide = "left" | "right" | null;

/**
 * A switch flick is a rising stick edge past magnitude 0.6 whose direction lies
 * within +/-45 degrees of the horizontal screen axis.
 */
export const readFlickSide = (stick: AttendStickSample, params: AttendParams): FlickSide => {
  const magnitude = Math.hypot(stick.x, stick.y);
  if (magnitude <= params.switchFlickMagnitude) {
    return null;
  }
  const offHorizontal = Math.atan2(Math.abs(stick.y), Math.abs(stick.x));
  if (offHorizontal > degreesToRadians(params.switchFlickHalfAngleDegrees) + BOUNDARY_EPSILON) {
    return null;
  }
  if (stick.x === 0) {
    return null;
  }
  return stick.x > 0 ? "right" : "left";
};

/**
 * Nearest candidate on the flicked side of the current target in screen space.
 * Ties resolve by distance then id so identical layouts always pick identically.
 */
export const selectSwitchTarget = (
  viewer: AttendViewer,
  currentTargetId: string,
  actors: readonly AttendActor[],
  side: Exclude<FlickSide, null>,
  params: AttendParams,
  queries: AttendCollisionQueries,
): AttendCandidate | null => {
  const candidates = collectCandidates(viewer, actors, params, queries);
  const current = candidates.find((candidate) => candidate.id === currentTargetId);
  const currentBearing =
    current?.screenBearingRadians ??
    describeCandidateBearing(viewer, actors, currentTargetId, params);
  if (currentBearing === null) {
    return null;
  }

  let best: AttendCandidate | null = null;
  let bestDelta = Number.POSITIVE_INFINITY;
  for (const candidate of candidates) {
    if (candidate.id === currentTargetId) {
      continue;
    }
    const delta = candidate.screenBearingRadians - currentBearing;
    if (side === "right" ? delta <= 0 : delta >= 0) {
      continue;
    }
    const magnitude = Math.abs(delta);
    if (
      magnitude < bestDelta ||
      (magnitude === bestDelta && best !== null && compareCandidates(candidate, best) < 0)
    ) {
      best = candidate;
      bestDelta = magnitude;
    }
  }
  return best;
};

const describeCandidateBearing = (
  viewer: AttendViewer,
  actors: readonly AttendActor[],
  targetId: string,
  params: AttendParams,
): number | null => {
  const actor = actors.find((entry) => entry.id === targetId);
  return actor === undefined ? null : describeCandidate(viewer, actor, params).screenBearingRadians;
};

/**
 * Post-death re-acquire: the nearest living actor within 8m of where the dead
 * target stood. Visibility is not required — the fight has already been joined.
 */
export const selectReacquireTarget = (
  anchor: AttendVec3,
  actors: readonly AttendActor[],
  params: AttendParams,
): string | null => {
  let bestId: string | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const actor of actors) {
    if (!actor.alive) {
      continue;
    }
    const distance = length(subtract(actor.position, anchor));
    if (distance > params.reacquireRangeMeters + BOUNDARY_EPSILON) {
      continue;
    }
    if (distance < bestDistance || (distance === bestDistance && bestId !== null && actor.id < bestId)) {
      bestId = actor.id;
      bestDistance = distance;
    }
  }
  return bestId;
};
