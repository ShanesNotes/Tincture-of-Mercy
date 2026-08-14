import { describe, expect, it } from "vitest";

import { collectAtomicStage } from "./staging";

describe("atomic staged loading", () => {
  it("disposes every fulfilled sibling before preserving a stage failure", () => {
    const disposed: string[] = [];
    const failure = new Error("sidecar rejected");
    expect(() =>
      collectAtomicStage(
        [
          { status: "fulfilled", value: "level" },
          { status: "rejected", reason: failure },
          { status: "fulfilled", value: "wolf" },
        ],
        (value) => disposed.push(value),
      ),
    ).toThrow(failure);
    expect(disposed).toEqual(["level", "wolf"]);
  });

  it("returns a complete successful stage without disposing it", () => {
    const disposed: string[] = [];
    expect(
      collectAtomicStage(
        [
          { status: "fulfilled", value: "kalev" },
          { status: "fulfilled", value: "wolf" },
        ],
        (value) => disposed.push(value),
      ),
    ).toEqual(["kalev", "wolf"]);
    expect(disposed).toEqual([]);
  });
});
