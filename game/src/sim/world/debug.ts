import { createMercyStats, maxDoses } from "../meta";
import { zoneAt } from "./assembly";
import { hashWorldState } from "./hash";
import { isWorldPackActive } from "./scheduler";
import { actorHurtboxes } from "./sidecars";
import { actorWeapon, actorWeaponRadius } from "./sidecars";
import type {
  WorldDebugBoss,
  WorldDebugSnapshot,
  WorldDefinition,
  WorldState,
} from "./types";

const bossProjection = (state: WorldState, definition: WorldDefinition): WorldDebugBoss => {
  const warden = definition.warden;
  if (warden === null || state.warden === null) {
    return {
      present: false,
      fsm: null,
      phase: null,
      pulse: 0,
      maxPulse: 0,
      arena: state.meta.arena,
      ceremonyActive: false,
      defeated: false,
      rootedUntilTick: 0,
      enteredArena: false,
    };
  }
  return {
    present: true,
    fsm: state.warden.fsm,
    phase: state.warden.phase,
    pulse: state.combat.damageActors[warden.actorId]?.pulse ?? state.warden.pulse,
    maxPulse: state.warden.maxPulse,
    arena: state.meta.arena,
    ceremonyActive: state.warden.fsm === "ceremony",
    defeated: state.warden.fsm === "defeated",
    rootedUntilTick: state.warden.targetRootedUntilTick,
    enteredArena: state.warden.enteredArena,
  };
};

export const createWorldDebugSnapshot = (
  state: WorldState,
  definition: WorldDefinition,
): WorldDebugSnapshot => {
  const playerPosition = state.actors[definition.player.id]?.motion.position;
  if (playerPosition === undefined) throw new Error("World debug player is missing.");
  const actors = Object.values(definition.actors)
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((definitionActor) => {
      const actor = state.actors[definitionActor.id];
      const combatActor = state.combat.combat.actors[definitionActor.id];
      const damageActor = state.combat.damageActors[definitionActor.id];
      if (actor === undefined || combatActor === undefined || damageActor === undefined) {
        throw new Error(`World debug actor is incomplete: ${definitionActor.id}.`);
      }
      const pack = definitionActor.packId === null
        ? undefined
        : state.aiPacks[definitionActor.packId];
      return {
        id: definitionActor.id,
        kind: definitionActor.kind,
        packId: definitionActor.packId,
        active: definitionActor.kind !== "wolf" || (
          pack !== undefined && isWorldPackActive(pack, playerPosition, definition)
        ),
        position: actor.motion.position,
        facing: actor.motion.facing,
        pulse: damageActor.pulse,
        breath: damageActor.breath,
        actionId: combatActor.action?.id ?? null,
        actionTick: combatActor.action?.tick ?? null,
        alive: damageActor.pulse > 0,
        // The combat reducer already commits this exact per-frame i-frame bit
        // into the transient actor snapshot. Reading it here avoids rebuilding
        // the immutable combat rule table once per presented actor.
        invulnerable: damageActor.invulnerable,
        hurtboxes: actorHurtboxes(state, definition, definitionActor.id).map((capsule) => ({
          start: capsule.a,
          end: capsule.b,
          radius: capsule.radius,
        })),
        hitboxes: (() => {
          const action = combatActor.action;
          const move = action === null ? undefined : definition.combatData.frameData.moves[action.id];
          const active =
            action !== null &&
            move !== undefined &&
            move.activeWindows.some(([start, end]) => action.tick >= start && action.tick < end);
          const weapon = active
            ? actorWeapon(state, definition, definitionActor.id, 0, actorWeaponRadius(definition, definitionActor.id))
            : null;
          return weapon === null
            ? []
            : [{ start: weapon.a, end: weapon.b, radius: weapon.radius }];
        })(),
      };
    });
  const tokenHolders = Object.entries(state.aiPacks)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([packId, pack]) => ({ packId, wolfId: pack.pack.tokenHolderId }));
  const tokenInvariant = Object.values(state.aiPacks).every(
    (pack) => pack.wolves.filter((wolf) => wolf.hasToken).length <= 1,
  );
  let cachedStateHash: string | null = null;
  const stats = createMercyStats(state.meta, definition.metaParams);
  const nearbyHearth = Object.values(definition.hearths)
    .sort((left, right) => left.id.localeCompare(right.id))
    .find((hearth) =>
      Math.hypot(
        playerPosition.x - hearth.position.x,
        playerPosition.y - hearth.position.y,
        playerPosition.z - hearth.position.z,
      ) <= definition.hearthRadiusMeters) ?? null;
  return {
    tick: state.tick,
    // Rendering consumes transforms/capsules every frame but does not consume
    // the canonical replay hash. Keep the public field exact while deferring
    // its canonical serialization until diagnostics or tests actually read it.
    get stateHash() {
      cachedStateHash ??= hashWorldState(state);
      return cachedStateHash;
    },
    actors,
    targetId: state.attend.targetId,
    tokenHolders,
    tokenInvariant,
    engaged: state.engaged,
    zoneId: zoneAt(definition.zones, playerPosition),
    boss: bossProjection(state, definition),
    scenes: {
      activeId: state.scenes.active?.scriptId ?? null,
      completed: state.scenes.completed,
      sliceExit: (state.scenes.flags["slice.exit"] ?? 0) > 0,
      unwrittenTag: (state.scenes.flags["hud.unwrittenMark"] ?? 0) > 0,
    },
    meta: {
      life: state.meta.life,
      doses: state.meta.vial.doses,
      maxDoses: maxDoses(state.meta, definition.metaParams),
      carriedNames: state.meta.names.carried,
      openPage: state.meta.openPage,
      lastHearthId: state.meta.lastHearthId,
      numbnessStacks: state.meta.numbnessStacks,
      vigilRestore: state.meta.vigilRestore,
      atHearth: state.meta.atHearth,
      turn: state.combat.damageActors[definition.player.id]?.turnBuildup ?? 0,
      turnCap: definition.combatData.params.defense.turnThreshold,
      maxPulse: stats.maxPulse,
      maxBreath: stats.maxBreath,
    },
    hearth: {
      nearbyId: nearbyHearth?.id ?? null,
      // The arena Hearth is cold until the aftermath lights it.
      lit:
        nearbyHearth !== null &&
        (nearbyHearth.id !== definition.warden?.arenaHearthId || state.arenaHearthLit),
    },
  };
};
