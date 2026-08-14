import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  type Material,
  type Mesh,
  type Object3D,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshBVH } from "three-mesh-bvh";

import assemblyDocument from "../../data/world_assembly.json";
import { acceptSidecar } from "../../sim/combat";
import { MeshBvhCollisionWorld } from "../collision";
import { auditRegisterMaterials } from "../register/materials";
import { ATLAS } from "../register/patterns";
import {
  CHARACTER_ASSET_URLS,
  LEVEL_ASSET_URLS,
  LEVEL_MANIFEST_URL,
  NAV_URL,
  PLACEMENTS_URL,
} from "./assetUrls";
import type {
  AssetDiagnostic,
  CharacterAssets,
  CharacterManifest,
  ClipSidecar,
  LevelManifest,
  LoadedIronwoodAssets,
  NavGraphDocument,
  Placement,
  PlacementCatalog,
  WorldCollisionQueries,
} from "./types";
import {
  batchStaticZone,
  stripToPooledRegister,
  type RegisterMaterialPool,
} from "./staticBatch";
import { collectAtomicStage } from "./staging";
import { createPlacementMarkers } from "./placements";
import { assertSha256, collisionSemanticSha256 } from "./verification";

interface AssemblyActor {
  readonly manifest: string;
  readonly visualClips: Readonly<Record<string, string>>;
  readonly fallbacks: Readonly<Record<string, string>>;
}

interface AssemblyConfig {
  readonly actors: {
    readonly kalev: AssemblyActor;
    readonly wolf: AssemblyActor;
  };
  readonly syntheticPlacements: readonly Placement[];
}

interface CollisionDocument {
  readonly schema: "tincture.collision.v0";
  readonly triCount: number;
  readonly triangles: readonly (readonly [number, number, number])[];
  readonly vertices: readonly (readonly [number, number, number])[];
}

export interface IronwoodAssetLoadOptions {
  readonly fetcher?: typeof fetch;
}

export class WorldAssetLoadError extends Error {
  public readonly stage: AssetDiagnostic["stage"];
  public readonly asset: string;

  public constructor(stage: AssetDiagnostic["stage"], asset: string, cause: unknown) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    super(`Ironwood ${stage} stage failed for ${asset}: ${detail}`, { cause });
    this.name = "WorldAssetLoadError";
    this.stage = stage;
    this.asset = asset;
  }
}

const assembly = assemblyDocument as unknown as AssemblyConfig;

const fetchBytes = async (
  fetcher: typeof fetch,
  url: string,
  stage: AssetDiagnostic["stage"],
): Promise<ArrayBuffer> => {
  try {
    const response = await fetcher(url);
    if (!response.ok) {
      throw new Error(`HTTP ${String(response.status)} ${response.statusText}`);
    }
    return await response.arrayBuffer();
  } catch (error) {
    throw new WorldAssetLoadError(stage, url, error);
  }
};

const fetchJson = async <T>(
  fetcher: typeof fetch,
  url: string,
  stage: AssetDiagnostic["stage"],
): Promise<T> => {
  const bytes = await fetchBytes(fetcher, url, stage);
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch (error) {
    throw new WorldAssetLoadError(stage, url, error);
  }
};

const requireUrl = (
  urls: Readonly<Record<string, string>>,
  file: string,
  stage: AssetDiagnostic["stage"],
): string => {
  const url = urls[file];
  if (url === undefined) {
    throw new WorldAssetLoadError(stage, file, new Error("asset is not registered in the bundle"));
  }
  return url;
};

const validateManifest = (value: LevelManifest): void => {
  if (value.schema !== "tincture.level.v0" || Object.keys(value.zones).length === 0) {
    throw new Error("expected a non-empty tincture.level.v0 manifest");
  }
};

const validatePlacements = (value: PlacementCatalog): void => {
  if (value.schema !== "tincture.placements.v0" || !Array.isArray(value.all)) {
    throw new Error("expected tincture.placements.v0 placements");
  }
};

const validateNav = (value: NavGraphDocument): void => {
  if (!Array.isArray(value.nodes) || !Array.isArray(value.edges) || !Array.isArray(value.offMeshLinks)) {
    throw new Error("nav graph requires nodes, edges and offMeshLinks arrays");
  }
};

