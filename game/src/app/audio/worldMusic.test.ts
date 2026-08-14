/**
 * SIM → music binder coverage (slice s19). Snapshots are hand-built literals:
 * the binder is pure, so no world is booted here. The silence requirements are
 * driven through the real music system and the committed `music_params.json`,
 * not through a restatement of the rule table.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import type { WorldDebugBoss, WorldDebugSnapshot } from "../../sim/world/types";
import { FakeAudioContext } from "./context";
import { loadCommittedAudioParams } from "./load_params";
import { createMusicSystem, parseMusicParams, type MusicParams } from "./music";
import { musicStateFromWorld } from "./worldMusic";

const here = dirname(fileURLToPath(import.meta.url));
const audio = loadCommittedAudioParams();

const loadParams = (): MusicParams =>
  parseMusicParams(
    JSON.parse(readFileSync(join(here, "../../data/music_params.json"), "utf8")) as unknown,
  );

interface SnapshotOptions {
  readonly zoneId?: string | null;
  readonly engaged?: boolean;
  readonly boss?: Partial<WorldDebugBoss>;
  readonly meta?: Partial<WorldDebugSnapshot["meta"]>;
  readonly hearth?: Partial<WorldDebugSnapshot["hearth"]>;
}

const snapshot = (options: SnapshotOptions = {}): WorldDebugSnapshot => ({
  tick: 12,
  stateHash: "test-hash",
  actors: [],
  targetId: null,
  tokenHolders: [],
  tokenInvariant: true,
  engaged: options.engaged ?? false,
  zoneId: options.zoneId ?? null,
  boss: {
    present: false,
    fsm: null,
    phase: null,
    pulse: 0,
    maxPulse: 0,
    arena: "outside",
    ceremonyActive: false,
    defeated: false,
    rootedUntilTick: 0,
    enteredArena: false,
    ...options.boss,
  },
  scenes: {
    activeId: null,
    completed: [],
    sliceExit: false,
    unwrittenTag: false,
  },
  meta: {
    life: "alive",
    doses: 2,
    maxDoses: 3,
    carriedNames: 7,
    openPage: null,
    lastHearthId: null,
    numbnessStacks: 0,
    vigilRestore: 0,
    atHearth: false,
    turn: 0,
    turnCap: 100,
    maxPulse: 100,
    maxBreath: 120,
    ...options.meta,
  },
  hearth: {
    nearbyId: null,
    lit: false,
    ...options.hearth,
  },
});

/** Latches one world snapshot on the real system and reports the track it earns. */
const trackFor = async (world: WorldDebugSnapshot): Promise<string | null> => {
  const context = new FakeAudioContext();
  const system = createMusicSystem({ params: loadParams(), audioParams: audio, context });
  await system.unlockFromGesture();
  context.currentTime = 0;
  system.setState(musicStateFromWorld(world));
  system.syncClock(0, 0);
  expect(system.snapshot().track).toBe(system.currentTrack);
  return system.currentTrack;
};

describe("musicStateFromWorld — zones", () => {
  it("names the arena in the vocabulary the rule table matches", () => {
    expect(musicStateFromWorld(snapshot({ zoneId: "ARENA" })).zone).toBe("arena");
  });

  it("keeps the approach road the road, whose default is silence", () => {
    expect(musicStateFromWorld(snapshot({ zoneId: "ROAD" })).zone).toBe("road");
  });

  it("licenses the threshold motif on the post-boss road coda", () => {
    expect(musicStateFromWorld(snapshot({ zoneId: "ROAD_CODA" })).zone).toBe("threshold");
  });

  it("lowercases every other baked zone id so it falls through to silence", () => {
    for (const [zoneId, zone] of [
      ["CABIN", "cabin"],
      ["YARD", "yard"],
      ["WOODLINE", "woodline"],
      ["FOREST", "forest"],
    ] as const) {
      expect(musicStateFromWorld(snapshot({ zoneId })).zone, zoneId).toBe(zone);
    }
  });

  it("falls back to the silent road outside every baked box", () => {
    expect(musicStateFromWorld(snapshot({ zoneId: null })).zone).toBe("road");
  });
});

