import type {
  AudioParams,
  CueDef,
  CueLayer,
  DuckGroup,
  GainBus,
  SeedPolicy,
  VoiceClass,
} from "./types";
import { AUDIO_PARAMS_VERSION } from "./types";

const VOICE_CLASSES: readonly VoiceClass[] = [
  "impact",
  "foley",
  "vocal",
  "ui",
  "ambience",
  "sting",
];

const DUCK_GROUPS: readonly DuckGroup[] = ["none", "combat", "ambience", "sting", "ui"];

const BUSES: readonly GainBus[] = ["master", "sfx", "ambience"];

const LAYERS: readonly CueLayer[] = ["body", "impact"];

const SEED_POLICIES: readonly SeedPolicy[] = ["tick", "none"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const req = (value: unknown, path: string): Record<string, unknown> => {
  if (!isRecord(value)) {
    throw new Error(`audio_params: ${path} must be an object`);
  }
  return value;
};

const num = (record: Record<string, unknown>, key: string, path: string): number => {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`audio_params: ${path}.${key} must be a finite number`);
  }
  return value;
};

const int = (record: Record<string, unknown>, key: string, path: string): number => {
  const value = num(record, key, path);
  if (!Number.isSafeInteger(value)) {
    throw new Error(`audio_params: ${path}.${key} must be a safe integer`);
  }
  return value;
};

const str = (record: Record<string, unknown>, key: string, path: string): string => {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`audio_params: ${path}.${key} must be a non-empty string`);
  }
  return value;
};

const bool = (record: Record<string, unknown>, key: string, path: string): boolean => {
  const value = record[key];
  if (typeof value !== "boolean") {
    throw new Error(`audio_params: ${path}.${key} must be a boolean`);
  }
  return value;
};

const oneOf = <T extends string>(
  record: Record<string, unknown>,
  key: string,
  path: string,
  allowed: readonly T[],
): T => {
  const value = str(record, key, path);
  if (!allowed.includes(value as T)) {
    throw new Error(`audio_params: ${path}.${key} must be one of ${allowed.join(", ")}`);
  }
  return value as T;
};

const parseCue = (value: unknown, path: string): CueDef => {
  const record = req(value, path);
  return {
    file: str(record, "file", path),
    gain: num(record, "gain", path),
    voiceClass: oneOf(record, "voiceClass", path, VOICE_CLASSES),
    priority: int(record, "priority", path),
    duckGroup: oneOf(record, "duckGroup", path, DUCK_GROUPS),
    bus: oneOf(record, "bus", path, BUSES),
    layer: oneOf(record, "layer", path, LAYERS),
    loop: bool(record, "loop", path),
    offsetTicks: int(record, "offsetTicks", path),
    hitstopTicks: int(record, "hitstopTicks", path),
    pitchJitterCents: num(record, "pitchJitterCents", path),
    seedPolicy: oneOf(record, "seedPolicy", path, SEED_POLICIES),
    source: str(record, "source", path),
  };
};

const parseBindings = (
  value: unknown,
): Readonly<Record<string, Readonly<Record<string, readonly string[]>>>> => {
  const root = req(value, "bindings");
  const out: Record<string, Record<string, readonly string[]>> = {};
  for (const [eventType, tableValue] of Object.entries(root)) {
    const table = req(tableValue, `bindings.${eventType}`);
    const mapped: Record<string, readonly string[]> = {};
    for (const [key, ids] of Object.entries(table)) {
      if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
        throw new Error(`audio_params: bindings.${eventType}.${key} must be a string array`);
      }
      mapped[key] = ids;
    }
    out[eventType] = mapped;
  }
  return out;
};

export const parseAudioParams = (raw: unknown): AudioParams => {
  const root = req(raw, "root");
  if (root.version !== AUDIO_PARAMS_VERSION) {
    throw new Error(`audio_params: unsupported version ${String(root.version)}`);
  }

  const hitstop = req(root.hitstopTicks, "hitstopTicks");
  const buses = req(root.buses, "buses");
  const caps = req(root.voiceCaps, "voiceCaps");
  const ducking = req(root.ducking, "ducking");
  const reduced = req(root.reducedFeedback, "reducedFeedback");
  const clock = req(root.clock, "clock");
  const cuesRaw = req(root.cues, "cues");

  const dropLayersRaw = reduced.dropLayers;
  if (!Array.isArray(dropLayersRaw) || dropLayersRaw.some((layer) => !LAYERS.includes(layer as CueLayer))) {
    throw new Error("audio_params: reducedFeedback.dropLayers must be a CueLayer array");
  }

  const cues: Record<string, CueDef> = {};
  for (const [cueId, cueValue] of Object.entries(cuesRaw)) {
    cues[cueId] = parseCue(cueValue, `cues.${cueId}`);
  }

  const bindings = parseBindings(root.bindings);
  for (const [eventType, table] of Object.entries(bindings)) {
    for (const [key, ids] of Object.entries(table)) {
      for (const cueId of ids) {
        if (cues[cueId] === undefined) {
          throw new Error(`audio_params: bindings.${eventType}.${key} references missing cue ${cueId}`);
        }
      }
    }
  }

  const voiceCaps = {
    impact: int(caps, "impact", "voiceCaps"),
    foley: int(caps, "foley", "voiceCaps"),
    vocal: int(caps, "vocal", "voiceCaps"),
    ui: int(caps, "ui", "voiceCaps"),
    ambience: int(caps, "ambience", "voiceCaps"),
    sting: int(caps, "sting", "voiceCaps"),
  };

  const duckGraph: Record<string, Record<string, number>> = {};
  for (const [group, edgesValue] of Object.entries(ducking)) {
    const edges = req(edgesValue, `ducking.${group}`);
    const mapped: Record<string, number> = {};
    for (const [target, amount] of Object.entries(edges)) {
      if (typeof amount !== "number" || !Number.isFinite(amount)) {
        throw new Error(`audio_params: ducking.${group}.${target} must be a finite number`);
      }
      mapped[target] = amount;
    }
    duckGraph[group] = mapped;
  }

  return {
    version: AUDIO_PARAMS_VERSION,
    tickHz: int(root, "tickHz", "root"),
    hitstopTicks: {
      light: int(hitstop, "light", "hitstopTicks"),
      heavy: int(hitstop, "heavy", "hitstopTicks"),
      charged: int(hitstop, "charged", "hitstopTicks"),
      blocked: int(hitstop, "blocked", "hitstopTicks"),
      guard_break: int(hitstop, "guard_break", "hitstopTicks"),
      critical: int(hitstop, "critical", "hitstopTicks"),
    },
    onsetLeadTicks: int(root, "onsetLeadTicks", "root"),
    buses: {
      master: num(buses, "master", "buses"),
      sfx: num(buses, "sfx", "buses"),
      ambience: num(buses, "ambience", "buses"),
    },
    voiceCaps,
    ducking: duckGraph,
    reducedFeedback: {
      dropLayers: dropLayersRaw as CueLayer[],
      bodyGainScale: num(reduced, "bodyGainScale", "reducedFeedback"),
    },
    clock: {
      driftSmooth: num(clock, "driftSmooth", "clock"),
      snapThresholdSeconds: num(clock, "snapThresholdSeconds", "clock"),
      impactWindowMs: num(clock, "impactWindowMs", "clock"),
    },
    placeholderDir: str(root, "placeholderDir", "root"),
    bindings,
    cues,
  };
};
