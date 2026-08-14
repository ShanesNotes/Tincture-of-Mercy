/**
 * Punish and fairness guarantees as executable gates (contract deliverable 4),
 * driven against the real s11 combat engine.
 *
 *   F6  a scripted punish bot lands a light after every whiffed Warden move
 *       except the declared bait, in both phases, from four angles.
 *   F5  the zero-damage roll window for every move is non-empty and exactly the
 *       band's i-frame budget wide, in all three Burden bands.
 *   F3  telegraph accounting (see params.test.ts for the table cross-check).
 *   +   hyperarmor / Steady class-table interactions, and "the quiet".
 */

import { describe, expect, it } from "vitest";

import { COMBAT_DATA, RAW_COMBAT_PARAMS, WARDEN_PARAMS, WARDEN_RING } from "./fixtures.test";
import {
  ALL_SWING_MOVES,
  attackEdge,
  PLAYER_ID,
  PLAYER_TEST_PULSE,
  PUNISH_ANGLES,
  rollEdge,
  roster,
  runCombat,
  seatAt,
  sweepAcross,
  WARDEN_ID,
  WARDEN_TEST_PULSE,
} from "./harness.test";
import { wardenMove } from "./params";
import { createWardenState, stepWarden } from "./warden";
import type { WardenPhase, WardenState } from "./types";

const PLAYER_LIGHT_ID = "light1";
const PLAYER_LIGHT_STARTUP = COMBAT_DATA.frameData.moves[PLAYER_LIGHT_ID]?.startupTicks ?? 0;
const ROLL_BANDS = ["light", "medium", "heavy"] as const;
const bandIframes = (band: (typeof ROLL_BANDS)[number]): readonly [number, number] =>
  COMBAT_DATA.params.rolls.bands[band].iframes;

interface PunishResult {
  readonly wardenPulseAfter: number;
  readonly wardenStillCommitted: boolean;
  readonly playerPulseAfter: number;
}

const runWhiffThenPunish = (
  phase: WardenPhase,
  moveId: string,
  angle: number,
): PunishResult => {
  const clip = wardenMove(WARDEN_PARAMS, phase, moveId).clip;
  const seat = seatAt(angle, 1.5);
  const recoveryStart = clip.totalTicks - clip.recoveryTicks;
  const contactTick = recoveryStart + PLAYER_LIGHT_STARTUP;
  const run = runCombat(roster(phase, seat), contactTick + 2, (tick) => {
    if (tick === 0) return { commands: [attackEdge(WARDEN_ID, moveId, 0)] };
    if (tick === recoveryStart) {
      return { commands: [attackEdge(PLAYER_ID, PLAYER_LIGHT_ID, tick, 1)] };
    }
    if (tick === contactTick) {
      return { swings: [sweepAcross(PLAYER_ID, seat, { id: WARDEN_ID, x: 0, z: 0 })] };
    }
    return {};
  });
  return {
    wardenPulseAfter: run.pulseByTick[contactTick]?.[WARDEN_ID] ?? WARDEN_TEST_PULSE,
    wardenStillCommitted: run.actionIdByTick[contactTick]?.[WARDEN_ID] === moveId,
    playerPulseAfter: run.pulseByTick[contactTick]?.[PLAYER_ID] ?? 0,
  };
};

const takesZeroDamage = (
  phase: WardenPhase,
  moveId: string,
  band: (typeof ROLL_BANDS)[number],
  rollStartTick: number,
  moveStartTick: number,
  contactTick: number,
): boolean => {
  const seat = seatAt(0, 1.5);
  const run = runCombat(roster(phase, seat, band), contactTick + 2, (tick) => {
    const commands = [];
    if (tick === moveStartTick) commands.push(attackEdge(WARDEN_ID, moveId, tick));
    if (tick === rollStartTick) commands.push(rollEdge(PLAYER_ID, `roll_${band}`, tick, 1));
    const swings =
      tick === contactTick
        ? [sweepAcross(WARDEN_ID, { x: 0, z: 0 }, { id: PLAYER_ID, x: seat.x, z: seat.z })]
        : [];
    return { commands, swings };
  });
  return (run.pulseByTick[contactTick]?.[PLAYER_ID] ?? 0) === PLAYER_TEST_PULSE;
};

const MOVE_START_TICK = 60;

