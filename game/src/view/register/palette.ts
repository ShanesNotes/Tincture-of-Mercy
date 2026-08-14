/**
 * Register palette core — pure color math and palette law data.
 *
 * Law references:
 * - L2 / gate A1: all material albedo within declared ΔE of the 7 tokens +
 *   declared value ramps. The declared set is `palette.json` (checked in);
 *   this module is its executable form. `palette.test.ts` asserts the two
 *   cannot drift.
 * - L3: 2–3 stop stepped shading. Ramp stops per family are declared here;
 *   shaders select stops, never blend.
 * - L5 / EN10 / PA11: depth-band desaturation is a quantized ramp shift
 *   toward muted blue #263d5e. The shift weights are declared here and the
 *   exact same linear-space mix is applied in the post grade, so shifted
 *   colors are themselves declared colors.
 * - L8 / PA10: oxblood appears only on named carriers.
 *
 * This module is pure: no three.js, no DOM, no wall clock. It is shared by
 * the TSL materials (browser), the art-gate harness (browser bundle driven
 * by Playwright), and the Vitest suite (node).
 */

export interface Lab {
  readonly l: number;
  readonly a: number;
  readonly b: number;
}

export interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

export interface PaletteFamily {
  /** Human name; also the material binding key. */
  readonly name: string;
  /** Base token this family's ramp derives from (L2). */
  readonly token: string;
  /**
   * Declared ramp stops, dark → lit, as hex sRGB colors (L3). Flat named
   * carriers (oxblood per PA10) declare exactly one stop.
   */
  readonly stops: readonly string[];
  /**
   * True for named flat carriers (PA10: oxblood cell 9 / vial glass). Flat
   * carriers skip stepped shading by declared exception.
   */
  readonly flatCarrier: boolean;
}

export interface PaletteLaw {
  readonly version: number;
  /** Gate A1 tolerance (GATES.md A1: ΔE 6). */
  readonly deltaETolerance: number;
  /** Minimum ΔE separation between adjacent ramp stops (readability). */
  readonly rampMinStepDeltaE: number;
  /** The seven L2 tokens. */
  readonly tokens: Readonly<Record<string, string>>;
  /** Declared value ramps per family. */
  readonly families: readonly PaletteFamily[];
  /**
   * L5 quantized depth-band blue shift: declared mix weights (linear-space,
   * toward the blue token) per band, near → far. Band count is 3–4 (L5).
   */
  readonly depthBandBlueShift: readonly number[];
}

/**
 * The checked-in palette law. `palette.json` carries the same values for
 * audit; the test suite asserts byte-level agreement after parsing.
 *
 * Ramp steps were chosen in CIE Lab space (L* scaled per step, chroma held
 * near the token) so every step stays inside its token's hue family; the
 * validity invariants are machine-checked by `validatePalette`.
 */
export const PALETTE_LAW: PaletteLaw = {
  version: 1,
  deltaETolerance: 6,
  rampMinStepDeltaE: 8,
  tokens: {
    parchment: "#f8f1e5",
    ink: "#211b17",
    oxblood: "#7e2531",
    gold: "#a87a2e",
    green: "#365a49",
    blue: "#263d5e",
    rose: "#b07a83",
  },
  families: [
    { name: "parchment", token: "parchment", stops: ["#8a7f6b", "#c2b8a6", "#f8f1e5"], flatCarrier: false },
    { name: "ink", token: "ink", stops: ["#211b17", "#5d564e"], flatCarrier: false },
    { name: "green", token: "green", stops: ["#22332b", "#365a49"], flatCarrier: false },
    { name: "blue", token: "blue", stops: ["#182637", "#263d5e"], flatCarrier: false },
    { name: "muted", token: "ink", stops: ["#443f38", "#6b6156"], flatCarrier: false },
    { name: "gold", token: "gold", stops: ["#6d4d1e", "#a87a2e"], flatCarrier: false },
    { name: "rose", token: "rose", stops: ["#6e4b52", "#b07a83"], flatCarrier: false },
    { name: "oxblood", token: "oxblood", stops: ["#7e2531"], flatCarrier: true },
  ],
  depthBandBlueShift: [0, 0.3, 0.55, 0.75],
};

