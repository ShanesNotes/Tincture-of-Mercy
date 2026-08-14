import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { createMotionState, hashMotionState, spawnMotionState, stepMotion } from "./motion";
import { parseMotionParams, type MotionParams } from "./params";
import { withDerivedGroundProbe } from "./queries";
import type {
  CapsuleSweepHit,
  CapsuleSweepQuery,
  CollisionQueries,
  MotionEvent,
  MotionInput,
  MotionState,
  RaycastHit,
  RaycastQuery,
  RootDisplacementClip,
} from "./types";

const rawText = readFileSync(new URL("../../data/motion_params.json", import.meta.url), "utf8");
const params: MotionParams = parseMotionParams(JSON.parse(rawText));

/**
 * An unbounded horizontal plane. Exact by construction, so kinematics
 * (jump apex, fall thresholds, breath drain) can be asserted to the millimetre
 * without geometry noise. Geometry behaviour is covered against the
 * nasty-geometry fixture in resolve.test.ts / motion.property.test.ts.
 */
const planeWorld = (floorY: number): CollisionQueries => {
  const sweepCapsule = (query: CapsuleSweepQuery): CapsuleSweepHit | null => {
    const lowest = query.capsule.start.y - query.capsule.radius;
    const surfaceContact = (fraction: number): CapsuleSweepHit => ({
      fraction,
      point: {
        x: query.capsule.start.x + query.displacement.x * fraction,
        y: floorY,
        z: query.capsule.start.z + query.displacement.z * fraction,
      },
      normal: { x: 0, y: 1, z: 0 },
      triangleIndex: 0,
    });

    if (lowest <= floorY) {
      return surfaceContact(0);
    }
    if (query.displacement.y >= 0) {
      return null;
    }
    const fraction = (floorY - lowest) / query.displacement.y;
    return fraction > 1 ? null : surfaceContact(fraction);
  };

  const raycast = (query: RaycastQuery): RaycastHit | null => {
    const length = Math.hypot(query.direction.x, query.direction.y, query.direction.z);
    if (length === 0) {
      throw new RangeError("ray direction must be non-zero");
    }
    const directionY = query.direction.y / length;
    if (directionY === 0) {
      return null;
    }
    const distance = (floorY - query.origin.y) / directionY;
    if (distance < 0 || distance > query.maxDistance) {
      return null;
    }
    return {
      distance,
      point: {
        x: query.origin.x + (query.direction.x / length) * distance,
        y: floorY,
        z: query.origin.z + (query.direction.z / length) * distance,
      },
      normal: { x: 0, y: directionY > 0 ? -1 : 1, z: 0 },
      triangleIndex: 0,
    };
  };

  return withDerivedGroundProbe({ raycast, sweepCapsule });
};

const voidWorld: CollisionQueries = {
  raycast: () => null,
  sweepCapsule: () => null,
  probeGround: () => null,
};

const idle: MotionInput = { moveX: 0, moveZ: 0, sprint: false, jump: false };
const forward: MotionInput = { moveX: 0, moveZ: -1, sprint: false, jump: false };

const run = (
  start: MotionState,
  queries: CollisionQueries,
  ticks: number,
  inputFor: (tick: number) => MotionInput,
): { state: MotionState; events: MotionEvent[]; states: MotionState[] } => {
  let state = start;
  const events: MotionEvent[] = [];
  const states: MotionState[] = [];
  for (let tick = 0; tick < ticks; tick += 1) {
    const stepped = stepMotion(state, inputFor(tick), queries, params);
    state = stepped.state;
    events.push(...stepped.events);
    states.push(state);
  }
  return { state, events, states };
};

const ground = planeWorld(0);
const spawn = (breath = 100): MotionState =>
  spawnMotionState(ground, params, { x: 0, y: 0.5, z: 0 }, 0, breath, 4);

