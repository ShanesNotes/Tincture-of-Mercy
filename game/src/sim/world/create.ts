import { createWolfAiState, type WolfAiState } from "../ai";
import { createAttendState } from "../attend";
import { createCombatSimulation, type CombatSimulationSeed } from "../combat";
import { createMotionState } from "../motion";
import { createMercyStats, createMetaState } from "../meta";
import { applyVerb, createSceneState, tryEnterScene } from "../scenes";
import { createWorldWardenState } from "./warden";
import {
  WORLD_STATE_VERSION,
  type WorldActorState,
  type WorldQueries,
  type WorldState,
} from "./types";

const combatYaw = (motionYaw: number): number => {
  const yaw = motionYaw + Math.PI;
  return ((yaw + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
};

const createRoster = (queries: WorldQueries): readonly CombatSimulationSeed[] => {
  const definition = queries.definition;
  const meta = createMetaState(definition.metaParams);
  const playerStats = createMercyStats(meta, definition.metaParams);
  const warden = definition.warden;
  return Object.values(definition.actors)
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((actor): CombatSimulationSeed => {
      if (actor.kind === "warden") {
        if (warden === null) throw new Error("World has a Warden actor with no Warden definition.");
        return {
          actorClass: warden.phaseActorClasses.p1,
          facingRadians: combatYaw(actor.spawnFacing),
          id: actor.id,
          position: actor.spawnPosition,
          pulse: warden.maxPulse,
          rollBand: "medium",
          steadyClass: warden.phaseSteadyClasses.p1,
        };
      }
      return {
        actorClass: actor.kind === "player" ? "kalev" : "wolf",
        facingRadians: combatYaw(actor.spawnFacing),
        id: actor.id,
        position: actor.spawnPosition,
        pulse: actor.kind === "player" ? playerStats.pulse : 100,
        rollBand: "medium",
        steadyClass: actor.kind === "player" ? "kalev" : "wolf",
      };
    });
};

const bindAuthoredPackRoles = (
  state: WolfAiState,
  queries: WorldQueries,
  packId: string,
): WolfAiState => {
  const roles = Object.fromEntries(
    queries.definition.packs[packId]?.actors.map((actor) => [actor.id, actor.authoredRole]) ?? [],
  );
  return {
    ...state,
    wolves: state.wolves.map((wolf) => {
      const role = roles[wolf.id];
      return role === null || role === undefined ? wolf : { ...wolf, role };
    }),
    events: state.events.map((event) => {
      const role = roles[event.wolfId];
      return event.kind !== "role_assign" || role === null || role === undefined
        ? event
        : { ...event, detail: role };
    }),
  };
};

export const createWorldState = (queries: WorldQueries): WorldState => {
  const definition = queries.definition;
  const meta = createMetaState(definition.metaParams);
  const mercyStats = createMercyStats(meta, definition.metaParams);
  const actors: Record<string, WorldActorState> = {};
  for (const actor of Object.values(definition.actors).sort((left, right) => left.id.localeCompare(right.id))) {
    actors[actor.id] = {
      id: actor.id,
      motion: createMotionState(
        actor.spawnPosition,
        actor.spawnFacing,
        actor.kind === "player" ? mercyStats.breath : definition.combatData.params.breath.baseMaximum,
      ),
      hostedActionInstance: null,
      pendingCombatDisplacement: null,
    };
  }
  const aiPacks = Object.fromEntries(
    Object.values(definition.packs)
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((pack) => [
        pack.id,
        bindAuthoredPackRoles(
          createWolfAiState(
            pack.actors.map((actor) => ({
              id: actor.id,
              x: actor.spawnPosition.x,
              y: actor.spawnPosition.y,
              z: actor.spawnPosition.z,
              yaw: combatYaw(actor.spawnFacing),
              pulse: 100,
              maxPulse: 100,
            })),
            pack.home,
            definition.aiParams,
          ),
          queries,
          pack.id,
        ),
      ]),
  );
  let scenes = createSceneState(definition.sceneCatalog);
  if (definition.autoCompleteStartupScene) {
    scenes = tryEnterScene(
      scenes,
      definition.startupScene,
      definition.sceneCatalog,
      { engaged: false },
    ).state;
    for (const verb of ["DrawWater", "CarryWater", "BreakBread", "ShareBread", "DoseAnna"]) {
      scenes = applyVerb(scenes, verb, definition.sceneCatalog).state;
    }
    if (!scenes.completed.includes(definition.startupScene) || scenes.active !== null) {
      throw new Error(`Startup scene ${definition.startupScene} did not auto-complete.`);
    }
  }
  return {
    version: WORLD_STATE_VERSION,
    definitionFingerprint: definition.fingerprint,
    tick: 0,
    nextEventSequence: 0,
    actors,
    combat: createCombatSimulation(definition.combatData, createRoster(queries)),
    aiPacks,
    warden: createWorldWardenState(definition),
    meta,
    attend: createAttendState(),
    scenes,
    heldActions: [],
    engaged: false,
    arenaHearthLit: false,
    leftStartZone: false,
    snareBandContact: false,
    snareRootUntilTick: 0,
  };
};
