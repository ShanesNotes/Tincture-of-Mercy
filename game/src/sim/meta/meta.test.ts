import { describe, expect, it } from "vitest";

import {
  arriveAtHearth,
  createMercyStats,
  createMetaState,
  hearthRest,
  hostileContact,
  leaveHearth,
  respawnAtHearth,
  stepMeta,
  withInheritedVial,
} from "./index";
import { bossDefeated, engageBoss, enterArena } from "./arena";
import type { MetaEvent } from "./events";
import { metaModifiers } from "./numbness";
import { markEnemyDefeated, recordDeath, recoverOpenPage } from "./openPage";
import { awardNames, bankNames, burdenBand, setGearWeight, spendNames } from "./progression";
import { deserializeMetaState, serializeMetaState } from "./save";
import { beginEmberUse, beginTinctureUse, commitUse } from "./tincture";
import type { MercyStats, MetaState, WorldPosition } from "./types";

const DEATH_SITE: WorldPosition = { x: -8, y: 0, z: 21.5 };

describe("the mercy loop, end to end", () => {
  it("plays the Ironwood shape: fight, fall, recover, keep vigil, burn Ember", () => {
    const events: MetaEvent[] = [];
    let state = withInheritedVial();
    let stats: MercyStats = createMercyStats(state);

    const record = (result: { state: MetaState; events: readonly MetaEvent[] }): void => {
      state = result.state;
      events.push(...result.events);
    };
    const tick = (count: number): void => {
      for (let index = 0; index < count; index += 1) {
        const stepped = stepMeta(state, stats);
        state = stepped.state;
        stats = stepped.stats;
      }
    };

    // Doorway 1v1 and the yard: three wolves witnessed, one dose spent.
    for (const wolf of ["wolf_doorway", "wolf_yard_1", "wolf_yard_2"]) {
      state = markEnemyDefeated(state, wolf);
      record(awardNames(state, "kill", "wolf"));
      tick(30);
    }
    stats = { ...stats, pulse: 60 };
    const drunk = commitUse(beginTinctureUse(state), stats);
    state = drunk.state;
    stats = drunk.stats;
    events.push(...drunk.events);
    expect(stats.pulse).toBe(200);
    expect(state.vial.doses).toBe(2);
    expect(state.names.carried).toBe(120);

    // The road ambush kills him. The page falls open.
    record(recordDeath(state, DEATH_SITE));
    expect(state.openPage?.names).toBe(120);

    const back = respawnAtHearth(state, stats, "road_hearth");
    state = back.state;
    stats = back.stats;
    events.push(...back.events);
    expect(state.life).toBe("alive");
    expect(state.vial.doses).toBe(3);
    expect(state.defeated).toEqual([]);

    // Walk back out and pick the leaves up.
    state = leaveHearth(state);
    record(hostileContact(state));
    tick(600);
    record(recoverOpenPage(state, DEATH_SITE));
    expect(state.names.carried).toBe(120);
    expect(state.openPage).toBeNull();

    // Write the Names at the Hearth, then spend them.
    state = arriveAtHearth(state, "road_hearth");
    record(bankNames(state));
    record(awardNames(state, "witness", "anna_death"));
    record(bankNames(state));
    expect(state.names.banked).toBe(420);
    record(spendNames(state, "pulse"));
    expect(state.names.spent).toBe(1);
    expect(state.names.banked).toBe(360);

    // The Warden. Ember is swallowed mid-fight; the language starts to die.
    state = engageBoss(enterArena(leaveHearth(state)));
    const burnt = commitUse(beginEmberUse(state), { ...stats, pulse: 12, turn: 95 });
    state = burnt.state;
    stats = burnt.stats;
    events.push(...burnt.events);
    expect(stats.turn).toBe(0);
    expect(metaModifiers(state).damagePercent).toBe(125);
    expect(metaModifiers(state).textStep).toBe(1);

    state = markEnemyDefeated(bossDefeated(state), "warden");
    record(awardNames(state, "kill", "warden"));
    record(awardNames(state, "notebook", "warden_tag"));
    expect(state.arena).toBe("victoryNoRespawn");

    // Keeping vigil after the kill gives some of the words back, not the stack.
    const rested = hearthRest(state, stats, "arena_hearth");
    state = rested.state;
    stats = rested.stats;
    events.push(...rested.events);
    expect(state.numbnessStacks).toBe(1);
    expect(metaModifiers(state).textStep).toBe(0);
    expect(state.defeated).toEqual(["warden"]);

    // Every presenter/HUD event the slice promises actually fired.
    expect(new Set(events.map((event) => event.type))).toEqual(
      new Set([
        "names-changed",
        "dose-used",
        "death",
        "page-dropped",
        "page-recovered",
        "hearth-rested",
        "ember-used",
        "numbness-changed",
      ]),
    );

    // And the whole run survives a save.
    expect(deserializeMetaState(serializeMetaState(state))).toEqual(state);
  });

  it("Burden bands react to gear the moment it is equipped", () => {
    const light = setGearWeight(createMetaState(), 5);
    expect(burdenBand(light)).toBe("light");
    expect(burdenBand(setGearWeight(light, 35))).toBe("heavy");
  });
});
