/**
 * Harness-side art-gate rows (GATES.md A5 and the full A7) — F5 repair.
 *
 * The s13-scoped page module (src/view/register/gateRows.ts, covered by the
 * in-page `evaluateRows`) emits A1–A4/A6 plus a narrowed A7. This module
 * composes the full machine-row set the gate demands:
 *
 *   A5  HUD border verdict: the border is screenshotted across ≥3 distinct
 *       world states and adjacent pairs must differ as rendered bytes — the
 *       same image-diff method as e2e/hud.spec.ts (Buffer.compare on the
 *       hud-border element shot).
 *   A7  No-post baseline: A1–A6 re-pass with all post disabled, not only
 *       the A1/A3/A4 subset the s13 module re-checks.
 *
 * Pure composition only: run.js feeds it Playwright border screenshots and
 * second-pass page evaluations; src/view/register/gateRows.test.ts covers
 * it on synthetic fixtures. No thresholds live here — every numeric law
 * stays in src/view/register/config.ts and is applied by the shared page
 * module.
 */

/** A5 asks for ≥3 distinct world states (GATES.md machine rows). */
export const A5_MIN_STATES = 3;

const bytesDiffer = (a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)) !== 0;

/**
 * Adjacent-pair image diff over ordered border shots
 * (`{ state, png }[]`). One measurement per adjacent pair; a pair passes
 * when the rendered bytes differ.
 */
export const borderDiffMeasurements = (shots) => {
  const measurements = [];
  for (const [index, current] of shots.entries()) {
    const previous = shots[index - 1];
    if (previous === undefined) {
      continue;
    }
    const differ = bytesDiffer(previous.png, current.png);
    measurements.push({
      capture: `${previous.state} vs ${current.state}`,
      value: differ ? 1 : 0,
      pass: differ,
    });
  }
  return measurements;
};

/** A5 row. Fails closed when fewer than A5_MIN_STATES states were captured. */
export const buildA5Row = (shots, id = "A5") => {
  const measurements = borderDiffMeasurements(shots);
  const pairFailures = measurements.filter((m) => !m.pass).length;
  const enough = shots.length >= A5_MIN_STATES;
  const pass = enough && pairFailures === 0;
  return {
    id,
    title: "Border verdict: HUD border state visibly differs across ≥3 world states (image diff)",
    pass,
    detail: enough
      ? `${shots.length} states, ${measurements.length - pairFailures}/${measurements.length} adjacent pairs differ`
      : `only ${shots.length} state(s) captured; A5 requires ≥${A5_MIN_STATES}`,
    measurements,
  };
};

/**
 * Full A7 row (L12): every machine row A1–A6 re-passed on post-off
 * evidence. `subRows` carries one already-evaluated GateRow per source row
 * (A1/A3/A4/A6 from the second-pass page evaluation over post-off frames,
 * A2 from the post-independent renderer-law audit, A5 from the no-post
 * border diff).
 */
export const buildFullA7Row = (subRows) => {
  const order = [subRows.a1, subRows.a2, subRows.a3, subRows.a4, subRows.a5, subRows.a6];
  const passing = order.filter((row) => row.pass).length;
  return {
    id: "A7",
    title: "No-post baseline: A1–A6 re-pass with all post disabled (L12)",
    pass: passing === order.length,
    detail: `${passing}/${order.length} no-post sub-rows pass (A1–A6)`,
    measurements: order.flatMap((row) => row.measurements),
  };
};

/**
 * The second-pass evaluation measures post-off frames under a flipped
 * post-on flag (the shared module only reads post-on captures for those
 * rows); relabel the evidence so the report reads honestly.
 */
export const markPostOff = (row) => ({
  ...row,
  measurements: row.measurements.map((m) => ({
    ...m,
    capture: m.capture.replace("post-on", "post-off"),
  })),
});

/**
 * Insert A5 ahead of A6 and replace the narrowed A7 with the full one,
 * yielding the GATES.md order A1–A7.
 */
export const assembleRows = (baseRows, a5Row, a7Row) => {
  const withoutA7 = baseRows.filter((row) => row.id !== "A7");
  const a6Index = withoutA7.findIndex((row) => row.id === "A6");
  const before = a6Index >= 0 ? withoutA7.slice(0, a6Index) : withoutA7;
  const after = a6Index >= 0 ? withoutA7.slice(a6Index) : [];
  return [...before, a5Row, ...after, a7Row];
};
