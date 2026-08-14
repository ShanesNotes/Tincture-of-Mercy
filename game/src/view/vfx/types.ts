/**
 * VFX event + effect types (slice s27). The controller consumes
 * fixture/presenter-shaped events — the same shapes the s11 combat presenter
 * emits (hit with hitstop ticks, guard_break, death) plus the view-only rows
 * the slice names (whiff, wither, flask, ember, tag_chime). s18 owns wiring
 * into the live loop; until then `applyVfxEvents(events, tick)` is the seam.
 *
 * Every event carries the sim tick it occurred on so the F4 latency row
 * (hit VFX within 2 ticks of the sim event) is measurable from state alone.
 */

/** 8-way frame-margin anchors for the ink-bloom (slice deliverable 1). */
export type Direction8 = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

/** TUNING_V0 hitstop classes (3/6/8/5/9/12t). "none" never reaches VFX (F4). */
export type HitstopClassName =
  | "light"
  | "blocked"
  | "heavy"
  | "charged"
  | "guard_break"
  | "critical"
  | "death";

export type Vec2 = readonly [number, number];
export type Vec3Tuple = readonly [number, number, number];

interface VfxEventBase {
  /** Sim tick the event occurred on (presenter tick). */
  readonly tick: number;
}

/** A confirmed hit. `hitstopTicks` is the sim-owned freeze (TUNING_V0 table). */
export interface VfxHitEvent extends VfxEventBase {
  readonly kind: "hit";
  readonly targetId: string;
  readonly hitstopTicks: number;
  /** Screen-space impact direction from frame center, normalized-ish. */
  readonly direction: Vec2;
  /** World-space contact point for the ink-stroke flash. */
  readonly contact: Vec3Tuple;
  readonly critical?: boolean;
}

/** A swing that connected with nothing. F4: zero juice on air. */
export interface VfxWhiffEvent extends VfxEventBase {
  readonly kind: "whiff";
  readonly actorId: string;
}

/** Guard break: bloom class 9t + the licensed gold flash (the earned opening). */
export interface VfxGuardBreakEvent extends VfxEventBase {
  readonly kind: "guard_break";
  readonly targetId: string;
  readonly hitstopTicks: number;
  readonly direction: Vec2;
  readonly contact: Vec3Tuple;
}

/** Riposte: the other licensed gold flash. No bloom class of its own. */
export interface VfxRiposteEvent extends VfxEventBase {
  readonly kind: "riposte";
  readonly targetId: string;
  readonly contact: Vec3Tuple;
}

/** Wither zone/buildup: margin desaturation band + sparse ink motes (EN14). */
export interface VfxWitherEvent extends VfxEventBase {
  readonly kind: "wither";
  /** 0..1 buildup; mote density derives from it, capped (data-driven). */
  readonly density: number;
  readonly durationTicks?: number;
}

/** The Tincture drink — vial glow as registered emblem light, verb `mercy`. */
export interface VfxFlaskEvent extends VfxEventBase {
  readonly kind: "flask";
  readonly actorId: string;
}

/** Ember use — gold-to-grey world desaturation sweep, 60t, then gone (D6). */
export interface VfxEmberEvent extends VfxEventBase {
  readonly kind: "ember";
  readonly actorId: string;
}

/** Snare-ring tin tag contact — the tiny glint pairing the audio tell (PR5). */
export interface VfxTagChimeEvent extends VfxEventBase {
  readonly kind: "tag_chime";
  readonly contact: Vec3Tuple;
}

/** Death: 12t-class bloom + 1-frame parchment inversion + the page hook. */
export interface VfxDeathEvent extends VfxEventBase {
  readonly kind: "death";
  readonly targetId: string;
  readonly hitstopTicks: number;
  readonly direction: Vec2;
  readonly contact: Vec3Tuple;
}

export type VfxEvent =
  | VfxHitEvent
  | VfxWhiffEvent
  | VfxGuardBreakEvent
  | VfxRiposteEvent
  | VfxWitherEvent
  | VfxFlaskEvent
  | VfxEmberEvent
  | VfxTagChimeEvent
  | VfxDeathEvent;

/** Event payload without its tick — the demo timeline's stored shape. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type VfxEventPayload = DistributiveOmit<VfxEvent, "tick">;

// ---------------------------------------------------------------------------
// Effect instances (controller state)
// ---------------------------------------------------------------------------

/** Frame-margin ink-bloom. Decays to nothing; never outlives durationTicks. */
export interface BloomInstance {
  readonly anchor: Direction8;
  readonly hitstopClass: HitstopClassName;
  /** Sim tick of the hit event (F4 latency = startTick − eventTick). */
  readonly eventTick: number;
  readonly startTick: number;
  readonly durationTicks: number;
  readonly peakIntensity: number;
}

/** World-space ink-stroke hit flash. `gold` only for riposte/guard-break. */
export interface StrokeInstance {
  readonly contact: Vec3Tuple;
  readonly variant: number;
  readonly gold: boolean;
  readonly startTick: number;
  readonly durationTicks: number;
}

/** Wither margin-and-mote field (EN14). */
export interface WitherField {
  readonly density: number;
  readonly startTick: number;
  readonly durationTicks: number;
}

/** Registered emblem light pulse (flask drink / ember gold glint). */
export interface EmblemPulse {
  readonly emblem: "vial" | "ember";
  readonly startTick: number;
  readonly durationTicks: number;
  readonly peakIntensity: number;
}

/** Ember's gold-to-grey world desaturation sweep (60t, then gone). */
export interface EmberSweep {
  readonly startTick: number;
  readonly durationTicks: number;
}

/** Snare-ring tin glint. */
export interface TagGlint {
  readonly contact: Vec3Tuple;
  readonly startTick: number;
  readonly durationTicks: number;
}

/** Death "page" treatment hook — the lower page dims for a beat. */
export interface DeathPage {
  readonly startTick: number;
  readonly durationTicks: number;
}

export interface VfxState {
  readonly tick: number;
  readonly blooms: readonly BloomInstance[];
  readonly strokes: readonly StrokeInstance[];
  readonly wither: WitherField | null;
  readonly pulses: readonly EmblemPulse[];
  readonly emberSweep: EmberSweep | null;
  readonly tagGlints: readonly TagGlint[];
  /** Set on critical/death; active for exactly `inversion.frames` frames. */
  readonly inversionStartTick: number | null;
  readonly deathPage: DeathPage | null;
}
