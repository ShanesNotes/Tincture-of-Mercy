import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { SeededRng } from "../rng";
import { hashMotionState, motionCapsule, spawnMotionState, stepMotion } from "./motion";
import {
  BruteForceQueries,
  NASTY_LEVEL_LANDMARKS,
  closestDistanceToLevel,
  createNastyLevel,
} from "./nasty_level";
import { fallDamageFraction, parseMotionParams, type MotionParams } from "./params";
import type { MotionInput, MotionState, RootDisplacementClip } from "./types";

const rawText = readFileSync(new URL("../../data/motion_params.json", import.meta.url), "utf8");
const params: MotionParams = parseMotionParams(JSON.parse(rawText));

const level = createNastyLevel();
const queries = new BruteForceQueries(level);

const RANDOM_WALK_TICKS = 2000;
const SPAWN_DROP = 6;

/** Deterministic float in [0, 1) from the sim's own xorshift — Math.random is banned in src/sim. */
const nextFloat = (rng: SeededRng): number => rng.nextUint32() / 0x1_0000_0000;

/**
 * A scripted random walk: a seeded input tape, replayable exactly. Direction
 * changes every few ticks so the actor is driven into stairs, slopes, corners
 * and ledges rather than orbiting one feature.
 */
const inputScript = (seed: number, ticks: number): MotionInput[] => {
  const rng = new SeededRng(seed);
  const script: MotionInput[] = [];
  let moveX = 0;
  let moveZ = 0;
  let sprint = false;
  for (let tick = 0; tick < ticks; tick += 1) {
    if (tick % 7 === 0) {
      const angle = nextFloat(rng) * Math.PI * 2;
      const magnitude = nextFloat(rng);
      moveX = Math.sin(angle) * magnitude;
      moveZ = Math.cos(angle) * magnitude;
      sprint = nextFloat(rng) > 0.5;
    }
    script.push({ moveX, moveZ, sprint, jump: tick % 23 === 0 });
  }
  return script;
};

const replay = (
  start: MotionState,
  script: readonly MotionInput[],
): { readonly state: MotionState; readonly hashes: readonly string[] } => {
  let state = start;
  const hashes: string[] = [];
  for (const input of script) {
    state = stepMotion(state, input, queries, params).state;
    hashes.push(hashMotionState(state));
  }
  return { state, hashes };
};

const spawnAt = (name: keyof typeof NASTY_LEVEL_LANDMARKS): MotionState =>
  spawnMotionState(queries, params, NASTY_LEVEL_LANDMARKS[name], 0, 1e6, SPAWN_DROP);

describe("property: the actor never leaves the world", () => {
  it("stays inside the sealed arena across a 2000 tick random walk", () => {
    const start = spawnAt("flatStart");
    const script = inputScript(0x5eed_1234, RANDOM_WALK_TICKS);
    const margin = params.capsule.radius - params.capsule.skin;

    let state = start;
    let worstClearance = Number.POSITIVE_INFINITY;
    for (const input of script) {
      state = stepMotion(state, input, queries, params).state;
      expect(Number.isFinite(state.position.x)).toBe(true);
      expect(state.position.x).toBeGreaterThan(level.bounds.minX - margin);
      expect(state.position.x).toBeLessThan(level.bounds.maxX + margin);
      expect(state.position.z).toBeGreaterThan(level.bounds.minZ - margin);
      expect(state.position.z).toBeLessThan(level.bounds.maxZ + margin);
      expect(state.position.y).toBeGreaterThan(-1);
      worstClearance = Math.min(
        worstClearance,
        closestDistanceToLevel(level, motionCapsule(state, params)),
      );
    }
    // Sliding contacts may sit inside the skin, but never deeply inside geometry.
    expect(worstClearance).toBeGreaterThan(params.capsule.radius - params.capsule.skin * 2);
  }, 120_000);

  it("cannot be tunnelled through a wall by an extreme displacement clip", () => {
    const stride = 40;
    const rootXZ: [number, number][] = [];
    for (let tick = 0; tick < 12; tick += 1) {
      rootXZ.push([0, tick * stride]);
    }
    const bullet: RootDisplacementClip = { clipId: "bullet", ticks: rootXZ.length, rootXZ };

    for (const facing of [0, Math.PI / 2, Math.PI, -Math.PI / 2, 0.7, 2.4]) {
      let state: MotionState = { ...spawnAt("flatStart"), facing };
      for (let tick = 0; tick < rootXZ.length; tick += 1) {
        const input: MotionInput = {
          moveX: 0,
          moveZ: 0,
          sprint: false,
          jump: false,
          ...(tick === 0 ? { beginDisplacement: bullet } : {}),
        };
        state = stepMotion(state, input, queries, params).state;
        expect(state.position.x).toBeGreaterThan(level.bounds.minX - params.capsule.radius);
        expect(state.position.x).toBeLessThan(level.bounds.maxX + params.capsule.radius);
        expect(state.position.z).toBeGreaterThan(level.bounds.minZ - params.capsule.radius);
        expect(state.position.z).toBeLessThan(level.bounds.maxZ + params.capsule.radius);
      }
    }
  }, 60_000);

  it("cannot be tunnelled by sprinting at a wall for a full minute", () => {
    let state = spawnMotionState(
      queries,
      params,
      { x: 10, y: 0, z: 3.5 },
      Math.PI / 2,
      1e6,
      SPAWN_DROP,
    );
    const input: MotionInput = { moveX: 1, moveZ: 0, sprint: true, jump: false };
    for (let tick = 0; tick < 3600; tick += 1) {
      state = stepMotion(state, input, queries, params).state;
    }
    expect(state.position.x).toBeLessThan(level.bounds.maxX);
    expect(closestDistanceToLevel(level, motionCapsule(state, params))).toBeGreaterThan(
      params.capsule.radius - params.capsule.skin * 2,
    );
  }, 60_000);
});

