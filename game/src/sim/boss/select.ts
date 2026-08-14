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
 * Score is an integer so the selector hashes byte-stably: authored weight
 * dominates, readiness beyond the cooldown breaks near-ties toward moves the
 * Warden has not used in a while.
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
  const candidates: WardenCandidate[] = [];
  for (const move of params.phases[state.phase].moves) {
    const rejected = rejectionFor(params, ring, state, move, targetX, targetZ);
    candidates.push({
      moveId: move.moveId,
      rejected,
      score: rejected === null ? scoreFor(params, state, move) : 0,
    });
  }
  candidates.sort((left, right) => left.moveId.localeCompare(right.moveId));
  let chosen: WardenCandidate | null = null;
  for (const candidate of candidates) {
    if (candidate.rejected !== null) continue;
    if (chosen === null || candidate.score > chosen.score) {
      chosen = candidate;
    }
  }
  return { moveId: chosen?.moveId ?? null, candidates };
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
