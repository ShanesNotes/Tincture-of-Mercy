/**
 * Fixture states (slice contract: the HUD consumes the merged sim modules
 * read-only through HudModel + fixture data until integration binds s11/s15/
 * s25 state). Each fixture is one enumerable verdict state for the A5-style
 * diff; HUD_FIXTURE_ORDER fixes the adjacency order the diff test walks.
 * Gameplay numbers come from TUNING_V0 (doses 3 base, Ember 2/slice, Breath
 * 100 base); Pulse max 100 is a fixture convention, not a tuning claim.
 */

import type { HudInput } from "./types";

const base: HudInput = {
  pulse: 100,
  maxPulse: 100,
  breath: 100,
  maxBreath: 100,
  doses: 3,
  maxDoses: 3,
  namesCarried: 0,
  turn: 0,
  turnCap: 100,
  hearth: "unlit",
  bossPhase: "none",
  unwrittenTag: false,
  numbnessStacks: 0,
  vigilRestore: 0,
  registerLocked: false,
  zone: "wild",
};

export const HUD_FIXTURES = {
  /** CM19: hearth rest — lit-state ornament wakes, vigil seal in the footer. */
  cabin_vigil: {
    ...base,
    zone: "domestic",
    hearth: "lit",
    vigilRestore: 1,
    namesCarried: 4,
  },
  /** The road: unlit, bare thorn margin, doses spent down. */
  road_wild: {
    ...base,
    pulse: 65,
    breath: 40,
    doses: 1,
    namesCarried: 7,
  },
  /** D6: Turn buildup renders as the margin narrowing, never a bar. */
  turn_rising: {
    ...base,
    pulse: 80,
    turn: 55,
    namesCarried: 7,
  },
  /** Warden phase 1: boss-phase verdict, no title card (CM26). */
  warden_p1: {
    ...base,
    pulse: 55,
    breath: 60,
    doses: 2,
    bossPhase: "phase1",
    turn: 30,
    namesCarried: 12,
  },
  /** WR8: the ceremony — lantern hung, 90t stillness; the border holds its breath. */
  warden_ceremony: {
    ...base,
    pulse: 40,
    breath: 25,
    doses: 2,
    bossPhase: "ceremony",
    turn: 70,
    namesCarried: 12,
  },
  /** Ember's cost at slice reach: two stacks, the words dying (TEXT_BIBLE §2). */
  numbness_2: {
    ...base,
    pulse: 100,
    doses: 3,
    numbnessStacks: 2,
    namesCarried: 13,
    unwrittenTag: true,
  },
  /** HB6: the Turn at cap — Turned by border verdict, never a flash. */
  turned: {
    ...base,
    pulse: 20,
    breath: 10,
    doses: 0,
    turn: 100,
    numbnessStacks: 2,
    namesCarried: 13,
    unwrittenTag: true,
  },
} as const satisfies Readonly<Record<string, HudInput>>;

export type HudFixtureName = keyof typeof HUD_FIXTURES;

/** Adjacency order for the A5-style diff: every adjacent pair must differ. */
export const HUD_FIXTURE_ORDER: readonly HudFixtureName[] = [
  "cabin_vigil",
  "road_wild",
  "turn_rising",
  "warden_p1",
  "warden_ceremony",
  "numbness_2",
  "turned",
];

export const DEFAULT_FIXTURE: HudFixtureName = "cabin_vigil";

const isFixtureName = (name: string): name is HudFixtureName =>
  Object.prototype.hasOwnProperty.call(HUD_FIXTURES, name);

/** Lookup for untrusted input (query params, test hooks); falls back to the default. */
export const fixtureByName = (name: string | null): HudInput =>
  name !== null && isFixtureName(name) ? HUD_FIXTURES[name] : HUD_FIXTURES[DEFAULT_FIXTURE];
