/**
 * Attend (lock-on) sim types.
 *
 * Pure data only: no three, no view/app imports, no wall-clock, no Math.random.
 * Every world query the module needs is injected as plain-data functions so the
 * step function stays deterministic and headless-testable.
 */

export interface AttendVec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** A lock-on candidate as the sim sees it — no renderer objects. */
export interface AttendActor {
  readonly id: string;
  /** Aim point (chest/centre of mass), not the feet. */
  readonly position: AttendVec3;
  readonly alive: boolean;
}

export interface AttendRaycastQuery {
  readonly origin: AttendVec3;
  /** Need not be normalised; the adapter normalises. */
  readonly direction: AttendVec3;
  readonly maxDistance: number;
}

export interface AttendRaycastHit {
  readonly distance: number;
}

/**
 * Static-world query surface (the `CollisionWorld` adapter shape, reduced to the
 * one query Attend needs). Injected so `sim/` never reaches into `view/`.
 */
export interface AttendCollisionQueries {
  readonly raycast: (query: AttendRaycastQuery) => AttendRaycastHit | null;
}

/** Viewer frame Attend scores against: the camera, not the player capsule. */
export interface AttendViewer {
  /** Eye position — the LOS ray origin. */
  readonly position: AttendVec3;
  /** Unit-ish forward; normalised internally. */
  readonly forward: AttendVec3;
  /** Unit-ish screen-right; normalised internally. Drives flick side selection. */
  readonly right: AttendVec3;
}

/** Right-stick sample in screen space (x = right, y = up), already deadzoned. */
export interface AttendStickSample {
  readonly x: number;
  readonly y: number;
}

export interface AttendStepInput {
  readonly viewer: AttendViewer;
  readonly actors: readonly AttendActor[];
  /** Rising edge of the Attend button this tick (toggle press). */
  readonly attendPressed: boolean;
  readonly stick: AttendStickSample;
  readonly queries: AttendCollisionQueries;
}

export type AttendMode = "idle" | "attending" | "reacquiring";

export const ATTEND_STATE_VERSION = 1 as const;

export interface AttendState {
  readonly version: typeof ATTEND_STATE_VERSION;
  readonly mode: AttendMode;
  readonly targetId: string | null;
  /** Consecutive ticks the current target has been out of line of sight. */
  readonly lostLineOfSightTicks: number;
  /** Ticks remaining before another flick switch is legal. */
  readonly switchCooldownTicks: number;
  /** Ticks remaining in the post-death re-acquire window. */
  readonly reacquireTicksRemaining: number;
  /** Last known position of a target that died — the re-acquire anchor. */
  readonly reacquireAnchor: AttendVec3 | null;
  /** True while the flick stick is held past threshold (edge latch, no repeat). */
  readonly flickLatched: boolean;
}

export const createAttendState = (): AttendState => ({
  version: ATTEND_STATE_VERSION,
  mode: "idle",
  targetId: null,
  lostLineOfSightTicks: 0,
  switchCooldownTicks: 0,
  reacquireTicksRemaining: 0,
  reacquireAnchor: null,
  flickLatched: false,
});
