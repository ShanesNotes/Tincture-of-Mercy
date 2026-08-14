/**
 * Motion tuning is data, never code. Every gameplay constant the controller
 * uses is parsed from `game/src/data/motion_params.json`; this module owns the
 * shape, the validation, and the derived-but-never-authored quantities.
 *
 * The sim may not read files, so the raw JSON is handed in by the composition
 * root (or by tests) and validated here.
 */

export type Curve = readonly (readonly [number, number])[];

export interface MotionParams {
  readonly schema: "tincture.motion_params.v0";
  readonly tickHz: number;
  readonly capsule: {
    readonly radius: number;
    readonly height: number;
    readonly skin: number;
  };
  readonly collision: {
    readonly stepHeight: number;
    readonly slopeLimitDegrees: number;
    readonly groundSnapMeters: number;
    readonly maxContacts: number;
    /** cos(slopeLimitDegrees) — a surface is walkable when its normal.y reaches this. Derived, not authored. */
    readonly walkableNormalY: number;
  };
  readonly gravity: {
    readonly metersPerSecondSquared: number;
    readonly terminalSpeedMetersPerSecond: number;
  };
  readonly jump: {
    readonly apexMeters: number;
    readonly breathCost: number;
    /** sqrt(2 * g * apex) — derived, not authored. */
    readonly launchSpeed: number;
  };
  readonly air: { readonly controlFactor: number };
  readonly fallDamage: {
    readonly safeMeters: number;
    readonly lethalMeters: number;
    readonly curve: Curve;
  };
  readonly landing: {
    readonly softLagTicks: number;
    readonly hardLandingMeters: number;
    readonly hardLagTicks: number;
    readonly fallDamageLagTicks: number;
  };
  readonly speeds: {
    readonly walk: number;
    readonly run: number;
    readonly sprintMultiplier: number;
    readonly walkInputThreshold: number;
    readonly idleThreshold: number;
  };
  readonly breath: { readonly sprintDrainPerSecond: number };
  readonly acceleration: {
    readonly groundCurve: Curve;
    readonly groundDeceleration: number;
  };
  readonly turnRateCurve: Curve;
}

export const MOTION_PARAMS_SCHEMA = "tincture.motion_params.v0";

/** Piecewise-linear curve sample, clamped to the endpoints outside the authored domain. */
export const sampleCurve = (curve: Curve, x: number): number => {
  let previous: readonly [number, number] | undefined;
  for (const point of curve) {
    if (previous === undefined) {
      if (x <= point[0]) {
        return point[1];
      }
      previous = point;
      continue;
    }
    if (x <= point[0]) {
      const span = point[0] - previous[0];
      return span <= 0
        ? point[1]
        : previous[1] + ((point[1] - previous[1]) * (x - previous[0])) / span;
    }
    previous = point;
  }
  if (previous === undefined) {
    throw new RangeError("curve must contain at least one point");
  }
  return previous[1];
};

const asRecord = (value: unknown, path: string): Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new RangeError(`${path} must be an object`);
  }
  return value as Record<string, unknown>;
};

const asNumber = (source: Record<string, unknown>, path: string, minimum: number): number => {
  const key = path.slice(path.lastIndexOf(".") + 1);
  const value = source[key];
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum) {
    throw new RangeError(`${path} must be a finite number of at least ${String(minimum)}`);
  }
  return value;
};

