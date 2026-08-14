import { describe, expect, it } from "vitest";

import { SeededRng } from "./rng";

describe("SeededRng", () => {
  it("continues the same sequence after a serialization roundtrip", () => {
    const original = new SeededRng(0x1234_5678);

    original.nextUint32();
    original.nextUint32();

    const restored = SeededRng.fromState(original.serialize());

    expect(restored.nextUint32()).toBe(original.nextUint32());
    expect(restored.nextUint32()).toBe(original.nextUint32());
  });
});
