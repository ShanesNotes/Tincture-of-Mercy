import {
  canCancelAction,
  getActionTotalTicks,
  isTickInWindow,
  type ActionCancelRule,
  type ActionFrameData,
  type TickWindow,
} from "./action";
import {
  COMBAT_BUFFER_ACTIONS,
  advanceCombatInputClock,
  captureCombatInput,
  consumeOldestCombatInput,
  createCombatInputBuffer,
  type CombatBufferAction,
  type CombatBufferWindows,
  type CombatInputBufferState,
  type CombatInputEdge,
} from "./buffer";
import type { CombatPresenterEvent } from "./events";
import { hashCanonical } from "./hash";
import { tickBreathRegen, trySpendBreath, type BreathState } from "./resources";
import { rotateTowardTarget } from "./tracking";

export interface CombatMoveRules {
  readonly action: ActionFrameData;
  readonly activeWindows?: readonly TickWindow[];
  readonly breathCost: number;
  readonly cancelRules?: readonly ActionCancelRule[];
  readonly chargeHoldMaxTicks?: number;
  readonly committed?: boolean;
  readonly criticalKind?: "backstab" | "riposte";
  readonly hyperarmorPoise?: number;
  readonly hyperarmorWindow?: TickWindow;
  readonly iframeWindow?: TickWindow;
  readonly reHitLockoutTicks?: number;
  readonly trackingUntilTick?: number;
  readonly trackingWindows?: readonly TickWindow[];
  readonly turnRateRadiansPerTick?: number;
}

export type CombatRollBand = "light" | "medium" | "heavy";

export interface CombatRules {
  readonly breath: {
    readonly guardingMultiplier: number;
    readonly max: number;
    readonly regenDelayTicks: number;
    readonly regenPerSecond: number;
    readonly tickRate: number;
  };
  readonly bufferWindows: CombatBufferWindows;
  readonly inputMoves?: Readonly<Record<CombatBufferAction, string>>;
  readonly moves: Readonly<Record<string, CombatMoveRules>>;
  readonly recoveryCancelTailTicks: number;
  readonly rollMoves?: Readonly<Record<CombatRollBand, string>>;
}

export interface CombatActorSeed {
  readonly actorClass: string;
  readonly facingRadians: number;
  readonly id: string;
  readonly position: { readonly x: number; readonly y: number; readonly z: number };
  readonly rollBand?: CombatRollBand;
}

export interface CombatActionState {
  readonly chargeHoldTicks: number;
  readonly charging: boolean;
  readonly criticalTargetId?: string;
  readonly id: string;
  readonly instanceId: number;
  readonly tick: number;
}

export interface CombatActorState {
  readonly action: CombatActionState | null;
  readonly actorClass: string;
  readonly breath: BreathState;
  readonly buffer: CombatInputBufferState;
  readonly facingRadians: number;
  readonly guarding: boolean;
  readonly hitstopRemaining: number;
  readonly id: string;
  readonly pendingMoves: Readonly<
    Partial<
      Record<
        CombatBufferAction,
        {
          readonly chargeHoldTicks: number;
          readonly chargeReleased: boolean;
          readonly criticalTargetId?: string;
          readonly moveId: string;
        }
      >
    >
  >;
  readonly position: { readonly x: number; readonly y: number; readonly z: number };
  readonly rollBand: CombatRollBand;
}

export interface CombatState {
  readonly actors: Readonly<Record<string, CombatActorState>>;
  readonly nextActionInstance: number;
  readonly nextEventSequence: number;
  readonly version: 1;
  readonly worldTick: number;
}

export interface CombatStepCommand {
  readonly actorId: string;
  readonly criticalTargetId?: string;
  readonly edge?: CombatInputEdge;
  readonly guarding?: boolean;
  readonly moveId?: string;
  readonly targetPosition?: { readonly x: number; readonly z: number };
}

export interface CombatStepResult {
  readonly events: readonly CombatPresenterEvent[];
  readonly state: CombatState;
  readonly stateHash: string;
}

