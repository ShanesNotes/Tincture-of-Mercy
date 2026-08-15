/**
 * O-F1 / O-F6 / O-F8 world-level repros: empty boot, ember_use clip, ambient Wither.
 */

import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { compileWalkGraph, parseWolfAiParams } from "../ai";
import { parseAttendParams } from "../attend";
import { parseWardenParams } from "../boss";
import { acceptSidecar, compileCombatData } from "../combat";
import { parseMotionParams } from "../motion";
import type { Vec3 } from "../motion";
import { inheritAnnaSupply } from "../meta";
import { applyVerb, parseSceneScripts, tryEnterScene } from "../scenes";
import {
  EMPTY_WORLD_INPUT,
  createWorldDefinition,
  createWorldState,
  stepWorld,
  type WorldInputFrame,
  type WorldQueries,
  type WorldState,
} from "./index";
import { applySceneEffects } from "./scenes";

const json = (url: URL): unknown => JSON.parse(readFileSync(url, "utf8"));
const data = (name: string): unknown => json(new URL(`../../data/${name}`, import.meta.url));
const asset = (name: string): unknown => json(new URL(`../../../assets/build/${name}`, import.meta.url));

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

const definition = createWorldDefinition(data("world_assembly.json"), {
  aiParams: parseWolfAiParams(data("wolf_ai_params.json")),
  attendParams: parseAttendParams(data("attend_params.json")),
  combatData: compileCombatData(data("frame_data.json"), data("combat_params.json")),
  motionParams: parseMotionParams(data("motion_params.json")),
  navGraph: compileWalkGraph(data("levels/ironwood_nav.json") as Parameters<typeof compileWalkGraph>[0]),
  placements: data("levels/ironwood_placements.json"),
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

const playerId = definition.player.id;

const place = (state: WorldState, position: Vec3): WorldState => {
  const actor = state.actors[playerId];
  if (actor === undefined) throw new Error("missing player");
  return {
    ...state,
    actors: {
      ...state.actors,
      [playerId]: { ...actor, motion: { ...actor.motion, position } },
    },
  };
};

const flaskPress = (useEmber = false): WorldInputFrame => ({
  ...EMPTY_WORLD_INPUT,
  useEmber,
  edges: [{ action: "flask", pressed: true, sequence: 1, tick: 0 }],
});

describe("O-F1 world boot", () => {
  it("opens with 0 doses, 0 Embers, and Anna's chest full", () => {
    const state = createWorldState(queries);
    expect(state.tick).toBe(0);
    expect(state.meta.vial.doses).toBe(0);
    expect(state.meta.pouch.ember).toBe(0);
    expect(state.meta.inherited).toBe(false);
    expect(state.meta.annaSupply).toEqual({ doses: 3, ember: 2 });
  });

  it("denies flask input before inheritance with the empty-vial key", () => {
    const step = stepWorld(createWorldState(queries), flaskPress(), queries);
    expect(step.state.combat.combat.actors[playerId]?.action).toBeNull();
    expect(step.state.meta.pending).toBeNull();
    expect(
      step.events.some(
        (event) =>
          "type" in event.payload &&
          event.payload.type === "tincture-denied" &&
          event.payload.textKey === "ui.tincture.empty",
      ),
    ).toBe(true);
  });

  it("DoseAnna then WitnessDeath inherits N remaining", () => {
    let scenes = createWorldState(queries).scenes;
    let meta = createWorldState(queries).meta;
    scenes = tryEnterScene(scenes, "cabin_prologue", definition.sceneCatalog, { engaged: false }).state;
    for (const verb of ["DrawWater", "CarryWater", "BreakBread", "ShareBread", "DoseAnna"]) {
      const applied = applyVerb(scenes, verb, definition.sceneCatalog);
      scenes = applied.state;
      meta = applySceneEffects(applied.events, meta, definition.metaParams, false).meta;
    }
    expect(scenes.flags["anna.dosesRemaining"]).toBe(2);
    expect(meta.annaSupply.doses).toBe(2);
    expect(meta.vial.doses).toBe(0);

    const gravity = tryEnterScene(scenes, "anna_gravity", definition.sceneCatalog, { engaged: false });
    scenes = gravity.state;
    let inheritedDoses: number | null = null;
    for (const verb of [
      "ObserveBreath",
      "SitNear",
      "HoldHand",
      "SpeakName",
      "Pray",
      "KeepWatch",
      "WitnessDeath",
      "WriteName",
    ]) {
      const applied = applyVerb(scenes, verb, definition.sceneCatalog);
      scenes = applied.state;
      const event = applied.events.find((entry) => entry.type === "vial-inherited");
      if (event !== undefined && event.type === "vial-inherited") {
        inheritedDoses = event.doses;
      }
      meta = applySceneEffects(applied.events, meta, definition.metaParams, false).meta;
    }
    expect(inheritedDoses).toBe(2);
    expect(meta.inherited).toBe(true);
    expect(meta.vial.doses).toBe(2);
    expect(meta.pouch.ember).toBe(2);
    expect(scenes.flags["taught.inherited"]).toBe(1);
  });
});

describe("O-F6 ember_use clip", () => {
  it("binds ember_use (30/84) and commits on Ember's own drink tick", () => {
    let state = createWorldState(queries);
    state = { ...state, meta: inheritAnnaSupply(state.meta) };
    const started = stepWorld(state, flaskPress(true), queries);
    expect(started.state.combat.combat.actors[playerId]?.action?.id).toBe("ember_use");
    expect(started.state.meta.pending?.kind).toBe("ember");

    let current = started.state;
    for (let tick = 0; tick < 29; tick += 1) {
      current = stepWorld(current, EMPTY_WORLD_INPUT, queries).state;
    }
    expect(current.combat.combat.actors[playerId]?.action?.id).toBe("ember_use");
    expect(current.combat.combat.actors[playerId]?.action?.tick).toBe(30);
    expect(current.meta.pouch.ember).toBe(1);
    expect(current.meta.numbnessStacks).toBe(1);
    expect(current.meta.vial.doses).toBe(3);
  });
});

describe("O-F8 ambient Wither", () => {
  it("standing in a ROAD pocket 600t yields 5 Wither", () => {
    const pocket = definition.witherZones.find((zone) => zone.id === "wither.pocket_a");
    expect(pocket).toBeDefined();
    if (pocket === undefined) return;
    let state = place(createWorldState(queries), {
      x: pocket.position.x,
      y: 0,
      z: pocket.position.z,
    });
    for (let tick = 0; tick < 600; tick += 1) {
      state = stepWorld(state, EMPTY_WORLD_INPUT, queries).state;
    }
    expect(state.combat.damageActors[playerId]?.turnBuildup).toBeCloseTo(5, 10);
  });

  it("does not apply on the road path or in the arena", () => {
    let road = place(createWorldState(queries), { x: 0, y: 0, z: -80 });
    let arena = place(createWorldState(queries), { x: 0, y: 0, z: -136 });
    for (let tick = 0; tick < 60; tick += 1) {
      road = stepWorld(road, EMPTY_WORLD_INPUT, queries).state;
      arena = stepWorld(arena, EMPTY_WORLD_INPUT, queries).state;
    }
    expect(road.combat.damageActors[playerId]?.turnBuildup ?? 0).toBe(0);
    expect(arena.combat.damageActors[playerId]?.turnBuildup ?? 0).toBe(0);
  });
});

