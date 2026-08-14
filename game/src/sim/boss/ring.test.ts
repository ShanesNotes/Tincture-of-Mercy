/**
 * The snare ring: geometry from the baked ARENA markers, and the two different
 * consequences of touching the same line (contract deliverable 3).
 */

import { describe, expect, it } from "vitest";

import { RAW_PLACEMENTS, WARDEN_PARAMS, WARDEN_RING } from "./fixtures.test";
import {
  clampToRing,
  distanceFromRingCenter,
  isHuggingRing,
  isOutsideLeash,
  isTouchingRing,
  parseSnareRing,
  resolveRingContact,
} from "./ring";

const onRing = (angle: number, offset = 0): { readonly x: number; readonly z: number } => ({
  x: WARDEN_RING.centerX + Math.cos(angle) * (WARDEN_RING.radiusMeters + offset),
  z: WARDEN_RING.centerZ + Math.sin(angle) * (WARDEN_RING.radiusMeters + offset),
});

describe("snare-ring geometry", () => {
  it("reads the sixteen ARENA snare posts as an 18m shallow bowl", () => {
    expect(WARDEN_RING.postCount).toBe(16);
    expect(WARDEN_RING.radiusMeters).toBeCloseTo(9.2, 2);
    expect(WARDEN_RING.radiusMeters * 2).toBeCloseTo(18.4, 1);
    expect(WARDEN_RING.centerZ).toBeCloseTo(-136, 3);
    expect(WARDEN_RING.centerX).toBeCloseTo(0, 6);
  });

  it("consumes the placements read-only", () => {
    const before = JSON.stringify(RAW_PLACEMENTS);
    parseSnareRing(RAW_PLACEMENTS, WARDEN_PARAMS);
    expect(JSON.stringify(RAW_PLACEMENTS)).toBe(before);
  });

  it("rejects posts that are not a ring", () => {
    const broken = JSON.parse(JSON.stringify(RAW_PLACEMENTS)) as {
      snareRing: { position: number[] }[];
    };
    const post = broken.snareRing[0];
    if (post === undefined) throw new Error("fixture missing a snare post");
    post.position = [post.position[0] ?? 0, 0.35, (post.position[2] ?? 0) + 3];
    expect(() => parseSnareRing(broken, WARDEN_PARAMS)).toThrow(/off the ring radius/);
  });

  it("rejects a post outside the ARENA zone", () => {
    const broken = JSON.parse(JSON.stringify(RAW_PLACEMENTS)) as {
      snareRing: { zone: string }[];
    };
    const post = broken.snareRing[1];
    if (post === undefined) throw new Error("fixture missing a snare post");
    post.zone = "ROAD";
    expect(() => parseSnareRing(broken, WARDEN_PARAMS)).toThrow(/ARENA zone/);
  });
});

describe("ring contact", () => {
  it("roots the player 45 ticks and chimes the tags", () => {
    const point = onRing(0.4);
    expect(isTouchingRing(WARDEN_RING, WARDEN_PARAMS, point.x, point.z)).toBe(true);
    const contact = resolveRingContact(WARDEN_RING, WARDEN_PARAMS, "player", point.x, point.z);
    expect(contact).toEqual({
      touching: true,
      rooted: true,
      rootTicks: 45,
      chime: true,
      passesThrough: false,
    });
  });

  it("lets the charging Warden pass through the same line", () => {
    const point = onRing(1.2);
    const contact = resolveRingContact(
      WARDEN_RING,
      WARDEN_PARAMS,
      "warden_charging",
      point.x,
      point.z,
    );
    expect(contact.touching).toBe(true);
    expect(contact.passesThrough).toBe(true);
    expect(contact.rooted).toBe(false);
    expect(contact.rootTicks).toBe(0);
  });

  it("does not fire away from the line", () => {
    const inside = onRing(0, -3);
    expect(isTouchingRing(WARDEN_RING, WARDEN_PARAMS, inside.x, inside.z)).toBe(false);
    expect(
      resolveRingContact(WARDEN_RING, WARDEN_PARAMS, "player", inside.x, inside.z).touching,
    ).toBe(false);
  });
});

describe("ring bands and bounds", () => {
  it("hugs only inside the authored hug band", () => {
    const hugging = onRing(0, -(WARDEN_PARAMS.ring.hugBandMeters - 0.1));
    const clear = onRing(0, -(WARDEN_PARAMS.ring.hugBandMeters + 0.1));
    expect(isHuggingRing(WARDEN_RING, WARDEN_PARAMS, hugging.x, hugging.z)).toBe(true);
    expect(isHuggingRing(WARDEN_RING, WARDEN_PARAMS, clear.x, clear.z)).toBe(false);
  });

  it("leashes the boss to the arena bounds", () => {
    expect(WARDEN_PARAMS.leash.mode).toBe("arena_bounds");
    const outside = onRing(2.5, 0.5);
    const inside = onRing(2.5, -0.5);
    expect(isOutsideLeash(WARDEN_RING, WARDEN_PARAMS, outside.x, outside.z)).toBe(true);
    expect(isOutsideLeash(WARDEN_RING, WARDEN_PARAMS, inside.x, inside.z)).toBe(false);
  });

  it("clamps a charge to the line and leaves interior points alone", () => {
    const beyond = onRing(1.0, 4);
    const clamped = clampToRing(WARDEN_RING, beyond.x, beyond.z);
    expect(distanceFromRingCenter(WARDEN_RING, clamped.x, clamped.z)).toBeCloseTo(
      WARDEN_RING.radiusMeters,
      6,
    );
    const interior = onRing(1.0, -4);
    expect(clampToRing(WARDEN_RING, interior.x, interior.z)).toEqual(interior);
  });
});
