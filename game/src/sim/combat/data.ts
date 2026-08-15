export const COMBAT_DATA_SCHEMA_VERSION = 1;
export const COMBAT_REPLAY_DATA_VERSION = 1;

export type TickWindow = readonly [startInclusive: number, endExclusive: number];
export type DamageType =
  | "none"
  | "standard"
  | "strike"
  | "pierce"
  | "slash"
  | "wither";
export type HitstopClass =
  | "none"
  | "light"
  | "heavy"
  | "charged"
  | "blocked"
  | "guard_break"
  | "critical"
  | "death";
export type ActorClass =
  | "shared"
  | "kalev"
  | "wolf"
  | "warden_p1"
  | "warden_p2";
export type MoveKind =
  | "attack"
  | "defense"
  | "item"
  | "ceremony"
  | "locomotion"
  | "reaction";
export type MoveTag =
  | "ambient"
  | "bait"
  | "chargeable"
  | "compound"
  | "critical"
  | "directional_death"
  | "ember"
  | "flask"
  | "guard"
  | "hyperarmor"
  | "projectile"
  | "roll"
  | "root"
  | "wither";
export type ProvenanceKind =
  | "tuning"
  | "authored"
  | "tuning_with_authored_defaults";

export interface Provenance {
  readonly kind: ProvenanceKind;
  readonly reference: string;
  readonly authoredReason: string | null;
}

export interface GroundDisplacement {
  readonly forwardMeters: number;
  readonly rightMeters: number;
}

export interface CombatMoveData {
  readonly id: string;
  readonly actorClass: ActorClass;
  readonly kind: MoveKind;
  readonly startupTicks: number;
  readonly activeTicks: number;
  readonly recoveryTicks: number;
  readonly totalTicks: number;
  readonly activeWindows: readonly TickWindow[];
  readonly trackingUntilTick: number | null;
  readonly trackingWindows: readonly TickWindow[];
  readonly turnRateRadiansPerTick: number;
  readonly breathCost: number;
  readonly poiseDamage: number;
  readonly pulseDamage: number;
  readonly witherBuildup: number;
  readonly damageType: DamageType;
  readonly hitstopClass: HitstopClass;
  readonly reHitLockoutTicks: number;
  readonly knockback: GroundDisplacement;
  readonly hyperarmorWindow: TickWindow | null;
  readonly hyperarmorPoise: number;
  readonly iframes: readonly TickWindow[];
  readonly chargeHoldMaxTicks: number;
  /**
   * Per-move override of `buffers.recoveryCancelTailTicks`. Null keeps the
   * global tail; a smaller value locks more of the recovery (round-1 O-F11).
   */
  readonly cancelTailTicks: number | null;
  readonly tags: readonly MoveTag[];
  readonly provenance: Provenance;
}

export interface FrameData {
  readonly schemaVersion: number;
  readonly replayDataVersion: number;
  readonly tickHz: number;
  readonly source: string;
  readonly moves: Readonly<Record<string, CombatMoveData>>;
}

export type RollBand = "light" | "medium" | "heavy";

export interface RollBandData {
  readonly totalTicks: number;
  readonly iframes: TickWindow;
  readonly actionableFromTick: number;
  readonly attackCancelFromTick: number;
  readonly breathCost: number;
}

export interface RollsParams {
  readonly lightMaximumLoadRatioExclusive: number;
  readonly mediumMaximumLoadRatioInclusive: number;
  readonly bands: Readonly<Record<RollBand, RollBandData>>;
  readonly backstep: {
    readonly totalTicks: number;
    readonly iframes: TickWindow;
  };
  readonly provenance: Provenance;
}

export interface BreathCosts {
  readonly lightAttack: number;
  readonly heavyAttack: number;
  readonly chargedAttack: number;
  readonly runningAttack: number;
  readonly rollingAttack: number;
  readonly sprintPerSecond: number;
  readonly jump: number;
  readonly roll: Readonly<Record<RollBand, number>>;
}

export interface BreathParams {
  readonly baseMaximum: number;
  readonly costs: BreathCosts;
  readonly regenPerSecond: number;
  readonly regenDelayTicks: number;
  readonly guardingRegenMultiplier: number;
  readonly guardCostIncomingMultiplier: number;
  readonly provenance: Provenance;
}

export type SteadyClass =
  | "kalev"
  | "kalev_wolf_hide"
  | "wolf"
  | "turned_humanoid"
  | "warden_p1"
  | "warden_p2";

export interface SteadyClassData {
  readonly base: number;
  readonly flinchThreshold: number;
  readonly staggerThreshold: number;
  readonly knockdownThreshold: number;
}

export interface SteadyParams {
  readonly cleanResetTicks: number;
  readonly witherPoiseMultiplier: number;
  readonly classes: Readonly<Record<SteadyClass, SteadyClassData>>;
  readonly poiseDamage: {
    readonly light: number;
    readonly heavy: number;
    readonly charged: number;
    readonly running: number;
    readonly jump: number;
  };
  readonly heavyHyperarmorWindow: TickWindow;
  readonly heavyHyperarmorPoise: number;
  readonly provenance: Provenance;
}

export interface HitstopParams {
  readonly lightTicks: number;
  readonly heavyTicks: number;
  readonly chargedTicks: number;
  readonly blockedTicks: number;
  readonly guardBreakTicks: number;
  readonly criticalTicks: number;
  readonly deathTicks: number;
  readonly provenance: Provenance;
}

export interface BufferParams {
  readonly attackTicks: number;
  readonly rollTicks: number;
  readonly flaskTicks: number;
  readonly capacityPerAction: number;
  readonly recoveryCancelTailTicks: number;
  readonly provenance: Provenance;
}

export interface DefenseParams {
  readonly guardAbsorption: number;
  readonly guardCostIncomingMultiplier: number;
  readonly guardBreakStaggerTicks: number;
  readonly guardBreakRiposteWindowTicks: number;
  readonly backstabRearConeHalfAngleRadians: number;
  readonly criticalCommittedTicks: number;
  readonly criticalIframes: TickWindow;
  readonly criticalDamageMultiplier: number;
  readonly criticalReachMeters: number;
  readonly turnThreshold: number;
  readonly turnedDurationTicks: number;
  readonly provenance: Provenance;
}

