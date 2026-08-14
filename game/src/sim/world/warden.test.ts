/**
 * s19 — the Warden's binding, not his state machine.
 *
 * `sim/boss` already proves the FSM against its own fixtures. What is only
 * true once he is composed into the world is asserted here: that he is a world
 * actor s10 moves and s11 damages, that his move intents reach the action
 * clock, that the quiet is fed as an area pulse instead of a swing, that the
 * charge-through honours the 6+24 split, and that his ceremony, his phase, his
 * defeat, and the snare all land in the world's own vocabulary.
 */

import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { compileWalkGraph, parseWolfAiParams } from "../ai";
import { parseAttendParams } from "../attend";
import { parseWardenParams } from "../boss";
import type { WardenMoveParams, WardenPhase, WardenState } from "../boss";
import { acceptSidecar, compileCombatData } from "../combat";
import type { SteadyClass } from "../combat";
import { parseMotionParams } from "../motion";
import type { Vec3 } from "../motion";
import { parseSceneScripts } from "../scenes";
import {
  EMPTY_WORLD_INPUT,
  createWorldDefinition,
  createWorldState,
  isQuietMove,
  stepWorld,
  stepWorldWarden,
  wardenIsInvulnerable,
  wardenSwingIsLive,
  type WorldInputFrame,
  type WorldQueries,
  type WorldState,
  type WorldWardenDefinition,
} from "./index";

const json = (url: URL): unknown => JSON.parse(readFileSync(url, "utf8"));
const data = (name: string): unknown => json(new URL(`../../data/${name}`, import.meta.url));
const asset = (name: string): unknown => json(new URL(`../../../assets/build/${name}`, import.meta.url));

const assembly = data("world_assembly.json");
const placements = data("levels/ironwood_placements.json");
const sidecarNames = [
  "kalev_blocking_guard.json",
  "kalev_blocking_heavy.json",
  "kalev_blocking_light1.json",
  "kalev_blocking_roll.json",
  "wolf_circle.json",
  "wolf_death_crumple_back.json",
  "wolf_death_crumple_fwd.json",
  "wolf_flinch.json",
  "wolf_idle.json",
  "wolf_lunge.json",
  "wolf_stalk.json",
] as const;

const definition = createWorldDefinition(assembly, {
  aiParams: parseWolfAiParams(data("wolf_ai_params.json")),
  attendParams: parseAttendParams(data("attend_params.json")),
  combatData: compileCombatData(data("frame_data.json"), data("combat_params.json")),
  motionParams: parseMotionParams(data("motion_params.json")),
  navGraph: compileWalkGraph(data("levels/ironwood_nav.json") as Parameters<typeof compileWalkGraph>[0]),
  placements,
  sceneCatalog: parseSceneScripts(data("scene_scripts.json")),
  sidecars: Object.fromEntries(sidecarNames.map((name) => [name, acceptSidecar(asset(name))])),
  wardenParams: parseWardenParams(data("warden_params.json"), data("frame_data.json")),
  zones: (data("levels/ironwood_manifest.json") as { readonly zones: unknown }).zones,
});

const queries: WorldQueries = {
  definition,
  probeGround: ({ capsule }) => ({
    distance: definition.motionParams.capsule.skin,
    normal: { x: 0, y: 1, z: 0 },
    point: { x: capsule.start.x, y: 0, z: capsule.start.z },
    triangleIndex: 0,
  }),
  raycast: () => null,
  sweepCapsule: () => null,
};

type DamageActor = NonNullable<WorldState["combat"]["damageActors"][string]>;
type CombatActor = NonNullable<WorldState["combat"]["combat"]["actors"][string]>;
type WorldActor = NonNullable<WorldState["actors"][string]>;

const assembledWarden = (): WorldWardenDefinition => {
  const value = definition.warden;
  if (value === null) throw new Error("The Ironwood assembly must carry its Warden.");
  return value;
};

const warden = assembledWarden();
const wardenId = warden.actorId;
const playerId = definition.player.id;
const ring = warden.ring;

