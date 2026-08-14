import { describe, expect, it } from "vitest";

import {
  isInsideRearCone,
  isRiposteWindowOpen,
  resolveGuard,
} from "./defense";

describe("resolveGuard", () => {
  const params = { absorption: 0.55, breathCostMultiplier: 0.35 };

  it("turns an incoming hit into chip and a Breath cost", () => {
    expect(resolveGuard(100, 80, params)).toEqual({
      blocked: true,
      breathAfter: 45,
      breathCost: 35,
      guardBroken: false,
      pulseDamage: 45,
    });
  });

  it("breaks guard when paying the block cost reaches zero Breath", () => {
    expect(resolveGuard(100, 35, params)).toEqual({
      blocked: true,
      breathAfter: 0,
      breathCost: 35,
      guardBroken: true,
      pulseDamage: 45,
    });
  });
});

describe("critical eligibility", () => {
  it("accepts an attacker within the target's 30 degree rear cone", () => {
    expect(
      isInsideRearCone(
        { x: 0, z: -1 },
        { x: 0, z: 0 },
        0,
        Math.PI / 6,
      ),
    ).toBe(true);
    expect(
      isInsideRearCone(
        { x: 1, z: 0 },
        { x: 0, z: 0 },
        0,
        Math.PI / 6,
      ),
    ).toBe(false);
  });

  it("keeps the riposte window half-open", () => {
    expect(isRiposteWindowOpen(40, 40, 90)).toBe(true);
    expect(isRiposteWindowOpen(129, 40, 90)).toBe(true);
    expect(isRiposteWindowOpen(130, 40, 90)).toBe(false);
  });
});
