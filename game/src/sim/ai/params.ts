export interface TelegraphParams {
  readonly startupTicks: number;
  readonly activeTicks: number;
  readonly recoveryTicks: number;
}

export interface WolfAiParams {
  readonly version: 1;
  readonly tickHz: number;
  readonly wither: { readonly appliesWither: false };
  readonly token: {
    readonly ringRadiusM: number;
    readonly releaseTicksAfterResolution: number;
  };
  readonly leash: { readonly radiusM: number };
  readonly flee: {
    readonly pulseRatio: number;
    readonly returnTicks: number;
  };
  readonly howl: {
    readonly aggressionDelta: number;
    readonly startupTicks: number;
  };
  readonly telegraphs: {
    readonly lunge: TelegraphParams;
    readonly harrier: TelegraphParams;
    readonly baiterFeint: TelegraphParams;
  };
  readonly perception: {
    readonly eyeHeightM: number;
    readonly targetChestHeightM: number;
    readonly sightRangeM: number;
    readonly sightHalfAngleDeg: number;
    readonly losEpsilonM: number;
    readonly hearingRadiusM: {
      readonly footstep: number;
      readonly attack: number;
      readonly howl: number;
    };
    readonly suspiciousTicks: number;
    readonly suspiciousToAlertTicks: number;
    readonly alertHoldTicks: number;
  };
  readonly roles: {
    readonly circleRadiusM: number;
    readonly lungeCommitRadiusM: number;
    readonly harrierFlankRadiusM: number;
    readonly feintInwardRadiusM: number;
    readonly feintIntervalTicks: number;
    readonly circleStepRadPerTick: number;
    readonly reengageRadiusM: number;
    readonly tokenScore: {
      readonly lungeRole: number;
      readonly harrierRole: number;
      readonly baiterRole: number;
      readonly angleWeight: number;
      readonly cooldownWeight: number;
    };
    readonly attackCooldownTicks: number;
    readonly aggression: {
      readonly circleShrinkPerTier: number;
      readonly minCircleRadiusM: number;
      readonly feintIntervalShrinkPerTier: number;
      readonly minFeintIntervalTicks: number;
    };
  };
  readonly speeds: {
    readonly stalkMps: number;
    readonly circleMps: number;
    readonly approachMps: number;
    readonly harrierMps: number;
    readonly fleeMps: number;
    readonly loiterMps: number;
  };
  readonly nav: {
    readonly arrivalRadiusM: number;
    readonly directSeekRadiusM: number;
    readonly avoidanceRadiusM: number;
    readonly avoidanceMaxMps: number;
    readonly slotInnerRadiusM: number;
    readonly slotOuterRadiusM: number;
    readonly loiterRadiusM: number;
    readonly loiterStepRadPerTick: number;
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const num = (record: Record<string, unknown>, key: string, path: string): number => {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`wolf_ai_params: ${path}.${key} must be a finite number`);
  }
  return value;
};

const int = (record: Record<string, unknown>, key: string, path: string): number => {
  const value = num(record, key, path);
  if (!Number.isSafeInteger(value)) {
    throw new Error(`wolf_ai_params: ${path}.${key} must be a safe integer`);
  }
  return value;
};

const req = (value: unknown, path: string): Record<string, unknown> => {
  if (!isRecord(value)) {
    throw new Error(`wolf_ai_params: ${path} must be an object`);
  }
  return value;
};

const telegraph = (value: unknown, path: string): TelegraphParams => {
  const record = req(value, path);
  return {
    startupTicks: int(record, "startupTicks", path),
    activeTicks: int(record, "activeTicks", path),
    recoveryTicks: int(record, "recoveryTicks", path),
  };
};

