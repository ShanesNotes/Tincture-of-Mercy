/**
 * SIM → HUD binder (slice s19). Pure and headless: it projects one
 * {@link WorldDebugSnapshot} into the {@link HudInput} DTO so the manuscript
 * border renders world truth instead of fixtures. Every quantization, clamp
 * and tally stays in `model.ts`; this file only reads and names.
 */

import { isRegisterLockedScript } from "../../sim/scenes";
import type {
  WorldDebugActor,
  WorldDebugBoss,
  WorldDebugSnapshot,
} from "../../sim/world/types";
import type { BossPhase, HearthVerdict, HudInput, ZoneCharacter } from "./types";

/** HB2: the cabin is the only domestic zone; every other baked box, and none, is wild. */
const DOMESTIC_ZONE_ID = "CABIN";

/** Kind is the truth; the id is only a hint for snapshots that carry no flagged player. */
const findPlayer = (
  snapshot: WorldDebugSnapshot,
  playerId: string | null,
): WorldDebugActor | undefined =>
  snapshot.actors.find((actor) => actor.kind === "player") ??
  snapshot.actors.find((actor) => actor.id === playerId);

const bossPhaseFor = (boss: WorldDebugBoss): BossPhase => {
  // `ceremonyActive` and `defeated` both read the same fsm and cannot both hold;
  // the order below is a guard for malformed snapshots, not a gameplay rule.
  if (!boss.present || boss.arena === "outside" || boss.defeated) {
    return "none";
  }
  if (boss.ceremonyActive) {
    return "ceremony";
  }
  if (boss.phase === "p1") {
    return "phase1";
  }
  if (boss.phase === "p2") {
    return "phase2";
  }
  return "none";
};

const hearthVerdictFor = (lit: boolean): HearthVerdict => (lit ? "lit" : "unlit");

const zoneFor = (zoneId: string | null): ZoneCharacter =>
  zoneId === DOMESTIC_ZONE_ID ? "domestic" : "wild";

/**
 * The two border states no snapshot can carry: both are one-way latches over
 * the event stream (`page-lost`, `hud-border-wake`), so the app owns them and
 * hands them in. A snapshot-only projection cannot see either — that is what
 * left both signals emitted and consumed by nothing.
 */
export interface HudLatches {
  readonly pageLost: boolean;
  readonly woken: boolean;
}

export const hudInputFromWorld = (
  snapshot: WorldDebugSnapshot,
  playerId: string,
  latches: HudLatches = { pageLost: false, woken: true },
): HudInput => {
  const player = findPlayer(snapshot, playerId);
  const { meta, scenes } = snapshot;
  const activeId = scenes.activeId;
  return {
    pageLost: latches.pageLost,
    woken: latches.woken,
    pulse: player?.pulse ?? 0,
    maxPulse: meta.maxPulse,
    breath: player?.breath ?? 0,
    maxBreath: meta.maxBreath,
    doses: meta.doses,
    maxDoses: meta.maxDoses,
    namesCarried: meta.carriedNames,
    turn: meta.turn,
    turnCap: meta.turnCap,
    hearth: hearthVerdictFor(snapshot.hearth.lit),
    bossPhase: bossPhaseFor(snapshot.boss),
    unwrittenTag: scenes.unwrittenTag,
    numbnessStacks: meta.numbnessStacks,
    vigilRestore: meta.vigilRestore,
    registerLocked: activeId !== null && isRegisterLockedScript(activeId),
    zone: zoneFor(snapshot.zoneId),
  };
};

export type HudMenuKind = "none" | "death" | "hearth" | "pause";

/** Which menu the app layer should hold open. Death outranks pause outranks the Hearth. */
export const hudMenuForWorld = (snapshot: WorldDebugSnapshot, paused: boolean): HudMenuKind => {
  const player = findPlayer(snapshot, null);
  if (snapshot.meta.life === "dead" || player?.alive === false) {
    return "death";
  }
  if (paused) {
    return "pause";
  }
  if (snapshot.hearth.nearbyId !== null) {
    return "hearth";
  }
  return "none";
};
