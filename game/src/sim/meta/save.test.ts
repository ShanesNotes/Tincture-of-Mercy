import { describe, expect, it } from "vitest";

import {
  arriveAtHearth,
  createMercyStats,
  createMetaState,
  hostileContact,
  leaveHearth,
  respawnAtHearth,
  stepMeta,
  withInheritedVial,
} from "./index";
import { bossDefeated, engageBoss, enterArena, quitOutOfArena } from "./arena";
import { markEnemyDefeated, recordDeath, recoverOpenPage } from "./openPage";
import { awardNames, bankNames, setGearWeight, spendNames } from "./progression";
import {
  SAVE_VERSION,
  SaveRejectedError,
  deserializeMetaState,
  migrateOrReject,
  serializeMetaState,
} from "./save";
import {
  beginEmberUse,
  beginTinctureUse,
  commitUse,
  craftVariant,
  upgradeVial,
} from "./tincture";
import type { MercyStats, MetaState } from "./types";

/** Deterministic LCG — `Math.random` is banned inside `src/sim`. */
const lcg = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state;
  };
};

const OPERATION_COUNT = 20;

/** Drive the module through a pseudo-random but reachable sequence of play. */
const playRandomly = (seed: number, steps: number): MetaState => {
  const next = lcg(seed);
  let state = createMetaState();
  let stats: MercyStats = createMercyStats(state);

  for (let index = 0; index < steps; index += 1) {
    const position = { x: next() % 40, y: 0, z: next() % 40 };
    switch (next() % OPERATION_COUNT) {
      case 0:
        state = awardNames(state, "kill", "wolf").state;
        break;
      case 1:
        state = awardNames(state, "witness", "iiro_safe").state;
        break;
      case 2:
        state = awardNames(state, "notebook", "entry").state;
        break;
      case 3:
        state = arriveAtHearth(state, `hearth_${String(next() % 3)}`);
        break;
      case 4:
        state = bankNames(state).state;
        break;
      case 5:
        state = spendNames(state, "pulse").state;
        break;
      case 6:
        state = spendNames(state, "steady").state;
        break;
      case 7:
        state = craftVariant(state, "salt_wash");
        break;
      case 8:
        state = craftVariant(state, "honeyed_draw");
        break;
      case 9:
        state = upgradeVial(state);
        break;
      case 10: {
        const drunk = commitUse(beginTinctureUse(state), stats);
        state = drunk.state;
        stats = drunk.stats;
        break;
      }
      case 11: {
        const burnt = commitUse(beginEmberUse(state), stats);
        state = burnt.state;
        stats = burnt.stats;
        break;
      }
      case 12:
        state = markEnemyDefeated(state, `wolf_${String(next() % 5)}`);
        break;
      case 13:
        state = recordDeath(state, position).state;
        break;
      case 14:
        state = recoverOpenPage(state, position).state;
        break;
      case 15:
        state = quitOutOfArena(engageBoss(enterArena(state)));
        break;
      case 16:
        state = bossDefeated(engageBoss(enterArena(state)));
        break;
      case 17: {
        const respawned = respawnAtHearth(state, stats, "cabin");
        state = leaveHearth(respawned.state);
        stats = respawned.stats;
        break;
      }
      case 18:
        state = setGearWeight(hostileContact(state).state, next() % 60);
        break;
      default: {
        const stepped = stepMeta(state, stats);
        state = stepped.state;
        stats = stepped.stats;
        break;
      }
    }
  }

  return state;
};

describe("save/load v2", () => {
  it("stamps the shipped version", () => {
    expect(SAVE_VERSION).toBe(2);
    expect(createMetaState().version).toBe(2);
  });

  it("round-trips a fresh state", () => {
    const state = createMetaState();
    expect(deserializeMetaState(serializeMetaState(state))).toEqual(state);
  });

  it("save → load → save is byte-identical for 60 played-out states", () => {
    for (let seed = 1; seed <= 60; seed += 1) {
      const state = playRandomly(seed, 120);
      const first = serializeMetaState(state);
      const second = serializeMetaState(deserializeMetaState(first));
      expect(second).toBe(first);
    }
  });

  it("serializes canonically, independent of key insertion order", () => {
    const state = playRandomly(7, 80);
    const shuffled = Object.fromEntries(
      Object.entries(state).reverse(),
    ) as unknown as MetaState;
    expect(serializeMetaState(shuffled)).toBe(serializeMetaState(state));
  });

  it("carries the Open Page, Numbness and arena state across a save", () => {
    const carried = awardNames(withInheritedVial(), "kill", "warden").state;
    const burnt = commitUse(beginEmberUse(carried), createMercyStats(carried)).state;
    const dead = recordDeath(engageBoss(enterArena(burnt)), { x: 1.5, y: 0, z: -2.5 }).state;

    const loaded = deserializeMetaState(serializeMetaState(dead));
    expect(loaded.openPage).toEqual({
      names: 800,
      position: { x: 1.5, y: 0, z: -2.5 },
      droppedAtTick: 0,
    });
    expect(loaded.numbnessStacks).toBe(1);
    expect(loaded.arena).toBe("deathReset");
    expect(loaded.life).toBe("dead");
  });
});

describe("migrateOrReject", () => {
  it("accepts the shipped version", () => {
    const state = createMetaState();
    expect(migrateOrReject(JSON.parse(serializeMetaState(state)))).toEqual(state);
  });

  it("rejects an unknown version explicitly", () => {
    const future = { ...createMetaState(), version: 3 };
    expect(() => migrateOrReject(future)).toThrow(SaveRejectedError);
    try {
      migrateOrReject(future);
    } catch (error) {
      expect((error as SaveRejectedError).reason).toBe("version");
      expect((error as SaveRejectedError).message).toContain("unsupported version 3");
    }
  });

  it("rejects a save that is not an object", () => {
    for (const bad of [null, 3, "save", [1, 2, 3]]) {
      expect(() => migrateOrReject(bad)).toThrow(SaveRejectedError);
    }
  });

  it("rejects a save missing mercy-loop fields", () => {
    expect(() => migrateOrReject({ version: 2, tick: 0 })).toThrow(/missing field\(s\)/);
  });

  it("rejects a save with no version at all", () => {
    expect(() => migrateOrReject({ tick: 0 })).toThrow(/missing numeric `version`/);
  });
});
