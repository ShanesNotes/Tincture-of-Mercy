import { createTickClock, mapTickToAudioTime, observeFrame, type TickClock } from "./clock";
import {
  createBrowserAudioContext,
  FakeAudioContext,
  type AudioContextPort,
  type BufferSourcePort,
  type GainPort,
} from "./context";
import { loadCommittedAudioParams } from "./load_params";
import type { AudioParams } from "./types";

export const MUSIC_PARAMS_VERSION = 1 as const;

export const REQUIRED_TRACK_IDS = [
  "hearth_theme",
  "warden_p1",
  "warden_ceremony",
  "warden_p2",
  "road_motif",
] as const;

export type MusicTrackId = (typeof REQUIRED_TRACK_IDS)[number];

export interface MusicState {
  readonly zone: string;
  readonly bossPhase: number;
  readonly inCombat: boolean;
  readonly hearthRest: boolean;
  readonly ceremony: boolean;
}

export interface MusicTrackDef {
  readonly file: string;
  readonly loop: boolean;
  readonly loopStartSeconds: number;
  readonly loopEndSeconds: number;
  readonly gain: number;
  readonly fadeTicks: number;
}

export interface MusicRuleWhen {
  readonly zone?: string;
  readonly bossPhase?: number;
  readonly inCombat?: boolean;
  readonly hearthRest?: boolean;
  readonly ceremony?: boolean;
}

export interface MusicRule {
  readonly id: string;
  readonly when: MusicRuleWhen;
  readonly track: string | null;
}

export interface MusicParams {
  readonly version: typeof MUSIC_PARAMS_VERSION;
  readonly tickHz: number;
  readonly buses: { readonly music: number };
  readonly ducking: { readonly deathSting: number };
  readonly ceremonySilence: { readonly nonCeremonyGain: number; readonly fadeTicks: number };
  readonly defaults: { readonly fadeTicks: number; readonly loopCrossfadeTicks: number };
  readonly tracks: Readonly<Record<string, MusicTrackDef>>;
  readonly rules: readonly MusicRule[];
}

export interface MusicLayerSnapshot {
  readonly trackId: string;
  readonly startedTick: number;
  readonly fadingOut: boolean;
  readonly fadeTicks: number;
  readonly gain: number;
  readonly loop: boolean;
  readonly nextLoopTick: number | null;
}

export interface MusicSnapshot {
  readonly unlocked: boolean;
  readonly paused: boolean;
  readonly deathSting: boolean;
  readonly track: string | null;
  readonly tick: number;
  readonly layers: readonly MusicLayerSnapshot[];
  readonly contextState: string;
}

export interface MusicSystem {
  setState(state: MusicState): void;
  setDeathSting(active: boolean): void;
  syncClock(committedTick: number, audioTime?: number): void;
  unlockFromGesture(): Promise<void>;
  setPaused(paused: boolean): Promise<void>;
  bindVisibility(): () => void;
  snapshot(): MusicSnapshot;
  readonly unlocked: boolean;
  readonly paused: boolean;
  readonly currentTrack: string | null;
}

export interface MusicSystemOptions {
  readonly params: MusicParams;
  readonly audioParams?: Pick<AudioParams, "buses" | "clock">;
  readonly context?: AudioContextPort;
}

interface LiveLayer {
  readonly trackId: string;
  readonly startedTick: number;
  fadeOutStartTick: number | null;
  readonly fadeInTicks: number;
  fadeOutTicks: number;
  nextLoopTick: number | null;
  readonly loop: boolean;
  readonly source: BufferSourcePort;
  readonly gain: GainPort;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const req = (value: unknown, path: string): Record<string, unknown> => {
  if (!isRecord(value)) {
    throw new Error(`music_params: ${path} must be an object`);
  }
  return value;
};

const num = (record: Record<string, unknown>, key: string, path: string): number => {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`music_params: ${path}.${key} must be a finite number`);
  }
  return value;
};

const int = (record: Record<string, unknown>, key: string, path: string): number => {
  const value = num(record, key, path);
  if (!Number.isSafeInteger(value)) {
    throw new Error(`music_params: ${path}.${key} must be a safe integer`);
  }
  return value;
};

