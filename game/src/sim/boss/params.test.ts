/**
 * Telegraph accounting (GATES F3) and the frame-data cross-check that keeps the
 * Warden's authored table honest against `src/data/frame_data.json`.
 */

import { describe, expect, it } from "vitest";

import { RAW_FRAME_DATA, RAW_WARDEN_PARAMS, WARDEN_PARAMS } from "./fixtures.test";
import { allWardenMoves, parseWardenParams, wardenMove } from "./params";
import type { WardenTellClass } from "./types";

const clone = (value: unknown): Record<string, unknown> =>
  JSON.parse(JSON.stringify(value)) as Record<string, unknown>;

const minimumTellFor = (tellClass: WardenTellClass): number => {
  if (tellClass === "heavy") return WARDEN_PARAMS.gates.heavyTellMinStartupTicks;
  if (tellClass === "stillness") return WARDEN_PARAMS.gates.stillnessTellMinTicks;
  return WARDEN_PARAMS.gates.openerMinStartupTicks;
};

const shortfallIds = new Set(
  WARDEN_PARAMS.gates.knownShortfalls.map((entry) => entry.moveId),
);

describe("Warden frame-data cross-check", () => {
  it("binds every authored row to a Warden clip of the right actor class", () => {
    for (const phase of ["p1", "p2"] as const) {
      for (const move of WARDEN_PARAMS.phases[phase].moves) {
        expect(move.clip.actorClass).toBe(WARDEN_PARAMS.phases[phase].actorClass);
        expect(move.clip.moveId).toBe(move.moveId);
      }
    }
  });

  it("covers every Warden row that frame_data.json ships", () => {
    const frameData = RAW_FRAME_DATA as {
      readonly moves: Readonly<Record<string, { readonly actorClass: string }>>;
    };
    const authored = new Set(allWardenMoves(WARDEN_PARAMS).map((move) => move.moveId));
    const shipped = Object.entries(frameData.moves)
      .filter(([, move]) => move.actorClass === "warden_p1" || move.actorClass === "warden_p2")
      .map(([id]) => id)
      .filter((id) => id !== WARDEN_PARAMS.ceremony.moveId);
    expect([...authored].sort()).toEqual([...shipped].sort());
  });

  it("places every active window exactly where the TUNING_V0 segments say", () => {
    // Guarded by parseWardenParams; this re-states the two compound rows.
    const twoStep = wardenMove(WARDEN_PARAMS, "p1", "warden_p1_two_step_chop");
    expect(twoStep.tableSegments).toEqual([26, 14]);
    expect(twoStep.clip.activeWindows.map((window) => window.startTick)).toEqual([26, 44]);
    const sweep = wardenMove(WARDEN_PARAMS, "p2", "warden_p2_three_string_sweep");
    expect(sweep.tableSegments).toEqual([20, 12, 16]);
    expect(sweep.clip.activeWindows.map((window) => window.startTick)).toEqual([20, 36, 56]);
  });

  it("rejects a table segment that drifts from the clip", () => {
    const broken = clone(RAW_WARDEN_PARAMS);
    const phases = broken.phases as Record<string, { moves: { tableSegments: number[] }[] }>;
    const first = phases.p1?.moves[0];
    if (first === undefined) throw new Error("fixture missing a P1 move");
    first.tableSegments = [31];
    expect(() => parseWardenParams(broken, RAW_FRAME_DATA)).toThrow(/tableSegments/);
  });

  it("rejects a bait that is reachable outside the step-back stance", () => {
    const broken = clone(RAW_WARDEN_PARAMS);
    const phases = broken.phases as Record<
      string,
      { moves: { tellClass: string; requiresStance: string | null }[] }
    >;
    const bait = phases.p1?.moves.find((move) => move.tellClass === "bait");
    if (bait === undefined) throw new Error("fixture missing the bait");
    bait.requiresStance = null;
    expect(() => parseWardenParams(broken, RAW_FRAME_DATA)).toThrow(/step-back/);
  });

  it("rejects a ceremony that deals damage or drifts off the 90-tick hold", () => {
    const broken = clone(RAW_WARDEN_PARAMS);
    (broken.ceremony as Record<string, unknown>).holdTicks = 60;
    expect(() => parseWardenParams(broken, RAW_FRAME_DATA)).toThrow(/ceremony clip length/);
    const cheap = clone(RAW_WARDEN_PARAMS);
    (cheap.ceremony as Record<string, unknown>).dealsDamage = true;
    expect(() => parseWardenParams(cheap, RAW_FRAME_DATA)).toThrow(/cheap hit/);
  });

  it("rejects a charge contact window longer than the authored travel", () => {
    const broken = clone(RAW_WARDEN_PARAMS);
    const phases = broken.phases as Record<
      string,
      { moves: { moveId: string; contactTicksPerWindow: number | null }[] }
    >;
    const charge = phases.p2?.moves.find((move) => move.moveId === "warden_p2_charge_through");
    if (charge === undefined) throw new Error("fixture missing the charge");
    charge.contactTicksPerWindow = 999;
    expect(() => parseWardenParams(broken, RAW_FRAME_DATA)).toThrow(/contactTicksPerWindow/);
  });
});

