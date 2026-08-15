import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { PROGRESSION_PARAMS, TINCTURE_PARAMS } from "./data";
import type { PouchItemId, TinctureVariantId } from "./types";

const readJson = (relative: string): unknown =>
  JSON.parse(readFileSync(new URL(relative, import.meta.url), "utf8")) as unknown;

/** `_`-prefixed keys are provenance notes in the JSON, not data. */
const strip = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(strip);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !key.startsWith("_"))
        .map(([key, entry]) => [key, strip(entry)]),
    );
  }
  return value;
};

const tinctureJson = readJson("../../data/tincture_params.json");
const progressionJson = readJson("../../data/progression_params.json");

describe("data files are the source of truth", () => {
  it("tincture_params.json matches the typed mirror", () => {
    expect(strip(tinctureJson)).toEqual(TINCTURE_PARAMS);
  });

  it("progression_params.json matches the typed mirror", () => {
    expect(strip(progressionJson)).toEqual(PROGRESSION_PARAMS);
  });
});

describe("data laws", () => {
  it("the pouch is the canon 15 entries and every one has a starting count", () => {
    expect(TINCTURE_PARAMS.pouch.items).toHaveLength(15);
    expect(TINCTURE_PARAMS.pouch.items).toContain("ember");
    for (const item of TINCTURE_PARAMS.pouch.items) {
      expect(TINCTURE_PARAMS.pouch.starting[item]).toBeTypeOf("number");
    }
  });

  it("Ember is non-craftable and appears in no recipe", () => {
    expect(TINCTURE_PARAMS.ember.craftable).toBe(false);
    expect(TINCTURE_PARAMS.pouch.nonCraftable).toContain("ember");
    for (const recipe of Object.values(TINCTURE_PARAMS.recipes)) {
      for (const item of TINCTURE_PARAMS.pouch.nonCraftable) {
        expect(recipe[item]).toBeUndefined();
      }
    }
  });

  it("every variant has a recipe and every recipe ingredient is in the pouch", () => {
    const variants = Object.keys(TINCTURE_PARAMS.variants) as TinctureVariantId[];
    expect(Object.keys(TINCTURE_PARAMS.recipes).sort()).toEqual([...variants].sort());
    for (const recipe of Object.values(TINCTURE_PARAMS.recipes)) {
      for (const item of Object.keys(recipe) as PouchItemId[]) {
        expect(TINCTURE_PARAMS.pouch.items).toContain(item);
      }
    }
  });

  it("over-time healing divides into whole pulses", () => {
    const honeyed = TINCTURE_PARAMS.variants.honeyed_draw;
    expect(honeyed.kind).toBe("overTime");
    if (honeyed.kind === "overTime") {
      expect(honeyed.ticks % honeyed.intervalTicks).toBe(0);
    }
  });

  it("no craftable dose can heal as much as a full restore", () => {
    // Underwrites the D6 canon law tested in numbness.test.ts: Ember restores to
    // maxPulse, so no variant may be authored at or above the base maxPulse.
    const basePulse = PROGRESSION_PARAMS.attributes.pulse.base;
    for (const variant of Object.values(TINCTURE_PARAMS.variants)) {
      const heal =
        variant.kind === "overTime"
          ? variant.totalHealPulse
          : "healPulse" in variant
            ? variant.healPulse
            : 0;
      expect(heal).toBeLessThan(basePulse);
    }
  });

  it("attribute curves cover the whole point range", () => {
    const cap = PROGRESSION_PARAMS.level.maxPointsPerAttribute;
    for (const curve of Object.values(PROGRESSION_PARAMS.attributes)) {
      const last = curve.segments[curve.segments.length - 1];
      expect(last?.toPoints).toBeGreaterThanOrEqual(cap);
    }
  });

  it("Burden bands are the TUNING_V0 30%/70% thresholds", () => {
    expect(PROGRESSION_PARAMS.burden.lightMaxPercent).toBe(30);
    expect(PROGRESSION_PARAMS.burden.mediumMaxPercent).toBe(70);
  });

  it("ambient Wither is 0.5/s = 1/120 per tick", () => {
    expect(TINCTURE_PARAMS.ambientWither.perSecond).toBe(0.5);
    expect(TINCTURE_PARAMS.ambientWither.ticksPerSecond).toBe(60);
    expect(
      TINCTURE_PARAMS.ambientWither.perSecond / TINCTURE_PARAMS.ambientWither.ticksPerSecond,
    ).toBe(1 / 120);
  });

  it("Ember is 2 doses, 1200 ticks of surge (TUNING_V0 verbatim)", () => {
    expect(TINCTURE_PARAMS.ember.startingDoses).toBe(2);
    expect(TINCTURE_PARAMS.pouch.starting.ember).toBe(TINCTURE_PARAMS.ember.startingDoses);
    expect(TINCTURE_PARAMS.ember.surgeTicks).toBe(1200);
  });

  it("Numbness costs are D6 verbatim", () => {
    expect(TINCTURE_PARAMS.numbness.healingPenaltyPercentPerStack).toBe(8);
    expect(TINCTURE_PARAMS.numbness.turnBuildupPercentPerStack).toBe(25);
    expect(TINCTURE_PARAMS.numbness.registerStepPerStack).toBe(1);
    expect(TINCTURE_PARAMS.numbness.maxTextStep).toBe(3);
  });
});
