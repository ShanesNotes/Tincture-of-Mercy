import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import manifest from "../../../assets/build/levels/manifest.json";
import { canonicalCollisionJson, collisionSemanticSha256 } from "./verification";

interface CollisionPayload {
  readonly triangles: readonly (readonly number[])[];
  readonly vertices: readonly (readonly number[])[];
}

describe("world asset verification", () => {
  it("reproduces the Python canonical collision hash", async () => {
    const raw = await readFile(
      new URL("../../../assets/build/levels/yard.collision.json", import.meta.url),
      "utf8",
    );
    const collision: CollisionPayload = JSON.parse(raw) as CollisionPayload;

    expect(canonicalCollisionJson({ triangles: [[0, 1, 2]], vertices: [[0, -0, 1.25]] })).toBe(
      '{"triangles":[[0,1,2]],"vertices":[[0.0,-0.0,1.25]]}',
    );
    expect(await collisionSemanticSha256(collision)).toBe(manifest.zones.YARD.sha256);
  });
});
