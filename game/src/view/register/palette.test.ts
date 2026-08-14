import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  PALETTE_LAW,
  declaredColors,
  deltaE2000,
  deltaEHex,
  depthShiftedStops,
  hexToLab,
  hexToRgb,
  rgbToHex,
  srgbToLab,
  srgbToLinear,
  validatePalette,
  type Lab,
  type PaletteLaw,
} from "./palette";

describe("deltaE2000", () => {
  // Reference vectors from Sharma, Wu & Dalal (2005), "The CIEDE2000
  // Color-Difference Formula", Table 1 — the standard conformance set.
  const vectors: readonly (readonly [Lab, Lab, number])[] = [
    [{ l: 50.0, a: 2.6772, b: -79.7751 }, { l: 50.0, a: 0.0, b: -82.7485 }, 2.0425],
    [{ l: 50.0, a: 3.1571, b: -77.2803 }, { l: 50.0, a: 0.0, b: -82.7485 }, 2.8615],
    [{ l: 50.0, a: 2.8361, b: -74.02 }, { l: 50.0, a: 0.0, b: -82.7485 }, 3.4412],
    [{ l: 50.0, a: -1.3802, b: -84.2814 }, { l: 50.0, a: 0.0, b: -82.7485 }, 1.0],
    [{ l: 50.0, a: -1.1848, b: -84.8006 }, { l: 50.0, a: 0.0, b: -82.7485 }, 1.0],
    [{ l: 50.0, a: -0.9009, b: -85.5211 }, { l: 50.0, a: 0.0, b: -82.7485 }, 1.0],
    [{ l: 50.0, a: 0.0, b: 0.0 }, { l: 50.0, a: -1.0, b: 2.0 }, 2.3669],
    [{ l: 50.0, a: -1.0, b: 2.0 }, { l: 50.0, a: 0.0, b: 0.0 }, 2.3669],
    [{ l: 50.0, a: 2.49, b: -0.001 }, { l: 50.0, a: -2.49, b: 0.0009 }, 7.1792],
    [{ l: 50.0, a: 2.49, b: -0.001 }, { l: 50.0, a: -2.49, b: 0.001 }, 7.1792],
    [{ l: 50.0, a: 2.49, b: -0.001 }, { l: 50.0, a: -2.49, b: 0.0011 }, 7.2195],
    [{ l: 50.0, a: 2.49, b: -0.001 }, { l: 50.0, a: -2.49, b: 0.0012 }, 7.2195],
    [{ l: 60.2574, a: -34.0099, b: 36.2677 }, { l: 60.4626, a: -34.1751, b: 39.4387 }, 1.2644],
    [{ l: 22.7233, a: 20.0904, b: -46.694 }, { l: 23.0331, a: 14.973, b: -42.5619 }, 2.0373],
    [{ l: 35.0831, a: -44.1164, b: 3.7933 }, { l: 35.0232, a: -40.0716, b: 1.5901 }, 1.8645],
  ];

  it.each(vectors)("matches Sharma reference %j", (a, b, expected) => {
    expect(deltaE2000(a, b)).toBeCloseTo(expected, 4);
  });

  it("is zero for identical colors and symmetric for the identity case", () => {
    const lab = hexToLab("#7e2531");
    expect(deltaE2000(lab, lab)).toBe(0);
  });
});

describe("color conversions", () => {
  it("round-trips hex → rgb → hex", () => {
    expect(rgbToHex(hexToRgb("#a87a2e"))).toBe("#a87a2e");
    expect(rgbToHex(hexToRgb("#211b17"))).toBe("#211b17");
  });

  it("converts sRGB white to Lab L≈100", () => {
    const lab = srgbToLab({ r: 255, g: 255, b: 255 });
    expect(lab.l).toBeCloseTo(100, 1);
    expect(Math.abs(lab.a)).toBeLessThan(0.1);
    expect(Math.abs(lab.b)).toBeLessThan(0.1);
  });

  it("linearizes sRGB channels per IEC 61966-2-1", () => {
    const linear = srgbToLinear({ r: 255, g: 128, b: 0 });
    expect(linear.r).toBeCloseTo(1, 6);
    expect(linear.g).toBeCloseTo(0.2158605, 4);
    expect(linear.b).toBe(0);
  });
});

