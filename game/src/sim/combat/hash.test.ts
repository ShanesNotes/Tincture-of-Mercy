import { describe, expect, it } from "vitest";

import { canonicalJson, hashCanonical } from "./hash";

describe("combat state hashing", () => {
  it("sorts object keys without changing array order", () => {
    expect(canonicalJson({ z: 2, a: [{ y: 1, x: 0 }, 3] })).toBe(
      '{"a":[{"x":0,"y":1},3],"z":2}',
    );
  });

  it("rejects values that cannot participate in a deterministic replay", () => {
    expect(() => canonicalJson({ value: Number.NaN })).toThrow(/finite/i);
    expect(() => canonicalJson({ value: undefined })).toThrow(/JSON-safe/i);
  });

  it("returns the same hash for insertion-order variants", () => {
    expect(hashCanonical({ b: 2, a: 1 })).toBe(hashCanonical({ a: 1, b: 2 }));
  });
});
