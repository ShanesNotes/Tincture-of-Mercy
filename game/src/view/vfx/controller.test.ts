import { describe, expect, it } from "vitest";

import {
  advanceVfx,
  applyVfxEvents,
  classifyHitstop,
  createVfxState,
  directionToAnchor,
  emberDesatLevel,
  emblemIntensity,
  envelope01,
  inversionActive,
  witherBandStop,
  witherMoteCount,
} from "./controller";
import { VFX_PARAMS } from "./params";
import type { VfxEvent, VfxState } from "./types";

const params = VFX_PARAMS;

const hitAt = (tick: number, hitstopTicks: number, critical = false): VfxEvent => ({
  kind: "hit",
  tick,
  targetId: "dummy",
  hitstopTicks,
  direction: [1, 0],
  contact: [0.4, 1.2, -4],
  ...(critical ? { critical: true } : {}),
});

describe("directionToAnchor (8-way margin mapping)", () => {
  it("maps cardinal directions", () => {
    expect(directionToAnchor(1, 0)).toBe("e");
    expect(directionToAnchor(0, 1)).toBe("n");
    expect(directionToAnchor(-1, 0)).toBe("w");
    expect(directionToAnchor(0, -1)).toBe("s");
  });

  it("maps diagonals", () => {
    expect(directionToAnchor(1, 1)).toBe("ne");
    expect(directionToAnchor(-1, 1)).toBe("nw");
    expect(directionToAnchor(-1, -1)).toBe("sw");
    expect(directionToAnchor(1, -1)).toBe("se");
  });

  it("rounds near-cardinal directions to the nearest anchor", () => {
    expect(directionToAnchor(1, 0.2)).toBe("e");
    expect(directionToAnchor(0.2, 1)).toBe("n");
    expect(directionToAnchor(-0.7, -0.7)).toBe("sw");
  });

  it("defaults a zero vector to the page head", () => {
    expect(directionToAnchor(0, 0)).toBe("n");
  });
});

describe("classifyHitstop (TUNING_V0 table)", () => {
  it("resolves every table freeze to its class", () => {
    expect(classifyHitstop(3, params)).toBe("light");
    expect(classifyHitstop(5, params)).toBe("blocked");
    expect(classifyHitstop(6, params)).toBe("heavy");
    expect(classifyHitstop(8, params)).toBe("charged");
    expect(classifyHitstop(9, params)).toBe("guard_break");
    expect(classifyHitstop(12, params)).toBe("critical");
  });

  it("disambiguates the shared 12t freeze via prefer", () => {
    expect(classifyHitstop(12, params, "death")).toBe("death");
  });

  it("rejects a freeze outside the table", () => {
    expect(() => classifyHitstop(7, params)).toThrow(/No hitstop class/);
  });
});

describe("envelope01", () => {
  it("decays linearly to zero and stays there", () => {
    expect(envelope01(0, 10)).toBe(1);
    expect(envelope01(5, 10)).toBe(0.5);
    expect(envelope01(9, 10)).toBeCloseTo(0.1);
    expect(envelope01(10, 10)).toBe(0);
    expect(envelope01(50, 10)).toBe(0);
  });
});