// ---------------------------------------------------------------------------
// sRGB ↔ Lab (CIELAB, D65) — the gate's color space (A1 says "CIE ΔE").
// ---------------------------------------------------------------------------

export const hexToRgb = (hex: string): Rgb => {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (match === null) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  const value = match[1] ?? "";
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
};

export const rgbToHex = (rgb: Rgb): string => {
  const channel = (v: number): string =>
    Math.min(255, Math.max(0, Math.round(v))).toString(16).padStart(2, "0");
  return `#${channel(rgb.r)}${channel(rgb.g)}${channel(rgb.b)}`;
};

/** sRGB channel (0–255) → linear (0–1), IEC 61966-2-1. */
export const srgbChannelToLinear = (v: number): number => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

/** Linear (0–1) → sRGB channel (0–255). */
export const linearChannelToSrgb = (c: number): number => {
  const s = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return s * 255;
};

export const srgbToLinear = (rgb: Rgb): Rgb => ({
  r: srgbChannelToLinear(rgb.r),
  g: srgbChannelToLinear(rgb.g),
  b: srgbChannelToLinear(rgb.b),
});

export const linearToSrgb = (rgb: Rgb): Rgb => ({
  r: linearChannelToSrgb(rgb.r),
  g: linearChannelToSrgb(rgb.g),
  b: linearChannelToSrgb(rgb.b),
});

/** sRGB (0–255) → CIE XYZ (D65, Yn=100). */
export const srgbToXyz = (rgb: Rgb): { x: number; y: number; z: number } => {
  const r = srgbChannelToLinear(rgb.r);
  const g = srgbChannelToLinear(rgb.g);
  const b = srgbChannelToLinear(rgb.b);
  return {
    x: (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) * 100,
    y: (0.2126729 * r + 0.7151522 * g + 0.072175 * b) * 100,
    z: (0.0193339 * r + 0.119192 * g + 0.9503041 * b) * 100,
  };
};

const D65 = { x: 95.047, y: 100, z: 108.883 } as const;

const labPivot = (t: number): number => {
  const delta = 6 / 29;
  return t > delta * delta * delta ? Math.cbrt(t) : t / (3 * delta * delta) + 4 / 29;
};

export const srgbToLab = (rgb: Rgb): Lab => {
  const { x, y, z } = srgbToXyz(rgb);
  const fx = labPivot(x / D65.x);
  const fy = labPivot(y / D65.y);
  const fz = labPivot(z / D65.z);
  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
};

export const hexToLab = (hex: string): Lab => srgbToLab(hexToRgb(hex));

/**
 * CIEDE2000 ΔE (Sharma, Wu, Dalal 2005), parametric weights 1:1:1.
 * This is the "CIE ΔE" gate A1 names; implemented in full, not ΔE76.
 */
