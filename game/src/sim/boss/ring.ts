/**
 * The snare line — a Living Boundary and Beautiful Hazard (ENCOUNTERS).
 *
 * Geometry is read (never written) from the ARENA snare markers baked into
 * `src/data/levels/ironwood_placements.json`. Contact roots the player 45t and
 * chimes the tin tags; the Warden's charge-through passes through and ends at
 * the ring instead.
 */

import type { WardenParams, WardenRingGeometry } from "./types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

interface RingPost {
  readonly x: number;
  readonly z: number;
}

const postOf = (value: unknown, index: number, zone: string): RingPost => {
  if (!isRecord(value)) {
    throw new Error(`snare ring: post ${String(index)} must be an object`);
  }
  if (value.zone !== zone) {
    throw new Error(`snare ring: post ${String(index)} must sit in the ${zone} zone`);
  }
  const position = value.position;
  if (!Array.isArray(position) || position.length !== 3) {
    throw new Error(`snare ring: post ${String(index)} must carry an [x, y, z] position`);
  }
  const [x, , z] = position as readonly unknown[];
  if (typeof x !== "number" || typeof z !== "number" || !Number.isFinite(x) || !Number.isFinite(z)) {
    throw new Error(`snare ring: post ${String(index)} must carry finite XZ coordinates`);
  }
  return { x, z };
};

/** Read-only consumption of the baked ARENA markers. */
export const parseSnareRing = (
  rawPlacements: unknown,
  params: WardenParams,
): WardenRingGeometry => {
  if (!isRecord(rawPlacements)) {
    throw new Error("snare ring: placements must be an object");
  }
  const raw = rawPlacements[params.ring.sourcePlacementKey];
  if (!Array.isArray(raw) || raw.length < 3) {
    throw new Error("snare ring: placements must bake at least three snare posts");
  }
  const posts = raw.map((entry, index) => postOf(entry, index, params.ring.zone));
  let sumX = 0;
  let sumZ = 0;
  for (const post of posts) {
    sumX += post.x;
    sumZ += post.z;
  }
  const centerX = sumX / posts.length;
  const centerZ = sumZ / posts.length;
  let sumRadius = 0;
  for (const post of posts) {
    sumRadius += Math.hypot(post.x - centerX, post.z - centerZ);
  }
  const radiusMeters = sumRadius / posts.length;
  for (const [index, post] of posts.entries()) {
    const drift = Math.abs(Math.hypot(post.x - centerX, post.z - centerZ) - radiusMeters);
    if (drift > params.ring.radiusToleranceMeters) {
      throw new Error(
        `snare ring: post ${String(index)} is ${drift.toFixed(3)}m off the ring radius`,
      );
    }
  }
  return { centerX, centerZ, radiusMeters, postCount: posts.length };
};

export const distanceFromRingCenter = (
  ring: WardenRingGeometry,
  x: number,
  z: number,
): number => Math.hypot(x - ring.centerX, z - ring.centerZ);

/** Contact band around the strung line itself. */
export const isTouchingRing = (
  ring: WardenRingGeometry,
  params: WardenParams,
  x: number,
  z: number,
): boolean =>
  Math.abs(distanceFromRingCenter(ring, x, z) - ring.radiusMeters) <=
  params.ring.contactBandMeters;

/** Ring-hugging gates the Phase 2 lantern-fire arc. */
export const isHuggingRing = (
  ring: WardenRingGeometry,
  params: WardenParams,
  x: number,
  z: number,
): boolean =>
  distanceFromRingCenter(ring, x, z) >= ring.radiusMeters - params.ring.hugBandMeters;

/** The leash is the arena bound (ENCOUNTERS: the ring is the boundary). */
export const isOutsideLeash = (
  ring: WardenRingGeometry,
  params: WardenParams,
  x: number,
  z: number,
): boolean =>
  distanceFromRingCenter(ring, x, z) > ring.radiusMeters + params.leash.marginMeters;

export const clampToRing = (
  ring: WardenRingGeometry,
  x: number,
  z: number,
): { readonly x: number; readonly z: number } => {
  const distance = distanceFromRingCenter(ring, x, z);
  if (distance <= ring.radiusMeters || distance === 0) {
    return { x, z };
  }
  const scale = ring.radiusMeters / distance;
  return {
    x: ring.centerX + (x - ring.centerX) * scale,
    z: ring.centerZ + (z - ring.centerZ) * scale,
  };
};

export type RingActorKind = "player" | "warden_charging" | "warden";

export interface RingContact {
  readonly touching: boolean;
  readonly rooted: boolean;
  readonly rootTicks: number;
  readonly chime: boolean;
  readonly passesThrough: boolean;
}

/**
 * The player roots and the tags chime; a charging Warden passes through and is
 * stopped at the line. Same boundary, two different consequences.
 */
export const resolveRingContact = (
  ring: WardenRingGeometry,
  params: WardenParams,
  kind: RingActorKind,
  x: number,
  z: number,
): RingContact => {
  const touching = isTouchingRing(ring, params, x, z);
  if (!touching) {
    return { touching: false, rooted: false, rootTicks: 0, chime: false, passesThrough: false };
  }
  const passesThrough = kind !== "player" && params.ring.wardenPassesThrough;
  return {
    touching: true,
    rooted: !passesThrough,
    rootTicks: passesThrough ? 0 : params.ring.rootTicks,
    chime: params.ring.chimeOnContact,
    passesThrough,
  };
};
