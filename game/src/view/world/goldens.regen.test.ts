/**
 * Golden regeneration for the Ironwood world, in the shape s11 and s14 already
 * use: an env-gated vitest run that prints the authoritative numbers rather
 * than asserting them.
 *
 *   REGEN_WORLD_GOLDEN=1 npx vitest run src/view/world/goldens.regen.test.ts
 *
 * It prints every value pinned by `replay.ts`, `world.test.ts` and
 * `view/world/worldReplay.test.ts`. The browser recording in `e2e/world.spec.ts`
 * cannot be produced here — Chromium's BVH arithmetic differs from Node's by
 * design — so capture that one from a Playwright run of `runReplay()`.
 */

import { readFileSync } from "node:fs";

import { BufferGeometry, Float32BufferAttribute } from "three";
import { MeshBVH } from "three-mesh-bvh";
import { describe, it } from "vitest";

import { compileWalkGraph, parseWolfAiParams } from "../../sim/ai";
import { parseAttendParams } from "../../sim/attend";
import { parseWardenParams } from "../../sim/boss";
import { acceptSidecar, compileCombatData, hashCanonical } from "../../sim/combat";
import { parseMotionParams } from "../../sim/motion";
import { parseSceneScripts } from "../../sim/scenes";
import { MeshBvhCollisionWorld } from "../collision";
import {
  WORLD_BROWSER_GOLDEN_REPLAY,
  WORLD_GOLDEN_REPLAY,
  createWorldDefinition,
  playWorldReplay,
  playWorldReplayCooperatively,
  type WorldDefinitionSources,
  type WorldQueries,
} from "../../sim/world";

const json = (url: URL): unknown => JSON.parse(readFileSync(url, "utf8"));
const data = (name: string): unknown => json(new URL(`../../data/${name}`, import.meta.url));
const asset = (name: string): unknown => json(new URL(`../../../assets/build/${name}`, import.meta.url));

const sidecarNames = [
  "kalev_blocking_guard.json", "kalev_blocking_heavy.json", "kalev_blocking_light1.json",
  "kalev_blocking_roll.json", "wolf_circle.json", "wolf_death_crumple_back.json",
  "wolf_death_crumple_fwd.json", "wolf_flinch.json", "wolf_idle.json", "wolf_lunge.json",
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
const sharedSources: Omit<WorldDefinitionSources, "navGraph"> = {
  aiParams: parseWolfAiParams(data("wolf_ai_params.json")),
  attendParams: parseAttendParams(data("attend_params.json")),
  combatData: compileCombatData(data("frame_data.json"), data("combat_params.json")),
  motionParams: parseMotionParams(data("motion_params.json")),
  placements: data("levels/ironwood_placements.json"),
  sceneCatalog: parseSceneScripts(data("scene_scripts.json")),
  sidecars: Object.fromEntries(sidecarNames.map((name) => [name, acceptSidecar(asset(name))])),
  wardenParams: parseWardenParams(data("warden_params.json"), data("frame_data.json")),
  zones: (data("levels/ironwood_manifest.json") as { readonly zones: unknown }).zones,
};

/** `world.test.ts` compiles the raw nav graph; the collision lane prunes it. */
const flatDefinition = createWorldDefinition(data("world_assembly.json"), {
  ...sharedSources,
  navGraph: compileWalkGraph(data("levels/ironwood_nav.json") as Parameters<typeof compileWalkGraph>[0]),
});
const realDefinition = createWorldDefinition(data("world_assembly.json"), {
  ...sharedSources,
  navGraph: compileWalkGraph({ ...nav, edges: nav.edges.filter(({ conditional }) => conditional !== true) }),
});

const flatQueries: WorldQueries = {
  definition: flatDefinition,
  probeGround: ({ capsule }) => ({
    distance: flatDefinition.motionParams.capsule.skin,
    normal: { x: 0, y: 1, z: 0 },
    point: { x: capsule.start.x, y: 0, z: capsule.start.z },
    triangleIndex: 0,
  }),
  raycast: () => null,
  sweepCapsule: () => null,
};

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

describe.runIf(process.env.REGEN_WORLD_GOLDEN === "1")("world golden regeneration", () => {
  it("prints every pinned value", async () => {
    const durationTicks = 1_370;
    const prefix = playWorldReplay(flatQueries, {
      ...WORLD_GOLDEN_REPLAY,
      durationTicks,
      frames: WORLD_GOLDEN_REPLAY.frames.filter(({ tick }) => tick < durationTicks),
      checkpointTicks: [1, 1327, durationTicks],
    });
    const geometry = collisionGeometry();
    const collision = new MeshBvhCollisionWorld(new MeshBVH(geometry));
    const queries: WorldQueries = {
      definition: realDefinition,
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
      () => new Promise((resolve) => { setImmediate(resolve); }),
    );
    geometry.dispose();
    console.log("WORLD_GOLDENS " + JSON.stringify({
      "world.test.ts definition.fingerprint": flatDefinition.fingerprint,
      "WORLD_GOLDEN_EXPECTED.definitionFingerprint": realDefinition.fingerprint,
      "WORLD_GOLDEN_EXPECTED.inputHash": hashCanonical(WORLD_GOLDEN_REPLAY),
      "WORLD_BROWSER_GOLDEN_EXPECTED.inputHash": hashCanonical(WORLD_BROWSER_GOLDEN_REPLAY),
      "WORLD_GOLDEN_EXPECTED.stateHash": replay.stateHash,
      "worldReplay.test.ts checkpoints": replay.checkpoints.map(({ tick, stateHash }) => ({ tick, stateHash })),
      "worldReplay.test.ts summary": replay.summary,
      "world.test.ts prefix.stateHash": prefix.stateHash,
      "world.test.ts prefix checkpoints": prefix.checkpoints.map(({ tick, stateHash }) => ({ tick, stateHash })),
    }, null, 1));
  }, 900_000);
});
