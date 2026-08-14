/**
 * s22 — the Warden of the Ironwood, as a headless deterministic sim module.
 *
 * The module owns its own DTO (W1-SHARED rule 3) and never touches
 * `src/sim/state.ts`. It is dependency-zero at runtime: s11 combat and s25
 * scenes are consumed through the structural ports declared below, exactly as
 * s14 consumed combat through `sim/ai/types.ts#CombatActions`. Integration (and
 * every test in this folder) binds those ports to the real modules.
 *
 * No display name for the Warden appears anywhere in this module. Aftermath
 * text travels as text-bible key references only — ENCOUNTERS "no title card".
 */

export const WARDEN_STATE_VERSION = 1 as const;

export type WardenPhase = "p1" | "p2";

/** The boss state machine (contract deliverable 1). */
export type WardenFsmState =
  | "approach"
  | "neutral"
  | "move_selection"
  | "committed_move"
  | "recovery"
  | "phase_transition"
  | "ceremony"
  | "defeated";

export type WardenStance = "closed" | "stepped_back";

export type WardenTellClass = "opener" | "heavy" | "close_poke" | "bait" | "stillness";

export interface WardenClipWindow {
  readonly startTick: number;
  readonly endTickExclusive: number;
}

/** Frame-data slice for one Warden move, compiled from `src/data/frame_data.json`. */
export interface WardenClip {
  readonly moveId: string;
  readonly actorClass: string;
  readonly startupTicks: number;
  readonly activeTicks: number;
  readonly recoveryTicks: number;
  readonly totalTicks: number;
  readonly activeWindows: readonly WardenClipWindow[];
  /** Ticks the weapon can actually connect inside each active window. */
  readonly contactWindows: readonly WardenClipWindow[];
  readonly trackingUntilTick: number | null;
  readonly trackingWindows: readonly WardenClipWindow[];
  readonly turnRateRadiansPerTick: number;
  readonly poiseDamage: number;
  readonly pulseDamage: number;
  readonly witherBuildup: number;
  readonly damageType: string;
  readonly hitstopClass: string;
  /** Ticks of readable wind-up before the first contact (GATES F3). */
  readonly tellTicks: number;
}

export interface WardenMoveParams {
  readonly moveId: string;
  readonly tellClass: WardenTellClass;
  readonly tableSegments: readonly number[];
  readonly tablePunish: string;
  readonly punishLights: number;
  readonly contactTicksPerWindow: number | null;
  readonly weight: number;
  readonly cooldownTicks: number;
  readonly minRangeMeters: number;
  readonly maxRangeMeters: number;
  readonly requiresStance: WardenStance | null;
  readonly requiresRingHug: boolean;
  readonly clip: WardenClip;
}

export interface WardenPhaseParams {
  readonly actorClass: string;
  readonly steadyClass: string;
  readonly witherPerHit: number;
  readonly moves: readonly WardenMoveParams[];
}

export interface WardenCeremonyParams {
  readonly pulsePercent: number;
  readonly holdTicks: number;
  readonly invulnerable: boolean;
  readonly dealsDamage: boolean;
  readonly moveId: string;
  readonly cameraAnchorId: string;
  readonly lanternHangAnchorId: string;
}

export interface WardenRingParams {
  readonly sourcePlacementKey: string;
  readonly zone: string;
  readonly rootTicks: number;
  readonly chimeOnContact: boolean;
  readonly contactBandMeters: number;
  readonly hugBandMeters: number;
  readonly radiusToleranceMeters: number;
  readonly wardenPassesThrough: boolean;
  readonly chargeEndsAtRing: boolean;
}

export interface WardenQuietParams {
  readonly moveId: string;
  readonly witherAmount: number;
  readonly radiusMeters: number;
  readonly pulseDamage: number;
  readonly stillnessTellTicks: number;
}

export interface WardenSelectionParams {
  readonly sameMoveMaxConsecutive: number;
  readonly engageRangeMeters: number;
  readonly preferredRangeMeters: number;
  readonly stepBackRangeMeters: number;
  readonly neutralCooldownTicks: number;
  readonly cooldownScoreCapTicks: number;
  readonly weightScoreScale: number;
}

export interface WardenMotionParams {
  readonly approachMetersPerTick: number;
  readonly stepBackMetersPerTick: number;
  readonly chargeMetersPerTick: number;
  readonly leashReturnMetersPerTick: number;
}

export interface WardenGateShortfall {
  readonly moveId: string;
  readonly gate: string;
  readonly tellTicks: number;
  readonly requiredTicks: number;
  readonly note: string;
}

export interface WardenGateParams {
  readonly openerMinStartupTicks: number;
  readonly heavyTellMinStartupTicks: number;
  readonly stillnessTellMinTicks: number;
  readonly minPunishableRecoveryTicks: number;
  readonly dodgeToleranceTicks: number;
  readonly knownShortfalls: readonly WardenGateShortfall[];
}

export interface WardenAftermathParams {
  readonly tagItemId: string;
  readonly tagTextKeys: readonly string[];
  readonly titleCard: false;
}

