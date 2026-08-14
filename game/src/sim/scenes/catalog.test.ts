import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { parseSceneScripts } from "./schema";
import type { SceneCatalog } from "./types";

const raw = JSON.parse(
  readFileSync(new URL("../../data/scene_scripts.json", import.meta.url), "utf8"),
) as unknown;

export const SCENE_CATALOG: SceneCatalog = parseSceneScripts(raw);

describe("scene catalog fixture", () => {
  it("parses the shipping JSON once for the suite", () => {
    expect(SCENE_CATALOG.scripts.anna_gravity?.registerLocked).toBe(true);
  });
});
