import type { CombatData, CombatMoveData, SteadyClass } from "./data";
import {
  detectActiveSwingHits,
  type HurtboxActor,
  type RehitEntry,
} from "./detection";
import {
  createCombatState,
  isActorInvulnerable,
  stepCombat,
  type CombatActorSeed,
  type CombatActorState,
  type CombatState,
  type CombatStepCommand,
} from "./engine";
import type { CombatPresenterEvent } from "./events";
import { hashCanonical } from "./hash";
import { isTickInWindow } from "./action";
import { isHyperarmorActive, tickSteadyReset } from "./resources";
import {
  resolveHitBatch,
  type AuthoredHit,
  type HitActorSnapshot,
  type HitResolutionParams,
} from "./resolution";
import { combatRulesFromData } from "./rules";
import type { Capsule } from "./geometry";

export interface CombatSimulationSeed extends CombatActorSeed {
  readonly negation?: HitActorSnapshot["negation"];
  readonly pulse: number;
  readonly steadyClass: SteadyClass;
}

export interface CombatSimulationState {
  readonly combat: CombatState;
  readonly damageActors: Readonly<Record<string, HitActorSnapshot>>;
  readonly rehitLedger: readonly RehitEntry[];
  readonly version: 1;
}

export interface CombatSwingFrame {
  readonly attackerId: string;
  readonly currentWeapon: Capsule;
  readonly gridCellSize: number;
  readonly previousWeapon: Capsule;
  readonly targets: readonly HurtboxActor[];
}

export interface CombatSimulationFrame {
  readonly commands: readonly CombatStepCommand[];
  readonly guarding?: readonly { readonly actorId: string; readonly value: boolean }[];
  readonly swings?: readonly CombatSwingFrame[];
}

export interface CombatSimulationStep {
  readonly events: readonly CombatPresenterEvent[];
  readonly state: CombatSimulationState;
  readonly stateHash: string;
}

const zeroNegation = {
  pierce: 0,
  slash: 0,
  standard: 0,
  strike: 0,
  wither: 0,
} as const;

export const hitResolutionParamsFromData = (data: CombatData): HitResolutionParams => ({
  guardAbsorption: data.params.defense.guardAbsorption,
  guardBreathMultiplier: data.params.defense.guardCostIncomingMultiplier,
  guardBreakHitstopTicks: data.params.hitstop.guardBreakTicks,
  guardBreakStaggerTicks: data.params.defense.guardBreakStaggerTicks,
  hitstopTicks: {
    blocked: data.params.hitstop.blockedTicks,
    charged: data.params.hitstop.chargedTicks,
    critical: data.params.hitstop.criticalTicks,
    death: data.params.hitstop.deathTicks,
    guard_break: data.params.hitstop.guardBreakTicks,
    heavy: data.params.hitstop.heavyTicks,
    light: data.params.hitstop.lightTicks,
  },
  riposteWindowTicks: data.params.defense.guardBreakRiposteWindowTicks,
  turnThreshold: data.params.defense.turnThreshold,
  witherPoiseMultiplier: data.params.steady.witherPoiseMultiplier,
});

export const createCombatSimulation = (
  data: CombatData,
  roster: readonly CombatSimulationSeed[],
): CombatSimulationState => {
  const rules = combatRulesFromData(data);
  const combat = createCombatState(rules, roster);
  const damageActors: Record<string, HitActorSnapshot> = {};
  for (const seed of [...roster].sort((left, right) => left.id.localeCompare(right.id))) {
    const steady = data.params.steady.classes[seed.steadyClass];
    damageActors[seed.id] = {
      breath: data.params.breath.baseMaximum,
      combatClock: 0,
      guarding: false,
      hyperarmorPoise: 0,
      id: seed.id,
      invulnerable: false,
      negation: seed.negation ?? zeroNegation,
      poiseBands: {
        flinch: steady.flinchThreshold,
        knockdown: steady.knockdownThreshold,
        stagger: steady.staggerThreshold,
      },
      position: { ...seed.position },
      pulse: seed.pulse,
      steadyBuildup: 0,
      steadyCleanTicks: 0,
      turnBuildup: 0,
      turned: false,
    };
  }
  return { combat, damageActors, rehitLedger: [], version: 1 };
};

