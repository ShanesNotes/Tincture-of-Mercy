import { describe, expect, it } from "vitest";

import { presentSim } from "./presenter";
import { createSimState } from "./state";
import { stepTick } from "./tick";

describe("presentSim", () => {
  it("hands view a plain interpolated frame instead of the sim DTO", () => {
    const previous = createSimState(7);
    const current = stepTick(previous, []);

    expect(presentSim(previous, current, 0.25)).toEqual({
      committedTick: 1,
      interpolationAlpha: 0.25,
      presentationTick: 0.25,
    });
  });
});
