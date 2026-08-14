import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  CombatDataError,
  REQUIRED_COMBAT_MOVE_IDS,
  compileCombatData,
} from "./data";

const loadJson = (relativePath: string): unknown =>
  JSON.parse(readFileSync(new URL(relativePath, import.meta.url), "utf8"));

const canonicalFrame = (): unknown => loadJson("../../data/frame_data.json");
const canonicalParams = (): unknown => loadJson("../../data/combat_params.json");

const asRecord = (value: unknown): Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Expected object fixture.");
  }
  return value as Record<string, unknown>;
};

const reversedKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(reversedKeys);
  }
  if (typeof value !== "object" || value === null) {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .reverse()
      .map(([key, entry]) => [key, reversedKeys(entry)]),
  );
};

const expectDataIssues = (
  frame: unknown,
  params: unknown,
): readonly string[] => {
  try {
    compileCombatData(frame, params);
  } catch (error: unknown) {
    if (error instanceof CombatDataError) {
      return error.issues.map((issue) => issue.path);
    }
    throw error;
  }
  throw new Error("Expected combat data validation to fail.");
};

describe("compileCombatData", () => {
  it("compiles the canonical tables into immutable half-open frame data", () => {
    const compiled = compileCombatData(
      canonicalFrame(),
      canonicalParams(),
    );

    expect(compiled.frameData.moves.light1).toMatchObject({
      id: "light1",
      startupTicks: 11,
      activeTicks: 4,
      recoveryTicks: 20,
      totalTicks: 35,
      activeWindows: [[11, 15]],
    });
    expect(compiled.frameData.moves.heavy?.hyperarmorWindow).toEqual([18, 30]);
    expect(compiled.params.rolls.bands.medium.iframes).toEqual([2, 15]);
    expect(compiled.fingerprint).toMatch(/^[0-9a-f]{16}$/u);
    expect(Object.isFrozen(compiled)).toBe(true);
    expect(Object.isFrozen(compiled.frameData.moves.light1)).toBe(true);
  });

  it("contains every S11 move family and exact binding tuning rows", () => {
    const compiled = compileCombatData(canonicalFrame(), canonicalParams());

    expect(Object.keys(compiled.frameData.moves)).toEqual(
      expect.arrayContaining([...REQUIRED_COMBAT_MOVE_IDS]),
    );
    expect(compiled.frameData.moves.lunge).toMatchObject({
      startupTicks: 30,
      activeTicks: 8,
      recoveryTicks: 22,
      totalTicks: 60,
      witherBuildup: 0,
    });
    expect(compiled.frameData.moves.warden_p1_two_step_chop?.activeWindows).toEqual([
      [26, 30],
      [44, 48],
    ]);
    expect(
      compiled.frameData.moves.warden_p2_three_string_sweep?.activeWindows,
    ).toEqual([
      [20, 24],
      [36, 40],
      [56, 60],
    ]);
    expect(compiled.frameData.moves.warden_ceremony).toMatchObject({
      totalTicks: 90,
      pulseDamage: 0,
      iframes: [[0, 90]],
    });
    expect(compiled.frameData.moves.warden_p2_the_quiet).toMatchObject({
      pulseDamage: 0,
      witherBuildup: 25,
    });
    expect(compiled.params.breath).toMatchObject({
      baseMaximum: 100,
      regenPerSecond: 45,
      regenDelayTicks: 33,
      guardingRegenMultiplier: 0.4,
    });
    expect(compiled.params.steady.classes).toMatchObject({
      kalev: { base: 20 },
      wolf: { base: 12 },
      warden_p1: { base: 65 },
      warden_p2: { base: 80 },
    });
    expect(compiled.params.hitstop).toMatchObject({
      lightTicks: 3,
      heavyTicks: 6,
      chargedTicks: 8,
      blockedTicks: 5,
      guardBreakTicks: 9,
      criticalTicks: 12,
    });
    expect(compiled.params.buffers).toMatchObject({
      attackTicks: 10,
      rollTicks: 12,
      flaskTicks: 12,
      capacityPerAction: 1,
      recoveryCancelTailTicks: 6,
    });
    expect(compiled.params.defense).toMatchObject({
      guardCostIncomingMultiplier: 0.35,
      guardBreakStaggerTicks: 60,
      criticalCommittedTicks: 90,
      criticalIframes: [0, 81],
    });
    expect(compiled.params.collision).toMatchObject({
      substepsPerTick: 3,
      gridCellSizeMeters: 2,
    });
  });

  it("clones input data, deeply freezes output, and hashes independent of key order", () => {
    const frame = canonicalFrame();
    const params = canonicalParams();
    const compiled = compileCombatData(frame, params);

    const moves = asRecord(asRecord(frame).moves);
    asRecord(moves.light1).pulseDamage = 999;

    expect(compiled.frameData.moves.light1?.pulseDamage).toBe(28);
    expect(
      Reflect.set(compiled.frameData.moves.light1?.knockback ?? {}, "forwardMeters", 999),
    ).toBe(false);
    expect(
      compileCombatData(reversedKeys(canonicalFrame()), reversedKeys(canonicalParams()))
        .fingerprint,
    ).toBe(compiled.fingerprint);
  });

  it("rejects unknown keys, unsupported enums and versions, and inconsistent phases", () => {
    const frame = canonicalFrame();
    const params = canonicalParams();
    const moves = asRecord(asRecord(frame).moves);
    const light1 = asRecord(moves.light1);
    asRecord(asRecord(params).buffers).surprise = true;
    asRecord(frame).schemaVersion = 2;
    light1.actorClass = "dragon";
    light1.totalTicks = 36;

    expect(expectDataIssues(frame, params)).toEqual(
      expect.arrayContaining([
        "$.frameData.schemaVersion",
        "$.frameData.moves.light1.actorClass",
        "$.frameData.moves.light1.totalTicks",
        "$.params.buffers.surprise",
      ]),
    );
  });

  it("rejects an ordinary move whose active window drifts from its startup phase", () => {
    const frame = canonicalFrame();
    const moves = asRecord(asRecord(frame).moves);
    asRecord(moves.light1).activeWindows = [[10, 14]];

    expect(expectDataIssues(frame, canonicalParams())).toContain(
      "$.frameData.moves.light1.activeWindows",
    );
  });

  it("locks collision substeps and per-move tracking rates to the authored solver bounds", () => {
    const frame = canonicalFrame();
    const params = canonicalParams();
    asRecord(asRecord(params).collision).substepsPerTick = 4;
    asRecord(asRecord(asRecord(frame).moves).light1).turnRateRadiansPerTick = 1;

    expect(expectDataIssues(frame, params)).toEqual(
      expect.arrayContaining([
        "$.frameData.moves.light1.turnRateRadiansPerTick",
        "$.params.collision.substepsPerTick",
      ]),
    );
  });

  it("matches every overlapping Blender pipeline clip", () => {
    const compiled = compileCombatData(canonicalFrame(), canonicalParams());
    const blender = asRecord(loadJson("../../../tools/blender/frame_data_v0.json"));
    const blenderMoves = asRecord(blender.moves);

    for (const [id, rawEntry] of Object.entries(blenderMoves)) {
      const sourceMove = asRecord(rawEntry);
      const move = compiled.frameData.moves[id];
      expect(move, `${id} must exist in canonical frame data`).toBeDefined();
      if (move === undefined) {
        continue;
      }
      expect(move.totalTicks, `${id}.ticks`).toBe(sourceMove.ticks);
      if (typeof sourceMove.startup === "number") {
        expect(move.startupTicks, `${id}.startup`).toBe(sourceMove.startup);
        expect(move.activeTicks, `${id}.active`).toBe(sourceMove.active);
        expect(move.recoveryTicks, `${id}.recovery`).toBe(sourceMove.recovery);
      }
      if (typeof sourceMove.trackingUntil === "number") {
        expect(move.trackingUntilTick, `${id}.trackingUntil`).toBe(
          sourceMove.trackingUntil,
        );
      }
      if (typeof sourceMove.breath === "number") {
        expect(move.breathCost, `${id}.breath`).toBe(sourceMove.breath);
      }
      if (typeof sourceMove.poiseDamage === "number") {
        expect(move.poiseDamage, `${id}.poiseDamage`).toBe(
          sourceMove.poiseDamage,
        );
      }
      if (Array.isArray(sourceMove.hyperarmor)) {
        const inclusive = sourceMove.hyperarmor;
        expect(move.hyperarmorWindow, `${id}.hyperarmor`).toEqual([
          inclusive[0],
          Number(inclusive[1]) + 1,
        ]);
      }
      if (Array.isArray(sourceMove.iframes)) {
        const inclusive = sourceMove.iframes;
        expect(move.iframes[0], `${id}.iframes`).toEqual([
          inclusive[0],
          Number(inclusive[1]) + 1,
        ]);
      }
      if (typeof sourceMove.enter === "number") {
        expect(move.startupTicks, `${id}.enter`).toBe(sourceMove.enter);
        expect(move.activeTicks, `${id}.hold`).toBe(sourceMove.hold);
        expect(move.recoveryTicks, `${id}.exit`).toBe(sourceMove.exit);
      }
    }
  });
});