export const isCombatActorInvulnerable = (
  data: CombatData,
  state: CombatSimulationState,
  actorId: string,
): boolean => isActorInvulnerable(combatRulesFromData(data), state.combat, actorId);

const patchCombatState = (
  state: CombatState,
  hitstopByActor: Readonly<Record<string, number>>,
  positions: Readonly<Record<string, HitActorSnapshot["position"]>>,
  damageActors: Readonly<Record<string, HitActorSnapshot>>,
  nextEventSequence: number,
  reactions: Readonly<Record<string, "flinch" | "stagger" | "knockdown">>,
): CombatState => {
  const actors: Record<string, CombatActorState> = {};
  let nextActionInstance = state.nextActionInstance;
  for (const actorId of Object.keys(state.actors).sort()) {
    const actor = state.actors[actorId];
    if (actor === undefined) continue;
    const damageActor = damageActors[actorId];
    const staggered =
      damageActor?.staggerUntilClock !== undefined &&
      damageActor.combatClock < damageActor.staggerUntilClock;
    const died = damageActor !== undefined && damageActor.pulse <= 0;
    const reacted = reactions[actorId] !== undefined && !staggered && !died;
    const action = reacted
      ? {
          chargeHoldTicks: 0,
          id: "flinch",
          instanceId: nextActionInstance,
          tick: 0,
        }
      : staggered || died
        ? null
        : actor.action;
    if (reacted) nextActionInstance += 1;
    actors[actorId] = {
      ...actor,
      action,
      breath: {
        ...actor.breath,
        ticksSinceSpend:
          (damageActors[actorId]?.breath ?? actor.breath.value) < actor.breath.value
            ? 0
            : actor.breath.ticksSinceSpend,
        value: damageActors[actorId]?.breath ?? actor.breath.value,
      },
      buffer:
        staggered || died || reacted
          ? { ...actor.buffer, slots: {} }
          : actor.buffer,
      guarding: damageActor?.guarding ?? actor.guarding,
      hitstopRemaining: Math.max(actor.hitstopRemaining, hitstopByActor[actorId] ?? 0),
      pendingMoves: staggered || died || reacted ? {} : actor.pendingMoves,
      position: positions[actorId] ?? actor.position,
    };
  }
  return { ...state, actors, nextActionInstance, nextEventSequence };
};

const isLockedOut = (actor: HitActorSnapshot | undefined): boolean =>
  actor !== undefined &&
  (actor.pulse <= 0 ||
    (actor.staggerUntilClock !== undefined &&
      actor.combatClock < actor.staggerUntilClock));

const prepareLockedActors = (
  state: CombatState,
  damageActors: Readonly<Record<string, HitActorSnapshot>>,
): CombatState => {
  const actors: Record<string, CombatActorState> = {};
  for (const actorId of Object.keys(state.actors).sort()) {
    const actor = state.actors[actorId];
    if (actor === undefined) continue;
    actors[actorId] = isLockedOut(damageActors[actorId])
      ? {
          ...actor,
          action: null,
          buffer: { ...actor.buffer, slots: {} },
          guarding: false,
          pendingMoves: {},
        }
      : actor;
  }
  return { ...state, actors };
};

const actorFrameTick = (
  state: CombatSimulationState,
  actionStep: CombatState,
  actorId: string,
): number | undefined => {
  const action = actionStep.actors[actorId]?.action;
  if (action === null || action === undefined) return undefined;
  const wasFrozen = (state.combat.actors[actorId]?.hitstopRemaining ?? 0) > 0;
  return Math.max(0, action.tick - (wasFrozen ? 0 : 1));
};

const activeWindowsFor = (
  move: CombatMoveData,
  chargeHoldTicks: number,
): CombatMoveData["activeWindows"] =>
  move.activeWindows.map(([startTick, endTickExclusive]) => [
    startTick + chargeHoldTicks,
    endTickExclusive + chargeHoldTicks,
  ]);

const hyperarmorWindowFor = (
  move: CombatMoveData | undefined,
  chargeHoldTicks: number,
): { readonly endTickExclusive: number; readonly startTick: number } | undefined =>
  move?.hyperarmorWindow === null || move?.hyperarmorWindow === undefined
    ? undefined
    : {
        endTickExclusive: move.hyperarmorWindow[1] + chargeHoldTicks,
        startTick: move.hyperarmorWindow[0],
      };

