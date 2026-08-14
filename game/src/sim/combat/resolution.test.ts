import { describe, expect, it } from "vitest";

import { resolveHitBatch, type HitActorSnapshot } from "./resolution";

const actor = (
  id: string,
  overrides: Partial<HitActorSnapshot> = {},
): HitActorSnapshot => ({
  breath: 100,
  combatClock: 0,
  guarding: false,
  hyperarmorPoise: 0,
  id,
  invulnerable: false,
  negation: { pierce: 0, slash: 0, standard: 0, strike: 0, wither: 0 },
  poiseBands: { flinch: 10, knockdown: 30, stagger: 20 },
  position: { x: 0, y: 0, z: 0 },
  pulse: 100,
  steadyBuildup: 0,
  steadyCleanTicks: 0,
  turnBuildup: 0,
  turned: false,
  ...overrides,
});

const params = {
  guardAbsorption: 0.55,
  guardBreathMultiplier: 0.35,
  guardBreakHitstopTicks: 9,
  guardBreakStaggerTicks: 60,
  hitstopTicks: {
    blocked: 5,
    charged: 8,
    critical: 12,
    death: 12,
    guard_break: 9,
    heavy: 6,
    light: 3,
  },
  riposteWindowTicks: 90,
  turnThreshold: 100,
  witherPoiseMultiplier: 1.4,
} as const;

describe("resolveHitBatch", () => {
  it("resolves simultaneous lethal hits from the same tick-start snapshot", () => {
    const result = resolveHitBatch(
      [actor("a", { pulse: 40 }), actor("b", { pulse: 40 })],
      [
        {
          attackerFacingRadians: 0,
          attackerId: "a",
          critical: false,
          damageType: "slash",
          hitstopClass: "heavy",
          knockback: { forward: 0, right: 0 },
          poiseDamage: 24,
          pulseDamage: 50,
          swingId: "a:1",
          targetId: "b",
          witherBuildup: 0,
        },
        {
          attackerFacingRadians: Math.PI,
          attackerId: "b",
          critical: false,
          damageType: "strike",
          hitstopClass: "heavy",
          knockback: { forward: 0, right: 0 },
          poiseDamage: 24,
          pulseDamage: 50,
          swingId: "b:1",
          targetId: "a",
          witherBuildup: 0,
        },
      ],
      [],
      params,
      12,
      0,
    );

    expect(result.actors.a?.pulse).toBe(0);
    expect(result.actors.b?.pulse).toBe(0);
    expect(result.events.filter((event) => event.kind === "death")).toHaveLength(2);
    expect(result.hitstopByActor).toEqual({ a: 12, b: 12 });
  });

  it("gives i-frames precedence and locks one target per swing", () => {
    const hit = {
      attackerFacingRadians: 0,
      attackerId: "a",
      critical: false,
      damageType: "standard" as const,
      hitstopClass: "light" as const,
      knockback: { forward: 0, right: 0 },
      poiseDamage: 10,
      pulseDamage: 20,
      swingId: "a:1",
      targetId: "b",
      witherBuildup: 0,
    };
    const invulnerable = resolveHitBatch(
      [actor("a"), actor("b", { invulnerable: true })],
      [hit],
      [],
      params,
      1,
      0,
    );
    expect(invulnerable.actors.b?.pulse).toBe(100);
    expect(invulnerable.hitLedger).toEqual([]);

    const duplicate = resolveHitBatch(
      [actor("a"), actor("b")],
      [hit, hit],
      [],
      params,
      1,
      0,
    );
    expect(duplicate.actors.b?.pulse).toBe(80);
    expect(duplicate.hitLedger).toEqual(["a:1>b"]);

    const alreadyDead = resolveHitBatch(
      [actor("a"), actor("b", { pulse: 0 })],
      [hit],
      [],
      params,
      2,
      0,
    );
    expect(alreadyDead.events).toEqual([]);
    expect(alreadyDead.hitLedger).toEqual([]);
  });

  it("aggregates guarded chip and Breath before one guard break", () => {
    const result = resolveHitBatch(
      [actor("a"), actor("b", { breath: 35, combatClock: 10, guarding: true })],
      [
        {
          attackerFacingRadians: 0,
          attackerId: "a",
          critical: false,
          damageType: "standard",
          hitstopClass: "heavy",
          knockback: { forward: 1, right: 0 },
          poiseDamage: 24,
          pulseDamage: 100,
          swingId: "a:1",
          targetId: "b",
          witherBuildup: 0,
        },
      ],
      [],
      params,
      5,
      10,
    );

    expect(result.actors.b).toMatchObject({
      breath: 0,
      pulse: 55,
      riposteUntilClock: 100,
      staggerUntilClock: 70,
    });
    expect(result.events.filter((event) => event.kind === "guard_break")).toHaveLength(1);
    expect(result.hitstopByActor).toEqual({ a: 9, b: 9 });
  });

  it("builds the Turn and emits only the strongest Steady outcome", () => {
    const result = resolveHitBatch(
      [actor("a"), actor("b")],
      [
        {
          attackerFacingRadians: 0,
          attackerId: "a",
          critical: false,
          damageType: "wither",
          hitstopClass: "light",
          knockback: { forward: 0.5, right: 0 },
          poiseDamage: 24,
          pulseDamage: 5,
          swingId: "a:1",
          targetId: "b",
          witherBuildup: 100,
        },
      ],
      [],
      params,
      3,
      0,
    );

    expect(result.actors.b).toMatchObject({ steadyBuildup: 33.6, turnBuildup: 100, turned: true });
    expect(result.events.filter((event) => event.kind === "stagger")).toEqual([
      expect.objectContaining({ severity: "knockdown", targetId: "b" }),
    ]);
    expect(result.displacements.b).toEqual({ x: 0, y: 0, z: 0.5 });
  });

  it("adds active hyperarmor poise to reaction thresholds without losing buildup", () => {
    const result = resolveHitBatch(
      [actor("a"), actor("b", { hyperarmorPoise: 25 })],
      [
        {
          attackerFacingRadians: 0,
          attackerId: "a",
          critical: false,
          damageType: "strike",
          hitstopClass: "heavy",
          knockback: { forward: 0, right: 0 },
          poiseDamage: 24,
          pulseDamage: 1,
          swingId: "a:heavy",
          targetId: "b",
          witherBuildup: 0,
        },
      ],
      [],
      params,
      3,
      0,
    );

    expect(result.actors.b?.steadyBuildup).toBe(24);
    expect(result.events.some((event) => event.kind === "stagger")).toBe(false);
  });
});