describe("F6 — punish honesty", () => {
  it.each(ALL_SWING_MOVES)(
    "$phase $moveId: a light lands inside the recovery from every angle",
    ({ phase, moveId }) => {
      for (const angle of PUNISH_ANGLES) {
        const result = runWhiffThenPunish(phase, moveId, angle);
        expect(result.playerPulseAfter).toBe(PLAYER_TEST_PULSE);
        expect(result.wardenPulseAfter).toBeLessThan(WARDEN_TEST_PULSE);
        expect(result.wardenStillCommitted).toBe(true);
      }
    },
  );

  it("declares exactly one bait, and it is the only move without a punish window", () => {
    const baits = [...WARDEN_PARAMS.phases.p1.moves, ...WARDEN_PARAMS.phases.p2.moves].filter(
      (move) => move.tellClass === "bait",
    );
    expect(baits.map((move) => move.moveId)).toEqual(["warden_p1_lantern_raise_bait"]);
    expect(baits[0]?.clip.recoveryTicks).toBe(0);
    expect(baits[0]?.clip.activeWindows).toHaveLength(0);
    expect(ALL_SWING_MOVES.map((entry) => entry.moveId)).not.toContain(baits[0]?.moveId);
  });

  it("keeps every punishable recovery at or above the ENCOUNTERS 22-tick bar", () => {
    for (const { phase, moveId } of ALL_SWING_MOVES) {
      const clip = wardenMove(WARDEN_PARAMS, phase, moveId).clip;
      expect(clip.recoveryTicks).toBeGreaterThanOrEqual(
        WARDEN_PARAMS.gates.minPunishableRecoveryTicks,
      );
    }
  });
});

describe("F5 — i-frame honesty (no unavoidable attacks)", () => {
  it.each(ALL_SWING_MOVES)(
    "$phase $moveId: every Burden band owns a full-width zero-damage roll window",
    ({ phase, moveId }) => {
      const clip = wardenMove(WARDEN_PARAMS, phase, moveId).clip;
      const firstContact = clip.contactWindows[0];
      expect(firstContact).toBeDefined();
      const contactTick = MOVE_START_TICK + (firstContact?.startTick ?? 0);
      for (const band of ROLL_BANDS) {
        const [iframeStart, iframeEnd] = bandIframes(band);
        const lo = contactTick - (iframeEnd - 1);
        const hi = contactTick - iframeStart;
        const mid = Math.floor((lo + hi) / 2);
        for (const start of [lo, mid, hi]) {
          expect(
            takesZeroDamage(phase, moveId, band, start, MOVE_START_TICK, contactTick),
          ).toBe(true);
        }
        for (const start of [lo - 1, hi + 1]) {
          expect(
            takesZeroDamage(phase, moveId, band, start, MOVE_START_TICK, contactTick),
          ).toBe(false);
        }
      }
    },
  );

  it("scans one move exhaustively: the avoiding roll starts are contiguous", () => {
    const clip = wardenMove(WARDEN_PARAMS, "p1", "warden_p1_overhead_fell").clip;
    const contactTick = MOVE_START_TICK + (clip.contactWindows[0]?.startTick ?? 0);
    const avoiding: number[] = [];
    for (let start = contactTick - 24; start <= contactTick + 4; start += 1) {
      if (takesZeroDamage("p1", clip.moveId, "medium", start, MOVE_START_TICK, contactTick)) {
        avoiding.push(start);
      }
    }
    const [iframeStart, iframeEnd] = bandIframes("medium");
    expect(avoiding).toEqual(
      Array.from({ length: iframeEnd - iframeStart }, (_, index) => contactTick - (iframeEnd - 1) + index),
    );
  });

  it("covers every row whose range gate the round-one spacing fix widened", () => {
    // The three rows the round-one fix made reachable at new distances. They
    // are named here so a retune that drops one out of the swing set — and so
    // out of the F5 sweep above — fails instead of quietly losing its proof.
    const widened = [
      "warden_p1_stomp_snare_kick",
      "warden_p1_two_step_chop",
      "warden_p2_wide_fell",
    ];
    const covered = ALL_SWING_MOVES.map((entry) => entry.moveId);
    for (const moveId of widened) expect(covered).toContain(moveId);
  });

  it("records the per-band dodge tolerance against the GATES F5 +/-6 bar", () => {
    const tolerance = (band: (typeof ROLL_BANDS)[number]): number => {
      const [iframeStart, iframeEnd] = bandIframes(band);
      return Math.floor((iframeEnd - iframeStart - 1) / 2);
    };
    // The +/-6 in GATES F5 is exactly the medium band's 13 i-frames.
    expect(tolerance("light")).toBeGreaterThanOrEqual(WARDEN_PARAMS.gates.dodgeToleranceTicks);
    expect(tolerance("medium")).toBe(WARDEN_PARAMS.gates.dodgeToleranceTicks);
    // Heavy ships 11 i-frames, which cannot reach +/-6. Declared, not hidden:
    // TUNING_V0 already flags the "generous" 26-i-frame alt tune for this case.
    expect(tolerance("heavy")).toBe(WARDEN_PARAMS.gates.dodgeToleranceTicks - 1);
  });
});

