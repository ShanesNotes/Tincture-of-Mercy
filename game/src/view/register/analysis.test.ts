import { describe, expect, it } from "vitest";

import { analyzeFrame } from "./analysis";
import { PALETTE_LAW, hexToRgb } from "./palette";

const OPTIONS = { deltaETolerance: 6, minBandPopulation: 0.02 } as const;

/** Build a solid-color fixture frame. */
const solidFrame = (hex: string, width = 64, height = 64): Uint8Array => {
  const { r, g, b } = hexToRgb(hex);
  const rgba = new Uint8Array(width * height * 4);
  for (let p = 0; p < width * height; p += 1) {
    rgba[p * 4] = r;
    rgba[p * 4 + 1] = g;
    rgba[p * 4 + 2] = b;
    rgba[p * 4 + 3] = 255;
  }
  return rgba;
};

/** Build a frame from horizontal stripes of the given hexes (equal height). */
const stripedFrame = (hexes: readonly string[], width = 64, height = 60): Uint8Array => {
  const rgba = new Uint8Array(width * height * 4);
  const stripeHeight = Math.floor(height / hexes.length);
  hexes.forEach((hex, index) => {
    const { r, g, b } = hexToRgb(hex);
    for (let y = index * stripeHeight; y < (index + 1) * stripeHeight; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const o = (y * width + x) * 4;
        rgba[o] = r;
        rgba[o + 1] = g;
        rgba[o + 2] = b;
        rgba[o + 3] = 255;
      }
    }
  });
  // Fill any remainder rows with the last stripe.
  const last = hexToRgb(hexes[hexes.length - 1] ?? "#000000");
  for (let y = stripeHeight * hexes.length; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const o = (y * width + x) * 4;
      rgba[o] = last.r;
      rgba[o + 1] = last.g;
      rgba[o + 2] = last.b;
      rgba[o + 3] = 255;
    }
  }
  return rgba;
};

describe("analyzeFrame", () => {
  it("scores a declared solid color as fully within covenant (A1)", () => {
    const stats = analyzeFrame(solidFrame("#365a49"), 64, 64, PALETTE_LAW, OPTIONS);
    expect(stats.covenantCoverage).toBe(1);
    expect(stats.meanDeltaE).toBe(0);
    expect(stats.familyShares.green).toBe(1);
  });

  it("scores an off-palette scarlet as outside the covenant (A1)", () => {
    const stats = analyzeFrame(solidFrame("#ff2020"), 64, 64, PALETTE_LAW, OPTIONS);
    expect(stats.covenantCoverage).toBe(0);
  });

  it("counts an off-palette scarlet against the red budget (A3 hue mask)", () => {
    const stats = analyzeFrame(solidFrame("#ff2020"), 64, 64, PALETTE_LAW, OPTIONS);
    expect(stats.oxbloodCoverage).toBe(1);
  });

  it("measures oxblood coverage proportionally (A3)", () => {
    // 4 stripes, one oxblood → ~25% red coverage.
    const stats = analyzeFrame(
      stripedFrame(["#f8f1e5", "#365a49", "#7e2531", "#6b6156"]),
      64,
      60,
      PALETTE_LAW,
      OPTIONS,
    );
    expect(stats.oxbloodCoverage).toBeGreaterThan(0.2);
    expect(stats.oxbloodCoverage).toBeLessThan(0.3);
  });

  it("reads stepped declared values as distinct grayscale bands (A4)", () => {
    // 6 stripes spanning ink → parchment: the grayscale histogram must keep
    // the structure (≥4 populated bands), proving value-only readability.
    const stats = analyzeFrame(
      stripedFrame(["#211b17", "#443f38", "#6b6156", "#8a7f6b", "#c2b8a6", "#f8f1e5"]),
      64,
      60,
      PALETTE_LAW,
      OPTIONS,
    );
    expect(stats.grayscaleBands).toBeGreaterThanOrEqual(4);
    expect(stats.grayscaleStdDev).toBeGreaterThan(24);
  });

  it("collapses a flat frame to one grayscale band (A4 negative case)", () => {
    const stats = analyzeFrame(solidFrame("#6b6156"), 64, 64, PALETTE_LAW, OPTIONS);
    expect(stats.grayscaleBands).toBe(1);
    expect(stats.grayscaleStdDev).toBeLessThan(1);
  });

  it("detects ink outlines as elevated edge density (A6)", () => {
    // Parchment field with a thin ink cross — edges dominate the ink mass.
    const width = 64;
    const height = 64;
    const rgba = solidFrame("#f8f1e5", width, height);
    const ink = hexToRgb("#211b17");
    for (let i = 0; i < width; i += 1) {
      for (const [x, y] of [
        [i, 32],
        [32, i],
      ] as const) {
        const o = (y * width + x) * 4;
        rgba[o] = ink.r;
        rgba[o + 1] = ink.g;
        rgba[o + 2] = ink.b;
      }
    }
    const stats = analyzeFrame(rgba, width, height, PALETTE_LAW, OPTIONS);
    expect(stats.inkEdgeDensity).toBeGreaterThan(0.02);
    // A solid ink frame has ink but no edges.
    const solid = analyzeFrame(solidFrame("#211b17"), 64, 64, PALETTE_LAW, OPTIONS);
    expect(solid.inkEdgeDensity).toBeLessThan(0.001);
  });

  it("tracks gold coverage for the L9 budget cross-check", () => {
    const stats = analyzeFrame(
      stripedFrame(["#a87a2e", "#f8f1e5", "#365a49", "#211b17"]),
      64,
      60,
      PALETTE_LAW,
      OPTIONS,
    );
    expect(stats.goldCoverage).toBeGreaterThan(0.2);
    expect(stats.goldCoverage).toBeLessThan(0.3);
  });
});