export interface CollisionParams {
  readonly substepsPerTick: number;
  readonly gridCellSizeMeters: number;
  readonly epsilonMeters: number;
  readonly maxAngularRadiansPerTick: number;
  readonly maxWeaponTipSpeedMetersPerTick: number;
  readonly provenance: Provenance;
}

export interface TrackingParams {
  readonly defaultTurnRateRadiansPerTick: number;
  readonly minimumTurnRateRadiansPerTick: number;
  readonly maximumTurnRateRadiansPerTick: number;
  readonly provenance: Provenance;
}

export interface FlaskActionParams {
  readonly drinkMoveId: string;
  readonly emberMoveId: string;
  readonly inputBufferTicks: number;
  readonly provenance: Provenance;
}

export interface CombatParams {
  readonly schemaVersion: number;
  readonly replayDataVersion: number;
  readonly tickHz: number;
  readonly source: string;
  readonly rolls: RollsParams;
  readonly breath: BreathParams;
  readonly steady: SteadyParams;
  readonly hitstop: HitstopParams;
  readonly buffers: BufferParams;
  readonly defense: DefenseParams;
  readonly collision: CollisionParams;
  readonly tracking: TrackingParams;
  readonly flaskActions: FlaskActionParams;
}

export interface CombatData {
  readonly frameData: FrameData;
  readonly params: CombatParams;
  readonly fingerprint: string;
}

export interface CombatDataIssue {
  readonly path: string;
  readonly message: string;
}

export class CombatDataError extends Error {
  public readonly issues: readonly CombatDataIssue[];

  public constructor(issues: readonly CombatDataIssue[]) {
    const sorted = [...issues].sort(
      (left, right) =>
        left.path.localeCompare(right.path) ||
        left.message.localeCompare(right.message),
    );
    super(
      `Invalid combat data:\n${sorted
        .map((issue) => `- ${issue.path}: ${issue.message}`)
        .join("\n")}`,
    );
    this.name = "CombatDataError";
    this.issues = deepFreeze(sorted);
  }
}

const ACTOR_CLASSES = [
  "shared",
  "kalev",
  "wolf",
  "warden_p1",
  "warden_p2",
] as const;
const MOVE_KINDS = [
  "attack",
  "defense",
  "item",
  "ceremony",
  "locomotion",
  "reaction",
] as const;
const DAMAGE_TYPES = [
  "none",
  "standard",
  "strike",
  "pierce",
  "slash",
  "wither",
] as const;
const HITSTOP_CLASSES = [
  "none",
  "light",
  "heavy",
  "charged",
  "blocked",
  "guard_break",
  "critical",
  "death",
] as const;
const MOVE_TAGS = [
  "ambient",
  "bait",
  "chargeable",
  "compound",
  "critical",
  "directional_death",
  "ember",
  "flask",
  "guard",
  "hyperarmor",
  "projectile",
  "roll",
  "root",
  "wither",
] as const;
const PROVENANCE_KINDS = [
  "tuning",
  "authored",
  "tuning_with_authored_defaults",
] as const;
const ROLL_BANDS = ["light", "medium", "heavy"] as const;
const STEADY_CLASSES = [
  "kalev",
  "kalev_wolf_hide",
  "wolf",
  "turned_humanoid",
  "warden_p1",
  "warden_p2",
] as const;

export const REQUIRED_COMBAT_MOVE_IDS = [
  "light1",
  "light2",
  "heavy",
  "charged",
  "running",
  "rolling_attack",
  "jump_attack",
  "roll",
  "guard",
  "backstep",
  "riposte",
  "backstab",
  "flask_drink",
  "ember_use",
  "lunge",
  "wolf_harrier_bite",
  "wolf_baiter_feint",
  "warden_p1_overhead_fell",
  "warden_p1_side_clear",
  "warden_p1_lantern_swing",
  "warden_p1_two_step_chop",
  "warden_p1_stomp_snare_kick",
  "warden_p1_lantern_raise_bait",
  "warden_ceremony",
  "warden_p2_wide_fell",
  "warden_p2_three_string_sweep",
  "warden_p2_snare_toss",
  "warden_p2_charge_through",
  "warden_p2_lantern_fire_arc",
  "warden_p2_the_quiet",
  "idle",
  "stalk",
  "circle",
  "flinch",
  "death_crumple_fwd",
  "death_crumple_back",
] as const;

type JsonObject = Record<string, unknown>;

class IssueCollector {
  public readonly issues: CombatDataIssue[] = [];

  public add(path: string, message: string): void {
    this.issues.push({ path, message });
  }
}

const isObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const objectAt = (
  value: unknown,
  path: string,
  issues: IssueCollector,
): JsonObject => {
  if (!isObject(value)) {
    issues.add(path, "must be an object");
    return {};
  }
  return value;
};

const rejectUnknownKeys = (
  object: JsonObject,
  allowed: readonly string[],
  path: string,
  issues: IssueCollector,
): void => {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(object).sort()) {
    if (!allowedSet.has(key)) {
      issues.add(`${path}.${key}`, "is not a recognized key");
    }
  }
};

const finiteNumberAt = (
  object: JsonObject,
  key: string,
  path: string,
  issues: IssueCollector,
  minimum = 0,
  maximum = Number.MAX_VALUE,
): number => {
  const value = object[key];
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < minimum ||
    value > maximum
  ) {
    issues.add(
      `${path}.${key}`,
      `must be a finite number in [${minimum}, ${maximum}]`,
    );
    return minimum;
  }
  return value;
};

const integerAt = (
  object: JsonObject,
  key: string,
  path: string,
  issues: IssueCollector,
  minimum = 0,
  maximum = Number.MAX_SAFE_INTEGER,
): number => {
  const value = finiteNumberAt(object, key, path, issues, minimum, maximum);
  if (!Number.isInteger(value)) {
    issues.add(`${path}.${key}`, "must be an integer");
    return Math.trunc(value);
  }
  return value;
};

const stringAt = (
  object: JsonObject,
  key: string,
  path: string,
  issues: IssueCollector,
): string => {
  const value = object[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.add(`${path}.${key}`, "must be a non-empty string");
    return "";
  }
  return value;
};

const nullableStringAt = (
  object: JsonObject,
  key: string,
  path: string,
  issues: IssueCollector,
): string | null => {
  const value = object[key];
  if (value === null) {
    return null;
  }
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.add(`${path}.${key}`, "must be null or a non-empty string");
    return null;
  }
  return value;
};

