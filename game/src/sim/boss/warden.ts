/**
 * The Warden of the Ironwood — boss state machine (contract deliverables 1-3, 5).
 *
 *   approach ─▶ neutral ─▶ move_selection ─▶ committed_move ─▶ recovery ─┐
 *      ▲          ▲                                                      │
 *      └──────────┴──────────────────────────────────────────────────────┘
 *
 *   ≤55% Pulse ──▶ phase_transition ──▶ ceremony (90t, invulnerable, no damage)
 *                                          └──▶ neutral, phase = p2
 *   Pulse 0 ──▶ defeated (terminal; hands the tag payload to s25 aftermath)
 *
 * Pure and headless: it advances its own clocks off the frame-data table and
 * emits the move intents the caller feeds to s11's action clock. It never
 * imports combat, scenes, world, view, or app.
 */

import { hashWardenState } from "./hash";
import { wardenMove } from "./params";
import { clampToRing, isOutsideLeash, resolveRingContact } from "./ring";
import { isTargetInArena, selectWardenMove, stanceFor } from "./select";
import {
  WARDEN_STATE_VERSION,
  type WardenClip,
  type WardenEvent,
  type WardenMoveIntent,
  type WardenParams,
  type WardenPorts,
  type WardenRingGeometry,
  type WardenSeed,
  type WardenState,
  type WardenStepInput,
  type WardenStepResult,
} from "./types";

export const WARDEN_ACTOR_ID = "warden";

const TWO_PI = Math.PI * 2;

const wrapAngle = (radians: number): number => {
  const wrapped = ((radians + Math.PI) % TWO_PI + TWO_PI) % TWO_PI - Math.PI;
  return Object.is(wrapped, -0) ? 0 : wrapped;
};

const rotateToward = (current: number, desired: number, maxStep: number): number => {
  const delta = wrapAngle(desired - current);
  if (maxStep <= 0 || Math.abs(delta) <= maxStep) {
    return wrapAngle(desired);
  }
  return wrapAngle(current + Math.sign(delta) * maxStep);
};

const isInWindows = (
  tick: number,
  windows: readonly { readonly startTick: number; readonly endTickExclusive: number }[],
): boolean => windows.some((window) => tick >= window.startTick && tick < window.endTickExclusive);

const recoveryStartTick = (clip: WardenClip): number => clip.totalTicks - clip.recoveryTicks;

export const createWardenState = (seed: WardenSeed): WardenState => ({
  version: WARDEN_STATE_VERSION,
  tick: 0,
  fsm: "approach",
  phase: "p1",
  stance: "closed",
  x: seed.x,
  z: seed.z,
  yaw: wrapAngle(seed.yaw ?? 0),
  pulse: seed.pulse,
  maxPulse: seed.maxPulse,
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
});

/** Steady class in play this phase — the class table s11 seeds the actor with. */
export const wardenSteadyClass = (params: WardenParams, state: WardenState): string =>
  params.phases[state.phase].steadyClass;

export const isWardenInvulnerable = (state: WardenState): boolean => state.fsm === "ceremony";

export const wardenActionTick = (state: WardenState): number | null => state.action?.tick ?? null;

/** Every neutral step is clamped to the ring: the leash IS the arena bound. */
const moveTo = (
  ring: WardenRingGeometry,
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
  step: number,
): { readonly x: number; readonly z: number } => {
  const dx = toX - fromX;
  const dz = toZ - fromZ;
  const distance = Math.hypot(dx, dz);
  const next =
    distance <= step || distance === 0
      ? { x: toX, z: toZ }
      : { x: fromX + (dx / distance) * step, z: fromZ + (dz / distance) * step };
  return clampToRing(ring, next.x, next.z);
};

interface Accumulator {
  state: WardenState;
  readonly events: WardenEvent[];
  readonly intents: WardenMoveIntent[];
}

const beginCeremony = (acc: Accumulator, params: WardenParams, ports: WardenPorts): void => {
  const tick = acc.state.tick;
  acc.events.push({ type: "phase-changed", tick, phase: "p1" });
  acc.events.push({
    type: "lantern-hung",
    tick,
    anchorId: params.ceremony.lanternHangAnchorId,
  });
  acc.events.push({
    type: "ceremony-requested",
    tick,
    holdTicks: params.ceremony.holdTicks,
    anchorId: params.ceremony.cameraAnchorId,
    dealsDamage: false,
  });
  ports.ceremony?.begin();
  acc.state = {
    ...acc.state,
    fsm: "ceremony",
    action: null,
    ceremonyEndTick: tick + params.ceremony.holdTicks,
    lanternHung: true,
  };
};