describe("Steady and hyperarmor per the class table", () => {
  const lightPoise = COMBAT_DATA.frameData.moves[PLAYER_LIGHT_ID]?.poiseDamage ?? 0;

  const HITSTOP_SLACK_TICKS = 8;

  const severityAfterLights = (phase: WardenPhase, lights: number): string => {
    const seat = seatAt(0, 1.5);
    const clip = COMBAT_DATA.frameData.moves[PLAYER_LIGHT_ID];
    const stride = (clip?.totalTicks ?? 35) + HITSTOP_SLACK_TICKS;
    const run = runCombat(roster(phase, seat), stride * lights + 4, (tick) => {
      const commands = [];
      const swings = [];
      for (let index = 0; index < lights; index += 1) {
        const press = index * stride;
        if (tick === press) commands.push(attackEdge(PLAYER_ID, PLAYER_LIGHT_ID, tick, index));
        if (tick === press + PLAYER_LIGHT_STARTUP) {
          swings.push(sweepAcross(PLAYER_ID, seat, { id: WARDEN_ID, x: 0, z: 0 }));
        }
      }
      return { commands, swings };
    });
    const staggers = run.events.filter(
      (event) => event.kind === "stagger" && event.targetId === WARDEN_ID,
    );
    const last = staggers.at(-1);
    return last !== undefined && last.kind === "stagger" ? last.severity : "none";
  };

  it("uses the authored Warden Steady classes, and P2 is the sturdier one", () => {
    const steady = COMBAT_DATA.params.steady.classes;
    expect(steady.warden_p1.base).toBe(65);
    expect(steady.warden_p2.base).toBe(80);
    expect(steady.warden_p2.flinchThreshold).toBeGreaterThan(steady.warden_p1.flinchThreshold);
  });

  it("flinches the P1 Warden at the class flinch threshold, and not before", () => {
    const flinchAt = COMBAT_DATA.params.steady.classes.warden_p1.flinchThreshold;
    const needed = Math.ceil(flinchAt / lightPoise);
    expect(severityAfterLights("p1", needed - 1)).toBe("none");
    expect(severityAfterLights("p1", needed)).toBe("flinch");
  });

  it("shrugs off in P2 what staggers him in P1 — the E-7 works, that is the horror", () => {
    const p1Stagger = COMBAT_DATA.params.steady.classes.warden_p1.staggerThreshold;
    const lights = Math.ceil(p1Stagger / lightPoise);
    expect(lights * lightPoise).toBeGreaterThanOrEqual(p1Stagger);
    expect(lights * lightPoise).toBeLessThan(
      COMBAT_DATA.params.steady.classes.warden_p2.staggerThreshold,
    );
    expect(severityAfterLights("p1", lights)).toBe("stagger");
    expect(severityAfterLights("p2", lights)).toBe("flinch");
  });

  it("keeps the player standing through a Warden hit inside heavy hyperarmor", () => {
    const heavy = COMBAT_DATA.frameData.moves.heavy;
    const hyperarmor = heavy?.hyperarmorWindow ?? [0, 0];
    const seat = seatAt(0, 1.5);
    const insideTick = hyperarmor[0] + 1;
    const outsideTick = 2;
    const staggered = (playerFrameTick: number): boolean => {
      const wardenMoveId = "warden_p1_lantern_swing";
      const wardenClip = wardenMove(WARDEN_PARAMS, "p1", wardenMoveId).clip;
      const contactOffset = wardenClip.contactWindows[0]?.startTick ?? 0;
      const wardenPress = playerFrameTick - contactOffset + 40;
      const playerPress = 40;
      const contact = wardenPress + contactOffset;
      const run = runCombat(roster("p1", seat), contact + 2, (tick) => {
        const commands = [];
        if (tick === playerPress) commands.push(attackEdge(PLAYER_ID, "heavy", tick, 0));
        if (tick === wardenPress) commands.push(attackEdge(WARDEN_ID, wardenMoveId, tick, 1));
        const swings =
          tick === contact
            ? [sweepAcross(WARDEN_ID, { x: 0, z: 0 }, { id: PLAYER_ID, x: seat.x, z: seat.z })]
            : [];
        return { commands, swings };
      });
      return run.events.some(
        (event) => event.kind === "stagger" && event.targetId === PLAYER_ID,
      );
    };
    expect(staggered(outsideTick)).toBe(true);
    expect(staggered(insideTick)).toBe(false);
    expect(heavy?.hyperarmorPoise).toBeGreaterThan(
      wardenMove(WARDEN_PARAMS, "p1", "warden_p1_lantern_swing").clip.poiseDamage,
    );
  });

  it("never routes a Wither-typed Warden hit through the 1.4x poise multiplier", () => {
    const params = RAW_COMBAT_PARAMS as { readonly steady: { readonly witherPoiseMultiplier: number } };
    expect(params.steady.witherPoiseMultiplier).toBe(1.4);
    for (const move of [...WARDEN_PARAMS.phases.p1.moves, ...WARDEN_PARAMS.phases.p2.moves]) {
      if (move.clip.damageType === "wither") {
        expect(move.clip.poiseDamage).toBe(0);
      }
    }
  });
});

