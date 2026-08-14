import type {
  CompiledWalkGraph,
  WolfAiState,
  WolfAttackId,
  WolfRole,
} from "../ai";
import type { WolfAiParams } from "../ai/params";
import type { AttendParams, AttendState, AttendViewer } from "../attend";
import type {
  CombatData,
  CombatPresenterEvent,
  CombatSimulationState,
  SidecarData,
} from "../combat";
import type { InputAction, InputEdge } from "../input";
import type {
  CollisionQueries,
  MotionEvent,
  MotionParams,
  MotionState,
  Vec3,
} from "../motion";
import type { MetaEvent, MetaParams, MetaState } from "../meta";
import type { SceneCatalog, SceneEvent, SceneState } from "../scenes";

export const WORLD_STATE_VERSION = 1 as const;
export const WORLD_ASSEMBLY_SCHEMA = "tincture.world_assembly.v0" as const;
export const WORLD_REPLAY_FORMAT_VERSION = 1 as const;

export interface WorldActorDefinition {
  readonly id: string;
  readonly kind: "player" | "wolf";
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

export interface WorldActorAssetDefinition {
  readonly assetBase: string;
  readonly manifest: string;
  readonly neutralSidecar: string;
  readonly sidecars: Readonly<Record<string, string>>;
  readonly visualClips: Readonly<Record<string, string>>;
  readonly fallbacks: Readonly<Record<string, string>>;
}

export interface WorldDefinition {
  readonly version: 1;
  readonly fingerprint: string;
  readonly seed: number;
  readonly player: WorldActorDefinition;
  readonly actors: Readonly<Record<string, WorldActorDefinition>>;
  readonly packs: Readonly<Record<string, WorldPackDefinition>>;
  readonly hearths: Readonly<Record<string, WorldHearthDefinition>>;
  readonly respawnHearthId: string;
  readonly startupScene: string;
  readonly autoCompleteStartupScene: boolean;
  readonly hearthRadiusMeters: number;
  readonly aiMoveBindings: Readonly<Record<Exclude<WolfAttackId, "howl">, string>>;
  readonly actorAssets: Readonly<Record<"kalev" | "wolf", WorldActorAssetDefinition>>;
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
  readonly meta: MetaState;
  readonly attend: AttendState;
  readonly scenes: SceneState;
  readonly heldActions: readonly InputAction[];
  readonly engaged: boolean;
}

export interface WorldInputFrame {
  readonly edges: readonly InputEdge[];
  readonly moveX: number;
  readonly moveZ: number;
  readonly attendStick: { readonly x: number; readonly y: number };
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
  | { readonly type: "open-page-proximity"; readonly recovered: boolean }
  | { readonly type: "world-respawn"; readonly hearthId: string };

export interface WorldEvent {
  readonly sequence: number;
  readonly tick: number;
  readonly source: "motion" | "combat" | "ai" | "meta" | "scenes" | "world";
  readonly actorId: string | null;
  readonly payload: WorldEventPayload;
}

export interface WorldStep {
  readonly state: WorldState;
  readonly events: readonly WorldEvent[];
}

export interface WorldDebugActor {
  readonly id: string;
  readonly kind: "player" | "wolf";
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

export interface WorldDebugSnapshot {
  readonly tick: number;
  readonly stateHash: string;
  readonly actors: readonly WorldDebugActor[];
  readonly targetId: string | null;
  readonly tokenHolders: readonly { readonly packId: string; readonly wolfId: string | null }[];
  readonly tokenInvariant: boolean;
  readonly engaged: boolean;
  readonly meta: {
    readonly life: MetaState["life"];
    readonly doses: number;
    readonly carriedNames: number;
    readonly openPage: MetaState["openPage"];
    readonly lastHearthId: string | null;
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
