/**
 * Test harness that drives the REAL s11 combat engine with Warden moves.
 * Nothing here is runtime code: the boss module stays dependency-zero and the
 * fairness gates are proved against the shipping engine, not a stand-in.
 */

import { describe, expect, it } from "vitest";

import {
  createCombatSimulation,
  stepCombatSimulation,
  type CombatSimulationSeed,
  type CombatSimulationState,
  type CombatStepCommand,
  type CombatSwingFrame,
} from "../combat";
import type { CombatPresenterEvent } from "../combat/events";
import { COMBAT_DATA, WARDEN_PARAMS } from "./fixtures.test";
import { wardenMove } from "./params";
import type { WardenPhase } from "./types";

export const WARDEN_ID = "warden";
export const PLAYER_ID = "kalev";
export const WARDEN_TEST_PULSE = 900;
export const PLAYER_TEST_PULSE = 100;

export interface ArenaSeat {
  readonly x: number;
  readonly z: number;
}

/** Four cardinal punish angles around the boss (F6 "from multiple angles"). */
export const PUNISH_ANGLES = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2] as const;

export const seatAt = (angle: number, distance: number): ArenaSeat => ({
  x: Math.cos(angle) * distance,
  z: Math.sin(angle) * distance,
});

export const roster = (
  phase: WardenPhase,
  seat: ArenaSeat,
  rollBand: "light" | "medium" | "heavy" = "medium",
): readonly CombatSimulationSeed[] => [
  {
    actorClass: WARDEN_PARAMS.phases[phase].actorClass,
    facingRadians: 0,
    id: WARDEN_ID,
    position: { x: 0, y: 0, z: 0 },
    pulse: WARDEN_TEST_PULSE,
    steadyClass: phase === "p1" ? "warden_p1" : "warden_p2",
  },
  {
    actorClass: "kalev",
    facingRadians: 0,
    id: PLAYER_ID,
    position: { x: seat.x, y: 0, z: seat.z },
    pulse: PLAYER_TEST_PULSE,
    rollBand,
    steadyClass: "kalev",
  },
];

const capsuleAt = (x: number, z: number) => ({
  a: { x, y: 0.5, z },
  b: { x, y: 1.5, z },
  radius: 0.05,
});

const hurtboxAt = (id: string, x: number, z: number) => ({
  hurtboxes: [{ a: { x, y: 0.5, z }, b: { x, y: 1.5, z }, radius: 0.35 }],
  id,
});

/** A sweep guaranteed to cross the target: it starts past them and ends past them. */
export const sweepAcross = (
  attackerId: string,
  from: ArenaSeat,
  target: { readonly id: string; readonly x: number; readonly z: number },
): CombatSwingFrame => {
  const dx = target.x - from.x;
  const dz = target.z - from.z;
  const length = Math.hypot(dx, dz) || 1;
  const ux = dx / length;
  const uz = dz / length;
  return {
    attackerId,
    currentWeapon: capsuleAt(target.x + ux * 0.6, target.z + uz * 0.6),
    previousWeapon: capsuleAt(target.x - ux * 0.6, target.z - uz * 0.6),
    targets: [hurtboxAt(target.id, target.x, target.z)],
  };
};

export interface ScriptedTick {
  readonly commands?: readonly CombatStepCommand[];
  readonly swings?: readonly CombatSwingFrame[];
}

export interface CombatRun {
  readonly events: readonly CombatPresenterEvent[];
  readonly finalState: CombatSimulationState;
  readonly pulseByTick: readonly Readonly<Record<string, number>>[];
  readonly actionIdByTick: readonly Readonly<Record<string, string | null>>[];
  readonly actionTickByTick: readonly Readonly<Record<string, number | null>>[];
}

export const runCombat = (
  seeds: readonly CombatSimulationSeed[],
  durationTicks: number,
  script: (tick: number, state: CombatSimulationState) => ScriptedTick,
): CombatRun => {
  let state = createCombatSimulation(COMBAT_DATA, seeds);
  const events: CombatPresenterEvent[] = [];
  const pulseByTick: Record<string, number>[] = [];
  const actionIdByTick: Record<string, string | null>[] = [];
  const actionTickByTick: Record<string, number | null>[] = [];
  for (let tick = 0; tick < durationTicks; tick += 1) {
    const scripted = script(tick, state);
    const stepped = stepCombatSimulation(COMBAT_DATA, state, {
      commands: scripted.commands ?? [],
      swings: scripted.swings ?? [],
    });
    state = stepped.state;
    events.push(...stepped.events);
    const pulse: Record<string, number> = {};
    const actionIds: Record<string, string | null> = {};
    const actionTicks: Record<string, number | null> = {};
    for (const seed of seeds) {
      pulse[seed.id] = state.damageActors[seed.id]?.pulse ?? 0;
      actionIds[seed.id] = state.combat.actors[seed.id]?.action?.id ?? null;
      actionTicks[seed.id] = state.combat.actors[seed.id]?.action?.tick ?? null;
    }
    pulseByTick.push(pulse);
    actionIdByTick.push(actionIds);
    actionTickByTick.push(actionTicks);
  }
  return { events, finalState: state, pulseByTick, actionIdByTick, actionTickByTick };
};

export const attackEdge = (
  actorId: string,
  moveId: string,
  tick: number,
  sequence = 0,
): CombatStepCommand => ({
  actorId,
  edge: { action: "attack", pressed: true, sequence, tick },
  moveId,
});

export const rollEdge = (
  actorId: string,
  moveId: string,
  tick: number,
  sequence = 0,
): CombatStepCommand => ({
  actorId,
  edge: { action: "roll", pressed: true, sequence, tick },
  moveId,
});

/**
 * Every Warden move s11 can route as a weapon sweep: it owns an active window
 * and authored damage. The bait (no active window) and "the quiet" (a no-damage
 * Wither pulse, `hitstopClass: "none"`) are handled by the boss module itself.
 */
export const swingMoves = (
  phase: WardenPhase,
): readonly { readonly moveId: string; readonly phase: WardenPhase }[] =>
  WARDEN_PARAMS.phases[phase].moves
    .filter(
      (move) =>
        move.clip.activeWindows.length > 0 &&
        move.clip.damageType !== "none" &&
        move.clip.hitstopClass !== "none",
    )
    .map((move) => ({ moveId: move.moveId, phase }));

export const ALL_SWING_MOVES = [...swingMoves("p1"), ...swingMoves("p2")];

describe("boss combat harness", () => {
  it("starts a Warden move on the tick it is pressed and ends it on the clip length", () => {
    const move = wardenMove(WARDEN_PARAMS, "p1", "warden_p1_side_clear");
    const run = runCombat(roster("p1", seatAt(0, 1.5)), move.clip.totalTicks + 2, (tick) =>
      tick === 0 ? { commands: [attackEdge(WARDEN_ID, move.moveId, 0)] } : {},
    );
    expect(run.actionIdByTick[0]?.[WARDEN_ID]).toBe(move.moveId);
    expect(run.actionIdByTick[move.clip.totalTicks - 1]?.[WARDEN_ID]).toBe(move.moveId);
    expect(run.actionIdByTick[move.clip.totalTicks]?.[WARDEN_ID]).toBeNull();
  });
});
