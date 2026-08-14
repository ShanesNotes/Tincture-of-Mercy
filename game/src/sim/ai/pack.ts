import { compareId, distXz, sortById, yawToward } from "./math";
import {
  advancePathIndex,
  assignPackSlots,
  pathWaypoint,
  planRoute,
  roleDestination,
  seekVelocity,
  speedFor,
} from "./nav";
import type { WolfAiParams } from "./params";
import { nextAlert, samplePerception } from "./perception";
import { assignRoles, feintIntervalForTier, roleAttack, shouldFlee } from "./roles";
import { dueToRelease, pickTokenCandidate } from "./token";
import type {
  AiEvent,
  CombatActions,
  CompiledWalkGraph,
  LocomotionCommand,
  LosQuery,
  Vec3,
  WolfActorState,
  WolfAiState,
  WolfAiStepInput,
  WolfAiStepResult,
  WolfSpawn,
} from "./types";
import { WOLF_AI_STATE_VERSION } from "./types";

const event = (
  tick: number,
  kind: AiEvent["kind"],
  wolfId: string,
  detail: string,
): AiEvent => ({ tick, kind, wolfId, detail });

const homeOf = (state: WolfAiState): Vec3 => ({
  x: state.pack.homeX,
  y: state.pack.homeY,
  z: state.pack.homeZ,
});

const spawnCircleSign = (id: string): 1 | -1 => {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash + id.charCodeAt(index) * (index + 1)) % 2;
  }
  return hash === 0 ? 1 : -1;
};

export const createWolfAiState = (
  wolves: readonly WolfSpawn[],
  home: Vec3,
  params: WolfAiParams,
): WolfAiState => {
  const roles = assignRoles(wolves.map((wolf) => wolf.id));
  const actors: WolfActorState[] = sortById(wolves).map((spawn) => {
    const maxPulse = spawn.maxPulse ?? 100;
    const pulse = spawn.pulse ?? maxPulse;
    const role = roles.get(spawn.id);
    if (role === undefined) {
      throw new Error(`role assignment missed ${spawn.id}`);
    }
    return {
      id: spawn.id,
      role,
      x: spawn.x,
      y: spawn.y,
      z: spawn.z,
      yaw: spawn.yaw ?? 0,
      pulse,
      maxPulse,
      alert: "unaware",
      alertTimer: 0,
      confirmTimer: 0,
      lastKnownX: spawn.x,
      lastKnownY: spawn.y,
      lastKnownZ: spawn.z,
      hasToken: false,
      lastAttackTick: null,
      action: null,
      mode: "idle",
      fleeReturnTick: null,
      path: [],
      pathIndex: 0,
      assignedSlot: null,
      crowdFailure: "none",
      circleSign: spawnCircleSign(spawn.id),
      feintReadyTick: params.roles.feintIntervalTicks,
      alive: pulse > 0,
    };
  });

  const assignEvents = actors.map((wolf) => event(0, "role_assign", wolf.id, wolf.role));

  return {
    version: WOLF_AI_STATE_VERSION,
    tick: 0,
    pack: {
      homeX: home.x,
      homeY: home.y,
      homeZ: home.z,
      aggressionTier: 0,
      tokenHolderId: null,
      tokenResolvedTick: null,
      tokenReleaseTick: null,
      howlCount: 0,
    },
    wolves: actors,
    events: assignEvents,
  };
};

