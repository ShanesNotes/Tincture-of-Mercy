import { fromAiEvent, fromMetaEvent, type AudioSourceEvent } from "../../app/audio";
import type { CombatData, CombatPresenterEvent } from "../../sim/combat";
import type { WorldDebugSnapshot, WorldEvent } from "../../sim/world/types";
import type { VfxWorldContext } from "../vfx/worldEvents";
import type { Vec2, Vec3Tuple } from "../vfx/types";
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

/**
 * The impact seam the sim stream cannot carry.
 *
 * s11 declares a `hitstop` presenter event and never emits one, and no combat
 * event carries a world-space contact point. Both are recoverable here without
 * touching sim: the freeze is the attacker's authored `hitstopClass` read from
 * the same frame-data table s11 resolved the hit with, and the contact point is
 * the presented actor transform. Impact direction is the world-XZ bearing from
 * the player, which is what the margin bloom anchor actually wants.
 */
export const createWorldVfxContext = (
  snapshot: WorldDebugSnapshot,
  combatData: CombatData,
  playerId: string,
): VfxWorldContext => {
  const positions = new Map(snapshot.actors.map((actor) => [actor.id, actor.position]));
  const actions = new Map(snapshot.actors.map((actor) => [actor.id, actor.actionId]));
  const hitstop = combatData.params.hitstop;
  const classTicks: Readonly<Record<string, number>> = {
    none: 0,
    light: hitstop.lightTicks,
    heavy: hitstop.heavyTicks,
    charged: hitstop.chargedTicks,
    blocked: hitstop.blockedTicks,
    guard_break: hitstop.guardBreakTicks,
    critical: hitstop.criticalTicks,
    death: hitstop.deathTicks,
  };
  const player = positions.get(playerId);
  return {
    hitstopTicksFor: (payload: CombatPresenterEvent): number => {
      if (payload.kind === "death") return hitstop.deathTicks;
      if (payload.kind === "guard_break") return hitstop.guardBreakTicks;
      if (payload.kind !== "damage") return 0;
      if (payload.guarded) return hitstop.blockedTicks;
      const actionId = actions.get(payload.actorId) ?? null;
      const move = actionId === null ? undefined : combatData.frameData.moves[actionId];
      return move === undefined ? 0 : classTicks[move.hitstopClass] ?? 0;
    },
    contactFor: (actorId: string): Vec3Tuple => {
      const position = positions.get(actorId);
      return position === undefined ? [0, 0, 0] : [position.x, position.y, position.z];
    },
    directionFor: (actorId: string): Vec2 => {
      const target = positions.get(actorId);
      // A hit on the player is read from the nearest hostile instead, so the
      // bloom still lands on the side the blow came from.
      const from = actorId === playerId ? nearestHostile(snapshot, playerId) : player;
      if (target === undefined || from === undefined) return [0, 0];
      const dx = actorId === playerId ? from.x - target.x : target.x - from.x;
      const dz = actorId === playerId ? from.z - target.z : target.z - from.z;
      const length = Math.hypot(dx, dz);
      return length === 0 ? [0, 0] : [dx / length, dz / length];
    },
  };
};

const nearestHostile = (
  snapshot: WorldDebugSnapshot,
  playerId: string,
): { readonly x: number; readonly y: number; readonly z: number } | undefined => {
  const player = snapshot.actors.find((actor) => actor.id === playerId)?.position;
  if (player === undefined) return undefined;
  let best: { readonly actor: WorldDebugSnapshot["actors"][number]; readonly distance: number } | null = null;
  for (const actor of snapshot.actors) {
    if (actor.kind === "player" || !actor.alive) continue;
    const distance = Math.hypot(actor.position.x - player.x, actor.position.z - player.z);
    if (best === null || distance < best.distance) best = { actor, distance };
  }
  return best?.actor.position;
};

/**
 * The snare line's tin tags. `world.tag_chime` has been an authored cue with no
 * emitter since s17; the Warden's ring is what rings it.
 */
const bossAudio = (event: WorldEvent): readonly AudioSourceEvent[] => {
  if (event.source !== "boss") return [];
  const payload: unknown = event.payload;
  if (typeof payload !== "object" || payload === null || !("type" in payload)) return [];
  return payload.type === "snare-contact" && "chime" in payload && payload.chime === true
    ? [{ type: "world.tag_chime", tick: event.tick }]
    : [];
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
    audio.push(...bossAudio(event));
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
