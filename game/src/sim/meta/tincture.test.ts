import { beforeEach, describe, expect, it } from "vitest";

import { TINCTURE_PARAMS } from "./data";
import { createMercyStats, createMetaState, stepMeta, withInheritedVial } from "./index";
import { metaModifiers } from "./numbness";
import {
  beginEmberUse,
  beginTinctureUse,
  cancelUse,
  commitUse,
  craftVariant,
  maxDoses,
  refillVial,
  upgradeVial,
} from "./tincture";
import type { MercyStats, MetaState, TinctureVariantId } from "./types";

const atHearth = (state: MetaState): MetaState => ({ ...state, atHearth: true });

const drink = (
  state: MetaState,
  stats: MercyStats,
): { state: MetaState; stats: MercyStats } => {
  const committed = commitUse(beginTinctureUse(state), stats);
  return { state: committed.state, stats: committed.stats };
};

const runTicks = (
  state: MetaState,
  stats: MercyStats,
  ticks: number,
): { state: MetaState; stats: MercyStats } => {
  let current = { state, stats };
  for (let index = 0; index < ticks; index += 1) {
    const stepped = stepMeta(current.state, current.stats);
    current = { state: stepped.state, stats: stepped.stats };
  }
  return current;
};

describe("the vial", () => {
  let state: MetaState;

  beforeEach(() => {
    state = createMetaState();
  });

  it("starts empty; Anna's chest holds the slice's 3 base doses", () => {
    expect(state.vial.doses).toBe(0);
    expect(state.inherited).toBe(false);
    expect(state.annaSupply.doses).toBe(3);
    expect(maxDoses(state)).toBe(3);
  });

  it("gains a dose per Hearth upgrade tier and stops at the cap", () => {
    // Stocked pouch: the starting one funds a single tier, the cap is what stops it.
    let upgraded: MetaState = {
      ...atHearth(state),
      pouch: { ...state.pouch, cedar: 99, cotton: 99, oil: 99 },
    };
    for (let tier = 0; tier < TINCTURE_PARAMS.vial.maxUpgradeTier + 2; tier += 1) {
      upgraded = upgradeVial(upgraded);
    }
    expect(upgraded.vial.upgradeTier).toBe(TINCTURE_PARAMS.vial.maxUpgradeTier);
    expect(maxDoses(upgraded)).toBe(3 + TINCTURE_PARAMS.vial.maxUpgradeTier);
  });

  it("refuses to upgrade away from a Hearth", () => {
    expect(upgradeVial(state)).toBe(state);
  });

  it("refills to the upgraded maximum", () => {
    const upgraded = upgradeVial(atHearth(withInheritedVial(state)));
    const spent: MetaState = { ...upgraded, vial: { ...upgraded.vial, doses: 0 } };
    expect(refillVial(spent).vial.doses).toBe(4);
  });
});

describe("committed use — the dose is spent at the drink tick", () => {
  it("reserves without spending", () => {
    const state = beginTinctureUse(withInheritedVial());
    expect(state.pending).toEqual({ kind: "tincture", variant: "pulseleaf_draught" });
    expect(state.vial.doses).toBe(3);
  });

  it("returns the dose when the drink is interrupted before the drink tick", () => {
    const state = cancelUse(beginTinctureUse(withInheritedVial()));
    expect(state.pending).toBeNull();
    expect(state.vial.doses).toBe(3);
  });

  it("spends the dose at the drink tick and emits dose-used", () => {
    const state = withInheritedVial();
    const stats = { ...createMercyStats(state), pulse: 10 };
    const result = commitUse(beginTinctureUse(state), stats);

    expect(result.state.vial.doses).toBe(2);
    expect(result.state.pending).toBeNull();
    expect(result.events).toEqual([
      {
        type: "dose-used",
        tick: 0,
        variant: "pulseleaf_draught",
        dosesLeft: 2,
        healedPulse: 140,
      },
    ]);
    expect(result.stats.pulse).toBe(150);
  });

  it("cannot begin a drink with an empty vial", () => {
    const empty: MetaState = {
      ...createMetaState(),
      vial: { ...createMetaState().vial, doses: 0 },
    };
    expect(beginTinctureUse(empty).pending).toBeNull();
  });

  it("never spends two doses for one drink", () => {
    const state = withInheritedVial();
    const stats = createMercyStats(state);
    const once = commitUse(beginTinctureUse(state), stats);
    const twice = commitUse(once.state, once.stats);
    expect(twice.state.vial.doses).toBe(2);
    expect(twice.events).toEqual([]);
  });
});

