import type { WolfAttackId, WolfRole } from "../ai";
import type { WolfAiParams } from "../ai/params";
import type { AttendParams } from "../attend";
import { parseSnareRing, type WardenParams, type WardenPhase } from "../boss";
import {
  hashCanonical,
  type ActorClass,
  type CombatData,
  type SidecarData,
  type SteadyClass,
} from "../combat";
import type { MotionParams, Vec3 } from "../motion";
import { DEFAULT_META_PARAMS, type MetaParams } from "../meta";
import type { SceneCatalog } from "../scenes";
import type { CompiledWalkGraph } from "../ai";
import {
  WORLD_ASSEMBLY_SCHEMA,
  type WorldActorAssetDefinition,
  type WorldActorDefinition,
  type WorldDefinition,
  type WorldHearthDefinition,
  type WorldPackDefinition,
  type WorldWardenDefinition,
  type WorldZoneDefinition,
} from "./types";

type RecordValue = Record<string, unknown>;

const WARDEN_ACTOR_CLASSES = ["warden_p1", "warden_p2"] as const satisfies readonly ActorClass[];
const WARDEN_STEADY_CLASSES = ["warden_p1", "warden_p2"] as const satisfies readonly SteadyClass[];

export interface WorldDefinitionSources {
  readonly combatData: CombatData;
  readonly motionParams: MotionParams;
  readonly aiParams: WolfAiParams;
  readonly attendParams: AttendParams;
  readonly metaParams?: MetaParams;
  readonly sceneCatalog: SceneCatalog;
  readonly navGraph: CompiledWalkGraph;
  readonly placements: unknown;
  readonly sidecars: Readonly<Record<string, SidecarData>>;
  /** Compiled `warden_params.json`. Omit to assemble a world without the boss. */
  readonly wardenParams?: WardenParams;
  /** `manifest.zones` from the s20 level bake; omit for worlds without zones. */
  readonly zones?: unknown;
}

interface Placement {
  readonly id: string;
  readonly kind: string;
  readonly position: Vec3;
  readonly yaw: number;
  readonly role: WolfRole | null;
  readonly pack: string | null;
  readonly key: string | null;
  readonly synthetic: boolean;
}

const fail = (path: string, message: string): never => {
  throw new TypeError(`world_assembly ${path}: ${message}`);
};

const record = (value: unknown, path: string): RecordValue => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return fail(path, "expected an object");
  }
  return value as RecordValue;
};

const string = (source: RecordValue, key: string, path: string): string => {
  const value = source[key];
  return typeof value === "string" && value.length > 0
    ? value
    : fail(`${path}.${key}`, "expected a non-empty string");
};

const bool = (source: RecordValue, key: string, path: string): boolean => {
  const value = source[key];
  return typeof value === "boolean"
    ? value
    : fail(`${path}.${key}`, "expected a boolean");
};

const number = (source: RecordValue, key: string, path: string, minimum = 0): number => {
  const value = source[key];
  return typeof value === "number" && Number.isFinite(value) && value >= minimum
    ? value
    : fail(`${path}.${key}`, `expected a finite number >= ${String(minimum)}`);
};

const strings = (value: unknown, path: string): readonly string[] => {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string" || entry.length === 0)) {
    return fail(path, "expected an array of non-empty strings");
  }
  return [...value].sort();
};

const vec3 = (value: unknown, path: string): Vec3 => {
  if (
    !Array.isArray(value) ||
    value.length !== 3 ||
    value.some((entry) => typeof entry !== "number" || !Number.isFinite(entry))
  ) {
    return fail(path, "expected [x,y,z] finite numbers");
  }
  const [x, y, z] = value as [number, number, number];
  return { x, y, z };
};

const stringMap = (value: unknown, path: string): Readonly<Record<string, string>> => {
  const source = record(value, path);
  const result: Record<string, string> = {};
  for (const key of Object.keys(source).sort()) {
    result[key] = string(source, key, path);
  }
  return Object.freeze(result);
};