export const deltaE2000 = (c1: Lab, c2: Lab): number => {
  const rad = Math.PI / 180;
  const lBar = (c1.l + c2.l) / 2;
  const cab1 = Math.hypot(c1.a, c1.b);
  const cab2 = Math.hypot(c2.a, c2.b);
  const cBar = (cab1 + cab2) / 2;
  const cBar7 = Math.pow(cBar, 7);
  const g = 0.5 * (1 - Math.sqrt(cBar7 / (cBar7 + Math.pow(25, 7))));
  const a1p = c1.a * (1 + g);
  const a2p = c2.a * (1 + g);
  const c1p = Math.hypot(a1p, c1.b);
  const c2p = Math.hypot(a2p, c2.b);
  const hp = (a: number, b: number): number => {
    if (a === 0 && b === 0) return 0;
    const h = Math.atan2(b, a) / rad;
    return h >= 0 ? h : h + 360;
  };
  const h1p = hp(a1p, c1.b);
  const h2p = hp(a2p, c2.b);
  const dLp = c2.l - c1.l;
  const dCp = c2p - c1p;
  let dhp: number;
  if (c1p * c2p === 0) {
    dhp = 0;
  } else if (Math.abs(h2p - h1p) <= 180) {
    dhp = h2p - h1p;
  } else if (h2p - h1p > 180) {
    dhp = h2p - h1p - 360;
  } else {
    dhp = h2p - h1p + 360;
  }
  const dHp = 2 * Math.sqrt(c1p * c2p) * Math.sin((dhp / 2) * rad);
  let hBarP: number;
  if (c1p * c2p === 0) {
    hBarP = h1p + h2p;
  } else if (Math.abs(h1p - h2p) <= 180) {
    hBarP = (h1p + h2p) / 2;
  } else if (h1p + h2p < 360) {
    hBarP = (h1p + h2p + 360) / 2;
  } else {
    hBarP = (h1p + h2p - 360) / 2;
  }
  const t =
    1 -
    0.17 * Math.cos((hBarP - 30) * rad) +
    0.24 * Math.cos(2 * hBarP * rad) +
    0.32 * Math.cos((3 * hBarP + 6) * rad) -
    0.2 * Math.cos((4 * hBarP - 63) * rad);
  const dTheta = 30 * Math.exp(-Math.pow((hBarP - 275) / 25, 2));
  const cBarP = (c1p + c2p) / 2;
  const cBarP7 = Math.pow(cBarP, 7);
  const rc = 2 * Math.sqrt(cBarP7 / (cBarP7 + Math.pow(25, 7)));
  const sl = 1 + (0.015 * Math.pow(lBar - 50, 2)) / Math.sqrt(20 + Math.pow(lBar - 50, 2));
  const sc = 1 + 0.045 * cBarP;
  const sh = 1 + 0.015 * cBarP * t;
  const rt = -Math.sin(2 * dTheta * rad) * rc;
  const dL = dLp / sl;
  const dC = dCp / sc;
  const dH = dHp / sh;
  return Math.sqrt(dL * dL + dC * dC + dH * dH + rt * dC * dH);
};

export const deltaEHex = (hex1: string, hex2: string): number =>
  deltaE2000(hexToLab(hex1), hexToLab(hex2));

// ---------------------------------------------------------------------------
// Palette law helpers
// ---------------------------------------------------------------------------

const requireFamily = (law: PaletteLaw, name: string): PaletteFamily => {
  const family = law.families.find((f) => f.name === name);
  if (family === undefined) {
    throw new Error(`Unknown palette family: ${name}`);
  }
  return family;
};

export const familyStops = (law: PaletteLaw, name: string): readonly string[] =>
  requireFamily(law, name).stops;

const requireToken = (law: PaletteLaw, name: string): string => {
  const hex = law.tokens[name];
  if (hex === undefined) {
    throw new Error(`Unknown palette token: ${name}`);
  }
  return hex;
};

export const tokenHex = (law: PaletteLaw, name: string): string => requireToken(law, name);

/**
 * The L5 depth-band shift, computed exactly as the post grade computes it:
 * linear-space mix toward the blue token with the declared band weight.
 * Returns one shifted hex per (family stop × band), band-major.
 */
export const depthShiftedStops = (
  law: PaletteLaw,
  familyName: string,
): readonly (readonly string[])[] => {
  const blueLinear = srgbToLinear(hexToRgb(requireToken(law, "blue")));
  return familyStops(law, familyName).map((stopHex) => {
    const stopLinear = srgbToLinear(hexToRgb(stopHex));
    return law.depthBandBlueShift.map((w) =>
      rgbToHex(
        linearToSrgb({
          r: stopLinear.r + (blueLinear.r - stopLinear.r) * w,
          g: stopLinear.g + (blueLinear.g - stopLinear.g) * w,
          b: stopLinear.b + (blueLinear.b - stopLinear.b) * w,
        }),
      ),
    );
  });
};

export interface DeclaredColor {
  readonly hex: string;
  readonly family: string;
  readonly stopIndex: number;
  readonly bandIndex: number;
  readonly lab: Lab;
}

/**
 * The full declared color set the covenant (A1) measures against:
 * every family stop at every declared depth-band shift (L2 + L5 combined).
 */
export const declaredColors = (law: PaletteLaw): readonly DeclaredColor[] => {
  const colors: DeclaredColor[] = [];
  for (const family of law.families) {
    const shifted = depthShiftedStops(law, family.name);
    family.stops.forEach((stopHex, stopIndex) => {
      const bandRow = shifted[stopIndex];
      if (bandRow === undefined) return;
      bandRow.forEach((hex, bandIndex) => {
        colors.push({ hex, family: family.name, stopIndex, bandIndex, lab: hexToLab(hex) });
      });
      void stopHex;
    });
  }
  return colors;
};