const enumAt = <T extends string>(
  object: JsonObject,
  key: string,
  values: readonly T[],
  path: string,
  issues: IssueCollector,
): T => {
  const value = object[key];
  if (typeof value !== "string" || !values.includes(value as T)) {
    issues.add(`${path}.${key}`, `must be one of: ${values.join(", ")}`);
    return values[0] as T;
  }
  return value as T;
};

const nullableIntegerAt = (
  object: JsonObject,
  key: string,
  path: string,
  issues: IssueCollector,
): number | null => {
  if (object[key] === null) {
    return null;
  }
  return integerAt(object, key, path, issues);
};

const parseWindow = (
  value: unknown,
  path: string,
  issues: IssueCollector,
  allowEmpty = false,
): TickWindow => {
  if (!Array.isArray(value) || value.length !== 2) {
    issues.add(path, "must be a two-element half-open tick window");
    return [0, allowEmpty ? 0 : 1];
  }
  const start = value[0];
  const end = value[1];
  if (!Number.isInteger(start) || typeof start !== "number" || start < 0) {
    issues.add(`${path}[0]`, "must be a non-negative integer");
  }
  if (!Number.isInteger(end) || typeof end !== "number" || end < 0) {
    issues.add(`${path}[1]`, "must be a non-negative integer");
  }
  const safeStart = typeof start === "number" && Number.isInteger(start) ? start : 0;
  const safeEnd = typeof end === "number" && Number.isInteger(end) ? end : 0;
  if (allowEmpty ? safeEnd < safeStart : safeEnd <= safeStart) {
    issues.add(path, `must have end ${allowEmpty ? ">=" : ">"} start`);
  }
  return [safeStart, safeEnd];
};

const parseWindows = (
  value: unknown,
  path: string,
  issues: IssueCollector,
): readonly TickWindow[] => {
  if (!Array.isArray(value)) {
    issues.add(path, "must be an array of half-open tick windows");
    return [];
  }
  const windows = value.map((entry, index) =>
    parseWindow(entry, `${path}[${index}]`, issues),
  );
  for (let index = 1; index < windows.length; index += 1) {
    const previous = windows[index - 1];
    const current = windows[index];
    if (previous !== undefined && current !== undefined && current[0] < previous[1]) {
      issues.add(`${path}[${index}]`, "must not overlap or precede the prior window");
    }
  }
  return windows;
};

const parseEnumArray = <T extends string>(
  value: unknown,
  values: readonly T[],
  path: string,
  issues: IssueCollector,
): readonly T[] => {
  if (!Array.isArray(value)) {
    issues.add(path, "must be an array");
    return [];
  }
  const result: T[] = [];
  for (const [index, entry] of value.entries()) {
    if (typeof entry !== "string" || !values.includes(entry as T)) {
      issues.add(`${path}[${index}]`, `must be one of: ${values.join(", ")}`);
    } else if (result.includes(entry as T)) {
      issues.add(`${path}[${index}]`, "must not duplicate an earlier value");
    } else {
      result.push(entry as T);
    }
  }
  return result;
};

const parseProvenance = (
  value: unknown,
  path: string,
  issues: IssueCollector,
): Provenance => {
  const object = objectAt(value, path, issues);
  rejectUnknownKeys(
    object,
    ["kind", "reference", "authoredReason"],
    path,
    issues,
  );
  const kind = enumAt(object, "kind", PROVENANCE_KINDS, path, issues);
  const reference = stringAt(object, "reference", path, issues);
  const authoredReason = nullableStringAt(
    object,
    "authoredReason",
    path,
    issues,
  );
  if (kind === "tuning" && authoredReason !== null) {
    issues.add(`${path}.authoredReason`, "must be null for tuning-only data");
  }
  if (kind !== "tuning" && authoredReason === null) {
    issues.add(`${path}.authoredReason`, "must explain every authored default");
  }
  return { kind, reference, authoredReason };
};

const parseKnockback = (
  value: unknown,
  path: string,
  issues: IssueCollector,
): GroundDisplacement => {
  const object = objectAt(value, path, issues);
  rejectUnknownKeys(object, ["forwardMeters", "rightMeters"], path, issues);
  return {
    forwardMeters: finiteNumberAt(
      object,
      "forwardMeters",
      path,
      issues,
      -100,
      100,
    ),
    rightMeters: finiteNumberAt(
      object,
      "rightMeters",
      path,
      issues,
      -100,
      100,
    ),
  };
};