const str = (record: Record<string, unknown>, key: string, path: string): string => {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`music_params: ${path}.${key} must be a non-empty string`);
  }
  return value;
};

const bool = (record: Record<string, unknown>, key: string, path: string): boolean => {
  const value = record[key];
  if (typeof value !== "boolean") {
    throw new Error(`music_params: ${path}.${key} must be a boolean`);
  }
  return value;
};

const parseTrack = (value: unknown, path: string): MusicTrackDef => {
  const record = req(value, path);
  const loopStartSeconds = num(record, "loopStartSeconds", path);
  const loopEndSeconds = num(record, "loopEndSeconds", path);
  if (loopEndSeconds <= loopStartSeconds) {
    throw new Error(`music_params: ${path} loopEndSeconds must be greater than loopStartSeconds`);
  }
  const gain = num(record, "gain", path);
  if (gain < 0) {
    throw new Error(`music_params: ${path}.gain must be >= 0`);
  }
  const fadeTicks = int(record, "fadeTicks", path);
  if (fadeTicks < 0) {
    throw new Error(`music_params: ${path}.fadeTicks must be >= 0`);
  }
  return {
    file: str(record, "file", path),
    loop: bool(record, "loop", path),
    loopStartSeconds,
    loopEndSeconds,
    gain,
    fadeTicks,
  };
};

const parseWhen = (value: unknown, path: string): MusicRuleWhen => {
  const record = req(value, path);
  const when: {
    zone?: string;
    bossPhase?: number;
    inCombat?: boolean;
    hearthRest?: boolean;
    ceremony?: boolean;
  } = {};
  if (record.zone !== undefined) {
    when.zone = str(record, "zone", path);
  }
  if (record.bossPhase !== undefined) {
    when.bossPhase = int(record, "bossPhase", path);
  }
  if (record.inCombat !== undefined) {
    when.inCombat = bool(record, "inCombat", path);
  }
  if (record.hearthRest !== undefined) {
    when.hearthRest = bool(record, "hearthRest", path);
  }
  if (record.ceremony !== undefined) {
    when.ceremony = bool(record, "ceremony", path);
  }
  return when;
};

const parseRules = (
  value: unknown,
  tracks: Readonly<Record<string, MusicTrackDef>>,
): readonly MusicRule[] => {
  if (!Array.isArray(value)) {
    throw new Error("music_params: rules must be an array");
  }
  return value.map((entry, index) => {
    const path = `rules[${String(index)}]`;
    const record = req(entry, path);
    const trackValue = record.track;
    if (trackValue !== null && (typeof trackValue !== "string" || trackValue.length === 0)) {
      throw new Error(`music_params: ${path}.track must be a string or null`);
    }
    if (trackValue !== null && tracks[trackValue] === undefined) {
      throw new Error(`music_params: ${path}.track references missing track ${trackValue}`);
    }
    return {
      id: str(record, "id", path),
      when: parseWhen(record.when, `${path}.when`),
      track: trackValue,
    };
  });
};

export const parseMusicParams = (raw: unknown): MusicParams => {
  const root = req(raw, "root");
  if (root.version !== MUSIC_PARAMS_VERSION) {
    throw new Error(`music_params: unsupported version ${String(root.version)}`);
  }

  const buses = req(root.buses, "buses");
  const ducking = req(root.ducking, "ducking");
  const ceremonySilence = req(root.ceremonySilence, "ceremonySilence");
  const defaults = req(root.defaults, "defaults");
  const tracksRaw = req(root.tracks, "tracks");

  const tracks: Record<string, MusicTrackDef> = {};
  for (const [trackId, trackValue] of Object.entries(tracksRaw)) {
    tracks[trackId] = parseTrack(trackValue, `tracks.${trackId}`);
  }
  for (const required of REQUIRED_TRACK_IDS) {
    if (tracks[required] === undefined) {
      throw new Error(`music_params: missing required track ${required}`);
    }
  }

  const musicBus = num(buses, "music", "buses");
  if (musicBus < 0) {
    throw new Error("music_params: buses.music must be >= 0");
  }

  return {
    version: MUSIC_PARAMS_VERSION,
    tickHz: int(root, "tickHz", "root"),
    buses: { music: musicBus },
    ducking: { deathSting: num(ducking, "deathSting", "ducking") },
    ceremonySilence: {
      nonCeremonyGain: num(ceremonySilence, "nonCeremonyGain", "ceremonySilence"),
      fadeTicks: int(ceremonySilence, "fadeTicks", "ceremonySilence"),
    },
    defaults: {
      fadeTicks: int(defaults, "fadeTicks", "defaults"),
      loopCrossfadeTicks: int(defaults, "loopCrossfadeTicks", "defaults"),
    },
    tracks,
    rules: parseRules(root.rules, tracks),
  };
};

