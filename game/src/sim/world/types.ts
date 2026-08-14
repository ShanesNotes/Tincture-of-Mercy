import type {
  CompiledWalkGraph,
  WolfAiState,
  WolfAttackId,
  WolfRole,
} from "../ai";
import type { WolfAiParams } from "../ai/params";
import type { AttendParams, AttendState, AttendViewer } from "../attend";
import type {
  WardenEvent,
  WardenFsmState,
  WardenParams,
  WardenPhase,
  WardenRingGeometry,
  WardenState,
} from "../boss";
import type {
  ActorClass,
  CombatData,
  CombatPresenterEvent,
  CombatSimulationState,
  SidecarData,
  SteadyClass,
} from "../combat";
import type { InputAction, InputEdge } from "../input";
import type {
  CollisionQueries,
  MotionEvent,
  MotionParams,
  MotionState,
  Vec3,
} from "../motion";
import type { ArenaPhase, MetaEvent, MetaParams, MetaState } from "../meta";
import type { SceneCatalog, SceneEvent, SceneState } from "../scenes";

export const WORLD_STATE_VERSION = 1 as const;
export const WORLD_ASSEMBLY_SCHEMA = "tincture.world_assembly.v0" as const;
export const WORLD_REPLAY_FORMAT_VERSION = 1 as const;

export type WorldActorKind = "player" | "wolf" | "warden";

export interface WorldActorDefinition {
  readonly id: string;
  readonly kind: WorldActorKind;
  readonly packId: string | null;
  readonly authoredRole: WolfRole | null;
  readonly spawnPlacementId: string;
  readonly spawnPosition: Vec3;
  readonly spawnFacing: number;
}

export interface WorldPackDefinition {
  readonly id: string;
  readonly actors: readonly WorldActorDefinition[];
  readonly home: Vec3;
}

export interface WorldHearthDefinition {
  readonly id: string;
  readonly placementId: string;
  readonly position: Vec3;
  readonly synthetic: boolean;
}

export type WorldAssetKey = "kalev" | "wolf" | "warden";

/** Axis-aligned zone box baked by s20. Lookup is XZ-only; y bands are cosmetic. */
export interface WorldZoneDefinition {
  readonly id: string;
  readonly min: Vec3;
  readonly max: Vec3;
  /** XZ footprint, precomputed so the smallest containing zone wins deterministically. */
  readonly area: number;
}

export interface WorldActorAssetDefinition {
  /**
   * Extra capsule radius on this actor's weapon sweep, in metres. It exists for
   * one reason: an actor wearing another actor's blocking rig inherits that
   * rig's reach. Zero for anyone whose own clips are authored.
   */
  readonly weaponRadiusMeters: number;
  readonly assetBase: string;
  readonly manifest: string;
  readonly neutralSidecar: string;
  readonly sidecars: Readonly<Record<string, string>>;
  readonly visualClips: Readonly<Record<string, string>>;
  readonly fallbacks: Readonly<Record<string, string>>;
}

/**
 * Composition-owned Warden binding. `sim/boss` stays headless: the world holds
 * its compiled params, the baked ring geometry, and the authored Pulse pool
 * that no law document supplies.
 */
export interface WorldWardenDefinition {
  readonly actorId: string;
  readonly params: WardenParams;
  readonly ring: WardenRingGeometry;
  readonly spawnPosition: Vec3;
  readonly spawnFacing: number;
  readonly maxPulse: number;
  readonly phaseActorClasses: Readonly<Record<WardenPhase, ActorClass>>;
  readonly phaseSteadyClasses: Readonly<Record<WardenPhase, SteadyClass>>;
  /** Lit by the aftermath; s20 omits it, so `world_assembly.json` synthesizes it. */
  readonly arenaHearthId: string;
  readonly ceremonyMoveId: string;
}

