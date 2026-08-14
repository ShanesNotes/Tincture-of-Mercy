import { describe, expect, it } from "vitest";

import { detectActiveSwingHits } from "./detection";
import type { Capsule } from "./geometry";

const capsule = (x: number, radius = 0.1): Capsule => ({
  a: { x, y: 0.5, z: 0 },
  b: { x, y: 1.5, z: 0 },
  radius,
});

describe("detectActiveSwingHits", () => {
  it("uses action-clock active windows and deduplicates a target's hurtboxes", () => {
    const shared = {
      actionTick: 11,
      activeWindows: [[11, 15]] as const,
      combatClock: 40,
      gridCellSize: 1,
      previousWeapon: capsule(-2, 0.05),
      currentWeapon: capsule(2, 0.05),
      rehitLedger: [],
      rehitLockoutTicks: 35,
      swingId: "kalev:1",
      targets: [
        { id: "dummy", hurtboxes: [capsule(0, 0.35), capsule(0.1, 0.25)] },
      ],
    };

    expect(detectActiveSwingHits(shared)).toMatchObject({
      contacts: [{ substep: expect.any(Number), targetId: "dummy" }],
      rehitLedger: [{ eligibleAtCombatClock: 75, key: "kalev:1>dummy" }],
    });
    expect(detectActiveSwingHits({ ...shared, actionTick: 15 }).contacts).toEqual([]);
  });

  it("honors authored re-hit lockout and returns deterministic target order", () => {
    const result = detectActiveSwingHits({
      actionTick: 2,
      activeWindows: [[0, 4]],
      combatClock: 20,
      gridCellSize: 1,
      previousWeapon: capsule(-3, 0.05),
      currentWeapon: capsule(3, 0.05),
      rehitLedger: [{ eligibleAtCombatClock: 21, key: "swing>b" }],
      rehitLockoutTicks: 5,
      swingId: "swing",
      targets: [
        { id: "b", hurtboxes: [capsule(1, 0.35)] },
        { id: "a", hurtboxes: [capsule(-1, 0.35)] },
      ],
    });

    expect(result.contacts.map((contact) => contact.targetId)).toEqual(["a"]);
    expect(result.rehitLedger).toContainEqual({
      eligibleAtCombatClock: 25,
      key: "swing>a",
    });
  });
});
