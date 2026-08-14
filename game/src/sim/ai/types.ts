export const WOLF_AI_STATE_VERSION = 1 as const;

export type WolfRole = "baiter" | "lunger" | "harrier";

export type AlertLevel = "unaware" | "suspicious" | "alert";

export type WolfMode = "idle" | "engage" | "flee" | "return" | "leash_reset" | "loiter";

export type WolfAttackId = "lunge" | "flank_bite" | "feint" | "howl";

export type SoundKind = "footstep" | "attack" | "howl";

export type CrowdFailure = "none" | "blocked_replan" | "slot_outer_queue" | "unreachable_loiter";

export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface AiRaycastQuery {
  readonly origin: Vec3;
  readonly direction: Vec3;
  readonly maxDistance: number;
}

export interface AiRaycastHit {
  readonly distance: number;
}

/** Injected plain-data LOS. Integration binds this to the view collision adapter. */
export interface LosQuery {
  raycast(query: AiRaycastQuery): AiRaycastHit | null;
}

export interface SoundEvent {
  readonly kind: SoundKind;
  readonly position: Vec3;
  readonly tick: number;
}

export interface CombatActionIntent {
  readonly actorId: string;
  readonly action: WolfAttackId;
  readonly tick: number;
}

/**
 * Minimal combat seam. s11 owns hit detection; this slice only starts actions
 * and asks when they have resolved.
 */
export interface CombatActions {
  startAction(intent: CombatActionIntent): boolean;
  isResolved(actorId: string, startedTick: number, tick: number): boolean;
}

/** Desired motion for s10. This slice does not solve locomotion. */
export interface LocomotionCommand {
  readonly actorId: string;
  readonly desiredVelocityX: number;
  readonly desiredVelocityZ: number;
  readonly waypoint: Vec3 | null;
  readonly facingYaw: number;
}

export interface WolfActionState {
  readonly id: WolfAttackId;
  readonly startedTick: number;
}

export interface WolfActorState {
  readonly id: string;
  readonly role: WolfRole;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly yaw: number;
  readonly pulse: number;
  readonly maxPulse: number;
  readonly alert: AlertLevel;
  readonly alertTimer: number;
  readonly confirmTimer: number;
  readonly lastKnownX: number;
  readonly lastKnownY: number;
  readonly lastKnownZ: number;
  readonly hasToken: boolean;
  readonly lastAttackTick: number | null;
  readonly action: WolfActionState | null;
  readonly mode: WolfMode;
  readonly fleeReturnTick: number | null;
  readonly path: readonly string[];
  readonly pathIndex: number;
  readonly assignedSlot: number | null;
  readonly crowdFailure: CrowdFailure;
  readonly circleSign: 1 | -1;
  readonly feintReadyTick: number;
  readonly alive: boolean;
}

export interface PackState {
  readonly homeX: number;
  readonly homeY: number;
  readonly homeZ: number;
  readonly aggressionTier: number;
  readonly tokenHolderId: string | null;
  readonly tokenResolvedTick: number | null;
  readonly tokenReleaseTick: number | null;
  readonly howlCount: number;
}

export type AiEventKind =
  | "token_grant"
  | "token_release"
  | "role_action"
  | "role_assign"
  | "howl"
  | "flee"
  | "return"
  | "leash_reset"
  | "loiter"
  | "replan";

export interface AiEvent {
  readonly tick: number;
  readonly kind: AiEventKind;
  readonly wolfId: string;
  readonly detail: string;
}

export interface WolfAiState {
  readonly version: typeof WOLF_AI_STATE_VERSION;
  readonly tick: number;
  readonly pack: PackState;
  readonly wolves: readonly WolfActorState[];
  readonly events: readonly AiEvent[];
}

export interface WolfSpawn {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly yaw?: number;
  readonly pulse?: number;
  readonly maxPulse?: number;
}

export interface WolfAiStepInput {
  readonly target: Vec3 & { readonly yaw: number };
  readonly sounds?: readonly SoundEvent[];
  readonly blockedEdges?: readonly string[];
  readonly howlRequested?: boolean;
  readonly pulseOverrides?: Readonly<Record<string, number>>;
  readonly deadIds?: readonly string[];
  /** Integration-authored roles; omitted consumers retain lexical pack assignment. */
  readonly roleOverrides?: Readonly<Record<string, WolfRole>>;
}

export interface WolfAiStepResult {
  readonly state: WolfAiState;
  readonly locomotion: readonly LocomotionCommand[];
}

export interface WalkNode {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface WalkEdge {
  readonly from: string;
  readonly to: string;
  readonly bidirectional?: boolean;
}

export interface OffMeshLink {
  readonly from: string;
  readonly to: string;
  readonly kind: "drop";
}

export interface WalkGraphData {
  readonly nodes: readonly WalkNode[];
  readonly edges: readonly WalkEdge[];
  readonly offMeshLinks: readonly OffMeshLink[];
}

export interface WalkNeighbor {
  readonly id: string;
  readonly cost: number;
  readonly drop: boolean;
}

export interface CompiledWalkGraph {
  readonly nodes: ReadonlyMap<string, WalkNode>;
  readonly adj: ReadonlyMap<string, readonly WalkNeighbor[]>;
}
