/**
 * Register-locked rendering for staged scenes. L-T4: Anna and Birdie always
 * render at folk, step 0. The Numbness ladder is consulted via s15 `textStep`
 * and then ignored for those two scripts.
 */

export interface TextBibleEntry {
  readonly folk: string | null;
  readonly church: string | null;
  readonly state: string | null;
  readonly numb1?: string;
  readonly numb2?: string;
  readonly numb3?: string;
}

export type TextBible = Readonly<Record<string, TextBibleEntry>>;

export const REGISTER_LOCKED_SCRIPTS = ["anna_gravity", "birdie_coda"] as const;

export const isRegisterLockedScript = (scriptId: string): boolean =>
  scriptId === "anna_gravity" || scriptId === "birdie_coda";

export const keyHasNumbVariants = (entry: TextBibleEntry | undefined): boolean =>
  entry !== undefined &&
  (entry.numb1 !== undefined || entry.numb2 !== undefined || entry.numb3 !== undefined);

/**
 * Render a bible key. Locked scenes force step 0 (folk) regardless of the
 * meta `textStep`. Unlocked scenes still prefer folk at step 0; they never
 * invent strings.
 */
export const renderSceneKey = (
  bible: TextBible,
  key: string,
  scriptId: string,
  metaTextStep: number,
): string | null => {
  const entry = bible[key];
  if (entry === undefined) {
    return null;
  }
  const step = isRegisterLockedScript(scriptId) ? 0 : metaTextStep;
  if (step === 0) {
    return entry.folk;
  }
  if (step === 1) {
    return entry.numb1 ?? entry.folk;
  }
  if (step === 2) {
    return entry.numb2 ?? entry.numb1 ?? entry.folk;
  }
  return entry.numb3 ?? entry.numb2 ?? entry.numb1 ?? entry.folk;
};