export const defaultMusicState = (): MusicState => ({
  zone: "road",
  bossPhase: 0,
  inCombat: false,
  hearthRest: false,
  ceremony: false,
});

export const ruleMatches = (when: MusicRuleWhen, state: MusicState): boolean => {
  if (when.zone !== undefined && when.zone !== state.zone) {
    return false;
  }
  if (when.bossPhase !== undefined && when.bossPhase !== state.bossPhase) {
    return false;
  }
  if (when.inCombat !== undefined && when.inCombat !== state.inCombat) {
    return false;
  }
  if (when.hearthRest !== undefined && when.hearthRest !== state.hearthRest) {
    return false;
  }
  if (when.ceremony !== undefined && when.ceremony !== state.ceremony) {
    return false;
  }
  return true;
};

export const resolveTrack = (state: MusicState, params: MusicParams): string | null => {
  for (const rule of params.rules) {
    if (ruleMatches(rule.when, state)) {
      return rule.track;
    }
  }
  return null;
};

/** Linear 0→1 ramp in ticks. Deterministic for any (elapsed, fade) pair. */
export const fadeWeight = (elapsedTicks: number, fadeTicks: number): number => {
  if (fadeTicks <= 0) {
    return elapsedTicks > 0 ? 1 : 0;
  }
  if (elapsedTicks <= 0) {
    return 0;
  }
  if (elapsedTicks >= fadeTicks) {
    return 1;
  }
  return elapsedTicks / fadeTicks;
};

/** Equal-power pair from the same tick ramp. incoming² + outgoing² = 1. */
export const equalPowerCrossfade = (
  elapsedTicks: number,
  fadeTicks: number,
): { readonly incoming: number; readonly outgoing: number } => {
  const t = fadeWeight(elapsedTicks, fadeTicks);
  const angle = t * Math.PI * 0.5;
  return { incoming: Math.sin(angle), outgoing: Math.cos(angle) };
};

/**
 * Music bus composed on top of the existing master — does not edit audio buses.
 * Mix law: this product must sit under SFX so impacts always read.
 */
export const musicLayerGain = (
  master: number,
  musicBus: number,
  trackGain: number,
  fade: number,
  duck: number,
): number => master * musicBus * trackGain * fade * duck;

export const musicDuck = (
  params: MusicParams,
  deathSting: boolean,
  ceremony: boolean,
  isCeremonyTrack: boolean,
): number => {
  let duck = 1;
  if (deathSting) {
    duck *= params.ducking.deathSting;
  }
  if (ceremony && !isCeremonyTrack) {
    duck *= params.ceremonySilence.nonCeremonyGain;
  }
  return duck;
};

export const loopPeriodTicks = (track: MusicTrackDef, tickHz: number): number => {
  const seconds = track.loopEndSeconds - track.loopStartSeconds;
  const ticks = Math.round(seconds * tickHz);
  return ticks > 0 ? ticks : 1;
};

type LoopedSource = BufferSourcePort & { loopStart?: number; loopEnd?: number };

const applyLoopPoints = (source: BufferSourcePort, track: MusicTrackDef): void => {
  source.loop = track.loop;
  const looped = source as LoopedSource;
  if (typeof looped.loopStart === "number") {
    looped.loopStart = track.loopStartSeconds;
    looped.loopEnd = track.loopEndSeconds;
  }
};

