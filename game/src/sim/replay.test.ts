import { describe, expect, it } from "vitest";

import {
  REPLAY_FORMAT_VERSION,
  compareGoldenReplay,
  playReplay,
  recordReplay,
  type ReplayScript,
} from "./replay";

const script: ReplayScript = {
  durationTicks: 120,
  formatVersion: REPLAY_FORMAT_VERSION,
  inputs: [
    { action: "attack", pressed: true, sequence: 0, tick: 3 },
    { action: "attack", pressed: false, sequence: 1, tick: 4 },
    { action: "roll", pressed: true, sequence: 2, tick: 47 },
  ],
  seed: 0x1a2b_3c4d,
};

describe("replay", () => {
  it("produces an identical state hash for the same seed and input script", () => {
    const first = playReplay(script);
    const second = playReplay(script);

    expect(second.state).toEqual(first.state);
    expect(second.stateHash).toBe(first.stateHash);
    expect(compareGoldenReplay(script, first)).toEqual({ matches: true });
  });

  it("matches the committed golden state hash", () => {
    expect(playReplay(script).stateHash).toBe("26ecf74c");
  });

  it("reports a golden replay mismatch", () => {
    expect(
      compareGoldenReplay(script, { state: playReplay(script).state, stateHash: "00000000" }),
    ).toMatchObject({ matches: false });
  });

  it("records a replay script without retaining mutable input objects", () => {
    const input = { action: "flask", pressed: true, sequence: 0, tick: 2 } as const;
    const recorded = recordReplay(7, 5, [input]);

    expect(recorded).toEqual({
      durationTicks: 5,
      formatVersion: REPLAY_FORMAT_VERSION,
      inputs: [input],
      seed: 7,
    });
    expect(recorded.inputs[0]).not.toBe(input);
  });
});
