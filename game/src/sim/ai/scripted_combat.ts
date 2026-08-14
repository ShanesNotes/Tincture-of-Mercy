import { actionDurationTicks, type WolfAiParams } from "./params";
import type { CombatActionIntent, CombatActions, WolfAttackId } from "./types";

interface StartedAction {
  readonly action: WolfAttackId;
  readonly startedTick: number;
  readonly resolveTick: number;
}

/** Test / yard dummy. Integration replaces this with the s11 action clock. */
export class ScriptedCombatActions implements CombatActions {
  private readonly started = new Map<string, StartedAction>();

  public constructor(private readonly params: WolfAiParams) {}

  public startAction(intent: CombatActionIntent): boolean {
    const existing = this.started.get(intent.actorId);
    if (existing !== undefined && intent.tick < existing.resolveTick) {
      return false;
    }
    this.started.set(intent.actorId, {
      action: intent.action,
      startedTick: intent.tick,
      resolveTick: intent.tick + actionDurationTicks(this.params, intent.action),
    });
    return true;
  }

  public isResolved(actorId: string, startedTick: number, tick: number): boolean {
    const existing = this.started.get(actorId);
    if (existing === undefined || existing.startedTick !== startedTick) {
      return false;
    }
    return tick >= existing.resolveTick;
  }
}