describe("the quiet", () => {
  it("applies exactly 25 Wither in 6m, zero damage, behind a 30-tick stillness tell", () => {
    const quiet = wardenMove(WARDEN_PARAMS, "p2", WARDEN_PARAMS.quiet.moveId);
    expect(WARDEN_PARAMS.quiet.witherAmount).toBe(25);
    expect(WARDEN_PARAMS.quiet.radiusMeters).toBe(6);
    expect(WARDEN_PARAMS.quiet.pulseDamage).toBe(0);
    expect(quiet.clip.pulseDamage).toBe(0);
    expect(quiet.clip.witherBuildup).toBe(25);
    expect(quiet.clip.tellTicks).toBeGreaterThanOrEqual(
      WARDEN_PARAMS.gates.stillnessTellMinTicks,
    );
    expect(quiet.tellClass).toBe("stillness");
    // Stillness: the clip authors no tracking at all — he stops moving.
    expect(quiet.clip.trackingUntilTick).toBeNull();
    expect(quiet.clip.turnRateRadiansPerTick).toBe(0);
  });

  it("emits one pulse per cast, on the first active tick, with no Pulse damage", () => {
    const quiet = wardenMove(WARDEN_PARAMS, "p2", WARDEN_PARAMS.quiet.moveId);
    let state: WardenState = {
      ...createWardenState({
        x: WARDEN_RING.centerX,
        z: WARDEN_RING.centerZ,
        pulse: 100,
        maxPulse: 100,
      }),
      phase: "p2",
      ceremonyDone: true,
      action: { moveId: quiet.moveId, startedTick: 0, tick: 0 },
      fsm: "committed_move",
    };
    const pulses = [];
    for (let tick = 0; tick < quiet.clip.totalTicks + 1; tick += 1) {
      const stepped = stepWarden(WARDEN_PARAMS, WARDEN_RING, state, {
        targetX: WARDEN_RING.centerX + 1,
        targetZ: WARDEN_RING.centerZ,
      });
      state = stepped.state;
      pulses.push(...stepped.events.filter((event) => event.type === "quiet-pulse"));
    }
    expect(pulses).toHaveLength(1);
    expect(pulses[0]).toEqual({
      type: "quiet-pulse",
      tick: quiet.clip.activeWindows[0]?.startTick,
      witherAmount: 25,
      radiusMeters: 6,
      pulseDamage: 0,
    });
  });

  it("is unreachable in Phase 1", () => {
    expect(WARDEN_PARAMS.phases.p1.moves.map((move) => move.moveId)).not.toContain(
      WARDEN_PARAMS.quiet.moveId,
    );
  });
});