/**
 * Validity invariants for a checked-in palette (the "ΔE-valid ramp steps"
 * law): tokens present, families reference real tokens, ramps are 1–3 stops
 * (flat carriers exactly 1; shaded families 2–3 per L3), adjacent stops
 * separated by at least `rampMinStepDeltaE`, and band count is 3–4 (L5).
 */
export const validatePalette = (law: PaletteLaw): readonly string[] => {
  const errors: string[] = [];
  const tokenNames = Object.keys(law.tokens);
  if (tokenNames.length !== 7) {
    errors.push(`L2 requires exactly 7 tokens, found ${tokenNames.length}.`);
  }
  for (const [name, hex] of Object.entries(law.tokens)) {
    try {
      hexToRgb(hex);
    } catch {
      errors.push(`Token ${name} is not a valid hex color: ${hex}`);
    }
  }
  if (law.tokens.blue === undefined) {
    errors.push("L5 requires the muted blue token #263d5e to be present as `blue`.");
  }
  for (const family of law.families) {
    if (law.tokens[family.token] === undefined) {
      errors.push(`Family ${family.name} references unknown token ${family.token}.`);
    }
    const expectedFlat = family.flatCarrier;
    if (expectedFlat && family.stops.length !== 1) {
      errors.push(`Flat carrier ${family.name} must declare exactly 1 stop (PA10).`);
    }
    if (!expectedFlat && (family.stops.length < 2 || family.stops.length > 3)) {
      errors.push(`Family ${family.name} must declare 2–3 ramp stops (L3).`);
    }
    for (let i = 1; i < family.stops.length; i += 1) {
      const prev = family.stops[i - 1];
      const next = family.stops[i];
      if (prev === undefined || next === undefined) continue;
      const step = deltaEHex(prev, next);
      if (step < law.rampMinStepDeltaE) {
        errors.push(
          `Family ${family.name} stops ${i - 1}→${i} are only ΔE ${step.toFixed(2)} apart ` +
            `(minimum ${law.rampMinStepDeltaE}).`,
        );
      }
    }
    // Ramp steps must stay inside the token's hue family. Hue is unstable
    // near the neutral axis, so the check applies only to stops with enough
    // chroma for hue to be meaningful (C*ab ≥ 10); those must hold the
    // token's hue angle within 25°.
    const tokenLab = hexToLab(family.token === undefined ? "#000000" : requireToken(law, family.token));
    const tokenHue = Math.atan2(tokenLab.b, tokenLab.a) * (180 / Math.PI);
    family.stops.forEach((stopHex, stopIndex) => {
      const stopLab = hexToLab(stopHex);
      const chroma = Math.hypot(stopLab.a, stopLab.b);
      if (chroma < 10) return;
      const stopHue = Math.atan2(stopLab.b, stopLab.a) * (180 / Math.PI);
      let hueDelta = Math.abs(stopHue - tokenHue);
      if (hueDelta > 180) hueDelta = 360 - hueDelta;
      if (hueDelta > 25) {
        errors.push(
          `Family ${family.name} stop ${stopIndex} (${stopHex}) drifts ${hueDelta.toFixed(1)}° ` +
            `in hue from token ${family.token} (maximum 25°).`,
        );
      }
    });
  }
  const bands = law.depthBandBlueShift.length;
  if (bands < 3 || bands > 4) {
    errors.push(`L5 requires 3–4 quantized depth bands, found ${bands}.`);
  }
  if (law.depthBandBlueShift[0] !== 0) {
    errors.push("Depth band 0 must have zero blue shift (near field is unshifted).");
  }
  for (let i = 1; i < law.depthBandBlueShift.length; i += 1) {
    const prev = law.depthBandBlueShift[i - 1];
    const next = law.depthBandBlueShift[i];
    if (prev === undefined || next === undefined || next <= prev || next > 1) {
      errors.push("Depth band blue-shift weights must be strictly increasing within (0, 1].");
    }
  }
  return errors;
};