describe("applyVfxEvents — blooms (deliverable 1)", () => {
  it("spawns a bloom at the margin nearest the impact direction, paired to the hitstop class", () => {
    const state = applyVfxEvents(createVfxState(), [hitAt(40, 3)], 40, params);
    expect(state.blooms).toHaveLength(1);
    const bloom = state.blooms[0];
    expect(bloom?.anchor).toBe("e");
    expect(bloom?.hitstopClass).toBe("light");
    expect(bloom?.durationTicks).toBe(params.hitstopClasses.light.bloomTicks);
    expect(bloom?.startTick).toBe(40);
  });

  it("F4: the bloom starts within 2 ticks of the sim event", () => {
    // Event occurred at tick 40, applied at tick 41 (one tick of latency).
    const state = applyVfxEvents(createVfxState(), [hitAt(40, 6)], 41, params);
    const bloom = state.blooms[0];
    expect(bloom).toBeDefined();
    expect((bloom?.startTick ?? 0) - (bloom?.eventTick ?? 0)).toBeLessThanOrEqual(2);
  });

  it("rejects events from the future", () => {
    expect(() => applyVfxEvents(createVfxState(), [hitAt(40, 3)], 39, params)).toThrow();
  });

  it("every class always decays fully (property over all classes)", () => {
    const freezes = [3, 5, 6, 8, 9, 12] as const;
    for (const freeze of freezes) {
      let state = applyVfxEvents(createVfxState(), [hitAt(0, freeze, freeze === 12)], 0, params);
      const bloom = state.blooms[0];
      expect(bloom).toBeDefined();
      // One tick before expiry it is still present; at startTick+duration it is gone.
      state = advanceVfx(state, (bloom?.startTick ?? 0) + (bloom?.durationTicks ?? 0) - 1, params);
      expect(state.blooms).toHaveLength(1);
      state = advanceVfx(state, (bloom?.startTick ?? 0) + (bloom?.durationTicks ?? 0), params);
      expect(state.blooms).toHaveLength(0);
    }
  });

  it("F4: a whiff spawns zero blooms and zero strokes — no juice on air", () => {
    const whiff: VfxEvent = { kind: "whiff", tick: 10, actorId: "kalev" };
    const state = applyVfxEvents(createVfxState(), [whiff], 10, params);
    expect(state.blooms).toHaveLength(0);
    expect(state.strokes).toHaveLength(0);
    expect(inversionActive(state)).toBe(false);
  });
});

describe("parchment inversion (canon impact spec)", () => {
  it("fires exactly 1 frame on a critical", () => {
    let state = applyVfxEvents(createVfxState(), [hitAt(0, 12, true)], 0, params);
    expect(inversionActive(state)).toBe(true);
    state = advanceVfx(state, 1, params);
    expect(inversionActive(state)).toBe(false);
  });

  it("does not fire on an ordinary hit", () => {
    const state = applyVfxEvents(createVfxState(), [hitAt(0, 6)], 0, params);
    expect(inversionActive(state)).toBe(false);
  });

  it("fires exactly 1 frame on death, with the page hook", () => {
    const death: VfxEvent = {
      kind: "death",
      tick: 0,
      targetId: "dummy",
      hitstopTicks: 12,
      direction: [0, -1],
      contact: [0, 1, -4],
    };
    let state = applyVfxEvents(createVfxState(), [death], 0, params);
    expect(inversionActive(state)).toBe(true);
    expect(state.deathPage).not.toBeNull();
    state = advanceVfx(state, 1, params);
    expect(inversionActive(state)).toBe(false);
    // The page hook outlives the inversion but still expires.
    state = advanceVfx(state, params.deathPage.ticks, params);
    expect(state.deathPage).toBeNull();
  });
});

describe("impact strokes (deliverable 2)", () => {
  it("plain hits flash ink strokes, never gold (AD6/L9)", () => {
    const freezes = [3, 5, 6, 8, 12] as const;
    for (const freeze of freezes) {
      const state = applyVfxEvents(createVfxState(), [hitAt(0, freeze)], 0, params);
      expect(state.strokes).toHaveLength(1);
      expect(state.strokes[0]?.gold).toBe(false);
    }
  });

  it("gold is licensed ONLY for riposte and guard-break", () => {
    const riposte: VfxEvent = {
      kind: "riposte",
      tick: 0,
      targetId: "dummy",
      contact: [0, 1.2, -4],
    };
    const guardBreak: VfxEvent = {
      kind: "guard_break",
      tick: 0,
      targetId: "dummy",
      hitstopTicks: 9,
      direction: [0, -1],
      contact: [0, 1.2, -4],
    };
    const riposteState = applyVfxEvents(createVfxState(), [riposte], 0, params);
    expect(riposteState.strokes).toHaveLength(1);
    expect(riposteState.strokes[0]?.gold).toBe(true);
    const breakState = applyVfxEvents(createVfxState(), [guardBreak], 0, params);
    expect(breakState.strokes.some((s) => s.gold)).toBe(true);
  });

  it("stroke variants stay inside the authored 2–3 family", () => {
    for (let tick = 0; tick < 40; tick += 1) {
      const state = applyVfxEvents(createVfxState(), [hitAt(tick, 3)], tick, params);
      const variant = state.strokes[0]?.variant ?? -1;
      expect(variant).toBeGreaterThanOrEqual(0);
      expect(variant).toBeLessThan(params.impactStrokes.variants);
    }
  });
});

