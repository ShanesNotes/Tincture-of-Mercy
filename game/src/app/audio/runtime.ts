import { createTickClock, mapTickToAudioTime, observeFrame, specTickToAudioTime, type TickClock } from "./clock";
import {
  createBrowserAudioContext,
  FakeAudioContext,
  type AudioContextPort,
  type BufferSourcePort,
  type GainPort,
} from "./context";
import { AudioDebugHook } from "./debug";
import { busGain, resolveDuckGains } from "./ducking";
import { isAmbienceToggle, resolveEventCues } from "./resolve";
import { pitchRateFromSeed } from "./jitter";
import type { AudioParams, AudioSourceEvent, DuckGroup, ResolvedCue, VoiceSlot } from "./types";
import { admitVoice } from "./voices";

export interface AudioRuntimeOptions {
  readonly params: AudioParams;
  readonly context?: AudioContextPort;
  readonly reducedFeedback?: boolean;
}

export interface AudioRuntime {
  readonly debug: AudioDebugHook;
  ingest(events: readonly AudioSourceEvent[]): void;
  syncClock(committedTick: number, audioTime?: number): void;
  unlockFromGesture(): Promise<void>;
  setPaused(paused: boolean): Promise<void>;
  setReducedFeedback(enabled: boolean): void;
  bindVisibility(): () => void;
  dispose(): Promise<void>;
  get unlocked(): boolean;
  get paused(): boolean;
  get currentTime(): number;
}

const AMBIENCE_CUE: Record<"ambience.hearth" | "ambience.forest" | "ambience.wither", string> = {
  "ambience.hearth": "ambience.hearth",
  "ambience.forest": "ambience.forest_damp",
  "ambience.wither": "ambience.wither_drone",
};

interface LiveVoice {
  readonly slot: VoiceSlot;
  readonly source: BufferSourcePort;
  readonly gain: GainPort;
}

