export {
  COMBAT_DATA_SCHEMA_VERSION,
  COMBAT_REPLAY_DATA_VERSION,
  CombatDataError,
  REQUIRED_COMBAT_MOVE_IDS,
  compileCombatData,
} from "./data";
export type {
  ActorClass,
  CombatData,
  CombatMoveData,
  CombatParams,
  DamageType as AuthoredDamageType,
  FrameData,
  HitstopClass,
  RollBand,
  SteadyClass,
  TickWindow as DataTickWindow,
} from "./data";
export {
  createCombatState,
  isActorInvulnerable,
  stepCombat,
} from "./engine";
export type {
  CombatActionState,
  CombatActorSeed,
  CombatActorState,
  CombatMoveRules,
  CombatRollBand,
  CombatRules,
  CombatState,
  CombatStepCommand,
  CombatStepResult,
} from "./engine";
export { detectActiveSwingHits } from "./detection";
export type {
  ActiveSwingInput,
  ActiveSwingResult,
  HurtboxActor,
  RehitEntry,
  SwingContact,
} from "./detection";
export {
  WEAPON_SWEEP_SUBSTEPS,
  UniformCapsuleGrid,
  capsuleBounds,
  capsulesIntersect,
  queryGridCandidates,
  segmentDistanceSquared,
  sweepWeaponCapsule,
} from "./geometry";
export type { Aabb, Capsule, GridActor, Vec3, WeaponSweepHit } from "./geometry";
export { acceptSidecar, parseSidecarJson, sampleHurtboxCapsules, sampleSidecar, sampleWeaponCapsule } from "./sidecar";
export type { SidecarData, SidecarSample, SidecarTransform } from "./sidecar";
export { resolveHitBatch } from "./resolution";
export type {
  AuthoredHit,
  HitActorSnapshot,
  HitBatchResult,
  HitResolutionParams,
  ResolvedHitActor,
} from "./resolution";
export type { CombatPresenterEvent } from "./events";
export { requestBackstab, requestRiposte } from "./critical";
export { hashCanonical } from "./hash";
export { combatRulesFromData } from "./rules";
export {
  createCombatSimulation,
  hitResolutionParamsFromData,
  isCombatActorInvulnerable,
  stepCombatSimulation,
} from "./simulation";
export type {
  CombatSimulationFrame,
  CombatSimulationSeed,
  CombatSimulationState,
  CombatSimulationStep,
  CombatSwingFrame,
} from "./simulation";
export {
  COMBAT_REPLAY_FORMAT_VERSION,
  createGoldenCombatScenario,
  playCombatReplay,
} from "./replay";
export type {
  CombatGoldenFixture,
  CombatReplayResult,
  CombatReplayScript,
  CombatReplayStep,
} from "./replay";
