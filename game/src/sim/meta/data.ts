/**
 * Typed mirror of the two data files that own every mercy-loop constant:
 *   game/src/data/tincture_params.json
 *   game/src/data/progression_params.json
 *
 * The JSON files are the source of truth (W1-SHARED rule 5: frame data is data,
 * hot-reloadable). `src/sim/**` runtime code may not import outside its own
 * directory (eslint `no-restricted-imports`, W1-SHARED rule 4), so the tables are
 * mirrored here and the mirror is machine-checked against the JSON by
 * `data.parity.test.ts` — any drift fails the build. Every public entry point also
 * accepts params by injection, so a hot-reloaded table can be passed straight in.
 */

import type { MetaParams, ProgressionParams, TinctureParams } from "./types";

export const TINCTURE_PARAMS: TinctureParams = {
  version: 1,
  vial: {
    baseDoses: 3,
    dosesPerUpgradeTier: 1,
    maxUpgradeTier: 2,
    defaultVariant: "pulseleaf_draught",
    upgradeCost: { cedar: 2, cotton: 2, oil: 1 },
  },
  variants: {
    pulseleaf_draught: {
      kind: "instant",
      healPulse: 140,
      healBreath: 0,
      cleansesTurn: false,
    },
    honeyed_draw: {
      kind: "overTime",
      totalHealPulse: 180,
      ticks: 300,
      intervalTicks: 10,
    },
    salt_wash: {
      kind: "cleanse",
      healPulse: 40,
      cleansesTurn: true,
    },
    cedar_wool_compress: {
      kind: "surge",
      healBreath: 70,
      steadyDelta: 12,
      ticks: 300,
    },
    bitter_phrine: {
      kind: "deferred",
      healPulse: 280,
      delayTicks: 60,
      windowTicks: 240,
      breathRegenPercent: 60,
      steadyDelta: -8,
    },
  },
  ember: {
    startingDoses: 2,
    craftable: false,
    restoresPulseFully: true,
    restoresBreathFully: true,
    cleansesTurn: true,
    surgeTicks: 1200,
    surgeDamagePercent: 125,
    surgeBreathRegenPercent: 135,
    surgeSteadyDelta: 15,
  },
  numbness: {
    healingPenaltyPercentPerStack: 8,
    turnBuildupPercentPerStack: 25,
    registerStepPerStack: 1,
    maxTextStep: 3,
    maxVigilRestore: 1,
  },
  pouch: {
    items: [
      "pulseleaf",
      "arbor",
      "acebark",
      "phrine",
      "cillin",
      "zyl",
      "honey",
      "cedar",
      "wool",
      "cotton",
      "salt",
      "myrrh",
      "oil",
      "furos",
      "ember",
    ],
    nonCraftable: ["ember"],
    starting: {
      pulseleaf: 4,
      arbor: 2,
      acebark: 2,
      phrine: 3,
      cillin: 0,
      zyl: 2,
      honey: 3,
      cedar: 3,
      wool: 3,
      cotton: 4,
      salt: 4,
      myrrh: 1,
      oil: 2,
      furos: 1,
      ember: 2,
    },
  },
  recipes: {
    pulseleaf_draught: { pulseleaf: 2, oil: 1 },
    honeyed_draw: { pulseleaf: 1, honey: 2 },
    salt_wash: { salt: 2, myrrh: 1 },
    cedar_wool_compress: { cedar: 1, wool: 2 },
    bitter_phrine: { phrine: 2, zyl: 1 },
  },
};

export const PROGRESSION_PARAMS: ProgressionParams = {
  version: 1,
  attributes: {
    pulse: {
      unit: "maxPulse",
      base: 300,
      segments: [
        { toPoints: 20, perPoint: 22 },
        { toPoints: 40, perPoint: 12 },
        { toPoints: 99, perPoint: 5 },
      ],
    },
    breath: {
      unit: "maxBreath",
      base: 100,
      segments: [
        { toPoints: 15, perPoint: 6 },
        { toPoints: 35, perPoint: 3 },
        { toPoints: 99, perPoint: 1 },
      ],
    },
    hands: {
      unit: "weaponForcePercent",
      base: 100,
      segments: [
        { toPoints: 20, perPoint: 3 },
        { toPoints: 99, perPoint: 1 },
      ],
    },
    steady: {
      unit: "poise",
      base: 20,
      segments: [{ toPoints: 99, perPoint: 1 }],
    },
    spirit: {
      unit: "tincturePotencyPercent",
      base: 100,
      segments: [
        { toPoints: 20, perPoint: 2 },
        { toPoints: 99, perPoint: 1 },
      ],
    },
    sight: {
      unit: "attendRangeCm",
      base: 1500,
      segments: [
        { toPoints: 20, perPoint: 20 },
        { toPoints: 99, perPoint: 10 },
      ],
    },
  },
  level: {
    costBase: 60,
    costLinear: 12,
    costQuad: 2,
    maxPointsPerAttribute: 99,
  },
  names: {
    awards: {
      kill: { wolf: 40, warden: 800 },
      witness: { anna_death: 300, iiro_safe: 120, birdie_threshold: 150 },
      notebook: { entry: 60, warden_tag: 200 },
    },
  },
  burden: {
    capacityBase: 40,
    capacityPerSteadyPoint: 3,
    lightMaxPercent: 30,
    mediumMaxPercent: 70,
  },
  openPage: { recoveryRadiusM: 1.5 },
  respawn: { bossEnemyIds: ["warden"] },
};

export const DEFAULT_META_PARAMS: MetaParams = {
  tincture: TINCTURE_PARAMS,
  progression: PROGRESSION_PARAMS,
};
