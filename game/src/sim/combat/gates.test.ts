/**
 * Machine-checked F-gate honesty for the authored tables. Every case here is a
 * gauntlet round-1 finding turned into a permanent gate:
 *
 * - F7 Breath grammar (G2): light Breath cost vs "≤5 lights consecutively at
 *   base" — the old 14 bought seven.
 * - F2 Commitment (O-F11): every cancellable player attack keeps ≥18 locked
 *   recovery ticks, and no cancel opens earlier than recovery−6.
 * - F5 I-frame honesty (G4): the hostile sweep — for every authored contact
 *   window, in all three Burden bands, a roll begun six ticks before the first
 *   contact tick must cover every live contact tick.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { compileCombatData, type CombatMoveData } from "./data";
import { createCombatState, isActorInvulnerable, stepCombat } from "./engine";
import { combatRulesFromData } from "./rules";

const loadJson = (relativePath: string): unknown =>
  JSON.parse(readFileSync(new URL(relativePath, import.meta.url), "utf8"));

const data = compileCombatData(
  loadJson("../../data/frame_data.json"),
  loadJson("../../data/combat_params.json"),
);
const rules = combatRulesFromData(data);

const seed = [
  {
    actorClass: "kalev",
    facingRadians: 0,
    id: "kalev",
    position: { x: 0, y: 0, z: 0 },
  },
] as const;

/**
 * Drives one actor with the attack button held, returning the world tick of
 * every action that actually started.
 */
const runHeldAttack = (durationTicks: number): readonly { tick: number; id: string }[] => {
  let state = createCombatState(rules, seed);
  const started: { tick: number; id: string }[] = [];
  for (let tick = 0; tick < durationTicks; tick += 1) {
    const step = stepCombat(rules, state, [
      {
        actorId: "kalev",
        edge: { action: "attack", pressed: true, sequence: tick, tick },
      },
    ]);
    for (const event of step.events) {
      if (event.kind === "action_started") started.push({ id: event.actionId, tick });
    }
    state = step.state;
  }
  return started;
};

/** The longest prefix whose gaps are all the move's cancel cadence. */
const consecutiveRun = (
  starts: readonly { tick: number; id: string }[],
  cadenceTicks: number,
): number => {
  let run = 0;
  for (const [index, entry] of starts.entries()) {
    const previous = starts[index - 1];
    if (previous !== undefined && entry.tick - previous.tick !== cadenceTicks) break;
    run += 1;
  }
  return run;
};

const playerAttackMoves = (): readonly CombatMoveData[] =>
  Object.values(data.frameData.moves).filter(
    (move) =>
      move.actorClass === "kalev" &&
      move.kind === "attack" &&
      !move.tags.includes("critical"),
  );

const cancelTailFor = (move: CombatMoveData): number =>
  move.cancelTailTicks ?? data.params.buffers.recoveryCancelTailTicks;

describe("F7 Breath grammar", () => {
  it("buys exactly five light attacks from a full bar at base", () => {
    const light = data.frameData.moves.light1;
    expect(light).toBeDefined();
    if (light === undefined) return;
    expect(light.breathCost).toBe(data.params.breath.costs.lightAttack);
    expect(Math.floor(data.params.breath.baseMaximum / light.breathCost)).toBe(5);
  });

  it("denies the sixth consecutive light at the cancel cadence", () => {
    const light = data.frameData.moves.light1;
    expect(light).toBeDefined();
    if (light === undefined) return;
    const cadence = light.totalTicks - cancelTailFor(light);
    const starts = runHeldAttack(cadence * 8);
    expect(starts.every((entry) => entry.id === "light1")).toBe(true);
    expect(consecutiveRun(starts, cadence)).toBe(5);
  });

  it("keeps rolls at four consecutive presses from a full bar at base", () => {
    // "At base" is the medium Burden band — the loadout the gate is written for.
    expect(
      Math.floor(
        data.params.breath.baseMaximum / data.params.rolls.bands.medium.breathCost,
      ),
    ).toBe(4);
  });
});

describe("F2 commitment", () => {
  it("locks at least eighteen recovery ticks on every cancellable player attack", () => {
    for (const move of playerAttackMoves()) {
      expect(move.recoveryTicks - cancelTailFor(move), move.id).toBeGreaterThanOrEqual(18);
    }
  });

  it("never opens a cancel earlier than the authored recovery−6 floor", () => {
    for (const move of playerAttackMoves()) {
      expect(cancelTailFor(move), move.id).toBeLessThanOrEqual(
        data.params.buffers.recoveryCancelTailTicks,
      );
    }
  });

  it("agrees with the engine about the first cancellable tick of a light attack", () => {
    const light = data.frameData.moves.light1;
    expect(light).toBeDefined();
    if (light === undefined) return;
    const cadence = light.totalTicks - cancelTailFor(light);
    const starts = runHeldAttack(cadence + 2);
    expect(starts.map((entry) => entry.tick)).toEqual([0, cadence]);
  });
});

describe("F5 i-frame honesty — hostile contact sweep", () => {
  /**
   * Live contact is a damaging swing. "The quiet" is fed as an area Wither pulse
   * and never as a swing, so its twelve-tick window is not a contact window;
   * flask/guard/roll/ceremony rows are not attacks at all.
   */
  const contactMoves = (): readonly CombatMoveData[] =>
    Object.values(data.frameData.moves).filter(
      (move) => move.kind === "attack" && move.pulseDamage > 0,
    );

  /**
   * `warden_p2_charge_through` collapses its authored 6-tick contact and 24-tick
   * travel into one row (round-1 standing watch item (c), owned by the boss
   * slice). It is the only contact window longer than the eight ticks a ±6 roll
   * can cover, and this guard fails the moment a second one appears.
   */
  it("has no contact window longer than eight ticks outside the tracked collapsed row", () => {
    const longWindows = contactMoves().flatMap((move) =>
      move.activeWindows
        .filter(([start, end]) => end - start > 8)
        .map(() => move.id),
    );
    expect([...new Set(longWindows)]).toEqual(["warden_p2_charge_through"]);
  });

  it("covers every live contact tick with a roll begun six ticks before contact", () => {
    const leadTicks = 6;
    for (const move of contactMoves()) {
      for (const [contactStart, contactEnd] of move.activeWindows) {
        if (contactEnd - contactStart > 8) continue;
        for (const band of ["light", "medium", "heavy"] as const) {
          const rollId = `roll_${band}`;
          let state = createCombatState(rules, [{ ...seed[0], rollBand: band }]);
          state = stepCombat(rules, state, [
            {
              actorId: "kalev",
              edge: { action: "roll", pressed: true, sequence: 0, tick: 0 },
            },
          ]).state;
          // The roll starts on the tick it is pressed; contact opens `leadTicks`
          // later and runs for the authored window length.
          for (let tick = 1; tick <= leadTicks + (contactEnd - contactStart); tick += 1) {
            if (tick >= leadTicks) {
              expect(
                isActorInvulnerable(rules, state, "kalev"),
                `${move.id} [${String(contactStart)},${String(contactEnd)}) ${rollId} contact tick ${String(tick - leadTicks)}`,
              ).toBe(true);
            }
            state = stepCombat(rules, state, []).state;
          }
        }
      }
    }
  });
});