describe("palette law", () => {
  it("declares exactly the 7 L2 tokens", () => {
    expect(Object.keys(PALETTE_LAW.tokens).sort()).toEqual(
      ["blue", "gold", "green", "ink", "oxblood", "parchment", "rose"].sort(),
    );
    expect(PALETTE_LAW.tokens.parchment).toBe("#f8f1e5");
    expect(PALETTE_LAW.tokens.ink).toBe("#211b17");
    expect(PALETTE_LAW.tokens.oxblood).toBe("#7e2531");
    expect(PALETTE_LAW.tokens.gold).toBe("#a87a2e");
    expect(PALETTE_LAW.tokens.green).toBe("#365a49");
    expect(PALETTE_LAW.tokens.blue).toBe("#263d5e");
    expect(PALETTE_LAW.tokens.rose).toBe("#b07a83");
  });

  it("passes its own validity invariants (ΔE-valid ramp steps)", () => {
    expect(validatePalette(PALETTE_LAW)).toEqual([]);
  });

  it("rejects a ramp whose steps are not ΔE-separated", () => {
    const broken: PaletteLaw = {
      ...PALETTE_LAW,
      families: [
        { name: "bad", token: "green", stops: ["#365a49", "#375a4a"], flatCarrier: false },
      ],
    };
    expect(validatePalette(broken).some((e) => e.includes("bad"))).toBe(true);
  });

  it("rejects band counts outside the L5 3–4 band law", () => {
    const broken: PaletteLaw = { ...PALETTE_LAW, depthBandBlueShift: [0, 0.5] };
    expect(validatePalette(broken).some((e) => e.includes("L5"))).toBe(true);
  });

  it("depth-shifted stops converge toward muted blue with distance (L5)", () => {
    const rows = depthShiftedStops(PALETTE_LAW, "green");
    const lit = rows[1];
    expect(lit).toBeDefined();
    if (lit === undefined) return;
    // Band 0 is the identity shift; farther bands move monotonically blueward.
    expect(lit[0]).toBe("#365a49");
    const distances = lit.map((hex) => deltaEHex(hex, "#263d5e"));
    for (let i = 1; i < distances.length; i += 1) {
      const prev = distances[i - 1];
      const next = distances[i];
      expect(prev).toBeDefined();
      expect(next).toBeDefined();
      if (prev !== undefined && next !== undefined) {
        expect(next).toBeLessThan(prev);
      }
    }
  });

  it("declared color set covers every stop at every band", () => {
    const declared = declaredColors(PALETTE_LAW);
    const stopCount = PALETTE_LAW.families.reduce((n, f) => n + f.stops.length, 0);
    expect(declared.length).toBe(stopCount * PALETTE_LAW.depthBandBlueShift.length);
    // Every declared color is exactly ΔE 0 from itself.
    for (const d of declared.slice(0, 8)) {
      expect(deltaEHex(d.hex, d.hex)).toBe(0);
    }
  });
});

describe("palette.json mirror", () => {
  it("cannot drift from the executable palette law", () => {
    const raw = readFileSync(new URL("./palette.json", import.meta.url), "utf8");
    const json = JSON.parse(raw) as Record<string, unknown>;
    expect(json.version).toBe(PALETTE_LAW.version);
    expect(json.deltaETolerance).toBe(PALETTE_LAW.deltaETolerance);
    expect(json.rampMinStepDeltaE).toBe(PALETTE_LAW.rampMinStepDeltaE);
    expect(json.tokens).toEqual(PALETTE_LAW.tokens);
    expect(json.families).toEqual(PALETTE_LAW.families);
    expect(json.depthBandBlueShift).toEqual(PALETTE_LAW.depthBandBlueShift);
  });
});
