/**
 * Slice s27-vfx public surface. The pure half (types/params/controller) is
 * headless-callable; the three.js half (nodes/emblem/scene) renders it.
 * Integration seam for s18: `applyVfxEvents(state, events, tick, params)`.
 */

export * from "./types";
export {
  advanceVfx,
  applyVfxEvents,
  classifyHitstop,
  createVfxState,
  directionToAnchor,
  emberDesatLevel,
  emblemIntensity,
  envelope01,
  inversionActive,
  witherBandStop,
  witherMoteCount,
} from "./controller";
export { parseVfxParams, VFX_PARAMS, type VfxParams } from "./params";
export { createVfxEmblemRegistry, VFX_EMBLEM_VERBS } from "./emblem";
export { vfxEventsFromWorld } from "./worldEvents";
