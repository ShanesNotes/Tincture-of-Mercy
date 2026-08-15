import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { actionDurationTicks, parseWolfAiParams } from "./params";

const loadCommittedParams = () =>
  parseWolfAiParams(
    JSON.parse(
      readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../data/wolf_ai_params.json"), "utf8"),
    ) as unknown,
  );

describe("wolf_ai_params", () => {
  const params = loadCommittedParams();

  it("carries every ENCOUNTERS / TUNING_V0 wolf number verbatim", () => {
    expect(params.tickHz).toBe(60);
    expect(params.wither.appliesWither).toBe(false);
    expect(params.token.ringRadiusM).toBe(3.5);
    expect(params.token.releaseTicksAfterResolution).toBe(45);
    expect(params.leash.radiusM).toBe(25);
    expect(params.flee.pulseRatio).toBe(0.25);
    expect(params.flee.returnTicks).toBe(2400);
    expect(params.howl.aggressionDelta).toBe(1);
    expect(params.telegraphs.lunge).toMatchObject({
      startupTicks: 30,
      activeTicks: 8,
      recoveryTicks: 22,
    });
    expect(params.telegraphs.harrier.startupTicks).toBe(16);
  });

  it("meets the F3 telegraph floor on every wolf active", () => {
    expect(params.telegraphs.lunge.startupTicks).toBeGreaterThanOrEqual(12);
    expect(params.telegraphs.harrier.startupTicks).toBeGreaterThanOrEqual(12);
    expect(params.telegraphs.baiterFeint.startupTicks).toBeGreaterThanOrEqual(12);
    expect(params.howl.startupTicks).toBeGreaterThanOrEqual(12);
  });

  it("includes perception ranges, cones, hearing radii, and alert timers", () => {
    expect(params.perception.sightRangeM).toBeGreaterThan(0);
    expect(params.perception.sightHalfAngleDeg).toBeGreaterThan(0);
    expect(params.perception.hearingRadiusM.footstep).toBeLessThan(params.perception.hearingRadiusM.attack);
    expect(params.perception.hearingRadiusM.attack).toBeLessThan(params.perception.hearingRadiusM.howl);
    expect(params.perception.hearingRadiusM.howl).toBeGreaterThan(params.leash.radiusM);
    expect(params.perception.suspiciousTicks).toBeGreaterThan(0);
    expect(params.perception.alertHoldTicks).toBeGreaterThan(0);
  });

  it("rejects a missing required field", () => {
    expect(() => parseWolfAiParams({ version: 1 })).toThrow(/must be an object/);
  });

  it("rejects any Wither-applying pack", () => {
    const raw = JSON.parse(
      readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../data/wolf_ai_params.json"), "utf8"),
    ) as { wither: { appliesWither: boolean } };
    raw.wither.appliesWither = true;
    expect(() => parseWolfAiParams(raw)).toThrow(/zero Wither/);
  });

  it("sums lunge clip length to 60t", () => {
    expect(actionDurationTicks(params, "lunge")).toBe(60);
  });

  it("derives the baiter feint clock from frame_data, not a second table", () => {
    const frameData = JSON.parse(
      readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../data/frame_data.json"), "utf8"),
    ) as {
      readonly moves: {
        readonly wolf_baiter_feint: {
          readonly startupTicks: number;
          readonly activeTicks: number;
          readonly recoveryTicks: number;
        };
      };
    };
    const feint = frameData.moves.wolf_baiter_feint;
    expect(params.telegraphs.baiterFeint.startupTicks).toBe(feint.startupTicks);
    expect(params.telegraphs.baiterFeint.activeTicks).toBe(feint.activeTicks);
    expect(params.telegraphs.baiterFeint.recoveryTicks).toBe(feint.recoveryTicks);
    expect(actionDurationTicks(params, "feint")).toBe(
      feint.startupTicks + feint.activeTicks + feint.recoveryTicks,
    );
  });
});
