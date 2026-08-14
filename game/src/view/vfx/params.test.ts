import { describe, expect, it } from "vitest";

import { parseVfxParams, VFX_PARAMS } from "./params";

describe("vfx_params.json", () => {
  it("parses the checked-in data file", () => {
    expect(VFX_PARAMS.schemaVersion).toBe(1);
    expect(VFX_PARAMS.tickHz).toBe(60);
  });

  it("carries the TUNING_V0 hitstop table verbatim", () => {
    const freezes = Object.fromEntries(
      Object.entries(VFX_PARAMS.hitstopClasses).map(([name, entry]) => [name, entry.hitstopTicks]),
    );
    // TUNING_V0 Hitstop row: Light 3t · heavy 6t · charged 8t · blocked 5t ·
    // guard-break 9t · critical/death 12t.
    expect(freezes).toEqual({
      light: 3,
      heavy: 6,
      charged: 8,
      blocked: 5,
      guard_break: 9,
      critical: 12,
      death: 12,
    });
  });

  it("bloom durations pair with the hitstop class and never undershoot the freeze", () => {
    for (const entry of Object.values(VFX_PARAMS.hitstopClasses)) {
      expect(entry.bloomTicks).toBeGreaterThanOrEqual(entry.hitstopTicks);
    }
  });

  it("holds the L8/A3 oxblood budget at 5%", () => {
    expect(VFX_PARAMS.budget.maxOxbloodCoverage).toBe(0.05);
  });

  it("locks the parchment inversion at exactly 1 frame", () => {
    expect(VFX_PARAMS.inversion.frames).toBe(1);
  });

  it("locks the ember sweep at 60t", () => {
    expect(VFX_PARAMS.ember.sweepTicks).toBe(60);
  });

  it("exercises every effect kind in the demo timeline (deliverable 6)", () => {
    const kinds = new Set(VFX_PARAMS.demo.timeline.map((cue) => cue.event.kind));
    for (const kind of [
      "whiff",
      "hit",
      "guard_break",
      "riposte",
      "death",
      "wither",
      "flask",
      "ember",
      "tag_chime",
    ]) {
      expect(kinds.has(kind as never), `timeline missing ${kind}`).toBe(true);
    }
  });

  it("rejects malformed data", () => {
    expect(() => parseVfxParams(null)).toThrow();
    expect(() => parseVfxParams({})).toThrow();
    expect(() =>
      parseVfxParams({
        ...JSON.parse(JSON.stringify(VFX_PARAMS)),
        inversion: { frames: 2 },
      }),
    ).toThrow(/exactly 1/);
  });
});