const applyMembership = (
  wolves: readonly WolfActorState[],
  input: WolfAiStepInput,
  tick: number,
  events: AiEvent[],
): WolfActorState[] => {
  const dead = new Set(input.deadIds ?? []);
  const next = wolves.map((wolf) => {
    const pulse = input.pulseOverrides?.[wolf.id] ?? wolf.pulse;
    const alive = pulse > 0 && !dead.has(wolf.id);
    return { ...wolf, pulse, alive };
  });

  const livingIds = next.filter((wolf) => wolf.alive).map((wolf) => wolf.id);
  const previous = next
    .filter((wolf) => wolf.alive)
    .map((wolf) => `${wolf.id}:${wolf.role}`)
    .join("|");
  const roles = assignRoles(livingIds);
  const reassigned = next.map((wolf) => {
    if (!wolf.alive) {
      return { ...wolf, hasToken: false, action: null };
    }
    const role = input.roleOverrides?.[wolf.id] ?? roles.get(wolf.id);
    if (role === undefined || role === wolf.role) {
      return wolf;
    }
    return { ...wolf, role };
  });

  const updated = reassigned
    .filter((wolf) => wolf.alive)
    .map((wolf) => `${wolf.id}:${wolf.role}`)
    .join("|");
  if (updated !== previous) {
    for (const wolf of reassigned) {
      if (wolf.alive) {
        events.push(event(tick, "role_assign", wolf.id, wolf.role));
      }
    }
  }

  return reassigned;
};

const updateModes = (
  wolf: WolfActorState,
  target: Vec3,
  home: Vec3,
  tick: number,
  params: WolfAiParams,
  events: AiEvent[],
): WolfActorState => {
  if (!wolf.alive) {
    return { ...wolf, hasToken: false, action: null };
  }

  if (shouldFlee(wolf.pulse, wolf.maxPulse, params) && wolf.mode !== "flee" && wolf.mode !== "return") {
    events.push(event(tick, "flee", wolf.id, "pulse"));
    return {
      ...wolf,
      mode: "flee",
      fleeReturnTick: tick + params.flee.returnTicks,
      hasToken: false,
      action: null,
    };
  }

  if (wolf.mode === "flee" && wolf.fleeReturnTick !== null && tick >= wolf.fleeReturnTick) {
    events.push(event(tick, "return", wolf.id, String(params.flee.returnTicks)));
    return { ...wolf, mode: "return" };
  }

  if (wolf.mode === "return" && distXz(wolf, target) <= params.roles.reengageRadiusM) {
    return { ...wolf, mode: "engage", fleeReturnTick: null };
  }

  const beyondLeash =
    distXz(target, home) > params.leash.radiusM || distXz(wolf, home) > params.leash.radiusM;
  if (beyondLeash && wolf.mode !== "flee" && wolf.mode !== "return") {
    if (wolf.mode !== "leash_reset") {
      events.push(event(tick, "leash_reset", wolf.id, "25m"));
    }
    return { ...wolf, mode: "leash_reset", hasToken: false, action: null };
  }
  if (wolf.mode === "leash_reset" && !beyondLeash) {
    return { ...wolf, mode: wolf.alert === "alert" ? "engage" : "idle" };
  }

  if (wolf.alert === "alert" && wolf.mode === "idle") {
    return { ...wolf, mode: "engage" };
  }
  if (wolf.alert === "suspicious" && wolf.mode === "idle") {
    return { ...wolf, mode: "engage" };
  }

  return wolf;
};