const placement = (value: unknown, path: string, synthetic: boolean): Placement => {
  const source = record(value, path);
  const id = string(source, "id", path);
  const kind = string(source, "kind", path);
  const rawRole = source.role;
  const role = kind !== "spawn_wolf" || rawRole === undefined
    ? null
    : rawRole === "baiter" || rawRole === "lunger" || rawRole === "harrier"
      ? rawRole
      : fail(`${path}.role`, "expected a wolf role");
  return {
    id,
    kind,
    position: vec3(source.position, `${path}.position`),
    yaw: source.yaw === undefined ? 0 : number(source, "yaw", path, Number.NEGATIVE_INFINITY),
    role,
    pack: source.pack === undefined ? null : string(source, "pack", path),
    key: source.key === undefined ? null : string(source, "key", path),
    synthetic,
  };
};

const parsePlacements = (
  raw: unknown,
  synthetic: unknown,
): ReadonlyMap<string, Placement> => {
  const source = record(raw, "placements");
  if (!Array.isArray(source.all)) {
    return fail("placements.all", "expected an array");
  }
  if (!Array.isArray(synthetic)) {
    return fail("$.syntheticPlacements", "expected an array");
  }
  const parsed = [
    ...source.all.map((entry, index) => placement(entry, `placements.all[${String(index)}]`, false)),
    ...synthetic.map((entry, index) => placement(entry, `$.syntheticPlacements[${String(index)}]`, true)),
  ];
  const result = new Map<string, Placement>();
  for (const item of parsed.sort((left, right) => left.id.localeCompare(right.id))) {
    if (result.has(item.id)) {
      return fail("placements", `duplicate id ${item.id}`);
    }
    result.set(item.id, item);
  }
  return result;
};

const actorAsset = (
  value: unknown,
  path: string,
  sidecars: Readonly<Record<string, SidecarData>>,
): WorldActorAssetDefinition => {
  const source = record(value, path);
  const result: WorldActorAssetDefinition = {
    assetBase: string(source, "assetBase", path),
    manifest: string(source, "manifest", path),
    neutralSidecar: string(source, "neutralSidecar", path),
    sidecars: stringMap(source.sidecars, `${path}.sidecars`),
    visualClips: stringMap(source.visualClips, `${path}.visualClips`),
    fallbacks: stringMap(source.fallbacks, `${path}.fallbacks`),
  };
  for (const filename of [result.neutralSidecar, ...Object.values(result.sidecars)]) {
    if (sidecars[filename] === undefined) {
      return fail(path, `sidecar ${filename} was not supplied`);
    }
  }
  return Object.freeze(result);
};

const parseZones = (raw: unknown): readonly WorldZoneDefinition[] => {
  if (raw === undefined) return Object.freeze([]);
  const source = record(raw, "$.zones");
  return Object.freeze(
    Object.keys(source)
      .sort()
      .map((id) => {
        const box = record(source[id], `$.zones.${id}`);
        const bounds = box.bounds === undefined ? box : record(box.bounds, `$.zones.${id}.bounds`);
        const min = vec3(bounds.min, `$.zones.${id}.min`);
        const max = vec3(bounds.max, `$.zones.${id}.max`);
        if (max.x <= min.x || max.z <= min.z) {
          return fail(`$.zones.${id}`, "must bound a positive XZ footprint");
        }
        return Object.freeze({ id, min, max, area: (max.x - min.x) * (max.z - min.z) });
      }),
  );
};

/**
 * Baked zone boxes overlap at their seams (ROAD/ARENA, ARENA/ROAD_CODA). The
 * smallest containing footprint wins, with the id as the tie-break, so the
 * lookup is total and order-independent.
 */
export const zoneAt = (
  zones: readonly WorldZoneDefinition[],
  position: Vec3,
): string | null => {
  let best: WorldZoneDefinition | null = null;
  for (const zone of zones) {
    if (
      position.x < zone.min.x ||
      position.x > zone.max.x ||
      position.z < zone.min.z ||
      position.z > zone.max.z
    ) {
      continue;
    }
    if (best === null || zone.area < best.area || (zone.area === best.area && zone.id < best.id)) {
      best = zone;
    }
  }
  return best?.id ?? null;
};