export interface WardenParams {
  readonly version: 1;
  readonly tickHz: number;
  readonly ceremony: WardenCeremonyParams;
  readonly ring: WardenRingParams;
  readonly leash: { readonly mode: "arena_bounds"; readonly marginMeters: number };
  readonly quiet: WardenQuietParams;
  readonly selection: WardenSelectionParams;
  readonly motion: WardenMotionParams;
  readonly gates: WardenGateParams;
  readonly aftermath: WardenAftermathParams;
  readonly phases: Readonly<Record<WardenPhase, WardenPhaseParams>>;
}

/** Snare-line ring geometry, read from `ironwood_placements.json` ARENA markers. */
export interface WardenRingGeometry {
  readonly centerX: number;
  readonly centerZ: number;
  readonly radiusMeters: number;
  readonly postCount: number;
}

export interface WardenActionState {
  readonly moveId: string;
  readonly startedTick: number;
  readonly tick: number;
}

export interface WardenState {
  readonly version: typeof WARDEN_STATE_VERSION;
  readonly tick: number;
  readonly fsm: WardenFsmState;
  readonly phase: WardenPhase;
  readonly stance: WardenStance;
  readonly x: number;
  readonly z: number;
  readonly yaw: number;
  readonly pulse: number;
  readonly maxPulse: number;
  readonly action: WardenActionState | null;
  readonly lastMoveId: string | null;
  readonly consecutiveMoveCount: number;
  readonly lastUsedTick: Readonly<Record<string, number>>;
  readonly neutralUntilTick: number;
  readonly ceremonyEndTick: number | null;
  readonly ceremonyDone: boolean;
  readonly lanternHung: boolean;
  readonly targetRootedUntilTick: number;
  readonly enteredArena: boolean;
  readonly engaged: boolean;
  readonly leashed: boolean;
  readonly chargeStopped: boolean;
}

export type WardenArenaTransition = "enter" | "engage" | "defeated" | "death-reset";

export interface WardenAftermathPayload {
  readonly tagItemId: string;
  readonly tagTextKeys: readonly string[];
  readonly titleCard: false;
}

export type WardenEvent =
  | { readonly type: "arena-gate"; readonly tick: number; readonly transition: WardenArenaTransition }
  | { readonly type: "move-selected"; readonly tick: number; readonly moveId: string; readonly tellTicks: number; readonly tellClass: WardenTellClass }
  | { readonly type: "move-active"; readonly tick: number; readonly moveId: string; readonly windowIndex: number }
  | { readonly type: "move-recovery"; readonly tick: number; readonly moveId: string; readonly recoveryTicks: number; readonly punishLights: number }
  | { readonly type: "move-ended"; readonly tick: number; readonly moveId: string }
  | { readonly type: "phase-changed"; readonly tick: number; readonly phase: WardenPhase }
  | { readonly type: "lantern-hung"; readonly tick: number; readonly anchorId: string }
  | { readonly type: "ceremony-requested"; readonly tick: number; readonly holdTicks: number; readonly anchorId: string; readonly dealsDamage: false }
  | { readonly type: "ceremony-ended"; readonly tick: number }
  | { readonly type: "quiet-pulse"; readonly tick: number; readonly witherAmount: number; readonly radiusMeters: number; readonly pulseDamage: 0 }
  | { readonly type: "snare-contact"; readonly tick: number; readonly actorId: string; readonly rootTicks: number; readonly chime: boolean }
  | { readonly type: "snare-pass-through"; readonly tick: number; readonly actorId: string }
  | { readonly type: "charge-ended-at-ring"; readonly tick: number }
  | { readonly type: "leash-reset"; readonly tick: number }
  | { readonly type: "aftermath-requested"; readonly tick: number; readonly payload: WardenAftermathPayload }
  | { readonly type: "defeated"; readonly tick: number };

/** One authored move start, handed to s11's action clock by the caller. */
export interface WardenMoveIntent {
  readonly actorId: string;
  readonly moveId: string;
  readonly tick: number;
}

export interface WardenStepInput {
  readonly targetX: number;
  readonly targetZ: number;
  /** Pulse removed from the Warden this tick by s11 hit resolution. */
  readonly pulseDamage?: number;
  /** True once the player has crossed into the ring (s15 entry gate). */
  readonly targetInsideArena?: boolean;
  readonly targetDied?: boolean;
}

export interface WardenStepResult {
  readonly state: WardenState;
  readonly events: readonly WardenEvent[];
  readonly intents: readonly WardenMoveIntent[];
}

/**
 * Structural mirror of s25 `sim/scenes/ceremony.ts#WardenCeremonyContract`.
 * The boss module never imports scenes; integration closes over SceneState.
 */
export interface WardenCeremonyPort {
  readonly pulsePercent: number;
  readonly holdTicks: number;
  shouldBegin(bossPulse: number, bossMaxPulse: number): boolean;
  begin(): void;
}

/** Structural mirror of s25 `WardenAftermathContract`, plus the tag payload. */
export interface WardenAftermathPort {
  begin(payload: WardenAftermathPayload): void;
}

export interface WardenPorts {
  readonly ceremony?: WardenCeremonyPort;
  readonly aftermath?: WardenAftermathPort;
}

export interface WardenSeed {
  readonly x: number;
  readonly z: number;
  readonly yaw?: number;
  readonly pulse: number;
  readonly maxPulse: number;
}