const validateCollision = (value: CollisionDocument, expectedTriangles: number): void => {
  if (
    value.schema !== "tincture.collision.v0" ||
    value.triCount !== expectedTriangles ||
    value.triangles.length !== expectedTriangles
  ) {
    throw new Error(`collision triangle count does not match manifest (${String(expectedTriangles)})`);
  }
};

const parseGltf = async (bytes: ArrayBuffer, url: string) => {
  const loader = new GLTFLoader();
  const base = new URL(".", new URL(url, window.location.href)).href;
  return loader.parseAsync(bytes, base);
};

const zoneBinding = (zone: string) => {
  if (zone === "FOREST" || zone === "WOODLINE" || zone === "YARD") {
    return {
      family: "green",
      cell: ATLAS.NEEDLE_FLOOR,
      uvScale: 8,
      lineStrength: 0.32,
      shadeByPattern: 0.2,
      edges: [0.38],
    } as const;
  }
  if (zone === "ARENA") {
    return {
      family: "blue",
      cell: ATLAS.GRANITE,
      uvScale: 5,
      lineStrength: 0.36,
      shadeByPattern: 0.18,
      edges: [0.4],
    } as const;
  }
  return {
    family: "muted",
    cell: ATLAS.WOODGRAIN,
    uvScale: 6,
    lineStrength: 0.3,
    shadeByPattern: 0.2,
    edges: [0.42],
  } as const;
};

const characterBinding = (character: "kalev" | "wolf") => ({
  family: character === "kalev" ? "blue" : "muted",
  cell: character === "kalev" ? ATLAS.WOOL_WEAVE : ATLAS.PINE_BARK,
  uvScale: character === "kalev" ? 2 : 3,
  lineStrength: 0.4,
  shadeByPattern: 0.2,
  edges: [0.4],
} as const);

const disposeSubtree = (root: Object3D): void => {
  const disposedGeometries = new Set<BufferGeometry>();
  const disposedMaterials = new Set<Material>();
  root.traverse((child) => {
    const mesh = child as Mesh;
    if (mesh.isMesh !== true) return;
    if (!disposedGeometries.has(mesh.geometry)) {
      mesh.geometry.dispose();
      disposedGeometries.add(mesh.geometry);
    }
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials as Material[]) {
      if (disposedMaterials.has(material)) continue;
      material.dispose();
      disposedMaterials.add(material);
    }
  });
};

const disposeMaterialPool = (pool: RegisterMaterialPool): void => {
  for (const material of new Set(pool.values())) material.dispose();
  pool.clear();
};

const loadLevel = async (
  fetcher: typeof fetch,
  manifest: LevelManifest,
  materialPool: RegisterMaterialPool,
): Promise<{
  readonly root: Group;
  readonly collisionGeometry: BufferGeometry;
}> => {
  const root = new Group();
  root.name = "ironwood-graybox";
  const vertices: number[] = [];
  const indices: number[] = [];

  try {
    const zoneNames = Object.keys(manifest.zones).sort();
    const settled = await Promise.allSettled(
      zoneNames.map(async (zone) => {
        let stagedScene: Group | null = null;
        try {
          const entry = manifest.zones[zone];
          if (entry === undefined) throw new Error(`missing zone ${zone}`);

          const visualUrl = requireUrl(LEVEL_ASSET_URLS, entry.visualGlb, "level");
          const visualBytes = await fetchBytes(fetcher, visualUrl, "level");
          await assertSha256(visualBytes, entry.visualSha256, `${zone} visual GLB`);
          const gltf = await parseGltf(visualBytes, visualUrl);
          stagedScene = gltf.scene;
          gltf.scene.name = `zone.${zone.toLowerCase()}`;
          const material = stripToPooledRegister(gltf.scene, zoneBinding(zone), materialPool);
          batchStaticZone(gltf.scene, material);
          const materialViolations = auditRegisterMaterials(gltf.scene);
          if (materialViolations.length > 0) {
            throw new Error(`${zone} retained imported materials: ${materialViolations.join(", ")}`);
          }

          const collisionUrl = requireUrl(LEVEL_ASSET_URLS, entry.collision, "collision");
          const collision = await fetchJson<CollisionDocument>(fetcher, collisionUrl, "collision");
          validateCollision(collision, entry.triCount);
          const actualCollisionHash = await collisionSemanticSha256(collision);
          if (actualCollisionHash !== entry.sha256) {
            throw new Error(
              `${zone} collision semantic SHA-256 mismatch: expected ${entry.sha256}, received ${actualCollisionHash}`,
            );
          }
          return { zone, scene: gltf.scene, collision };
        } catch (error) {
          if (stagedScene !== null) disposeSubtree(stagedScene);
          throw error;
        }
      }),
    );
    const loaded = collectAtomicStage(settled, (item) => disposeSubtree(item.scene));

    for (const item of loaded) {
      root.add(item.scene);
      const offset = vertices.length / 3;
      for (const vertex of item.collision.vertices) vertices.push(...vertex);
      for (const triangle of item.collision.triangles) {
        indices.push(triangle[0] + offset, triangle[1] + offset, triangle[2] + offset);
      }
    }
  } catch (error) {
    disposeSubtree(root);
    if (error instanceof WorldAssetLoadError) throw error;
    throw new WorldAssetLoadError("level", "level zones", error);
  }

  const collisionGeometry = new BufferGeometry();
  collisionGeometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  collisionGeometry.setIndex(indices);
  return { root, collisionGeometry };
};