const defeat = (acc: Accumulator, params: WardenParams, ports: WardenPorts): void => {
  const tick = acc.state.tick;
  const payload = {
    tagItemId: params.aftermath.tagItemId,
    tagTextKeys: params.aftermath.tagTextKeys,
    titleCard: false as const,
  };
  acc.events.push({ type: "defeated", tick });
  acc.events.push({ type: "arena-gate", tick, transition: "defeated" });
  acc.events.push({ type: "aftermath-requested", tick, payload });
  ports.aftermath?.begin(payload);
  acc.state = { ...acc.state, fsm: "defeated", action: null, pulse: 0 };
};

const advanceAction = (
  acc: Accumulator,
  params: WardenParams,
  ring: WardenRingGeometry,
  input: WardenStepInput,
): void => {
  const action = acc.state.action;
  if (action === null) return;
  const move = wardenMove(params, acc.state.phase, action.moveId);
  const clip = move.clip;
  const tick = acc.state.tick;
  const actionTick = action.tick;

  for (const [index, window] of clip.activeWindows.entries()) {
    if (actionTick === window.startTick) {
      acc.events.push({ type: "move-active", tick, moveId: clip.moveId, windowIndex: index });
    }
  }
  if (clip.moveId === params.quiet.moveId && actionTick === clip.activeWindows[0]?.startTick) {
    acc.events.push({
      type: "quiet-pulse",
      tick,
      witherAmount: params.quiet.witherAmount,
      radiusMeters: params.quiet.radiusMeters,
      pulseDamage: 0,
    });
  }
  if (clip.recoveryTicks > 0 && actionTick === recoveryStartTick(clip)) {
    acc.events.push({
      type: "move-recovery",
      tick,
      moveId: clip.moveId,
      recoveryTicks: clip.recoveryTicks,
      punishLights: move.punishLights,
    });
    acc.state = { ...acc.state, fsm: "recovery" };
  }

  // Facing: the Warden only corrects inside the clip's authored tracking window.
  const tracking =
    clip.trackingWindows.length > 0
      ? isInWindows(actionTick, clip.trackingWindows)
      : clip.trackingUntilTick !== null && actionTick <= clip.trackingUntilTick;
  if (tracking) {
    const desired = Math.atan2(input.targetX - acc.state.x, input.targetZ - acc.state.z);
    acc.state = {
      ...acc.state,
      yaw: rotateToward(acc.state.yaw, desired, clip.turnRateRadiansPerTick),
    };
  }

  // Charge-through travels along the committed heading and stops at the line.
  if (clip.moveId === "warden_p2_charge_through" && isInWindows(actionTick, clip.activeWindows)) {
    if (!acc.state.chargeStopped) {
      const step = params.motion.chargeMetersPerTick;
      const nextX = acc.state.x + Math.sin(acc.state.yaw) * step;
      const nextZ = acc.state.z + Math.cos(acc.state.yaw) * step;
      const clamped = params.ring.chargeEndsAtRing ? clampToRing(ring, nextX, nextZ) : { x: nextX, z: nextZ };
      const contact = resolveRingContact(ring, params, "warden_charging", clamped.x, clamped.z);
      acc.state = { ...acc.state, x: clamped.x, z: clamped.z };
      if (contact.touching) {
        if (contact.passesThrough) {
          acc.events.push({ type: "snare-pass-through", tick, actorId: WARDEN_ACTOR_ID });
        }
        acc.events.push({ type: "charge-ended-at-ring", tick });
        acc.state = { ...acc.state, chargeStopped: true };
      }
    }
  }

  const nextActionTick = actionTick + 1;
  if (nextActionTick >= clip.totalTicks) {
    acc.events.push({ type: "move-ended", tick, moveId: clip.moveId });
    acc.state = {
      ...acc.state,
      action: null,
      fsm: "neutral",
      chargeStopped: false,
      neutralUntilTick: tick + 1 + params.selection.neutralCooldownTicks,
    };
    return;
  }
  acc.state = {
    ...acc.state,
    action: { ...action, tick: nextActionTick },
    fsm: acc.state.fsm === "recovery" ? "recovery" : "committed_move",
  };
};