export const createAudioRuntime = (options: AudioRuntimeOptions): AudioRuntime => {
  const params = options.params;
  const context = options.context ?? createBrowserAudioContext() ?? new FakeAudioContext();
  const debug = new AudioDebugHook();
  let live: readonly LiveVoice[] = [];
  const ambienceIntent = new Set<string>();
  let nextVoiceId = 1;
  let clock: TickClock = createTickClock(0, 0);
  let unlocked = false;
  let paused = false;
  let disposed = false;
  let lifecycle = Promise.resolve();
  let reducedFeedback = options.reducedFeedback ?? false;

  const refreshDebug = (): void => {
    debug.setLifecycle({
      unlocked,
      paused,
      reducedFeedback,
      contextState: context.state,
    });
  };
  refreshDebug();

  const slots = (): readonly VoiceSlot[] => live.map((entry) => entry.slot);

  const activeDuckGroups = (): DuckGroup[] => {
    const groups = new Set<DuckGroup>();
    for (const entry of live) {
      const cue = params.cues[entry.slot.cueId];
      if (cue !== undefined && cue.duckGroup !== "none") {
        groups.add(cue.duckGroup);
      }
    }
    return [...groups];
  };

  const applyDucking = (): void => {
    const ducks = resolveDuckGains(activeDuckGroups(), params);
    for (const entry of live) {
      const cue = params.cues[entry.slot.cueId];
      if (cue === undefined) {
        continue;
      }
      entry.gain.gain.value = busGain(
        params,
        cue.bus,
        ducks[cue.duckGroup],
        cue.gain,
        reducedFeedback,
        cue.layer === "body",
      );
    }
  };

  const stopSource = (source: BufferSourcePort): void => {
    try {
      source.stop();
    } catch {
      // already stopped
    }
  };

  const dropVoice = (id: string): void => {
    const entry = live.find((item) => item.slot.id === id);
    if (entry !== undefined) {
      stopSource(entry.source);
    }
    live = live.filter((item) => item.slot.id !== id);
  };

  const stopNonLoops = (): void => {
    for (const entry of live) {
      const cue = params.cues[entry.slot.cueId];
      if (cue !== undefined && !cue.loop) {
        stopSource(entry.source);
      }
    }
    live = live.filter((entry) => params.cues[entry.slot.cueId]?.loop === true);
    debug.clearScheduled();
  };

  const stopAll = (): void => {
    for (const entry of [...live]) stopSource(entry.source);
    live = [];
    ambienceIntent.clear();
    debug.clearScheduled();
  };

  const startResolved = (resolved: ResolvedCue): void => {
    if (!unlocked || paused) {
      return;
    }
    const slot: VoiceSlot = {
      id: `v${String(nextVoiceId)}`,
      cueId: resolved.cueId,
      voiceClass: resolved.cue.voiceClass,
      priority: resolved.cue.priority,
      startedTick: resolved.scheduleTick,
    };
    nextVoiceId += 1;
    const decision = admitVoice(slots(), slot, params.voiceCaps);
    if (!decision.admitted) {
      return;
    }
    if (decision.evicted !== null) {
      dropVoice(decision.evicted.id);
    }

    const specAudioTime = specTickToAudioTime(clock, resolved.scheduleTick);
    const scheduledAudioTime = Math.max(
      context.currentTime,
      mapTickToAudioTime(clock, resolved.scheduleTick),
    );
    debug.record({
      cueId: resolved.cueId,
      eventTick: resolved.eventTick,
      scheduleTick: resolved.scheduleTick,
      specAudioTime,
      scheduledAudioTime,
      deltaMs: (scheduledAudioTime - specAudioTime) * 1000,
      hitstopTicks: resolved.cue.hitstopTicks,
    });

    const source = context.createBufferSource();
    source.loop = resolved.cue.loop;
    source.playbackRate.value = pitchRateFromSeed(resolved.seed, resolved.cue.pitchJitterCents);
    const gain = context.createGain();
    source.connect(gain);
    source.onended = () => {
      live = live.filter((entry) => entry.slot.id !== slot.id);
      applyDucking();
    };
    live = [...live.filter((entry) => entry.slot.id !== decision.evicted?.id), { slot, source, gain }];
    source.start(scheduledAudioTime);
    applyDucking();
  };

  const restartAmbience = (): void => {
    if (!unlocked || paused) {
      return;
    }
    for (const cueId of ambienceIntent) {
      if (live.some((entry) => entry.slot.cueId === cueId)) {
        continue;
      }
      const cue = params.cues[cueId];
      if (cue === undefined) {
        continue;
      }
      startResolved({
        cueId,
        cue,
        eventTick: clock.originTick,
        scheduleTick: clock.originTick,
        seed: 0,
      });
    }
  };

  const ingest = (events: readonly AudioSourceEvent[]): void => {
    if (disposed) return;
    for (const event of events) {
      if (isAmbienceToggle(event)) {
        const cueId = AMBIENCE_CUE[event.type];
        if (event.on) {
          ambienceIntent.add(cueId);
          if (unlocked && !paused && !live.some((entry) => entry.slot.cueId === cueId)) {
            const [resolved] = resolveEventCues(event, params, reducedFeedback);
            if (resolved !== undefined) {
              startResolved(resolved);
            }
          }
        } else {
          ambienceIntent.delete(cueId);
          for (const entry of [...live]) {
            if (entry.slot.cueId === cueId) {
              dropVoice(entry.slot.id);
            }
          }
        }
        continue;
      }

      if (paused || !unlocked) {
        continue;
      }

      for (const resolved of resolveEventCues(event, params, reducedFeedback)) {
        startResolved(resolved);
      }
    }
    refreshDebug();
  };

  const serializeLifecycle = (operation: () => Promise<void>): Promise<void> => {
    const scheduled = lifecycle.then(operation, operation);
    lifecycle = scheduled.catch(() => undefined);
    return scheduled;
  };

  const unlockFromGesture = (): Promise<void> => {
    if (disposed) return Promise.resolve();
    return serializeLifecycle(async () => {
      if (disposed) return;
      await context.resume();
      if (disposed) {
        await context.suspend();
        return;
      }
      unlocked = context.state === "running";
      refreshDebug();
      restartAmbience();
    });
  };

  const setPaused = (nextPaused: boolean): Promise<void> => {
    if (disposed) return Promise.resolve();
    return serializeLifecycle(async () => {
      if (disposed || nextPaused === paused) return;
      paused = nextPaused;
      if (paused) {
        stopNonLoops();
        await context.suspend();
      } else {
        clock = createTickClock(clock.originTick, context.currentTime);
        debug.clearScheduled();
        await context.resume();
      }
      if (disposed) {
        await context.suspend();
        return;
      }
      if (!paused) restartAmbience();
      refreshDebug();
    });
  };

  const dispose = (): Promise<void> => {
    if (disposed) return lifecycle;
    // Flip ownership synchronously so an already-running resume cannot publish
    // an unlocked state while this final suspend waits in the lifecycle queue.
    disposed = true;
    stopAll();
    paused = true;
    unlocked = false;
    return serializeLifecycle(async () => {
      await context.suspend();
      paused = true;
      unlocked = false;
      refreshDebug();
    });
  };

  return {
    debug,
    ingest,
    syncClock: (committedTick: number, audioTime?: number) => {
      if (disposed) return;
      clock = observeFrame(clock, committedTick, audioTime ?? context.currentTime, params.clock);
    },
    unlockFromGesture,
    setPaused,
    setReducedFeedback: (enabled: boolean) => {
      if (disposed) return;
      reducedFeedback = enabled;
      applyDucking();
      refreshDebug();
    },
    bindVisibility: () => {
      if (disposed) return () => undefined;
      const onVisibility = (): void => {
        if (document.hidden) {
          void setPaused(true).catch(() => undefined);
        }
      };
      document.addEventListener("visibilitychange", onVisibility);
      return () => {
        document.removeEventListener("visibilitychange", onVisibility);
      };
    },
    dispose,
    get unlocked() {
      return unlocked;
    },
    get paused() {
      return paused;
    },
    get currentTime() {
      return context.currentTime;
    },
  };
};