describe("the five variants", () => {
  const withVariant = (variant: TinctureVariantId): MetaState => {
    const stocked = withInheritedVial();
    return { ...stocked, vial: { ...stocked.vial, variant } };
  };

  it("Pulseleaf Draught closes the wound instantly", () => {
    const state = withVariant("pulseleaf_draught");
    const result = drink(state, { ...createMercyStats(state), pulse: 1 });
    expect(result.stats.pulse).toBe(141);
  });

  it("Honeyed Draw keeps working while you keep moving", () => {
    const state = withVariant("honeyed_draw");
    const after = drink(state, { ...createMercyStats(state), pulse: 0 });
    expect(after.stats.pulse).toBe(0);

    const mid = runTicks(after.state, after.stats, 10);
    expect(mid.stats.pulse).toBe(6);

    const done = runTicks(mid.state, mid.stats, 290);
    expect(done.stats.pulse).toBe(180);
    expect(done.state.effects).toEqual([]);
  });

  it("Salt Wash drives the Turn back out of you", () => {
    const state = withVariant("salt_wash");
    const result = drink(state, { ...createMercyStats(state), pulse: 100, turn: 80 });
    expect(result.stats.turn).toBe(0);
    expect(result.stats.pulse).toBe(140);
  });

  it("Cedar-Wool Compress surges Breath and briefly steadies", () => {
    const state = withVariant("cedar_wool_compress");
    const result = drink(state, { ...createMercyStats(state), breath: 10 });
    expect(result.stats.breath).toBe(80);
    expect(metaModifiers(result.state).steadyDelta).toBe(12);

    const expired = runTicks(result.state, result.stats, 300);
    expect(metaModifiers(expired.state).steadyDelta).toBe(0);
  });

  it("Bitter Phrine takes the whole wound, then your hands are not yours", () => {
    const state = withVariant("bitter_phrine");
    const result = drink(state, { ...createMercyStats(state), pulse: 5 });
    expect(result.stats.pulse).toBe(285);

    // The instability window is deferred: nothing bites for delayTicks.
    expect(metaModifiers(result.state).breathRegenPercent).toBe(100);
    const inWindow = runTicks(result.state, result.stats, 61);
    expect(metaModifiers(inWindow.state).breathRegenPercent).toBe(60);
    expect(metaModifiers(inWindow.state).steadyDelta).toBe(-8);

    const past = runTicks(inWindow.state, inWindow.stats, 240);
    expect(metaModifiers(past.state).breathRegenPercent).toBe(100);
  });
});

describe("the Tincture Wheel", () => {
  it("crafts a variant at a Hearth and spends the pouch ingredients", () => {
    const state = atHearth(createMetaState());
    const crafted = craftVariant(state, "salt_wash");
    expect(crafted.vial.variant).toBe("salt_wash");
    expect(crafted.pouch.salt).toBe(state.pouch.salt - 2);
    expect(crafted.pouch.myrrh).toBe(state.pouch.myrrh - 1);
  });

  it("refuses to craft away from a Hearth", () => {
    const state = createMetaState();
    expect(craftVariant(state, "salt_wash")).toBe(state);
  });

  it("refuses to craft without the ingredients", () => {
    const state: MetaState = {
      ...atHearth(createMetaState()),
      pouch: { ...createMetaState().pouch, myrrh: 0 },
    };
    expect(craftVariant(state, "salt_wash")).toBe(state);
  });
});

describe("Ember", () => {
  it("is drawn from the pouch and is not a craftable dose", () => {
    const state = withInheritedVial();
    expect(state.pouch.ember).toBe(2);
    expect(beginEmberUse(state).pending).toEqual({ kind: "ember", variant: null });
  });

  it("fully restores, cleanses the Turn, surges, and costs a permanent stack", () => {
    const state = withInheritedVial();
    const stats = { ...createMercyStats(state), pulse: 3, breath: 4, turn: 90 };
    const result = commitUse(beginEmberUse(state), stats);

    expect(result.stats.pulse).toBe(stats.maxPulse);
    expect(result.stats.breath).toBe(stats.maxBreath);
    expect(result.stats.turn).toBe(0);
    expect(result.state.pouch.ember).toBe(1);
    expect(result.state.numbnessStacks).toBe(1);

    const mods = metaModifiers(result.state);
    expect(mods.damagePercent).toBe(125);
    expect(mods.breathRegenPercent).toBe(135);
    expect(result.events.map((event) => event.type)).toEqual([
      "ember-used",
      "numbness-changed",
    ]);
  });

  it("surge lasts exactly 1200 ticks", () => {
    const state = withInheritedVial();
    const used = commitUse(beginEmberUse(state), createMercyStats(state));
    const justBefore = runTicks(used.state, used.stats, 1199);
    expect(metaModifiers(justBefore.state).damagePercent).toBe(125);
    const expired = runTicks(justBefore.state, justBefore.stats, 1);
    expect(metaModifiers(expired.state).damagePercent).toBe(100);
  });

  it("cannot be used past the slice's two doses", () => {
    let state = withInheritedVial();
    let stats = createMercyStats(state);
    for (let use = 0; use < 3; use += 1) {
      const result = commitUse(beginEmberUse(state), stats);
      state = result.state;
      stats = result.stats;
    }
    expect(state.pouch.ember).toBe(0);
    expect(state.numbnessStacks).toBe(2);
  });
});