describe("F3 — telegraph accounting", () => {
  it.each(allWardenMoves(WARDEN_PARAMS).map((move) => ({ moveId: move.moveId })))(
    "$moveId: the tell is at least the table startup and clears its F3 bar",
    ({ moveId }) => {
      const move = allWardenMoves(WARDEN_PARAMS).find((entry) => entry.moveId === moveId);
      if (move === undefined) throw new Error(`unknown move ${moveId}`);
      const tableStartup = move.tableSegments[0] ?? 0;
      expect(move.clip.tellTicks).toBeGreaterThanOrEqual(tableStartup);
      const bar = minimumTellFor(move.tellClass);
      if (shortfallIds.has(moveId)) {
        expect(move.clip.tellTicks).toBeLessThan(bar);
      } else {
        expect(move.clip.tellTicks).toBeGreaterThanOrEqual(bar);
      }
    },
  );

  it("keeps every readable wind-up above the 12-tick floor GATES F3 sets for all actors", () => {
    for (const move of allWardenMoves(WARDEN_PARAMS)) {
      expect(move.clip.tellTicks).toBeGreaterThanOrEqual(12);
    }
  });

  it("declares its F3 shortfalls instead of quietly retuning the table", () => {
    expect(WARDEN_PARAMS.gates.knownShortfalls).toEqual([
      {
        moveId: "warden_p1_lantern_swing",
        gate: "F3.openerMinStartupTicks",
        tellTicks: 14,
        requiredTicks: 18,
        note: expect.stringContaining("TUNING_V0"),
      },
    ]);
    const declared = WARDEN_PARAMS.gates.knownShortfalls[0];
    if (declared === undefined) throw new Error("missing declared shortfall");
    const move = wardenMove(WARDEN_PARAMS, "p1", declared.moveId);
    expect(move.clip.tellTicks).toBe(declared.tellTicks);
    expect(declared.requiredTicks).toBe(WARDEN_PARAMS.gates.openerMinStartupTicks);
  });

  it("gives the two heavy tells and the stillness tell at least 30 ticks", () => {
    const heavies = allWardenMoves(WARDEN_PARAMS).filter((move) => move.tellClass === "heavy");
    expect(heavies.map((move) => move.moveId)).toEqual([
      "warden_p1_overhead_fell",
      "warden_p2_wide_fell",
      "warden_p2_charge_through",
    ]);
    for (const move of heavies) {
      expect(move.clip.tellTicks).toBeGreaterThanOrEqual(30);
    }
    expect(wardenMove(WARDEN_PARAMS, "p2", WARDEN_PARAMS.quiet.moveId).clip.tellTicks).toBe(30);
  });
});

describe("Phase 2 law", () => {
  it("applies 12 Wither on every Phase 2 hit that lands damage", () => {
    expect(WARDEN_PARAMS.phases.p2.witherPerHit).toBe(12);
    for (const move of WARDEN_PARAMS.phases.p2.moves) {
      if (move.clip.pulseDamage > 0) {
        expect(move.clip.witherBuildup).toBe(WARDEN_PARAMS.phases.p2.witherPerHit);
      }
    }
  });

  it("applies no Wither anywhere in Phase 1", () => {
    for (const move of WARDEN_PARAMS.phases.p1.moves) {
      expect(move.clip.witherBuildup).toBe(0);
    }
    expect(WARDEN_PARAMS.phases.p1.witherPerHit).toBe(0);
  });

  it("ships the two-handed Phase 2 moveset named by ENCOUNTERS", () => {
    expect(WARDEN_PARAMS.phases.p2.moves.map((move) => move.moveId)).toEqual([
      "warden_p2_wide_fell",
      "warden_p2_three_string_sweep",
      "warden_p2_snare_toss",
      "warden_p2_charge_through",
      "warden_p2_lantern_fire_arc",
      "warden_p2_the_quiet",
    ]);
    expect(
      wardenMove(WARDEN_PARAMS, "p2", "warden_p2_lantern_fire_arc").requiresRingHug,
    ).toBe(true);
    expect(
      WARDEN_PARAMS.phases.p2.moves.filter((move) => move.requiresRingHug),
    ).toHaveLength(1);
  });

  it("ships the lantern-and-axe Phase 1 moveset named by ENCOUNTERS", () => {
    expect(WARDEN_PARAMS.phases.p1.moves.map((move) => move.moveId)).toEqual([
      "warden_p1_overhead_fell",
      "warden_p1_side_clear",
      "warden_p1_lantern_swing",
      "warden_p1_two_step_chop",
      "warden_p1_stomp_snare_kick",
      "warden_p1_lantern_raise_bait",
    ]);
  });
});

describe("charge-through travel split", () => {
  it("restores the TUNING_V0 6+24 split that frame_data.json collapsed", () => {
    const charge = wardenMove(WARDEN_PARAMS, "p2", "warden_p2_charge_through");
    expect(charge.clip.activeWindows).toEqual([{ startTick: 30, endTickExclusive: 60 }]);
    expect(charge.contactTicksPerWindow).toBe(6);
    expect(charge.clip.contactWindows).toEqual([{ startTick: 30, endTickExclusive: 36 }]);
  });

  it("leaves every other move's contact window equal to its active window", () => {
    for (const move of allWardenMoves(WARDEN_PARAMS)) {
      if (move.moveId === "warden_p2_charge_through") continue;
      expect(move.clip.contactWindows).toEqual(move.clip.activeWindows);
    }
  });
});
