import { readFileSync } from "node:fs";

import { BufferGeometry, Float32BufferAttribute } from "three";
import { MeshBVH } from "three-mesh-bvh";
import { describe, expect, it } from "vitest";

import { compileWalkGraph, parseWolfAiParams } from "../../sim/ai";
import { parseAttendParams } from "../../sim/attend";
import { parseWardenParams } from "../../sim/boss";
import { acceptSidecar, compileCombatData } from "../../sim/combat";
import { awardNames } from "../../sim/meta";
import { parseMotionParams } from "../../sim/motion";
import { parseSceneScripts } from "../../sim/scenes";
import {
  EMPTY_WORLD_INPUT,
  createWorldDefinition,
  createWorldState,
  stepWorld,
  type WorldQueries,
  type WorldState,
} from "../../sim/world";
import { MeshBvhCollisionWorld } from "../../view/collision";

/**
 * S19 (a)/(b) repros: walk off FOREST at x≈5.5, and a shove past the 9.2 m
 * snare ring. Both must die-or-stand on authored bounds — never live in the void.
 */

const json = (url: URL): unknown => JSON.parse(readFileSync(url, "utf8"));
const data = (name: string): unknown => json(new URL(`../${name}`, import.meta.url));
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

interface CollisionDocument {
  readonly triangles: readonly (readonly [number, number, number])[];
  readonly vertices: readonly (readonly [number, number, number])[];
}

const SNARE_RADIUS_M = 9.2;
const ARENA_CENTER = { x: 0, z: -136 } as const;
const KILL_PLANE_Y = -10;
const FOREST_WALKOFF = { x: 5.5, y: 0.2, z: -40 } as const;

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

const collisionGeometry = (): BufferGeometry => {
  const vertices: number[] = [];
  const indices: number[] = [];
  for (const zone of ["arena", "cabin", "forest", "road", "road_coda", "woodline", "yard"]) {
    const collision = asset(`levels/${zone}.collision.json`) as CollisionDocument;
    const offset = vertices.length / 3;
    for (const vertex of collision.vertices) vertices.push(...vertex);
    for (const triangle of collision.triangles) {
      indices.push(triangle[0] + offset, triangle[1] + offset, triangle[2] + offset);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  return geometry;
};

const queriesFrom = (geometry: BufferGeometry): WorldQueries => {
  const collision = new MeshBvhCollisionWorld(new MeshBVH(geometry));
  return {
    definition,
    raycast: (query) => collision.raycast(query),
    sweepCapsule: (query) => collision.sweepCapsule(query),
    probeGround: ({ capsule, maxDistance }) => {
      const hit = collision.raycast({
        origin: capsule.start,
        direction: { x: 0, y: -1, z: 0 },
        maxDistance: maxDistance + capsule.radius,
      });
      if (hit === null) return null;
      const distance = Math.max(0, hit.distance - capsule.radius);
      return distance > maxDistance ? null : { ...hit, distance };
    },
  };
};

const quietOthers = (state: WorldState): WorldState => ({
  ...state,
  combat: {
    ...state.combat,
    damageActors: Object.fromEntries(
      Object.entries(state.combat.damageActors).map(([id, actor]) => [
        id,
        id === "kalev" ? actor : { ...actor, pulse: 0 },
      ]),
    ),
  },
});

const placeKalev = (state: WorldState, position: { readonly x: number; readonly y: number; readonly z: number }): WorldState => {
  const kalev = state.actors.kalev;
  if (kalev === undefined) throw new Error("missing kalev");
  return {
    ...state,
    actors: {
      ...state.actors,
      kalev: {
        ...kalev,
        motion: {
          ...kalev.motion,
          position,
          grounded: true,
          fallStartY: position.y,
        },
      },
    },
  };
};

const xzRadius = (x: number, z: number): number => Math.hypot(x - ARENA_CENTER.x, z - ARENA_CENTER.z);

describe("fall-off-forest", () => {
  it("kills a walk off the FOREST mesh at x≈5.5 and drops the Open Page at last ground", () => {
    const geometry = collisionGeometry();
    const queries = queriesFrom(geometry);
    const initial = createWorldState(queries);
    const named = awardNames(initial.meta, "witness", "anna_death", queries.definition.metaParams);
    let state = placeKalev(quietOthers({ ...initial, meta: named.state }), FOREST_WALKOFF);

    let deathPosition: { readonly x: number; readonly y: number; readonly z: number } | null = null;
    let pagePosition: { readonly x: number; readonly y: number; readonly z: number } | null = null;

    for (let tick = 0; tick < 240 && deathPosition === null; tick += 1) {
      const stepped = stepWorld(state, { ...EMPTY_WORLD_INPUT, moveX: 0, moveZ: 1 }, queries);
      state = stepped.state;
      for (const event of stepped.events) {
        const payload = event.payload;
        if (!("type" in payload)) continue;
        if (payload.type === "death") deathPosition = payload.position;
        if (payload.type === "page-dropped") pagePosition = payload.position;
      }
    }

    geometry.dispose();

    expect(deathPosition).not.toBeNull();
    expect(pagePosition).not.toBeNull();
    expect(pagePosition?.y).toBeGreaterThan(-1);
    expect(pagePosition?.y).toBeLessThan(1);
    expect(pagePosition?.y).toBeGreaterThan(KILL_PLANE_Y);
    expect(pagePosition?.x).toBeGreaterThan(3);
    expect(pagePosition?.x).toBeLessThan(8);
    expect(state.meta.openPage?.position.y).toBeGreaterThan(-1);
  });
});

describe("arena-edge-shove", () => {
  it("extends a continuous collision skirt past the 9.2 m snare ring", () => {
    const geometry = collisionGeometry();
    const queries = queriesFrom(geometry);
    const sampleR = SNARE_RADIUS_M + 1.4;
    const misses: number[] = [];
    for (let i = 0; i < 16; i += 1) {
      // Skip the south entry gap (game +Z from the bowl centre).
      if (i === 4) continue;
      const ang = (i * Math.PI) / 8;
      const x = ARENA_CENTER.x + sampleR * Math.cos(ang);
      const z = ARENA_CENTER.z + sampleR * Math.sin(ang);
      const hit = queries.probeGround({
        capsule: {
          start: { x, y: 1, z },
          end: { x, y: 1.75, z },
          radius: 0.35,
        },
        maxDistance: 2,
      });
      if (hit === null) misses.push(i);
    }
    geometry.dispose();
    expect(misses).toEqual([]);
  });

  it("keeps a fighter shoved past the snare ring on authored geometry", () => {
    const geometry = collisionGeometry();
    const queries = queriesFrom(geometry);
    const pastRing = {
      x: ARENA_CENTER.x + SNARE_RADIUS_M + 1.8,
      y: 0.2,
      z: ARENA_CENTER.z,
    };
    let state = placeKalev(quietOthers(createWorldState(queries)), pastRing);

    for (let tick = 0; tick < 90; tick += 1) {
      state = stepWorld(state, EMPTY_WORLD_INPUT, queries).state;
    }

    const kalev = state.actors.kalev;
    geometry.dispose();
    expect(kalev).toBeDefined();
    expect(kalev?.motion.position.y).toBeGreaterThan(-1);
    expect(kalev?.motion.grounded).toBe(true);
    expect(xzRadius(kalev?.motion.position.x ?? 0, kalev?.motion.position.z ?? 0)).toBeGreaterThan(SNARE_RADIUS_M);
  });
});
