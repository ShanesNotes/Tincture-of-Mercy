/**
 * Compiles `src/data/warden_params.json` against the shared frame-data table
 * (`src/data/frame_data.json`). Both arrive as `unknown` so the sim runtime
 * stays dependency-zero; the caller owns file IO.
 *
 * Every gameplay number the Warden uses is read from data (W1-SHARED rule 5).
 * Cross-validation is the point of this file: a Warden row whose authored
 * table segments disagree with the frame-data clip fails the build.
 */

import type {
  WardenClip,
  WardenClipWindow,
  WardenGateShortfall,
  WardenMoveParams,
  WardenParams,
  WardenPhase,
  WardenPhaseParams,
  WardenStance,
  WardenTellClass,
} from "./types";

const TELL_CLASSES: readonly WardenTellClass[] = [
  "opener",
  "heavy",
  "close_poke",
  "bait",
  "stillness",
];

const PHASES: readonly WardenPhase[] = ["p1", "p2"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const fail = (path: string, message: string): never => {
  throw new Error(`warden_params: ${path} ${message}`);
};

const rec = (value: unknown, path: string): Record<string, unknown> =>
  isRecord(value) ? value : fail(path, "must be an object");

const arr = (value: unknown, path: string): readonly unknown[] =>
  Array.isArray(value) ? value : fail(path, "must be an array");

const num = (record: Record<string, unknown>, key: string, path: string): number => {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fail(`${path}.${key}`, "must be a finite number");
};

const int = (record: Record<string, unknown>, key: string, path: string): number => {
  const value = num(record, key, path);
  return Number.isSafeInteger(value) ? value : fail(`${path}.${key}`, "must be a safe integer");
};

const str = (record: Record<string, unknown>, key: string, path: string): string => {
  const value = record[key];
  return typeof value === "string" && value.length > 0
    ? value
    : fail(`${path}.${key}`, "must be a non-empty string");
};

const bool = (record: Record<string, unknown>, key: string, path: string): boolean => {
  const value = record[key];
  return typeof value === "boolean" ? value : fail(`${path}.${key}`, "must be a boolean");
};

const windowsOf = (value: unknown, path: string): readonly WardenClipWindow[] =>
  arr(value, path).map((entry, index) => {
    const pair = arr(entry, `${path}[${String(index)}]`);
    const start = pair[0];
    const end = pair[1];
    if (
      typeof start !== "number" ||
      typeof end !== "number" ||
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(end) ||
      end <= start
    ) {
      return fail(`${path}[${String(index)}]`, "must be an ordered half-open tick window");
    }
    return { startTick: start, endTickExclusive: end };
  });

const trackingUntilOf = (move: Record<string, unknown>, path: string): number | null => {
  const value = move.trackingUntilTick;
  if (value === null) return null;
  return typeof value === "number" && Number.isSafeInteger(value)
    ? value
    : fail(`${path}.trackingUntilTick`, "must be null or a safe integer");
};

const clipOf = (
  rawFrameData: Record<string, unknown>,
  moveId: string,
  contactTicksPerWindow: number | null,
): WardenClip => {
  const moves = rec(rawFrameData.moves, "$.frameData.moves");
  const path = `$.frameData.moves.${moveId}`;
  const move = rec(moves[moveId], path);
  const activeWindows = windowsOf(move.activeWindows, `${path}.activeWindows`);
  const first = activeWindows[0];
  if (first === undefined) {
    return fail(path, "must author at least one active window to be selectable");
  }
  const contactWindows = activeWindows.map((window) => {
    if (contactTicksPerWindow === null) {
      return window;
    }
    const endTickExclusive = window.startTick + contactTicksPerWindow;
    if (endTickExclusive > window.endTickExclusive) {
      return fail(path, "contactTicksPerWindow must not exceed the authored active window");
    }
    return { startTick: window.startTick, endTickExclusive };
  });
  return {
    moveId,
    actorClass: str(move, "actorClass", path),
    startupTicks: int(move, "startupTicks", path),
    activeTicks: int(move, "activeTicks", path),
    recoveryTicks: int(move, "recoveryTicks", path),
    totalTicks: int(move, "totalTicks", path),
    activeWindows,
    contactWindows,
    trackingUntilTick: trackingUntilOf(move, path),
    trackingWindows: windowsOf(move.trackingWindows, `${path}.trackingWindows`),
    turnRateRadiansPerTick: num(move, "turnRateRadiansPerTick", path),
    poiseDamage: num(move, "poiseDamage", path),
    pulseDamage: num(move, "pulseDamage", path),
    witherBuildup: num(move, "witherBuildup", path),
    damageType: str(move, "damageType", path),
    hitstopClass: str(move, "hitstopClass", path),
    tellTicks: first.startTick,
  };
};

/** The bait row has no active window; it is a posture, not a swing. */
const baitClipOf = (rawFrameData: Record<string, unknown>, moveId: string): WardenClip => {
  const moves = rec(rawFrameData.moves, "$.frameData.moves");
  const path = `$.frameData.moves.${moveId}`;
  const move = rec(moves[moveId], path);
  const startupTicks = int(move, "startupTicks", path);
  return {
    moveId,
    actorClass: str(move, "actorClass", path),
    startupTicks,
    activeTicks: int(move, "activeTicks", path),
    recoveryTicks: int(move, "recoveryTicks", path),
    totalTicks: int(move, "totalTicks", path),
    activeWindows: [],
    contactWindows: [],
    trackingUntilTick: trackingUntilOf(move, path),
    trackingWindows: windowsOf(move.trackingWindows, `${path}.trackingWindows`),
    turnRateRadiansPerTick: num(move, "turnRateRadiansPerTick", path),
    poiseDamage: num(move, "poiseDamage", path),
    pulseDamage: num(move, "pulseDamage", path),
    witherBuildup: num(move, "witherBuildup", path),
    damageType: str(move, "damageType", path),
    hitstopClass: str(move, "hitstopClass", path),
    tellTicks: startupTicks,
  };
};

const assertSegmentsMatchClip = (
  segments: readonly number[],
  clip: WardenClip,
  path: string,
): void => {
  if (segments.length === 0) {
    fail(`${path}.tableSegments`, "must carry the TUNING_V0 startup segments");
  }
  if (clip.activeWindows.length === 0) {
    const only = segments[0];
    if (segments.length !== 1 || only !== clip.startupTicks) {
      fail(`${path}.tableSegments`, "must equal the authored startup for a no-active move");
    }
    return;
  }
  if (segments.length !== clip.activeWindows.length) {
    fail(`${path}.tableSegments`, "must carry one startup segment per authored active window");
  }
  let cursor = 0;
  for (const [index, segment] of segments.entries()) {
    const window = clip.activeWindows[index];
    if (window === undefined) {
      fail(`${path}.tableSegments[${String(index)}]`, "has no matching active window");
      return;
    }
    if (cursor + segment !== window.startTick) {
      fail(
        `${path}.tableSegments[${String(index)}]`,
        `must place the active window at ${String(cursor + segment)}, table says ${String(window.startTick)}`,
      );
    }
    cursor = window.endTickExclusive;
  }
};

const moveOf = (
  value: unknown,
  path: string,
  rawFrameData: Record<string, unknown>,
  actorClass: string,
): WardenMoveParams => {
  const record = rec(value, path);
  const moveId = str(record, "moveId", path);
  const tellClassRaw = str(record, "tellClass", path);
  if (!TELL_CLASSES.includes(tellClassRaw as WardenTellClass)) {
    fail(`${path}.tellClass`, `must be one of ${TELL_CLASSES.join(", ")}`);
  }
  const tellClass = tellClassRaw as WardenTellClass;
  const contactRaw = record.contactTicksPerWindow;
  const contactTicksPerWindow =
    contactRaw === null
      ? null
      : typeof contactRaw === "number" && Number.isSafeInteger(contactRaw) && contactRaw > 0
        ? contactRaw
        : fail(`${path}.contactTicksPerWindow`, "must be null or a positive safe integer");
  const clip =
    tellClass === "bait"
      ? baitClipOf(rawFrameData, moveId)
      : clipOf(rawFrameData, moveId, contactTicksPerWindow);
  if (clip.actorClass !== actorClass) {
    fail(`${path}.moveId`, `must belong to actor class ${actorClass}`);
  }
  const segments = arr(record.tableSegments, `${path}.tableSegments`).map((entry, index) =>
    typeof entry === "number" && Number.isSafeInteger(entry) && entry > 0
      ? entry
      : fail(`${path}.tableSegments[${String(index)}]`, "must be a positive safe integer"),
  );
  assertSegmentsMatchClip(segments, clip, path);
  const stanceRaw = record.requiresStance;
  const requiresStance =
    stanceRaw === null
      ? null
      : stanceRaw === "closed" || stanceRaw === "stepped_back"
        ? (stanceRaw as WardenStance)
        : fail(`${path}.requiresStance`, "must be null, \"closed\", or \"stepped_back\"");
  const minRangeMeters = num(record, "minRangeMeters", path);
  const maxRangeMeters = num(record, "maxRangeMeters", path);
  if (maxRangeMeters <= minRangeMeters) {
    fail(`${path}.maxRangeMeters`, "must exceed minRangeMeters");
  }
  return {
    moveId,
    tellClass,
    tableSegments: segments,
    tablePunish: str(record, "tablePunish", path),
    punishLights: int(record, "punishLights", path),
    contactTicksPerWindow,
    weight: int(record, "weight", path),
    cooldownTicks: int(record, "cooldownTicks", path),
    minRangeMeters,
    maxRangeMeters,
    requiresStance,
    requiresRingHug: bool(record, "requiresRingHug", path),
    clip,
  };
};

const phaseOf = (
  value: unknown,
  path: string,
  rawFrameData: Record<string, unknown>,
): WardenPhaseParams => {
  const record = rec(value, path);
  const actorClass = str(record, "actorClass", path);
  const moves = arr(record.moves, `${path}.moves`).map((entry, index) =>
    moveOf(entry, `${path}.moves[${String(index)}]`, rawFrameData, actorClass),
  );
  if (moves.length === 0) {
    fail(`${path}.moves`, "must author at least one move");
  }
  const ids = new Set(moves.map((move) => move.moveId));
  if (ids.size !== moves.length) {
    fail(`${path}.moves`, "must not repeat a move id");
  }
  return {
    actorClass,
    steadyClass: str(record, "steadyClass", path),
    witherPerHit: num(record, "witherPerHit", path),
    moves,
  };
};

const shortfallOf = (value: unknown, path: string): WardenGateShortfall => {
  const record = rec(value, path);
  return {
    moveId: str(record, "moveId", path),
    gate: str(record, "gate", path),
    tellTicks: int(record, "tellTicks", path),
    requiredTicks: int(record, "requiredTicks", path),
    note: str(record, "note", path),
  };
};

export const parseWardenParams = (raw: unknown, rawFrameData: unknown): WardenParams => {
  const root = rec(raw, "$");
  const frameData = rec(rawFrameData, "$.frameData");
  if (root.version !== 1) {
    fail("$.version", "must be 1");
  }
  const tickHz = int(root, "tickHz", "$");
  if (tickHz !== int(frameData, "tickHz", "$.frameData")) {
    fail("$.tickHz", "must match the frame-data tick rate");
  }

  const ceremonyRaw = rec(root.ceremony, "$.ceremony");
  const ceremonyMoveId = str(ceremonyRaw, "moveId", "$.ceremony");
  const ceremonyClip = rec(
    rec(frameData.moves, "$.frameData.moves")[ceremonyMoveId],
    `$.frameData.moves.${ceremonyMoveId}`,
  );
  const holdTicks = int(ceremonyRaw, "holdTicks", "$.ceremony");
  if (holdTicks !== int(ceremonyClip, "totalTicks", `$.frameData.moves.${ceremonyMoveId}`)) {
    fail("$.ceremony.holdTicks", "must equal the ceremony clip length");
  }
  if (num(ceremonyClip, "pulseDamage", `$.frameData.moves.${ceremonyMoveId}`) !== 0) {
    fail("$.ceremony", "ceremony clip must deal zero damage");
  }
  if (!bool(ceremonyRaw, "invulnerable", "$.ceremony")) {
    fail("$.ceremony.invulnerable", "must be true — TUNING_V0 makes the ceremony invulnerable");
  }
  if (bool(ceremonyRaw, "dealsDamage", "$.ceremony")) {
    fail("$.ceremony.dealsDamage", "must be false — the ceremony is not a cheap hit");
  }

  const ringRaw = rec(root.ring, "$.ring");
  const leashRaw = rec(root.leash, "$.leash");
  if (leashRaw.mode !== "arena_bounds") {
    fail("$.leash.mode", "must be \"arena_bounds\" — ENCOUNTERS binds the leash to the ring");
  }
  const quietRaw = rec(root.quiet, "$.quiet");
  const quietMoveId = str(quietRaw, "moveId", "$.quiet");
  const quietClip = rec(
    rec(frameData.moves, "$.frameData.moves")[quietMoveId],
    `$.frameData.moves.${quietMoveId}`,
  );
  if (num(quietClip, "pulseDamage", `$.frameData.moves.${quietMoveId}`) !== 0) {
    fail("$.quiet", "the quiet must deal zero Pulse damage");
  }
  if (
    num(quietRaw, "witherAmount", "$.quiet") !==
    num(quietClip, "witherBuildup", `$.frameData.moves.${quietMoveId}`)
  ) {
    fail("$.quiet.witherAmount", "must equal the clip's authored Wither buildup");
  }

  const selectionRaw = rec(root.selection, "$.selection");
  const motionRaw = rec(root.motion, "$.motion");
  const gatesRaw = rec(root.gates, "$.gates");
  const aftermathRaw = rec(root.aftermath, "$.aftermath");
  if (aftermathRaw.titleCard !== false) {
    fail("$.aftermath.titleCard", "must be false — the UI never names him");
  }
  const tagTextKeys = arr(aftermathRaw.tagTextKeys, "$.aftermath.tagTextKeys").map(
    (entry, index) =>
      typeof entry === "string" && /^[a-z][a-z0-9_.]*$/.test(entry)
        ? entry
        : fail(
            `$.aftermath.tagTextKeys[${String(index)}]`,
            "must be a lowercase dotted text-bible key, never a display name",
          ),
  );
  if (tagTextKeys.length === 0) {
    fail("$.aftermath.tagTextKeys", "must reference the tag text keys");
  }

  const phasesRaw = rec(root.phases, "$.phases");
  const phases = {} as Record<WardenPhase, WardenPhaseParams>;
  for (const phase of PHASES) {
    phases[phase] = phaseOf(phasesRaw[phase], `$.phases.${phase}`, frameData);
  }
  const quietMoves = phases.p2.moves.filter((move) => move.moveId === quietMoveId);
  if (quietMoves.length !== 1) {
    fail("$.phases.p2.moves", "the quiet is a Phase 2 move and must appear exactly once there");
  }
  if (phases.p1.moves.some((move) => move.moveId === quietMoveId)) {
    fail("$.phases.p1.moves", "the quiet must never be selectable in Phase 1");
  }
  const baits = [...phases.p1.moves, ...phases.p2.moves].filter(
    (move) => move.tellClass === "bait",
  );
  for (const bait of baits) {
    if (bait.requiresStance !== "stepped_back") {
      fail(`$.phases.*.moves.${bait.moveId}`, "the bait is only reachable from the step-back stance");
    }
  }

  return {
    version: 1,
    tickHz,
    ceremony: {
      pulsePercent: num(ceremonyRaw, "pulsePercent", "$.ceremony"),
      holdTicks,
      invulnerable: true,
      dealsDamage: false,
      moveId: ceremonyMoveId,
      cameraAnchorId: str(ceremonyRaw, "cameraAnchorId", "$.ceremony"),
      lanternHangAnchorId: str(ceremonyRaw, "lanternHangAnchorId", "$.ceremony"),
    },
    ring: {
      sourcePlacementKey: str(ringRaw, "sourcePlacementKey", "$.ring"),
      zone: str(ringRaw, "zone", "$.ring"),
      rootTicks: int(ringRaw, "rootTicks", "$.ring"),
      chimeOnContact: bool(ringRaw, "chimeOnContact", "$.ring"),
      contactBandMeters: num(ringRaw, "contactBandMeters", "$.ring"),
      hugBandMeters: num(ringRaw, "hugBandMeters", "$.ring"),
      radiusToleranceMeters: num(ringRaw, "radiusToleranceMeters", "$.ring"),
      wardenPassesThrough: bool(ringRaw, "wardenPassesThrough", "$.ring"),
      chargeEndsAtRing: bool(ringRaw, "chargeEndsAtRing", "$.ring"),
    },
    leash: { mode: "arena_bounds", marginMeters: num(leashRaw, "marginMeters", "$.leash") },
    quiet: {
      moveId: quietMoveId,
      witherAmount: num(quietRaw, "witherAmount", "$.quiet"),
      radiusMeters: num(quietRaw, "radiusMeters", "$.quiet"),
      pulseDamage: num(quietRaw, "pulseDamage", "$.quiet"),
      stillnessTellTicks: int(quietRaw, "stillnessTellTicks", "$.quiet"),
    },
    selection: {
      sameMoveMaxConsecutive: int(selectionRaw, "sameMoveMaxConsecutive", "$.selection"),
      engageRangeMeters: num(selectionRaw, "engageRangeMeters", "$.selection"),
      preferredRangeMeters: num(selectionRaw, "preferredRangeMeters", "$.selection"),
      stepBackRangeMeters: num(selectionRaw, "stepBackRangeMeters", "$.selection"),
      neutralCooldownTicks: int(selectionRaw, "neutralCooldownTicks", "$.selection"),
      cooldownScoreCapTicks: int(selectionRaw, "cooldownScoreCapTicks", "$.selection"),
      weightScoreScale: int(selectionRaw, "weightScoreScale", "$.selection"),
    },
    motion: {
      approachMetersPerTick: num(motionRaw, "approachMetersPerTick", "$.motion"),
      stepBackMetersPerTick: num(motionRaw, "stepBackMetersPerTick", "$.motion"),
      chargeMetersPerTick: num(motionRaw, "chargeMetersPerTick", "$.motion"),
      leashReturnMetersPerTick: num(motionRaw, "leashReturnMetersPerTick", "$.motion"),
    },
    gates: {
      openerMinStartupTicks: int(gatesRaw, "openerMinStartupTicks", "$.gates"),
      heavyTellMinStartupTicks: int(gatesRaw, "heavyTellMinStartupTicks", "$.gates"),
      stillnessTellMinTicks: int(gatesRaw, "stillnessTellMinTicks", "$.gates"),
      minPunishableRecoveryTicks: int(gatesRaw, "minPunishableRecoveryTicks", "$.gates"),
      dodgeToleranceTicks: int(gatesRaw, "dodgeToleranceTicks", "$.gates"),
      knownShortfalls: arr(gatesRaw.knownShortfalls, "$.gates.knownShortfalls").map(
        (entry, index) => shortfallOf(entry, `$.gates.knownShortfalls[${String(index)}]`),
      ),
    },
    aftermath: {
      tagItemId: str(aftermathRaw, "tagItemId", "$.aftermath"),
      tagTextKeys,
      titleCard: false,
    },
    phases,
  };
};

export const wardenMove = (
  params: WardenParams,
  phase: WardenPhase,
  moveId: string,
): WardenMoveParams => {
  const move = params.phases[phase].moves.find((entry) => entry.moveId === moveId);
  if (move === undefined) {
    throw new Error(`warden_params: ${moveId} is not a ${phase} move`);
  }
  return move;
};

export const allWardenMoves = (params: WardenParams): readonly WardenMoveParams[] => [
  ...params.phases.p1.moves,
  ...params.phases.p2.moves,
];
