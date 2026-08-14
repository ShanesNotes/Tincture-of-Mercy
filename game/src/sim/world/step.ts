/**
 * Deterministic world order (one fixed 60 Hz tick):
 * input latches -> Attend -> AI intents -> collision-correct motion -> combat
 * action/sweeps -> meta stat bridge/death/recovery -> staged scenes -> event wrap.
 *
 * Combat's monolithic action step discovers a newly-started root clip after the
 * motion stage. That clip is deliberately hosted by motion on the following tick;
 * the one-tick delay is stable in replay data and keeps collision authority in s10.
 */
import {
  stepWolfAi,
  type CombatActions,
  type LocomotionCommand,
  type WolfAiState,
} from "../ai";
import { createAttendState, stepAttend } from "../attend";
import {
  stepCombatSimulation,
  type CombatSimulationState,
  type CombatStepCommand,
  type CombatSwingFrame,
} from "../combat";
import type { InputAction, InputEdge } from "../input";
import {
  capsuleAtFoot,
  isWalkable,
  stepMotion,
  type MotionInput,
  type MotionState,
  type MotionStep,
  type RootDisplacementClip,
  type Vec3,
} from "../motion";
import {
  arenaOnDeath,
  awardNames,
  beginTinctureUse,
  bossDefeated,
  bossIsDown,
  cancelUse,
  commitUse,
  createMercyStats,
  enterArena,
  engageBoss,
  hearthRest,
  markEnemyDefeated,
  recordDeath,
  recoverOpenPage,
  respawnAtHearth,
  stepMeta,
  type MercyStats,
  type MetaState,
} from "../meta";
import {
  applyVerb,
  createWardenAftermathTrigger,
  createWardenCeremonyTrigger,
  idleEngagement,
  stepScene,
  tryEnterScene,
  type SceneEvent,
  type SceneState,
} from "../scenes";
import { createWorldState } from "./create";
import { isWorldPackActive } from "./scheduler";
import { actorHurtboxes, actorWeapon, rootClipForAction } from "./sidecars";
import { applySceneEffects, interactVerb, sceneToEnter } from "./scenes";
import { createWorldWardenState, stepWorldWarden, wardenSwingIsLive } from "./warden";
import { zoneAt } from "./assembly";
import { resolveRingContact } from "../boss";
import type {
  WorldActorState,
  WorldEvent,
  WorldEventPayload,
  WorldInputFrame,
  WorldQueries,
  WorldState,
  WorldStep,
} from "./types";

export const EMPTY_WORLD_INPUT: WorldInputFrame = Object.freeze({
  edges: Object.freeze([]),
  moveX: 0,
  moveZ: 0,
  attendStick: Object.freeze({ x: 0, y: 0 }),
});