export const stepWolfAi = (
  state: WolfAiState,
  input: WolfAiStepInput,
  deps: {
    readonly params: WolfAiParams;
    readonly los: LosQuery;
    readonly combat: CombatActions;
    readonly graph: CompiledWalkGraph;
  },
): WolfAiStepResult => {
  const tick = state.tick + 1;
  const events: AiEvent[] = [];
  const home = homeOf(state);
  const sounds = input.sounds ?? [];
  const blocked = new Set(input.blockedEdges ?? []);

  let wolves = applyMembership(state.wolves, input, tick, events);
  let pack = state.pack;

  const holderDead =
    pack.tokenHolderId !== null &&
    wolves.find((wolf) => wolf.id === pack.tokenHolderId)?.alive !== true;
  if (holderDead || dueToRelease(pack, tick)) {
    if (pack.tokenHolderId !== null) {
      events.push(event(tick, "token_release", pack.tokenHolderId, holderDead ? "death" : "timer"));
    }
    wolves = wolves.map((wolf) => ({ ...wolf, hasToken: false }));
    pack = {
      ...pack,
      tokenHolderId: null,
      tokenResolvedTick: null,
      tokenReleaseTick: null,
    };
  }

  wolves = wolves.map((wolf) => {
    if (!wolf.alive) {
      return wolf;
    }
    const sample = samplePerception(wolf, input.target, sounds, deps.los, deps.params);
    const alert = nextAlert(
      wolf.alert,
      wolf.alertTimer,
      wolf.confirmTimer,
      sample.seen,
      sample.heard,
      deps.params,
    );
    return {
      ...wolf,
      alert: alert.alert,
      alertTimer: alert.alertTimer,
      confirmTimer: alert.confirmTimer,
      lastKnownX: sample.lastKnown.x,
      lastKnownY: sample.lastKnown.y,
      lastKnownZ: sample.lastKnown.z,
    };
  });

  wolves = wolves.map((wolf) => updateModes(wolf, input.target, home, tick, deps.params, events));

  if (input.howlRequested) {
    pack = {
      ...pack,
      aggressionTier: pack.aggressionTier + deps.params.howl.aggressionDelta,
      howlCount: pack.howlCount + 1,
    };
    const caller =
      sortById(wolves.filter((wolf) => wolf.alive && wolf.mode === "engage"))[0] ??
      sortById(wolves.filter((wolf) => wolf.alive))[0];
    if (caller !== undefined) {
      events.push(event(tick, "howl", caller.id, `tier:${String(pack.aggressionTier)}`));
      wolves = wolves.map((wolf) =>
        wolf.id === caller.id
          ? { ...wolf, action: { id: "howl" as const, startedTick: tick } }
          : wolf,
      );
    }
  }

  if (pack.tokenHolderId === null) {
    const candidate = pickTokenCandidate(wolves, input.target, tick, deps.params);
    if (candidate !== null) {
      pack = { ...pack, tokenHolderId: candidate.id };
      wolves = wolves.map((wolf) => ({ ...wolf, hasToken: wolf.id === candidate.id }));
      events.push(event(tick, "token_grant", candidate.id, candidate.role));
    }
  } else {
    wolves = wolves.map((wolf) => ({ ...wolf, hasToken: wolf.id === pack.tokenHolderId }));
  }

  const tokenHolder = wolves.find((wolf) => wolf.id === pack.tokenHolderId);
  if (
    tokenHolder !== undefined &&
    tokenHolder.alive &&
    tokenHolder.action === null &&
    pack.tokenResolvedTick === null
  ) {
    const action = roleAttack(tokenHolder.role);
    const started = deps.combat.startAction({
      actorId: tokenHolder.id,
      action,
      tick,
    });
    if (started) {
      events.push(event(tick, "role_action", tokenHolder.id, action));
      wolves = wolves.map((wolf) =>
        wolf.id === tokenHolder.id
          ? { ...wolf, action: { id: action, startedTick: tick }, lastAttackTick: tick }
          : wolf,
      );
    }
  }

  const actingHolder = wolves.find((wolf) => wolf.id === pack.tokenHolderId);
  if (
    actingHolder?.action !== undefined &&
    actingHolder.action !== null &&
    pack.tokenResolvedTick === null &&
    deps.combat.isResolved(actingHolder.id, actingHolder.action.startedTick, tick)
  ) {
    pack = {
      ...pack,
      tokenResolvedTick: tick,
      tokenReleaseTick: tick + deps.params.token.releaseTicksAfterResolution,
    };
  }

  const feintGap = feintIntervalForTier(deps.params, pack.aggressionTier);
  wolves = wolves.map((wolf) => {
    if (
      !wolf.alive ||
      wolf.role !== "baiter" ||
      wolf.mode !== "engage" ||
      wolf.hasToken ||
      wolf.action !== null
    ) {
      return wolf;
    }
    if (tick < wolf.feintReadyTick) {
      return wolf;
    }
    const started = deps.combat.startAction({ actorId: wolf.id, action: "feint", tick });
    if (!started) {
      return wolf;
    }
    events.push(event(tick, "role_action", wolf.id, "feint"));
    return {
      ...wolf,
      action: { id: "feint", startedTick: tick },
      feintReadyTick: tick + feintGap,
    };
  });

  wolves = wolves.map((wolf) => {
    if (wolf.action === null) {
      return wolf;
    }
    if (deps.combat.isResolved(wolf.id, wolf.action.startedTick, tick)) {
      return { ...wolf, action: null };
    }
    return wolf;
  });

  const slots = assignPackSlots(wolves, input.target, new Set(), deps.params, pack.aggressionTier);
  const othersOf = (id: string): Vec3[] =>
    wolves.filter((wolf) => wolf.alive && wolf.id !== id).map((wolf) => ({ x: wolf.x, y: wolf.y, z: wolf.z }));

  const locomotion: LocomotionCommand[] = [];
  wolves = wolves.map((wolf) => {
    if (!wolf.alive) {
      return wolf;
    }
    const slot = slots.get(wolf.id);
    const routingWolf = wolf.mode === "loiter" ? { ...wolf, mode: "engage" as const } : wolf;
    let dest = roleDestination(
      routingWolf,
      input.target,
      home,
      slot,
      deps.params,
      pack.aggressionTier,
      tick,
    );
    if (wolf.mode === "return") {
      dest = input.target;
    }

    const planned = planRoute(routingWolf, dest, deps.graph, blocked, deps.params);
    let mode = wolf.mode;
    let failure = planned.failure;
    if (planned.failure === "unreachable_loiter") {
      if (mode !== "loiter") {
        events.push(event(tick, "loiter", wolf.id, "unreachable"));
      }
      mode = "loiter";
      dest = roleDestination(
        { ...wolf, mode: "loiter" },
        input.target,
        home,
        slot,
        deps.params,
        pack.aggressionTier,
        tick,
      );
    } else if (mode === "loiter" && wolf.crowdFailure === "unreachable_loiter") {
      mode = wolf.alert === "unaware" ? "idle" : "engage";
    } else if (slot?.outerQueue === true && mode === "engage") {
      failure = "slot_outer_queue";
    }
    if (planned.failure === "blocked_replan") {
      events.push(event(tick, "replan", wolf.id, "blocked"));
    }

    const pathIndex = advancePathIndex(
      wolf,
      deps.graph,
      planned.path,
      planned.pathIndex,
      deps.params.nav.arrivalRadiusM,
    );
    const waypoint =
      mode === "loiter" || distXz(wolf, dest) <= deps.params.nav.directSeekRadiusM
        ? dest
        : (pathWaypoint(deps.graph, planned.path, pathIndex) ?? dest);

    const speed = speedFor({ ...wolf, mode }, deps.params);
    const velocity = seekVelocity(wolf, waypoint, speed, othersOf(wolf.id), deps.params);
    const facing =
      hypot2Safe(velocity.x, velocity.z) > 0.05 ? Math.atan2(velocity.x, velocity.z) : yawToward(wolf, dest);

    locomotion.push({
      actorId: wolf.id,
      desiredVelocityX: velocity.x,
      desiredVelocityZ: velocity.z,
      waypoint,
      facingYaw: facing,
    });

    return {
      ...wolf,
      mode,
      path: planned.path,
      pathIndex,
      assignedSlot: slot?.slot ?? null,
      crowdFailure: failure,
      yaw: facing,
    };
  });

  locomotion.sort((left, right) => compareId(left.actorId, right.actorId));

  return {
    locomotion,
    state: {
      version: WOLF_AI_STATE_VERSION,
      tick,
      pack,
      wolves: sortById(wolves),
      events: [...state.events, ...events],
    },
  };
};

const hypot2Safe = (x: number, z: number): number => Math.hypot(x, z);

export const applyLocomotion = (
  state: WolfAiState,
  locomotion: readonly LocomotionCommand[],
  dtSeconds: number,
): WolfAiState => {
  const byId = new Map(locomotion.map((command) => [command.actorId, command]));
  return {
    ...state,
    wolves: state.wolves.map((wolf) => {
      const command = byId.get(wolf.id);
      if (command === undefined || !wolf.alive) {
        return wolf;
      }
      return {
        ...wolf,
        x: wolf.x + command.desiredVelocityX * dtSeconds,
        z: wolf.z + command.desiredVelocityZ * dtSeconds,
        yaw: command.facingYaw,
      };
    }),
  };
};
