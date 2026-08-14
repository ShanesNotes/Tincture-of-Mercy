import { describe, expect, it } from "vitest";

import rawAttendParams from "../../data/attend_params.json";
import { parseAttendParams } from "./params";
import {
  collectCandidates,
  hasLineOfSight,
  readFlickSide,
  scoreCandidate,
  selectAcquisition,
  selectReacquireTarget,
  selectSwitchTarget,
} from "./select";
import type { FlickSide } from "./select";
import type {
  AttendActor,
  AttendCollisionQueries,
  AttendStickSample,
  AttendViewer,
} from "./types";

const params = parseAttendParams(rawAttendParams);

/** Viewer at the origin looking down -Z with +X to screen right. */
const viewer: AttendViewer = {
  position: { x: 0, y: 0, z: 0 },
  forward: { x: 0, y: 0, z: -1 },
  right: { x: 1, y: 0, z: 0 },
};

const clearWorld: AttendCollisionQueries = { raycast: () => null };
const blockedWorld: AttendCollisionQueries = { raycast: () => ({ distance: 1 }) };

const radians = (degrees: number): number => (degrees * Math.PI) / 180;

/** Actor at `degrees` off the viewer forward on the horizontal plane. */
const actorAt = (id: string, degrees: number, distance: number, alive = true): AttendActor => ({
  id,
  alive,
  position: {
    x: Math.sin(radians(degrees)) * distance,
    y: 0,
    z: -Math.cos(radians(degrees)) * distance,
  },
});

const ids = (actors: readonly AttendActor[]): readonly string[] =>
  collectCandidates(viewer, actors, params, clearWorld).map((candidate) => candidate.id);

describe("scoreCandidate", () => {
  it("scores a touching, dead-centre target at 1", () => {
    expect(scoreCandidate(0, 0, params)).toBe(1);
  });

  it("scores the cone edge at maximum range at 0", () => {
    expect(scoreCandidate(radians(34), 15, params)).toBeCloseTo(0, 12);
  });

  it("weights angle 0.7 against distance 0.3", () => {
    expect(scoreCandidate(radians(17), 7.5, params)).toBeCloseTo(0.5, 12);
    expect(scoreCandidate(0, 15, params)).toBeCloseTo(0.7, 12);
    expect(scoreCandidate(radians(34), 0, params)).toBeCloseTo(0.3, 12);
  });

  it("clamps beyond the cone and beyond range instead of going negative", () => {
    expect(scoreCandidate(radians(80), 40, params)).toBe(0);
  });
});

describe("collectCandidates", () => {
  it("includes the exact 34 degree cone edge and excludes just past it", () => {
    expect(ids([actorAt("edge", 34, 10)])).toEqual(["edge"]);
    expect(ids([actorAt("outside", 34.01, 10)])).toEqual([]);
  });

  it("includes the exact 15m range edge and excludes just past it", () => {
    expect(ids([actorAt("edge", 0, 15)])).toEqual(["edge"]);
    expect(ids([actorAt("outside", 0, 15.01)])).toEqual([]);
  });

  it("drops dead actors and actors behind cover", () => {
    expect(ids([actorAt("corpse", 0, 5, false)])).toEqual([]);
    expect(collectCandidates(viewer, [actorAt("hidden", 0, 5)], params, blockedWorld)).toEqual([]);
  });

  it("orders by score, then distance, then id for total determinism", () => {
    const left = actorAt("wolf-b", -20, 8);
    const right = actorAt("wolf-a", 20, 8);
    expect(ids([left, right])).toEqual(["wolf-a", "wolf-b"]);
    expect(ids([right, left])).toEqual(["wolf-a", "wolf-b"]);
  });

  it("prefers a distant centred target over a close peripheral one (0.7 angle weight)", () => {
    expect(ids([actorAt("peripheral", 30, 3), actorAt("centred", 0, 14)])).toEqual([
      "centred",
      "peripheral",
    ]);
  });
});