const wrapYaw = (yaw: number): number =>
  ((yaw + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;

/** Motion/sidecars declare yaw 0 as -Z; combat and AI declare yaw 0 as +Z. */
const outwardYaw = (motionFacing: number): number => wrapYaw(motionFacing + Math.PI);
const inwardYaw = (outwardFacing: number): number => wrapYaw(outwardFacing - Math.PI);

const finiteInput = (input: WorldInputFrame): void => {
  for (const [label, value] of [
    ["moveX", input.moveX],
    ["moveZ", input.moveZ],
    ["attendStick.x", input.attendStick.x],
    ["attendStick.y", input.attendStick.y],
  ] as const) {
    if (!Number.isFinite(value)) throw new Error(`World input ${label} must be finite.`);
  }
};

const updateHeld = (
  held: readonly InputAction[],
  edges: readonly InputEdge[],
): readonly InputAction[] => {
  const next = new Set(held);
  for (const edge of [...edges].sort((left, right) => left.sequence - right.sequence)) {
    if (edge.pressed) next.add(edge.action);
    else next.delete(edge.action);
  }
  return [...next].sort();
};

const pressed = (input: WorldInputFrame, action: InputAction): boolean =>
  input.edges.some((edge) => edge.action === action && edge.pressed);

const viewerFor = (state: WorldState, queries: WorldQueries): NonNullable<WorldInputFrame["viewer"]> => {
  const motion = state.actors[queries.definition.player.id]?.motion;
  if (motion === undefined) throw new Error("World player motion is missing.");
  const eyeHeight = queries.definition.motionParams.capsule.height -
    queries.definition.motionParams.capsule.radius;
  return {
    position: { x: motion.position.x, y: motion.position.y + eyeHeight, z: motion.position.z },
    forward: { x: -Math.sin(motion.facing), y: 0, z: -Math.cos(motion.facing) },
    right: { x: Math.cos(motion.facing), y: 0, z: -Math.sin(motion.facing) },
  };
};

const combatTargetPosition = (
  state: WorldState,
  targetId: string | null,
): { readonly x: number; readonly z: number } | undefined => {
  if (targetId === null) return undefined;
  const actor = state.actors[targetId];
  const damage = state.combat.damageActors[targetId];
  return actor === undefined || damage === undefined || damage.pulse <= 0
    ? undefined
    : { x: actor.motion.position.x, z: actor.motion.position.z };
};

const syncAiActors = (
  pack: WolfAiState,
  state: WorldState,
): WolfAiState => ({
  ...pack,
  wolves: pack.wolves.map((wolf) => {
    const actor = state.actors[wolf.id];
    const damage = state.combat.damageActors[wolf.id];
    return actor === undefined || damage === undefined
      ? wolf
      : {
          ...wolf,
          x: actor.motion.position.x,
          y: actor.motion.position.y,
          z: actor.motion.position.z,
          yaw: outwardYaw(actor.motion.facing),
          pulse: damage.pulse,
          alive: damage.pulse > 0,
        };
  }),
});

const advanceDormantMotionClock = (actor: WorldActorState): WorldActorState => ({
  ...actor,
  motion: {
    ...actor.motion,
    tick: actor.motion.tick + 1,
    velocity: { x: 0, y: 0, z: 0 },
    locomotion: "idle",
    displacement: null,
    contactCount: 0,
  },
  hostedActionInstance: null,
  pendingCombatDisplacement: null,
});

const syncCombatFromMotion = (
  state: CombatSimulationState,
  actors: Readonly<Record<string, WorldActorState>>,
): CombatSimulationState => {
  const combatActors = Object.fromEntries(
    Object.entries(state.combat.actors).map(([id, actor]) => {
      const motion = actors[id]?.motion;
      return [id, motion === undefined ? actor : {
        ...actor,
        position: motion.position,
        facingRadians: outwardYaw(motion.facing),
        breath: {
          ...actor.breath,
          value: motion.breath,
          ticksSinceSpend: motion.breath < actor.breath.value ? 0 : actor.breath.ticksSinceSpend,
        },
      }];
    }),
  );
  const damageActors = Object.fromEntries(
    Object.entries(state.damageActors).map(([id, actor]) => {
      const motion = actors[id]?.motion;
      return [id, motion === undefined ? actor : {
        ...actor,
        position: motion.position,
        breath: motion.breath,
      }];
    }),
  );
  return { ...state, combat: { ...state.combat, actors: combatActors }, damageActors };
};

const patchPlayerStats = (
  combat: CombatSimulationState,
  playerId: string,
  stats: MercyStats,
): CombatSimulationState => {
  const combatActor = combat.combat.actors[playerId];
  const damageActor = combat.damageActors[playerId];
  if (combatActor === undefined || damageActor === undefined) return combat;
  return {
    ...combat,
    combat: {
      ...combat.combat,
      actors: {
        ...combat.combat.actors,
        [playerId]: {
          ...combatActor,
          breath: { ...combatActor.breath, max: stats.maxBreath, value: stats.breath },
        },
      },
    },
    damageActors: {
      ...combat.damageActors,
      [playerId]: {
        ...damageActor,
        pulse: stats.pulse,
        breath: stats.breath,
        turnBuildup: stats.turn,
      },
    },
  };
};

const mercyStatsFromCombat = (
  state: MetaState,
  combat: CombatSimulationState,
  queries: WorldQueries,
): MercyStats => {
  const persistent = createMercyStats(state, queries.definition.metaParams);
  const transient = combat.damageActors[queries.definition.player.id];
  return transient === undefined
    ? persistent
    : {
        ...persistent,
        pulse: Math.min(persistent.maxPulse, transient.pulse),
        breath: Math.min(persistent.maxBreath, transient.breath),
        turn: transient.turnBuildup,
      };
};

const localDisplacementClip = (
  actorId: string,
  world: Vec3,
  facing: number,
): RootDisplacementClip => {
  const cosine = Math.cos(facing);
  const sine = Math.sin(facing);
  return {
    clipId: `${actorId}:combat-knockback`,
    ticks: 2,
    rootXZ: [[0, 0], [world.x * cosine - world.z * sine, world.x * sine + world.z * cosine]],
  };
};

const motionInputFor = (
  state: WorldState,
  actorId: string,
  locomotion: LocomotionCommand | undefined,
  held: ReadonlySet<InputAction>,
  input: WorldInputFrame,
  queries: WorldQueries,
): { readonly input: MotionInput; readonly hostedActionInstance: number | null } => {
  const definitionActor = queries.definition.actors[actorId];
  const actor = state.actors[actorId];
  const combatActor = state.combat.combat.actors[actorId];
  if (definitionActor === undefined || actor === undefined || combatActor === undefined) {
    throw new Error(`Motion seam references unknown actor ${actorId}.`);
  }
  let beginDisplacement: RootDisplacementClip | undefined;
  let hostedActionInstance = actor.hostedActionInstance;
  if (actor.pendingCombatDisplacement !== null) {
    beginDisplacement = localDisplacementClip(actorId, actor.pendingCombatDisplacement, actor.motion.facing);
  } else if (
    combatActor.action !== null &&
    combatActor.action.instanceId !== actor.hostedActionInstance
  ) {
    beginDisplacement = rootClipForAction(
      queries.definition,
      definitionActor,
      combatActor.action.id,
    );
    hostedActionInstance = combatActor.action.instanceId;
  } else if (combatActor.action === null) {
    hostedActionInstance = null;
  }
  const maxSpeed = queries.definition.motionParams.speeds.run;
  const moveX = definitionActor.kind === "player"
    ? input.moveX
    : (locomotion?.desiredVelocityX ?? 0) / maxSpeed;
  const moveZ = definitionActor.kind === "player"
    ? input.moveZ
    : (locomotion?.desiredVelocityZ ?? 0) / maxSpeed;
  return {
    input: {
      moveX,
      moveZ,
      sprint: definitionActor.kind === "player" && held.has("sprint"),
      jump: definitionActor.kind === "player" && pressed(input, "jump"),
      ...(combatActor.action === null
        ? {}
        : { facingOverride: inwardYaw(combatActor.facingRadians) }),
      ...(beginDisplacement === undefined ? {} : { beginDisplacement }),
    },
    hostedActionInstance,
  };
};

/**
 * AI navigation only emits grounded waypoints, while authored attack clips can
 * continue carrying a committed wolf after the combat action has resolved.
 * A horizontal capsule sweep cannot collide with an open ledge, so composition
 * checks the next authored root sample against the same baked ground query
 * before motion advances it. Combat knockback remains free to push actors off
 * ledges; this guard is only for AI-authored attack locomotion.
 */
const withSupportedAiRoot = (
  actor: WorldActorState,
  input: MotionInput,
  queries: WorldQueries,
): MotionInput => {
  const started = input.beginDisplacement;
  const hosted = started === undefined
    ? actor.motion.displacement
    : {
        clip: started,
        tick: 0,
        facing: input.facingOverride ?? actor.motion.facing,
      };
  if (hosted === null || hosted.clip.clipId.endsWith(":combat-knockback")) return input;
  const from = hosted.clip.rootXZ[hosted.tick];
  const to = hosted.clip.rootXZ[hosted.tick + 1];
  if (from === undefined || to === undefined) return input;
  const localX = to[0] - from[0];
  const localZ = to[1] - from[1];
  const cosine = Math.cos(hosted.facing);
  const sine = Math.sin(hosted.facing);
  const nextPosition = {
    x: actor.motion.position.x + localX * cosine + localZ * sine,
    y: actor.motion.position.y,
    z: actor.motion.position.z - localX * sine + localZ * cosine,
  };
  const worldDeltaX = nextPosition.x - actor.motion.position.x;
  const worldDeltaZ = nextPosition.z - actor.motion.position.z;
  const deltaLength = Math.hypot(worldDeltaX, worldDeltaZ);
  const radius = queries.definition.motionParams.capsule.radius;
  // The view's fast ground adapter samples the capsule center. AI attack roots
  // additionally require support beneath the leading edge of the capsule so a
  // turn-limited locomotion handoff has one body radius in which to steer back
  // toward its nav waypoint after the root host is cancelled.
  const supportPosition = deltaLength === 0
    ? nextPosition
    : {
        x: nextPosition.x + worldDeltaX / deltaLength * radius,
        y: nextPosition.y,
        z: nextPosition.z + worldDeltaZ / deltaLength * radius,
      };
  const maxDistance = queries.definition.motionParams.collision.groundSnapMeters +
    queries.definition.motionParams.capsule.skin;
  const support = queries.probeGround({
    capsule: capsuleAtFoot(supportPosition, queries.definition.motionParams),
    maxDistance,
  });
  if (support !== null && isWalkable(support.normal, queries.definition.motionParams)) return input;
  if (started === undefined) return { ...input, cancelDisplacement: true };
  return {
    moveX: input.moveX,
    moveZ: input.moveZ,
    sprint: input.sprint,
    jump: input.jump,
    cancelDisplacement: true,
    ...(input.facingOverride === undefined ? {} : { facingOverride: input.facingOverride }),
  };
};

const stepSupportedAiMotion = (
  state: MotionState,
  input: MotionInput,
  queries: WorldQueries,
): MotionStep => {
  const attempted = stepMotion(state, input, queries, queries.definition.motionParams);
  const hostedClipId = input.beginDisplacement?.clipId ?? state.displacement?.clip.clipId ?? null;
  const deltaX = attempted.state.position.x - state.position.x;
  const deltaZ = attempted.state.position.z - state.position.z;
  const deltaLength = Math.hypot(deltaX, deltaZ);
  const radius = queries.definition.motionParams.capsule.radius;
  const leadingPosition = deltaLength === 0
    ? attempted.state.position
    : {
        x: attempted.state.position.x + deltaX / deltaLength * radius,
        y: attempted.state.position.y,
        z: attempted.state.position.z + deltaZ / deltaLength * radius,
      };
  const maxDistance = queries.definition.motionParams.collision.groundSnapMeters +
    queries.definition.motionParams.capsule.skin;
  const leadingSupport = queries.probeGround({
    capsule: capsuleAtFoot(leadingPosition, queries.definition.motionParams),
    maxDistance,
  });
  if (
    !state.grounded ||
    (attempted.state.grounded && leadingSupport !== null &&
      isWalkable(leadingSupport.normal, queries.definition.motionParams)) ||
    hostedClipId?.endsWith(":combat-knockback") === true
  ) {
    return attempted;
  }

  // At an open ledge the candidate motion is unsupported. Preserve the AI's
  // requested heading through s10's authored turn rate while its turn-only
  // seam clears horizontal momentum. The full candidate is accepted once it
  // points back over baked support on a later tick.
  return stepMotion(state, {
    moveX: input.moveX,
    moveZ: input.moveZ,
    sprint: false,
    jump: false,
    cancelDisplacement: true,
    turnOnly: true,
    ...(input.facingOverride === undefined ? {} : { facingOverride: input.facingOverride }),
  }, queries, queries.definition.motionParams);
};

const playerCommands = (
  input: WorldInputFrame,
  targetPosition: { readonly x: number; readonly z: number } | undefined,
  playerId: string,
): readonly CombatStepCommand[] => {
  const commands: CombatStepCommand[] = [];
  if (targetPosition !== undefined) commands.push({ actorId: playerId, targetPosition });
  for (const edge of input.edges) {
    if (edge.action === "attack" || edge.action === "heavy") {
      commands.push({
        actorId: playerId,
        edge: { action: "attack", pressed: edge.pressed, sequence: edge.sequence, tick: edge.tick },
        ...(edge.action === "heavy" ? { moveId: "heavy" } : {}),
        ...(targetPosition === undefined ? {} : { targetPosition }),
      });
    } else if (edge.action === "roll" || edge.action === "flask") {
      commands.push({
        actorId: playerId,
        edge: { action: edge.action, pressed: edge.pressed, sequence: edge.sequence, tick: edge.tick },
        ...(targetPosition === undefined ? {} : { targetPosition }),
      });
    }
  }
  return commands;
};

const swingFrames = (
  state: WorldState,
  queries: WorldQueries,
): readonly CombatSwingFrame[] => {
  const frames: CombatSwingFrame[] = [];
  const warden = queries.definition.warden;
  for (const actorId of Object.keys(state.actors).sort()) {
    if ((state.combat.damageActors[actorId]?.pulse ?? 0) <= 0) continue;
    const action = state.combat.combat.actors[actorId]?.action;
    if (action === undefined || action === null) continue;
    const attackerKind = queries.definition.actors[actorId]?.kind;
    // The charge-through travels for thirty ticks and connects for six of them.
    if (
      attackerKind === "warden" &&
      warden !== null &&
      state.warden !== null &&
      !wardenSwingIsLive(warden, state.warden.phase, action.id, action.tick)
    ) {
      continue;
    }
    const currentWeapon = actorWeapon(state, queries.definition, actorId, 0, 0);
    const previousWeapon = actorWeapon(state, queries.definition, actorId, -1, 0);
    if (currentWeapon === null || previousWeapon === null) continue;
    const attackerIsPlayer = attackerKind === "player";
    const targets = Object.values(queries.definition.actors)
      .filter((target) =>
        (target.kind === "player") !== attackerIsPlayer &&
        (state.combat.damageActors[target.id]?.pulse ?? 0) > 0)
      // An unaware pack outside its authored 18 m perception range cannot be
      // reached by any accepted weapon/root clip this tick. Preserve exact
      // active-pack geometry while avoiding sidecar/sweep work for remote
      // composed encounters.
      .filter((target) => {
        if (!attackerIsPlayer || target.packId === null) return true;
        const pack = state.aiPacks[target.packId];
        const player = state.actors[queries.definition.player.id]?.motion.position;
        return pack !== undefined && player !== undefined &&
          isWorldPackActive(pack, player, queries.definition);
      })
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((target) => ({ id: target.id, hurtboxes: actorHurtboxes(state, queries.definition, target.id) }));
    frames.push({ attackerId: actorId, currentWeapon, previousWeapon, targets });
  }
  return frames;
};

const nearestHearth = (
  position: Vec3,
  queries: WorldQueries,
): string | null => {
  let closest: { readonly id: string; readonly distance: number } | null = null;
  for (const hearth of Object.values(queries.definition.hearths).sort((left, right) => left.id.localeCompare(right.id))) {
    const distance = Math.hypot(
      position.x - hearth.position.x,
      position.y - hearth.position.y,
      position.z - hearth.position.z,
    );
    if (distance <= queries.definition.hearthRadiusMeters && (closest === null || distance < closest.distance)) {
      closest = { id: hearth.id, distance };
    }
  }
  return closest?.id ?? null;
};

const hearthSpawnPosition = (
  hearth: Vec3,
  queries: WorldQueries,
): Vec3 => {
  const height = queries.definition.motionParams.capsule.height;
  const hit = queries.raycast({
    origin: { x: hearth.x, y: hearth.y + height, z: hearth.z },
    direction: { x: 0, y: -1, z: 0 },
    maxDistance: height,
  });
  return hit !== null && isWalkable(hit.normal, queries.definition.motionParams)
    ? { x: hearth.x, y: hit.point.y + queries.definition.motionParams.capsule.skin, z: hearth.z }
    : hearth;
};

const resetAtHearth = (
  state: WorldState,
  meta: MetaState,
  queries: WorldQueries,
  hearthId: string,
): WorldState => {
  const hearth = queries.definition.hearths[hearthId];
  if (hearth === undefined) throw new Error(`Unknown respawn Hearth ${hearthId}.`);
  const fresh = createWorldState(queries);
  const freshPlayer = fresh.actors[queries.definition.player.id];
  if (freshPlayer === undefined) throw new Error("Fresh world has no player.");
  const playerSpawn = hearthSpawnPosition(hearth.position, queries);
  const actors = Object.fromEntries(Object.entries(fresh.actors).map(([actorId, actor]) => [
    actorId,
    { ...actor, motion: { ...actor.motion, tick: state.tick } },
  ]));
  actors[queries.definition.player.id] = {
    ...freshPlayer,
    motion: {
      ...freshPlayer.motion,
      tick: state.tick,
      position: playerSpawn,
      fallStartY: playerSpawn.y,
    },
  };
  const rebasedFreshCombat: CombatSimulationState = {
    ...fresh.combat,
    combat: { ...fresh.combat.combat, worldTick: state.tick },
  };
  const combat = patchPlayerStats(
    syncCombatFromMotion(rebasedFreshCombat, actors),
    queries.definition.player.id,
    mercyStatsFromCombat(meta, rebasedFreshCombat, queries),
  );
  const aiPacks = Object.fromEntries(Object.entries(fresh.aiPacks).map(([packId, pack]) => [
    packId,
    { ...pack, tick: state.tick },
  ]));

  // Victory is terminal (s15 `victoryNoRespawn`): the Warden never comes back,
  // whatever the standard respawn registry says. Otherwise the encounter resets
  // whole — full Pulse, Phase 1, outside the ring — like every other Hearth reset.
  const wardenDown = bossIsDown(meta);
  const wardenId = queries.definition.warden?.actorId;
  const warden = wardenDown ? state.warden : createWorldWardenState(queries.definition);
  const downedWarden = wardenDown && wardenId !== undefined
    ? combat.damageActors[wardenId]
    : undefined;
  const withWarden = downedWarden === undefined || wardenId === undefined
    ? combat
    : {
        ...combat,
        damageActors: { ...combat.damageActors, [wardenId]: { ...downedWarden, pulse: 0 } },
      };
  return {
    ...state,
    actors,
    combat: withWarden,
    aiPacks,
    warden: warden === null ? null : { ...warden, tick: state.tick },
    attend: createAttendState(),
    meta,
    engaged: false,
  };
};

const engagementFor = (state: WorldState): boolean =>
  Object.values(state.aiPacks).some((pack) =>
    pack.wolves.some(
      (wolf) =>
        wolf.alive &&
        (wolf.alert !== "unaware" || wolf.action !== null),
    ),
  ) ||
  // The Warden counts from the moment he commits, and stops counting during his
  // own ceremony, which is authored as a no-damage hold.
  (state.warden !== null &&
    state.warden.engaged &&
    state.warden.fsm !== "defeated" &&
    state.warden.fsm !== "ceremony");

export const stepWorld = (
  state: WorldState,
  input: WorldInputFrame,
  queries: WorldQueries,
): WorldStep => {
  if (state.definitionFingerprint !== queries.definition.fingerprint) {
    throw new Error("World state/definition fingerprint mismatch.");
  }
  finiteInput(input);
  const nextTick = state.tick + 1;
  const heldActions = updateHeld(state.heldActions, input.edges);
  const held = new Set(heldActions);
  const playerId = queries.definition.player.id;
  const eventSeeds: Array<{
    readonly source: WorldEvent["source"];
    readonly actorId: string | null;
    readonly payload: WorldEventPayload;
  }> = [];

  // Attend owns target truth; combat tracking and camera both consume this state.
  // Every hostile is attendable — the Warden above all.
  const attendActors = Object.values(queries.definition.actors)
    .filter((actor) => actor.kind !== "player")
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((actor) => {
      const motion = state.actors[actor.id]?.motion;
      return {
        id: actor.id,
        position: motion === undefined
          ? actor.spawnPosition
          : {
              x: motion.position.x,
              y: motion.position.y + queries.definition.motionParams.capsule.height / 2,
              z: motion.position.z,
            },
        alive: (state.combat.damageActors[actor.id]?.pulse ?? 0) > 0,
      };
    });
  const attendStick = pressed(input, "switchTarget") &&
    Math.hypot(input.attendStick.x, input.attendStick.y) <=
      queries.definition.attendParams.switchFlickMagnitude
    ? { x: 1, y: 0 }
    : input.attendStick;
  const attend = stepAttend(state.attend, queries.definition.attendParams, {
    viewer: input.viewer ?? viewerFor(state, queries),
    actors: attendActors,
    attendPressed: pressed(input, "attend"),
    stick: attendStick,
    queries,
  });

  // AI starts combat actions through a command adapter; it never mutates combat state.
  const aiCommands: CombatStepCommand[] = [];
  let aiSequence = Math.max(-1, ...input.edges.map((edge) => edge.sequence)) + 1;
  const adapter: CombatActions = {
    startAction: (intent) => {
      if (intent.action === "howl") return false;
      const actor = state.combat.combat.actors[intent.actorId];
      const damage = state.combat.damageActors[intent.actorId];
      if (actor === undefined || damage === undefined || damage.pulse <= 0 || actor.action !== null) {
        return false;
      }
      const moveId = queries.definition.aiMoveBindings[intent.action];
      aiCommands.push({
        actorId: intent.actorId,
        edge: { action: "attack", pressed: true, sequence: aiSequence, tick: state.tick },
        moveId,
        targetPosition: {
          x: state.actors[playerId]?.motion.position.x ?? 0,
          z: state.actors[playerId]?.motion.position.z ?? 0,
        },
      });
      aiSequence += 1;
      return true;
    },
    isResolved: (actorId, startedTick, tick) => {
      if (tick <= startedTick || aiCommands.some((command) => command.actorId === actorId)) return false;
      return state.combat.combat.actors[actorId]?.action === null;
    },
  };
  const playerMotion = state.actors[playerId]?.motion;
  if (playerMotion === undefined) throw new Error("World player is missing.");
  const sounds = [
    ...(Math.hypot(playerMotion.velocity.x, playerMotion.velocity.z) >
      queries.definition.motionParams.speeds.idleThreshold
      ? [{ kind: "footstep" as const, position: playerMotion.position, tick: nextTick }]
      : []),
    ...(state.combat.combat.actors[playerId]?.action?.id === "light1"
      ? [{ kind: "attack" as const, position: playerMotion.position, tick: nextTick }]
      : []),
  ];
  const aiPacks: Record<string, WolfAiState> = {};
  const locomotion = new Map<string, LocomotionCommand>();
  const dormantPackIds = new Set<string>();
  for (const packId of Object.keys(state.aiPacks).sort()) {
    const before = syncAiActors(state.aiPacks[packId] as WolfAiState, state);
    if (!isWorldPackActive(before, playerMotion.position, queries.definition)) {
      dormantPackIds.add(packId);
      aiPacks[packId] = { ...before, tick: before.tick + 1, events: [] };
      continue;
    }
    const stepped = stepWolfAi(
      before,
      {
        target: { ...playerMotion.position, yaw: playerMotion.facing },
        sounds,
        pulseOverrides: Object.fromEntries(
          before.wolves.map((wolf) => [wolf.id, state.combat.damageActors[wolf.id]?.pulse ?? 0]),
        ),
        roleOverrides: Object.fromEntries(
          queries.definition.packs[packId]?.actors
            .flatMap((actor) => actor.authoredRole === null
              ? []
              : [[actor.id, actor.authoredRole] as const]) ?? [],
        ),
      },
      {
        params: queries.definition.aiParams,
        los: queries,
        combat: adapter,
        graph: queries.definition.packNavGraphs[packId] ?? queries.definition.navGraph,
      },
    );
    aiPacks[packId] = { ...stepped.state, events: [] };
    for (const command of stepped.locomotion) locomotion.set(command.actorId, command);
    for (const event of stepped.state.events.slice(before.events.length)) {
      eventSeeds.push({ source: "ai", actorId: event.wolfId, payload: event });
    }
  }

  // The Warden runs on the same contract as the pack: he proposes, s10 disposes.
  // He is stepped before motion so his authored step is hosted this tick, and
  // he reads the same pre-motion player position the pack does.
  const wardenDefinition = queries.definition.warden;
  const wardenTick = state.warden === null || wardenDefinition === null
    ? null
    : stepWorldWarden(state.warden, queries.definition, {
        targetPosition: playerMotion.position,
        targetDied: (state.combat.damageActors[playerId]?.pulse ?? 0) <= 0,
        combatPulse: state.combat.damageActors[wardenDefinition.actorId]?.pulse ??
          state.warden.pulse,
        sequenceBase: aiSequence,
        tick: state.tick,
      });
  if (wardenTick !== null) {
    aiSequence += wardenTick.commands.length;
    for (const event of wardenTick.events) {
      eventSeeds.push({ source: "boss", actorId: wardenDefinition?.actorId ?? null, payload: event });
    }
  }

  // Motion is authoritative for every position and hosts authored root/knockback displacement.
  const actorsAfterMotion: Record<string, WorldActorState> = {};
  let combatBeforeStep = state.combat;
  const playerRooted = state.tick < state.snareRootUntilTick;
  for (const actorId of Object.keys(state.actors).sort()) {
    const base = state.actors[actorId] as WorldActorState;
    // The snare line roots whoever touches it; the Warden's own step is authored
    // displacement, hosted by motion exactly like combat knockback.
    const actor = actorId === wardenDefinition?.actorId && wardenTick?.displacement != null
      ? { ...base, pendingCombatDisplacement: wardenTick.displacement }
      : base;
    const packId = queries.definition.actors[actorId]?.packId;
    if (packId !== null && packId !== undefined && dormantPackIds.has(packId)) {
      actorsAfterMotion[actorId] = advanceDormantMotionClock(actor);
      continue;
    }
    const damageActor = combatBeforeStep.damageActors[actorId];
    const alive = (damageActor?.pulse ?? 0) > 0;
    const prepared = damageActor === undefined
      ? actor.motion
      : { ...actor.motion, breath: damageActor.breath };
    const seam = motionInputFor(
      { ...state, actors: { ...state.actors, [actorId]: { ...actor, motion: prepared } } },
      actorId,
      locomotion.get(actorId),
      held,
      actorId === playerId && playerRooted ? { ...input, moveX: 0, moveZ: 0 } : input,
      queries,
    );
    const aliveInput = packId === null || packId === undefined
      ? seam.input
      : withSupportedAiRoot({ ...actor, motion: prepared }, seam.input, queries);
    const motionStep = alive && packId !== null && packId !== undefined
      ? stepSupportedAiMotion(prepared, aliveInput, queries)
      : stepMotion(
          prepared,
          alive
            ? aliveInput
            : { moveX: 0, moveZ: 0, sprint: false, jump: false, cancelDisplacement: true },
          queries,
          queries.definition.motionParams,
        );
    actorsAfterMotion[actorId] = {
      ...actor,
      motion: motionStep.state,
      hostedActionInstance: seam.hostedActionInstance,
      pendingCombatDisplacement: null,
    };
    for (const event of motionStep.events) {
      eventSeeds.push({ source: "motion", actorId, payload: event });
      if (event.type === "fallDamage" && damageActor !== undefined) {
        const persistent = actorId === playerId
          ? createMercyStats(state.meta, queries.definition.metaParams).maxPulse
          : 100;
        combatBeforeStep = {
          ...combatBeforeStep,
          damageActors: {
            ...combatBeforeStep.damageActors,
            [actorId]: { ...damageActor, pulse: Math.max(0, damageActor.pulse - persistent * event.pulseFraction) },
          },
        };
      }
    }
  }
  combatBeforeStep = syncCombatFromMotion(combatBeforeStep, actorsAfterMotion);
  const stagedForSweeps: WorldState = {
    ...state,
    actors: actorsAfterMotion,
    combat: combatBeforeStep,
    aiPacks,
    warden: wardenTick?.state ?? state.warden,
    attend,
    heldActions,
  };

  let meta = state.meta;
  const tracked = combatTargetPosition(stagedForSweeps, attend.targetId);
  const combatStep = stepCombatSimulation(queries.definition.combatData, combatBeforeStep, {
    commands: [
      ...playerCommands(input, tracked, playerId),
      ...aiCommands,
      ...(wardenTick?.commands ?? []),
    ],
    swings: swingFrames(stagedForSweeps, queries),
  });
  for (const event of combatStep.events) {
    eventSeeds.push({ source: "combat", actorId: event.actorId, payload: event });
  }
  if (
    combatStep.events.some(
      (event) =>
        event.kind === "action_started" &&
        event.actorId === playerId &&
        event.actionId === "flask_drink",
    )
  ) {
    meta = beginTinctureUse(meta);
  }

  // Capture combat knockback as next-tick motion input, then immediately restore motion positions.
  const actorsAfterCombat: Record<string, WorldActorState> = { ...actorsAfterMotion };
  for (const actorId of Object.keys(actorsAfterCombat).sort()) {
    const before = combatBeforeStep.combat.actors[actorId]?.position;
    const after = combatStep.state.combat.actors[actorId]?.position;
    const actor = actorsAfterCombat[actorId];
    if (before === undefined || after === undefined || actor === undefined) continue;
    const delta = { x: after.x - before.x, y: after.y - before.y, z: after.z - before.z };
    const hasDelta = Math.hypot(delta.x, delta.y, delta.z) > 1e-9;
    const facing = combatStep.state.combat.actors[actorId]?.facingRadians;
    actorsAfterCombat[actorId] = {
      ...actor,
      motion: { ...actor.motion, facing: facing === undefined ? actor.motion.facing : inwardYaw(facing) },
      pendingCombatDisplacement: hasDelta ? delta : null,
    };
  }
  let combat = syncCombatFromMotion(combatStep.state, actorsAfterCombat);

  // "The quiet" is an area pulse, never a swing: no weapon, no Pulse damage,
  // Wither only, and only inside its authored radius (TUNING_V0 — 25 in 6 m).
  for (const pulse of wardenTick?.quietPulses ?? []) {
    const wardenPosition = actorsAfterCombat[wardenDefinition?.actorId ?? ""]?.motion.position;
    const playerPosition = actorsAfterCombat[playerId]?.motion.position;
    const damaged = combat.damageActors[playerId];
    if (wardenPosition === undefined || playerPosition === undefined || damaged === undefined) {
      continue;
    }
    const distance = Math.hypot(
      playerPosition.x - wardenPosition.x,
      playerPosition.y - wardenPosition.y,
      playerPosition.z - wardenPosition.z,
    );
    if (distance > pulse.radiusMeters) continue;
    combat = {
      ...combat,
      damageActors: {
        ...combat.damageActors,
        [playerId]: { ...damaged, turnBuildup: damaged.turnBuildup + pulse.witherAmount },
      },
    };
    eventSeeds.push({
      source: "boss",
      actorId: playerId,
      payload: {
        type: "wither-pulse-applied",
        targetId: playerId,
        witherAmount: pulse.witherAmount,
        radiusMeters: pulse.radiusMeters,
      },
    });
  }
  // One root per approach: the FSM re-arms every `rootTicks` while the player
  // stands in the band, and the player cannot walk out of a band that freezes
  // them. Only a fresh crossing counts.
  const playerPosition = actorsAfterCombat[playerId]?.motion.position;
  const inSnareBand = wardenDefinition !== null && playerPosition !== undefined &&
    resolveRingContact(
      wardenDefinition.ring,
      wardenDefinition.params,
      "player",
      playerPosition.x,
      playerPosition.z,
    ).touching;
  let snareRootUntilTick = state.snareRootUntilTick;
  if (wardenTick?.snareRootUntilTick != null && !state.snareBandContact) {
    snareRootUntilTick = wardenTick.snareRootUntilTick;
    eventSeeds.push({
      source: "boss",
      actorId: playerId,
      payload: {
        type: "snare-root-applied",
        targetId: playerId,
        untilTick: wardenTick.snareRootUntilTick,
      },
    });
  }

  // Phase 2 raises the Warden's Steady class (65 -> 80). s11 seeds poise bands
  // once at creation, so composition re-seats them on the phase change.
  if (wardenTick?.phaseChanged != null && wardenDefinition !== null) {
    const wardenId = wardenDefinition.actorId;
    const damaged = combat.damageActors[wardenId];
    const steady = queries.definition.combatData.params.steady.classes[
      wardenDefinition.phaseSteadyClasses[wardenTick.phaseChanged]
    ];
    if (damaged !== undefined && steady !== undefined) {
      combat = {
        ...combat,
        damageActors: {
          ...combat.damageActors,
          [wardenId]: {
            ...damaged,
            poiseBands: {
              flinch: steady.flinchThreshold,
              stagger: steady.staggerThreshold,
              knockdown: steady.knockdownThreshold,
            },
          },
        },
      };
    }
  }

  // Meta owns persistent maxima/vial/Names; combat owns transient Pulse/Breath/Turn.
  let stats = mercyStatsFromCombat(meta, combat, queries);
  const metaTick = stepMeta(meta, stats);
  meta = metaTick.state;
  stats = metaTick.stats;
  const activePlayerAction = combat.combat.actors[playerId]?.action;
  const flaskMove = queries.definition.combatData.frameData.moves.flask_drink;
  if (
    meta.pending !== null &&
    activePlayerAction?.id === "flask_drink" &&
    activePlayerAction.tick === flaskMove?.activeWindows[0]?.[0]
  ) {
    const committed = commitUse(meta, stats, queries.definition.metaParams);
    meta = committed.state;
    stats = committed.stats;
    for (const event of committed.events) eventSeeds.push({ source: "meta", actorId: playerId, payload: event });
  }
  if (
    meta.pending !== null &&
    combatStep.events.some((event) =>
      (event.kind === "stagger" || event.kind === "death") && event.targetId === playerId,
    )
  ) {
    meta = cancelUse(meta);
  }
  combat = patchPlayerStats(combat, playerId, stats);

  // Standard enemy deaths accrue Names once; player death drops/replaces the Open Page.
  for (const actorDefinition of Object.values(queries.definition.actors)
    .filter((actor) => actor.kind === "wolf")
    .sort((left, right) => left.id.localeCompare(right.id))) {
    const wasAlive = (state.combat.damageActors[actorDefinition.id]?.pulse ?? 0) > 0;
    const isDead = (combat.damageActors[actorDefinition.id]?.pulse ?? 0) <= 0;
    if (wasAlive && isDead && !meta.defeated.includes(actorDefinition.id)) {
      meta = markEnemyDefeated(meta, actorDefinition.id);
      const award = awardNames(meta, "kill", "wolf", queries.definition.metaParams);
      meta = award.state;
      for (const event of award.events) eventSeeds.push({ source: "meta", actorId: actorDefinition.id, payload: event });
    }
  }

  // The arena run state is s15's. The FSM only reports the crossings.
  for (const transition of wardenTick?.arenaTransitions ?? []) {
    meta = transition === "enter"
      ? enterArena(meta)
      : transition === "engage"
        ? engageBoss(meta)
        : transition === "defeated"
          ? bossDefeated(meta)
          : arenaOnDeath(meta);
  }

  // s10 owns his position, s11 owns his Pulse; the FSM reads both back.
  const wardenAfterWorld = wardenTick === null || wardenDefinition === null
    ? state.warden
    : {
        ...wardenTick.state,
        x: actorsAfterCombat[wardenDefinition.actorId]?.motion.position.x ?? wardenTick.state.x,
        z: actorsAfterCombat[wardenDefinition.actorId]?.motion.position.z ?? wardenTick.state.z,
        pulse: combat.damageActors[wardenDefinition.actorId]?.pulse ?? wardenTick.state.pulse,
      };

  let working: WorldState = {
    ...state,
    tick: nextTick,
    actors: actorsAfterCombat,
    combat,
    aiPacks: Object.fromEntries(
      Object.entries(aiPacks).map(([packId, pack]) => [packId, syncAiActors(pack, {
        ...state,
        actors: actorsAfterCombat,
        combat,
      })]),
    ),
    warden: wardenAfterWorld,
    meta,
    attend,
    heldActions,
    engaged: false,
  };

  const playerWasAlive = (state.combat.damageActors[playerId]?.pulse ?? 0) > 0;
  const playerIsDead = (combat.damageActors[playerId]?.pulse ?? 0) <= 0;
  if (playerWasAlive && playerIsDead) {
    const death = recordDeath(meta, actorsAfterCombat[playerId]?.motion.position ?? playerMotion.position);
    meta = death.state;
    for (const event of death.events) eventSeeds.push({ source: "meta", actorId: playerId, payload: event });
    const hearthId = meta.lastHearthId ?? queries.definition.respawnHearthId;
    const respawn = respawnAtHearth(meta, mercyStatsFromCombat(meta, combat, queries), hearthId, queries.definition.metaParams);
    meta = respawn.state;
    for (const event of respawn.events) eventSeeds.push({ source: "meta", actorId: playerId, payload: event });
    working = resetAtHearth(working, meta, queries, hearthId);
    eventSeeds.push({ source: "world", actorId: playerId, payload: { type: "world-respawn", hearthId } });
  } else {
    const recovered = recoverOpenPage(meta, working.actors[playerId]?.motion.position ?? playerMotion.position, queries.definition.metaParams);
    if (recovered.state !== meta) {
      meta = recovered.state;
      working = { ...working, meta };
      for (const event of recovered.events) eventSeeds.push({ source: "meta", actorId: playerId, payload: event });
      eventSeeds.push({ source: "world", actorId: playerId, payload: { type: "open-page-proximity", recovered: true } });
    }
  }

  let engaged = engagementFor(working);
  // Hearths are always a safe reset boundary. Engagement guards staged scenes,
  // but must not make the final mercy-loop rest impossible when a pack pursues.
  const sceneHoldsFrame = working.scenes.active !== null;
  if (pressed(input, "interact") && !sceneHoldsFrame) {
    const position = working.actors[playerId]?.motion.position;
    const hearthId = position === undefined ? null : nearestHearth(position, queries);
    if (hearthId !== null) {
      const rested = hearthRest(
        working.meta,
        mercyStatsFromCombat(working.meta, working.combat, queries),
        hearthId,
        queries.definition.metaParams,
      );
      for (const event of rested.events) eventSeeds.push({ source: "meta", actorId: playerId, payload: event });
      working = resetAtHearth(working, rested.state, queries, hearthId);
      engaged = false;
      eventSeeds.push({ source: "world", actorId: playerId, payload: { type: "world-respawn", hearthId } });
    }
  }

  // Scene engagement is a hard guard for scripted entries. The two boss-driven
  // scenes are the sanctioned exception the s25 contract documents: the ceremony
  // is a 90-tick invulnerable hold that deals no damage, and the aftermath opens
  // over a corpse. Both are no-damage moments, so D2 is satisfied by construction
  // and they enter with an idle engagement.
  let scenes: SceneState = working.scenes;
  const sceneEvents: SceneEvent[] = [];
  let arenaHearthLit = working.arenaHearthLit;
  if (wardenTick?.ceremonyRequested === true) {
    const entered = createWardenCeremonyTrigger(queries.definition.sceneCatalog)
      .begin(scenes, idleEngagement());
    scenes = entered.state;
    sceneEvents.push(...entered.events);
  }
  if (wardenTick?.aftermath != null && wardenDefinition !== null) {
    const entered = createWardenAftermathTrigger(queries.definition.sceneCatalog)
      .begin(scenes, idleEngagement());
    scenes = entered.state;
    sceneEvents.push(...entered.events);
    arenaHearthLit = true;
    eventSeeds.push({
      source: "world",
      actorId: wardenDefinition.actorId,
      payload: { type: "arena-hearth-lit", hearthId: wardenDefinition.arenaHearthId },
    });
  }
  const zoneId = zoneAt(
    queries.definition.zones,
    working.actors[playerId]?.motion.position ?? playerMotion.position,
  );
  const leftStartZone = working.leftStartZone || (zoneId !== null && zoneId !== "CABIN");
  const autoScene = sceneToEnter(
    { ...working, scenes, leftStartZone },
    queries.definition,
    { zoneId, engaged },
  );
  if (autoScene !== null) {
    const entered = tryEnterScene(scenes, autoScene, queries.definition.sceneCatalog, { engaged });
    scenes = entered.state;
    sceneEvents.push(...entered.events);
  }
  if (pressed(input, "interact") && scenes.active !== null) {
    const verb = interactVerb(scenes, queries.definition.sceneCatalog);
    if (verb !== null) {
      const applied = applyVerb(scenes, verb, queries.definition.sceneCatalog);
      scenes = applied.state;
      sceneEvents.push(...applied.events);
    }
  }
  if (input.scene?.enterId !== undefined) {
    const entered = tryEnterScene(
      scenes,
      input.scene.enterId,
      queries.definition.sceneCatalog,
      { engaged },
      input.scene.hearthId === undefined ? {} : { hearthId: input.scene.hearthId },
    );
    scenes = entered.state;
    sceneEvents.push(...entered.events);
  }
  if (input.scene?.verb !== undefined) {
    const applied = applyVerb(scenes, input.scene.verb, queries.definition.sceneCatalog);
    scenes = applied.state;
    sceneEvents.push(...applied.events);
  }
  const sceneStep = stepScene(scenes, queries.definition.sceneCatalog);
  scenes = sceneStep.state;
  sceneEvents.push(...sceneStep.events);
  for (const event of sceneEvents) eventSeeds.push({ source: "scenes", actorId: null, payload: event });

  // What the verbs promised, paid in mercy-loop currency.
  const effects = applySceneEffects(
    sceneEvents,
    working.meta,
    queries.definition.metaParams,
    arenaHearthLit,
  );
  arenaHearthLit = effects.arenaHearthLit;
  for (const event of effects.metaEvents) {
    eventSeeds.push({ source: "meta", actorId: playerId, payload: event });
  }
  const cleansed = effects.cleanseTurn ? working.combat.damageActors[playerId] : undefined;
  working = {
    ...working,
    meta: effects.meta,
    ...(cleansed === undefined
      ? {}
      : {
          combat: {
            ...working.combat,
            damageActors: {
              ...working.combat.damageActors,
              [playerId]: { ...cleansed, turnBuildup: 0, turned: false },
            },
          },
        }),
  };

  let nextEventSequence = state.nextEventSequence;
  const events: WorldEvent[] = eventSeeds.map((seed) => ({
    sequence: nextEventSequence++,
    tick: nextTick,
    ...seed,
  }));
  return {
    state: {
      ...working,
      scenes,
      meta: working.meta,
      engaged,
      arenaHearthLit,
      leftStartZone,
      snareBandContact: inSnareBand,
      snareRootUntilTick,
      nextEventSequence,
    },
    events,
  };
};
