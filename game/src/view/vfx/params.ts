/**
 * VFX parameters, loaded from `src/data/vfx_params.json` (W1-SHARED rule 5:
 * frame data is data). Hitstop ticks are the TUNING_V0 hitstop table
 * verbatim; bloom durations pair with the hitstop class (TUNING_V0: "View
 * adds ink-bloom at frame margin"); presentation-only values are authored and
 * carry their law citations in the data file's `_comment` blocks.
 *
 * This module is pure (no three.js, no DOM) so Vitest, the scene, and the
 * impact layer all read the same validated numbers.
 */

import rawVfxParams from "../../data/vfx_params.json";

import type {
  HitstopClassName,
  VfxEventPayload,
  VfxWitherEvent,
} from "./types";

export interface HitstopClassParams {
  readonly hitstopTicks: number;
  readonly bloomTicks: number;
  readonly peakIntensity: number;
  readonly radiusPx: number;
}

export interface BudgetParams {
  readonly maxOxbloodCoverage: number;
}

export interface InversionParams {
  readonly frames: number;
}

export interface ImpactStrokeParams {
  readonly variants: number;
  readonly tailTicks: number;
  readonly sizeMeters: number;
  readonly goldFlashSizeMeters: number;
  readonly goldFlashTicks: number;
}

export interface WitherParams {
  readonly maxMotes: number;
  readonly moteSizeMeters: number;
  readonly driftMetersPerTick: number;
  readonly bandStops: readonly number[];
  readonly defaultDurationTicks: number;
}

export interface FlaskParams {
  readonly pulseTicks: number;
  readonly peakIntensity: number;
}

export interface EmberParams {
  readonly sweepTicks: number;
  readonly desatStops: readonly number[];
  readonly goldGlintTicks: number;
}

export interface TagChimeParams {
  readonly glintTicks: number;
  readonly glintSizeMeters: number;
}

export interface DeathPageParams {
  readonly ticks: number;
}

export interface MarginParams {
  readonly insetPx: number;
}

export interface DemoCue {
  readonly tick: number;
  readonly event: VfxEventPayload;
}

export interface DemoParams {
  readonly loopTicks: number;
  readonly timeline: readonly DemoCue[];
}

export interface VfxParams {
  readonly schemaVersion: number;
  readonly tickHz: number;
  readonly hitstopClasses: Readonly<Record<HitstopClassName, HitstopClassParams>>;
  readonly budget: BudgetParams;
  readonly inversion: InversionParams;
  readonly impactStrokes: ImpactStrokeParams;
  readonly wither: WitherParams;
  readonly flask: FlaskParams;
  readonly ember: EmberParams;
  readonly tagChime: TagChimeParams;
  readonly deathPage: DeathPageParams;
  readonly margin: MarginParams;
  readonly demo: DemoParams;
}

const HITSTOP_CLASS_NAMES: readonly HitstopClassName[] = [
  "light",
  "blocked",
  "heavy",
  "charged",
  "guard_break",
  "critical",
  "death",
];

const asRecord = (value: unknown, label: string): Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError(`vfx params: ${label} must be an object`);
  }
  return value as Record<string, unknown>;
};

const readNumber = (source: Record<string, unknown>, label: string, key: string): number => {
  const value = source[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new RangeError(`vfx params: ${label}.${key} must be a finite number`);
  }
  return value;
};

const readInt = (source: Record<string, unknown>, label: string, key: string): number => {
  const value = readNumber(source, label, key);
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`vfx params: ${label}.${key} must be a non-negative integer`);
  }
  return value;
};

const readString = (source: Record<string, unknown>, label: string, key: string): string => {
  const value = source[key];
  if (typeof value !== "string" || value === "") {
    throw new TypeError(`vfx params: ${label}.${key} must be a non-empty string`);
  }
  return value;
};

const readNumberArray = (
  source: Record<string, unknown>,
  label: string,
  key: string,
): readonly number[] => {
  const value = source[key];
  if (!Array.isArray(value) || value.some((v) => typeof v !== "number" || !Number.isFinite(v))) {
    throw new TypeError(`vfx params: ${label}.${key} must be an array of finite numbers`);
  }
  return value as readonly number[];
};

const readVec2 = (source: Record<string, unknown>, label: string, key: string): readonly [number, number] => {
  const value = readNumberArray(source, label, key);
  if (value.length !== 2) {
    throw new RangeError(`vfx params: ${label}.${key} must have exactly 2 components`);
  }
  return [value[0] ?? 0, value[1] ?? 0];
};