const assertRules = (rules: CombatRules): void => {
  if (!Number.isSafeInteger(rules.recoveryCancelTailTicks) || rules.recoveryCancelTailTicks < 0) {
    throw new Error("Recovery cancel tail must be a non-negative integer.");
  }
};

export const createCombatState = (
  rules: CombatRules,
  roster: readonly CombatActorSeed[],
): CombatState => {
  assertRules(rules);
  const actors: Record<string, CombatActorState> = {};
  for (const seed of [...roster].sort((left, right) => left.id.localeCompare(right.id))) {
    if (seed.id.length === 0 || actors[seed.id] !== undefined) {
      throw new Error(`Combat actor id must be non-empty and unique: ${seed.id}`);
    }
    if (!Number.isFinite(seed.facingRadians)) {
      throw new Error(`Actor ${seed.id} facing must be finite.`);
    }
    actors[seed.id] = {
      action: null,
      actorClass: seed.actorClass,
      breath: { max: rules.breath.max, ticksSinceSpend: 0, value: rules.breath.max },
      buffer: createCombatInputBuffer(),
      facingRadians: seed.facingRadians,
      guarding: false,
      hitstopRemaining: 0,
      id: seed.id,
      pendingMoves: {},
      position: { ...seed.position },
      rollBand: seed.rollBand ?? "medium",
    };
  }
  return {
    actors,
    nextActionInstance: 0,
    nextEventSequence: 0,
    version: 1,
    worldTick: 0,
  };
};

const fallbackMoveFor = (action: CombatBufferAction): string => {
  if (action === "attack") return "light1";
  if (action === "roll") return "roll_medium";
  return "flask";
};

const canBeginMove = (
  rules: CombatRules,
  actor: CombatActorState,
  moveId: string,
  nextAction: CombatBufferAction,
): boolean => {
  const nextMove = rules.moves[moveId];
  if (nextMove === undefined || nextMove.breathCost > actor.breath.value) return false;
  if (actor.action === null) return true;
  const currentMove = rules.moves[actor.action.id];
  if (currentMove === undefined) throw new Error(`Unknown active move: ${actor.action.id}`);
  if (currentMove.committed === true) return false;
  return canCancelAction(
    actionFrameFor(currentMove, actor.action),
    actor.action.tick,
    nextAction,
    currentMove.cancelRules ?? [],
    rules.recoveryCancelTailTicks,
  );
};

const actionFrameFor = (
  move: CombatMoveRules,
  action: CombatActionState,
): ActionFrameData => ({
  ...move.action,
  startup: move.action.startup + action.chargeHoldTicks,
});

const eventForAction = (
  state: Pick<CombatState, "nextEventSequence" | "worldTick">,
  actorId: string,
  actionId: string,
  kind: "action_started" | "action_ended",
): CombatPresenterEvent => ({
  actionId,
  actorId,
  kind,
  sequence: state.nextEventSequence,
  tick: state.worldTick,
});

