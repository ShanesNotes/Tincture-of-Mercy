/**
 * s10 — the deterministic capsule controller.
 *
 * Public surface for later slices. Composition root wiring is:
 *
 *   const params = parseMotionParams(rawJson);              // src/data/motion_params.json
 *   const queries = withDerivedGroundProbe(collisionWorld);  // view's MeshBvhCollisionWorld
 *   let motion = spawnMotionState(queries, params, spawn, facing, breath);
 *   ({ state: motion, events } = stepMotion(motion, input, queries, params));
 *
 * `MotionState` is this module's own DTO; the wider sim state composes it
 * rather than this module reaching into `src/sim/state.ts`.
 */

export type {
  Capsule,
  CapsuleSweepHit,
  CapsuleSweepQuery,
  CollisionQueries,
  DisplacementHost,
  GroundProbeHit,
  GroundProbeQuery,
  LocomotionState,
  MotionEvent,
  MotionInput,
  MotionState,
  MotionStep,
  RaycastHit,
  RaycastQuery,
  RootDisplacementClip,
  Vec3,
} from "./types";

export type { Curve, MotionParams } from "./params";
export {
  MOTION_PARAMS_SCHEMA,
  fallDamageFraction,
  parseMotionParams,
  sampleCurve,
} from "./params";

export type { GroundResult, MoveResult } from "./resolve";
export { capsuleAtFoot, isWalkable, moveAndSlide, resolveGround } from "./resolve";

export type { SweptWorld } from "./queries";
export { withDerivedGroundProbe } from "./queries";

export {
  MOTION_STATE_VERSION,
  createMotionState,
  hashMotionState,
  motionCapsule,
  spawnMotionState,
  stepMotion,
} from "./motion";

/**
 * The nasty-geometry test level and its brute-force query reference. Exported
 * because PRD milestone M1 is "controller/camera/input on the nasty-geometry
 * level" — the camera and renderer slices need the same geometry the controller
 * is proven against, and this is the only description of it.
 */
export type { LevelTriangle, NastyLevel } from "./nasty_level";
export {
  BruteForceQueries,
  NASTY_LEVEL_LANDMARKS,
  closestDistanceToLevel,
  createNastyLevel,
} from "./nasty_level";
