/**
 * s22 — the Warden of the Ironwood. Public surface of `src/sim/boss`.
 *
 * Headless and dependency-zero: the caller supplies parsed data, binds the s25
 * ceremony/aftermath ports, and feeds the emitted move intents to s11's action
 * clock. Nothing here names him — the UI never does until the player writes it.
 */

export { allWardenMoves, parseWardenParams, wardenMove } from "./params";
export { canonicalWardenJson, hashWardenState } from "./hash";
export {
  clampToRing,
  distanceFromRingCenter,
  isHuggingRing,
  isOutsideLeash,
  isTouchingRing,
  parseSnareRing,
  resolveRingContact,
} from "./ring";
export type { RingActorKind, RingContact } from "./ring";
export { isTargetInArena, selectWardenMove, stanceFor } from "./select";
export type { WardenCandidate, WardenRejection, WardenSelection } from "./select";
export {
  createWardenState,
  isWardenInvulnerable,
  stepWarden,
  WARDEN_ACTOR_ID,
  wardenActionTick,
  wardenStateHash,
  wardenSteadyClass,
} from "./warden";
export {
  runWardenGoldenScenario,
  WARDEN_REPLAY_DURATION_TICKS,
  WARDEN_REPLAY_FORMAT_VERSION,
  WARDEN_REPLAY_HIT_INTERVAL_TICKS,
  WARDEN_REPLAY_HIT_PULSE,
  WARDEN_REPLAY_MAX_PULSE,
  wardenParamsFingerprint,
} from "./replay";
export type { WardenReplayResult } from "./replay";
export { WARDEN_STATE_VERSION } from "./types";
export type {
  WardenAftermathParams,
  WardenAftermathPayload,
  WardenAftermathPort,
  WardenArenaTransition,
  WardenCeremonyParams,
  WardenCeremonyPort,
  WardenClip,
  WardenClipWindow,
  WardenEvent,
  WardenFsmState,
  WardenGateParams,
  WardenGateShortfall,
  WardenMotionParams,
  WardenMoveIntent,
  WardenMoveParams,
  WardenParams,
  WardenPhase,
  WardenPhaseParams,
  WardenPorts,
  WardenQuietParams,
  WardenRingGeometry,
  WardenRingParams,
  WardenSeed,
  WardenSelectionParams,
  WardenStance,
  WardenState,
  WardenStepInput,
  WardenStepResult,
  WardenTellClass,
} from "./types";