const loadCharacter = async (
  fetcher: typeof fetch,
  character: "kalev" | "wolf",
  config: AssemblyActor,
  diagnostics: AssetDiagnostic[],
  materialPool: RegisterMaterialPool,
): Promise<CharacterAssets> => {
  let stagedTemplate: Group | null = null;
  try {
    const manifestUrl = requireUrl(CHARACTER_ASSET_URLS, config.manifest, "character");
    const manifest = await fetchJson<CharacterManifest>(fetcher, manifestUrl, "character");
    if (!Array.isArray(manifest.sidecars) || manifest.sidecars.length === 0) {
      throw new Error("character manifest has no sidecars");
    }
    const glbUrl = requireUrl(CHARACTER_ASSET_URLS, manifest.glb, "character");
    const glbBytes = await fetchBytes(fetcher, glbUrl, "character");
    await assertSha256(glbBytes, manifest.glbHash, `${character} GLB`);
    const gltf = await parseGltf(glbBytes, glbUrl);
    stagedTemplate = gltf.scene;
    gltf.scene.name = `actor-template.${character}`;
    stripToPooledRegister(gltf.scene, characterBinding(character), materialPool);
    const materialViolations = auditRegisterMaterials(gltf.scene);
    if (materialViolations.length > 0) {
      throw new Error(`${character} retained imported materials: ${materialViolations.join(", ")}`);
    }

    const sidecars = new Map<string, ClipSidecar>();
    const sidecarsByFile = new Map<string, ClipSidecar>();
    for (const file of manifest.sidecars) {
      const url = requireUrl(CHARACTER_ASSET_URLS, file, "character");
      const sidecar = acceptSidecar(await fetchJson<unknown>(fetcher, url, "character"));
      if (
        sidecar.schema !== "tincture.sidecar.v0" ||
        sidecar.tickHz !== 60 ||
        sidecar.ticks <= 0 ||
        sidecar.glb !== manifest.glb ||
        sidecar.glbHash !== manifest.glbHash
      ) {
        throw new Error(`${file} is not bound to ${manifest.glb} at 60 Hz`);
      }
      sidecars.set(sidecar.clip, sidecar);
      sidecarsByFile.set(file, sidecar);
    }

    const animationNames = new Set(gltf.animations.map((clip) => clip.name));
    for (const [move, clip] of Object.entries(config.visualClips)) {
      if (!animationNames.has(clip)) {
        throw new Error(`${character} visual mapping ${move} references missing GLB clip ${clip}`);
      }
    }
    for (const [move, reason] of Object.entries(config.fallbacks)) {
      diagnostics.push({ stage: "animation", message: `${character}.${move}: ${reason}` });
    }

    return {
      character,
      template: gltf.scene,
      animations: gltf.animations,
      sidecars,
      sidecarsByFile,
      visualClips: config.visualClips,
      fallbacks: config.fallbacks,
    };
  } catch (error) {
    if (stagedTemplate !== null) disposeSubtree(stagedTemplate);
    if (error instanceof WorldAssetLoadError) throw error;
    throw new WorldAssetLoadError("character", character, error);
  }
};