const readVec3 = (
  source: Record<string, unknown>,
  label: string,
  key: string,
): readonly [number, number, number] => {
  const value = readNumberArray(source, label, key);
  if (value.length !== 3) {
    throw new RangeError(`vfx params: ${label}.${key} must have exactly 3 components`);
  }
  return [value[0] ?? 0, value[1] ?? 0, value[2] ?? 0];
};

const readEventPayload = (raw: unknown, label: string): VfxEventPayload => {
  const source = asRecord(raw, label);
  const kind = readString(source, label, "kind");
  switch (kind) {
    case "whiff":
    case "flask":
    case "ember":
      return { kind, actorId: readString(source, label, "actorId") };
    case "hit":
      return {
        kind,
        targetId: readString(source, label, "targetId"),
        hitstopTicks: readInt(source, label, "hitstopTicks"),
        direction: readVec2(source, label, "direction"),
        contact: readVec3(source, label, "contact"),
        ...(source.critical === true ? { critical: true } : {}),
      };
    case "guard_break":
      return {
        kind,
        targetId: readString(source, label, "targetId"),
        hitstopTicks: readInt(source, label, "hitstopTicks"),
        direction: readVec2(source, label, "direction"),
        contact: readVec3(source, label, "contact"),
      };
    case "death":
      return {
        kind,
        targetId: readString(source, label, "targetId"),
        hitstopTicks: readInt(source, label, "hitstopTicks"),
        direction: readVec2(source, label, "direction"),
        contact: readVec3(source, label, "contact"),
      };
    case "riposte":
      return {
        kind,
        targetId: readString(source, label, "targetId"),
        contact: readVec3(source, label, "contact"),
      };
    case "wither": {
      const payload: Omit<VfxWitherEvent, "tick"> = {
        kind,
        density: readNumber(source, label, "density"),
        ...(source.durationTicks !== undefined
          ? { durationTicks: readInt(source, label, "durationTicks") }
          : {}),
      };
      return payload;
    }
    case "tag_chime":
      return { kind, contact: readVec3(source, label, "contact") };
    default:
      throw new TypeError(`vfx params: ${label}.kind "${kind}" is not a known VFX event kind`);
  }
};

