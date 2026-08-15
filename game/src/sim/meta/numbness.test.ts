import { describe, expect, it } from "vitest";

import {
  arriveAtHearth,
  createMercyStats,
  hearthRest,
  hostileContact,
  leaveHearth,
  stepMeta,
  withInheritedVial,
} from "./index";
import { metaModifiers, numbnessHealingPercent, scaleTinctureHeal, textStep, turnBuildupPercent } from "./numbness";
import { beginEmberUse, beginTinctureUse, commitUse } from "./tincture";
import type { MercyStats, MetaState, TinctureVariantId } from "./types";

const withStacks = (stacks: number, vigilRestore = 0): MetaState => ({
  ...withInheritedVial(),
  numbnessStacks: stacks,
  vigilRestore,
});

describe("the Numbness ladder (TEXT_BIBLE §2)", () => {
  it("textStep = clamp(stacks - vigilRestore, 0, 3)", () => {
    const cases: readonly [number, number, number][] = [
      [0, 0, 0],
      [0, 1, 0],
      [1, 0, 1],
      [1, 1, 0],
      [2, 0, 2],
      [2, 1, 1],
      [3, 1, 2],
      [4, 0, 3],
      [5, 1, 3],
    ];
    for (const [stacks, vigilRestore, expected] of cases) {
      expect(textStep(withStacks(stacks, vigilRestore))).toBe(expected);
    }
  });

  it("costs -8% Tincture healing and +25% Turn buildup per stack", () => {
    expect(numbnessHealingPercent(withStacks(0))).toBe(100);
    expect(numbnessHealingPercent(withStacks(3))).toBe(76);
    expect(turnBuildupPercent(withStacks(0))).toBe(100);
    expect(turnBuildupPercent(withStacks(3))).toBe(175);
    expect(scaleTinctureHeal(140, withStacks(0))).toBe(140);
    expect(scaleTinctureHeal(140, withStacks(1))).toBe(128);
    expect(scaleTinctureHeal(140, withStacks(3))).toBe(106);
  });

  it("the Hearth gives the words back, one step, and never the stacks", () => {
    const state = withStacks(2);
    const rested = hearthRest(state, createMercyStats(state), "cabin");

    expect(rested.state.vigilRestore).toBe(1);
    expect(rested.state.numbnessStacks).toBe(2);
    expect(textStep(rested.state)).toBe(1);
    expect(numbnessHealingPercent(rested.state)).toBe(84);
    expect(rested.events).toContainEqual({
      type: "numbness-changed",
      tick: 0,
      stacks: 2,
      textStep: 1,
    });
  });

  it("the vigil ends at the first hostile contact after leaving", () => {
    const state = withStacks(2);
    const rested = hearthRest(state, createMercyStats(state), "cabin").state;
    const left = leaveHearth(rested);
    expect(textStep(left)).toBe(1);

    const fought = hostileContact(left);
    expect(fought.state.vigilRestore).toBe(0);
    expect(textStep(fought.state)).toBe(2);
    expect(fought.events).toEqual([
      { type: "numbness-changed", tick: 0, stacks: 2, textStep: 2 },
    ]);
  });

  it("keeps vigilRestore capped so stacks still bite after repeated rests", () => {
    let state = withStacks(3);
    for (let rest = 0; rest < 5; rest += 1) {
      state = hearthRest(state, createMercyStats(state), "road").state;
    }
    expect(state.vigilRestore).toBe(1);
    expect(textStep(state)).toBe(2);
  });

  it("exposes textStep on the modifier surface the text system reads", () => {
    expect(metaModifiers(withStacks(2)).textStep).toBe(2);
    expect(metaModifiers(arriveAtHearth(withStacks(2, 1), "cabin")).textStep).toBe(1);
  });
});

/* --------------------------------------------------------------- canon law */

interface RestorationProfile {
  readonly pulse: number;
  readonly breath: number;
  readonly turn: number;
  readonly peakSteady: number;
  readonly peakDamage: number;
}

/** Drink the thing at full deficit and let every effect run out. */
const profileOf = (base: MetaState, use: "ember" | TinctureVariantId): RestorationProfile => {
  const state: MetaState =
    use === "ember" ? base : { ...base, vial: { ...base.vial, variant: use } };
  const empty: MercyStats = { ...createMercyStats(state), pulse: 0, breath: 0, turn: 100 };
  const committed = commitUse(
    use === "ember" ? beginEmberUse(state) : beginTinctureUse(state),
    empty,
  );

  let current = { state: committed.state, stats: committed.stats };
  let peakSteady = metaModifiers(current.state).steadyDelta;
  let peakDamage = metaModifiers(current.state).damagePercent;

  for (let tick = 0; tick < 1300; tick += 1) {
    const stepped = stepMeta(current.state, current.stats);
    current = { state: stepped.state, stats: stepped.stats };
    const mods = metaModifiers(current.state);
    peakSteady = Math.max(peakSteady, mods.steadyDelta);
    peakDamage = Math.max(peakDamage, mods.damagePercent);
  }

  return {
    pulse: current.stats.pulse,
    breath: current.stats.breath,
    turn: current.stats.turn,
    peakSteady,
    peakDamage,
  };
};

const CRAFTABLE: readonly TinctureVariantId[] = [
  "pulseleaf_draught",
  "honeyed_draw",
  "salt_wash",
  "cedar_wool_compress",
  "bitter_phrine",
];

describe("D6 canon law: Ember must remain genuinely wanted", () => {
  // CANON LAW (DECISIONS.md D6): "if players do not want to use Ember, the design
  // has failed — Ember must be genuinely wanted." Mechanically: Ember must remain
  // STRICTLY STRONGER than every craftable dose on every restoration axis, at every
  // Numbness stack count the ladder can reach (0..3). Numbness scales Tincture
  // healing down but never touches Ember (it is Strange Fire, not the Tincture), so
  // the gap may only widen. This property test is that law.
  it("dominates every craftable dose at 0, 1, 2 and 3 Numbness stacks", () => {
    for (let stacks = 0; stacks <= 3; stacks += 1) {
      const base = withStacks(stacks);
      const ember = profileOf(base, "ember");

      for (const variant of CRAFTABLE) {
        const dose = profileOf(base, variant);
        expect(ember.pulse).toBeGreaterThanOrEqual(dose.pulse);
        expect(ember.breath).toBeGreaterThanOrEqual(dose.breath);
        expect(ember.turn).toBeLessThanOrEqual(dose.turn);
        expect(ember.peakSteady).toBeGreaterThanOrEqual(dose.peakSteady);
        expect(ember.peakDamage).toBeGreaterThan(dose.peakDamage);
      }
    }
  });

  it("widens its lead as the stacks accumulate", () => {
    const clean = profileOf(withStacks(0), "bitter_phrine");
    const numb = profileOf(withStacks(3), "bitter_phrine");
    const ember = profileOf(withStacks(3), "ember");

    expect(numb.pulse).toBeLessThan(clean.pulse);
    expect(ember.pulse - numb.pulse).toBeGreaterThan(
      profileOf(withStacks(0), "ember").pulse - clean.pulse,
    );
  });
});
