import { describe, expect, it } from "vitest";

import { fromAiEvent, fromMetaEvent } from "./events";
import { hashTickSeed, pitchRateFromSeed } from "./jitter";
import { loadCommittedAudioParams } from "./load_params";
import { resolveEventCues } from "./resolve";
import type { AudioSourceEvent } from "./types";

const params = loadCommittedAudioParams();

describe("event → cue resolution", () => {
  it("maps a light hit to the body layer plus the 3t hitstop transient", () => {
    const cues = resolveEventCues({ type: "combat.hit", tick: 24, weight: "light" }, params, false);
    expect(cues.map((entry) => entry.cueId)).toEqual(["hit.light", "impact.light"]);
    expect(cues[1]?.cue.hitstopTicks).toBe(params.hitstopTicks.light);
    expect(cues[1]?.scheduleTick).toBe(24);
  });

  it("schedules hearth-iron whiffs at active-minus-2", () => {
    const [whiff] = resolveEventCues(
      { type: "combat.attack_whiff", tick: 11, weaponClass: "hearth_iron", weight: "light" },
      params,
      false,
    );
    expect(whiff?.cueId).toBe("whiff.hearth_iron.light");
    expect(whiff?.cue.offsetTicks).toBe(-params.onsetLeadTicks);
    expect(whiff?.scheduleTick).toBe(9);
  });

  it("drops the impact layer under reduced-feedback and keeps the quieter body", () => {
    const cues = resolveEventCues({ type: "combat.hit", tick: 8, weight: "charged" }, params, true);
    expect(cues.map((entry) => entry.cueId)).toEqual(["hit.charged"]);
    expect(cues[0]?.cue.layer).toBe("body");
  });

  it("resolves every required event class to at least one cue", () => {
    const events: AudioSourceEvent[] = [
      { type: "combat.attack_whiff", tick: 1, weaponClass: "hearth_iron", weight: "heavy" },
      { type: "combat.attack_whiff", tick: 1, weaponClass: "wolf" },
      { type: "combat.attack_whiff", tick: 1, weaponClass: "warden_axe" },
      { type: "combat.hit", tick: 1, weight: "light" },
      { type: "combat.hit", tick: 1, weight: "heavy" },
      { type: "combat.hit", tick: 1, weight: "charged" },
      { type: "combat.blocked", tick: 1 },
      { type: "combat.guard_break", tick: 1 },
      { type: "combat.critical", tick: 1 },
      { type: "foley.footstep", tick: 1, surface: "needle" },
      { type: "foley.footstep", tick: 1, surface: "wood" },
      { type: "foley.footstep", tick: 1, surface: "damp_snow" },
      { type: "foley.footstep", tick: 1, surface: "stone" },
      { type: "foley.roll", tick: 1 },
      { type: "meta.flask", tick: 1, phase: "startup" },
      { type: "meta.flask", tick: 1, phase: "drink" },
      { type: "meta.flask", tick: 1, phase: "recovery" },
      { type: "ai.wolf_vocal", tick: 1, vocal: "stalk_growl" },
      { type: "ai.wolf_vocal", tick: 1, vocal: "lunge_snarl" },
      { type: "ai.wolf_vocal", tick: 1, vocal: "flinch" },
      { type: "ai.wolf_vocal", tick: 1, vocal: "death" },
      { type: "ai.howl", tick: 1 },
      { type: "world.tag_chime", tick: 1 },
      { type: "ambience.hearth", tick: 1, on: true },
      { type: "ambience.forest", tick: 1, on: true },
      { type: "ambience.wither", tick: 1, on: true },
      { type: "meta.death", tick: 1 },
      { type: "meta.page", tick: 1, phase: "drop" },
      { type: "meta.page", tick: 1, phase: "recover" },
      { type: "meta.names_bank", tick: 1 },
    ];
    for (const event of events) {
      expect(resolveEventCues(event, params, false).length, event.type).toBeGreaterThan(0);
    }
  });

  it("adapts s14 howl / lunge events and s15 death / page / names / flask events", () => {
    expect(fromAiEvent({ kind: "howl", tick: 40, detail: "tier:1" })).toEqual([
      { type: "ai.howl", tick: 40 },
    ]);
    expect(fromAiEvent({ kind: "role_action", tick: 12, detail: "lunge" })).toEqual([
      { type: "ai.wolf_vocal", tick: 12, vocal: "lunge_snarl" },
    ]);
    expect(fromMetaEvent({ type: "death", tick: 90 })).toEqual([{ type: "meta.death", tick: 90 }]);
    expect(fromMetaEvent({ type: "page-dropped", tick: 90 })).toEqual([
      { type: "meta.page", tick: 90, phase: "drop" },
    ]);
    expect(fromMetaEvent({ type: "names-changed", tick: 4 })).toEqual([
      { type: "meta.names_bank", tick: 4 },
    ]);
    expect(fromMetaEvent({ type: "dose-used", tick: 7 })).toEqual([
      { type: "meta.flask", tick: 7, phase: "drink" },
    ]);
  });

  it("seeds pitch jitter from the sim tick, never from Math.random", () => {
    const first = hashTickSeed(18, "hit.light");
    const second = hashTickSeed(18, "hit.light");
    const other = hashTickSeed(19, "hit.light");
    expect(first).toBe(second);
    expect(first).not.toBe(other);
    expect(pitchRateFromSeed(first, 0)).toBe(1);
    const rate = pitchRateFromSeed(first, 12);
    expect(rate).toBeGreaterThan(0.98);
    expect(rate).toBeLessThan(1.02);
  });
});
