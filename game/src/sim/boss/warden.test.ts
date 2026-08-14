/**
 * The boss state machine end to end: states, phase logic, the ceremony, the
 * snare ring in play, the leash, and the s15 entry-gate binding.
 */

import { describe, expect, it } from "vitest";

import {
  arenaOnDeath,
  bossDefeated,
  bossIsDown,
  createMetaState,
  engageBoss,
  enterArena,
} from "../meta";
import type { MetaState } from "../meta";
import { WARDEN_PARAMS, WARDEN_RING } from "./fixtures.test";
import { wardenMove } from "./params";
import type {
  WardenArenaTransition,
  WardenEvent,
  WardenFsmState,
  WardenState,
  WardenStepInput,
} from "./types";
import { createWardenState, isWardenInvulnerable, stepWarden, WARDEN_ACTOR_ID } from "./warden";

const MAX_PULSE = 900;
/** 55% of 900 exactly, so the threshold test is not a float comparison. */
const CEREMONY_PULSE = 495;

const seedState = (overrides: Partial<WardenState> = {}): WardenState => ({
  ...createWardenState({
    x: WARDEN_RING.centerX,
    z: WARDEN_RING.centerZ,
    pulse: MAX_PULSE,
    maxPulse: MAX_PULSE,
  }),
  ...overrides,
});

interface DriveResult {
  readonly state: WardenState;
  readonly events: readonly WardenEvent[];
  readonly fsmByTick: readonly WardenFsmState[];
  readonly intents: readonly string[];
}

const drive = (
  start: WardenState,
  ticks: number,
  input: (tick: number, state: WardenState) => WardenStepInput,
): DriveResult => {
  let state = start;
  const events: WardenEvent[] = [];
  const fsmByTick: WardenFsmState[] = [];
  const intents: string[] = [];
  for (let tick = 0; tick < ticks; tick += 1) {
    const stepped = stepWarden(WARDEN_PARAMS, WARDEN_RING, state, input(tick, state));
    state = stepped.state;
    events.push(...stepped.events);
    fsmByTick.push(state.fsm);
    intents.push(...stepped.intents.map((intent) => intent.moveId));
  }
  return { state, events, fsmByTick, intents };
};

const holdAt = (x: number, z: number) => (): WardenStepInput => ({ targetX: x, targetZ: z });

describe("the state machine", () => {
  it("walks approach → neutral → move_selection → committed_move → recovery", () => {
    const start = seedState({
      x: WARDEN_RING.centerX,
      z: WARDEN_RING.centerZ,
      lastUsedTick: { warden_p1_lantern_raise_bait: 0 },
      tick: 1,
    });
    const run = drive(start, 240, holdAt(WARDEN_RING.centerX + 2.0, WARDEN_RING.centerZ));
    const seen = new Set(run.fsmByTick);
    expect(seen.has("neutral")).toBe(true);
    expect(seen.has("move_selection") || run.intents.length > 0).toBe(true);
    expect(seen.has("committed_move")).toBe(true);
    expect(seen.has("recovery")).toBe(true);
    expect(run.intents.length).toBeGreaterThan(0);
  });

  it("hands every started move to the caller as an s11 intent", () => {
    const start = seedState({ lastUsedTick: { warden_p1_lantern_raise_bait: 0 }, tick: 1 });
    let state = start;
    for (let tick = 0; tick < 240; tick += 1) {
      const stepped = stepWarden(WARDEN_PARAMS, WARDEN_RING, state, {
        targetX: WARDEN_RING.centerX + 2.0,
        targetZ: WARDEN_RING.centerZ,
      });
      for (const intent of stepped.intents) {
        expect(intent.actorId).toBe(WARDEN_ACTOR_ID);
        expect(intent.tick).toBe(state.tick);
        expect(stepped.state.action?.moveId).toBe(intent.moveId);
      }
      state = stepped.state;
    }
  });

  it("runs a committed move for exactly its clip length", () => {
    const move = wardenMove(WARDEN_PARAMS, "p1", "warden_p1_side_clear");
    const start = seedState({
      action: { moveId: move.moveId, startedTick: 0, tick: 0 },
      fsm: "committed_move",
    });
    const run = drive(start, move.clip.totalTicks, holdAt(WARDEN_RING.centerX + 2, WARDEN_RING.centerZ));
    const ended = run.events.filter((event) => event.type === "move-ended");
    expect(ended).toHaveLength(1);
    expect(ended[0]?.tick).toBe(move.clip.totalTicks - 1);
    const recovery = run.events.find((event) => event.type === "move-recovery");
    expect(recovery).toEqual({
      type: "move-recovery",
      tick: move.clip.totalTicks - move.clip.recoveryTicks,
      moveId: move.moveId,
      recoveryTicks: move.clip.recoveryTicks,
      punishLights: move.punishLights,
    });
  });

  it("is terminal once defeated", () => {
    const start = seedState({ pulse: 10 });
    const killed = stepWarden(WARDEN_PARAMS, WARDEN_RING, start, {
      targetX: WARDEN_RING.centerX + 2,
      targetZ: WARDEN_RING.centerZ,
      pulseDamage: 50,
    });
    expect(killed.state.fsm).toBe("defeated");
    expect(killed.state.pulse).toBe(0);
    const again = stepWarden(WARDEN_PARAMS, WARDEN_RING, killed.state, {
      targetX: WARDEN_RING.centerX,
      targetZ: WARDEN_RING.centerZ,
      pulseDamage: 50,
    });
    expect(again.state).toBe(killed.state);
    expect(again.events).toHaveLength(0);
  });
});