export interface WorldDefinition {
  readonly version: 1;
  readonly fingerprint: string;
  readonly seed: number;
  readonly player: WorldActorDefinition;
  readonly warden: WorldWardenDefinition | null;
  readonly actors: Readonly<Record<string, WorldActorDefinition>>;
  readonly packs: Readonly<Record<string, WorldPackDefinition>>;
  readonly hearths: Readonly<Record<string, WorldHearthDefinition>>;
  readonly respawnHearthId: string;
  readonly startupScene: string;
  readonly autoCompleteStartupScene: boolean;
  readonly hearthRadiusMeters: number;
  readonly aiMoveBindings: Readonly<Record<Exclude<WolfAttackId, "howl">, string>>;
  readonly actorAssets: Readonly<Record<WorldAssetKey, WorldActorAssetDefinition>>;
  /** Player zone lookup, baked from the level placement zones (HUD/music seam). */
  readonly zones: readonly WorldZoneDefinition[];
  readonly combatData: CombatData;
  readonly motionParams: MotionParams;
  readonly aiParams: WolfAiParams;
  readonly attendParams: AttendParams;
  readonly metaParams: MetaParams;
  readonly sceneCatalog: SceneCatalog;
  /** Full baked graph retained for diagnostics and non-pack consumers. */
  readonly navGraph: CompiledWalkGraph;
  /** Composition-owned leash-local views used by each pack's hot path. */
  readonly packNavGraphs: Readonly<Record<string, CompiledWalkGraph>>;
  readonly sidecars: Readonly<Record<string, SidecarData>>;
}

/** Static collision/LOS and immutable definition, injected into the exact three-argument step API. */
export interface WorldQueries extends CollisionQueries {
  readonly definition: WorldDefinition;
}

export interface WorldActorState {
  readonly id: string;
  readonly motion: MotionState;
  /** Prevents a clip whose root motion has ended from being re-hosted during recovery. */
  readonly hostedActionInstance: number | null;
  /** Authored hit knockback returned by combat, queued for collision-correct motion next tick. */
  readonly pendingCombatDisplacement: Vec3 | null;
}

export interface WorldState {
  readonly version: typeof WORLD_STATE_VERSION;
  readonly definitionFingerprint: string;
  readonly tick: number;
  readonly nextEventSequence: number;
  readonly actors: Readonly<Record<string, WorldActorState>>;
  readonly combat: CombatSimulationState;
  readonly aiPacks: Readonly<Record<string, WolfAiState>>;
  readonly warden: WardenState | null;
  readonly meta: MetaState;
  readonly attend: AttendState;
  readonly scenes: SceneState;
  readonly heldActions: readonly InputAction[];
  readonly engaged: boolean;
  /** Lit by the aftermath branch; the arena Hearth stays cold until then. */
  readonly arenaHearthLit: boolean;
  /**
   * True once the player has been outside the cabin. Anna's gravity is the
   * cabin you come back to, so it must not open on the prologue's own heels.
   */
  readonly leftStartZone: boolean;
  /**
   * The snare line roots on contact, once per approach. Without the edge the
   * root re-arms under a player who cannot move out of the band, and the ring
   * becomes a wall instead of a hazard.
   */
  readonly snareBandContact: boolean;
  readonly snareRootUntilTick: number;
}

export interface WorldInputFrame {
  readonly edges: readonly InputEdge[];
  readonly moveX: number;
  readonly moveZ: number;
  readonly attendStick: { readonly x: number; readonly y: number };
  /**
   * Turns the next started drink into an Ember dose. The vial and the Ember
   * share one authored clip (`flask_drink`), so they share one input edge and
   * differ only in what the commit spends.
   */
  readonly useEmber?: boolean;
  readonly viewer?: AttendViewer;
  /** Optional staged-scene seam used by deterministic scripts; ordinary interaction uses InputAction.interact. */
  readonly scene?: {
    readonly enterId?: string;
    readonly hearthId?: string;
    readonly verb?: string;
  };
}

export interface WorldAiEvent {
  readonly tick: number;
  readonly kind: string;
  readonly wolfId: string;
  readonly detail: string;
}

export type WorldEventPayload =
  | MotionEvent
  | CombatPresenterEvent
  | MetaEvent
  | SceneEvent
  | WorldAiEvent
  | WardenEvent
  | { readonly type: "open-page-proximity"; readonly recovered: boolean }
  | { readonly type: "world-respawn"; readonly hearthId: string }
  | { readonly type: "arena-hearth-lit"; readonly hearthId: string }
  /** The quiet, resolved as an area pulse: never a swing, never Pulse damage. */
  | {
      readonly type: "wither-pulse-applied";
      readonly targetId: string;
      readonly witherAmount: number;
      readonly radiusMeters: number;
    }
  | { readonly type: "snare-root-applied"; readonly targetId: string; readonly untilTick: number };

export interface WorldEvent {
  readonly sequence: number;
  readonly tick: number;
  readonly source: "motion" | "combat" | "ai" | "boss" | "meta" | "scenes" | "world";
  readonly actorId: string | null;
  readonly payload: WorldEventPayload;
}