const parseMove = (
  id: string,
  value: unknown,
  path: string,
  issues: IssueCollector,
): CombatMoveData => {
  const object = objectAt(value, path, issues);
  rejectUnknownKeys(
    object,
    [
      "id",
      "actorClass",
      "kind",
      "startupTicks",
      "activeTicks",
      "recoveryTicks",
      "totalTicks",
      "activeWindows",
      "trackingUntilTick",
      "trackingWindows",
      "turnRateRadiansPerTick",
      "breathCost",
      "poiseDamage",
      "pulseDamage",
      "witherBuildup",
      "damageType",
      "hitstopClass",
      "reHitLockoutTicks",
      "knockback",
      "hyperarmorWindow",
      "hyperarmorPoise",
      "iframes",
      "chargeHoldMaxTicks",
      "cancelTailTicks",
      "tags",
      "provenance",
    ],
    path,
    issues,
  );
  const parsedId = stringAt(object, "id", path, issues);
  if (parsedId !== id) {
    issues.add(`${path}.id`, `must match record key ${JSON.stringify(id)}`);
  }
  const startupTicks = integerAt(object, "startupTicks", path, issues);
  const activeTicks = integerAt(object, "activeTicks", path, issues);
  const recoveryTicks = integerAt(object, "recoveryTicks", path, issues);
  const totalTicks = integerAt(object, "totalTicks", path, issues, 1);
  const activeWindows = parseWindows(
    object.activeWindows,
    `${path}.activeWindows`,
    issues,
  );
  const trackingUntilTick = nullableIntegerAt(
    object,
    "trackingUntilTick",
    path,
    issues,
  );
  const trackingWindows = parseWindows(
    object.trackingWindows,
    `${path}.trackingWindows`,
    issues,
  );
  const hyperarmorWindow =
    object.hyperarmorWindow === null
      ? null
      : parseWindow(
          object.hyperarmorWindow,
          `${path}.hyperarmorWindow`,
          issues,
        );
  const iframes = parseWindows(object.iframes, `${path}.iframes`, issues);
  const tags = parseEnumArray(object.tags, MOVE_TAGS, `${path}.tags`, issues);

  if (startupTicks + activeTicks + recoveryTicks !== totalTicks) {
    issues.add(
      `${path}.totalTicks`,
      "must equal startupTicks + activeTicks + recoveryTicks",
    );
  }
  const authoredActiveTicks = activeWindows.reduce(
    (sum, window) => sum + window[1] - window[0],
    0,
  );
  if (authoredActiveTicks !== activeTicks) {
    issues.add(
      `${path}.activeWindows`,
      "durations must sum to activeTicks",
    );
  }
  if (
    activeTicks > 0 &&
    !tags.includes("compound") &&
    (activeWindows.length !== 1 ||
      activeWindows[0]?.[0] !== startupTicks ||
      activeWindows[0]?.[1] !== startupTicks + activeTicks)
  ) {
    issues.add(
      `${path}.activeWindows`,
      "a non-compound move must place its sole active window immediately after startup",
    );
  }
  const activeLimit = totalTicks - recoveryTicks;
  for (const [index, window] of activeWindows.entries()) {
    if (window[1] > activeLimit) {
      issues.add(
        `${path}.activeWindows[${index}]`,
        "must end before the final recovery phase",
      );
    }
  }
  for (const [label, windows] of [
    ["trackingWindows", trackingWindows],
    ["iframes", iframes],
  ] as const) {
    for (const [index, window] of windows.entries()) {
      if (window[1] > totalTicks) {
        issues.add(`${path}.${label}[${index}]`, "must fit inside totalTicks");
      }
    }
  }
  if (hyperarmorWindow !== null && hyperarmorWindow[1] > totalTicks) {
    issues.add(`${path}.hyperarmorWindow`, "must fit inside totalTicks");
  }
  if (trackingUntilTick !== null && trackingUntilTick >= totalTicks) {
    issues.add(`${path}.trackingUntilTick`, "must be less than totalTicks");
  }
  if (trackingUntilTick === null && trackingWindows.length > 0) {
    issues.add(
      `${path}.trackingWindows`,
      "must be empty when trackingUntilTick is null",
    );
  }
  if (trackingUntilTick !== null && trackingWindows.length === 0) {
    issues.add(
      `${path}.trackingWindows`,
      "must contain at least one window when tracking is enabled",
    );
  }
  // Absent means "use the global recovery tail"; only the rows that lock extra
  // recovery carry the key.
  const cancelTailTicks =
    object.cancelTailTicks === undefined
      ? null
      : nullableIntegerAt(object, "cancelTailTicks", path, issues);
  if (cancelTailTicks !== null && cancelTailTicks > recoveryTicks) {
    issues.add(`${path}.cancelTailTicks`, "must fit inside recoveryTicks");
  }

  return {
    id: parsedId,
    actorClass: enumAt(object, "actorClass", ACTOR_CLASSES, path, issues),
    kind: enumAt(object, "kind", MOVE_KINDS, path, issues),
    startupTicks,
    activeTicks,
    recoveryTicks,
    totalTicks,
    activeWindows,
    trackingUntilTick,
    trackingWindows,
    turnRateRadiansPerTick: finiteNumberAt(
      object,
      "turnRateRadiansPerTick",
      path,
      issues,
      0,
      Math.PI,
    ),
    breathCost: finiteNumberAt(object, "breathCost", path, issues),
    poiseDamage: finiteNumberAt(object, "poiseDamage", path, issues),
    pulseDamage: finiteNumberAt(object, "pulseDamage", path, issues),
    witherBuildup: finiteNumberAt(object, "witherBuildup", path, issues),
    damageType: enumAt(object, "damageType", DAMAGE_TYPES, path, issues),
    hitstopClass: enumAt(
      object,
      "hitstopClass",
      HITSTOP_CLASSES,
      path,
      issues,
    ),
    reHitLockoutTicks: integerAt(
      object,
      "reHitLockoutTicks",
      path,
      issues,
    ),
    knockback: parseKnockback(object.knockback, `${path}.knockback`, issues),
    hyperarmorWindow,
    hyperarmorPoise: finiteNumberAt(
      object,
      "hyperarmorPoise",
      path,
      issues,
    ),
    iframes,
    chargeHoldMaxTicks: integerAt(
      object,
      "chargeHoldMaxTicks",
      path,
      issues,
    ),
    cancelTailTicks,
    tags,
    provenance: parseProvenance(
      object.provenance,
      `${path}.provenance`,
      issues,
    ),
  };
};

const parseFrameData = (
  value: unknown,
  issues: IssueCollector,
): FrameData => {
  const path = "$.frameData";
  const object = objectAt(value, path, issues);
  rejectUnknownKeys(
    object,
    ["schemaVersion", "replayDataVersion", "tickHz", "source", "moves"],
    path,
    issues,
  );
  const movesObject = objectAt(object.moves, `${path}.moves`, issues);
  const moves: Record<string, CombatMoveData> = {};
  for (const id of Object.keys(movesObject).sort()) {
    moves[id] = parseMove(
      id,
      movesObject[id],
      `${path}.moves.${id}`,
      issues,
    );
  }
  for (const id of REQUIRED_COMBAT_MOVE_IDS) {
    if (!(id in movesObject)) {
      issues.add(`${path}.moves.${id}`, "is a required combat move row");
    }
  }
  return {
    schemaVersion: integerAt(object, "schemaVersion", path, issues, 1),
    replayDataVersion: integerAt(
      object,
      "replayDataVersion",
      path,
      issues,
      1,
    ),
    tickHz: integerAt(object, "tickHz", path, issues, 1, 1000),
    source: stringAt(object, "source", path, issues),
    moves,
  };
};

