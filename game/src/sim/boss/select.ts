/**
 * Deterministic Warden move selection. No RNG: the Warden is procedure without
 * a why, and procedure is legible. Selection is cooldown-weighted, range-gated,
 * and constrained by the punish-fairness rules the contract names.
 */

import { distanceFromRingCenter, isHuggingRing } from "./ring";
import type {
  WardenMoveParams,
  WardenParams,
  WardenRingGeometry,
  WardenState,
} from "./types";

export type WardenRejection =
  | "cooldown"
  | "range"
  | "consecutive"
  | "stance"
  | "ring_hug"
  | "no_active_target";

export interface WardenCandidate {
  readonly moveId: string;
  readonly score: number;
  readonly rejected: WardenRejection | null;
}

export interface WardenSelection {
  readonly moveId: string | null;
  readonly candidates: readonly WardenCandidate[];
}

const ticksSinceUse = (state: WardenState, moveId: string): number => {
  const last = state.lastUsedTick[moveId];
  return last === undefined ? Number.MAX_SAFE_INTEGER : state.tick - last;
};

const isReady = (state: WardenState, move: WardenMoveParams): boolean =>
  ticksSinceUse(state, move.moveId) >= move.cooldownTicks;

const wouldExceedConsecutive = (
  params: WardenParams,
  state: WardenState,
  move: WardenMoveParams,
): boolean =>
  state.lastMoveId === move.moveId &&
  state.consecutiveMoveCount >= params.selection.sameMoveMaxConsecutive;

const rejectionFor = (
  params: WardenParams,
  ring: WardenRingGeometry,
  state: WardenState,
  move: WardenMoveParams,
  targetX: number,
  targetZ: number,
): WardenRejection | null => {
  const distance = Math.hypot(targetX - state.x, targetZ - state.z);
  if (distance < move.minRangeMeters || distance > move.maxRangeMeters) return "range";
  if (!isReady(state, move)) return "cooldown";
  if (wouldExceedConsecutive(params, state, move)) return "consecutive";
  if (move.requiresStance !== null && move.requiresStance !== state.stance) return "stance";
  if (move.requiresRingHug && !isHuggingRing(ring, params, targetX, targetZ)) return "ring_hug";
  return null;
};

/**
 * Score is an integer so the selector hashes byte-stably: authored weight sets
 * the standing order, and readiness beyond the cooldown can overturn it. The
 * data holds `cooldownScoreCapTicks` above the whole weight spread times
 * `weightScoreScale`, so a row he has left alone for the cap outscores a
 * heavier row he has just used — no authored move can be starved out of the
 * rotation, and between two equally rested moves the heavier one still wins.
 */
const scoreFor = (params: WardenParams, state: WardenState, move: WardenMoveParams): number => {
  const since = Math.min(ticksSinceUse(state, move.moveId), params.selection.cooldownScoreCapTicks);
  return move.weight * params.selection.weightScoreScale + since;
};

export const selectWardenMove = (
  params: WardenParams,
  ring: WardenRingGeometry,
  state: WardenState,
  targetX: number,
  targetZ: number,
): WardenSelection => {
  const scored: { readonly candidate: WardenCandidate; readonly score: number }[] = [];
  for (const move of params.phases[state.phase].moves) {
    const rejected = rejectionFor(params, ring, state, move, targetX, targetZ);
    const score = scoreFor(params, state, move);
    scored.push({
      candidate: { moveId: move.moveId, rejected, score: rejected === null ? score : 0 },
      score,
    });
  }
  scored.sort((left, right) => left.candidate.moveId.localeCompare(right.candidate.moveId));
  const best = (
    admits: (entry: (typeof scored)[number]) => boolean,
  ): (typeof scored)[number] | null => {
    let chosen: (typeof scored)[number] | null = null;
    for (const entry of scored) {
      if (!admits(entry)) continue;
      if (chosen === null || entry.score > chosen.score) chosen = entry;
    }
    return chosen;
  };
  const candidates = scored.map((entry) => entry.candidate);
  const chosen = best((entry) => entry.candidate.rejected === null);
  if (chosen !== null) return { moveId: chosen.candidate.moveId, candidates };
  // The anti-repeat rule narrows his choice; it must never silence him. At
  // contact range one row reaches and no other, and a hard cap there would hand
  // the player a stance the Warden cannot answer at all — the same defect the
  // range table used to have. Repeating is the lesser sin, so the cap is the
  // only rejection that is dropped, and only when nothing else is legal.
  const repeatable = best((entry) => entry.candidate.rejected === "consecutive");
  if (repeatable === null) return { moveId: null, candidates };
  return {
    moveId: repeatable.candidate.moveId,
    candidates: candidates.map((candidate) =>
      candidate.moveId === repeatable.candidate.moveId
        ? { ...candidate, rejected: null, score: repeatable.score }
        : candidate,
    ),
  };
};

/** Neutral posture: he gives ground past the step-back range, and only there. */
export const stanceFor = (
  params: WardenParams,
  state: WardenState,
  targetX: number,
  targetZ: number,
): WardenState["stance"] =>
  Math.hypot(targetX - state.x, targetZ - state.z) >= params.selection.stepBackRangeMeters
    ? "stepped_back"
    : "closed";

export const isTargetInArena = (
  ring: WardenRingGeometry,
  targetX: number,
  targetZ: number,
): boolean => distanceFromRingCenter(ring, targetX, targetZ) <= ring.radiusMeters;
