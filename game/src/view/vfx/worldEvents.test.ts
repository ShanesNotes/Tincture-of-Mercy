import { Object3D, PointLight } from "three/webgpu";
import { describe, expect, it } from "vitest";

import { EMBLEM_VERBS, registerEmblem } from "../register/lights";
import type { WorldEvent, WorldEventPayload } from "../../sim/world/types";
import { applyVfxEvents, createVfxState } from "./controller";
import { VFX_PARAMS } from "./params";
import { vfxEventsFromWorld, type VfxWorldContext } from "./worldEvents";

let nextSequence = 0;

const worldEvent = (
  source: WorldEvent["source"],
  tick: number,
  payload: WorldEventPayload,
  actorId: string | null = null,
): WorldEvent => {
  nextSequence += 1;
  return { sequence: nextSequence, tick, source, actorId, payload };
};

const damage = (tick: number, targetId: string): WorldEvent =>
  worldEvent(
    "combat",
    tick,
    {
      actorId: "kalev",
      amount: 38,
      damageType: "slash",
      guarded: false,
      kind: "damage",
      sequence: 1,
      targetId,
      tick,
    },
    "kalev",
  );

const hitstop = (tick: number, targetId: string, durationTicks: number): WorldEvent =>
  worldEvent("combat", tick, {
    actorId: "kalev",
    contact: { x: 0, y: 0, z: 0 },
    durationTicks,
    kind: "hitstop",
    sequence: 2,
    targetId,
    tick,
  });

describe("vfxEventsFromWorld — combat rows", () => {
  it("maps a damage event to a hit with the honest contact/direction defaults", () => {
    expect(vfxEventsFromWorld([damage(40, "wolf-a")])).toStrictEqual([
      {
        kind: "hit",
        tick: 40,
        targetId: "wolf-a",
        hitstopTicks: 0,
        direction: [0, 0],
        contact: [0, 0, 0],
      },
    ]);
  });

  it("reads hitstopTicks from a paired hitstop event on the same tick and target", () => {
    const mapped = vfxEventsFromWorld([damage(40, "wolf-a"), hitstop(40, "wolf-a", 6)]);
    expect(mapped).toStrictEqual([
      {
        kind: "hit",
        tick: 40,
        targetId: "wolf-a",
        hitstopTicks: 6,
        direction: [0, 0],
        contact: [0, 0, 0],
      },
    ]);
  });

  it("does not borrow a hitstop from another target or another tick", () => {
    const mapped = vfxEventsFromWorld([
      damage(40, "wolf-a"),
      hitstop(40, "wolf-b", 6),
      hitstop(41, "wolf-a", 8),
    ]);
    expect(mapped).toHaveLength(1);
    expect(mapped[0]).toMatchObject({ kind: "hit", hitstopTicks: 0 });
  });

  it("maps guard_break", () => {
    const event = worldEvent("combat", 52, {
      actorId: "kalev",
      kind: "guard_break",
      riposteUntilClock: 70,
      sequence: 3,
      targetId: "wolf-a",
      tick: 52,
    });
    expect(vfxEventsFromWorld([event, hitstop(52, "wolf-a", 9)])).toStrictEqual([
      {
        kind: "guard_break",
        tick: 52,
        targetId: "wolf-a",
        hitstopTicks: 9,
        direction: [0, 0],
        contact: [0, 0, 0],
      },
    ]);
  });

  it("maps death", () => {
    const event = worldEvent("combat", 61, {
      actorId: "kalev",
      kind: "death",
      sequence: 4,
      targetId: "wolf-a",
      tick: 61,
    });
    expect(vfxEventsFromWorld([event, hitstop(61, "wolf-a", 12)])).toStrictEqual([
      {
        kind: "death",
        tick: 61,
        targetId: "wolf-a",
        hitstopTicks: 12,
        direction: [0, 0],
        contact: [0, 0, 0],
      },
    ]);
  });

  it("emits nothing for stagger, action, or bare hitstop rows", () => {
    const rows: readonly WorldEvent[] = [
      worldEvent("combat", 10, {
        actorId: "kalev",
        kind: "stagger",
        sequence: 5,
        severity: "flinch",
        targetId: "wolf-a",
        tick: 10,
      }),
      worldEvent("combat", 11, {
        actionId: "light_1",
        actorId: "kalev",
        kind: "action_started",
        sequence: 6,
        tick: 11,
      }),
      hitstop(12, "wolf-a", 3),
    ];
    expect(vfxEventsFromWorld(rows)).toStrictEqual([]);
  });
});

