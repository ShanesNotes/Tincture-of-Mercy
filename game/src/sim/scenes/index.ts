/**
 * s25 — staged scenes. Public surface of `src/sim/scenes`.
 *
 * Headless and composable. Emits scene state, text keys, and camera-anchor
 * ids. View later calls `holdFrame` / `releaseFrame` from those anchors.
 * s15 meta is consumed at integration (and in tests); this module does not
 * import it.
 */

export { beginItemRevelation, createWardenAftermathTrigger, createWardenCeremonyTrigger } from "./ceremony";
export type { WardenAftermathContract, WardenCeremonyContract } from "./ceremony";
export { assertNoEngagement, idleEngagement, SceneEngagementError } from "./combat";
export {
  applyVerb,
  createSceneState,
  isSceneActive,
  presentScene,
  sceneTextKeys,
  stepScene,
  stepSceneClock,
  tryEnterScene,
} from "./host";
export { COMPOSITION_SLOT_NAMES, parseSceneScripts, REQUIRED_SCRIPT_IDS } from "./schema";
export {
  isRegisterLockedScript,
  keyHasNumbVariants,
  REGISTER_LOCKED_SCRIPTS,
  renderSceneKey,
} from "./text";
export type { TextBible, TextBibleEntry } from "./text";
export { SCENE_STATE_VERSION } from "./types";
export type {
  ActiveScene,
  CombatEngagement,
  EnterContext,
  InterruptPolicy,
  SceneCatalog,
  SceneEvent,
  SceneParams,
  ScenePresentation,
  SceneResult,
  SceneScript,
  SceneState,
  SceneStep,
  SevenSlotComposition,
} from "./types";
