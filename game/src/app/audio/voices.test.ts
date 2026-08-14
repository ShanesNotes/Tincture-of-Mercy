import { describe, expect, it } from "vitest";

import { loadCommittedAudioParams } from "./load_params";
import type { VoiceSlot } from "./types";
import { admitVoice, releaseVoice } from "./voices";

const params = loadCommittedAudioParams();

const slot = (id: string, priority: number, startedTick: number, voiceClass: VoiceSlot["voiceClass"] = "impact"): VoiceSlot => ({
  id,
  cueId: id,
  voiceClass,
  priority,
  startedTick,
});

describe("voice pool", () => {
  it("admits until the class cap then evicts the lowest priority", () => {
    let active: readonly VoiceSlot[] = [];
    const admitted: string[] = [];
    for (let index = 0; index < params.voiceCaps.impact; index += 1) {
      const result = admitVoice(active, slot(`a${String(index)}`, 50 + index, index), params.voiceCaps);
      expect(result.admitted).toBe(true);
      expect(result.evicted).toBeNull();
      active = result.active;
      admitted.push(`a${String(index)}`);
    }

    const overflow = admitVoice(active, slot("boss", 90, 99), params.voiceCaps);
    expect(overflow.admitted).toBe(true);
    expect(overflow.evicted?.id).toBe("a0");
    expect(overflow.active.map((entry) => entry.id)).not.toContain("a0");
    expect(overflow.active.map((entry) => entry.id)).toContain("boss");
  });

  it("drops the incoming cue when every occupant has higher priority", () => {
    const full = Array.from({ length: params.voiceCaps.sting }, (_, index) =>
      slot(`sting${String(index)}`, 100, index, "sting"),
    );
    const denied = admitVoice(full, slot("quiet", 10, 8, "sting"), params.voiceCaps);
    expect(denied.admitted).toBe(false);
    expect(denied.evicted).toBeNull();
    expect(denied.active).toEqual(full);
  });

  it("evicts the oldest occupant on a priority tie", () => {
    const full = [
      slot("old", 70, 1),
      slot("mid", 70, 4),
      slot("new", 80, 6),
    ];
    const result = admitVoice(full, slot("challenger", 70, 10), {
      ...params.voiceCaps,
      impact: 3,
    });
    expect(result.admitted).toBe(true);
    expect(result.evicted?.id).toBe("old");
  });

  it("releases a finished voice without touching the rest", () => {
    const active = [slot("keep", 40, 1, "foley"), slot("drop", 40, 2, "foley")];
    expect(releaseVoice(active, "drop").map((entry) => entry.id)).toEqual(["keep"]);
  });
});
