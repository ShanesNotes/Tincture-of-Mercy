import { hashTickSeed } from "./jitter";
import type { AudioParams, AudioSourceEvent, ResolvedCue } from "./types";

const bindingKey = (event: AudioSourceEvent): string | null => {
  switch (event.type) {
    case "combat.attack_whiff":
      return event.weaponClass === "hearth_iron"
        ? `hearth_iron.${event.weight ?? "light"}`
        : event.weaponClass;
    case "combat.hit":
      return event.weight;
    case "foley.footstep":
      return event.surface;
    case "meta.flask":
      return event.phase;
    case "ai.wolf_vocal":
      return event.vocal;
    case "meta.page":
      return event.phase;
    case "ambience.hearth":
    case "ambience.forest":
    case "ambience.wither":
      return event.on ? "on" : "off";
    default:
      return "*";
  }
};

const lookupCueIds = (params: AudioParams, event: AudioSourceEvent): readonly string[] => {
  const table = params.bindings[event.type];
  if (table === undefined) {
    return [];
  }
  const key = bindingKey(event);
  if (key === "off") {
    return [];
  }
  if (key !== null && table[key] !== undefined) {
    return table[key];
  }
  return table["*"] ?? [];
};

export const resolveEventCues = (
  event: AudioSourceEvent,
  params: AudioParams,
  reducedFeedback: boolean,
): readonly ResolvedCue[] => {
  const resolved: ResolvedCue[] = [];
  for (const cueId of lookupCueIds(params, event)) {
    const cue = params.cues[cueId];
    if (cue === undefined) {
      continue;
    }
    if (reducedFeedback && params.reducedFeedback.dropLayers.includes(cue.layer)) {
      continue;
    }
    const scheduleTick = event.tick + cue.offsetTicks;
    const seed = cue.seedPolicy === "tick" ? hashTickSeed(scheduleTick, cueId) : 0;
    resolved.push({ cueId, cue, eventTick: event.tick, scheduleTick, seed });
  }
  return resolved;
};

export const isAmbienceToggle = (
  event: AudioSourceEvent,
): event is Extract<
  AudioSourceEvent,
  { type: "ambience.hearth" | "ambience.forest" | "ambience.wither" }
> =>
  event.type === "ambience.hearth" ||
  event.type === "ambience.forest" ||
  event.type === "ambience.wither";