const withSyntheticPlacements = (base: PlacementCatalog): PlacementCatalog => {
  const synthetic = assembly.syntheticPlacements.filter(
    (candidate) => !base.all.some((placement) => placement.id === candidate.id),
  );
  return {
    ...base,
    all: [...base.all, ...synthetic],
    hearths: [...base.hearths, ...synthetic.filter((placement) => placement.kind === "hearth")],
  };
};

export const loadIronwoodWorldAssets = async (
  options: IronwoodAssetLoadOptions = {},
): Promise<LoadedIronwoodAssets> => {
  const fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis);
  const diagnostics: AssetDiagnostic[] = [];
  const materialPool: RegisterMaterialPool = new Map();

  let manifest: LevelManifest;
  let placements: PlacementCatalog;
  let nav: NavGraphDocument;
  try {
    [manifest, placements, nav] = await Promise.all([
      fetchJson<LevelManifest>(fetcher, LEVEL_MANIFEST_URL, "manifest"),
      fetchJson<PlacementCatalog>(fetcher, PLACEMENTS_URL, "manifest"),
      fetchJson<NavGraphDocument>(fetcher, NAV_URL, "manifest"),
    ]);
    validateManifest(manifest);
    validatePlacements(placements);
    validateNav(nav);
    if (manifest.placements !== "ironwood.placements.json" || manifest.nav !== "ironwood_nav.json") {
      throw new Error("manifest placement/nav bindings do not match the bundled documents");
    }
  } catch (error) {
    if (error instanceof WorldAssetLoadError) throw error;
    throw new WorldAssetLoadError("manifest", LEVEL_MANIFEST_URL, error);
  }

  let level: Awaited<ReturnType<typeof loadLevel>>;
  try {
    level = await loadLevel(fetcher, manifest, materialPool);
  } catch (error) {
    disposeMaterialPool(materialPool);
    throw error;
  }

  try {
    const collisionBvh = new MeshBVH(level.collisionGeometry);
    const collisionWorld = new MeshBvhCollisionWorld(collisionBvh);
    const collisionQueries: WorldCollisionQueries = {
      raycast: (query) => collisionWorld.raycast(query),
      sweepCapsule: (query) => collisionWorld.sweepCapsule(query),
      // Ground snap is a vertical support query, so the baked level adapter can
      // answer it with the BVH's logarithmic raycast instead of the general
      // capsule sweep's iterative continuous-collision solver. Horizontal,
      // jump, root-motion and knockback movement still use swept capsules.
      probeGround: ({ capsule, maxDistance }) => {
        const hit = collisionWorld.raycast({
          origin: capsule.start,
          direction: { x: 0, y: -1, z: 0 },
          maxDistance: maxDistance + capsule.radius,
        });
        if (hit === null) return null;
        const distance = Math.max(0, hit.distance - capsule.radius);
        return distance > maxDistance
          ? null
          : { ...hit, distance };
      },
    };

    const characterStage = await Promise.allSettled([
      loadCharacter(fetcher, "kalev", assembly.actors.kalev, diagnostics, materialPool),
      loadCharacter(fetcher, "wolf", assembly.actors.wolf, diagnostics, materialPool),
    ]);
    const loadedCharacters = collectAtomicStage(characterStage, (character) =>
      disposeSubtree(character.template),
    );
    const characters = new Map(loadedCharacters.map((value) => [value.character, value] as const));
    const sidecarsByFile = new Map<string, ClipSidecar>();
    for (const character of loadedCharacters) {
      for (const [file, sidecar] of character.sidecarsByFile) sidecarsByFile.set(file, sidecar);
    }
    const finalPlacements = withSyntheticPlacements(placements);
    const placementById = new Map(finalPlacements.all.map((placement) => [placement.id, placement]));
    const pickupMarkers = createPlacementMarkers(finalPlacements.all);
    level.root.add(pickupMarkers.root);

    let disposed = false;
    return {
      levelRoot: level.root,
      collisionWorld,
      collisionQueries,
      placements: finalPlacements,
      placementById,
      nav,
      characters,
      sidecarsByFile,
      diagnostics,
      dispose: () => {
        if (disposed) return;
        disposed = true;
        disposeSubtree(level.root);
        level.collisionGeometry.dispose();
        for (const character of characters.values()) disposeSubtree(character.template);
        disposeMaterialPool(materialPool);
      },
    };
  } catch (error) {
    disposeSubtree(level.root);
    level.collisionGeometry.dispose();
    disposeMaterialPool(materialPool);
    throw error;
  }
};