describe("hasLineOfSight", () => {
  it("is clear when nothing is hit before the target", () => {
    expect(hasLineOfSight(clearWorld, viewer.position, { x: 0, y: 0, z: -5 })).toBe(true);
  });

  it("is blocked when geometry sits between viewer and target", () => {
    expect(hasLineOfSight(blockedWorld, viewer.position, { x: 0, y: 0, z: -5 })).toBe(false);
  });

  it("never queries beyond the target surface", () => {
    const queries: AttendCollisionQueries = {
      raycast: (query) => (query.maxDistance < 5 ? null : { distance: 4.999 }),
    };
    expect(hasLineOfSight(queries, viewer.position, { x: 0, y: 0, z: -5 })).toBe(true);
  });
});

describe("selectAcquisition", () => {
  it("returns the best-scoring visible candidate", () => {
    const acquired = selectAcquisition(
      viewer,
      [actorAt("far", 5, 14), actorAt("near", 5, 4)],
      params,
      clearWorld,
    );
    expect(acquired?.id).toBe("near");
  });

  it("returns null with nothing in the cone", () => {
    expect(selectAcquisition(viewer, [actorAt("behind", 170, 4)], params, clearWorld)).toBeNull();
  });
});

describe("readFlickSide", () => {
  it.each<[string, AttendStickSample, FlickSide]>([
    ["exactly at the 0.6 threshold", { x: 0.6, y: 0 }, null],
    ["past the threshold to the right", { x: 0.61, y: 0 }, "right"],
    ["past the threshold to the left", { x: -0.9, y: 0.1 }, "left"],
    ["at the +/-45 degree edge", { x: Math.SQRT1_2, y: Math.SQRT1_2 }, "right"],
    ["steeper than 45 degrees", { x: 0.4, y: 0.9 }, null],
    ["a pure vertical flick", { x: 0, y: 1 }, null],
  ])("reads %s", (_label, stick, expected) => {
    expect(readFlickSide(stick, params)).toBe(expected);
  });
});

describe("selectSwitchTarget", () => {
  const spread = [
    actorAt("left-far", -20, 8),
    actorAt("current", 0, 8),
    actorAt("right-near", 10, 8),
    actorAt("right-far", 25, 8),
  ];

  it("picks the nearest candidate on the flicked side", () => {
    expect(selectSwitchTarget(viewer, "current", spread, "right", params, clearWorld)?.id).toBe(
      "right-near",
    );
    expect(selectSwitchTarget(viewer, "current", spread, "left", params, clearWorld)?.id).toBe(
      "left-far",
    );
  });

  it("walks outward on repeated switches", () => {
    expect(selectSwitchTarget(viewer, "right-near", spread, "right", params, clearWorld)?.id).toBe(
      "right-far",
    );
  });

  it("returns null when the flicked side is empty", () => {
    expect(selectSwitchTarget(viewer, "right-far", spread, "right", params, clearWorld)).toBeNull();
  });

  it("ignores candidates behind cover", () => {
    expect(selectSwitchTarget(viewer, "current", spread, "right", params, blockedWorld)).toBeNull();
  });
});

describe("selectReacquireTarget", () => {
  const anchor = { x: 0, y: 0, z: -10 };

  it("takes the nearest living actor inside the 8m re-acquire radius", () => {
    const recovered = selectReacquireTarget(
      anchor,
      [
        { id: "far", alive: true, position: { x: 0, y: 0, z: -17 } },
        { id: "near", alive: true, position: { x: 3, y: 0, z: -10 } },
      ],
      params,
    );
    expect(recovered).toBe("near");
  });

  it("includes the exact 8m edge and excludes beyond it", () => {
    expect(
      selectReacquireTarget(anchor, [{ id: "edge", alive: true, position: { x: 8, y: 0, z: -10 } }], params),
    ).toBe("edge");
    expect(
      selectReacquireTarget(anchor, [{ id: "past", alive: true, position: { x: 8.01, y: 0, z: -10 } }], params),
    ).toBeNull();
  });

  it("breaks distance ties by id and skips the dead", () => {
    const actors: readonly AttendActor[] = [
      { id: "wolf-b", alive: true, position: { x: 2, y: 0, z: -10 } },
      { id: "wolf-a", alive: true, position: { x: -2, y: 0, z: -10 } },
      { id: "wolf-0", alive: false, position: { x: 0, y: 0, z: -10 } },
    ];
    expect(selectReacquireTarget(anchor, actors, params)).toBe("wolf-a");
    expect(selectReacquireTarget(anchor, [...actors].reverse(), params)).toBe("wolf-a");
  });
});