export const parseWolfAiParams = (raw: unknown): WolfAiParams => {
  const root = req(raw, "root");
  const wither = req(root.wither, "wither");
  if (wither.appliesWither !== false) {
    throw new Error("wolf_ai_params: wither.appliesWither must be false (zero Wither)");
  }

  const token = req(root.token, "token");
  const leash = req(root.leash, "leash");
  const flee = req(root.flee, "flee");
  const howl = req(root.howl, "howl");
  const telegraphs = req(root.telegraphs, "telegraphs");
  const perception = req(root.perception, "perception");
  const hearing = req(perception.hearingRadiusM, "perception.hearingRadiusM");
  const roles = req(root.roles, "roles");
  const tokenScore = req(roles.tokenScore, "roles.tokenScore");
  const aggression = req(roles.aggression, "roles.aggression");
  const speeds = req(root.speeds, "speeds");
  const nav = req(root.nav, "nav");

  if (root.version !== 1) {
    throw new Error(`wolf_ai_params: unsupported version ${String(root.version)}`);
  }

  return {
    version: 1,
    tickHz: int(root, "tickHz", "root"),
    wither: { appliesWither: false },
    token: {
      ringRadiusM: num(token, "ringRadiusM", "token"),
      releaseTicksAfterResolution: int(token, "releaseTicksAfterResolution", "token"),
    },
    leash: { radiusM: num(leash, "radiusM", "leash") },
    flee: {
      pulseRatio: num(flee, "pulseRatio", "flee"),
      returnTicks: int(flee, "returnTicks", "flee"),
    },
    howl: {
      aggressionDelta: int(howl, "aggressionDelta", "howl"),
      startupTicks: int(howl, "startupTicks", "howl"),
    },
    telegraphs: {
      lunge: telegraph(telegraphs.lunge, "telegraphs.lunge"),
      harrier: telegraph(telegraphs.harrier, "telegraphs.harrier"),
      baiterFeint: telegraph(telegraphs.baiterFeint, "telegraphs.baiterFeint"),
    },
    perception: {
      eyeHeightM: num(perception, "eyeHeightM", "perception"),
      targetChestHeightM: num(perception, "targetChestHeightM", "perception"),
      sightRangeM: num(perception, "sightRangeM", "perception"),
      sightHalfAngleDeg: num(perception, "sightHalfAngleDeg", "perception"),
      losEpsilonM: num(perception, "losEpsilonM", "perception"),
      hearingRadiusM: {
        footstep: num(hearing, "footstep", "perception.hearingRadiusM"),
        attack: num(hearing, "attack", "perception.hearingRadiusM"),
        howl: num(hearing, "howl", "perception.hearingRadiusM"),
      },
      suspiciousTicks: int(perception, "suspiciousTicks", "perception"),
      suspiciousToAlertTicks: int(perception, "suspiciousToAlertTicks", "perception"),
      alertHoldTicks: int(perception, "alertHoldTicks", "perception"),
    },
    roles: {
      circleRadiusM: num(roles, "circleRadiusM", "roles"),
      lungeCommitRadiusM: num(roles, "lungeCommitRadiusM", "roles"),
      harrierFlankRadiusM: num(roles, "harrierFlankRadiusM", "roles"),
      feintInwardRadiusM: num(roles, "feintInwardRadiusM", "roles"),
      feintIntervalTicks: int(roles, "feintIntervalTicks", "roles"),
      circleStepRadPerTick: num(roles, "circleStepRadPerTick", "roles"),
      reengageRadiusM: num(roles, "reengageRadiusM", "roles"),
      tokenScore: {
        lungeRole: int(tokenScore, "lungeRole", "roles.tokenScore"),
        harrierRole: int(tokenScore, "harrierRole", "roles.tokenScore"),
        baiterRole: int(tokenScore, "baiterRole", "roles.tokenScore"),
        angleWeight: int(tokenScore, "angleWeight", "roles.tokenScore"),
        cooldownWeight: int(tokenScore, "cooldownWeight", "roles.tokenScore"),
      },
      attackCooldownTicks: int(roles, "attackCooldownTicks", "roles"),
      aggression: {
        circleShrinkPerTier: num(aggression, "circleShrinkPerTier", "roles.aggression"),
        minCircleRadiusM: num(aggression, "minCircleRadiusM", "roles.aggression"),
        feintIntervalShrinkPerTier: int(
          aggression,
          "feintIntervalShrinkPerTier",
          "roles.aggression",
        ),
        minFeintIntervalTicks: int(aggression, "minFeintIntervalTicks", "roles.aggression"),
      },
    },
    speeds: {
      stalkMps: num(speeds, "stalkMps", "speeds"),
      circleMps: num(speeds, "circleMps", "speeds"),
      approachMps: num(speeds, "approachMps", "speeds"),
      harrierMps: num(speeds, "harrierMps", "speeds"),
      fleeMps: num(speeds, "fleeMps", "speeds"),
      loiterMps: num(speeds, "loiterMps", "speeds"),
    },
    nav: {
      arrivalRadiusM: num(nav, "arrivalRadiusM", "nav"),
      directSeekRadiusM: num(nav, "directSeekRadiusM", "nav"),
      avoidanceRadiusM: num(nav, "avoidanceRadiusM", "nav"),
      avoidanceMaxMps: num(nav, "avoidanceMaxMps", "nav"),
      slotInnerRadiusM: num(nav, "slotInnerRadiusM", "nav"),
      slotOuterRadiusM: num(nav, "slotOuterRadiusM", "nav"),
      loiterRadiusM: num(nav, "loiterRadiusM", "nav"),
      loiterStepRadPerTick: num(nav, "loiterStepRadPerTick", "nav"),
    },
  };
};

export const actionDurationTicks = (params: WolfAiParams, action: "lunge" | "flank_bite" | "feint" | "howl"): number => {
  if (action === "lunge") {
    const clip = params.telegraphs.lunge;
    return clip.startupTicks + clip.activeTicks + clip.recoveryTicks;
  }
  if (action === "flank_bite") {
    const clip = params.telegraphs.harrier;
    return clip.startupTicks + clip.activeTicks + clip.recoveryTicks;
  }
  if (action === "feint") {
    const clip = params.telegraphs.baiterFeint;
    return clip.startupTicks + clip.activeTicks + clip.recoveryTicks;
  }
  return params.howl.startupTicks;
};