describe("musicStateFromWorld — boss phase", () => {
  it("reports phase 0 for an absent Warden, one outside the arena, and a defeated one", () => {
    expect(musicStateFromWorld(snapshot({ boss: { present: false } })).bossPhase).toBe(0);
    expect(
      musicStateFromWorld(snapshot({ boss: { present: true, phase: "p1", arena: "outside" } }))
        .bossPhase,
    ).toBe(0);
    expect(
      musicStateFromWorld(
        snapshot({
          boss: { present: true, phase: "p2", arena: "victoryNoRespawn", defeated: true },
        }),
      ).bossPhase,
    ).toBe(0);
  });

  it("reports 1 during p1 and 2 during p2", () => {
    expect(
      musicStateFromWorld(snapshot({ boss: { present: true, phase: "p1", arena: "inFight" } }))
        .bossPhase,
    ).toBe(1);
    expect(
      musicStateFromWorld(snapshot({ boss: { present: true, phase: "p2", arena: "inFight" } }))
        .bossPhase,
    ).toBe(2);
  });

  it("holds the phase it is transitioning from while the ceremony runs", () => {
    const state = musicStateFromWorld(
      snapshot({
        zoneId: "ARENA",
        boss: {
          present: true,
          phase: "p1",
          arena: "inFight",
          fsm: "ceremony",
          ceremonyActive: true,
        },
      }),
    );
    expect(state.ceremony).toBe(true);
    expect(state.bossPhase).toBe(1);
  });
});

describe("musicStateFromWorld — rest and engagement", () => {
  it("rests at a lit Hearth the player stands in, but not at a cold one", () => {
    expect(
      musicStateFromWorld(snapshot({ hearth: { nearbyId: "hearth_arena", lit: true } })).hearthRest,
    ).toBe(true);
    expect(
      musicStateFromWorld(snapshot({ hearth: { nearbyId: "hearth_arena", lit: false } })).hearthRest,
    ).toBe(false);
    expect(musicStateFromWorld(snapshot({ hearth: { nearbyId: null, lit: true } })).hearthRest).toBe(
      false,
    );
  });

  it("rests on the meta flag alone, which the rest scene owns", () => {
    expect(musicStateFromWorld(snapshot({ meta: { atHearth: true } })).hearthRest).toBe(true);
  });

  it("mirrors the engaged latch into inCombat", () => {
    expect(musicStateFromWorld(snapshot({ engaged: true })).inCombat).toBe(true);
    expect(musicStateFromWorld(snapshot({ engaged: false })).inCombat).toBe(false);
  });
});

describe("musicStateFromWorld — through the real music system", () => {
  it("keeps the road silent, including during wolf combat", async () => {
    expect(await trackFor(snapshot({ zoneId: "ROAD" }))).toBeNull();
    expect(await trackFor(snapshot({ zoneId: "ROAD", engaged: true }))).toBeNull();
    expect(await trackFor(snapshot({ zoneId: "FOREST", engaged: true }))).toBeNull();
  });

  it("leaves an unknown zone silent", async () => {
    expect(await trackFor(snapshot({ zoneId: "NOT_A_BAKED_ZONE", engaged: true }))).toBeNull();
    expect(await trackFor(snapshot({ zoneId: null, engaged: true }))).toBeNull();
  });

  it("still earns the Warden beds in the arena, so the mapping is not silent by accident", async () => {
    expect(await trackFor(snapshot({ zoneId: "ARENA", engaged: true }))).toBe("warden_p1");
    expect(
      await trackFor(
        snapshot({ zoneId: "ARENA", boss: { present: true, phase: "p2", arena: "inFight" } }),
      ),
    ).toBe("warden_p2");
    expect(
      await trackFor(
        snapshot({
          zoneId: "ARENA",
          engaged: true,
          boss: { present: true, phase: "p1", arena: "inFight", ceremonyActive: true },
        }),
      ),
    ).toBe("warden_ceremony");
    expect(await trackFor(snapshot({ zoneId: "ROAD_CODA" }))).toBe("road_motif");
    expect(
      await trackFor(snapshot({ zoneId: "CABIN", hearth: { nearbyId: "hearth_cabin", lit: true } })),
    ).toBe("hearth_theme");
  });
});
