import { actorHurtboxes } from "./sidecars";
import { actorWeapon } from "./sidecars";
import { hashWorldState } from "./hash";
import { isWorldPackActive } from "./scheduler";
import type { WorldDebugSnapshot, WorldDefinition, WorldState } from "./types";

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
        active: definitionActor.kind === "player" || (
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
            ? actorWeapon(state, definition, definitionActor.id, 0, 0)
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
    meta: {
      life: state.meta.life,
      doses: state.meta.vial.doses,
      carriedNames: state.meta.names.carried,
      openPage: state.meta.openPage,
      lastHearthId: state.meta.lastHearthId,
    },
  };
};
