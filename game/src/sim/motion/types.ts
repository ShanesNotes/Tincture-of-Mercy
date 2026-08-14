/**
 * Sim-side collision + motion contracts for the deterministic capsule controller.
 *
 * The query shapes below deliberately mirror the plain-data results produced by
 * `src/view/collision.ts` (`CollisionWorld`) so a view-side BVH world is
 * structurally assignable to `CollisionQueries` once `probeGround` is supplied
 * (see `withDerivedGroundProbe` in `queries.ts`). Nothing in `src/sim` may
 * import the view, so the types are restated here rather than shared.
 */

export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface RaycastQuery {
  readonly origin: Vec3;
  readonly direction: Vec3;
  readonly maxDistance: number;
}

export interface RaycastHit {
  readonly distance: number;
  readonly point: Vec3;
  readonly normal: Vec3;
  readonly triangleIndex: number;
}

/** Capsule as a segment plus radius. The lowest point of the capsule is `start.y - radius`. */
export interface Capsule {
  readonly start: Vec3;
  readonly end: Vec3;
  readonly radius: number;
}

export interface CapsuleSweepQuery {
  readonly capsule: Capsule;
  readonly displacement: Vec3;
}

export interface CapsuleSweepHit {
  /** Fraction of `displacement` travelled before first contact, in [0, 1]. */
  readonly fraction: number;
  readonly point: Vec3;
  /** Unit normal pointing out of the surface, toward the capsule. */
  readonly normal: Vec3;
  readonly triangleIndex: number;
}

export interface GroundProbeQuery {
  readonly capsule: Capsule;
  readonly maxDistance: number;
}

export interface GroundProbeHit {
  /** Distance the capsule may fall before touching the surface. */
  readonly distance: number;
  readonly point: Vec3;
  readonly normal: Vec3;
  readonly triangleIndex: number;
}

/** Read-only static-world queries the controller needs. Injected; never constructed by the sim. */
export interface CollisionQueries {
  raycast(query: RaycastQuery): RaycastHit | null;
  sweepCapsule(query: CapsuleSweepQuery): CapsuleSweepHit | null;
  probeGround(query: GroundProbeQuery): GroundProbeHit | null;
}

export type LocomotionState =
  | "idle"
  | "walk"
  | "run"
  | "sprint"
  | "jump"
  | "airborne"
  | "land"
  | "fallDamage"
  | "displaced";

/**
 * Per-tick root displacement sampled from an authored clip.
 * Field shape matches `rootXZ` in `game/tools/blender/SIDECAR_SCHEMA.md`:
 * length `ticks`, game-space ground plane `[x, z]`, cumulative from clip start.
 * s11 owns *when* a clip starts; this module owns applying it against collision.
 */
export interface RootDisplacementClip {
  readonly clipId: string;
  readonly ticks: number;
  readonly rootXZ: readonly (readonly [number, number])[];
}

export interface DisplacementHost {
  readonly clip: RootDisplacementClip;
  /** Index of the sample applied last tick; the next tick applies `rootXZ[tick + 1] - rootXZ[tick]`. */
  readonly tick: number;
  /** Yaw (radians) latched when the clip began; the clip's local +Z is rotated by it. */
  readonly facing: number;
}

export interface MotionState {
  readonly version: 1;
  readonly tick: number;
  /** Capsule foot position — the lowest point of the capsule, in world space. */
  readonly position: Vec3;
  readonly velocity: Vec3;
  /**
   * Yaw in radians about +Y. Yaw 0 faces −Z, the rest orientation game space
   * declares in `game/tools/blender/SIDECAR_SCHEMA.md`, so authored clip-local
   * displacement rotates into world space without a correction.
   */
  readonly facing: number;
  readonly locomotion: LocomotionState;
  readonly grounded: boolean;
  readonly groundNormal: Vec3;
  /**
   * Working copy of the Breath pool. This module only ever *spends* it (sprint
   * drain, jump cost) and reports every spend as an event; regeneration and the
   * authoritative pool belong to the combat economy, which may overwrite this
   * field each tick at composition.
   */
  readonly breath: number;
  /** Remaining committed ticks of landing lag; locomotion is unactionable while > 0. */
  readonly lagTicks: number;
  /** Highest y reached since ground contact was lost; the fall-damage datum. */
  readonly fallStartY: number;
  readonly displacement: DisplacementHost | null;
  /** Contacts resolved by the last move; never exceeds `collision.maxContacts`. */
  readonly contactCount: number;
}

export interface MotionInput {
  /** World-space desired move direction on XZ; magnitude in [0, 1]. Camera-relative mapping is the camera slice's job. */
  readonly moveX: number;
  readonly moveZ: number;
  readonly sprint: boolean;
  /** Already edge-latched and buffer-resolved by the caller; true means "jump this tick". */
  readonly jump: boolean;
  /** s11 hands a clip over on the tick the roll/backstep starts. */
  readonly beginDisplacement?: RootDisplacementClip;
  readonly cancelDisplacement?: boolean;
  /** Rotate toward moveX/moveZ using the authored turn curve without horizontal travel this tick. */
  readonly turnOnly?: boolean;
  /** Combat-authored yaw for this tick; also latches a newly begun displacement in that facing. */
  readonly facingOverride?: number;
}

export type MotionEvent =
  | { readonly type: "jumped"; readonly tick: number; readonly breathCost: number }
  | {
      readonly type: "breathSpent";
      readonly tick: number;
      readonly amount: number;
      readonly reason: "jump" | "sprint";
    }
  | {
      readonly type: "landed";
      readonly tick: number;
      readonly fallMeters: number;
      readonly lagTicks: number;
    }
  | {
      readonly type: "fallDamage";
      readonly tick: number;
      readonly fallMeters: number;
      /** Damage as a fraction of maximum Pulse in [0, 1]; the Pulse pool is not this module's state. */
      readonly pulseFraction: number;
    }
  | { readonly type: "displacementStarted"; readonly tick: number; readonly clipId: string }
  | { readonly type: "displacementEnded"; readonly tick: number; readonly clipId: string };

export interface MotionStep {
  readonly state: MotionState;
  readonly events: readonly MotionEvent[];
}
