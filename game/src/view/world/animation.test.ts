import { AnimationClip, Group, NumberKeyframeTrack } from "three";
import { describe, expect, it } from "vitest";

import { SimClipPlayer } from "./animation";
import type { CharacterAssets } from "./types";

const assets = (root: Group): CharacterAssets => ({
  character: "kalev",
  template: root,
  animations: [
    new AnimationClip("guard", 2, [
      new NumberKeyframeTrack(".position[x]", [0, 1], [0, 60]),
    ]),
  ],
  sidecars: new Map([
    [
      "guard",
      {
        schema: "tincture.sidecar.v0",
        character: "kalev_blocking",
        clip: "guard",
        glb: "kalev.glb",
        glbHash: "hash",
        tickHz: 60,
        ticks: 120,
        hurtboxes: [],
        rootXZ: [],
        events: [],
        footContacts: [],
      },
    ],
  ]),
  sidecarsByFile: new Map(),
  visualClips: { idle: "guard", flask_drink: "guard" },
  fallbacks: { flask_drink: "authored clip absent" },
});

describe("simulation-clock clip player", () => {
  it("seeks (actionTick + alpha) / 60 and reports configured fallbacks", () => {
    const root = new Group();
    const fallback = new Set<string>();
    const player = new SimClipPlayer(root, assets(root), fallback);

    player.seek({ move: "idle", actionTick: 30, alpha: 0.5 });
    expect(root.position.x).toBeCloseTo(30.5, 6);

    player.seek({ move: "flask_drink", actionTick: 24, alpha: 0 });
    expect(fallback).toContain("kalev.flask_drink: authored clip absent");
    player.dispose();
  });
});