export interface WorldStep {
  readonly state: WorldState;
  readonly events: readonly WorldEvent[];
}

export interface WorldDebugActor {
  readonly id: string;
  readonly kind: WorldActorKind;
  readonly packId: string | null;
  readonly active: boolean;
  readonly position: Vec3;
  readonly facing: number;
  readonly pulse: number;
  readonly breath: number;
  readonly actionId: string | null;
  readonly actionTick: number | null;
  readonly alive: boolean;
  readonly invulnerable: boolean;
  readonly hurtboxes: readonly { readonly start: Vec3; readonly end: Vec3; readonly radius: number }[];
  readonly hitboxes: readonly { readonly start: Vec3; readonly end: Vec3; readonly radius: number }[];
}

/** SIM-truth Warden projection. `present: false` on worlds assembled without him. */
export interface WorldDebugBoss {
  readonly present: boolean;
  readonly fsm: WardenFsmState | null;
  readonly phase: WardenPhase | null;
  readonly pulse: number;
  readonly maxPulse: number;
  readonly arena: ArenaPhase;
  readonly ceremonyActive: boolean;
  readonly defeated: boolean;
  readonly rootedUntilTick: number;
  readonly enteredArena: boolean;
}

export interface WorldDebugSnapshot {
  readonly tick: number;
  readonly stateHash: string;
  readonly actors: readonly WorldDebugActor[];
  readonly targetId: string | null;
  readonly tokenHolders: readonly { readonly packId: string; readonly wolfId: string | null }[];
  readonly tokenInvariant: boolean;
  readonly engaged: boolean;
  /** Baked zone id containing the player, or null outside every baked box. */
  readonly zoneId: string | null;
  readonly boss: WorldDebugBoss;
  readonly scenes: {
    readonly activeId: string | null;
    readonly completed: readonly string[];
    readonly sliceExit: boolean;
    readonly unwrittenTag: boolean;
  };
  readonly meta: {
    readonly life: MetaState["life"];
    readonly doses: number;
    readonly maxDoses: number;
    readonly carriedNames: number;
    readonly openPage: MetaState["openPage"];
    readonly lastHearthId: string | null;
    readonly numbnessStacks: number;
    readonly vigilRestore: number;
    readonly atHearth: boolean;
    readonly turn: number;
    readonly turnCap: number;
    readonly maxPulse: number;
    readonly maxBreath: number;
  };
  /** Hearth the player currently stands inside, and whether it is burning. */
  readonly hearth: {
    readonly nearbyId: string | null;
    readonly lit: boolean;
  };
}

export interface WorldReplayFrame {
  readonly tick: number;
  readonly input: WorldInputFrame;
}

export interface WorldReplayScript {
  readonly formatVersion: typeof WORLD_REPLAY_FORMAT_VERSION;
  readonly durationTicks: number;
  readonly frames: readonly WorldReplayFrame[];
  readonly checkpointTicks: readonly number[];
}

export interface WorldReplayCheckpoint {
  readonly tick: number;
  readonly stateHash: string;
  readonly playerPulse: number;
  readonly playerPosition: Vec3;
  readonly livingWolfIds: readonly string[];
  readonly wolves: readonly {
    readonly id: string;
    readonly position: Vec3;
    readonly pulse: number;
    readonly actionId: string | null;
  }[];
  readonly tokenInvariant: boolean;
  readonly moduleClocksAligned: boolean;
  readonly openPageNames: number;
  readonly targetId: string | null;
  readonly engaged: boolean;
}

export interface WorldReplayResult {
  readonly state: WorldState;
  readonly stateHash: string;
  readonly checkpoints: readonly WorldReplayCheckpoint[];
  readonly summary: WorldReplaySummary;
}

export interface WorldReplaySummary {
  readonly ticks: number;
  readonly wolfKilled: boolean;
  /** Authored amount of the first accepted player hit (golden lunge: 38). */
  readonly playerDamageTaken: number;
  /** Sum across the full death loop, including later accepted hits. */
  readonly totalPlayerDamageTaken: number;
  readonly firstPlayerDamage: number | null;
  readonly maxConcurrentAttackTokens: number;
  readonly playerDied: boolean;
  readonly openPageDropped: boolean;
  readonly respawnedAtHearth: boolean;
  readonly openPageRecovered: boolean;
  readonly wolvesRespawned: boolean;
  readonly flaskCommitted: boolean;
  readonly restedAfterPageRecovery: boolean;
}
