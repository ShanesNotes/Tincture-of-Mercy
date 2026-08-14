import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { spawnMotionState, stepMotion } from "./motion";
import { BruteForceQueries, NASTY_LEVEL_LANDMARKS, createNastyLevel } from "./nasty_level";
import { parseMotionParams, type MotionParams } from "./params";
import { isWalkable, moveAndSlide, resolveGround } from "./resolve";
import type { MotionInput, MotionState, Vec3 } from "./types";

const rawText = readFileSync(new URL("../../data/motion_params.json", import.meta.url), "utf8");
const params: MotionParams = parseMotionParams(JSON.parse(rawText));

const level = createNastyLevel();
const queries = new BruteForceQueries(level);

const SPAWN_DROP = 6;

const at = (landmark: Vec3, facing: number): MotionState =>
  spawnMotionState(queries, params, landmark, facing, 100, SPAWN_DROP);

/** Yaw that faces the given world XZ direction. */
const facingToward = (x: number, z: number): number => Math.atan2(x, z);

const push = (direction: { x: number; z: number }): MotionInput => ({
  moveX: direction.x,
  moveZ: direction.z,
  sprint: false,
  jump: false,
});

interface Drive {
  readonly state: MotionState;
  readonly states: readonly MotionState[];
  readonly maxContacts: number;
}

const drive = (
  start: MotionState,
  ticks: number,
  direction: { x: number; z: number },
): Drive => {
  let state = start;
  const states: MotionState[] = [];
  let maxContacts = 0;
  for (let tick = 0; tick < ticks; tick += 1) {
    state = stepMotion(state, push(direction), queries, params).state;
    states.push(state);
    maxContacts = Math.max(maxContacts, state.contactCount);
  }
  return { state, states, maxContacts };
};

const EAST = { x: 1, z: 0 };
const NORTH = { x: 0, z: 1 };

describe("ground snap", () => {
  it("holds the capsule one skin width above flat ground while walking", () => {
    const start = at(NASTY_LEVEL_LANDMARKS.flatStart, facingToward(1, 0));
    const { states } = drive(start, 60, EAST);
    for (const state of states) {
      expect(state.grounded).toBe(true);
      expect(state.position.y).toBeCloseTo(params.capsule.skin, 6);
    }
  });

  it("does not jitter across the fine coplanar seam patch", () => {
    const start = at(NASTY_LEVEL_LANDMARKS.seamPatch, facingToward(-1, 0));
    const { states } = drive(start, 90, { x: -1, z: 0 });
    const heights = states.map((state) => state.position.y);
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(1e-6);
  });

  it("pushes the capsule out when it starts intersecting the floor", () => {
    const sunk: Vec3 = { x: 0, y: -0.05, z: 3.5 };
    const ground = resolveGround(queries, params, sunk, 0);
    expect(ground.grounded).toBe(true);
    expect(ground.position.y).toBeCloseTo(params.capsule.skin, 6);
  });
});

describe("walls", () => {
  it("stops at the perimeter wall instead of passing through it", () => {
    const start = at({ x: 10.5, y: 0, z: 3.5 }, facingToward(1, 0));
    const { state } = drive(start, 240, EAST);
    expect(state.position.x).toBeLessThanOrEqual(level.bounds.maxX - params.capsule.radius + 0.05);
    expect(state.position.x).toBeGreaterThan(11);
  });

  it("never resolves more contacts than the authored budget", () => {
    const start = at(NASTY_LEVEL_LANDMARKS.wedgeApproach, facingToward(0, 1));
    const { maxContacts } = drive(start, 180, NORTH);
    expect(maxContacts).toBeLessThanOrEqual(params.collision.maxContacts);
  });

  it("wedges into an acute corner without ejecting or climbing", () => {
    const start = at(NASTY_LEVEL_LANDMARKS.wedgeApproach, facingToward(0, 1));
    const { states } = drive(start, 180, NORTH);
    for (const state of states) {
      expect(state.position.y).toBeLessThanOrEqual(start.position.y + 1e-6);
      expect(Number.isFinite(state.position.x)).toBe(true);
      expect(Math.abs(state.position.x)).toBeLessThan(12);
      expect(Math.abs(state.position.z)).toBeLessThan(12);
    }
  });

  it("passes through the 0.72m doorway on the centre line", () => {
    const start = at(NASTY_LEVEL_LANDMARKS.doorwayApproach, facingToward(0, 1));
    const { state } = drive(start, 180, NORTH);
    expect(state.position.z).toBeGreaterThan(6.5);
  });

  it("is refused by the doorway when approaching off-centre", () => {
    const offset = NASTY_LEVEL_LANDMARKS.doorwayApproach;
    const start = at({ x: offset.x - 0.5, y: offset.y, z: offset.z }, facingToward(0, 1));
    const { state } = drive(start, 120, NORTH);
    expect(state.position.z).toBeLessThan(6);
  });
});

