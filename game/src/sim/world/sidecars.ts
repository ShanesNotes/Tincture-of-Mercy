import {
  sampleHurtboxCapsules,
  sampleWeaponCapsule,
  type Capsule,
  type SidecarData,
} from "../combat";
import type { RootDisplacementClip } from "../motion";
import type { WorldActorDefinition, WorldActorState, WorldDefinition, WorldState } from "./types";

const assetKey = (actor: WorldActorDefinition): "kalev" | "wolf" =>
  actor.kind === "player" ? "kalev" : "wolf";

export const sidecarForAction = (
  definition: WorldDefinition,
  actor: WorldActorDefinition,
  actionId: string | null,
): SidecarData => {
  const asset = definition.actorAssets[assetKey(actor)];
  let filename: string | undefined;
  if (actionId !== null) {
    filename = asset.sidecars[actionId];
    if (filename === undefined && actionId.startsWith("roll_")) {
      filename = asset.sidecars.roll_medium;
    }
    const visualClip = asset.visualClips[actionId];
    if (filename === undefined && visualClip !== undefined) {
      filename = asset.sidecars[visualClip];
    }
  }
  filename ??= asset.neutralSidecar;
  const sidecar = definition.sidecars[filename];
  if (sidecar === undefined) {
    throw new Error(`World actor ${actor.id} references missing sidecar ${filename}.`);
  }
  return sidecar;
};

const sampleTick = (sidecar: SidecarData, actionTick: number | null, worldTick: number): number =>
  actionTick === null
    ? worldTick % sidecar.ticks
    : Math.max(0, Math.min(sidecar.ticks - 1, actionTick));

export const actorActionSample = (
  state: WorldState,
  definition: WorldDefinition,
  actorId: string,
): {
  readonly sidecar: SidecarData;
  readonly tick: number;
  readonly actionId: string | null;
} => {
  const actorDefinition = definition.actors[actorId];
  const combatActor = state.combat.combat.actors[actorId];
  if (actorDefinition === undefined || combatActor === undefined) {
    throw new Error(`Unknown world actor ${actorId}.`);
  }
  const actionId = combatActor.action?.id ?? null;
  const sidecar = sidecarForAction(definition, actorDefinition, actionId);
  return {
    sidecar,
    tick: sampleTick(sidecar, combatActor.action?.tick ?? null, state.tick),
    actionId,
  };
};

export const actorHurtboxes = (
  state: WorldState,
  definition: WorldDefinition,
  actorId: string,
): readonly Capsule[] => {
  const actor = state.actors[actorId];
  if (actor === undefined) return [];
  const sampled = actorActionSample(state, definition, actorId);
  return sampleHurtboxCapsules(sampled.sidecar, sampled.tick, {
    position: actor.motion.position,
    yawRadians: actor.motion.facing,
  });
};

export const actorWeapon = (
  state: WorldState,
  definition: WorldDefinition,
  actorId: string,
  tickOffset: number,
  radius: number,
): Capsule | null => {
  const actor = state.actors[actorId];
  if (actor === undefined) return null;
  const sampled = actorActionSample(state, definition, actorId);
  if (sampled.sidecar.sockets === undefined) return null;
  const tick = Math.max(0, Math.min(sampled.sidecar.ticks - 1, sampled.tick + tickOffset));
  return sampleWeaponCapsule(sampled.sidecar, tick, radius, {
    position: actor.motion.position,
    yawRadians: actor.motion.facing,
  });
};

export const rootClipForAction = (
  definition: WorldDefinition,
  actorDefinition: WorldActorDefinition,
  actionId: string,
): RootDisplacementClip | undefined => {
  const sidecar = sidecarForAction(definition, actorDefinition, actionId);
  if (sidecar.ticks < 2) return undefined;
  return {
    clipId: `${actorDefinition.id}:${actionId}`,
    ticks: sidecar.ticks,
    rootXZ: sidecar.rootXZ,
  };
};

export const withHostedAction = (
  actor: WorldActorState,
  instanceId: number | null,
): WorldActorState =>
  actor.hostedActionInstance === instanceId
    ? actor
    : { ...actor, hostedActionInstance: instanceId };
