/**
 * s19 — the Warden, bound into the world.
 *
 * `sim/boss` stays headless and dependency-zero. Composition owns every seam it
 * declared as a port:
 *
 *   FSM move intents ──▶ s11 action clock  (exactly the wolf `CombatActions` path)
 *   FSM position     ──▶ s10 motion via authored displacement (collision-correct)
 *   ceremony/aftermath ──▶ s25 scene triggers
 *   arena-gate        ──▶ s15 arena run state
 *   quiet-pulse       ──▶ area Wither on the player — never a swing
 *   snare-contact     ──▶ player root window
 *
 * Two laws are enforced here rather than in either module:
 *
 *  1. "The quiet" is an area pulse. It is fed as Turn buildup inside its
 *     authored radius and never through the swing path, which would throw on a
 *     move with no weapon contact and would also deal Pulse damage it must not.
 *  2. Charge-through contact honours `warden_params.contactTicksPerWindow` (6),
 *     not the 30-tick travel window the shared frame-data row carries. See
 *     {@link wardenSwingIsLive}.
 */

import {
  isWardenInvulnerable,
  stepWarden,
  wardenMove,
  type WardenAftermathPayload,
  type WardenArenaTransition,
  type WardenEvent,
  type WardenPhase,
  type WardenState,
} from "../boss";
import type { CombatStepCommand } from "../combat";
import type { Vec3 } from "../motion";
import type { WorldDefinition, WorldWardenDefinition } from "./types";

export interface WorldWardenInput {
  readonly targetPosition: Vec3;
  readonly targetDied: boolean;
  /** Pulse the Warden has lost since the FSM last observed s11's damage actor. */
  readonly combatPulse: number;
  readonly sequenceBase: number;
  readonly tick: number;
}

export interface WorldWardenTick {
  readonly state: WardenState;
  readonly events: readonly WardenEvent[];
  readonly commands: readonly CombatStepCommand[];
  /** World-space step the FSM asked for, handed to motion as authored displacement. */
  readonly displacement: Vec3 | null;
  readonly arenaTransitions: readonly WardenArenaTransition[];
  readonly ceremonyRequested: boolean;
  readonly aftermath: WardenAftermathPayload | null;
  readonly phaseChanged: WardenPhase | null;
  readonly quietPulses: readonly { readonly witherAmount: number; readonly radiusMeters: number }[];
  readonly snareRootUntilTick: number | null;
}

/**
 * True while the Warden's live action can actually connect.
 *
 * The shared `frame_data.json` row for `warden_p2_charge_through` carries the
 * full 30-tick travel window as one active window, because the boss FSM drives
 * the charge itself off `activeWindows` and must travel the whole way to the
 * ring. TUNING_V0 authors that window as "6+24 travel": six ticks of contact,
 * then twenty-four ticks of travel that must not hit. `warden_params.json` keeps
 * that split verbatim as `contactTicksPerWindow: 6`, compiled into
 * `clip.contactWindows`; the world is the only place both consumers meet, so the
 * gate lives here and reads the boss module's own compiled data.
 */
export const wardenSwingIsLive = (
  warden: WorldWardenDefinition,
  phase: WardenPhase,
  actionId: string,
  actionTick: number,
): boolean => {
  const move = warden.params.phases[phase].moves.find((entry) => entry.moveId === actionId);
  if (move === undefined) return true;
  if (move.clip.contactWindows.length === 0) return false;
  return move.clip.contactWindows.some(
    (window) => actionTick >= window.startTick && actionTick < window.endTickExclusive,
  );
};

/** The quiet deals no Pulse damage and owns no weapon; it never reaches s11. */
export const isQuietMove = (warden: WorldWardenDefinition, moveId: string): boolean =>
  moveId === warden.params.quiet.moveId;

export const wardenPhaseActorClass = (
  warden: WorldWardenDefinition,
  phase: WardenPhase,
): string => warden.phaseActorClasses[phase];

export const wardenPhaseSteadyClass = (
  warden: WorldWardenDefinition,
  phase: WardenPhase,
): string => warden.phaseSteadyClasses[phase];

export const createWorldWardenState = (definition: WorldDefinition): WardenState | null => {
  const warden = definition.warden;
  if (warden === null) return null;
  return {
    version: 1,
    tick: 0,
    fsm: "approach",
    phase: "p1",
    stance: "closed",
    x: warden.spawnPosition.x,
    z: warden.spawnPosition.z,
    yaw: warden.spawnFacing,
    pulse: warden.maxPulse,
    maxPulse: warden.maxPulse,
    action: null,
    lastMoveId: null,
    consecutiveMoveCount: 0,
    lastUsedTick: {},
    neutralUntilTick: 0,
    ceremonyEndTick: null,
    ceremonyDone: false,
    lanternHung: false,
    targetRootedUntilTick: 0,
    enteredArena: false,
    engaged: false,
    leashed: false,
    chargeStopped: false,
  };
};