/** True while the bait is off cooldown — the only reason he gives ground. */
const wantsStepBack = (params: WardenParams, state: WardenState): boolean =>
  params.phases[state.phase].moves.some((move) => {
    if (move.requiresStance !== "stepped_back") return false;
    const last = state.lastUsedTick[move.moveId];
    return last === undefined || state.tick - last >= move.cooldownTicks;
  });

/**
 * Neutral spacing. He closes to the preferred range; when the bait is ready he
 * gives ground instead, which is the only path into the step-back stance and
 * therefore the only path to the bait (contract deliverable 1).
 */
const holdSpacing = (
  acc: Accumulator,
  params: WardenParams,
  ring: WardenRingGeometry,
  input: WardenStepInput,
  distance: number,
): void => {
  if (wantsStepBack(params, acc.state) && distance < params.selection.stepBackRangeMeters) {
    const dx = acc.state.x - input.targetX;
    const dz = acc.state.z - input.targetZ;
    const length = Math.hypot(dx, dz);
    if (length > 0) {
      const step = params.motion.stepBackMetersPerTick;
      const nextX = acc.state.x + (dx / length) * step;
      const nextZ = acc.state.z + (dz / length) * step;
      const clamped = clampToRing(ring, nextX, nextZ);
      acc.state = { ...acc.state, x: clamped.x, z: clamped.z };
    }
    acc.state = {
      ...acc.state,
      stance: stanceFor(params, acc.state, input.targetX, input.targetZ),
    };
    return;
  }
  if (distance > params.selection.preferredRangeMeters) {
    const stepped = moveTo(
      ring,
      acc.state.x,
      acc.state.z,
      input.targetX,
      input.targetZ,
      params.motion.approachMetersPerTick,
    );
    acc.state = { ...acc.state, ...stepped };
  }
  acc.state = {
    ...acc.state,
    stance: stanceFor(params, acc.state, input.targetX, input.targetZ),
  };
};

const idleBehaviour = (
  acc: Accumulator,
  params: WardenParams,
  ring: WardenRingGeometry,
  input: WardenStepInput,
): void => {
  const tick = acc.state.tick;

  if (isOutsideLeash(ring, params, acc.state.x, acc.state.z)) {
    if (!acc.state.leashed) {
      acc.events.push({ type: "leash-reset", tick });
    }
    const stepped = moveTo(
      ring,
      acc.state.x,
      acc.state.z,
      ring.centerX,
      ring.centerZ,
      params.motion.leashReturnMetersPerTick,
    );
    acc.state = { ...acc.state, ...stepped, fsm: "approach", leashed: true };
    return;
  }
  acc.state = { ...acc.state, leashed: false };

  const distance = Math.hypot(input.targetX - acc.state.x, input.targetZ - acc.state.z);
  const desiredYaw = Math.atan2(input.targetX - acc.state.x, input.targetZ - acc.state.z);
  acc.state = { ...acc.state, yaw: wrapAngle(desiredYaw) };

  if (distance > params.selection.engageRangeMeters) {
    const stepped = moveTo(
      ring,
      acc.state.x,
      acc.state.z,
      input.targetX,
      input.targetZ,
      params.motion.approachMetersPerTick,
    );
    acc.state = { ...acc.state, ...stepped, fsm: "approach" };
    return;
  }

  acc.state = { ...acc.state, stance: stanceFor(params, acc.state, input.targetX, input.targetZ) };

  if (tick < acc.state.neutralUntilTick) {
    acc.state = { ...acc.state, fsm: "neutral" };
    holdSpacing(acc, params, ring, input, distance);
    return;
  }

  acc.state = { ...acc.state, fsm: "move_selection" };
  const selection = selectWardenMove(params, ring, acc.state, input.targetX, input.targetZ);
  if (selection.moveId === null) {
    acc.state = { ...acc.state, fsm: "neutral" };
    holdSpacing(acc, params, ring, input, distance);
    return;
  }

  const move = wardenMove(params, acc.state.phase, selection.moveId);
  if (!acc.state.engaged) {
    acc.events.push({ type: "arena-gate", tick, transition: "engage" });
    acc.state = { ...acc.state, engaged: true };
  }
  acc.events.push({
    type: "move-selected",
    tick,
    moveId: move.moveId,
    tellTicks: move.clip.tellTicks,
    tellClass: move.tellClass,
  });
  acc.intents.push({ actorId: WARDEN_ACTOR_ID, moveId: move.moveId, tick });
  acc.state = {
    ...acc.state,
    fsm: "committed_move",
    action: { moveId: move.moveId, startedTick: tick, tick: 0 },
    chargeStopped: false,
    consecutiveMoveCount:
      acc.state.lastMoveId === move.moveId ? acc.state.consecutiveMoveCount + 1 : 1,
    lastMoveId: move.moveId,
    lastUsedTick: { ...acc.state.lastUsedTick, [move.moveId]: tick },
  };
};

