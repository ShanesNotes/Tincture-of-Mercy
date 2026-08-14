import { describe, expect, it } from "vitest";

import { PROGRESSION_PARAMS } from "./data";
import { arriveAtHearth, createMetaState } from "./index";
import {
  ATTRIBUTE_IDS,
  attributeValue,
  awardNames,
  bankNames,
  burdenBand,
  burdenCapacity,
  derivedAttribute,
  levelCost,
  nextLevelCost,
  setGearWeight,
  spendNames,
} from "./progression";
import type { AttributeId, MetaState } from "./types";

const withPoints = (attribute: AttributeId, points: number): MetaState => {
  const state = createMetaState();
  return {
    ...state,
    names: {
      ...state.names,
      attributes: { ...state.names.attributes, [attribute]: points },
    },
  };
};

const withBanked = (banked: number): MetaState => {
  const state = arriveAtHearth(createMetaState(), "cabin");
  return { ...state, names: { ...state.names, banked } };
};

describe("attributes", () => {
  it("names the six D6 attributes", () => {
    expect([...ATTRIBUTE_IDS].sort()).toEqual([
      "breath",
      "hands",
      "pulse",
      "sight",
      "spirit",
      "steady",
    ]);
  });

  it("starts at the TUNING_V0 bases", () => {
    const state = createMetaState();
    expect(derivedAttribute(state, "pulse")).toBe(300);
    expect(derivedAttribute(state, "breath")).toBe(100);
    expect(derivedAttribute(state, "steady")).toBe(20);
    expect(derivedAttribute(state, "sight")).toBe(1500);
  });

  it("walks the piecewise curve across segment boundaries", () => {
    const curve = PROGRESSION_PARAMS.attributes.pulse;
    expect(attributeValue(0, curve)).toBe(300);
    expect(attributeValue(1, curve)).toBe(322);
    expect(attributeValue(20, curve)).toBe(740);
    expect(attributeValue(25, curve)).toBe(800);
    expect(derivedAttribute(withPoints("pulse", 20), "pulse")).toBe(740);
  });

  it("keeps every derived value an integer", () => {
    for (const id of ATTRIBUTE_IDS) {
      for (const points of [0, 1, 7, 20, 33, 60, 99]) {
        expect(Number.isInteger(derivedAttribute(withPoints(id, points), id))).toBe(true);
      }
    }
  });
});

describe("Names", () => {
  it("accrues carried Names from kill, witness and notebook events", () => {
    let state = createMetaState();
    state = awardNames(state, "kill", "wolf").state;
    state = awardNames(state, "witness", "iiro_safe").state;
    const last = awardNames(state, "notebook", "entry");
    expect(last.state.names.carried).toBe(40 + 120 + 60);
    expect(last.events).toEqual([
      { type: "names-changed", tick: 0, delta: 60, carried: 220, banked: 0 },
    ]);
  });

  it("throws on an award the data table does not know", () => {
    expect(() => awardNames(createMetaState(), "kill", "dragon")).toThrow(
      "Unknown Names award: kill.dragon",
    );
  });

  it("banks only at a Hearth", () => {
    const carried = awardNames(createMetaState(), "kill", "warden").state;
    expect(bankNames(carried).state).toBe(carried);

    const banked = bankNames(arriveAtHearth(carried, "road")).state;
    expect(banked.names.carried).toBe(0);
    expect(banked.names.banked).toBe(800);
  });
});

describe("levelling", () => {
  it("prices the next point off the points already written", () => {
    expect(levelCost(0, PROGRESSION_PARAMS)).toBe(60);
    expect(levelCost(1, PROGRESSION_PARAMS)).toBe(74);
    expect(levelCost(2, PROGRESSION_PARAMS)).toBe(92);
  });

  it("spends banked Names on an attribute point", () => {
    const state = withBanked(200);
    const levelled = spendNames(state, "pulse");
    expect(levelled.state.names.banked).toBe(140);
    expect(levelled.state.names.spent).toBe(1);
    expect(levelled.state.names.attributes.pulse).toBe(1);
    expect(nextLevelCost(levelled.state)).toBe(74);
    expect(derivedAttribute(levelled.state, "pulse")).toBe(322);
  });

  it("refuses to level away from a Hearth or without the Names", () => {
    const broke = withBanked(59);
    expect(spendNames(broke, "pulse").state).toBe(broke);

    const away: MetaState = { ...withBanked(500), atHearth: false };
    expect(spendNames(away, "pulse").state).toBe(away);
  });

  it("stops at the per-attribute cap", () => {
    const rich = withBanked(10_000_000);
    const capped: MetaState = {
      ...rich,
      names: {
        ...rich.names,
        attributes: {
          ...rich.names.attributes,
          steady: PROGRESSION_PARAMS.level.maxPointsPerAttribute,
        },
      },
    };
    expect(spendNames(capped, "steady").state).toBe(capped);
  });
});

describe("Burden", () => {
  it("derives capacity from Steady", () => {
    expect(burdenCapacity(createMetaState())).toBe(40);
    expect(burdenCapacity(withPoints("steady", 10))).toBe(70);
  });

  it("bands on the TUNING_V0 30%/70% thresholds, exactly", () => {
    const state = createMetaState();
    expect(burdenBand(setGearWeight(state, 0))).toBe("light");
    expect(burdenBand(setGearWeight(state, 11))).toBe("light");
    expect(burdenBand(setGearWeight(state, 12))).toBe("medium");
    expect(burdenBand(setGearWeight(state, 28))).toBe("medium");
    expect(burdenBand(setGearWeight(state, 29))).toBe("heavy");
  });

  it("levelling Steady moves a heavy load back down a band", () => {
    const loaded = setGearWeight(createMetaState(), 29);
    expect(burdenBand(loaded)).toBe("heavy");
    const stronger = setGearWeight(withPoints("steady", 10), 29);
    expect(burdenBand(stronger)).toBe("medium");
  });
});
