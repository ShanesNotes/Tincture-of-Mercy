/**
 * SIM → HUD binder coverage (slice s19). Snapshots are hand-built literals:
 * the binder is pure, so no world is booted here.
 */

import { describe, expect, it } from "vitest";

import { REGISTER_LOCKED_SCRIPTS } from "../../sim/scenes";
import type {
  WorldDebugActor,
  WorldDebugBoss,
  WorldDebugSnapshot,
} from "../../sim/world/types";
import { hudInputFromWorld, hudMenuForWorld } from "./live";

const ORIGIN = { x: 0, y: 0, z: 0 };

const actor = (overrides: Partial<WorldDebugActor> = {}): WorldDebugActor => ({
  id: "kalev",
  kind: "player",
  packId: null,
  active: true,
  position: ORIGIN,
  facing: 0,
  pulse: 65,
  breath: 40,
  actionId: null,
  actionTick: null,
  alive: true,
  invulnerable: false,
  hurtboxes: [],
  hitboxes: [],
  ...overrides,
});

interface SnapshotOptions {
  readonly actors?: readonly WorldDebugActor[];
  readonly zoneId?: string | null;
  readonly boss?: Partial<WorldDebugBoss>;
  readonly scenes?: Partial<WorldDebugSnapshot["scenes"]>;
  readonly meta?: Partial<WorldDebugSnapshot["meta"]>;
  readonly hearth?: Partial<WorldDebugSnapshot["hearth"]>;
}