describe("spawn and rest", () => {
  it("settles onto the surface with one skin width of clearance", () => {
    const state = spawn();
    expect(state.grounded).toBe(true);
    expect(state.position.y).toBeCloseTo(params.capsule.skin, 12);
    expect(state.locomotion).toBe("idle");
  });

  it("stays put and stays idle with no input", () => {
    const { state } = run(spawn(), ground, 60, () => idle);
    expect(state.position.x).toBeCloseTo(0, 12);
    expect(state.position.z).toBeCloseTo(0, 12);
    expect(state.position.y).toBeCloseTo(params.capsule.skin, 12);
    expect(state.locomotion).toBe("idle");
    expect(state.velocity.y).toBe(0);
  });

  it("falls when there is nothing underneath", () => {
    const { state } = run(createMotionState({ x: 0, y: 0, z: 0 }, 0, 100), voidWorld, 30, () => idle);
    expect(state.grounded).toBe(false);
    expect(state.locomotion).toBe("airborne");
    expect(state.position.y).toBeLessThan(-1);
  });

  it("clamps fall speed at terminal velocity", () => {
    const { state } = run(createMotionState({ x: 0, y: 0, z: 0 }, 0, 100), voidWorld, 2000, () => idle);
    expect(state.velocity.y).toBe(-params.gravity.terminalSpeedMetersPerSecond);
  });
});

describe("locomotion bands", () => {
  it("reaches run speed on full stick and reports run", () => {
    const { state } = run(spawn(), ground, 120, () => forward);
    expect(Math.hypot(state.velocity.x, state.velocity.z)).toBeCloseTo(params.speeds.run, 6);
    expect(state.locomotion).toBe("run");
    expect(state.position.z).toBeLessThan(-5);
  });

  it("holds the walk band on a light stick deflection", () => {
    const light: MotionInput = { moveX: 0, moveZ: -0.3, sprint: false, jump: false };
    const { state } = run(spawn(), ground, 120, () => light);
    const speed = Math.hypot(state.velocity.x, state.velocity.z);
    expect(speed).toBeLessThan(params.speeds.walk);
    expect(speed).toBeGreaterThan(0);
    expect(state.locomotion).toBe("walk");
  });

  it("sprints faster than it runs and drains Breath at 11 per second", () => {
    const sprint: MotionInput = { moveX: 0, moveZ: -1, sprint: true, jump: false };
    const { state, events } = run(spawn(), ground, 60, () => sprint);
    expect(state.locomotion).toBe("sprint");
    expect(Math.hypot(state.velocity.x, state.velocity.z)).toBeCloseTo(
      params.speeds.run * params.speeds.sprintMultiplier,
      6,
    );
    expect(state.breath).toBeCloseTo(100 - params.breath.sprintDrainPerSecond, 9);
    const drains = events.filter((event) => event.type === "breathSpent");
    expect(drains).toHaveLength(60);
  });

  it("drops out of sprint when Breath runs out", () => {
    const sprint: MotionInput = { moveX: 0, moveZ: -1, sprint: true, jump: false };
    const { state } = run(spawn(2), ground, 120, () => sprint);
    expect(state.breath).toBe(0);
    expect(state.locomotion).toBe("run");
  });

  it("decelerates to idle when the stick is released", () => {
    const accelerated = run(spawn(), ground, 60, () => forward).state;
    const { state } = run(accelerated, ground, 60, () => idle);
    expect(Math.hypot(state.velocity.x, state.velocity.z)).toBe(0);
    expect(state.locomotion).toBe("idle");
  });

  it("turns toward the stick at the authored rate rather than snapping", () => {
    const back: MotionInput = { moveX: 0, moveZ: 1, sprint: false, jump: false };
    const start = spawn();
    const afterOne = stepMotion(start, back, ground, params).state;
    expect(Math.abs(afterOne.facing)).toBeGreaterThan(0);
    expect(Math.abs(afterOne.facing)).toBeLessThan(Math.PI);
    const settled = run(afterOne, ground, 120, () => back).state;
    expect(Math.abs(Math.abs(settled.facing) - Math.PI)).toBeLessThan(1e-9);
  });

  it("can turn in place without carrying existing horizontal velocity", () => {
    const start: MotionState = {
      ...spawn(),
      velocity: { x: 3, y: 0, z: -4 },
    };

    const turned = stepMotion(
      start,
      { moveX: 1, moveZ: 0, sprint: false, jump: false, turnOnly: true },
      ground,
      params,
    ).state;

    expect(turned.facing).not.toBe(start.facing);
    expect(turned.position.x).toBe(start.position.x);
    expect(turned.position.y).toBeCloseTo(start.position.y, 12);
    expect(turned.position.z).toBe(start.position.z);
    expect(Math.hypot(turned.velocity.x, turned.velocity.y, turned.velocity.z)).toBe(0);
    expect(turned.grounded).toBe(true);
    expect(turned.locomotion).toBe("idle");
  });
});