const authoredHit = (
  data: CombatData,
  attackerId: string,
  targetId: string,
  moveId: string,
  swingId: string,
  facingRadians: number,
): AuthoredHit => {
  const move = data.frameData.moves[moveId];
  if (
    move === undefined ||
    move.damageType === "none" ||
    move.hitstopClass === "none"
  ) {
    throw new Error(`Active swing move must own damage and hitstop: ${moveId}`);
  }
  return {
    attackerFacingRadians: facingRadians,
    attackerId,
    critical: move.tags.includes("critical"),
    damageType: move.damageType,
    hitstopClass: move.hitstopClass,
    knockback: {
      forward: move.knockback.forwardMeters,
      right: move.knockback.rightMeters,
    },
    poiseDamage: move.poiseDamage,
    pulseDamage: move.pulseDamage,
    swingId,
    targetId,
    witherBuildup: move.witherBuildup,
  };
};

const detectFrameHits = (
  data: CombatData,
  state: CombatSimulationState,
  actionStep: CombatState,
  swings: readonly CombatSwingFrame[],
): { readonly hits: readonly AuthoredHit[]; readonly rehitLedger: readonly RehitEntry[] } => {
  const activeSwingIds = new Set(
    Object.values(actionStep.actors).flatMap((actor) =>
      actor.action === null ? [] : [`${actor.id}:${actor.action.instanceId}`],
    ),
  );
  let rehitLedger: readonly RehitEntry[] = state.rehitLedger.filter((entry) =>
    [...activeSwingIds].some((swingId) => entry.key.startsWith(`${swingId}>`)),
  );
  const hits: AuthoredHit[] = [];
  const sampledAttackers = new Set<string>();

  for (const swing of [...swings].sort((left, right) =>
    left.attackerId.localeCompare(right.attackerId),
  )) {
    if (sampledAttackers.has(swing.attackerId)) {
      throw new Error(`Only one weapon sweep is accepted per actor per tick: ${swing.attackerId}`);
    }
    sampledAttackers.add(swing.attackerId);
    const actor = actionStep.actors[swing.attackerId];
    const damageActor = state.damageActors[swing.attackerId];
    if (actor === undefined || damageActor === undefined) {
      throw new Error(`Weapon sweep references an unknown attacker: ${swing.attackerId}`);
    }
    if (
      damageActor.pulse <= 0 ||
      actor.action === null ||
      (state.combat.actors[actor.id]?.hitstopRemaining ?? 0) > 0
    ) {
      continue;
    }
    const actionTick = actorFrameTick(state, actionStep, swing.attackerId);
    const move = data.frameData.moves[actor.action.id];
    if (actionTick === undefined || move === undefined || move.damageType === "none") continue;
    for (const target of swing.targets) {
      if (state.damageActors[target.id] === undefined) {
        throw new Error(`Weapon sweep references an unknown target: ${target.id}`);
      }
    }
    const swingId = `${actor.id}:${actor.action.instanceId}`;
    const detected = detectActiveSwingHits({
      actionTick,
      activeWindows: activeWindowsFor(move, actor.action.chargeHoldTicks),
      combatClock: state.combat.actors[actor.id]?.buffer.inputClock ?? 0,
      currentWeapon: swing.currentWeapon,
      gridCellSize: swing.gridCellSize,
      previousWeapon: swing.previousWeapon,
      rehitLedger,
      rehitLockoutTicks: move.reHitLockoutTicks,
      swingId,
      targets: swing.targets.filter((target) => target.id !== actor.id),
    });
    rehitLedger = detected.rehitLedger;
    for (const contact of detected.contacts) {
      hits.push(
        authoredHit(
          data,
          actor.id,
          contact.targetId,
          actor.action.id,
          swingId,
          actor.facingRadians,
        ),
      );
    }
  }
  return { hits, rehitLedger };
};

