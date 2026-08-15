import { readFileSync } from "node:fs";

import { BufferGeometry, Float32BufferAttribute } from "three";
import { MeshBVH } from "three-mesh-bvh";
import { describe, expect, it } from "vitest";

import { compileWalkGraph, parseWolfAiParams } from "../../sim/ai";
import { parseAttendParams } from "../../sim/attend";
import { parseWardenParams } from "../../sim/boss";
import { acceptSidecar, compileCombatData } from "../../sim/combat";
import { parseMotionParams } from "../../sim/motion";
import { parseSceneScripts } from "../../sim/scenes";
import {
  WORLD_GOLDEN_EXPECTED,
  WORLD_GOLDEN_REPLAY,
  createWorldDefinition,
  playWorldReplayCooperatively,
  type WorldQueries,
} from "../../sim/world";
import { MeshBvhCollisionWorld } from "../collision";

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

interface CollisionDocument {
  readonly triangles: readonly (readonly [number, number, number])[];
  readonly vertices: readonly (readonly [number, number, number])[];
}

interface ConditionalNavDocument {
  readonly nodes: Parameters<typeof compileWalkGraph>[0]["nodes"];
  readonly edges: readonly (Parameters<typeof compileWalkGraph>[0]["edges"][number] & {
    readonly conditional?: boolean;
  })[];
  readonly offMeshLinks: Parameters<typeof compileWalkGraph>[0]["offMeshLinks"];
}

const nav = data("levels/ironwood_nav.json") as ConditionalNavDocument;
const definition = createWorldDefinition(data("world_assembly.json"), {
  aiParams: parseWolfAiParams(data("wolf_ai_params.json")),
  attendParams: parseAttendParams(data("attend_params.json")),
  combatData: compileCombatData(data("frame_data.json"), data("combat_params.json")),
  motionParams: parseMotionParams(data("motion_params.json")),
  navGraph: compileWalkGraph({
    ...nav,
    edges: nav.edges.filter(({ conditional }) => conditional !== true),
  }),
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

describe("world golden replay", () => {
  it("replays the complete checked-in script against baked collision", async () => {
    const geometry = collisionGeometry();
    const collision = new MeshBvhCollisionWorld(new MeshBVH(geometry));
    const queries: WorldQueries = {
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

    const replay = await playWorldReplayCooperatively(
      queries,
      WORLD_GOLDEN_REPLAY,
      () => new Promise((resolve) => setImmediate(resolve)),
    );
    geometry.dispose();
    expect(definition.fingerprint).toBe(WORLD_GOLDEN_EXPECTED.definitionFingerprint);
    expect(replay.summary).toMatchObject({
      ticks: 23_776,
      firstPlayerDamage: 38,
      maxConcurrentAttackTokens: 1,
      wolfKilled: true,
      playerDied: true,
      openPageDropped: true,
      respawnedAtHearth: true,
      openPageRecovered: true,
      wolvesRespawned: true,
      flaskCommitted: true,
      restedAfterPageRecovery: true,
    });
    expect(replay.checkpoints.map(({ tick, stateHash }) => ({ tick, stateHash }))).toEqual([
      { tick: 1, stateHash: "0e5c539c" },
      { tick: 1_327, stateHash: "11a21e54" },
      { tick: 1_370, stateHash: "50627931" },
      { tick: 1_977, stateHash: "a657cd7c" },
      { tick: 6_753, stateHash: "f8f6fb16" },
      { tick: 22_140, stateHash: "a3408809" },
      { tick: 22_348, stateHash: "bacaa37a" },
      { tick: 23_776, stateHash: "4ad45fae" },
    ]);
    expect(replay.stateHash).toBe(WORLD_GOLDEN_EXPECTED.stateHash);
    expect(replay.checkpoints.every(({ moduleClocksAligned, tokenInvariant }) =>
      moduleClocksAligned && tokenInvariant)).toBe(true);
  }, 180_000);
});