describe("jump", () => {
  const jumpInput: MotionInput = { moveX: 0, moveZ: 0, sprint: false, jump: true };

  it("costs 22 Breath and reports the spend", () => {
    const { state, events } = stepMotion(spawn(), jumpInput, ground, params);
    expect(state.breath).toBe(100 - params.jump.breathCost);
    expect(events).toContainEqual({ type: "jumped", tick: 1, breathCost: 22 });
    expect(events).toContainEqual({ type: "breathSpent", tick: 1, amount: 22, reason: "jump" });
    expect(state.locomotion).toBe("jump");
    expect(state.grounded).toBe(false);
  });

  it("reaches the authored 1.2m apex", () => {
    const start = spawn();
    const { states } = run(start, ground, 60, (tick) => (tick === 0 ? jumpInput : idle));
    const apex = Math.max(...states.map((state) => state.position.y));
    expect(apex - start.position.y).toBeCloseTo(params.jump.apexMeters, 3);
  });

  it("lands back on the surface, reporting the fall and taking no damage", () => {
    const { state, events } = run(spawn(), ground, 60, (tick) => (tick === 0 ? jumpInput : idle));
    const landed = events.filter((event) => event.type === "landed");
    expect(landed).toHaveLength(1);
    const [landing] = landed;
    expect(landing?.type === "landed" ? landing.fallMeters : -1).toBeCloseTo(
      params.jump.apexMeters,
      2,
    );
    expect(events.some((event) => event.type === "fallDamage")).toBe(false);
    expect(state.grounded).toBe(true);
    expect(state.position.y).toBeCloseTo(params.capsule.skin, 9);
  });

  it("is refused without the Breath to pay for it", () => {
    const { state, events } = stepMotion(spawn(21), jumpInput, ground, params);
    expect(events.some((event) => event.type === "jumped")).toBe(false);
    expect(state.grounded).toBe(true);
    expect(state.breath).toBe(21);
  });

  it("is coyote-less: refused the instant the ground is gone", () => {
    const airborne = run(createMotionState({ x: 0, y: 0, z: 0 }, 0, 100), voidWorld, 5, () => idle)
      .state;
    const { state, events } = stepMotion(airborne, jumpInput, voidWorld, params);
    expect(events.some((event) => event.type === "jumped")).toBe(false);
    expect(state.breath).toBe(100);
  });

  it("cannot be repeated in the air", () => {
    const { events } = run(spawn(), ground, 20, () => jumpInput);
    expect(events.filter((event) => event.type === "jumped")).toHaveLength(1);
  });

  it("applies only the airborne fraction of ground control while off the ground", () => {
    const jumping = stepMotion(spawn(), jumpInput, ground, params).state;
    const airStep = stepMotion(jumping, forward, ground, params).state;
    const groundStep = stepMotion(spawn(), forward, ground, params).state;
    const airSpeed = Math.hypot(airStep.velocity.x, airStep.velocity.z);
    const groundSpeed = Math.hypot(groundStep.velocity.x, groundStep.velocity.z);
    expect(airSpeed).toBeCloseTo(groundSpeed * params.air.controlFactor, 9);
  });
});