const parseRollBand = (
  value: unknown,
  path: string,
  issues: IssueCollector,
): RollBandData => {
  const object = objectAt(value, path, issues);
  rejectUnknownKeys(
    object,
    [
      "totalTicks",
      "iframes",
      "actionableFromTick",
      "attackCancelFromTick",
      "breathCost",
    ],
    path,
    issues,
  );
  const totalTicks = integerAt(object, "totalTicks", path, issues, 1);
  const iframes = parseWindow(object.iframes, `${path}.iframes`, issues);
  const actionableFromTick = integerAt(
    object,
    "actionableFromTick",
    path,
    issues,
  );
  const attackCancelFromTick = integerAt(
    object,
    "attackCancelFromTick",
    path,
    issues,
  );
  if (iframes[1] > totalTicks) {
    issues.add(`${path}.iframes`, "must fit inside totalTicks");
  }
  if (actionableFromTick >= totalTicks) {
    issues.add(`${path}.actionableFromTick`, "must be less than totalTicks");
  }
  if (attackCancelFromTick >= totalTicks) {
    issues.add(`${path}.attackCancelFromTick`, "must be less than totalTicks");
  }
  return {
    totalTicks,
    iframes,
    actionableFromTick,
    attackCancelFromTick,
    breathCost: finiteNumberAt(object, "breathCost", path, issues),
  };
};

const parseRolls = (
  value: unknown,
  path: string,
  issues: IssueCollector,
): RollsParams => {
  const object = objectAt(value, path, issues);
  rejectUnknownKeys(
    object,
    [
      "lightMaximumLoadRatioExclusive",
      "mediumMaximumLoadRatioInclusive",
      "bands",
      "backstep",
      "provenance",
    ],
    path,
    issues,
  );
  const bandsObject = objectAt(object.bands, `${path}.bands`, issues);
  rejectUnknownKeys(bandsObject, ROLL_BANDS, `${path}.bands`, issues);
  const bands = {} as Record<RollBand, RollBandData>;
  for (const band of ROLL_BANDS) {
    bands[band] = parseRollBand(
      bandsObject[band],
      `${path}.bands.${band}`,
      issues,
    );
  }
  const backstepObject = objectAt(object.backstep, `${path}.backstep`, issues);
  rejectUnknownKeys(
    backstepObject,
    ["totalTicks", "iframes"],
    `${path}.backstep`,
    issues,
  );
  const backstep = {
    totalTicks: integerAt(
      backstepObject,
      "totalTicks",
      `${path}.backstep`,
      issues,
      1,
    ),
    iframes: parseWindow(
      backstepObject.iframes,
      `${path}.backstep.iframes`,
      issues,
    ),
  };
  if (backstep.iframes[1] > backstep.totalTicks) {
    issues.add(`${path}.backstep.iframes`, "must fit inside totalTicks");
  }
  const lightMaximumLoadRatioExclusive = finiteNumberAt(
    object,
    "lightMaximumLoadRatioExclusive",
    path,
    issues,
    0,
    1,
  );
  const mediumMaximumLoadRatioInclusive = finiteNumberAt(
    object,
    "mediumMaximumLoadRatioInclusive",
    path,
    issues,
    0,
    1,
  );
  if (mediumMaximumLoadRatioInclusive <= lightMaximumLoadRatioExclusive) {
    issues.add(
      `${path}.mediumMaximumLoadRatioInclusive`,
      "must exceed lightMaximumLoadRatioExclusive",
    );
  }
  return {
    lightMaximumLoadRatioExclusive,
    mediumMaximumLoadRatioInclusive,
    bands,
    backstep,
    provenance: parseProvenance(
      object.provenance,
      `${path}.provenance`,
      issues,
    ),
  };
};

const parseRollCosts = (
  value: unknown,
  path: string,
  issues: IssueCollector,
): Readonly<Record<RollBand, number>> => {
  const object = objectAt(value, path, issues);
  rejectUnknownKeys(object, ROLL_BANDS, path, issues);
  return {
    light: finiteNumberAt(object, "light", path, issues),
    medium: finiteNumberAt(object, "medium", path, issues),
    heavy: finiteNumberAt(object, "heavy", path, issues),
  };
};

const parseBreath = (
  value: unknown,
  path: string,
  issues: IssueCollector,
): BreathParams => {
  const object = objectAt(value, path, issues);
  rejectUnknownKeys(
    object,
    [
      "baseMaximum",
      "costs",
      "regenPerSecond",
      "regenDelayTicks",
      "guardingRegenMultiplier",
      "guardCostIncomingMultiplier",
      "provenance",
    ],
    path,
    issues,
  );
  const costsPath = `${path}.costs`;
  const costsObject = objectAt(object.costs, costsPath, issues);
  rejectUnknownKeys(
    costsObject,
    [
      "lightAttack",
      "heavyAttack",
      "chargedAttack",
      "runningAttack",
      "rollingAttack",
      "sprintPerSecond",
      "jump",
      "roll",
    ],
    costsPath,
    issues,
  );
  return {
    baseMaximum: finiteNumberAt(object, "baseMaximum", path, issues, 1),
    costs: {
      lightAttack: finiteNumberAt(costsObject, "lightAttack", costsPath, issues),
      heavyAttack: finiteNumberAt(costsObject, "heavyAttack", costsPath, issues),
      chargedAttack: finiteNumberAt(
        costsObject,
        "chargedAttack",
        costsPath,
        issues,
      ),
      runningAttack: finiteNumberAt(
        costsObject,
        "runningAttack",
        costsPath,
        issues,
      ),
      rollingAttack: finiteNumberAt(
        costsObject,
        "rollingAttack",
        costsPath,
        issues,
      ),
      sprintPerSecond: finiteNumberAt(
        costsObject,
        "sprintPerSecond",
        costsPath,
        issues,
      ),
      jump: finiteNumberAt(costsObject, "jump", costsPath, issues),
      roll: parseRollCosts(costsObject.roll, `${costsPath}.roll`, issues),
    },
    regenPerSecond: finiteNumberAt(object, "regenPerSecond", path, issues),
    regenDelayTicks: integerAt(object, "regenDelayTicks", path, issues),
    guardingRegenMultiplier: finiteNumberAt(
      object,
      "guardingRegenMultiplier",
      path,
      issues,
      0,
      1,
    ),
    guardCostIncomingMultiplier: finiteNumberAt(
      object,
      "guardCostIncomingMultiplier",
      path,
      issues,
      0,
      1,
    ),
    provenance: parseProvenance(
      object.provenance,
      `${path}.provenance`,
      issues,
    ),
  };
};