describe("vfxEventsFromWorld — meta rows", () => {
  it("maps dose-used to a flask carrying the envelope actor", () => {
    const event = worldEvent(
      "meta",
      80,
      { type: "dose-used", tick: 80, variant: "pulseleaf_draught", dosesLeft: 2, healedPulse: 45 },
      "kalev",
    );
    expect(vfxEventsFromWorld([event])).toStrictEqual([
      { kind: "flask", tick: 80, actorId: "kalev" },
    ]);
  });

  it("maps ember-used to an ember", () => {
    const event = worldEvent(
      "meta",
      90,
      { type: "ember-used", tick: 90, dosesLeft: 1, numbnessStacks: 1 },
      "kalev",
    );
    expect(vfxEventsFromWorld([event])).toStrictEqual([
      { kind: "ember", tick: 90, actorId: "kalev" },
    ]);
  });

  it("emits nothing for unmapped meta rows", () => {
    const event = worldEvent(
      "meta",
      95,
      { type: "hearth-rested", tick: 95, hearthId: "hearth-a", doses: 3 },
      "kalev",
    );
    expect(vfxEventsFromWorld([event])).toStrictEqual([]);
  });
});

describe("vfxEventsFromWorld — boss rows", () => {
  const witherPulse = (tick: number, witherAmount: number): WorldEvent =>
    worldEvent(
      "boss",
      tick,
      { type: "wither-pulse-applied", targetId: "kalev", witherAmount, radiusMeters: 6 },
      "kalev",
    );

  it("normalizes the authored quiet amount to full density", () => {
    expect(vfxEventsFromWorld([witherPulse(100, 25)])).toStrictEqual([
      { kind: "wither", tick: 100, density: 1 },
    ]);
  });

  it("normalizes a partial pulse proportionally", () => {
    expect(vfxEventsFromWorld([witherPulse(100, 10)])).toStrictEqual([
      { kind: "wither", tick: 100, density: 0.4 },
    ]);
  });

  it("clamps density to [0, 1]", () => {
    expect(vfxEventsFromWorld([witherPulse(100, 90)])).toStrictEqual([
      { kind: "wither", tick: 100, density: 1 },
    ]);
    expect(vfxEventsFromWorld([witherPulse(100, -5)])).toStrictEqual([
      { kind: "wither", tick: 100, density: 0 },
    ]);
  });

  it("maps a chiming snare contact to a tag chime", () => {
    const event = worldEvent("boss", 110, {
      type: "snare-contact",
      tick: 110,
      actorId: "kalev",
      rootTicks: 30,
      chime: true,
    });
    expect(vfxEventsFromWorld([event])).toStrictEqual([
      { kind: "tag_chime", tick: 110, contact: [0, 0, 0] },
    ]);
  });

  it("emits nothing for a silent snare contact", () => {
    const event = worldEvent("boss", 110, {
      type: "snare-contact",
      tick: 110,
      actorId: "kalev",
      rootTicks: 30,
      chime: false,
    });
    expect(vfxEventsFromWorld([event])).toStrictEqual([]);
  });

  it("emits nothing for snare-root-applied or other warden rows", () => {
    const rows: readonly WorldEvent[] = [
      worldEvent("boss", 111, { type: "snare-root-applied", targetId: "kalev", untilTick: 141 }),
      worldEvent("boss", 112, { type: "phase-changed", tick: 112, phase: "p2" }),
    ];
    expect(vfxEventsFromWorld(rows)).toStrictEqual([]);
  });
});

describe("vfxEventsFromWorld — stream discipline", () => {
  it("emits nothing for motion, ai, scene, and world rows", () => {
    const rows: readonly WorldEvent[] = [
      worldEvent("motion", 1, { type: "landed", tick: 1, fallMeters: 2, lagTicks: 4 }),
      worldEvent("ai", 2, { tick: 2, kind: "damage", wolfId: "wolf-a", detail: "decoy" }),
      worldEvent("scenes", 3, { type: "hud-border-wake", tick: 3 }),
      worldEvent("world", 4, { type: "world-respawn", hearthId: "hearth-a" }),
    ];
    expect(vfxEventsFromWorld(rows)).toStrictEqual([]);
  });

  it("preserves input order and carries every tick through", () => {
    const rows: readonly WorldEvent[] = [
      worldEvent(
        "boss",
        5,
        { type: "wither-pulse-applied", targetId: "kalev", witherAmount: 25, radiusMeters: 6 },
        "kalev",
      ),
      damage(6, "wolf-a"),
      worldEvent("scenes", 7, { type: "hud-border-wake", tick: 7 }),
      worldEvent(
        "meta",
        8,
        { type: "dose-used", tick: 8, variant: "pulseleaf_draught", dosesLeft: 0, healedPulse: 45 },
        "kalev",
      ),
      worldEvent("boss", 9, {
        type: "snare-contact",
        tick: 9,
        actorId: "kalev",
        rootTicks: 30,
        chime: true,
      }),
    ];
    const mapped = vfxEventsFromWorld(rows);
    expect(mapped.map((event) => event.kind)).toStrictEqual([
      "wither",
      "hit",
      "flask",
      "tag_chime",
    ]);
    expect(mapped.map((event) => event.tick)).toStrictEqual([5, 6, 8, 9]);
  });

  it("maps an empty stream to an empty stream", () => {
    expect(vfxEventsFromWorld([])).toStrictEqual([]);
  });
});