export const stepCombatSimulation = (
  data: CombatData,
  state: CombatSimulationState,
  frame: CombatSimulationFrame,
): CombatSimulationStep => {
  const rules = combatRulesFromData(data);
  const preparedCombat = prepareLockedActors(state.combat, state.damageActors);
  const allowedCommands = frame.commands.filter(
    (command) => !isLockedOut(state.damageActors[command.actorId]),
  );
  const guardingCommands =
    frame.guarding
      ?.filter((entry) => !isLockedOut(state.damageActors[entry.actorId]))
      .map((entry) => ({ actorId: entry.actorId, guarding: entry.value })) ?? [];
  const actionStep = stepCombat(rules, preparedCombat, [
    ...allowedCommands,
    ...guardingCommands,
  ]);
  const detected = detectFrameHits(
    data,
    state,
    actionStep.state,
    frame.swings ?? [],
  );
  let damageActors = Object.values(state.damageActors)
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((actor) => {
      const combatActor = actionStep.state.actors[actor.id];
      const wasFrozen = (state.combat.actors[actor.id]?.hitstopRemaining ?? 0) > 0;
      const action = combatActor?.action;
      const actionTick = actorFrameTick(state, actionStep.state, actor.id);
      const moveRules = action === undefined || action === null ? undefined : rules.moves[action.id];
      const move =
        action === undefined || action === null
          ? undefined
          : data.frameData.moves[action.id];
      const hyperarmorWindow =
        action === undefined || action === null
          ? undefined
          : hyperarmorWindowFor(move, action.chargeHoldTicks);
      const hyperarmorPoise =
        actionTick !== undefined &&
        hyperarmorWindow !== undefined &&
        isHyperarmorActive(actionTick, hyperarmorWindow)
          ? (move?.hyperarmorPoise ?? 0)
          : 0;
      const steady = wasFrozen
        ? { buildup: actor.steadyBuildup, cleanTicks: actor.steadyCleanTicks }
        : tickSteadyReset(
            { buildup: actor.steadyBuildup, cleanTicks: actor.steadyCleanTicks },
            data.params.steady.cleanResetTicks,
          );
      return {
        ...actor,
        breath: combatActor?.breath.value ?? actor.breath,
        combatClock: combatActor?.buffer.inputClock ?? actor.combatClock,
        guarding: combatActor?.guarding ?? actor.guarding,
        hyperarmorPoise,
        invulnerable:
          actionTick !== undefined && moveRules?.iframeWindow !== undefined
            ? isTickInWindow(actionTick, moveRules.iframeWindow)
            : false,
        position: combatActor?.position ?? actor.position,
        steadyBuildup: steady.buildup,
        steadyCleanTicks: steady.cleanTicks,
      };
    });
  const hitStep = resolveHitBatch(
    damageActors,
    detected.hits,
    [],
    hitResolutionParamsFromData(data),
    state.combat.worldTick,
    actionStep.state.nextEventSequence,
  );
  damageActors = Object.values(hitStep.actors)
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((actor) => {
      const combatActor = actionStep.state.actors[actor.id];
      const action = combatActor?.action;
      const moveRules =
        action === undefined || action === null ? undefined : rules.moves[action.id];
      const move =
        action === undefined || action === null
          ? undefined
          : data.frameData.moves[action.id];
      const hyperarmorWindow =
        action === undefined || action === null
          ? undefined
          : hyperarmorWindowFor(move, action.chargeHoldTicks);
      const hyperarmorPoise =
        action !== undefined &&
        action !== null &&
        hyperarmorWindow !== undefined &&
        isHyperarmorActive(action.tick, hyperarmorWindow)
          ? (move?.hyperarmorPoise ?? 0)
          : 0;
      return {
        ...actor,
        hyperarmorPoise,
        invulnerable:
          action !== undefined &&
          action !== null &&
          moveRules?.iframeWindow !== undefined
            ? isTickInWindow(action.tick, moveRules.iframeWindow)
            : false,
      };
    });
  const damageActorRecord = Object.fromEntries(
    damageActors.map((actor) => [actor.id, actor]),
  ) as Readonly<Record<string, HitActorSnapshot>>;
  const reactions = Object.fromEntries(
    hitStep.events.flatMap((event) =>
      event.kind === "stagger" ? [[event.targetId, event.severity] as const] : [],
    ),
  ) as Readonly<Record<string, "flinch" | "stagger" | "knockdown">>;
  const combat = patchCombatState(
    actionStep.state,
    hitStep.hitstopByActor,
    hitStep.displacements,
    damageActorRecord,
    hitStep.nextEventSequence,
    reactions,
  );
  const nextState: CombatSimulationState = {
    combat,
    damageActors: damageActorRecord,
    rehitLedger: detected.rehitLedger,
    version: 1,
  };
  return {
    events: [...actionStep.events, ...hitStep.events],
    state: nextState,
    stateHash: hashCanonical(nextState),
  };
};
