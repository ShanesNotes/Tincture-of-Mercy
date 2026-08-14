export { createTickClock, mapTickToAudioTime, observeFrame, specTickToAudioTime, TICK_SECONDS } from "./clock";
export { createBrowserAudioContext, FakeAudioContext } from "./context";
export { AudioDebugHook } from "./debug";
export { busGain, identityDuckGains, resolveDuckGains } from "./ducking";
export { fromAiEvent, fromMetaEvent } from "./events";
export { hashTickSeed, pitchRateFromSeed } from "./jitter";
export { parseAudioParams } from "./params";
export { isAmbienceToggle, resolveEventCues } from "./resolve";
export { createAudioRuntime } from "./runtime";
export { musicStateFromWorld } from "./worldMusic";
export { admitVoice, releaseVoice } from "./voices";
export { AUDIO_PARAMS_VERSION } from "./types";
export type {
  AudioDebugSnapshot,
  AudioParams,
  AudioSourceEvent,
  CueDef,
  ResolvedCue,
  ScheduledDelta,
  VoiceSlot,
} from "./types";
export type { AudioRuntime, AudioRuntimeOptions } from "./runtime";
export type { AudioContextPort } from "./context";
/**
 * Music types only. `music.ts` statically imports `loadCommittedAudioParams`,
 * which imports `node:fs`, so re-exporting any of its *values* here breaks the
 * browser bundle (rollup: `"readFileSync" is not exported by
 * "__vite-browser-external"`). These `export type` lines are erased at compile,
 * and `musicStateFromWorld` above only type-imports `music.ts`. Callers that
 * need `createMusicSystem` / `parseMusicParams` import `./audio/music`
 * directly, on a host that has `node:fs` or with `audioParams` supplied.
 */
export type {
  MusicLayerSnapshot,
  MusicParams,
  MusicRule,
  MusicRuleWhen,
  MusicSnapshot,
  MusicState,
  MusicSystem,
  MusicSystemOptions,
  MusicTrackDef,
  MusicTrackId,
} from "./music";
