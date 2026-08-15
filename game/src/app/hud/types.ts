/**
 * HUD input/model types (slice s16). The HUD is a read-only consumer: sim
 * modules (s11 combat stats, s15 mercy loop, s25 scenes) own the truth; at
 * integration their states are bound to {@link HudInput}. Until then fixtures
 * drive it (slice contract: no gameplay wiring).
 *
 * Vocabulary is D6-binding: Pulse (HP), Breath (stamina), doses (the Tincture),
 * Names (currency), the Turn (buildup), Numbness (Ember's register cost).
 */

/** HB2: the left margin ornament column's character matches zone state. */
export type ZoneCharacter = "domestic" | "wild";

/** HB3 / L10: the hearth verdict is binary — lit or unlit (EN7/EN8). */
export type HearthVerdict = "lit" | "unlit";

/** HB3 boss-phase verdict. "ceremony" is the Warden's 90t lantern-hanging hold (D7). */
export type BossPhase = "none" | "phase1" | "ceremony" | "phase2";

/** Everything the border needs for one render, derived from sim states. */
export interface HudInput {
  readonly pulse: number;
  readonly maxPulse: number;
  readonly breath: number;
  readonly maxBreath: number;
  /** Tincture doses on hand (TUNING_V0: 3 base, +1 per Hearth upgrade tier). */
  readonly doses: number;
  readonly maxDoses: number;
  /** Names witnessed and not yet written (D6 currency). */
  readonly namesCarried: number;
  /** Turn buildup against its cap (s11 owns the meter; the HUD only reads). */
  readonly turn: number;
  readonly turnCap: number;
  readonly hearth: HearthVerdict;
  readonly bossPhase: BossPhase;
  /** CM40 / SceneOpEvent "unwritten-mark": the Warden's tag not yet written. */
  readonly unwrittenTag: boolean;
  /** Permanent Ember stacks (D6). */
  readonly numbnessStacks: number;
  /** 1 while a Hearth vigil holds; 0 after first hostile contact (TEXT_BIBLE §2). */
  readonly vigilRestore: number;
  /** L-T4: Anna gravity encounter and Birdie coda always render folk step 0. */
  readonly registerLocked: boolean;
  readonly zone: ZoneCharacter;
  /**
   * A page from an earlier death was still lying unrecovered when this death
   * landed, so it is lost for good (D6). The death overlay adds
   * `ui.death.open_page_lost`. Optional and false by default: only the live
   * world latches the sim's `page-lost` event; fixtures are single states.
   */
  readonly pageLost?: boolean;
  /**
   * The `hud.woken` scene flag — the border sleeps through the cabin prologue
   * and wakes with the first dose of Anna's medicine. Optional and true by
   * default: fixtures and scripted states are all mid-game, already awake.
   */
  readonly woken?: boolean;
}

/** Tallies decomposed for the colophon: five-bar groups plus a remainder (HB4). */
export interface TallyCount {
  readonly groups: number;
  readonly remainder: number;
}

/** The derived, render-ready model. Every field is already quantized — the view never computes. */
export interface HudModel {
  /** HB5: stepped stops, never continuous. 0 = empty, 1..litStops = lit vellum stops. */
  readonly pulseStop: number;
  readonly breathStop: number;
  /** stop / litStops — the stepped lit height of each margin measure. */
  readonly pulseFraction: number;
  readonly breathFraction: number;
  readonly doses: number;
  readonly maxDoses: number;
  readonly tallies: TallyCount;
  /** D6/HB3: the Turn renders as margin narrowing — quantized narrowing stops. */
  readonly turnStep: number;
  /** HB6: at cap the actor is Turned — a border verdict, never a flash. */
  readonly turned: boolean;
  /** TEXT_BIBLE §2: textStep = clamp(stacks − vigilRestore, 0, 3); 0 when register-locked (L-T4). */
  readonly textStep: number;
  readonly hearth: HearthVerdict;
  readonly bossPhase: BossPhase;
  readonly unwrittenTag: boolean;
  readonly zone: ZoneCharacter;
}
