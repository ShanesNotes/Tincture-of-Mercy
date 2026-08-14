import { describe, expect, it } from "vitest";

import { busGain, identityDuckGains, resolveDuckGains } from "./ducking";
import { loadCommittedAudioParams } from "./load_params";

const params = loadCommittedAudioParams();

describe("ducking graph", () => {
  it("leaves every group at unity when nothing is playing", () => {
    expect(resolveDuckGains([], params)).toEqual(identityDuckGains());
  });

  it("lets combat duck ambience and nothing else", () => {
    const gains = resolveDuckGains(["combat"], params);
    expect(gains.ambience).toBe(0.32);
    expect(gains.combat).toBe(1);
    expect(gains.ui).toBe(1);
    expect(gains.sting).toBe(1);
  });

  it("lets the death sting duck combat, ambience, and ui", () => {
    const gains = resolveDuckGains(["sting"], params);
    expect(gains.combat).toBe(0.08);
    expect(gains.ambience).toBe(0.05);
    expect(gains.ui).toBe(0.1);
    expect(gains.sting).toBe(1);
  });

  it("takes the strongest (minimum) duck when combat and sting overlap", () => {
    const gains = resolveDuckGains(["combat", "sting"], params);
    expect(gains.ambience).toBe(0.05);
    expect(gains.combat).toBe(0.08);
  });

  it("multiplies master, bus, duck, cue, and reduced-feedback scales", () => {
    const full = busGain(params, "sfx", 1, 0.4, false, true);
    const quiet = busGain(params, "sfx", 1, 0.4, true, true);
    expect(full).toBeCloseTo(params.buses.master * params.buses.sfx * 0.4, 10);
    expect(quiet).toBeCloseTo(full * params.reducedFeedback.bodyGainScale, 10);
    expect(busGain(params, "sfx", 1, 0.4, true, false)).toBeCloseTo(full, 10);
  });
});
