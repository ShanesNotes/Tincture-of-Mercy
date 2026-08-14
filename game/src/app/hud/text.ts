/**
 * renderString — every HUD string comes through here (slice contract
 * deliverable 4). Implements the TEXT_BIBLE §2 Numbness ladder on the folk
 * surface, explicit register selection for polyphonic panels, L-T4 register
 * locks, and the HB8 State-register typography flag.
 *
 * Silence rules (TEXT_BIBLE §1, "Deliberate absence"):
 *  - `null` in a register  → that register has no word; render the em-dash
 *    silence, never an empty string.
 *  - `""` at a numb step   → at this step the line is not shown at all
 *    (that is how lore lines die) — also rendered as em-dash silence.
 */

import { bibleEntry, type HudBibleEntry } from "./bible";
import { HUD_PARAMS } from "./params";

export type RegisterName = "folk" | "church" | "state";

/** The deliberate-absence mark (TEXT_BIBLE §1). Cards and panels render this, never "". */
export const ABSENT_MARK = "—";

export interface RenderStringOptions {
  /** The merged meta `textStep` (model.textStep); ignored when `lock` is set. */
  readonly textStep: number;
  /** Explicit register for polyphonic panels; default "folk" (the Numbness-degraded surface). */
  readonly register?: RegisterName;
  /** L-T4: register-locked scenes (Anna gravity, Birdie coda) render step-0 folk. */
  readonly lock?: boolean;
  /** `{n}`-style substitutions (State dose counts etc.). */
  readonly vars?: Readonly<Record<string, number | string>>;
}

export interface RenderedString {
  readonly key: string;
  /** The text to render; ABSENT_MARK when the register/step has no word. */
  readonly text: string;
  /** Which register the text actually is (null when absent). */
  readonly register: RegisterName | null;
  /** True when the register/step deliberately has no word (em-dash silence). */
  readonly absent: boolean;
  /**
   * HB8: State-register lines render IBM Plex Mono caps + institutional blue,
   * and only ever appear as Numbness degradation or on an explicitly
   * State-framed surface — never as a flourish.
   */
  readonly stateRegister: boolean;
}

const substitute = (
  text: string,
  vars: Readonly<Record<string, number | string>> | undefined,
): string =>
  vars === undefined
    ? text
    : text.replace(/\{(\w+)\}/g, (match, name: string) =>
        vars[name] === undefined ? match : String(vars[name]),
      );

export const renderString = (key: string, options: RenderStringOptions): RenderedString => {
  const entry = bibleEntry(key);
  if (entry === undefined) {
    return {
      key,
      text: ABSENT_MARK,
      register: null,
      absent: true,
      stateRegister: (options.register ?? "folk") === "state",
    };
  }
  return renderEntry(key, entry, options);
};

/**
 * The ladder itself, factored off the bible lookup so the menu-chrome table
 * (menus/logic.ts — keys the v0 bible does not author, see its header note)
 * renders through the exact same register/degradation rules.
 */
export const renderEntry = (
  key: string,
  entry: HudBibleEntry,
  options: RenderStringOptions,
): RenderedString => {
  const register = options.register ?? "folk";
  const absent: RenderedString = {
    key,
    text: ABSENT_MARK,
    register: null,
    absent: true,
    stateRegister: register === "state",
  };

  // Explicit-register panel (item cards, Church/State columns): no ladder —
  // the panel shows what the register says; null is deliberate silence.
  if (register !== "folk") {
    const text = entry[register];
    if (text === null) {
      return absent;
    }
    return {
      key,
      text: substitute(text, options.vars),
      register,
      absent: false,
      stateRegister: register === "state",
    };
  }

  // Folk surface with the Numbness ladder (TEXT_BIBLE §2 transformation rules).
  const step = options.lock === true
    ? 0
    : Math.min(HUD_PARAMS.text.maxStep, Math.max(0, Math.floor(options.textStep)));
  const ladder =
    step === 0
      ? [entry.folk]
      : step === 1
        ? [entry.numb1, entry.folk]
        : step === 2
          ? [entry.numb2, entry.numb1, entry.folk]
          : [entry.numb3, entry.numb2, entry.numb1, entry.folk];
  const chosen = ladder.find((candidate) => candidate !== undefined && candidate !== null);
  if (chosen === undefined || chosen === "") {
    // "" at a step: the line is not shown at all (lore lines die first).
    return { ...absent, stateRegister: false };
  }
  return {
    key,
    text: substitute(chosen, options.vars),
    register: "folk",
    absent: false,
    // State typography only once the ladder has actually dragged the line to
    // State phrasing (step >= 2 "State phrasing in folk word order"; step 3
    // outright). A line with no numb variants (spoken lines, L-T2) falls back
    // to folk and never picks up State styling.
    stateRegister: step >= 2 && chosen !== entry.folk,
  };
};
