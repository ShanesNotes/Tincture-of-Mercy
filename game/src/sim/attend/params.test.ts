import { describe, expect, it } from "vitest";

import rawAttendParams from "../../data/attend_params.json";
import { parseAttendParams } from "./params";

describe("attend params", () => {
  it("ships the TUNING_V0 Attend row verbatim", () => {
    expect(parseAttendParams(rawAttendParams)).toEqual({
      acquisitionHalfConeDegrees: 34,
      acquisitionRangeMeters: 15,
      retainRangeMeters: 22,
      lineOfSightBreakTicks: 30,
      switchFlickMagnitude: 0.6,
      switchFlickHalfAngleDegrees: 45,
      switchCooldownTicks: 12,
      angleScoreWeight: 0.7,
      distanceScoreWeight: 0.3,
      reacquireRangeMeters: 8,
      reacquireWindowTicks: 20,
    });
  });

  it("cites its source", () => {
    expect(rawAttendParams._source).toMatch(/TUNING_V0/);
  });

  it.each([
    ["missing key", { ...rawAttendParams, retainRangeMeters: undefined }],
    ["negative value", { ...rawAttendParams, acquisitionRangeMeters: -1 }],
    ["fractional tick count", { ...rawAttendParams, switchCooldownTicks: 12.5 }],
    ["retain shorter than acquisition", { ...rawAttendParams, retainRangeMeters: 4 }],
    ["weights that do not sum to one", { ...rawAttendParams, angleScoreWeight: 0.5 }],
    ["absurd half cone", { ...rawAttendParams, acquisitionHalfConeDegrees: 120 }],
  ])("rejects %s", (_label, raw) => {
    expect(() => parseAttendParams(raw)).toThrow();
  });

  it("rejects non-objects", () => {
    expect(() => parseAttendParams(null)).toThrow(/expected an object/);
  });
});
