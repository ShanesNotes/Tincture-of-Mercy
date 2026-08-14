import { describe, expect, it } from "vitest";

import {
  arenaOnDeath,
  arenaOnRespawn,
  bossDefeated,
  bossIsDown,
  engageBoss,
  enterArena,
  quitOutOfArena,
} from "./arena";
import { createMercyStats, createMetaState, respawnAtHearth } from "./index";
import { markEnemyDefeated, recordDeath, respawnEnemies } from "./openPage";
import type { MetaState } from "./types";

const inFight = (): MetaState => engageBoss(enterArena(createMetaState()));

describe("boss-arena run state", () => {
  it("walks outside → entered → inFight → victory", () => {
    const outside = createMetaState();
    expect(outside.arena).toBe("outside");

    const entered = enterArena(outside);
    expect(entered.arena).toBe("entered");

    const fighting = engageBoss(entered);
    expect(fighting.arena).toBe("inFight");

    const won = bossDefeated(fighting);
    expect(won.arena).toBe("victoryNoRespawn");
    expect(bossIsDown(won)).toBe(true);
  });

  it("victory is terminal — re-entering never restarts the boss", () => {
    const won = bossDefeated(inFight());
    expect(enterArena(won)).toBe(won);
    expect(engageBoss(won)).toBe(won);
    expect(arenaOnDeath(won)).toBe(won);
    expect(quitOutOfArena(won)).toBe(won);
  });

  it("a mid-fight quit-out resets to entered", () => {
    expect(quitOutOfArena(inFight()).arena).toBe("entered");
  });

  it("quitting out anywhere else changes nothing", () => {
    const outside = createMetaState();
    expect(quitOutOfArena(outside)).toBe(outside);
    const entered = enterArena(outside);
    expect(quitOutOfArena(entered)).toBe(entered);
  });

  it("death inside the ring resets the encounter, respawn closes the gate", () => {
    const died = arenaOnDeath(inFight());
    expect(died.arena).toBe("deathReset");
    expect(arenaOnRespawn(died).arena).toBe("outside");
  });

  it("death outside the ring leaves the arena alone", () => {
    const outside = createMetaState();
    expect(arenaOnDeath(outside)).toBe(outside);
  });

  it("recording a death drives the arena transition", () => {
    const result = recordDeath(inFight(), { x: 0, y: 0, z: 0 });
    expect(result.state.arena).toBe("deathReset");

    const back = respawnAtHearth(result.state, createMercyStats(result.state), "arena");
    expect(back.state.arena).toBe("outside");
  });

  it("the boss stays dead through a rest after victory", () => {
    const won = markEnemyDefeated(bossDefeated(inFight()), "warden");
    expect(respawnEnemies(won).defeated).toEqual(["warden"]);
    expect(bossIsDown(respawnEnemies(won))).toBe(true);
  });
});
