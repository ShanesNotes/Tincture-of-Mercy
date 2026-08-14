/**
 * Deterministic move selection: cooldown weighting, range gating, and the three
 * punish-fairness constraints (contract deliverable 1).
 */

import { describe, expect, it } from "vitest";

import { WARDEN_PARAMS, WARDEN_RING } from "./fixtures.test";
import { selectWardenMove, stanceFor } from "./select";
import type { WardenPhase, WardenState } from "./types";
import { createWardenState } from "./warden";

const baseState = (phase: WardenPhase = "p1"): WardenState => ({
  ...createWardenState({
    x: WARDEN_RING.centerX,
    z: WARDEN_RING.centerZ,
    pulse: 900,
    maxPulse: 900,
  }),
  phase,
  ceremonyDone: phase === "p2",
  tick: 10_000,
});

const targetAt = (distance: number): { readonly x: number; readonly z: number } => ({
  x: WARDEN_RING.centerX + distance,
  z: WARDEN_RING.centerZ,
});

const pick = (state: WardenState, distance: number): string | null => {
  const target = targetAt(distance);
  return selectWardenMove(WARDEN_PARAMS, WARDEN_RING, state, target.x, target.z).moveId;
};

describe("range gating", () => {
  it("picks a melee answer in close and a ranged answer far out", () => {
    const state = { ...baseState("p2"), stance: "closed" as const };
    const close = pick(state, 2.0);
    const far = pick(state, 7.0);
    expect(close).not.toBeNull();
    expect(far).not.toBeNull();
    expect(close).not.toBe(far);
    const closeMove = WARDEN_PARAMS.phases.p2.moves.find((move) => move.moveId === close);
    const farMove = WARDEN_PARAMS.phases.p2.moves.find((move) => move.moveId === far);
    expect(closeMove?.maxRangeMeters).toBeLessThan(farMove?.maxRangeMeters ?? 0);
  });

  it("selects nothing outside every authored range band", () => {
    expect(pick(baseState("p1"), 40)).toBeNull();
  });

  it("reports the rejection reason for every filtered candidate", () => {
    const target = targetAt(40);
    const selection = selectWardenMove(
      WARDEN_PARAMS,
      WARDEN_RING,
      baseState("p1"),
      target.x,
      target.z,
    );
    expect(selection.moveId).toBeNull();
    expect(selection.candidates.every((candidate) => candidate.rejected === "range")).toBe(true);
  });
});

describe("cooldown weighting", () => {
  it("skips a move still inside its cooldown and takes the next-best", () => {
    const state = baseState("p1");
    const first = pick(state, 2.0);
    if (first === null) throw new Error("expected a P1 melee answer");
    const cooled: WardenState = {
      ...state,
      lastUsedTick: { [first]: state.tick - 1 },
    };
    const second = pick(cooled, 2.0);
    expect(second).not.toBe(first);
    expect(second).not.toBeNull();
  });

  it("breaks ties toward the move he has left alone the longest", () => {
    const state = baseState("p1");
    const target = targetAt(2.0);
    const selection = selectWardenMove(
      WARDEN_PARAMS,
      WARDEN_RING,
      state,
      target.x,
      target.z,
    );
    const legal = selection.candidates.filter((candidate) => candidate.rejected === null);
    expect(legal.length).toBeGreaterThan(1);
    const best = legal.reduce((left, right) => (right.score > left.score ? right : left));
    expect(selection.moveId).toBe(best.moveId);
  });

  it("is a pure function of state — same input, same pick", () => {
    const state = baseState("p2");
    const target = targetAt(2.0);
    const runs = Array.from({ length: 8 }, () =>
      selectWardenMove(WARDEN_PARAMS, WARDEN_RING, state, target.x, target.z),
    );
    expect(new Set(runs.map((run) => run.moveId)).size).toBe(1);
    expect(runs.every((run) => JSON.stringify(run) === JSON.stringify(runs[0]))).toBe(true);
  });
});

