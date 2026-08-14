/**
 * Golden boss replay (contract deliverable 6). Regenerate after an intentional
 * Warden retune with `npm run replay:regen:boss`, review the fixture diff, then
 * re-run `npm run verify`.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { WARDEN_PARAMS, WARDEN_RING } from "./fixtures.test";
import {
  runWardenGoldenScenario,
  WARDEN_REPLAY_DURATION_TICKS,
  WARDEN_REPLAY_FORMAT_VERSION,
  wardenParamsFingerprint,
} from "./replay";

const here = dirname(fileURLToPath(import.meta.url));
const goldenPath = join(here, "boss_golden_replay.json");

interface BossGolden {
  readonly ceremonyTick: number;
  readonly defeatTick: number;
  readonly durationTicks: number;
  readonly formatVersion: number;
  readonly hashSequence: readonly string[];
  readonly paramsFingerprint: string;
  readonly phaseTwoTick: number;
  readonly selectedMoves: readonly string[];
}

const tickOf = (
  events: ReturnType<typeof runWardenGoldenScenario>["events"],
  predicate: (event: (typeof events)[number]) => boolean,
): number => {
  const found = events.find(predicate);
  if (found === undefined) throw new Error("golden scenario is missing a required beat");
  return found.tick;
};

const snapshotOf = (run: ReturnType<typeof runWardenGoldenScenario>): BossGolden => ({
  ceremonyTick: tickOf(run.events, (event) => event.type === "ceremony-requested"),
  defeatTick: tickOf(run.events, (event) => event.type === "defeated"),
  durationTicks: run.durationTicks,
  formatVersion: run.formatVersion,
  hashSequence: run.hashSequence,
  paramsFingerprint: run.paramsFingerprint,
  phaseTwoTick: tickOf(
    run.events,
    (event) => event.type === "phase-changed" && event.phase === "p2",
  ),
  selectedMoves: run.events.flatMap((event) =>
    event.type === "move-selected" ? [event.moveId] : [],
  ),
});

describe("golden boss replay", () => {
  it("walks P1 → ceremony → P2 → defeat in one scripted run", () => {
    const run = runWardenGoldenScenario(WARDEN_PARAMS, WARDEN_RING);
    const snapshot = snapshotOf(run);
    expect(snapshot.ceremonyTick).toBeLessThan(snapshot.phaseTwoTick);
    expect(snapshot.phaseTwoTick).toBeLessThan(snapshot.defeatTick);
    expect(snapshot.phaseTwoTick - snapshot.ceremonyTick).toBe(
      WARDEN_PARAMS.ceremony.holdTicks,
    );
    expect(run.ceremonyRequests).toBe(1);
    expect(run.aftermathPayloads).toHaveLength(1);
    expect(run.finalState.fsm).toBe("defeated");
    expect(run.finalState.phase).toBe("p2");
    const p1Ids = new Set(WARDEN_PARAMS.phases.p1.moves.map((move) => move.moveId));
    const p2Ids = new Set(WARDEN_PARAMS.phases.p2.moves.map((move) => move.moveId));
    const selectedBefore = run.events.filter(
      (event) => event.type === "move-selected" && event.tick < snapshot.ceremonyTick,
    );
    const selectedAfter = run.events.filter(
      (event) => event.type === "move-selected" && event.tick > snapshot.phaseTwoTick,
    );
    expect(selectedBefore.length).toBeGreaterThan(0);
    expect(selectedAfter.length).toBeGreaterThan(0);
    for (const event of selectedBefore) {
      if (event.type === "move-selected") expect(p1Ids.has(event.moveId)).toBe(true);
    }
    for (const event of selectedAfter) {
      if (event.type === "move-selected") expect(p2Ids.has(event.moveId)).toBe(true);
    }
  });

  it("is byte-stable across two independent runs", () => {
    const first = runWardenGoldenScenario(WARDEN_PARAMS, WARDEN_RING);
    const second = runWardenGoldenScenario(WARDEN_PARAMS, WARDEN_RING);
    expect(second.hashSequence).toEqual(first.hashSequence);
    expect(second.events).toEqual(first.events);
    expect(first.hashSequence).toHaveLength(WARDEN_REPLAY_DURATION_TICKS);
    expect(new Set(first.hashSequence).size).toBeGreaterThan(1);
  });

  it("matches the committed golden hashes (regen: npm run replay:regen:boss)", () => {
    const run = runWardenGoldenScenario(WARDEN_PARAMS, WARDEN_RING);
    const snapshot = snapshotOf(run);

    if (process.env.REGEN_BOSS_GOLDEN === "1") {
      writeFileSync(goldenPath, `${JSON.stringify(snapshot, null, 2)}\n`);
    }

    const golden = JSON.parse(readFileSync(goldenPath, "utf8")) as BossGolden;
    expect(golden.formatVersion).toBe(WARDEN_REPLAY_FORMAT_VERSION);
    expect(golden.paramsFingerprint).toBe(wardenParamsFingerprint(WARDEN_PARAMS));
    expect(snapshot).toEqual(golden);
  });
});