const parseSteadyClass = (
  value: unknown,
  path: string,
  issues: IssueCollector,
): SteadyClassData => {
  const object = objectAt(value, path, issues);
  rejectUnknownKeys(
    object,
    ["base", "flinchThreshold", "staggerThreshold", "knockdownThreshold"],
    path,
    issues,
  );
  const base = finiteNumberAt(object, "base", path, issues, 1);
  const flinchThreshold = finiteNumberAt(
    object,
    "flinchThreshold",
    path,
    issues,
    1,
  );
  const staggerThreshold = finiteNumberAt(
    object,
    "staggerThreshold",
    path,
    issues,
    1,
  );
  const knockdownThreshold = finiteNumberAt(
    object,
    "knockdownThreshold",
    path,
    issues,
    1,
  );
  if (!(flinchThreshold <= staggerThreshold && staggerThreshold <= knockdownThreshold)) {
    issues.add(path, "thresholds must be ordered flinch <= stagger <= knockdown");
  }
  if (base !== staggerThreshold) {
    issues.add(`${path}.base`, "must equal staggerThreshold for the v0 buildup model");
  }
  return { base, flinchThreshold, staggerThreshold, knockdownThreshold };
};

const parseSteady = (
  value: unknown,
  path: string,
  issues: IssueCollector,
): SteadyParams => {
  const object = objectAt(value, path, issues);
  rejectUnknownKeys(
    object,
    [
      "cleanResetTicks",
      "witherPoiseMultiplier",
      "classes",
      "poiseDamage",
      "heavyHyperarmorWindow",
      "heavyHyperarmorPoise",
      "provenance",
    ],
    path,
    issues,
  );
  const classesObject = objectAt(object.classes, `${path}.classes`, issues);
  rejectUnknownKeys(classesObject, STEADY_CLASSES, `${path}.classes`, issues);
  const classes = {} as Record<SteadyClass, SteadyClassData>;
  for (const classId of STEADY_CLASSES) {
    classes[classId] = parseSteadyClass(
      classesObject[classId],
      `${path}.classes.${classId}`,
      issues,
    );
  }
  const poisePath = `${path}.poiseDamage`;
  const poiseObject = objectAt(object.poiseDamage, poisePath, issues);
  rejectUnknownKeys(
    poiseObject,
    ["light", "heavy", "charged", "running", "jump"],
    poisePath,
    issues,
  );
  return {
    cleanResetTicks: integerAt(object, "cleanResetTicks", path, issues, 1),
    witherPoiseMultiplier: finiteNumberAt(
      object,
      "witherPoiseMultiplier",
      path,
      issues,
      1,
    ),
    classes,
    poiseDamage: {
      light: finiteNumberAt(poiseObject, "light", poisePath, issues),
      heavy: finiteNumberAt(poiseObject, "heavy", poisePath, issues),
      charged: finiteNumberAt(poiseObject, "charged", poisePath, issues),
      running: finiteNumberAt(poiseObject, "running", poisePath, issues),
      jump: finiteNumberAt(poiseObject, "jump", poisePath, issues),
    },
    heavyHyperarmorWindow: parseWindow(
      object.heavyHyperarmorWindow,
      `${path}.heavyHyperarmorWindow`,
      issues,
    ),
    heavyHyperarmorPoise: finiteNumberAt(
      object,
      "heavyHyperarmorPoise",
      path,
      issues,
    ),
    provenance: parseProvenance(
      object.provenance,
      `${path}.provenance`,
      issues,
    ),
  };
};

const parseHitstop = (
  value: unknown,
  path: string,
  issues: IssueCollector,
): HitstopParams => {
  const object = objectAt(value, path, issues);
  rejectUnknownKeys(
    object,
    [
      "lightTicks",
      "heavyTicks",
      "chargedTicks",
      "blockedTicks",
      "guardBreakTicks",
      "criticalTicks",
      "deathTicks",
      "provenance",
    ],
    path,
    issues,
  );
  return {
    lightTicks: integerAt(object, "lightTicks", path, issues),
    heavyTicks: integerAt(object, "heavyTicks", path, issues),
    chargedTicks: integerAt(object, "chargedTicks", path, issues),
    blockedTicks: integerAt(object, "blockedTicks", path, issues),
    guardBreakTicks: integerAt(object, "guardBreakTicks", path, issues),
    criticalTicks: integerAt(object, "criticalTicks", path, issues),
    deathTicks: integerAt(object, "deathTicks", path, issues),
    provenance: parseProvenance(
      object.provenance,
      `${path}.provenance`,
      issues,
    ),
  };
};

const parseBuffers = (
  value: unknown,
  path: string,
  issues: IssueCollector,
): BufferParams => {
  const object = objectAt(value, path, issues);
  rejectUnknownKeys(
    object,
    [
      "attackTicks",
      "rollTicks",
      "flaskTicks",
      "capacityPerAction",
      "recoveryCancelTailTicks",
      "provenance",
    ],
    path,
    issues,
  );
  return {
    attackTicks: integerAt(object, "attackTicks", path, issues, 1),
    rollTicks: integerAt(object, "rollTicks", path, issues, 1),
    flaskTicks: integerAt(object, "flaskTicks", path, issues, 1),
    capacityPerAction: integerAt(object, "capacityPerAction", path, issues, 1, 1),
    recoveryCancelTailTicks: integerAt(
      object,
      "recoveryCancelTailTicks",
      path,
      issues,
      1,
    ),
    provenance: parseProvenance(
      object.provenance,
      `${path}.provenance`,
      issues,
    ),
  };
};