export const stepWarden = (
  params: WardenParams,
  ring: WardenRingGeometry,
  state: WardenState,
  input: WardenStepInput,
  ports: WardenPorts = {},
): WardenStepResult => {
  if (state.fsm === "defeated") {
    return { state, events: [], intents: [] };
  }
  const acc: Accumulator = { state, events: [], intents: [] };
  const tick = state.tick;

  if (!acc.state.enteredArena && isTargetInArena(ring, input.targetX, input.targetZ)) {
    acc.events.push({ type: "arena-gate", tick, transition: "enter" });
    acc.state = { ...acc.state, enteredArena: true };
  }

  if (input.targetDied === true) {
    acc.events.push({ type: "arena-gate", tick, transition: "death-reset" });
    acc.state = {
      ...acc.state,
      action: null,
      fsm: "approach",
      enteredArena: false,
      engaged: false,
      chargeStopped: false,
      targetRootedUntilTick: 0,
      tick: tick + 1,
    };
    return { state: acc.state, events: acc.events, intents: acc.intents };
  }

  // The player's own contact with the line: roots 45t, and the tags chime.
  if (tick >= acc.state.targetRootedUntilTick) {
    const contact = resolveRingContact(ring, params, "player", input.targetX, input.targetZ);
    if (contact.rooted) {
      acc.events.push({
        type: "snare-contact",
        tick,
        actorId: "player",
        rootTicks: contact.rootTicks,
        chime: contact.chime,
      });
      acc.state = { ...acc.state, targetRootedUntilTick: tick + contact.rootTicks };
    }
  }

  if (acc.state.fsm === "ceremony") {
    // 90 ticks, invulnerable, deals no damage. Incoming Pulse damage is ignored.
    if (acc.state.ceremonyEndTick !== null && tick >= acc.state.ceremonyEndTick) {
      acc.events.push({ type: "ceremony-ended", tick });
      acc.events.push({ type: "phase-changed", tick, phase: "p2" });
      acc.state = {
        ...acc.state,
        fsm: "neutral",
        phase: "p2",
        ceremonyDone: true,
        ceremonyEndTick: null,
        lastMoveId: null,
        consecutiveMoveCount: 0,
        neutralUntilTick: tick,
      };
    }
    acc.state = { ...acc.state, tick: tick + 1 };
    return { state: acc.state, events: acc.events, intents: acc.intents };
  }

  const damage = input.pulseDamage ?? 0;
  if (damage > 0) {
    acc.state = { ...acc.state, pulse: Math.max(0, acc.state.pulse - damage) };
  }
  if (acc.state.pulse <= 0) {
    defeat(acc, params, ports);
    acc.state = { ...acc.state, tick: tick + 1 };
    return { state: acc.state, events: acc.events, intents: acc.intents };
  }

  const shouldBegin =
    ports.ceremony?.shouldBegin(acc.state.pulse, acc.state.maxPulse) ??
    acc.state.pulse * 100 <= acc.state.maxPulse * params.ceremony.pulsePercent;
  if (acc.state.phase === "p1" && !acc.state.ceremonyDone && shouldBegin) {
    acc.state = { ...acc.state, fsm: "phase_transition" };
    beginCeremony(acc, params, ports);
    acc.state = { ...acc.state, tick: tick + 1 };
    return { state: acc.state, events: acc.events, intents: acc.intents };
  }

  if (acc.state.action !== null) {
    advanceAction(acc, params, ring, input);
  } else {
    idleBehaviour(acc, params, ring, input);
  }

  acc.state = { ...acc.state, tick: tick + 1 };
  return { state: acc.state, events: acc.events, intents: acc.intents };
};

export const wardenStateHash = (state: WardenState): string => hashWardenState(state);
