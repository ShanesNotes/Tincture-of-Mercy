/**
 * O-F1 — THE FLASK IS ANNA'S MEDICINE.
 *
 * Finder repro: 0 doses at tick 0; after WitnessDeath the player inherits
 * N remaining (borrowed mercy has arithmetic).
 */

import { describe, expect, it } from "vitest";

import { applySceneEffects } from "../world/scenes";
import { DEFAULT_META_PARAMS } from "./data";
import { createMetaState } from "./index";
import { inheritAnnaSupply, spendAnnaDose } from "./tincture";

describe("borrowed mercy (O-F1)", () => {
  it("gives the player ZERO doses and ZERO pouch Embers at tick 0", () => {
    const state = createMetaState();
    expect(state.tick).toBe(0);
    expect(state.vial.doses).toBe(0);
    expect(state.pouch.ember).toBe(0);
    expect(state.inherited).toBe(false);
    expect(state.annaSupply).toEqual({ doses: 3, ember: 2 });
  });

  it("leaves pouch ingredients in place", () => {
    const state = createMetaState();
    expect(state.pouch.pulseleaf).toBeGreaterThan(0);
    expect(state.pouch.salt).toBeGreaterThan(0);
    expect(state.pouch.ember).toBe(0);
  });

  it("DoseAnna spends from HER chest; two doses leave one to inherit", () => {
    const once = spendAnnaDose(createMetaState());
    expect(once.annaSupply.doses).toBe(2);
    expect(once.vial.doses).toBe(0);

    const twice = spendAnnaDose(once);
    expect(twice.annaSupply.doses).toBe(1);

    const inherited = inheritAnnaSupply(twice);
    expect(inherited.inherited).toBe(true);
    expect(inherited.vial.doses).toBe(1);
    expect(inherited.pouch.ember).toBe(2);
    expect(inherited.annaSupply).toEqual({ doses: 0, ember: 0 });
  });

  it("vial-inherited carries the remaining count", () => {
    const dosed = spendAnnaDose(spendAnnaDose(createMetaState()));
    const effects = applySceneEffects(
      [{ type: "vial-inherited", tick: 0, doses: dosed.annaSupply.doses }],
      dosed,
      DEFAULT_META_PARAMS,
      false,
    );
    expect(effects.meta.inherited).toBe(true);
    expect(effects.meta.vial.doses).toBe(1);
    expect(effects.meta.pouch.ember).toBe(2);
  });
});