describe("step offset", () => {
  it("climbs a staircase whose rise is under the step height", () => {
    const start = at(NASTY_LEVEL_LANDMARKS.lowStairsFoot, facingToward(1, 0));
    const { states } = drive(start, 200, EAST);
    const highest = Math.max(...states.map((entry) => entry.position.y));
    expect(highest).toBeGreaterThan(1.6);
    expect(states.some((entry) => entry.grounded && entry.position.y > 1.6)).toBe(true);
    for (let index = 1; index < states.length; index += 1) {
      const previous = states[index - 1];
      const current = states[index];
      if (previous === undefined || current === undefined) {
        continue;
      }
      expect(current.position.y - previous.position.y).toBeLessThanOrEqual(
        params.collision.stepHeight + 1e-6,
      );
    }
  });

  it("refuses a staircase whose rise is over the step height", () => {
    const start = at(NASTY_LEVEL_LANDMARKS.highStairsFoot, facingToward(1, 0));
    const { state } = drive(start, 300, EAST);
    expect(state.position.y).toBeLessThan(0.1);
    expect(state.position.x).toBeLessThan(-6);
  });

  it("refuses a climbable step when a low ceiling blocks the lift", () => {
    const start = at(NASTY_LEVEL_LANDMARKS.ceilingStepApproach, facingToward(1, 0));
    const { state } = drive(start, 240, EAST);
    expect(state.position.y).toBeLessThan(0.1);
    expect(state.position.x).toBeLessThan(6);
  });

  it("is refused entirely under a ceiling too low to stand in", () => {
    const start = at(NASTY_LEVEL_LANDMARKS.lowCeilingApproach, facingToward(1, 0));
    const { state } = drive(start, 240, EAST);
    expect(state.position.x).toBeLessThan(4);
  });
});

describe("slope limit", () => {
  it("walks up a 44 degree ramp and stays grounded", () => {
    const start = at(NASTY_LEVEL_LANDMARKS.slope44Foot, facingToward(1, 0));
    const { state, states } = drive(start, 180, EAST);
    expect(state.position.y).toBeGreaterThan(1);
    expect(states.some((entry) => entry.grounded && entry.position.y > 0.5)).toBe(true);
  });

  it("cannot climb a 46 degree ramp and never gains height pushing into it", () => {
    const start = at(NASTY_LEVEL_LANDMARKS.slope46Foot, facingToward(1, 0));
    const { states } = drive(start, 180, EAST);
    for (const state of states) {
      expect(state.position.y).toBeLessThanOrEqual(start.position.y + 0.05);
    }
  });

  it("cannot climb a 50 degree ramp either", () => {
    const start = at(NASTY_LEVEL_LANDMARKS.slope50Foot, facingToward(1, 0));
    const { states } = drive(start, 180, EAST);
    for (const state of states) {
      expect(state.position.y).toBeLessThanOrEqual(start.position.y + 0.05);
    }
  });

  it("classifies surfaces against the shipped 45 degree limit", () => {
    const normalAt = (degrees: number): Vec3 => ({
      x: Math.sin((degrees * Math.PI) / 180),
      y: Math.cos((degrees * Math.PI) / 180),
      z: 0,
    });
    expect(isWalkable(normalAt(0), params)).toBe(true);
    expect(isWalkable(normalAt(44), params)).toBe(true);
    expect(isWalkable(normalAt(45), params)).toBe(true);
    expect(isWalkable(normalAt(46), params)).toBe(false);
    expect(isWalkable(normalAt(50), params)).toBe(false);
    expect(isWalkable(normalAt(90), params)).toBe(false);
  });
});

describe("ledges", () => {
  it("walks off a 2m ledge, falls, and lands without damage", () => {
    const start = at(NASTY_LEVEL_LANDMARKS.ledgeTop, facingToward(1, 0));
    expect(start.position.y).toBeCloseTo(2 + params.capsule.skin, 6);

    let state = start;
    let landedFall = -1;
    let damaged = false;
    for (let tick = 0; tick < 240; tick += 1) {
      const stepped = stepMotion(state, push(EAST), queries, params);
      state = stepped.state;
      for (const event of stepped.events) {
        if (event.type === "landed") {
          landedFall = event.fallMeters;
        }
        if (event.type === "fallDamage") {
          damaged = true;
        }
      }
      if (landedFall >= 0) {
        break;
      }
    }
    expect(landedFall).toBeCloseTo(2, 2);
    expect(damaged).toBe(false);
    expect(state.grounded).toBe(true);
  });
});

describe("moveAndSlide", () => {
  it("cannot pass through a wall no matter how large the displacement", () => {
    const foot: Vec3 = { x: 0, y: params.capsule.skin, z: 3.5 };
    const result = moveAndSlide(
      queries,
      params,
      foot,
      { x: 0, y: 0, z: 1000 },
      { x: 0, y: 0, z: 1000 },
      false,
    );
    expect(result.position.z).toBeLessThan(level.bounds.maxZ);
    expect(result.contacts).toBeGreaterThan(0);
    expect(result.contacts).toBeLessThanOrEqual(params.collision.maxContacts);
  });

  it("reports a ceiling stop and kills upward velocity", () => {
    // Standing clear under the 1.9m slab, so the capsule fits but cannot rise far.
    const foot: Vec3 = { x: 5, y: params.capsule.skin, z: 0 };
    const headroom = 1.9 - params.capsule.height;
    const result = moveAndSlide(
      queries,
      params,
      foot,
      { x: 0, y: 2, z: 0 },
      { x: 0, y: 10, z: 0 },
      false,
    );
    expect(result.hitCeiling).toBe(true);
    expect(result.velocity.y).toBeLessThanOrEqual(0);
    expect(result.position.y).toBeLessThan(headroom + params.capsule.skin);
    expect(result.position.y).toBeGreaterThan(0);
  });

  it("moves the full displacement when nothing is in the way", () => {
    const foot: Vec3 = { x: 0, y: params.capsule.skin, z: 3.5 };
    const result = moveAndSlide(
      queries,
      params,
      foot,
      { x: 0.1, y: 0, z: 0 },
      { x: 6, y: 0, z: 0 },
      false,
    );
    expect(result.contacts).toBe(0);
    expect(result.position.x).toBeCloseTo(0.1, 12);
  });
});