export const createMusicSystem = (options: MusicSystemOptions): MusicSystem => {
  const params = options.params;
  const audio = options.audioParams ?? loadCommittedAudioParams();
  const context = options.context ?? createBrowserAudioContext() ?? new FakeAudioContext();

  let clock: TickClock = createTickClock(0, 0);
  let committedTick = 0;
  let unlocked = false;
  let paused = false;
  let deathSting = false;
  let applied: MusicState = defaultMusicState();
  let pending: MusicState | null = null;
  let desiredTrack: string | null = null;
  let thresholdMotifSpent = false;
  let live: LiveLayer[] = [];

  const stopSource = (source: BufferSourcePort): void => {
    try {
      source.stop();
    } catch {
      // already stopped
    }
  };

  const layerFade = (layer: LiveLayer, tick: number): number => {
    const fadeIn = fadeWeight(tick - layer.startedTick, layer.fadeInTicks);
    if (layer.fadeOutStartTick === null) {
      return fadeIn;
    }
    const fadeOut = fadeWeight(tick - layer.fadeOutStartTick, layer.fadeOutTicks);
    return fadeIn * (1 - fadeOut);
  };

  const layerGainAt = (layer: LiveLayer, tick: number): number => {
    const track = params.tracks[layer.trackId];
    if (track === undefined) {
      return 0;
    }
    const duck = musicDuck(params, deathSting, applied.ceremony, layer.trackId === "warden_ceremony");
    return musicLayerGain(
      audio.buses.master,
      params.buses.music,
      track.gain,
      layerFade(layer, tick),
      duck,
    );
  };

  const applyGains = (): void => {
    for (const layer of live) {
      layer.gain.gain.value = layerGainAt(layer, committedTick);
    }
  };

  const dropFinished = (): void => {
    const keep: LiveLayer[] = [];
    for (const layer of live) {
      if (layer.fadeOutStartTick !== null) {
        const elapsed = committedTick - layer.fadeOutStartTick;
        if (elapsed >= layer.fadeOutTicks) {
          stopSource(layer.source);
          continue;
        }
      }
      keep.push(layer);
    }
    live = keep;
  };

  const startLayer = (trackId: string, tick: number, fadeTicks: number): void => {
    const track = params.tracks[trackId];
    if (track === undefined || !unlocked || paused) {
      return;
    }
    const source = context.createBufferSource();
    applyLoopPoints(source, track);
    const gain = context.createGain();
    source.connect(gain);
    const period = loopPeriodTicks(track, params.tickHz);
    const layer: LiveLayer = {
      trackId,
      startedTick: tick,
      fadeOutStartTick: null,
      fadeInTicks: fadeTicks,
      fadeOutTicks: fadeTicks,
      nextLoopTick: track.loop ? tick + period : null,
      loop: track.loop,
      source,
      gain,
    };
    source.onended = () => {
      live = live.filter((entry) => entry.source !== source);
    };
    live = [...live, layer];
    const scheduledAudioTime = Math.max(context.currentTime, mapTickToAudioTime(clock, tick));
    source.start(scheduledAudioTime);
    layer.gain.gain.value = layerGainAt(layer, tick);
  };

  const fadeOutLive = (fadeTicks: number): void => {
    for (const layer of live) {
      if (layer.fadeOutStartTick === null) {
        layer.fadeOutStartTick = committedTick;
        layer.fadeOutTicks = fadeTicks;
      }
    }
  };

  const selectTrack = (state: MusicState): string | null => {
    const resolved = resolveTrack(state, params);
    if (resolved === "road_motif") {
      if (thresholdMotifSpent) {
        const stillPlaying = live.some(
          (layer) => layer.trackId === "road_motif" && layer.fadeOutStartTick === null,
        );
        return stillPlaying ? "road_motif" : null;
      }
    }
    if (state.zone !== "threshold") {
      thresholdMotifSpent = false;
    }
    return resolved;
  };

  const incomingFadeTicks = (trackId: string): number =>
    trackId === "warden_ceremony"
      ? params.ceremonySilence.fadeTicks
      : (params.tracks[trackId]?.fadeTicks ?? params.defaults.fadeTicks);

  const ensurePlaying = (trackId: string, fadeTicks: number): void => {
    const already = live.some(
      (layer) => layer.trackId === trackId && layer.fadeOutStartTick === null,
    );
    if (!already) {
      startLayer(trackId, committedTick, fadeTicks);
    }
  };

  const applyDesired = (): void => {
    if (pending !== null) {
      applied = pending;
      pending = null;
    }
    const next = selectTrack(applied);
    if (next !== desiredTrack) {
      const outgoingIsCeremony = desiredTrack === "warden_ceremony";
      const incomingIsCeremony = next === "warden_ceremony";
      const fadeOutTicks =
        incomingIsCeremony && !outgoingIsCeremony
          ? params.ceremonySilence.fadeTicks
          : (desiredTrack !== null ? params.tracks[desiredTrack]?.fadeTicks : undefined) ??
            params.defaults.fadeTicks;
      fadeOutLive(fadeOutTicks);
      desiredTrack = next;
      if (next === "road_motif") {
        thresholdMotifSpent = true;
      }
    }
    if (next !== null) {
      ensurePlaying(next, incomingFadeTicks(next));
    }
  };

  const scheduleLoops = (): void => {
    if (!unlocked || paused) {
      return;
    }
    for (const layer of live) {
      if (!layer.loop || layer.fadeOutStartTick !== null || layer.nextLoopTick === null) {
        continue;
      }
      const track = params.tracks[layer.trackId];
      if (track === undefined) {
        continue;
      }
      const period = loopPeriodTicks(track, params.tickHz);
      while (layer.nextLoopTick !== null && committedTick >= layer.nextLoopTick) {
        layer.nextLoopTick += period;
      }
    }
  };

  const restartLoops = (): void => {
    if (!unlocked || paused || desiredTrack === null) {
      return;
    }
    const track = params.tracks[desiredTrack];
    if (track === undefined || !track.loop) {
      return;
    }
    const already = live.some(
      (layer) => layer.trackId === desiredTrack && layer.fadeOutStartTick === null,
    );
    if (!already) {
      startLayer(desiredTrack, committedTick, 0);
    }
  };

  const stopNonLoops = (): void => {
    for (const layer of live) {
      if (!layer.loop) {
        stopSource(layer.source);
      }
    }
    live = live.filter((layer) => layer.loop);
  };

  return {
    setState: (state: MusicState) => {
      pending = state;
    },
    setDeathSting: (active: boolean) => {
      deathSting = active;
      applyGains();
    },
    syncClock: (tick: number, audioTime?: number) => {
      committedTick = tick;
      clock = observeFrame(clock, tick, audioTime ?? context.currentTime, audio.clock);
      applyDesired();
      scheduleLoops();
      applyGains();
      dropFinished();
    },
    unlockFromGesture: async () => {
      await context.resume();
      unlocked = context.state === "running";
      if (unlocked && !paused) {
        applyDesired();
        restartLoops();
        applyGains();
      }
    },
    setPaused: async (nextPaused: boolean) => {
      if (nextPaused === paused) {
        return;
      }
      paused = nextPaused;
      if (paused) {
        stopNonLoops();
        await context.suspend();
      } else {
        clock = createTickClock(committedTick, context.currentTime);
        await context.resume();
        restartLoops();
        applyGains();
      }
    },
    bindVisibility: () => {
      if (typeof document === "undefined") {
        return () => undefined;
      }
      const onVisibility = (): void => {
        if (document.hidden) {
          void (async () => {
            paused = true;
            stopNonLoops();
            await context.suspend();
          })();
        }
      };
      document.addEventListener("visibilitychange", onVisibility);
      return () => {
        document.removeEventListener("visibilitychange", onVisibility);
      };
    },
    snapshot: (): MusicSnapshot => ({
      unlocked,
      paused,
      deathSting,
      track: desiredTrack,
      tick: committedTick,
      layers: live.map((layer) => ({
        trackId: layer.trackId,
        startedTick: layer.startedTick,
        fadingOut: layer.fadeOutStartTick !== null,
        fadeTicks: layer.fadeOutStartTick === null ? layer.fadeInTicks : layer.fadeOutTicks,
        gain: layer.gain.gain.value,
        loop: layer.loop,
        nextLoopTick: layer.nextLoopTick,
      })),
      contextState: context.state,
    }),
    get unlocked() {
      return unlocked;
    },
    get paused() {
      return paused;
    },
    get currentTrack() {
      return desiredTrack;
    },
  };
};