const damageActorOf = (state: WorldState, actorId: string): DamageActor => {
  const actor = state.combat.damageActors[actorId];
  if (actor === undefined) throw new Error(`s11 holds no damage actor for ${actorId}.`);
  return actor;
};

const combatActorOf = (state: WorldState, actorId: string): CombatActor => {
  const actor = state.combat.combat.actors[actorId];
  if (actor === undefined) throw new Error(`s11 holds no combat actor for ${actorId}.`);
  return actor;
};

const actorOf = (state: WorldState, actorId: string): WorldActor => {
  const actor = state.actors[actorId];
  if (actor === undefined) throw new Error(`The world holds no actor ${actorId}.`);
  return actor;
};

const fsmOf = (state: WorldState): WardenState => {
  const value = state.warden;
  if (value === null) throw new Error("A world assembled with a Warden must carry his FSM state.");
  return value;
};

const phaseMove = (phase: WardenPhase, moveId: string): WardenMoveParams => {
  const move = warden.params.phases[phase].moves.find((entry) => entry.moveId === moveId);
  if (move === undefined) throw new Error(`${phase} does not author ${moveId}.`);
  return move;
};

const poiseBandsOf = (
  steadyClass: SteadyClass,
): { readonly flinch: number; readonly knockdown: number; readonly stagger: number } => {
  const steady = definition.combatData.params.steady.classes[steadyClass];
  if (steady === undefined) throw new Error(`Combat authors no Steady class ${steadyClass}.`);
  return {
    flinch: steady.flinchThreshold,
    knockdown: steady.knockdownThreshold,
    stagger: steady.staggerThreshold,
  };
};

/** A point on the arena floor, offset north of the ring centre. */
const northOfCentre = (meters: number): Vec3 => ({
  x: ring.centerX,
  y: 0,
  z: ring.centerZ + meters,
});

/** Staged exactly as world.test.ts stages pack membership: motion owns position. */
const withPlayerAt = (state: WorldState, position: Vec3): WorldState => {
  const player = actorOf(state, playerId);
  return {
    ...state,
    actors: {
      ...state.actors,
      [playerId]: { ...player, motion: { ...player.motion, position } },
    },
  };
};

/**
 * s11 owns the Warden's Pulse, and the flat-ground harness bakes no Warden
 * sidecar, so no player swing can ever reach him here. Staging his damage
 * actor is the only way to put him at a Pulse threshold; every consequence of
 * that Pulse still runs through the real `stepWorld`.
 */
const withWardenPulse = (state: WorldState, pulse: number): WorldState => {
  const damaged = damageActorOf(state, wardenId);
  return {
    ...state,
    combat: {
      ...state.combat,
      damageActors: { ...state.combat.damageActors, [wardenId]: { ...damaged, pulse } },
    },
  };
};

const interactAt = (tick: number): WorldInputFrame => ({
  ...EMPTY_WORLD_INPUT,
  edges: [{ action: "interact", pressed: true, sequence: 0, tick }],
});

/** Player two metres off his nose: inside the ring, inside every P1 move range. */
const beside = northOfCentre(2);

/** Steps until the FSM commits its first move, which is what opens s15's fight. */
const driveToEngagement = (): WorldState => {
  let state = withPlayerAt(createWorldState(queries), beside);
  for (let tick = 0; tick < 240 && state.meta.arena !== "inFight"; tick += 1) {
    state = stepWorld(state, EMPTY_WORLD_INPUT, queries).state;
  }
  if (state.meta.arena !== "inFight") {
    throw new Error("The Warden never engaged within 240 ticks beside the ring.");
  }
  return state;
};

const driveToDefeat = (): WorldState =>
  stepWorld(withWardenPulse(driveToEngagement(), 0), EMPTY_WORLD_INPUT, queries).state;