describe("phase logic and the ceremony", () => {
  const toCeremony = (): DriveResult =>
    drive(seedState({ pulse: MAX_PULSE }), 1, (_tick, state) => ({
      targetX: WARDEN_RING.centerX + 2,
      targetZ: WARDEN_RING.centerZ,
      pulseDamage: state.pulse - CEREMONY_PULSE,
    }));

  it("triggers the ceremony at 55% Pulse and not a tick before", () => {
    const above = stepWarden(
      WARDEN_PARAMS,
      WARDEN_RING,
      seedState({ pulse: CEREMONY_PULSE + 1 }),
      { targetX: WARDEN_RING.centerX + 2, targetZ: WARDEN_RING.centerZ },
    );
    expect(above.state.fsm).not.toBe("ceremony");
    const at = stepWarden(
      WARDEN_PARAMS,
      WARDEN_RING,
      seedState({ pulse: CEREMONY_PULSE }),
      { targetX: WARDEN_RING.centerX + 2, targetZ: WARDEN_RING.centerZ },
    );
    expect(at.state.fsm).toBe("ceremony");
    expect(WARDEN_PARAMS.ceremony.pulsePercent).toBe(55);
  });

  it("hangs the lantern and opens a 90-tick invulnerable no-damage hold", () => {
    const start = toCeremony().state;
    expect(start.fsm).toBe("ceremony");
    expect(isWardenInvulnerable(start)).toBe(true);
    const events = toCeremony().events;
    expect(events).toContainEqual({
      type: "lantern-hung",
      tick: 0,
      anchorId: "lantern.hang",
    });
    expect(events).toContainEqual({
      type: "ceremony-requested",
      tick: 0,
      holdTicks: 90,
      anchorId: "cam.warden_intro",
      dealsDamage: false,
    });

    const hold = drive(start, WARDEN_PARAMS.ceremony.holdTicks, () => ({
      targetX: WARDEN_RING.centerX + 2,
      targetZ: WARDEN_RING.centerZ,
      pulseDamage: 500,
    }));
    expect(hold.state.pulse).toBe(start.pulse);
    expect(hold.intents).toHaveLength(0);
    expect(hold.events.filter((event) => event.type === "ceremony-ended")).toHaveLength(1);
    expect(hold.state.phase).toBe("p2");
    expect(hold.state.ceremonyDone).toBe(true);
  });

  it("never re-enters the ceremony in Phase 2", () => {
    const p2 = seedState({
      phase: "p2",
      ceremonyDone: true,
      pulse: 10,
      fsm: "neutral",
    });
    const run = drive(p2, 30, holdAt(WARDEN_RING.centerX + 2, WARDEN_RING.centerZ));
    expect(run.events.some((event) => event.type === "ceremony-requested")).toBe(false);
  });

  it("only ever draws from the phase's own moveset", () => {
    const p2Ids = new Set(WARDEN_PARAMS.phases.p2.moves.map((move) => move.moveId));
    const run = drive(
      seedState({ phase: "p2", ceremonyDone: true, tick: 1 }),
      400,
      holdAt(WARDEN_RING.centerX + 2.0, WARDEN_RING.centerZ),
    );
    expect(run.intents.length).toBeGreaterThan(0);
    for (const moveId of run.intents) {
      expect(p2Ids.has(moveId)).toBe(true);
    }
  });

  it("calls the injected s25 ceremony and aftermath ports", () => {
    const calls: string[] = [];
    const ports = {
      ceremony: {
        pulsePercent: WARDEN_PARAMS.ceremony.pulsePercent,
        holdTicks: WARDEN_PARAMS.ceremony.holdTicks,
        shouldBegin: (pulse: number, max: number): boolean =>
          pulse * 100 <= max * WARDEN_PARAMS.ceremony.pulsePercent,
        begin: (): void => {
          calls.push("ceremony");
        },
      },
      aftermath: {
        begin: (): void => {
          calls.push("aftermath");
        },
      },
    };
    const ceremonial = stepWarden(
      WARDEN_PARAMS,
      WARDEN_RING,
      seedState({ pulse: CEREMONY_PULSE - 5 }),
      { targetX: WARDEN_RING.centerX + 2, targetZ: WARDEN_RING.centerZ },
      ports,
    );
    expect(calls).toEqual(["ceremony"]);
    stepWarden(
      WARDEN_PARAMS,
      WARDEN_RING,
      { ...ceremonial.state, fsm: "neutral", phase: "p2", ceremonyDone: true },
      { targetX: WARDEN_RING.centerX + 2, targetZ: WARDEN_RING.centerZ, pulseDamage: MAX_PULSE },
      ports,
    );
    expect(calls).toEqual(["ceremony", "aftermath"]);
  });
});