describe("landing lag and fall damage", () => {
  /** Drops from an exact height and stops on the tick the actor lands, so the landing state is observable. */
  const fallFrom = (height: number): { state: MotionState; events: MotionEvent[] } => {
    let state: MotionState = {
      ...createMotionState({ x: 0, y: height + params.capsule.skin, z: 0 }, 0, 100),
      fallStartY: height + params.capsule.skin,
    };
    const events: MotionEvent[] = [];
    for (let tick = 0; tick < 400; tick += 1) {
      const stepped = stepMotion(state, forward, ground, params);
      state = stepped.state;
      events.push(...stepped.events);
      if (stepped.events.some((event) => event.type === "landed")) {
        return { state, events };
      }
    }
    throw new Error("never landed");
  };

  it("takes no damage landing from exactly the safe height", () => {
    const { events } = fallFrom(params.fallDamage.safeMeters);
    const landed = events.find((event) => event.type === "landed");
    expect(landed?.type === "landed" ? landed.fallMeters : -1).toBeCloseTo(6, 9);
    expect(events.some((event) => event.type === "fallDamage")).toBe(false);
  });

  it("takes damage a millimetre past the safe height", () => {
    const { events, state } = fallFrom(params.fallDamage.safeMeters + 0.001);
    const damage = events.find((event) => event.type === "fallDamage");
    expect(damage).toBeDefined();
    expect(damage?.type === "fallDamage" ? damage.pulseFraction : 0).toBeGreaterThan(0);
    expect(state.locomotion).toBe("fallDamage");
    expect(state.lagTicks).toBe(params.landing.fallDamageLagTicks);
  });

  it("is fully lethal from the lethal height", () => {
    const { events } = fallFrom(params.fallDamage.lethalMeters);
    const damage = events.find((event) => event.type === "fallDamage");
    expect(damage?.type === "fallDamage" ? damage.pulseFraction : 0).toBe(1);
  });

  it("uses the soft landing lag for a short drop and the hard one past the threshold", () => {
    const soft = fallFrom(params.landing.hardLandingMeters - 1).events.find(
      (event) => event.type === "landed",
    );
    const hard = fallFrom(params.landing.hardLandingMeters + 1).events.find(
      (event) => event.type === "landed",
    );
    expect(soft?.type === "landed" ? soft.lagTicks : -1).toBe(params.landing.softLagTicks);
    expect(hard?.type === "landed" ? hard.lagTicks : -1).toBe(params.landing.hardLagTicks);
  });

  it("ignores movement input while landing lag is committed", () => {
    const start: MotionState = {
      ...createMotionState({ x: 0, y: 4 + params.capsule.skin, z: 0 }, 0, 100),
      fallStartY: 4 + params.capsule.skin,
    };
    let state = start;
    for (let tick = 0; tick < 60; tick += 1) {
      const stepped = stepMotion(state, forward, ground, params);
      state = stepped.state;
      if (state.locomotion === "land" && state.lagTicks > 0) {
        const held = stepMotion(state, forward, ground, params).state;
        expect(Math.hypot(held.velocity.x, held.velocity.z)).toBeLessThanOrEqual(
          Math.hypot(state.velocity.x, state.velocity.z) + 1e-12,
        );
        expect(held.lagTicks).toBe(state.lagTicks - 1);
        return;
      }
    }
    throw new Error("never landed");
  });
});

