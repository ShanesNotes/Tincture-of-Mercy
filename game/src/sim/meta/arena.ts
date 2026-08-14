/**
 * Boss-arena run state (slice contract deliverable 6, PRD R7).
 *
 *   outside ──enter──▶ entered ──engage──▶ inFight ──defeated──▶ victoryNoRespawn
 *                        ▲                    │                       (terminal)
 *                        └──── quitOut ───────┤
 *                                             │
 *                        deathReset ◀──death──┘        deathReset ──respawn──▶ outside
 *
 * Victory is terminal: the Warden never respawns, whatever the enemy-respawn
 * registry says. A mid-fight quit-out rewinds to `entered` — the player is back
 * inside the ring with the fight un-started, never mid-swing.
 */

import type { ArenaPhase, MetaState } from "./types";

const withArena = (state: MetaState, arena: ArenaPhase): MetaState =>
  state.arena === arena ? state : { ...state, arena };

/** Crossing into the ring. Victory is terminal and absorbs re-entry. */
export const enterArena = (state: MetaState): MetaState =>
  state.arena === "outside" ? withArena(state, "entered") : state;

export const engageBoss = (state: MetaState): MetaState =>
  state.arena === "entered" ? withArena(state, "inFight") : state;

export const bossDefeated = (state: MetaState): MetaState =>
  state.arena === "inFight" ? withArena(state, "victoryNoRespawn") : state;

/** Quitting out mid-fight resets the encounter to the moment of entry. */
export const quitOutOfArena = (state: MetaState): MetaState =>
  state.arena === "inFight" ? withArena(state, "entered") : state;

/** Dying anywhere inside the ring resets the encounter. */
export const arenaOnDeath = (state: MetaState): MetaState =>
  state.arena === "entered" || state.arena === "inFight"
    ? withArena(state, "deathReset")
    : state;

/** Respawning at the Hearth clears the reset marker and closes the gate again. */
export const arenaOnRespawn = (state: MetaState): MetaState =>
  state.arena === "deathReset" ? withArena(state, "outside") : state;

/** The boss is dead for good — used to exclude it from Hearth-rest respawns. */
export const bossIsDown = (state: MetaState): boolean => state.arena === "victoryNoRespawn";
