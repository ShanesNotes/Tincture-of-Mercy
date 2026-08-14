import { describe, expect, it } from "vitest";

import { assertRendererLaws, type RendererLawConfig } from "./renderer";

describe("renderer law L1", () => {
  it.each<keyof RendererLawConfig>([
    "depthOfField",
    "fog",
    "fovPunch",
    "lensFlare",
    "motionBlur",
    "shake",
  ])("rejects enabled %s before renderer construction", (flag) => {
    const config: RendererLawConfig = {
      depthOfField: false,
      fog: false,
      fovPunch: false,
      lensFlare: false,
      motionBlur: false,
      shake: false,
      [flag]: true,
    };

    expect(() => assertRendererLaws(config)).toThrow(/L1/);
  });
});
