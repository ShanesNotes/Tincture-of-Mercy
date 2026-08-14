/**
 * Attend tuning parameters.
 *
 * Values live in `src/data/attend_params.json` (TUNING_V0.md verbatim). The sim
 * runtime is dependency-zero and may not import the data file, so params are
 * parsed at the composition boundary and injected into every call.
 */

export interface AttendParams {
  readonly acquisitionHalfConeDegrees: number;
  readonly acquisitionRangeMeters: number;
  readonly retainRangeMeters: number;
  readonly lineOfSightBreakTicks: number;
  readonly switchFlickMagnitude: number;
  readonly switchFlickHalfAngleDegrees: number;
  readonly switchCooldownTicks: number;
  readonly angleScoreWeight: number;
  readonly distanceScoreWeight: number;
  readonly reacquireRangeMeters: number;
  readonly reacquireWindowTicks: number;
}

const NUMERIC_KEYS = [
  "acquisitionHalfConeDegrees",
  "acquisitionRangeMeters",
  "retainRangeMeters",
  "lineOfSightBreakTicks",
  "switchFlickMagnitude",
  "switchFlickHalfAngleDegrees",
  "switchCooldownTicks",
  "angleScoreWeight",
  "distanceScoreWeight",
  "reacquireRangeMeters",
  "reacquireWindowTicks",
] as const satisfies readonly (keyof AttendParams)[];

const TICK_KEYS = [
  "lineOfSightBreakTicks",
  "switchCooldownTicks",
  "reacquireWindowTicks",
] as const satisfies readonly (keyof AttendParams)[];

const readNumber = (source: Record<string, unknown>, key: string): number => {
  const value = source[key];
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new RangeError(`attend params: ${key} must be a finite non-negative number`);
  }
  return value;
};

/** Validates raw JSON into `AttendParams`; throws on any missing or absurd value. */
export const parseAttendParams = (raw: unknown): AttendParams => {
  if (typeof raw !== "object" || raw === null) {
    throw new TypeError("attend params: expected an object");
  }
  const source = raw as Record<string, unknown>;
  const parsed = Object.fromEntries(
    NUMERIC_KEYS.map((key) => [key, readNumber(source, key)]),
  ) as unknown as AttendParams;

  for (const key of TICK_KEYS) {
    if (!Number.isSafeInteger(parsed[key])) {
      throw new RangeError(`attend params: ${key} must be a whole number of ticks`);
    }
  }
  if (parsed.retainRangeMeters < parsed.acquisitionRangeMeters) {
    throw new RangeError("attend params: retain range must not be shorter than acquisition range");
  }
  if (parsed.acquisitionHalfConeDegrees > 90 || parsed.switchFlickHalfAngleDegrees > 90) {
    throw new RangeError("attend params: half-cone angles must stay within 90 degrees");
  }
  if (Math.abs(parsed.angleScoreWeight + parsed.distanceScoreWeight - 1) > 1e-9) {
    throw new RangeError("attend params: score weights must sum to 1");
  }
  return parsed;
};
