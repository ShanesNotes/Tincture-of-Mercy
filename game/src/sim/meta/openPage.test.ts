import { describe, expect, it } from "vitest";

import { arriveAtHearth, createMercyStats, createMetaState, respawnAtHearth } from "./index";
import {
  isEnemyDefeated,
  markEnemyDefeated,
  recordDeath,
  recoverOpenPage,
  respawnEnemies,
  respawnsOnRest,
} from "./openPage";
import { awardNames, bankNames } from "./progression";
import type { MetaState, WorldPosition } from "./types";

const FELL_AT: WorldPosition = { x: 12.5, y: 0.25, z: -4 };

const carrying = (names: number): MetaState => {
  const state = createMetaState();
  return { ...state, names: { ...state.names, carried: names } };
};

describe("the Open Page", () => {
  it("drops the unbanked Names at the exact death site", () => {
    const result = recordDeath(carrying(240), FELL_AT);

    expect(result.state.life).toBe("dead");
    expect(result.state.names.carried).toBe(0);
    expect(result.state.openPage).toEqual({
      names: 240,
      position: FELL_AT,
      droppedAtTick: 0,
    });
    // GATES F11: the page is recorded at the death position, so the distance is 0m.
    expect(result.state.openPage?.position).toBe(FELL_AT);
    expect(result.events.map((event) => event.type)).toEqual([
      "death",
      "page-dropped",
      "names-changed",
    ]);
  });

  it("leaves banked Names alone", () => {
    const banked = bankNames(arriveAtHearth(awardNames(createMetaState(), "kill", "warden").state, "road")).state;
    const dead = recordDeath({ ...banked, atHearth: false }, FELL_AT).state;
    expect(dead.names.banked).toBe(800);
    expect(dead.openPage).toBeNull();
  });

  it("one recovery restores all of them", () => {
    const dead = recordDeath(carrying(240), FELL_AT).state;
    const recovered = recoverOpenPage(dead, FELL_AT);

    expect(recovered.state.names.carried).toBe(240);
    expect(recovered.state.openPage).toBeNull();
    expect(recovered.events.map((event) => event.type)).toEqual([
      "page-recovered",
      "names-changed",
    ]);
  });

  it("cannot be recovered from out of reach", () => {
    const dead = recordDeath(carrying(240), FELL_AT).state;
    const far = recoverOpenPage(dead, { x: FELL_AT.x + 2, y: FELL_AT.y, z: FELL_AT.z });
    expect(far.state).toBe(dead);
    expect(far.events).toEqual([]);
  });

  it("dying again before the recovery loses them permanently", () => {
    const first = recordDeath(carrying(240), FELL_AT).state;
    const withMore: MetaState = { ...first, names: { ...first.names, carried: 55 } };
    const second = recordDeath(withMore, { x: 0, y: 0, z: 0 });

    expect(second.events).toContainEqual({ type: "page-lost", tick: 0, names: 240 });
    expect(second.state.openPage).toEqual({
      names: 55,
      position: { x: 0, y: 0, z: 0 },
      droppedAtTick: 0,
    });

    const recovered = recoverOpenPage(second.state, { x: 0, y: 0, z: 0 }).state;
    expect(recovered.names.carried).toBe(55);
    expect(recovered.openPage).toBeNull();
  });

  it("dying with nothing carried still forfeits the old page", () => {
    const first = recordDeath(carrying(240), FELL_AT).state;
    const second = recordDeath(first, { x: 3, y: 0, z: 3 });
    expect(second.state.openPage).toBeNull();
    expect(second.events.map((event) => event.type)).toEqual(["death", "page-lost"]);
  });
});

describe("enemy respawn registry", () => {
  it("respawns standard enemies and never the boss", () => {
    expect(respawnsOnRest("wolf_doorway")).toBe(true);
    expect(respawnsOnRest("warden")).toBe(false);
  });

  it("clears the standard dead at a rest and holds the boss down", () => {
    let state = createMetaState();
    state = markEnemyDefeated(state, "wolf_yard_2");
    state = markEnemyDefeated(state, "wolf_yard_1");
    state = markEnemyDefeated(state, "warden");
    expect(state.defeated).toEqual(["warden", "wolf_yard_1", "wolf_yard_2"]);

    const rested = respawnEnemies(state);
    expect(rested.defeated).toEqual(["warden"]);
    expect(isEnemyDefeated(rested, "wolf_yard_1")).toBe(false);
    expect(isEnemyDefeated(rested, "warden")).toBe(true);
  });

  it("keeps the defeated list sorted and deduplicated for byte-stable saves", () => {
    const once = markEnemyDefeated(createMetaState(), "wolf_road_3");
    expect(markEnemyDefeated(once, "wolf_road_3")).toBe(once);
  });
});

describe("death → respawn", () => {
  it("returns you alive at the Hearth with the vial drawn again", () => {
    const state = carrying(90);
    const spent: MetaState = {
      ...markEnemyDefeated(state, "wolf_doorway"),
      inherited: true,
      vial: { ...state.vial, doses: 0 },
    };
    const dead = recordDeath(spent, FELL_AT).state;
    const stats = { ...createMercyStats(dead), pulse: 0, breath: 0, turn: 70 };

    const back = respawnAtHearth(dead, stats, "cabin");
    expect(back.state.life).toBe("alive");
    expect(back.state.vial.doses).toBe(3);
    expect(back.state.defeated).toEqual([]);
    expect(back.stats).toEqual({ ...stats, pulse: 300, breath: 100, turn: 0 });
    expect(back.state.openPage).not.toBeNull();
    expect(back.events.map((event) => event.type)).toContain("hearth-rested");
  });

  it("does nothing to a living player", () => {
    const state = createMetaState();
    const stats = createMercyStats(state);
    expect(respawnAtHearth(state, stats, "cabin").state).toBe(state);
  });
});
