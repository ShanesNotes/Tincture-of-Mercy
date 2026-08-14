import type { AudioSourceEvent, FlaskPhase, WolfVocal } from "./types";

/**
 * Adapt s14 AiEvent records (kind/tick/detail) without importing sim/ai.
 * Unknown kinds are ignored — audio never invents combat hits from AI.
 */
export const fromAiEvent = (event: {
  readonly kind: string;
  readonly tick: number;
  readonly detail: string;
}): readonly AudioSourceEvent[] => {
  if (event.kind === "howl") {
    return [{ type: "ai.howl", tick: event.tick }];
  }
  if (event.kind === "role_action") {
    const vocal: WolfVocal | null =
      event.detail === "lunge"
        ? "lunge_snarl"
        : event.detail === "feint"
          ? "stalk_growl"
          : null;
    if (vocal !== null) {
      return [{ type: "ai.wolf_vocal", tick: event.tick, vocal }];
    }
  }
  return [];
};

/**
 * Adapt s15 MetaEvent records (type/tick) without importing sim/meta —
 * that module is not on this base. Field names match the additive meta stream.
 */
export const fromMetaEvent = (event: {
  readonly type: string;
  readonly tick: number;
}): readonly AudioSourceEvent[] => {
  switch (event.type) {
    case "dose-used":
      return [{ type: "meta.flask", tick: event.tick, phase: "drink" satisfies FlaskPhase }];
    case "death":
      return [{ type: "meta.death", tick: event.tick }];
    case "page-dropped":
      return [{ type: "meta.page", tick: event.tick, phase: "drop" }];
    case "page-recovered":
      return [{ type: "meta.page", tick: event.tick, phase: "recover" }];
    case "names-changed":
      return [{ type: "meta.names_bank", tick: event.tick }];
    case "hearth-rested":
      return [{ type: "ambience.hearth", tick: event.tick, on: true }];
    default:
      return [];
  }
};