describe("arena systems", () => {
  it("roots the player 45 ticks with a chime on snare contact, once per root", () => {
    const edge = {
      x: WARDEN_RING.centerX,
      z: WARDEN_RING.centerZ + WARDEN_RING.radiusMeters,
    };
    const run = drive(seedState(), WARDEN_PARAMS.ring.rootTicks, holdAt(edge.x, edge.z));
    const contacts = run.events.filter((event) => event.type === "snare-contact");
    expect(contacts).toHaveLength(1);
    expect(contacts[0]).toEqual({
      type: "snare-contact",
      tick: 0,
      actorId: "player",
      rootTicks: 45,
      chime: true,
    });
    const longer = drive(seedState(), WARDEN_PARAMS.ring.rootTicks + 1, holdAt(edge.x, edge.z));
    expect(longer.events.filter((event) => event.type === "snare-contact")).toHaveLength(2);
  });

  it("ends the charge-through at the ring, passing through instead of rooting", () => {
    const charge = wardenMove(WARDEN_PARAMS, "p2", "warden_p2_charge_through");
    const start = seedState({
      phase: "p2",
      ceremonyDone: true,
      x: WARDEN_RING.centerX,
      z: WARDEN_RING.centerZ,
      yaw: 0,
      action: { moveId: charge.moveId, startedTick: 0, tick: 0 },
      fsm: "committed_move",
    });
    const run = drive(start, charge.clip.totalTicks, () => ({
      targetX: WARDEN_RING.centerX,
      targetZ: WARDEN_RING.centerZ + 8,
    }));
    expect(run.events.filter((event) => event.type === "charge-ended-at-ring")).toHaveLength(1);
    expect(run.events.some((event) => event.type === "snare-pass-through")).toBe(true);
    const distance = Math.hypot(
      run.state.x - WARDEN_RING.centerX,
      run.state.z - WARDEN_RING.centerZ,
    );
    expect(distance).toBeLessThanOrEqual(WARDEN_RING.radiusMeters + 1e-6);
    expect(distance).toBeGreaterThan(WARDEN_RING.radiusMeters - 1);
  });

  it("leashes back to the arena bounds", () => {
    const outside = seedState({
      x: WARDEN_RING.centerX,
      z: WARDEN_RING.centerZ + WARDEN_RING.radiusMeters + 6,
    });
    const run = drive(outside, 200, holdAt(WARDEN_RING.centerX, WARDEN_RING.centerZ + 40));
    expect(run.events.filter((event) => event.type === "leash-reset")).toHaveLength(1);
    expect(
      Math.hypot(run.state.x - WARDEN_RING.centerX, run.state.z - WARDEN_RING.centerZ),
    ).toBeLessThanOrEqual(WARDEN_RING.radiusMeters);
  });
});

describe("s15 entry-gate binding", () => {
  const applyGate = (state: MetaState, transition: WardenArenaTransition): MetaState => {
    if (transition === "enter") return enterArena(state);
    if (transition === "engage") return engageBoss(state);
    if (transition === "defeated") return bossDefeated(state);
    return arenaOnDeath(state);
  };

  it("drives the real s15 arena FSM from outside to a terminal victory", () => {
    const inside = { x: WARDEN_RING.centerX + 2, z: WARDEN_RING.centerZ };
    let state = seedState({ pulse: 60 });
    let meta = createMetaState();
    expect(meta.arena).toBe("outside");
    const transitions: WardenArenaTransition[] = [];
    for (let tick = 0; tick < 400; tick += 1) {
      const stepped = stepWarden(WARDEN_PARAMS, WARDEN_RING, state, {
        targetX: inside.x,
        targetZ: inside.z,
        targetInsideArena: true,
        pulseDamage: tick === 250 ? 1000 : 0,
      });
      state = stepped.state;
      for (const event of stepped.events) {
        if (event.type === "arena-gate") {
          transitions.push(event.transition);
          meta = applyGate(meta, event.transition);
        }
      }
    }
    expect(transitions).toEqual(["enter", "engage", "defeated"]);
    expect(meta.arena).toBe("victoryNoRespawn");
    expect(bossIsDown(meta)).toBe(true);
  });

  it("emits the death-reset gate when the player dies inside the ring", () => {
    const engaged = seedState({ enteredArena: true, engaged: true });
    const stepped = stepWarden(WARDEN_PARAMS, WARDEN_RING, engaged, {
      targetX: WARDEN_RING.centerX + 2,
      targetZ: WARDEN_RING.centerZ,
      targetDied: true,
    });
    expect(stepped.events).toContainEqual({
      type: "arena-gate",
      tick: 0,
      transition: "death-reset",
    });
    expect(stepped.state.engaged).toBe(false);
    expect(stepped.state.action).toBeNull();
    let meta = engageBoss(enterArena(createMetaState()));
    meta = arenaOnDeath(meta);
    expect(meta.arena).toBe("deathReset");
  });
});