describe("property: sliding never gains height", () => {
  const pushInto = (
    landmark: keyof typeof NASTY_LEVEL_LANDMARKS,
    direction: { x: number; z: number },
  ): void => {
    let state = spawnAt(landmark);
    const ceiling = state.position.y;
    const input: MotionInput = { moveX: direction.x, moveZ: direction.z, sprint: true, jump: false };
    for (let tick = 0; tick < 240; tick += 1) {
      state = stepMotion(state, input, queries, params).state;
      expect(state.position.y).toBeLessThanOrEqual(ceiling + 0.05);
    }
  };

  it("holds on a 46 degree slope", () => {
    pushInto("slope46Foot", { x: 1, z: 0 });
  }, 60_000);

  it("holds on a 50 degree slope", () => {
    pushInto("slope50Foot", { x: 1, z: 0 });
  }, 60_000);

  it("holds in the acute wedge", () => {
    pushInto("wedgeApproach", { x: 0, z: 1 });
  }, 60_000);

  it("holds against a staircase too tall to climb", () => {
    pushInto("highStairsFoot", { x: 1, z: 0 });
  }, 60_000);
});

describe("property: the step height is a hard bound", () => {
  it("never climbs more than the step height in one tick, anywhere", () => {
    const start = spawnAt("flatStart");
    const script = inputScript(0x1234_abcd, 900);
    let state = start;
    for (const input of script) {
      const previous = state;
      state = stepMotion(state, input, queries, params).state;
      const climb = state.position.y - previous.position.y;
      const airborneAllowance = previous.grounded
        ? 0
        : Math.abs(previous.velocity.y) / params.tickHz + 1e-6;
      expect(climb).toBeLessThanOrEqual(
        params.collision.stepHeight + airborneAllowance + 1e-6,
      );
    }
  }, 60_000);
});

describe("property: fall damage thresholds are exact", () => {
  it("is zero at or under the safe height and positive above it, for every sampled fall", () => {
    for (let meters = 0; meters <= 20; meters += 0.05) {
      const rounded = Math.round(meters * 1000) / 1000;
      const damage = fallDamageFraction(params, rounded);
      if (rounded <= params.fallDamage.safeMeters) {
        expect(damage).toBe(0);
      } else {
        expect(damage).toBeGreaterThan(0);
      }
      if (rounded >= params.fallDamage.lethalMeters) {
        expect(damage).toBe(1);
      }
    }
  });

  it("emits the fall-damage event exactly when the drop passes the safe height", () => {
    const dropFrom = (height: number): number => {
      let state: MotionState = {
        ...spawnAt("flatStart"),
        position: { x: 0, y: height, z: 3.5 },
        grounded: false,
        fallStartY: height,
      };
      const input: MotionInput = { moveX: 0, moveZ: 0, sprint: false, jump: false };
      for (let tick = 0; tick < 400; tick += 1) {
        const stepped = stepMotion(state, input, queries, params);
        state = stepped.state;
        const damage = stepped.events.find((event) => event.type === "fallDamage");
        if (damage !== undefined && damage.type === "fallDamage") {
          return damage.pulseFraction;
        }
        if (stepped.events.some((event) => event.type === "landed")) {
          return 0;
        }
      }
      throw new Error("never landed");
    };

    const skin = params.capsule.skin;
    expect(dropFrom(params.fallDamage.safeMeters + skin)).toBe(0);
    expect(dropFrom(params.fallDamage.safeMeters + skin + 0.01)).toBeGreaterThan(0);
    expect(dropFrom(params.fallDamage.lethalMeters + skin)).toBe(1);
  }, 60_000);
});

describe("property: determinism", () => {
  it("produces an identical state hash for the same 2000 tick input script", () => {
    const script = inputScript(0x0bad_c0de, RANDOM_WALK_TICKS);
    const first = replay(spawnAt("flatStart"), script);
    const second = replay(spawnAt("flatStart"), script);
    expect(second.state).toEqual(first.state);
    expect(second.hashes).toEqual(first.hashes);
  }, 120_000);

  it("is unaffected by serialising the state mid-replay", () => {
    const script = inputScript(0x0bad_c0de, 600);
    const straight = replay(spawnAt("flatStart"), script);

    let state = spawnAt("flatStart");
    const hashes: string[] = [];
    for (const input of script) {
      const revived = JSON.parse(JSON.stringify(state)) as MotionState;
      state = stepMotion(revived, input, queries, params).state;
      hashes.push(hashMotionState(state));
    }
    expect(hashes).toEqual(straight.hashes.slice(0, hashes.length));
  }, 120_000);

  it("gives different seeds different tapes, so the walk is really exploring", () => {
    const a = replay(spawnAt("flatStart"), inputScript(1, 240));
    const b = replay(spawnAt("flatStart"), inputScript(2, 240));
    expect(hashMotionState(a.state)).not.toBe(hashMotionState(b.state));
  }, 60_000);
});