const wardenDefinition = (
  raw: unknown,
  params: WardenParams,
  placements: ReadonlyMap<string, Placement>,
  rawPlacements: unknown,
  hearths: Readonly<Record<string, WorldHearthDefinition>>,
  combatData: CombatData,
): WorldWardenDefinition => {
  const path = "$.warden";
  const source = record(raw, path);
  const spawnPlacementId = string(source, "spawnPlacementId", path);
  const spawn = placements.get(spawnPlacementId);
  if (spawn?.kind !== "spawn_warden") {
    return fail(`${path}.spawnPlacementId`, "must reference a spawn_warden placement");
  }
  const arenaHearthId = string(source, "arenaHearthId", path);
  if (hearths[arenaHearthId] === undefined) {
    return fail(`${path}.arenaHearthId`, "must reference a Hearth");
  }
  const ceremonyMoveId = params.ceremony.moveId;
  if (combatData.frameData.moves[ceremonyMoveId] === undefined) {
    return fail(`${path}.ceremony`, `unknown combat move ${ceremonyMoveId}`);
  }
  const classes = record(source.phaseActorClasses, `${path}.phaseActorClasses`);
  const steady = record(source.phaseSteadyClasses, `${path}.phaseSteadyClasses`);
  // The frame-data table declares exactly two Warden classes; the assembly may
  // only name those, so the narrowing below is checked rather than asserted.
  const wardenClass = <T extends string>(
    value: string,
    allowed: readonly T[],
    at: string,
  ): T => allowed.includes(value as T) ? (value as T) : fail(at, `must be one of ${allowed.join(", ")}`);
  const phaseActorClasses: Record<WardenPhase, ActorClass> = {
    p1: wardenClass(string(classes, "p1", `${path}.phaseActorClasses`), WARDEN_ACTOR_CLASSES, `${path}.phaseActorClasses.p1`),
    p2: wardenClass(string(classes, "p2", `${path}.phaseActorClasses`), WARDEN_ACTOR_CLASSES, `${path}.phaseActorClasses.p2`),
  };
  const phaseSteadyClasses: Record<WardenPhase, SteadyClass> = {
    p1: wardenClass(string(steady, "p1", `${path}.phaseSteadyClasses`), WARDEN_STEADY_CLASSES, `${path}.phaseSteadyClasses.p1`),
    p2: wardenClass(string(steady, "p2", `${path}.phaseSteadyClasses`), WARDEN_STEADY_CLASSES, `${path}.phaseSteadyClasses.p2`),
  };
  for (const phase of ["p1", "p2"] as const) {
    if (params.phases[phase].actorClass !== phaseActorClasses[phase]) {
      return fail(
        `${path}.phaseActorClasses.${phase}`,
        `must match warden_params ${params.phases[phase].actorClass}`,
      );
    }
    if (params.phases[phase].steadyClass !== phaseSteadyClasses[phase]) {
      return fail(
        `${path}.phaseSteadyClasses.${phase}`,
        `must match warden_params ${params.phases[phase].steadyClass}`,
      );
    }
  }
  return Object.freeze({
    actorId: string(source, "actorId", path),
    params,
    ring: parseSnareRing(rawPlacements, params),
    spawnPosition: spawn.position,
    spawnFacing: spawn.yaw,
    maxPulse: number(source, "maxPulse", path, Number.MIN_VALUE),
    phaseActorClasses: Object.freeze(phaseActorClasses),
    phaseSteadyClasses: Object.freeze(phaseSteadyClasses),
    arenaHearthId,
    ceremonyMoveId,
  });
};

const wolfActor = (placement: Placement, packId: string): WorldActorDefinition => ({
  id: placement.id,
  kind: "wolf",
  packId,
  authoredRole: placement.role,
  spawnPlacementId: placement.id,
  spawnPosition: placement.position,
  spawnFacing: placement.yaw,
});

const packHome = (actors: readonly WorldActorDefinition[]): Vec3 => {
  const divisor = Math.max(1, actors.length);
  return actors.reduce(
    (sum, actor) => ({
      x: sum.x + actor.spawnPosition.x / divisor,
      y: sum.y + actor.spawnPosition.y / divisor,
      z: sum.z + actor.spawnPosition.z / divisor,
    }),
    { x: 0, y: 0, z: 0 },
  );
};

const pruneNavGraph = (
  graph: CompiledWalkGraph,
  home: Vec3,
  radius: number,
): CompiledWalkGraph => {
  const nodes = new Map(
    [...graph.nodes.entries()]
      .filter(([, node]) => Math.hypot(node.x - home.x, node.z - home.z) <= radius)
      .sort(([left], [right]) => left.localeCompare(right)),
  );
  const adj = new Map(
    [...nodes.keys()].map((nodeId) => [
      nodeId,
      Object.freeze((graph.adj.get(nodeId) ?? []).filter((neighbor) => nodes.has(neighbor.id))),
    ] as const),
  );
  if (nodes.size === 0) {
    throw new Error("world_assembly nav graph has no nodes inside a pack leash");
  }
  return Object.freeze({ nodes, adj });
};