const parseDefense = (
  value: unknown,
  path: string,
  issues: IssueCollector,
): DefenseParams => {
  const object = objectAt(value, path, issues);
  rejectUnknownKeys(
    object,
    [
      "guardAbsorption",
      "guardCostIncomingMultiplier",
      "guardBreakStaggerTicks",
      "guardBreakRiposteWindowTicks",
      "backstabRearConeHalfAngleRadians",
      "criticalCommittedTicks",
      "criticalIframes",
      "criticalDamageMultiplier",
      "criticalReachMeters",
      "turnThreshold",
      "turnedDurationTicks",
      "provenance",
    ],
    path,
    issues,
  );
  const criticalCommittedTicks = integerAt(
    object,
    "criticalCommittedTicks",
    path,
    issues,
    1,
  );
  const criticalIframes = parseWindow(
    object.criticalIframes,
    `${path}.criticalIframes`,
    issues,
  );
  if (criticalIframes[1] > criticalCommittedTicks) {
    issues.add(`${path}.criticalIframes`, "must fit inside criticalCommittedTicks");
  }
  return {
    guardAbsorption: finiteNumberAt(
      object,
      "guardAbsorption",
      path,
      issues,
      0,
      1,
    ),
    guardCostIncomingMultiplier: finiteNumberAt(
      object,
      "guardCostIncomingMultiplier",
      path,
      issues,
      0,
      1,
    ),
    guardBreakStaggerTicks: integerAt(
      object,
      "guardBreakStaggerTicks",
      path,
      issues,
      1,
    ),
    guardBreakRiposteWindowTicks: integerAt(
      object,
      "guardBreakRiposteWindowTicks",
      path,
      issues,
      1,
    ),
    backstabRearConeHalfAngleRadians: finiteNumberAt(
      object,
      "backstabRearConeHalfAngleRadians",
      path,
      issues,
      0,
      Math.PI,
    ),
    criticalCommittedTicks,
    criticalIframes,
    criticalDamageMultiplier: finiteNumberAt(
      object,
      "criticalDamageMultiplier",
      path,
      issues,
      1,
    ),
    criticalReachMeters: finiteNumberAt(
      object,
      "criticalReachMeters",
      path,
      issues,
      0,
    ),
    turnThreshold: finiteNumberAt(object, "turnThreshold", path, issues, 1),
    turnedDurationTicks: integerAt(
      object,
      "turnedDurationTicks",
      path,
      issues,
      1,
    ),
    provenance: parseProvenance(
      object.provenance,
      `${path}.provenance`,
      issues,
    ),
  };
};

const parseCollision = (
  value: unknown,
  path: string,
  issues: IssueCollector,
): CollisionParams => {
  const object = objectAt(value, path, issues);
  rejectUnknownKeys(
    object,
    [
      "substepsPerTick",
      "gridCellSizeMeters",
      "epsilonMeters",
      "maxAngularRadiansPerTick",
      "maxWeaponTipSpeedMetersPerTick",
      "provenance",
    ],
    path,
    issues,
  );
  return {
    substepsPerTick: integerAt(object, "substepsPerTick", path, issues, 1, 16),
    gridCellSizeMeters: finiteNumberAt(
      object,
      "gridCellSizeMeters",
      path,
      issues,
      Number.EPSILON,
      100,
    ),
    epsilonMeters: finiteNumberAt(
      object,
      "epsilonMeters",
      path,
      issues,
      Number.EPSILON,
      1,
    ),
    maxAngularRadiansPerTick: finiteNumberAt(
      object,
      "maxAngularRadiansPerTick",
      path,
      issues,
      Number.EPSILON,
      Math.PI,
    ),
    maxWeaponTipSpeedMetersPerTick: finiteNumberAt(
      object,
      "maxWeaponTipSpeedMetersPerTick",
      path,
      issues,
      Number.EPSILON,
      100,
    ),
    provenance: parseProvenance(
      object.provenance,
      `${path}.provenance`,
      issues,
    ),
  };
};

const parseTracking = (
  value: unknown,
  path: string,
  issues: IssueCollector,
): TrackingParams => {
  const object = objectAt(value, path, issues);
  rejectUnknownKeys(
    object,
    [
      "defaultTurnRateRadiansPerTick",
      "minimumTurnRateRadiansPerTick",
      "maximumTurnRateRadiansPerTick",
      "provenance",
    ],
    path,
    issues,
  );
  const minimumTurnRateRadiansPerTick = finiteNumberAt(
    object,
    "minimumTurnRateRadiansPerTick",
    path,
    issues,
    0,
    Math.PI,
  );
  const maximumTurnRateRadiansPerTick = finiteNumberAt(
    object,
    "maximumTurnRateRadiansPerTick",
    path,
    issues,
    0,
    Math.PI,
  );
  const defaultTurnRateRadiansPerTick = finiteNumberAt(
    object,
    "defaultTurnRateRadiansPerTick",
    path,
    issues,
    0,
    Math.PI,
  );
  if (
    minimumTurnRateRadiansPerTick > defaultTurnRateRadiansPerTick ||
    defaultTurnRateRadiansPerTick > maximumTurnRateRadiansPerTick
  ) {
    issues.add(path, "turn rates must be ordered minimum <= default <= maximum");
  }
  return {
    defaultTurnRateRadiansPerTick,
    minimumTurnRateRadiansPerTick,
    maximumTurnRateRadiansPerTick,
    provenance: parseProvenance(
      object.provenance,
      `${path}.provenance`,
      issues,
    ),
  };
};

const parseFlaskActions = (
  value: unknown,
  path: string,
  issues: IssueCollector,
): FlaskActionParams => {
  const object = objectAt(value, path, issues);
  rejectUnknownKeys(
    object,
    ["drinkMoveId", "emberMoveId", "inputBufferTicks", "provenance"],
    path,
    issues,
  );
  return {
    drinkMoveId: stringAt(object, "drinkMoveId", path, issues),
    emberMoveId: stringAt(object, "emberMoveId", path, issues),
    inputBufferTicks: integerAt(object, "inputBufferTicks", path, issues, 1),
    provenance: parseProvenance(
      object.provenance,
      `${path}.provenance`,
      issues,
    ),
  };
};

const parseCombatParams = (
  value: unknown,
  issues: IssueCollector,
): CombatParams => {
  const path = "$.params";
  const object = objectAt(value, path, issues);
  rejectUnknownKeys(
    object,
    [
      "schemaVersion",
      "replayDataVersion",
      "tickHz",
      "source",
      "rolls",
      "breath",
      "steady",
      "hitstop",
      "buffers",
      "defense",
      "collision",
      "tracking",
      "flaskActions",
    ],
    path,
    issues,
  );
  return {
    schemaVersion: integerAt(object, "schemaVersion", path, issues, 1),
    replayDataVersion: integerAt(
      object,
      "replayDataVersion",
      path,
      issues,
      1,
    ),
    tickHz: integerAt(object, "tickHz", path, issues, 1, 1000),
    source: stringAt(object, "source", path, issues),
    rolls: parseRolls(object.rolls, `${path}.rolls`, issues),
    breath: parseBreath(object.breath, `${path}.breath`, issues),
    steady: parseSteady(object.steady, `${path}.steady`, issues),
    hitstop: parseHitstop(object.hitstop, `${path}.hitstop`, issues),
    buffers: parseBuffers(object.buffers, `${path}.buffers`, issues),
    defense: parseDefense(object.defense, `${path}.defense`, issues),
    collision: parseCollision(object.collision, `${path}.collision`, issues),
    tracking: parseTracking(object.tracking, `${path}.tracking`, issues),
    flaskActions: parseFlaskActions(
      object.flaskActions,
      `${path}.flaskActions`,
      issues,
    ),
  };
};