export const stepCombat = (
  rules: CombatRules,
  state: CombatState,
  commands: readonly CombatStepCommand[],
): CombatStepResult => {
  assertRules(rules);
  const commandsByActor = new Map<string, CombatStepCommand[]>();
  for (const command of commands) {
    if (state.actors[command.actorId] === undefined) {
      throw new Error(`Unknown combat actor: ${command.actorId}`);
    }
    const list = commandsByActor.get(command.actorId) ?? [];
    list.push(command);
    commandsByActor.set(command.actorId, list);
  }

  const actors: Record<string, CombatActorState> = {};
  const events: CombatPresenterEvent[] = [];
  let nextActionInstance = state.nextActionInstance;
  let nextEventSequence = state.nextEventSequence;

  for (const actorId of Object.keys(state.actors).sort()) {
    const original = state.actors[actorId];
    if (original === undefined) continue;
    let actor = original;
    let targetPosition: { readonly x: number; readonly z: number } | undefined;

    for (const command of commandsByActor.get(actorId) ?? []) {
      targetPosition = command.targetPosition ?? targetPosition;
      if (command.guarding !== undefined) {
        actor = { ...actor, guarding: command.guarding };
      }
      if (command.edge === undefined) continue;
      if (!command.edge.pressed) {
        if (command.edge.action === "attack" && actor.action !== null) {
          const activeMove = rules.moves[actor.action.id];
          if ((activeMove?.chargeHoldMaxTicks ?? 0) > 0) {
            actor = {
              ...actor,
              action: { ...actor.action, charging: false },
            };
          }
        }
        const pending = actor.pendingMoves[command.edge.action];
        const buffered = actor.buffer.slots[command.edge.action];
        const pendingRules =
          pending === undefined ? undefined : rules.moves[pending.moveId];
        if (
          pending !== undefined &&
          buffered !== undefined &&
          (pendingRules?.chargeHoldMaxTicks ?? 0) > 0
        ) {
          actor = {
            ...actor,
            pendingMoves: {
              ...actor.pendingMoves,
              [command.edge.action]: {
                ...pending,
                chargeHoldTicks: Math.min(
                  actor.buffer.inputClock - buffered.tick,
                  pendingRules?.chargeHoldMaxTicks ?? 0,
                ),
                chargeReleased: true,
              },
            },
          };
        }
        continue;
      }
      const existing = actor.buffer.slots[command.edge.action];
      const buffer = captureCombatInput(actor.buffer, command.edge);
      const moveId =
        command.moveId ??
        (command.edge.action === "roll"
          ? rules.rollMoves?.[actor.rollBand]
          : undefined) ??
        rules.inputMoves?.[command.edge.action] ??
        fallbackMoveFor(command.edge.action);
      const selectedMove = rules.moves[moveId];
      if (selectedMove === undefined) throw new Error(`Unknown combat move: ${moveId}`);
      if (
        selectedMove.criticalKind !== undefined &&
        command.criticalTargetId === undefined
      ) {
        throw new Error(`Critical combat move requires a bound target: ${moveId}`);
      }
      actor = {
        ...actor,
        buffer,
        pendingMoves:
          existing === undefined &&
          buffer.slots[command.edge.action] !== undefined &&
          command.edge.pressed
            ? {
                ...actor.pendingMoves,
                [command.edge.action]: {
                  chargeHoldTicks: 0,
                  chargeReleased: false,
                  ...(command.criticalTargetId === undefined
                    ? {}
                    : { criticalTargetId: command.criticalTargetId }),
                  moveId,
                },
              }
            : actor.pendingMoves,
      };
    }

    if (actor.hitstopRemaining > 0) {
      actors[actorId] = { ...actor, hitstopRemaining: actor.hitstopRemaining - 1 };
      continue;
    }

    if (actor.action !== null) {
      const move = rules.moves[actor.action.id];
      if (move === undefined) throw new Error(`Unknown active move: ${actor.action.id}`);
      if (actor.action.tick >= getActionTotalTicks(actionFrameFor(move, actor.action))) {
        events.push(
          eventForAction(
            { nextEventSequence, worldTick: state.worldTick },
            actorId,
            actor.action.id,
            "action_ended",
          ),
        );
        nextEventSequence += 1;
        actor = { ...actor, action: null };
      }
    }

    const legalActions: CombatBufferAction[] = [];
    for (const action of ["attack", "roll", "flask"] as const) {
      const pending = actor.pendingMoves[action];
      if (
        pending !== undefined &&
        canBeginMove(rules, actor, pending.moveId, action)
      ) {
        legalActions.push(action);
      }
    }
    const consumed = consumeOldestCombatInput(actor.buffer, legalActions, rules.bufferWindows);
    actor = { ...actor, buffer: consumed.buffer };
    if (consumed.edge !== undefined) {
      const pendingMove = actor.pendingMoves[consumed.edge.action];
      if (pendingMove === undefined) throw new Error("Consumed combat input has no move binding.");
      const {
        chargeHoldTicks,
        chargeReleased,
        criticalTargetId,
        moveId,
      } = pendingMove;
      const move = rules.moves[moveId];
      if (move === undefined) throw new Error(`Unknown combat move: ${moveId}`);
      const spent = trySpendBreath(actor.breath, move.breathCost);
      if (!spent.spent) throw new Error("Legal combat action failed its atomic Breath spend.");
      if (actor.action !== null) {
        events.push(
          eventForAction(
            { nextEventSequence, worldTick: state.worldTick },
            actorId,
            actor.action.id,
            "action_ended",
          ),
        );
        nextEventSequence += 1;
      }
      const pendingMoves: Partial<
        Record<
          CombatBufferAction,
          {
            readonly chargeHoldTicks: number;
            readonly chargeReleased: boolean;
            readonly criticalTargetId?: string;
            readonly moveId: string;
          }
        >
      > = {};
      for (const action of COMBAT_BUFFER_ACTIONS) {
        const pending = actor.pendingMoves[action];
        if (action !== consumed.edge.action && pending !== undefined) {
          pendingMoves[action] = pending;
        }
      }
      actor = {
        ...actor,
        action: {
          chargeHoldTicks,
          charging:
            (move.chargeHoldMaxTicks ?? 0) > chargeHoldTicks &&
            !chargeReleased,
          ...(criticalTargetId === undefined ? {} : { criticalTargetId }),
          id: moveId,
          instanceId: nextActionInstance,
          tick: 0,
        },
        breath: spent.state,
        pendingMoves,
      };
      nextActionInstance += 1;
      events.push(
        eventForAction(
          { nextEventSequence, worldTick: state.worldTick },
          actorId,
          moveId,
          "action_started",
        ),
      );
      nextEventSequence += 1;
    }

    if (actor.action !== null) {
      const currentAction = actor.action;
      const move = rules.moves[currentAction.id];
      if (move === undefined) throw new Error(`Unknown combat move: ${currentAction.id}`);
      const insideTrackingWindow =
        move.trackingWindows?.some((window) =>
          isTickInWindow(currentAction.tick, window),
        ) ??
        (move.trackingUntilTick !== undefined &&
          currentAction.tick <= move.trackingUntilTick);
      if (targetPosition !== undefined && insideTrackingWindow) {
        actor = {
          ...actor,
          facingRadians: rotateTowardTarget(
            actor.facingRadians,
            actor.position,
            targetPosition,
            move.turnRateRadiansPerTick ?? 0,
          ),
        };
      }
      const chargeHoldMaxTicks = move.chargeHoldMaxTicks ?? 0;
      const chargeHoldTicks = currentAction.charging
        ? Math.min(chargeHoldMaxTicks, currentAction.chargeHoldTicks + 1)
        : currentAction.chargeHoldTicks;
      actor = {
        ...actor,
        action: {
          ...currentAction,
          chargeHoldTicks,
          charging:
            currentAction.charging && chargeHoldTicks < chargeHoldMaxTicks,
          tick: currentAction.tick + 1,
        },
      };
    }

    actor = {
      ...actor,
      breath: tickBreathRegen(
        actor.breath,
        {
          guardingMultiplier: rules.breath.guardingMultiplier,
          regenDelayTicks: rules.breath.regenDelayTicks,
          regenPerSecond: rules.breath.regenPerSecond,
          ticksPerSecond: rules.breath.tickRate,
        },
        actor.guarding,
      ),
      buffer: advanceCombatInputClock(actor.buffer, false),
    };
    actors[actorId] = actor;
  }

  const nextState: CombatState = {
    actors,
    nextActionInstance,
    nextEventSequence,
    version: 1,
    worldTick: state.worldTick + 1,
  };
  return { events, state: nextState, stateHash: hashCanonical(nextState) };
};

export const isActorInvulnerable = (
  rules: CombatRules,
  state: CombatState,
  actorId: string,
): boolean => {
  const actor = state.actors[actorId];
  if (actor === undefined) throw new Error(`Unknown combat actor: ${actorId}`);
  if (actor.action === null) return false;
  const move = rules.moves[actor.action.id];
  if (move === undefined) throw new Error(`Unknown combat move: ${actor.action.id}`);
  return move.iframeWindow !== undefined && isTickInWindow(actor.action.tick, move.iframeWindow);
};
