/**
 * The Open Page (D6, PRD R7, GATES F11).
 *
 * On death the unbanked Names fall where you fell — loose unwritten leaves, one
 * recovery. Any page still lying unrecovered when you die again is lost for good
 * ("lost to the spreadsheet"), and the new page takes its place. The page is
 * recorded at the exact death position, so F11's ≤0.5m requirement is 0m by
 * construction.
 *
 * Enemy respawn is a registry by enemy id: everything respawns at a Hearth rest
 * except ids listed as bosses, which are additionally held down by the arena's
 * terminal `victoryNoRespawn` phase.
 */

import { arenaOnDeath } from "./arena";
import { DEFAULT_META_PARAMS } from "./data";
import type { MetaEvent, MetaResult } from "./events";
import { clearEffects } from "./tincture";
import type { MetaParams, MetaState, WorldPosition } from "./types";

/** Respawn registry: bosses are the only ids that stay dead through a rest. */
export const respawnsOnRest = (
  enemyId: string,
  params: MetaParams = DEFAULT_META_PARAMS,
): boolean => !params.progression.respawn.bossEnemyIds.includes(enemyId);

export const isEnemyDefeated = (state: MetaState, enemyId: string): boolean =>
  state.defeated.includes(enemyId);

/** Record a kill. The list is kept sorted so save files stay byte-stable. */
export const markEnemyDefeated = (state: MetaState, enemyId: string): MetaState =>
  state.defeated.includes(enemyId)
    ? state
    : { ...state, defeated: [...state.defeated, enemyId].sort() };

/** Hearth rest returns the standard enemies; bosses stay where they fell. */
export const respawnEnemies = (
  state: MetaState,
  params: MetaParams = DEFAULT_META_PARAMS,
): MetaState => {
  const held = state.defeated.filter((id) => !respawnsOnRest(id, params));
  return held.length === state.defeated.length ? state : { ...state, defeated: held };
};

/** Death: drop the page, lose any page still owed to you, reset the arena. */
export const recordDeath = (state: MetaState, position: WorldPosition): MetaResult => {
  const events: MetaEvent[] = [{ type: "death", tick: state.tick, position }];

  if (state.openPage !== null) {
    events.push({ type: "page-lost", tick: state.tick, names: state.openPage.names });
  }

  const carried = state.names.carried;
  const openPage =
    carried > 0 ? { names: carried, position, droppedAtTick: state.tick } : null;
  if (openPage !== null) {
    events.push({ type: "page-dropped", tick: state.tick, names: carried, position });
  }

  const next: MetaState = {
    ...arenaOnDeath(clearEffects(state)),
    life: "dead",
    pending: null,
    atHearth: false,
    openPage,
    names: { ...state.names, carried: 0 },
  };

  if (carried > 0) {
    events.push({
      type: "names-changed",
      tick: next.tick,
      delta: -carried,
      carried: 0,
      banked: next.names.banked,
    });
  }

  return { state: next, events };
};

const withinReach = (a: WorldPosition, b: WorldPosition, radiusM: number): boolean => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz <= radiusM * radiusM;
};

/** The one recovery. Restores every Name on the page, then the page is gone. */
export const recoverOpenPage = (
  state: MetaState,
  position: WorldPosition,
  params: MetaParams = DEFAULT_META_PARAMS,
): MetaResult => {
  const page = state.openPage;
  if (page === null || !withinReach(position, page.position, params.progression.openPage.recoveryRadiusM)) {
    return { state, events: [] };
  }

  const next: MetaState = {
    ...state,
    openPage: null,
    names: { ...state.names, carried: state.names.carried + page.names },
  };

  return {
    state: next,
    events: [
      { type: "page-recovered", tick: next.tick, names: page.names },
      {
        type: "names-changed",
        tick: next.tick,
        delta: page.names,
        carried: next.names.carried,
        banked: next.names.banked,
      },
    ],
  };
};