describe("wither motes (deliverable 3, EN14)", () => {
  const wither = (density: number, durationTicks = 120): VfxEvent => ({
    kind: "wither",
    tick: 0,
    density,
    durationTicks,
  });

  it("density is data-driven and hard-capped", () => {
    expect(witherMoteCount(applyVfxEvents(createVfxState(), [wither(1)], 0, params), params)).toBe(
      params.wither.maxMotes,
    );
    expect(
      witherMoteCount(applyVfxEvents(createVfxState(), [wither(0.5)], 0, params), params),
    ).toBe(Math.round(0.5 * params.wither.maxMotes));
    // Over-unity density clamps to the cap, never above it.
    expect(witherMoteCount(applyVfxEvents(createVfxState(), [wither(4)], 0, params), params)).toBe(
      params.wither.maxMotes,
    );
  });

  it("the margin desaturation band is stepped, never continuous (L3)", () => {
    const low = applyVfxEvents(createVfxState(), [wither(0.3)], 0, params);
    const high = applyVfxEvents(createVfxState(), [wither(0.9)], 0, params);
    expect(witherBandStop(low, params)).toBe(0.25);
    expect(witherBandStop(high, params)).toBe(0.5);
  });

  it("the field expires", () => {
    let state = applyVfxEvents(createVfxState(), [wither(0.7, 30)], 0, params);
    state = advanceVfx(state, 30, params);
    expect(state.wither).toBeNull();
    expect(witherMoteCount(state, params)).toBe(0);
  });
});

describe("flask and ember (deliverable 4)", () => {
  it("the flask drink pulses the vial emblem light for the data-driven duration", () => {
    const flask: VfxEvent = { kind: "flask", tick: 0, actorId: "kalev" };
    let state = applyVfxEvents(createVfxState(), [flask], 0, params);
    expect(emblemIntensity(state, "vial")).toBeCloseTo(params.flask.peakIntensity);
    state = advanceVfx(state, params.flask.pulseTicks, params);
    expect(emblemIntensity(state, "vial")).toBe(0);
  });

  it("ember runs the gold-to-grey sweep for exactly 60t, then is gone", () => {
    const ember: VfxEvent = { kind: "ember", tick: 0, actorId: "kalev" };
    let state = applyVfxEvents(createVfxState(), [ember], 0, params);
    expect(state.emberSweep).not.toBeNull();
    // The sweep starts clear, peaks mid-sweep, and steps — never continuous.
    expect(emberDesatLevel(state, params)).toBe(params.ember.desatStops[0]);
    state = advanceVfx(state, 30, params);
    expect(emberDesatLevel(state, params)).toBe(1);
    state = advanceVfx(state, 60, params);
    expect(state.emberSweep).toBeNull();
    expect(emberDesatLevel(state, params)).toBe(0);
  });

  it("ember opens with the licensed gold glint", () => {
    const ember: VfxEvent = { kind: "ember", tick: 0, actorId: "kalev" };
    let state = applyVfxEvents(createVfxState(), [ember], 0, params);
    expect(emblemIntensity(state, "ember")).toBeGreaterThan(0);
    state = advanceVfx(state, params.ember.goldGlintTicks, params);
    expect(emblemIntensity(state, "ember")).toBe(0);
  });
});

describe("tag chime (deliverable 5)", () => {
  it("spawns a brief glint at the contact point, then expires", () => {
    const chime: VfxEvent = { kind: "tag_chime", tick: 0, contact: [3.6, 1, -4] };
    let state = applyVfxEvents(createVfxState(), [chime], 0, params);
    expect(state.tagGlints).toHaveLength(1);
    state = advanceVfx(state, params.tagChime.glintTicks, params);
    expect(state.tagGlints).toHaveLength(0);
  });
});

describe("advanceVfx", () => {
  it("is monotonic", () => {
    const state: VfxState = createVfxState();
    expect(() => advanceVfx(state, -1, params)).toThrow(/monotonically/);
  });
});