/**
 * One Warden tick, translated into the world's vocabulary.
 *
 * The FSM's Pulse is kept in lockstep with s11's damage actor by feeding it the
 * exact loss s11 recorded: `max(0, fsmPulse - combatPulse)`. s11 stays the sole
 * owner of the number; the FSM only needs to know when it crosses a threshold.
 */
export const stepWorldWarden = (
  state: WardenState,
  definition: WorldDefinition,
  input: WorldWardenInput,
): WorldWardenTick | null => {
  const warden = definition.warden;
  if (warden === null) return null;

  const before = { x: state.x, z: state.z };
  const rootedBefore = state.targetRootedUntilTick;
  let ceremonyRequested = false;
  let aftermath: WardenAftermathPayload | null = null;
  const stepped = stepWarden(
    warden.params,
    warden.ring,
    state,
    {
      targetX: input.targetPosition.x,
      targetZ: input.targetPosition.z,
      pulseDamage: Math.max(0, state.pulse - input.combatPulse),
      targetDied: input.targetDied,
    },
    {
      ceremony: {
        pulsePercent: warden.params.ceremony.pulsePercent,
        holdTicks: warden.params.ceremony.holdTicks,
        shouldBegin: (pulse, maxPulse) =>
          pulse * 100 <= maxPulse * warden.params.ceremony.pulsePercent,
        begin: () => {
          ceremonyRequested = true;
        },
      },
      aftermath: {
        begin: (payload) => {
          aftermath = payload;
        },
      },
    },
  );

  const commands: CombatStepCommand[] = [];
  let sequence = input.sequenceBase;
  for (const intent of stepped.intents) {
    // The quiet is an area pulse. Handing it to the action clock would demand a
    // weapon capsule the move does not own, and would apply its damage row.
    if (isQuietMove(warden, intent.moveId)) continue;
    commands.push({
      actorId: warden.actorId,
      edge: { action: "attack", pressed: true, sequence, tick: input.tick },
      moveId: intent.moveId,
      targetPosition: { x: input.targetPosition.x, z: input.targetPosition.z },
    });
    sequence += 1;
  }

  const arenaTransitions: WardenArenaTransition[] = [];
  const quietPulses: { readonly witherAmount: number; readonly radiusMeters: number }[] = [];
  let phaseChanged: WardenPhase | null = null;
  for (const event of stepped.events) {
    if (event.type === "arena-gate") arenaTransitions.push(event.transition);
    else if (event.type === "quiet-pulse") {
      quietPulses.push({ witherAmount: event.witherAmount, radiusMeters: event.radiusMeters });
    } else if (event.type === "phase-changed") phaseChanged = event.phase;
  }

  // The ceremony is a real frame-data row (90t, i-frames 0-90, no damage).
  // Running it through s11 buys its invulnerability from the same table the
  // gauntlet reads, instead of a composition-local flag.
  if (ceremonyRequested) {
    commands.push({
      actorId: warden.actorId,
      edge: { action: "attack", pressed: true, sequence, tick: input.tick },
      moveId: warden.ceremonyMoveId,
    });
    sequence += 1;
  }

  const deltaX = stepped.state.x - before.x;
  const deltaZ = stepped.state.z - before.z;
  const moved = Math.hypot(deltaX, deltaZ) > 1e-9;

  return {
    state: stepped.state,
    events: stepped.events,
    commands,
    displacement: moved ? { x: deltaX, y: 0, z: deltaZ } : null,
    arenaTransitions,
    ceremonyRequested,
    aftermath,
    phaseChanged,
    quietPulses,
    snareRootUntilTick:
      stepped.state.targetRootedUntilTick > rootedBefore
        ? stepped.state.targetRootedUntilTick
        : null,
  };
};

/** The Warden is untouchable for the whole ceremony hold (ENCOUNTERS, GATES). */
export const wardenIsInvulnerable = (state: WardenState | null): boolean =>
  state !== null && isWardenInvulnerable(state);

/** Authored move lookup used by the world's swing gate and its tests. */
export const worldWardenMove = (
  warden: WorldWardenDefinition,
  phase: WardenPhase,
  moveId: string,
): ReturnType<typeof wardenMove> => wardenMove(warden.params, phase, moveId);