const asInteger = (source: Record<string, unknown>, path: string, minimum: number): number => {
  const value = asNumber(source, path, minimum);
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${path} must be an integer`);
  }
  return value;
};

const asCurve = (source: Record<string, unknown>, path: string): Curve => {
  const key = path.slice(path.lastIndexOf(".") + 1);
  const value = source[key];
  if (!Array.isArray(value) || value.length < 2) {
    throw new RangeError(`${path} must be an array of at least two points`);
  }

  const points: [number, number][] = [];
  let previousX = Number.NEGATIVE_INFINITY;
  for (const entry of value) {
    if (!Array.isArray(entry) || entry.length !== 2) {
      throw new RangeError(`${path} points must be [x, y] pairs`);
    }
    const [x, y] = entry as unknown[];
    if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y)) {
      throw new RangeError(`${path} points must hold finite numbers`);
    }
    if (x <= previousX) {
      throw new RangeError(`${path} points must be strictly increasing in x`);
    }
    previousX = x;
    points.push([x, y]);
  }
  return points;
};

const DEGREES_TO_RADIANS = Math.PI / 180;

/** Validates raw JSON into `MotionParams`, throwing `RangeError` on anything malformed. */
export const parseMotionParams = (raw: unknown): MotionParams => {
  const root = asRecord(raw, "motionParams");
  if (root["schema"] !== MOTION_PARAMS_SCHEMA) {
    throw new RangeError(`motionParams.schema must be "${MOTION_PARAMS_SCHEMA}"`);
  }

  const capsule = asRecord(root["capsule"], "motionParams.capsule");
  const collision = asRecord(root["collision"], "motionParams.collision");
  const gravity = asRecord(root["gravity"], "motionParams.gravity");
  const jump = asRecord(root["jump"], "motionParams.jump");
  const air = asRecord(root["air"], "motionParams.air");
  const fallDamage = asRecord(root["fallDamage"], "motionParams.fallDamage");
  const landing = asRecord(root["landing"], "motionParams.landing");
  const speeds = asRecord(root["speeds"], "motionParams.speeds");
  const breath = asRecord(root["breath"], "motionParams.breath");
  const acceleration = asRecord(root["acceleration"], "motionParams.acceleration");

  const radius = asNumber(capsule, "motionParams.capsule.radius", Number.MIN_VALUE);
  const height = asNumber(capsule, "motionParams.capsule.height", Number.MIN_VALUE);
  if (height <= radius * 2) {
    throw new RangeError("motionParams.capsule.height must exceed twice the radius");
  }

  const slopeLimitDegrees = asNumber(collision, "motionParams.collision.slopeLimitDegrees", 0);
  if (slopeLimitDegrees >= 90) {
    throw new RangeError("motionParams.collision.slopeLimitDegrees must be below 90");
  }

  const gravityMagnitude = asNumber(gravity, "motionParams.gravity.metersPerSecondSquared", 0);
  const apexMeters = asNumber(jump, "motionParams.jump.apexMeters", 0);

  const safeMeters = asNumber(fallDamage, "motionParams.fallDamage.safeMeters", 0);
  const lethalMeters = asNumber(fallDamage, "motionParams.fallDamage.lethalMeters", 0);
  if (lethalMeters <= safeMeters) {
    throw new RangeError("motionParams.fallDamage.lethalMeters must exceed safeMeters");
  }

  const walk = asNumber(speeds, "motionParams.speeds.walk", 0);
  const run = asNumber(speeds, "motionParams.speeds.run", 0);
  if (run <= walk) {
    throw new RangeError("motionParams.speeds.run must exceed walk");
  }
  const walkInputThreshold = asNumber(speeds, "motionParams.speeds.walkInputThreshold", Number.MIN_VALUE);
  if (walkInputThreshold >= 1) {
    throw new RangeError("motionParams.speeds.walkInputThreshold must be below 1");
  }

  return {
    schema: MOTION_PARAMS_SCHEMA,
    tickHz: asInteger(root, "motionParams.tickHz", 1),
    capsule: {
      radius,
      height,
      skin: asNumber(capsule, "motionParams.capsule.skin", Number.MIN_VALUE),
    },
    collision: {
      stepHeight: asNumber(collision, "motionParams.collision.stepHeight", 0),
      slopeLimitDegrees,
      groundSnapMeters: asNumber(collision, "motionParams.collision.groundSnapMeters", 0),
      maxContacts: asInteger(collision, "motionParams.collision.maxContacts", 1),
      walkableNormalY: Math.cos(slopeLimitDegrees * DEGREES_TO_RADIANS),
    },
    gravity: {
      metersPerSecondSquared: gravityMagnitude,
      terminalSpeedMetersPerSecond: asNumber(
        gravity,
        "motionParams.gravity.terminalSpeedMetersPerSecond",
        Number.MIN_VALUE,
      ),
    },
    jump: {
      apexMeters,
      breathCost: asNumber(jump, "motionParams.jump.breathCost", 0),
      launchSpeed: Math.sqrt(2 * gravityMagnitude * apexMeters),
    },
    air: { controlFactor: asNumber(air, "motionParams.air.controlFactor", 0) },
    fallDamage: {
      safeMeters,
      lethalMeters,
      curve: asCurve(fallDamage, "motionParams.fallDamage.curve"),
    },
    landing: {
      softLagTicks: asInteger(landing, "motionParams.landing.softLagTicks", 0),
      hardLandingMeters: asNumber(landing, "motionParams.landing.hardLandingMeters", 0),
      hardLagTicks: asInteger(landing, "motionParams.landing.hardLagTicks", 0),
      fallDamageLagTicks: asInteger(landing, "motionParams.landing.fallDamageLagTicks", 0),
    },
    speeds: {
      walk,
      run,
      sprintMultiplier: asNumber(speeds, "motionParams.speeds.sprintMultiplier", 1),
      walkInputThreshold,
      idleThreshold: asNumber(speeds, "motionParams.speeds.idleThreshold", 0),
    },
    breath: {
      sprintDrainPerSecond: asNumber(breath, "motionParams.breath.sprintDrainPerSecond", 0),
    },
    acceleration: {
      groundCurve: asCurve(acceleration, "motionParams.acceleration.groundCurve"),
      groundDeceleration: asNumber(acceleration, "motionParams.acceleration.groundDeceleration", 0),
    },
    turnRateCurve: asCurve(root, "motionParams.turnRateCurve"),
  };
};

/** Damage from a fall, as a fraction of maximum Pulse in [0, 1]. Exact zero at or under the safe height. */
export const fallDamageFraction = (params: MotionParams, fallMeters: number): number => {
  const { safeMeters, lethalMeters, curve } = params.fallDamage;
  if (fallMeters <= safeMeters) {
    return 0;
  }
  const excess = (fallMeters - safeMeters) / (lethalMeters - safeMeters);
  const sampled = sampleCurve(curve, excess > 1 ? 1 : excess);
  return sampled < 0 ? 0 : sampled > 1 ? 1 : sampled;
};
