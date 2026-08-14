import type { DamageType } from "./damage";

interface CombatEventBase {
  readonly actorId: string;
  readonly sequence: number;
  readonly tick: number;
}

export interface DamageCombatEvent extends CombatEventBase {
  readonly amount: number;
  readonly damageType: DamageType;
  readonly guarded: boolean;
  readonly kind: "damage";
  readonly targetId: string;
}

export interface DeathCombatEvent extends CombatEventBase {
  readonly kind: "death";
  readonly targetId: string;
}

export interface StaggerCombatEvent extends CombatEventBase {
  readonly kind: "stagger";
  readonly severity: "flinch" | "stagger" | "knockdown";
  readonly targetId: string;
}

export interface GuardBreakCombatEvent extends CombatEventBase {
  readonly kind: "guard_break";
  readonly riposteUntilClock: number;
  readonly targetId: string;
}

export interface ActionCombatEvent extends CombatEventBase {
  readonly actionId: string;
  readonly kind: "action_started" | "action_ended";
}

export interface HitstopCombatEvent extends CombatEventBase {
  readonly durationTicks: number;
  readonly kind: "hitstop";
  readonly targetId: string;
}

export type CombatPresenterEvent =
  | ActionCombatEvent
  | DamageCombatEvent
  | DeathCombatEvent
  | GuardBreakCombatEvent
  | HitstopCombatEvent
  | StaggerCombatEvent;