const validateCrossTable = (
  frameData: FrameData,
  params: CombatParams,
  issues: IssueCollector,
): void => {
  if (frameData.schemaVersion !== COMBAT_DATA_SCHEMA_VERSION) {
    issues.add(
      "$.frameData.schemaVersion",
      `unsupported version; expected ${COMBAT_DATA_SCHEMA_VERSION}`,
    );
  }
  if (params.schemaVersion !== COMBAT_DATA_SCHEMA_VERSION) {
    issues.add(
      "$.params.schemaVersion",
      `unsupported version; expected ${COMBAT_DATA_SCHEMA_VERSION}`,
    );
  }
  if (frameData.replayDataVersion !== COMBAT_REPLAY_DATA_VERSION) {
    issues.add(
      "$.frameData.replayDataVersion",
      `unsupported version; expected ${COMBAT_REPLAY_DATA_VERSION}`,
    );
  }
  if (params.replayDataVersion !== COMBAT_REPLAY_DATA_VERSION) {
    issues.add(
      "$.params.replayDataVersion",
      `unsupported version; expected ${COMBAT_REPLAY_DATA_VERSION}`,
    );
  }
  if (frameData.tickHz !== params.tickHz) {
    issues.add("$.params.tickHz", "must match frameData.tickHz");
  }
  if (frameData.tickHz !== 60) {
    issues.add("$.frameData.tickHz", "must be 60 for v0 combat data");
  }
  if (params.collision.substepsPerTick !== 3) {
    issues.add(
      "$.params.collision.substepsPerTick",
      "must be 3 for the v0 swept-capsule solver",
    );
  }
  if (frameData.replayDataVersion !== params.replayDataVersion) {
    issues.add(
      "$.params.replayDataVersion",
      "must match frameData.replayDataVersion",
    );
  }
  const drinkMove = frameData.moves[params.flaskActions.drinkMoveId];
  if (drinkMove === undefined || !drinkMove.tags.includes("flask")) {
    issues.add(
      "$.params.flaskActions.drinkMoveId",
      "must reference a flask-tagged move",
    );
  }
  const emberMove = frameData.moves[params.flaskActions.emberMoveId];
  if (emberMove === undefined || !emberMove.tags.includes("ember")) {
    issues.add(
      "$.params.flaskActions.emberMoveId",
      "must reference an ember-tagged move",
    );
  }
  if (params.flaskActions.inputBufferTicks !== params.buffers.flaskTicks) {
    issues.add(
      "$.params.flaskActions.inputBufferTicks",
      "must match buffers.flaskTicks",
    );
  }
  if (
    params.defense.guardCostIncomingMultiplier !==
    params.breath.guardCostIncomingMultiplier
  ) {
    issues.add(
      "$.params.defense.guardCostIncomingMultiplier",
      "must match breath.guardCostIncomingMultiplier",
    );
  }
  if (
    params.defense.criticalCommittedTicks !==
      frameData.moves.riposte?.totalTicks ||
    params.defense.criticalCommittedTicks !==
      frameData.moves.backstab?.totalTicks
  ) {
    issues.add(
      "$.params.defense.criticalCommittedTicks",
      "must match riposte and backstab totalTicks",
    );
  }
  for (const [moveId, move] of Object.entries(frameData.moves)) {
    if (
      move.turnRateRadiansPerTick >
      params.tracking.maximumTurnRateRadiansPerTick
    ) {
      issues.add(
        `$.frameData.moves.${moveId}.turnRateRadiansPerTick`,
        "must not exceed tracking.maximumTurnRateRadiansPerTick",
      );
    }
  }
  for (const band of ROLL_BANDS) {
    const roll = params.rolls.bands[band];
    if (roll.breathCost !== params.breath.costs.roll[band]) {
      issues.add(
        `$.params.rolls.bands.${band}.breathCost`,
        `must match breath.costs.roll.${band}`,
      );
    }
  }
  if (
    params.steady.heavyHyperarmorWindow[0] !==
      frameData.moves.heavy?.hyperarmorWindow?.[0] ||
    params.steady.heavyHyperarmorWindow[1] !==
      frameData.moves.heavy.hyperarmorWindow?.[1]
  ) {
    issues.add(
      "$.params.steady.heavyHyperarmorWindow",
      "must match the heavy move hyperarmor window",
    );
  }
};

const deepFreeze = <T>(value: T): T => {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }
  for (const key of Reflect.ownKeys(value)) {
    deepFreeze(Reflect.get(value, key));
  }
  return Object.freeze(value);
};

const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("Cannot fingerprint non-finite combat data.");
    }
    return Object.is(value, -0) ? "0" : JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  if (isObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  throw new Error("Combat data contains a non-JSON value.");
};

const fingerprint = (value: unknown): string => {
  const text = canonicalJson(value);
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = 0xffffffffffffffffn;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    hash ^= BigInt(code & 0xff);
    hash = (hash * prime) & mask;
    hash ^= BigInt(code >>> 8);
    hash = (hash * prime) & mask;
  }
  return hash.toString(16).padStart(16, "0");
};

export const compileCombatData = (
  frameRaw: unknown,
  paramsRaw: unknown,
): CombatData => {
  const issues = new IssueCollector();
  const frameData = parseFrameData(frameRaw, issues);
  const params = parseCombatParams(paramsRaw, issues);
  validateCrossTable(frameData, params, issues);
  if (issues.issues.length > 0) {
    throw new CombatDataError(issues.issues);
  }
  const compiled = { frameData, params };
  return deepFreeze({ ...compiled, fingerprint: fingerprint(compiled) });
};
