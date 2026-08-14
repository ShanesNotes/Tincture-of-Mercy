import type { AttendParams } from "./params";
import {
  hasLineOfSight,
  readFlickSide,
  selectAcquisition,
  selectReacquireTarget,
  selectSwitchTarget,
} from "./select";
import type { AttendActor, AttendState, AttendStepInput, AttendVec3 } from "./types";
import { ATTEND_STATE_VERSION, createAttendState } from "./types";
import { BOUNDARY_EPSILON, length, subtract } from "./vector";

const idle = (state: AttendState): AttendState => ({
  ...createAttendState(),
  switchCooldownTicks: state.switchCooldownTicks,
  flickLatched: state.flickLatched,
});

const findActor = (actors: readonly AttendActor[], id: string): AttendActor | undefined =>
  actors.find((actor) => actor.id === id);

const beginReacquire = (
  state: AttendState,
  params: AttendParams,
  anchor: AttendVec3 | null,
): AttendState => ({
  ...state,
  mode: "reacquiring",
  targetId: null,
  lostLineOfSightTicks: 0,
  reacquireAnchor: anchor,
  reacquireTicksRemaining: params.reacquireWindowTicks,
});

const isFlickHeld = (magnitude: number, params: AttendParams): boolean =>
  magnitude > params.switchFlickMagnitude;

/**
 * One deterministic Attend tick.
 *
 * Rules (TUNING_V0 "Attend"): acquire inside a 34-degree half-cone at 15m on a
 * button edge; retain to 22m or 30 consecutive ticks of broken line of sight;
 * switch on a stick flick past 0.6 within +/-45 degrees of horizontal with a 12
 * tick cooldown; on target death re-acquire within 8m inside 20 ticks.
 */
export const stepAttend = (
  state: AttendState,
  params: AttendParams,
  input: AttendStepInput,
): AttendState => {
  const { actors, queries, stick, viewer } = input;
  const flickHeld = isFlickHeld(Math.hypot(stick.x, stick.y), params);
  const flickEdge = flickHeld && !state.flickLatched;
  let next: AttendState = {
    ...state,
    version: ATTEND_STATE_VERSION,
    flickLatched: flickHeld,
    switchCooldownTicks: Math.max(0, state.switchCooldownTicks - 1),
  };

  if (input.attendPressed) {
    if (next.mode === "idle") {
      const acquired = selectAcquisition(viewer, actors, params, queries);
      if (acquired !== null) {
        const actor = findActor(actors, acquired.id);
        next = {
          ...next,
          mode: "attending",
          targetId: acquired.id,
          lostLineOfSightTicks: 0,
          reacquireAnchor: actor?.position ?? null,
          reacquireTicksRemaining: 0,
        };
      }
    } else {
      return idle(next);
    }
  }

  const attendingId = next.mode === "attending" ? next.targetId : null;
  if (attendingId !== null) {
    const target = findActor(actors, attendingId);
    if (target === undefined || !target.alive) {
      next = beginReacquire(next, params, target?.position ?? next.reacquireAnchor);
    } else {
      const distance = length(subtract(target.position, viewer.position));
      if (distance > params.retainRangeMeters + BOUNDARY_EPSILON) {
        return idle(next);
      }
      const visible = hasLineOfSight(queries, viewer.position, target.position);
      const lostTicks = visible ? 0 : next.lostLineOfSightTicks + 1;
      if (lostTicks >= params.lineOfSightBreakTicks) {
        return idle(next);
      }
      next = { ...next, lostLineOfSightTicks: lostTicks, reacquireAnchor: target.position };

      if (flickEdge && next.switchCooldownTicks === 0) {
        const side = readFlickSide(stick, params);
        const switched =
          side === null
            ? null
            : selectSwitchTarget(viewer, attendingId, actors, side, params, queries);
        if (switched !== null) {
          next = {
            ...next,
            targetId: switched.id,
            lostLineOfSightTicks: 0,
            switchCooldownTicks: params.switchCooldownTicks,
            reacquireAnchor: findActor(actors, switched.id)?.position ?? next.reacquireAnchor,
          };
        }
      }
    }
  }

  if (next.mode === "reacquiring") {
    const anchor = next.reacquireAnchor;
    const recovered = anchor === null ? null : selectReacquireTarget(anchor, actors, params);
    if (recovered !== null) {
      return {
        ...next,
        mode: "attending",
        targetId: recovered,
        lostLineOfSightTicks: 0,
        reacquireTicksRemaining: 0,
        reacquireAnchor: findActor(actors, recovered)?.position ?? anchor,
      };
    }
    const remaining = next.reacquireTicksRemaining - 1;
    if (remaining <= 0) {
      return idle(next);
    }
    next = { ...next, reacquireTicksRemaining: remaining };
  }

  return next;
};

export { createAttendState };