describe("punish-fairness constraints", () => {
  it("never repeats the same move more than twice in a row", () => {
    const state = baseState("p1");
    const first = pick(state, 2.0);
    if (first === null) throw new Error("expected a P1 melee answer");
    const twice: WardenState = {
      ...state,
      lastMoveId: first,
      consecutiveMoveCount: WARDEN_PARAMS.selection.sameMoveMaxConsecutive,
    };
    expect(pick(twice, 2.0)).not.toBe(first);
    const once: WardenState = { ...state, lastMoveId: first, consecutiveMoveCount: 1 };
    expect(pick(once, 2.0)).toBe(first);
  });

  it("offers the bait only from the step-back stance", () => {
    const baitId = "warden_p1_lantern_raise_bait";
    const closed: WardenState = { ...baseState("p1"), stance: "closed" };
    const back: WardenState = { ...baseState("p1"), stance: "stepped_back" };
    const distance = 6.0;
    expect(pick(closed, distance)).not.toBe(baitId);
    expect(pick(back, distance)).toBe(baitId);
    const closedCandidates = selectWardenMove(
      WARDEN_PARAMS,
      WARDEN_RING,
      closed,
      targetAt(distance).x,
      targetAt(distance).z,
    ).candidates;
    expect(closedCandidates.find((candidate) => candidate.moveId === baitId)?.rejected).toBe(
      "stance",
    );
  });

  it("offers the quiet only in Phase 2", () => {
    const quietId = WARDEN_PARAMS.quiet.moveId;
    const p1 = selectWardenMove(
      WARDEN_PARAMS,
      WARDEN_RING,
      baseState("p1"),
      targetAt(4.0).x,
      targetAt(4.0).z,
    );
    expect(p1.candidates.map((candidate) => candidate.moveId)).not.toContain(quietId);
    const p2 = selectWardenMove(
      WARDEN_PARAMS,
      WARDEN_RING,
      baseState("p2"),
      targetAt(4.0).x,
      targetAt(4.0).z,
    );
    expect(p2.candidates.map((candidate) => candidate.moveId)).toContain(quietId);
  });

  it("offers the lantern-fire arc only when the target hugs the ring", () => {
    const arcId = "warden_p2_lantern_fire_arc";
    const state: WardenState = {
      ...baseState("p2"),
      x: WARDEN_RING.centerX,
      z: WARDEN_RING.centerZ + WARDEN_RING.radiusMeters - 4,
    };
    const midfield = {
      x: WARDEN_RING.centerX,
      z: WARDEN_RING.centerZ + WARDEN_RING.radiusMeters - 6,
    };
    const hugging = {
      x: WARDEN_RING.centerX,
      z: WARDEN_RING.centerZ + WARDEN_RING.radiusMeters - 0.5,
    };
    const away = selectWardenMove(WARDEN_PARAMS, WARDEN_RING, state, midfield.x, midfield.z);
    expect(away.candidates.find((candidate) => candidate.moveId === arcId)?.rejected).toBe(
      "ring_hug",
    );
    const hug = selectWardenMove(WARDEN_PARAMS, WARDEN_RING, state, hugging.x, hugging.z);
    expect(hug.candidates.find((candidate) => candidate.moveId === arcId)?.rejected).toBeNull();
  });
});

describe("stance", () => {
  it("reads stepped-back at or past the authored step-back range", () => {
    const state = baseState("p1");
    const back = targetAt(WARDEN_PARAMS.selection.stepBackRangeMeters);
    const closed = targetAt(WARDEN_PARAMS.selection.stepBackRangeMeters - 0.01);
    expect(stanceFor(WARDEN_PARAMS, state, back.x, back.z)).toBe("stepped_back");
    expect(stanceFor(WARDEN_PARAMS, state, closed.x, closed.z)).toBe("closed");
  });
});
