/**
 * Border-state diff coverage (L10 / gate A5; slice contract: "renders each
 * state ... and asserts every adjacent pair differs (A5 ≥3 states requirement
 * exceeded)"). The browser half — real screenshot diffs over ≥4 states — is
 * e2e/hud.spec.ts; here the serialized border descriptor stands in as the
 * DOM snapshot: the view stamps only descriptor fields, so distinct
 * descriptors guarantee distinct renders.
 */

import { describe, expect, it } from "vitest";

import { descriptorFromModel, serializeDescriptor } from "./descriptor";
import { HUD_FIXTURES, HUD_FIXTURE_ORDER, type HudFixtureName } from "./fixtures";
import { deriveHudModel } from "./model";
import { HUD_PARAMS } from "./params";
import type { HudInput } from "./types";

const descriptorOf = (name: HudFixtureName) => descriptorFromModel(deriveHudModel(HUD_FIXTURES[name]));

const withTurn = (turn: number): HudInput => ({ ...HUD_FIXTURES.road_wild, turn, turnCap: 100 });

describe("enumerable verdict states (L10)", () => {
  it("covers every HB3 state class across the fixture set", () => {
    expect(HUD_FIXTURE_ORDER.length).toBeGreaterThanOrEqual(5); // A5 asks for 3
    const all = HUD_FIXTURE_ORDER.map(descriptorOf);
    expect(all.some((d) => d.hearth === "lit")).toBe(true);
    expect(all.some((d) => d.hearth === "unlit")).toBe(true);
    expect(all.some((d) => d.turnStep > 0)).toBe(true); // Turn advance narrowing
    expect(all.some((d) => d.bossPhase !== "none")).toBe(true);
    expect(all.some((d) => d.bossPhase === "ceremony")).toBe(true);
    expect(all.some((d) => d.unwrittenTag)).toBe(true);
    expect(all.some((d) => d.numbnessStep >= 2)).toBe(true);
    expect(all.some((d) => d.turned)).toBe(true);
    expect(all.some((d) => d.ornamentFamily === "thorn")).toBe(true);
    expect(all.some((d) => d.ornamentFamily === "filigree")).toBe(true);
  });

  it("every adjacent fixture pair produces a different render spec", () => {
    const serialized = HUD_FIXTURE_ORDER.map((name) => serializeDescriptor(descriptorOf(name)));
    for (const [index, current] of serialized.entries()) {
      const previous = serialized[index - 1];
      if (previous === undefined) {
        continue;
      }
      expect(
        current,
        `${HUD_FIXTURE_ORDER[index - 1] ?? "?"} vs ${HUD_FIXTURE_ORDER[index] ?? "?"} must differ`,
      ).not.toBe(previous);
    }
  });

  it("every fixture differs from the base state", () => {
    const [first, ...rest] = HUD_FIXTURE_ORDER.map((name) =>
      serializeDescriptor(descriptorOf(name)),
    );
    for (const current of rest) {
      expect(current).not.toBe(first);
    }
  });
});

describe("the Turn narrowing geometry (D6/HB3)", () => {
  it("the margin inset grows with the Turn stop, on all four sides (single inset)", () => {
    const insets = [0, 40, 80, 100].map(
      (turn) => descriptorFromModel(deriveHudModel(withTurn(turn))).marginInsetPx,
    );
    for (const [index, inset] of insets.entries()) {
      const previous = insets[index - 1];
      if (previous !== undefined) {
        expect(inset).toBeGreaterThan(previous);
      }
    }
    expect(insets[0]).toBe(HUD_PARAMS.turn.baseInsetPx);
  });

  it("Pulse renders as stepped lit-vellum fractions, never continuous", () => {
    const fractions = new Set<number>();
    for (let pulse = 0; pulse <= 100; pulse += 1) {
      fractions.add(
        descriptorFromModel(
          deriveHudModel({ ...HUD_FIXTURES.road_wild, pulse, maxPulse: 100 }),
        ).pulseFraction,
      );
    }
    // HB5: 2–3 stops — we ship 3 lit stops + empty = 4 distinct heights total.
    expect(fractions.size).toBe(HUD_PARAMS.meters.litStops + 1);
  });
});
