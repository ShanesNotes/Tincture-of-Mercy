/**
 * Spacing law: the three round-one defects the scenario pack measured, as
 * executable gates.
 *
 *   (c) the 4.0-5.5 m dead zone — a distance at which no authored row was legal
 *       and the Warden stood in neutral for thousands of ticks;
 *   (d) hug-is-total-defence — no P1 row reached inside 0.8 m, so a player
 *       standing at contact took the Warden's whole 720 Pulse untouched;
 *   (e) `warden_p1_stomp_snare_kick` was never selected in any scripted run,
 *       and only three distinct P1 moves appeared in 5 000 ticks (SC-F row 1).
 *
 * Everything here is measured off the shipped `warden_params.json`, so a retune
 * that reopens any of the three fails the build.
 */

import { describe, expect, it } from "vitest";

import { WARDEN_PARAMS, WARDEN_RING } from "./fixtures.test";
import { selectWardenMove, stanceFor } from "./select";
import type { WardenPhase, WardenState } from "./types";
import { createWardenState, stepWarden } from "./warden";

const PHASES: readonly WardenPhase[] = ["p1", "p2"];

/** 5 cm is a quarter of Kalev's capsule radius: finer than any authored band. */
const SWEEP_STEP_METERS = 0.05;

const restedState = (phase: WardenPhase): WardenState => ({
  ...createWardenState({
    x: WARDEN_RING.centerX,
    z: WARDEN_RING.centerZ,
    pulse: 720,
    maxPulse: 720,
  }),
  phase,
  ceremonyDone: phase === "p2",
  // Past every authored cooldown, so the sweep measures the range table alone.
  tick: 10_000,
});

const targetAt = (distance: number): { readonly x: number; readonly z: number } => ({
  x: WARDEN_RING.centerX + distance,
  z: WARDEN_RING.centerZ,
});

/** The stance the FSM itself holds at this distance — never an assumed one. */
const pickAt = (state: WardenState, distance: number): string | null => {
  const target = targetAt(distance);
  const stance = stanceFor(WARDEN_PARAMS, state, target.x, target.z);
  return selectWardenMove(WARDEN_PARAMS, WARDEN_RING, { ...state, stance }, target.x, target.z)
    .moveId;
};

const deepestReach = (phase: WardenPhase): number =>
  Math.min(
    Math.max(...WARDEN_PARAMS.phases[phase].moves.map((move) => move.maxRangeMeters)),
    WARDEN_PARAMS.selection.engageRangeMeters,
  );

/** One scripted watch: the player stands still, the Warden does as he likes. */
const standingWatch = (
  phase: WardenPhase,
  standoffMeters: number,
  ticks: number,
): readonly string[] => {
  let state = { ...restedState(phase), tick: 0 };
  const target = targetAt(standoffMeters);
  const selected: string[] = [];
  for (let tick = 0; tick < ticks; tick += 1) {
    const stepped = stepWarden(WARDEN_PARAMS, WARDEN_RING, state, {
      targetX: target.x,
      targetZ: target.z,
    });
    state = stepped.state;
    for (const event of stepped.events) {
      if (event.type === "move-selected") selected.push(event.moveId);
    }
  }
  return selected;
};

describe("(c) no dead zone inside his own reach", () => {
  it.each(PHASES.map((phase) => ({ phase })))(
    "$phase: every distance inside the deepest authored reach has a legal answer",
    ({ phase }) => {
      const state = restedState(phase);
      const limit = deepestReach(phase);
      const holes: number[] = [];
      for (let step = 0; step * SWEEP_STEP_METERS <= limit; step += 1) {
        const distance = step * SWEEP_STEP_METERS;
        if (pickAt(state, distance) === null) holes.push(distance);
      }
      expect(holes.map((distance) => distance.toFixed(2))).toEqual([]);
    },
  );

  it("answers the measured 4.1 m clamp that used to freeze him in neutral", () => {
    expect(pickAt(restedState("p1"), 4.1)).toBe("warden_p1_two_step_chop");
  });

  it("opens the step-back stance exactly where the bait's range opens", () => {
    const bait = WARDEN_PARAMS.phases.p1.moves.find((move) => move.tellClass === "bait");
    expect(bait?.minRangeMeters).toBe(WARDEN_PARAMS.selection.stepBackRangeMeters);
  });

  it("closes the gap himself past the deepest reach, so neutral is never idle", () => {
    const beyond = deepestReach("p1") + 1;
    const state = { ...restedState("p1"), tick: 0 };
    expect(pickAt(state, beyond)).toBeNull();
    const target = targetAt(beyond);
    const stepped = stepWarden(WARDEN_PARAMS, WARDEN_RING, state, {
      targetX: target.x,
      targetZ: target.z,
    });
    expect(stepped.state.x).toBeGreaterThan(state.x);
    expect(Math.hypot(target.x - stepped.state.x, target.z - stepped.state.z)).toBeLessThan(beyond);
  });
});

