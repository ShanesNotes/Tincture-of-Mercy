import { fromAiEvent, fromMetaEvent, type AudioSourceEvent } from "../../app/audio";
import type { WorldDebugSnapshot, WorldEvent } from "../../sim/world/types";
import type {
  ActorPresentation,
  CameraWorldEvent,
  WorldPresentation,
  WorldViewEventBatch,
} from "./types";

interface DebugHitbox {
  readonly start: { readonly x: number; readonly y: number; readonly z: number };
  readonly end: { readonly x: number; readonly y: number; readonly z: number };
  readonly radius: number;
}

const actorPresentation = (
  actor: WorldDebugSnapshot["actors"][number] & { readonly hitboxes?: readonly DebugHitbox[] },
): ActorPresentation => ({
  id: actor.id,
  kind: actor.kind,
  active: actor.active,
  position: actor.position,
  facingRadians: actor.facing,
  action:
    actor.actionId === null || actor.actionTick === null
      ? null
      : { move: actor.actionId, tick: actor.actionTick },
  alive: actor.alive,
  invulnerable: actor.invulnerable,
  hurtboxes: actor.hurtboxes.map((capsule) => ({
    start: capsule.start,
    end: capsule.end,
    radius: capsule.radius,
  })),
  hitboxes: (actor.hitboxes ?? []).map((capsule) => ({
    start: capsule.start,
    end: capsule.end,
    radius: capsule.radius,
  })),
});

/** Thin, read-only projection. No sim state or clocks are mutated in view. */
export const presentWorldDebug = (
  snapshot: WorldDebugSnapshot,
  orbit: Readonly<{ x: number; y: number }> = { x: 0, y: 0 },
): WorldPresentation => ({
  tick: snapshot.tick,
  actors: snapshot.actors.map(actorPresentation),
  attendTargetId: snapshot.targetId,
  orbit,
  damageContext: snapshot.engaged,
});

const combatAudio = (event: WorldEvent): readonly AudioSourceEvent[] => {
  if (event.source !== "combat") return [];
  const payload: unknown = event.payload;
  if (typeof payload !== "object" || payload === null || !("kind" in payload)) return [];
  const kind = payload.kind;
  if (kind === "damage" && "guarded" in payload && "amount" in payload) {
    return payload.guarded === true
      ? [{ type: "combat.blocked", tick: event.tick }]
      : [
          {
            type: "combat.hit",
            tick: event.tick,
            weight: typeof payload.amount === "number" && payload.amount >= 50 ? "heavy" : "light",
          },
        ];
  }
  if (kind === "guard_break") {
    return [{ type: "combat.guard_break", tick: event.tick }];
  }
  if (kind === "action_started" && "actionId" in payload && typeof payload.actionId === "string") {
    const attack = /(?:light\d*|heavy|charged|riposte|lunge|bite)$/u.test(payload.actionId);
    if (!attack) return [];
    const actorId = event.actorId ?? "";
    return [
      {
        type: "combat.attack_whiff",
        tick: event.tick,
        weaponClass: actorId.includes("wolf") ? "wolf" : "hearth_iron",
        weight: payload.actionId.includes("heavy") ? "heavy" : "light",
      },
    ];
  }
  if (
    kind === "death" &&
    "targetId" in payload &&
    typeof payload.targetId === "string" &&
    payload.targetId.includes("wolf")
  ) {
    return [{ type: "ai.wolf_vocal", tick: event.tick, vocal: "death" }];
  }
  return [];
};

/** Adapts the globally sequenced presenter stream into camera and audio ports. */
export const adaptWorldEvents = (events: readonly WorldEvent[]): WorldViewEventBatch => {
  const camera: CameraWorldEvent[] = [];
  const audio: AudioSourceEvent[] = [];
  for (const event of events) {
    if (event.source === "scenes" && "type" in event.payload) {
      if (event.payload.type === "camera-hold") {
        camera.push({ type: "camera-hold", beat: event.payload.anchorId, anchorId: event.payload.anchorId });
      } else if (event.payload.type === "camera-release") {
        camera.push({ type: "camera-release" });
      }
    }
    if (event.source === "ai" && "kind" in event.payload && "detail" in event.payload) {
      audio.push(
        ...fromAiEvent({
          kind: String(event.payload.kind),
          detail: String(event.payload.detail),
          tick: event.tick,
        }),
      );
    } else if (event.source === "meta" && "type" in event.payload) {
      audio.push(...fromMetaEvent({ type: String(event.payload.type), tick: event.tick }));
    } else {
      audio.push(...combatAudio(event));
    }
  }
  return { camera, audio };
};