describe("vfxEventsFromWorld — same-tick trade (gauntlet K2/K10 repro)", () => {
  // Real-stream shape, per sim/world/step.ts + sim/combat/resolution.ts:
  // - The world step stamps every envelope with `nextTick`; combat payloads
  //   carry the pre-step `worldTick`, so the envelope runs one tick ahead of
  //   the payload on every combat row.
  // - resolveHitBatch freezes BOTH attacker and target of each accepted hit
  //   and merges per actor with max semantics, so in a light1 (3t) vs lunge
  //   (6t) trade both actors' `hitstop` rows carry 6t.
  // - The live context re-derives the freeze from the post-step snapshot's
  //   actionId; in a trade both actors were interrupted by the other's hit,
  //   so that re-derivation resolves to 0 for both damage rows.
  const SIM_TICK = 40;
  const ENVELOPE_TICK = SIM_TICK + 1;

  const tradeDamage = (actorId: string, targetId: string, amount: number): WorldEvent =>
    worldEvent(
      "combat",
      ENVELOPE_TICK,
      {
        actorId,
        amount,
        damageType: "slash",
        guarded: false,
        kind: "damage",
        sequence: 10,
        targetId,
        tick: SIM_TICK,
      },
      actorId,
    );

  const tradeHitstop = (attackerId: string, targetId: string, durationTicks: number): WorldEvent =>
    worldEvent("combat", ENVELOPE_TICK, {
      actorId: attackerId,
      contact: { x: 0, y: 0, z: 0 },
      durationTicks,
      kind: "hitstop",
      sequence: 11,
      targetId,
      tick: SIM_TICK,
    });

  /** kalev's light1 trades with the wolf's lunge on the same sim tick. */
  const tradeStream = (): readonly WorldEvent[] => [
    tradeDamage("kalev", "wolf-a", 28), // light1: light class (3t) per frame_data
    tradeDamage("wolf-a", "kalev", 38), // lunge: heavy class (6t) per frame_data
    tradeHitstop("kalev", "wolf-a", 6), // merged max(3 own, 6 taken)
    tradeHitstop("wolf-a", "kalev", 6), // merged max(6 own, 3 taken)
  ];

  /** The live adapter's post-step pose re-derivation, interrupted by the trade. */
  const interruptedContext: VfxWorldContext = {
    hitstopTicksFor: () => 0,
    contactFor: () => [0, 0, 0],
    directionFor: () => [0, 0],
  };

  it("emits BOTH blooms when two actors trade hits on the same tick", () => {
    const mapped = vfxEventsFromWorld(tradeStream(), interruptedContext);
    expect(mapped).toHaveLength(2);
    expect(mapped.map((event) => event.kind)).toStrictEqual(["hit", "hit"]);

    const applied = applyVfxEvents(createVfxState(), mapped, ENVELOPE_TICK, VFX_PARAMS);
    expect(applied.blooms).toHaveLength(2);
    expect(applied.blooms.map((bloom) => bloom.hitstopClass)).toStrictEqual([
      "heavy",
      "heavy",
    ]);
  });

  it("consumes the sim's hitstop events as the ONLY freeze source (never the context)", () => {
    const forbiddingContext: VfxWorldContext = {
      hitstopTicksFor: () => {
        throw new Error("post-step pose re-derivation must not be consulted");
      },
      contactFor: () => [0, 0, 0],
      directionFor: () => [0, 0],
    };
    const mapped = vfxEventsFromWorld(tradeStream(), forbiddingContext);
    expect(mapped).toHaveLength(2);
  });

  it("pairs a hitstop row with its damage row across the envelope off-by-one (K10)", () => {
    const mapped = vfxEventsFromWorld([
      tradeDamage("kalev", "wolf-a", 28),
      tradeHitstop("kalev", "wolf-a", 3),
    ]);
    expect(mapped).toStrictEqual([
      {
        kind: "hit",
        tick: ENVELOPE_TICK,
        targetId: "wolf-a",
        hitstopTicks: 3,
        direction: [0, 0],
        contact: [0, 0, 0],
      },
    ]);
  });
});

describe("EMBLEM_VERBS", () => {
  it("carries the promoted mercy verb", () => {
    expect(EMBLEM_VERBS).toContain("mercy");
  });

  it("registers a mercy emblem on the shared registry", () => {
    const node = new Object3D();
    node.add(new PointLight(0xa87a2e, 1, 4));
    const record = registerEmblem("vial-mercy-test", "mercy", node);
    expect(record.verb).toBe("mercy");
    expect(record.node).toBe(node);
  });
});
