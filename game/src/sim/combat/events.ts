import type { CombatPosition, DamageType } from "./damage";

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

/**
 * One actor's sim-owned freeze, reported to the presenter.
 *
 * `targetId` is the actor whose clocks hold; `actorId` is the attacker whose
 * confirmed hit bought the freeze, so an attacker's own freeze reads
 * `actorId === targetId`. `contact` is the world-space anchor of the hit that
 * caused it: the struck actor's position on the tick of contact, taken before
 * knockback displaces him. Hit detection resolves swept capsules and keeps no
 * intersection point, so the struck actor's authored position is the sim's
 * honest contact anchor — the same anchor the view's own fallback used when it
 * had to invent one.
 */
export interface HitstopCombatEvent extends CombatEventBase {
  readonly contact: CombatPosition;
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