describe("the Warden, bound into the world", () => {
  it("stands in the roster as a world actor, seeded at full Pulse in his Phase 1 class", () => {
    const actor = definition.actors[wardenId];
    expect(actor?.kind).toBe("warden");
    expect(actor?.packId).toBeNull();

    const state = createWorldState(queries);
    expect(combatActorOf(state, wardenId).actorClass).toBe(warden.phaseActorClasses.p1);
    expect(damageActorOf(state, wardenId).pulse).toBe(warden.maxPulse);
    expect(damageActorOf(state, wardenId).poiseBands).toEqual(
      poiseBandsOf(warden.phaseSteadyClasses.p1),
    );

    const fsm = fsmOf(state);
    expect(fsm.fsm).toBe("approach");
    expect(fsm.phase).toBe("p1");
    expect(fsm.pulse).toBe(warden.maxPulse);
    expect(fsm.maxPulse).toBe(warden.maxPulse);
    expect(fsm.x).toBeCloseTo(ring.centerX, 9);
    expect(fsm.z).toBeCloseTo(ring.centerZ, 9);
  });

  it("hands each committed move to the s11 action clock as his live action", () => {
    let state = withPlayerAt(createWorldState(queries), beside);
    let committed: string | null = null;
    for (let tick = 0; tick < 240 && committed === null; tick += 1) {
      state = stepWorld(state, EMPTY_WORLD_INPUT, queries).state;
      committed = fsmOf(state).action?.moveId ?? null;
    }

    expect(committed, "the Warden committed no move within 240 ticks beside the ring").not.toBeNull();
    expect(combatActorOf(state, wardenId).action?.id).toBe(committed);
    expect(fsmOf(state).engaged).toBe(true);
    expect(state.meta.arena).toBe("inFight");
  });

  it("knows the quiet by its authored move id and never sends it to the action clock", () => {
    const quietId = warden.params.quiet.moveId;
    expect(isQuietMove(warden, quietId)).toBe(true);
    for (const move of warden.params.phases.p2.moves) {
      expect(isQuietMove(warden, move.moveId), move.moveId).toBe(move.moveId === quietId);
    }

    // Every other Phase 2 move put on cooldown, so selection can only reach the
    // quiet: the point is what composition does with the intent, not how it won.
    const onCooldown = Object.fromEntries(
      warden.params.phases.p2.moves
        .filter((move) => move.moveId !== quietId)
        .map((move) => [move.moveId, 0]),
    );
    const seated: WardenState = {
      ...fsmOf(createWorldState(queries)),
      phase: "p2",
      fsm: "neutral",
      ceremonyDone: true,
      engaged: true,
      lastUsedTick: onCooldown,
    };
    const stepped = stepWorldWarden(seated, definition, {
      targetPosition: northOfCentre(7),
      targetDied: false,
      combatPulse: seated.pulse,
      sequenceBase: 0,
      tick: 0,
    });

    expect(stepped).not.toBeNull();
    expect(stepped?.state.action?.moveId).toBe(quietId);
    expect(stepped?.state.fsm).toBe("committed_move");
    expect(stepped?.commands).toEqual([]);
  });

  it("resolves the quiet as Wither inside its authored radius and nothing outside it", () => {
    const quiet = phaseMove("p2", warden.params.quiet.moveId);
    const firstActive = quiet.clip.activeWindows[0];
    expect(firstActive).toBeDefined();
    if (firstActive === undefined) return;

    // Driving the FSM to a Phase 2 stillness through the real ceremony costs
    // hundreds of ticks and a cooldown pile-up, so the committed action is
    // seated directly on the tick its pulse fires; the world then steps for real.
    const staged = (position: Vec3): WorldState => {
      const base = withPlayerAt(createWorldState(queries), position);
      return {
        ...base,
        warden: {
          ...fsmOf(base),
          phase: "p2",
          fsm: "committed_move",
          ceremonyDone: true,
          engaged: true,
          action: { moveId: quiet.moveId, startedTick: 0, tick: firstActive.startTick },
        },
      };
    };

    const insideStart = staged(northOfCentre(warden.params.quiet.radiusMeters / 2));
    const inside = stepWorld(insideStart, EMPTY_WORLD_INPUT, queries);
    const before = damageActorOf(insideStart, playerId);
    const after = damageActorOf(inside.state, playerId);

    expect(after.turnBuildup).toBe(before.turnBuildup + warden.params.quiet.witherAmount);
    expect(after.pulse).toBe(before.pulse);
    expect(combatActorOf(inside.state, wardenId).action).toBeNull();
    expect(inside.events.some((event) =>
      event.source === "boss" &&
      "type" in event.payload &&
      event.payload.type === "wither-pulse-applied")).toBe(true);

    const outsideStart = staged(northOfCentre(warden.params.quiet.radiusMeters + 2));
    const outside = stepWorld(outsideStart, EMPTY_WORLD_INPUT, queries);

    expect(damageActorOf(outside.state, playerId).turnBuildup).toBe(
      damageActorOf(outsideStart, playerId).turnBuildup,
    );
    expect(damageActorOf(outside.state, playerId).pulse).toBe(
      damageActorOf(outsideStart, playerId).pulse,
    );
  });

  it("lets the charge-through connect for its contact ticks and travel the rest inert", () => {
    const split = warden.params.phases.p2.moves.filter(
      (move) => move.contactTicksPerWindow !== null,
    );
    expect(split).toHaveLength(1);
    const charge = split[0];
    expect(charge).toBeDefined();
    if (charge === undefined) return;

    const active = charge.clip.activeWindows[0];
    const contact = charge.clip.contactWindows[0];
    expect(active).toBeDefined();
    expect(contact).toBeDefined();
    if (active === undefined || contact === undefined) return;

    expect(charge.clip.activeWindows).toHaveLength(1);
    expect(contact.startTick).toBe(active.startTick);
    expect(contact.endTickExclusive).toBeLessThan(active.endTickExclusive);
    expect(contact.endTickExclusive - contact.startTick).toBe(charge.contactTicksPerWindow);

    for (let tick = 0; tick < charge.clip.totalTicks; tick += 1) {
      expect(
        wardenSwingIsLive(warden, "p2", charge.moveId, tick),
        `charge-through tick ${String(tick)}`,
      ).toBe(tick >= contact.startTick && tick < contact.endTickExclusive);
    }
  });

  it("opens the ceremony at the authored Pulse percent and holds him untouchable through it", () => {
    const threshold = (warden.maxPulse * warden.params.ceremony.pulsePercent) / 100;
    const staged = withWardenPulse(withPlayerAt(createWorldState(queries), beside), threshold);
    const state = stepWorld(staged, EMPTY_WORLD_INPUT, queries).state;
    const fsm = fsmOf(state);

    expect(fsm.fsm).toBe("ceremony");
    expect(wardenIsInvulnerable(fsm)).toBe(true);
    // The request lands on his first tick, so the hold reads straight off the params.
    expect(fsm.ceremonyEndTick).toBe(warden.params.ceremony.holdTicks);
    expect(state.scenes.active?.scriptId).toBe("warden_ceremony");
    expect(combatActorOf(state, wardenId).action?.id).toBe(warden.ceremonyMoveId);
    expect(damageActorOf(state, wardenId).invulnerable).toBe(true);
  });

  it("re-seats his Steady class when the ceremony ends, so Phase 2 poise is his own", () => {
    const threshold = (warden.maxPulse * warden.params.ceremony.pulsePercent) / 100;
    let state = withWardenPulse(withPlayerAt(createWorldState(queries), beside), threshold);
    for (let tick = 0; tick <= warden.params.ceremony.holdTicks + 1; tick += 1) {
      state = stepWorld(state, EMPTY_WORLD_INPUT, queries).state;
    }

    expect(fsmOf(state).phase).toBe("p2");
    expect(damageActorOf(state, wardenId).poiseBands).toEqual(
      poiseBandsOf(warden.phaseSteadyClasses.p2),
    );
    expect(damageActorOf(state, wardenId).poiseBands).not.toEqual(
      poiseBandsOf(warden.phaseSteadyClasses.p1),
    );
  });

  it("wins the arena for good when his Pulse reaches zero, and lights the arena Hearth", () => {
    const engaged = driveToEngagement();
    const step = stepWorld(withWardenPulse(engaged, 0), EMPTY_WORLD_INPUT, queries);

    expect(fsmOf(step.state).fsm).toBe("defeated");
    expect(step.state.meta.arena).toBe("victoryNoRespawn");
    expect(step.state.scenes.active?.scriptId).toBe("warden_aftermath");
    expect(step.state.arenaHearthLit).toBe(true);
    expect(step.events.some((event) =>
      event.source === "world" &&
      "type" in event.payload &&
      event.payload.type === "arena-hearth-lit")).toBe(true);
  });

  it("stays down through a Hearth reset — victory never brings the Warden back", () => {
    // The aftermath holds the frame, and its second step is a real choice, so
    // it is walked out through the staged verb seam before the Hearth is asked.
    let state = stepWorld(driveToDefeat(), {
      ...EMPTY_WORLD_INPUT,
      scene: { verb: "DiscoverTag" },
    }, queries).state;
    state = stepWorld(state, { ...EMPTY_WORLD_INPUT, scene: { verb: "WalkAway" } }, queries).state;
    expect(state.scenes.active).toBeNull();

    const hearth = definition.hearths[warden.arenaHearthId];
    expect(hearth).toBeDefined();
    if (hearth === undefined) return;
    const rested = stepWorld(
      withPlayerAt(state, hearth.position),
      interactAt(state.tick),
      queries,
    ).state;

    expect(rested.meta.lastHearthId).toBe(warden.arenaHearthId);
    expect(rested.meta.arena).toBe("victoryNoRespawn");
    expect(damageActorOf(rested, wardenId).pulse).toBe(0);
    expect(fsmOf(rested).fsm).toBe("defeated");
  });

  it("roots the player on the snare line and eats his move input while the root holds", () => {
    const onTheLine = northOfCentre(ring.radiusMeters);
    const touched = stepWorld(
      withPlayerAt(createWorldState(queries), onTheLine),
      EMPTY_WORLD_INPUT,
      queries,
    );

    expect(fsmOf(touched.state).targetRootedUntilTick).toBe(warden.params.ring.rootTicks);
    expect(touched.events.some((event) =>
      event.source === "boss" &&
      "type" in event.payload &&
      event.payload.type === "snare-root-applied")).toBe(true);

    // The staged position lands him, and landing lag is its own motion lock;
    // the line keeps re-rooting him, so the root still holds once it clears.
    let settled = touched.state;
    for (let tick = 0; tick < definition.motionParams.landing.softLagTicks * 2; tick += 1) {
      settled = stepWorld(settled, EMPTY_WORLD_INPUT, queries).state;
    }

    const before = actorOf(settled, playerId).motion.position;
    const held = stepWorld(settled, { ...EMPTY_WORLD_INPUT, moveZ: -1 }, queries).state;
    const after = actorOf(held, playerId).motion.position;

    expect(held.tick).toBeLessThan(held.snareRootUntilTick);
    expect(after.x).toBeCloseTo(before.x, 12);
    expect(after.z).toBeCloseTo(before.z, 12);

    // The same frame with the root lifted: it is the root that ate the input.
    const freed = stepWorld(
      { ...settled, snareRootUntilTick: 0 },
      { ...EMPTY_WORLD_INPUT, moveZ: -1 },
      queries,
    ).state;
    expect(actorOf(freed, playerId).motion.position.z).not.toBeCloseTo(before.z, 6);
  });

  it("roots once per approach, so the line is a hazard and not a wall", () => {
    // Standing in the contact band re-arms the FSM every `rootTicks`; a player
    // frozen inside the band can never leave it, so only a fresh crossing roots.
    let state = withPlayerAt(createWorldState(queries), northOfCentre(ring.radiusMeters));
    const rootTicks = warden.params.ring.rootTicks;
    let roots = 0;
    for (let tick = 0; tick < rootTicks * 3; tick += 1) {
      const step = stepWorld(state, EMPTY_WORLD_INPUT, queries);
      state = step.state;
      roots += step.events.filter((event) =>
        event.source === "boss" &&
        "type" in event.payload &&
        event.payload.type === "snare-root-applied").length;
    }

    expect(roots).toBe(1);
    expect(state.tick).toBeGreaterThan(state.snareRootUntilTick);
  });
});