describe("(d) hugging him is not a defence", () => {
  it("answers a player standing at contact in Phase 1 with the stomp", () => {
    const state = restedState("p1");
    for (const distance of [0, 0.3, 0.55, 0.65]) {
      expect(pickAt(state, distance)).toBe("warden_p1_stomp_snare_kick");
    }
  });

  it("answers a player standing at contact in Phase 2 with a damaging row", () => {
    const state = restedState("p2");
    for (const distance of [0, 0.3, 0.55, 0.65]) {
      const picked = pickAt(state, distance);
      const move = WARDEN_PARAMS.phases.p2.moves.find((entry) => entry.moveId === picked);
      expect(move?.clip.pulseDamage ?? 0).toBeGreaterThan(0);
    }
  });

  it.each(PHASES.map((phase) => ({ phase })))(
    "$phase: the anti-repeat cap narrows his choice at contact but never silences him",
    ({ phase }) => {
      const rested = restedState(phase);
      const first = pickAt(rested, 0.55);
      expect(first).not.toBeNull();
      const capped: WardenState = {
        ...rested,
        lastMoveId: first,
        consecutiveMoveCount: WARDEN_PARAMS.selection.sameMoveMaxConsecutive,
      };
      expect(pickAt(capped, 0.55)).not.toBeNull();
    },
  );

  it("still refuses a third repeat when the range table offers an alternative", () => {
    const rested = restedState("p1");
    const first = pickAt(rested, 2.0);
    const capped: WardenState = {
      ...rested,
      lastMoveId: first,
      consecutiveMoveCount: WARDEN_PARAMS.selection.sameMoveMaxConsecutive,
    };
    expect(pickAt(capped, 2.0)).not.toBe(first);
  });

  it("keeps hitting a player who never leaves contact range", () => {
    // The SC-G stance, headless: the driver holds 0.55 m whatever the Warden
    // does, which is exactly the stance that used to take zero damage.
    let state = { ...restedState("p1"), tick: 0 };
    const selected: string[] = [];
    for (let tick = 0; tick < 1_000; tick += 1) {
      const stepped = stepWarden(WARDEN_PARAMS, WARDEN_RING, state, {
        targetX: state.x + 0.55,
        targetZ: state.z,
      });
      state = stepped.state;
      for (const event of stepped.events) {
        if (event.type === "move-selected") selected.push(event.moveId);
      }
    }
    expect(selected.length).toBeGreaterThan(4);
    expect(new Set(selected)).toEqual(new Set(["warden_p1_stomp_snare_kick"]));
  });
});

describe("(e) the whole authored table rotates", () => {
  it("never lets authored weight starve a row out of the rotation", () => {
    for (const phase of PHASES) {
      const weights = WARDEN_PARAMS.phases[phase].moves.map((move) => move.weight);
      const spread = Math.max(...weights) - Math.min(...weights);
      expect(spread * WARDEN_PARAMS.selection.weightScoreScale).toBeLessThan(
        WARDEN_PARAMS.selection.cooldownScoreCapTicks,
      );
    }
  });

  it("provokes at least five distinct P1 moves in 5 000 ticks, the stomp among them", () => {
    // The SC-F row-1 watch, headless: Kalev stands in the ring and the FSM
    // rotates. The pack measured three distinct moves here.
    for (const standoff of [0.5, 2, 3, 4.1]) {
      const selected = standingWatch("p1", standoff, 5_000);
      const distinct = new Set(selected);
      expect(distinct.size, `standoff ${String(standoff)} m: ${[...distinct].join(", ")}`)
        .toBeGreaterThanOrEqual(5);
      expect([...distinct]).toContain("warden_p1_stomp_snare_kick");
    }
  });

  it("still selects deterministically — the same watch twice is the same list", () => {
    expect(standingWatch("p1", 2, 1_200)).toEqual(standingWatch("p1", 2, 1_200));
  });
});
