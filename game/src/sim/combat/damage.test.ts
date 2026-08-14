import { describe, expect, it } from "vitest";

import {
  applyAuthoredDisplacement,
  applyDamageNegation,
  scalePoiseDamage,
} from "./damage";

describe("damage", () => {
  it("applies damage-type negation and clamps complete negation", () => {
    expect(applyDamageNegation(80, 0.25)).toBe(60);
    expect(applyDamageNegation(80, 1)).toBe(0);
  });

  it("scales Wither-typed poise buildup by the authored multiplier", () => {
    expect(scalePoiseDamage(10, "wither", 1.4)).toBe(14);
    expect(scalePoiseDamage(10, "slash", 1.4)).toBe(10);
  });

  it("applies authored knockback as displacement, not accumulated velocity", () => {
    expect(
      applyAuthoredDisplacement(
        { x: 2, y: 0, z: 3 },
        0,
        { forward: 1.5, right: -0.25 },
      ),
    ).toEqual({ x: 1.75, y: 0, z: 4.5 });
  });
});