describe("root displacement hosting", () => {
  const clip = (deltas: readonly number[]): RootDisplacementClip => {
    const rootXZ: [number, number][] = [[0, 0]];
    let travelled = 0;
    for (const delta of deltas) {
      travelled += delta;
      rootXZ.push([0, travelled]);
    }
    return { clipId: "roll", ticks: rootXZ.length, rootXZ };
  };

  it("applies the sidecar's per-tick rootXZ deltas and ends the clip", () => {
    const roll = clip([0.2, 0.3, 0.25, 0.1]);
    const start = spawn();
    const { state, events, states } = run(start, ground, 6, (tick) =>
      tick === 0 ? { ...idle, beginDisplacement: roll } : idle,
    );
    expect(events).toContainEqual({ type: "displacementStarted", tick: 1, clipId: "roll" });
    expect(events).toContainEqual({ type: "displacementEnded", tick: 4, clipId: "roll" });
    expect(states[0]?.locomotion).toBe("displaced");
    expect(state.displacement).toBeNull();
    expect(state.position.z - start.position.z).toBeCloseTo(0.85, 9);
  });

  it("rotates the clip into the facing latched when it began", () => {
    const roll = clip([0.5]);
    const start: MotionState = { ...spawn(), facing: Math.PI / 2 };
    const { state } = run(start, ground, 2, (tick) =>
      tick === 0 ? { ...idle, beginDisplacement: roll } : idle,
    );
    expect(state.position.x - start.position.x).toBeCloseTo(0.5, 9);
    expect(state.position.z - start.position.z).toBeCloseTo(0, 9);
  });

  it("uses a combat-authored facing override for the actor and a newly hosted clip", () => {
    const roll = clip([0.5, 0.5]);
    const override = Math.PI / 2;
    const state = stepMotion(
      spawn(),
      { ...idle, beginDisplacement: roll, facingOverride: override },
      ground,
      params,
    ).state;

    expect(state.facing).toBe(override);
    expect(state.displacement?.facing).toBe(override);
    expect(state.position.x).toBeCloseTo(0.5, 9);
    expect(state.position.z).toBeCloseTo(0, 9);
  });

  it("suppresses stick control while a clip is hosted", () => {
    const roll = clip([0.1, 0.1, 0.1, 0.1, 0.1, 0.1]);
    const { states } = run(spawn(), ground, 4, (tick) =>
      tick === 0 ? { ...forward, beginDisplacement: roll } : forward,
    );
    for (const state of states) {
      expect(state.locomotion).toBe("displaced");
      expect(Math.hypot(state.velocity.x, state.velocity.z)).toBe(0);
    }
  });

  it("ends the previous clip when a new one is handed over, and on cancel", () => {
    const first = clip([0.1, 0.1, 0.1, 0.1]);
    const second = clip([0.2, 0.2, 0.2, 0.2]);
    const started = stepMotion(spawn(), { ...idle, beginDisplacement: first }, ground, params).state;
    const replaced = stepMotion(started, { ...idle, beginDisplacement: second }, ground, params);
    expect(replaced.events).toContainEqual({
      type: "displacementEnded",
      tick: 2,
      clipId: "roll",
    });
    const cancelled = stepMotion(replaced.state, { ...idle, cancelDisplacement: true }, ground, params);
    expect(cancelled.state.displacement).toBeNull();
    expect(cancelled.state.locomotion).not.toBe("displaced");
  });

  it("rejects malformed clips", () => {
    const bad: RootDisplacementClip = { clipId: "bad", ticks: 3, rootXZ: [[0, 0]] };
    expect(() => stepMotion(spawn(), { ...idle, beginDisplacement: bad }, ground, params)).toThrow(
      RangeError,
    );
    expect(() =>
      stepMotion(
        spawn(),
        { ...idle, beginDisplacement: { clipId: "bad", ticks: 1, rootXZ: [[0, 0]] } },
        ground,
        params,
      ),
    ).toThrow(RangeError);
  });

  it("rejects non-finite stick input", () => {
    expect(() => stepMotion(spawn(), { ...idle, moveX: Number.NaN }, ground, params)).toThrow(
      RangeError,
    );
  });
});

describe("hashMotionState", () => {
  it("is stable for equal states and sensitive to any field", () => {
    const a = spawn();
    const b = spawn();
    expect(hashMotionState(a)).toBe(hashMotionState(b));
    expect(hashMotionState({ ...a, tick: 1 })).not.toBe(hashMotionState(a));
    expect(hashMotionState({ ...a, position: { ...a.position, x: 1e-9 } })).not.toBe(
      hashMotionState(a),
    );
  });

  it("survives a JSON round trip, proving the state is plain data", () => {
    const { state } = run(spawn(), ground, 30, () => forward);
    const revived = JSON.parse(JSON.stringify(state)) as MotionState;
    expect(hashMotionState(revived)).toBe(hashMotionState(state));
    expect(hashMotionState(stepMotion(revived, forward, ground, params).state)).toBe(
      hashMotionState(stepMotion(state, forward, ground, params).state),
    );
  });
});
