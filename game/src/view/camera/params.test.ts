import { describe, expect, it } from "vitest";

import rawCameraParams from "../../data/camera_params.json";
import { CAMERA_PARAMS, parseCameraParams } from "./params";

const groups = rawCameraParams as unknown as Record<string, Record<string, unknown>>;

const withGroup = (group: string, patch: Record<string, unknown>): unknown => ({
  ...rawCameraParams,
  [group]: { ...groups[group], ...patch },
});

describe("camera params", () => {
  it("ships the law-bound values the design packet fixes", () => {
    expect(CAMERA_PARAMS.fov.minDegrees).toBe(38);
    expect(CAMERA_PARAMS.fov.maxDegrees).toBe(48);
    expect(CAMERA_PARAMS.depth.reverseZ).toBe(true);
    expect(CAMERA_PARAMS.attend.framingMarginFraction).toBe(0.12);
    expect(CAMERA_PARAMS.attend.occlusionSnapTicks).toBe(8);
  });

  it("cites provenance for every tuning group", () => {
    const source = rawCameraParams._source;
    expect(source.fov).toMatch(/D2/);
    expect(source.depth).toMatch(/D2/);
    expect(source["attend.framingMarginFraction"]).toMatch(/F9/);
    expect(source["attend.occlusionSnapTicks"]).toMatch(/F9/);
    expect(source.follow).toMatch(/TUNING_V0/);
    expect(source.orbit).toMatch(/TUNING_V0/);
    expect(source.collision).toMatch(/TUNING_V0/);
  });

  it.each([
    ["a FOV under the D2 band", "fov", { minDegrees: 30 }],
    ["a FOV over the D2 band", "fov", { maxDegrees: 60 }],
    ["a default outside the band", "fov", { defaultDegrees: 60 }],
    ["a forward-Z near plane", "depth", { nearMeters: 0 }],
    ["unordered follow distances", "follow", { maxDistanceMeters: 1 }],
    ["unordered pitch limits", "orbit", { pitchMinDegrees: 60 }],
    ["a rest pitch outside the orbit limits", "follow", { restPitchDegrees: -80 }],
    ["a zero collision probe", "collision", { probeRadiusMeters: 0 }],
    ["a framing margin under F9", "attend", { framingMarginFraction: 0.1 }],
    ["an occlusion budget over F9", "attend", { occlusionSnapTicks: 12 }],
    ["unordered attend distances", "attend", { minDistanceMeters: 20 }],
    ["a fractional solve iteration count", "attend", { distanceSolveIterations: 2.5 }],
  ])("rejects %s", (_label, group, patch) => {
    expect(() => parseCameraParams(withGroup(group, patch))).toThrow();
  });

  it("rejects malformed input outright", () => {
    expect(() => parseCameraParams(null)).toThrow(/must be an object/);
    expect(() => parseCameraParams({ ...rawCameraParams, fov: 44 })).toThrow(/fov/);
    expect(() => parseCameraParams(withGroup("depth", { reverseZ: "yes" }))).toThrow(/boolean/);
  });
});