/** Validates raw vfx JSON; throws on any malformed or out-of-law value. */
export const parseVfxParams = (raw: unknown): VfxParams => {
  const source = asRecord(raw, "root");

  const classesRaw = asRecord(source.hitstopClasses, "hitstopClasses");
  const hitstopClasses: Record<HitstopClassName, HitstopClassParams> = {
    light: { hitstopTicks: 0, bloomTicks: 0, peakIntensity: 0, radiusPx: 0 },
    blocked: { hitstopTicks: 0, bloomTicks: 0, peakIntensity: 0, radiusPx: 0 },
    heavy: { hitstopTicks: 0, bloomTicks: 0, peakIntensity: 0, radiusPx: 0 },
    charged: { hitstopTicks: 0, bloomTicks: 0, peakIntensity: 0, radiusPx: 0 },
    guard_break: { hitstopTicks: 0, bloomTicks: 0, peakIntensity: 0, radiusPx: 0 },
    critical: { hitstopTicks: 0, bloomTicks: 0, peakIntensity: 0, radiusPx: 0 },
    death: { hitstopTicks: 0, bloomTicks: 0, peakIntensity: 0, radiusPx: 0 },
  };
  for (const name of HITSTOP_CLASS_NAMES) {
    const group = asRecord(classesRaw[name], `hitstopClasses.${name}`);
    const entry: HitstopClassParams = {
      hitstopTicks: readInt(group, `hitstopClasses.${name}`, "hitstopTicks"),
      bloomTicks: readInt(group, `hitstopClasses.${name}`, "bloomTicks"),
      peakIntensity: readNumber(group, `hitstopClasses.${name}`, "peakIntensity"),
      radiusPx: readNumber(group, `hitstopClasses.${name}`, "radiusPx"),
    };
    if (entry.hitstopTicks === 0 || entry.bloomTicks < entry.hitstopTicks) {
      throw new RangeError(
        `vfx params: hitstopClasses.${name} bloom must cover at least the hitstop freeze`,
      );
    }
    if (entry.peakIntensity <= 0 || entry.peakIntensity > 1) {
      throw new RangeError(`vfx params: hitstopClasses.${name}.peakIntensity must be in (0, 1]`);
    }
    hitstopClasses[name] = entry;
  }

  const budgetRaw = asRecord(source.budget, "budget");
  const maxOxbloodCoverage = readNumber(budgetRaw, "budget", "maxOxbloodCoverage");
  if (maxOxbloodCoverage <= 0 || maxOxbloodCoverage > 0.05) {
    throw new RangeError("vfx params: budget.maxOxbloodCoverage must be in (0, 0.05] (L8/A3)");
  }

  const inversionRaw = asRecord(source.inversion, "inversion");
  const inversionFrames = readInt(inversionRaw, "inversion", "frames");
  if (inversionFrames !== 1) {
    throw new RangeError("vfx params: inversion.frames must be exactly 1 (canon impact spec)");
  }

  const strokesRaw = asRecord(source.impactStrokes, "impactStrokes");
  const impactStrokes: ImpactStrokeParams = {
    variants: readInt(strokesRaw, "impactStrokes", "variants"),
    tailTicks: readInt(strokesRaw, "impactStrokes", "tailTicks"),
    sizeMeters: readNumber(strokesRaw, "impactStrokes", "sizeMeters"),
    goldFlashSizeMeters: readNumber(strokesRaw, "impactStrokes", "goldFlashSizeMeters"),
    goldFlashTicks: readInt(strokesRaw, "impactStrokes", "goldFlashTicks"),
  };
  if (impactStrokes.variants < 2 || impactStrokes.variants > 3) {
    throw new RangeError("vfx params: impactStrokes.variants must be 2–3 authored strokes");
  }

  const witherRaw = asRecord(source.wither, "wither");
  const wither: WitherParams = {
    maxMotes: readInt(witherRaw, "wither", "maxMotes"),
    moteSizeMeters: readNumber(witherRaw, "wither", "moteSizeMeters"),
    driftMetersPerTick: readNumber(witherRaw, "wither", "driftMetersPerTick"),
    bandStops: readNumberArray(witherRaw, "wither", "bandStops"),
    defaultDurationTicks: readInt(witherRaw, "wither", "defaultDurationTicks"),
  };

  const flaskRaw = asRecord(source.flask, "flask");
  const flask: FlaskParams = {
    pulseTicks: readInt(flaskRaw, "flask", "pulseTicks"),
    peakIntensity: readNumber(flaskRaw, "flask", "peakIntensity"),
  };

  const emberRaw = asRecord(source.ember, "ember");
  const ember: EmberParams = {
    sweepTicks: readInt(emberRaw, "ember", "sweepTicks"),
    desatStops: readNumberArray(emberRaw, "ember", "desatStops"),
    goldGlintTicks: readInt(emberRaw, "ember", "goldGlintTicks"),
  };
  if (ember.sweepTicks !== 60) {
    throw new RangeError("vfx params: ember.sweepTicks must be 60 (slice contract)");
  }
  if (ember.desatStops.length < 2) {
    throw new RangeError("vfx params: ember.desatStops needs at least two stepped stops (L3)");
  }

  const tagChimeRaw = asRecord(source.tagChime, "tagChime");
  const tagChime: TagChimeParams = {
    glintTicks: readInt(tagChimeRaw, "tagChime", "glintTicks"),
    glintSizeMeters: readNumber(tagChimeRaw, "tagChime", "glintSizeMeters"),
  };

  const deathPageRaw = asRecord(source.deathPage, "deathPage");
  const deathPage: DeathPageParams = { ticks: readInt(deathPageRaw, "deathPage", "ticks") };

  const marginRaw = asRecord(source.margin, "margin");
  const margin: MarginParams = { insetPx: readNumber(marginRaw, "margin", "insetPx") };

  const demoRaw = asRecord(source.demo, "demo");
  const timelineRaw = demoRaw.timeline;
  if (!Array.isArray(timelineRaw)) {
    throw new TypeError("vfx params: demo.timeline must be an array");
  }
  const timeline: DemoCue[] = timelineRaw.map((cue, index) => {
    const record = asRecord(cue, `demo.timeline[${index}]`);
    return {
      tick: readInt(record, `demo.timeline[${index}]`, "tick"),
      event: readEventPayload(record.event, `demo.timeline[${index}].event`),
    };
  });
  const demo: DemoParams = {
    loopTicks: readInt(demoRaw, "demo", "loopTicks"),
    timeline,
  };

  return {
    schemaVersion: readInt(source, "root", "schemaVersion"),
    tickHz: readInt(source, "root", "tickHz"),
    hitstopClasses,
    budget: { maxOxbloodCoverage },
    inversion: { frames: inversionFrames },
    impactStrokes,
    wither,
    flask,
    ember,
    tagChime,
    deathPage,
    margin,
    demo,
  };
};

/** The checked-in, validated VFX parameters. */
export const VFX_PARAMS: VfxParams = parseVfxParams(rawVfxParams);
