import { describe, expect, it } from "vitest";

import { rotateTowardTarget } from "./tracking";

describe("rotateTowardTarget", () => {
  it("clamps tracking rotation to the authored per-tick turn cap", () => {
    expect(
      rotateTowardTarget(
        0,
        { x: 0, z: 0 },
        { x: 10, z: 0 },
        Math.PI / 12,
      ),
    ).toBeCloseTo(Math.PI / 12);
  });

  it("takes the shortest turn across the -pi/pi seam", () => {
    const facing = Math.PI - 0.05;
    const result = rotateTowardTarget(
      facing,
      { x: 0, z: 0 },
      { x: -0.1, z: -1 },
      0.2,
    );

    expect(result).toBeLessThan(-3);
    expect(Math.abs(result)).toBeLessThanOrEqual(Math.PI);
  });

  it("does not rotate when the target shares the attacker position", () => {
    expect(
      rotateTowardTarget(0.75, { x: 2, z: 3 }, { x: 2, z: 3 }, 0.2),
    ).toBe(0.75);
  });
});