const snapshot = (options: SnapshotOptions = {}): WorldDebugSnapshot => ({
  tick: 12,
  stateHash: "test-hash",
  actors: options.actors ?? [actor()],
  targetId: null,
  tokenHolders: [],
  tokenInvariant: true,
  engaged: false,
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
    ...options.scenes,
  },
  meta: {
    life: "alive",
    doses: 2,
    maxDoses: 3,
    carriedNames: 7,
    openPage: null,
    lastHearthId: null,
    numbnessStacks: 2,
    vigilRestore: 1,
    atHearth: false,
    turn: 30,
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

describe("hudInputFromWorld", () => {
  it("reads Pulse and Breath from the player actor and the maxima from meta", () => {
    const input = hudInputFromWorld(snapshot(), "kalev");
    expect(input.pulse).toBe(65);
    expect(input.breath).toBe(40);
    expect(input.maxPulse).toBe(100);
    expect(input.maxBreath).toBe(120);
  });

  it("falls back to the id match when no actor is flagged as the player", () => {
    const input = hudInputFromWorld(
      snapshot({
        actors: [
          actor({ id: "wolf_a", kind: "wolf", pulse: 10, breath: 10 }),
          actor({ id: "kalev", kind: "warden", pulse: 88, breath: 21 }),
        ],
      }),
      "kalev",
    );
    expect(input.pulse).toBe(88);
    expect(input.breath).toBe(21);
  });

  it("passes the mercy-loop counters and the unwritten tag through unchanged", () => {
    const input = hudInputFromWorld(
      snapshot({
        meta: { doses: 1, maxDoses: 4, carriedNames: 13, turn: 70, turnCap: 90 },
        scenes: { unwrittenTag: true },
      }),
      "kalev",
    );
    expect(input.doses).toBe(1);
    expect(input.maxDoses).toBe(4);
    expect(input.namesCarried).toBe(13);
    expect(input.turn).toBe(70);
    expect(input.turnCap).toBe(90);
    expect(input.numbnessStacks).toBe(2);
    expect(input.vigilRestore).toBe(1);
    expect(input.unwrittenTag).toBe(true);
  });

  it("renders the Hearth verdict as lit or unlit", () => {
    expect(hudInputFromWorld(snapshot({ hearth: { lit: true } }), "kalev").hearth).toBe("lit");
    expect(hudInputFromWorld(snapshot({ hearth: { lit: false } }), "kalev").hearth).toBe("unlit");
  });

  it("reads the cabin as domestic and every other zone as wild", () => {
    expect(hudInputFromWorld(snapshot({ zoneId: "CABIN" }), "kalev").zone).toBe("domestic");
    expect(hudInputFromWorld(snapshot({ zoneId: "YARD" }), "kalev").zone).toBe("wild");
    expect(hudInputFromWorld(snapshot({ zoneId: null }), "kalev").zone).toBe("wild");
  });

  it("locks the register while any register-locked script is active", () => {
    for (const scriptId of REGISTER_LOCKED_SCRIPTS) {
      const input = hudInputFromWorld(snapshot({ scenes: { activeId: scriptId } }), "kalev");
      expect(input.registerLocked).toBe(true);
    }
  });

  it("leaves the register open for other scenes and for no scene at all", () => {
    expect(
      hudInputFromWorld(snapshot({ scenes: { activeId: "hearth_vigil" } }), "kalev")
        .registerLocked,
    ).toBe(false);
    expect(hudInputFromWorld(snapshot({ scenes: { activeId: null } }), "kalev").registerLocked)
      .toBe(false);
  });
});

describe("hudInputFromWorld boss phase", () => {
  it("is none while the Warden is absent", () => {
    expect(hudInputFromWorld(snapshot(), "kalev").bossPhase).toBe("none");
  });

  it("is none while he is present but still outside the arena", () => {
    const input = hudInputFromWorld(
      snapshot({ boss: { present: true, phase: "p1", fsm: "approach", arena: "outside" } }),
      "kalev",
    );
    expect(input.bossPhase).toBe("none");
  });

  it("maps p1 and p2 to the phase verdicts once engaged", () => {
    const engaged = (phase: "p1" | "p2"): string =>
      hudInputFromWorld(
        snapshot({ boss: { present: true, phase, fsm: "neutral", arena: "inFight" } }),
        "kalev",
      ).bossPhase;
    expect(engaged("p1")).toBe("phase1");
    expect(engaged("p2")).toBe("phase2");
  });

  it("gives the ceremony its own verdict over the running phase", () => {
    const input = hudInputFromWorld(
      snapshot({
        boss: {
          present: true,
          phase: "p1",
          fsm: "ceremony",
          arena: "inFight",
          ceremonyActive: true,
        },
      }),
      "kalev",
    );
    expect(input.bossPhase).toBe("ceremony");
  });

  it("returns to none once he is defeated", () => {
    const input = hudInputFromWorld(
      snapshot({
        boss: {
          present: true,
          phase: "p2",
          fsm: "defeated",
          arena: "victoryNoRespawn",
          defeated: true,
        },
      }),
      "kalev",
    );
    expect(input.bossPhase).toBe("none");
  });
});

describe("hudMenuForWorld", () => {
  it("opens the death menu when the meta life phase is dead", () => {
    expect(hudMenuForWorld(snapshot({ meta: { life: "dead" } }), false)).toBe("death");
  });

  it("opens the death menu when the player actor is no longer alive", () => {
    expect(hudMenuForWorld(snapshot({ actors: [actor({ alive: false })] }), false)).toBe("death");
  });

  it("lets death beat both pause and a nearby Hearth", () => {
    const dead = snapshot({
      meta: { life: "dead" },
      hearth: { nearbyId: "hearth_cabin", lit: true },
    });
    expect(hudMenuForWorld(dead, true)).toBe("death");
  });

  it("lets pause beat a nearby Hearth", () => {
    const atHearth = snapshot({ hearth: { nearbyId: "hearth_cabin", lit: true } });
    expect(hudMenuForWorld(atHearth, true)).toBe("pause");
  });

  it("opens the Hearth menu while standing in one, and nothing otherwise", () => {
    expect(hudMenuForWorld(snapshot({ hearth: { nearbyId: "hearth_cabin" } }), false)).toBe(
      "hearth",
    );
    expect(hudMenuForWorld(snapshot(), false)).toBe("none");
  });
});