/** Maps are runtime accelerators; fingerprints use a stable JSON-safe projection. */
const canonicalWalkGraph = (graph: CompiledWalkGraph): unknown => ({
  nodes: [...graph.nodes.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([id, node]) => ({ id, x: node.x, y: node.y, z: node.z })),
  adjacency: [...graph.adj.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([id, neighbors]) => ({
      id,
      neighbors: [...neighbors]
        .sort((left, right) =>
          left.id.localeCompare(right.id) ||
          left.cost - right.cost ||
          Number(left.drop) - Number(right.drop),
        )
        .map((neighbor) => ({ id: neighbor.id, cost: neighbor.cost, drop: neighbor.drop })),
    })),
});

const withoutUndefined = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(withoutUndefined);
  if (typeof value === "object" && value !== null && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, withoutUndefined(entry)]),
    );
  }
  return value;
};

export const createWorldDefinition = (
  raw: unknown,
  sources: WorldDefinitionSources,
): WorldDefinition => {
  const source = record(raw, "$");
  if (source.schema !== WORLD_ASSEMBLY_SCHEMA) {
    return fail("$.schema", `expected ${WORLD_ASSEMBLY_SCHEMA}`);
  }
  const seed = number(source, "seed", "$", 0);
  if (!Number.isSafeInteger(seed)) {
    return fail("$.seed", "expected a safe integer");
  }
  const entry = record(source.entry, "$.entry");
  const playerId = string(entry, "playerId", "$.entry");
  const playerPlacementId = string(entry, "spawnPlacementId", "$.entry");
  const placements = parsePlacements(sources.placements, source.syntheticPlacements);
  const playerPlacement = placements.get(playerPlacementId);
  if (playerPlacement?.kind !== "spawn_player") {
    return fail("$.entry.spawnPlacementId", "must reference a spawn_player placement");
  }
  const player: WorldActorDefinition = Object.freeze({
    id: playerId,
    kind: "player",
    packId: null,
    authoredRole: null,
    spawnPlacementId: playerPlacementId,
    spawnPosition: playerPlacement.position,
    spawnFacing: playerPlacement.yaw,
  });

  const rawPacks = record(source.packs, "$.packs");
  const packs: Record<string, WorldPackDefinition> = {};
  const actors: Record<string, WorldActorDefinition> = { [player.id]: player };
  for (const packId of Object.keys(rawPacks).sort()) {
    const placementIds = strings(rawPacks[packId], `$.packs.${packId}`);
    const packActors = placementIds.map((placementId) => {
      const placed = placements.get(placementId);
      if (placed?.kind !== "spawn_wolf" || placed.pack !== packId) {
        return fail(`$.packs.${packId}`, `${placementId} must reference a wolf in this pack`);
      }
      const actor = Object.freeze(wolfActor(placed, packId));
      if (actors[actor.id] !== undefined) {
        return fail(`$.packs.${packId}`, `duplicate actor id ${actor.id}`);
      }
      actors[actor.id] = actor;
      return actor;
    });
    if (packActors.length === 0) {
      return fail(`$.packs.${packId}`, "pack must not be empty");
    }
    packs[packId] = Object.freeze({ id: packId, actors: Object.freeze(packActors), home: packHome(packActors) });
  }

  const hearths: Record<string, WorldHearthDefinition> = {};
  for (const placed of [...placements.values()].filter((item) => item.kind === "hearth")) {
    const id = placed.key ?? placed.id.replace(/^hearth\./u, "");
    hearths[id] = Object.freeze({
      id,
      placementId: placed.id,
      position: placed.position,
      synthetic: placed.synthetic,
    });
  }
  const respawnHearthId = string(entry, "respawnHearthId", "$.entry");
  if (hearths[respawnHearthId] === undefined) {
    return fail("$.entry.respawnHearthId", "must reference a Hearth");
  }

  const rawBindings = record(source.aiMoveBindings, "$.aiMoveBindings");
  const aiMoveBindings = {
    lunge: string(rawBindings, "lunge", "$.aiMoveBindings"),
    flank_bite: string(rawBindings, "flank_bite", "$.aiMoveBindings"),
    feint: string(rawBindings, "feint", "$.aiMoveBindings"),
  } satisfies Record<Exclude<WolfAttackId, "howl">, string>;
  for (const moveId of Object.values(aiMoveBindings)) {
    if (sources.combatData.frameData.moves[moveId] === undefined) {
      return fail("$.aiMoveBindings", `unknown combat move ${moveId}`);
    }
  }
  const rawActors = record(source.actors, "$.actors");
  const actorAssets = {
    kalev: actorAsset(rawActors.kalev, "$.actors.kalev", sources.sidecars),
    wolf: actorAsset(rawActors.wolf, "$.actors.wolf", sources.sidecars),
    warden: actorAsset(rawActors.warden, "$.actors.warden", sources.sidecars),
  } as const;
  const zones = parseZones(sources.zones);

  // The Warden is a world actor like any other: s10 owns his position, s11 owns
  // his Pulse and Steady. `sim/boss` only decides what he does next.
  const warden = sources.wardenParams === undefined
    ? null
    : wardenDefinition(
        source.warden,
        sources.wardenParams,
        placements,
        sources.placements,
        hearths,
        sources.combatData,
      );
  if (warden !== null) {
    if (actors[warden.actorId] !== undefined) {
      return fail("$.warden.actorId", `duplicate actor id ${warden.actorId}`);
    }
    actors[warden.actorId] = Object.freeze({
      id: warden.actorId,
      kind: "warden",
      packId: null,
      authoredRole: null,
      spawnPlacementId: string(record(source.warden, "$.warden"), "spawnPlacementId", "$.warden"),
      spawnPosition: warden.spawnPosition,
      spawnFacing: warden.spawnFacing,
    });
  }
  const interaction = record(source.interaction, "$.interaction");
  const packNavRadius = sources.aiParams.leash.radiusM + sources.aiParams.nav.slotOuterRadiusM;
  const packNavGraphs = Object.freeze(Object.fromEntries(
    Object.values(packs)
      .sort((left, right) => left.id.localeCompare(right.id))
      .map((pack) => [pack.id, pruneNavGraph(sources.navGraph, pack.home, packNavRadius)]),
  ));

  const fingerprint = hashCanonical({
    raw,
    combat: sources.combatData.fingerprint,
    motionParams: sources.motionParams,
    aiParams: sources.aiParams,
    attendParams: sources.attendParams,
    metaParams: sources.metaParams ?? DEFAULT_META_PARAMS,
    sceneCatalog: withoutUndefined(sources.sceneCatalog),
    wardenParams: sources.wardenParams === undefined
      ? null
      : withoutUndefined(sources.wardenParams),
    wardenRing: warden === null ? null : warden.ring,
    zones,
    placements: {
      actors: Object.values(actors)
        .sort((left, right) => left.id.localeCompare(right.id)),
      packs: Object.values(packs)
        .sort((left, right) => left.id.localeCompare(right.id)),
      hearths: Object.values(hearths)
        .sort((left, right) => left.id.localeCompare(right.id)),
    },
    navGraph: canonicalWalkGraph(sources.navGraph),
    sidecars: Object.fromEntries(
      Object.entries(sources.sidecars)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([name, sidecar]) => [name, withoutUndefined(sidecar)]),
    ),
  });

  return Object.freeze({
    version: 1,
    fingerprint,
    seed,
    player,
    warden,
    actors: Object.freeze(Object.fromEntries(Object.entries(actors).sort(([left], [right]) => left.localeCompare(right)))),
    packs: Object.freeze(packs),
    hearths: Object.freeze(Object.fromEntries(Object.entries(hearths).sort(([left], [right]) => left.localeCompare(right)))),
    respawnHearthId,
    startupScene: string(entry, "startupScene", "$.entry"),
    autoCompleteStartupScene: bool(entry, "autoCompleteStartupScene", "$.entry"),
    hearthRadiusMeters: number(interaction, "hearthRadiusMeters", "$.interaction", Number.MIN_VALUE),
    aiMoveBindings: Object.freeze(aiMoveBindings),
    actorAssets: Object.freeze(actorAssets),
    zones,
    combatData: sources.combatData,
    motionParams: sources.motionParams,
    aiParams: sources.aiParams,
    attendParams: sources.attendParams,
    metaParams: sources.metaParams ?? DEFAULT_META_PARAMS,
    sceneCatalog: sources.sceneCatalog,
    navGraph: sources.navGraph,
    packNavGraphs,
    sidecars: Object.freeze({ ...sources.sidecars }),
  });
};
