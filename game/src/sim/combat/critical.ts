import type { CombatData } from "./data";
import { isInsideRearCone, isRiposteWindowOpen } from "./defense";
import type { CombatStepCommand } from "./engine";
import type { CombatSimulationState } from "./simulation";

const criticalCommand = (
  state: CombatSimulationState,
  actorId: string,
  moveId: "backstab" | "riposte",
  sequence: number,
): CombatStepCommand => ({
  actorId,
  edge: {
    action: "attack",
    pressed: true,
    sequence,
    tick: state.combat.worldTick,
  },
  moveId,
});

const actorsForCritical = (
  state: CombatSimulationState,
  attackerId: string,
  targetId: string,
) => {
  const attacker = state.combat.actors[attackerId];
  const target = state.combat.actors[targetId];
  const damageTarget = state.damageActors[targetId];
  if (attacker === undefined || target === undefined || damageTarget === undefined) {
    throw new Error("Critical request references an unknown combat actor.");
  }
  return { attacker, damageTarget, target };
};

export const requestBackstab = (
  data: CombatData,
  state: CombatSimulationState,
  attackerId: string,
  targetId: string,
  sequence: number,
): CombatStepCommand | null => {
  const { attacker, damageTarget, target } = actorsForCritical(
    state,
    attackerId,
    targetId,
  );
  if (
    damageTarget.pulse <= 0 ||
    !isInsideRearCone(
      attacker.position,
      target.position,
      target.facingRadians,
      data.params.defense.backstabRearConeHalfAngleRadians,
    )
  ) {
    return null;
  }
  return criticalCommand(state, attackerId, "backstab", sequence);
};

export const requestRiposte = (
  data: CombatData,
  state: CombatSimulationState,
  attackerId: string,
  targetId: string,
  sequence: number,
): CombatStepCommand | null => {
  const { damageTarget, target } = actorsForCritical(state, attackerId, targetId);
  const until = damageTarget.riposteUntilClock;
  if (
    damageTarget.pulse <= 0 ||
    until === undefined ||
    !isRiposteWindowOpen(
      target.buffer.inputClock,
      until - data.params.defense.guardBreakRiposteWindowTicks,
      data.params.defense.guardBreakRiposteWindowTicks,
    )
  ) {
    return null;
  }
  return criticalCommand(state, attackerId, "riposte", sequence);
};
