/**
 * s19 — the staged scenes, bound into the world.
 *
 * s25 authored the scripts and the verb machine but owns no trigger and no
 * consequence: entering a scene and paying out what its verbs promise are both
 * composition's job. This file is that job, and nothing else.
 *
 * Triggers are places, not cutscene calls. The prologue is where you wake, the
 * gravity encounter is the cabin you come back to, the coda is the bend in the
 * road past a dead Warden. Each one is guarded by engagement, so no staged
 * frame can open while something is trying to kill you (D2).
 */

import {
  awardNames,
  inheritAnnaSupply,
  spendAnnaDose,
  type MetaEvent,
  type MetaParams,
  type MetaState,
} from "../meta";
import { presentScene, type SceneCatalog, type SceneEvent, type SceneState } from "../scenes";
import type { WorldDefinition, WorldState } from "./types";

export interface WorldSceneContext {
  readonly zoneId: string | null;
  readonly engaged: boolean;
}

/**
 * The one scene the world wants open right now, or null.
 *
 * Never returns a completed or already-active script, so the caller can call
 * `tryEnterScene` unconditionally on the result.
 */
export const sceneToEnter = (
  state: WorldState,
  definition: WorldDefinition,
  context: WorldSceneContext,
): string | null => {
  if (state.scenes.active !== null) return null;
  const done = (scriptId: string): boolean => state.scenes.completed.includes(scriptId);

  // The prologue is the room you wake in, not a cutscene call.
  if (!done(definition.startupScene) && context.zoneId === "CABIN") return definition.startupScene;

  // Anna's gravity is a D2 no-damage hold (ENCOUNTERS staged-scene carve-out).
  // Yard alert must not lock the cabin you came back to.
  if (
    !done("anna_gravity") &&
    done(definition.startupScene) &&
    state.leftStartZone &&
    context.zoneId === "CABIN" &&
    (state.scenes.flags["taught.flask"] ?? 0) > 0
  ) {
    return "anna_gravity";
  }

  if (context.engaged) return null;

  // The coda is the ROAD_CODA threshold, and only past a Warden who stays down.
  if (
    !done("birdie_coda") &&
    context.zoneId === "ROAD_CODA" &&
    state.meta.arena === "victoryNoRespawn"
  ) {
    return "birdie_coda";
  }
  return null;
};

/**
 * While a staged scene holds the frame, `interact` is the scene's verb.
 *
 * Scripts declare their own order (fixed / free / choice); the presentation
 * already filters to what is legal right now, so the first available verb is
 * always a legal one. A `choice` step needs a real decision, so it is left to
 * the explicit verb seam rather than being resolved by a keypress.
 */
export const interactVerb = (
  scenes: SceneState,
  catalog: SceneCatalog,
): string | null => {
  const presentation = presentScene(scenes, catalog);
  if (presentation.scriptId === null) return null;
  const step = catalog.scripts[presentation.scriptId]?.steps[scenes.active?.stepIndex ?? 0];
  if (step?.verbOrder === "choice") return null;
  return presentation.availableVerbs[0] ?? null;
};

export interface SceneEffects {
  readonly meta: MetaState;
  readonly arenaHearthLit: boolean;
  readonly cleanseTurn: boolean;
  readonly metaEvents: readonly MetaEvent[];
}

/**
 * Pay out what the verbs promised. Everything here is a real mercy-loop
 * consequence the scripts declare and s25 deliberately does not apply.
 */
export const applySceneEffects = (
  events: readonly SceneEvent[],
  meta: MetaState,
  params: MetaParams,
  arenaHearthLit: boolean,
): SceneEffects => {
  let next = meta;
  let lit = arenaHearthLit;
  let cleanseTurn = false;
  const metaEvents: MetaEvent[] = [];
  for (const event of events) {
    switch (event.type) {
      case "names-witness": {
        const award = awardNames(next, event.kind, event.sourceId, params);
        next = award.state;
        metaEvents.push(...award.events);
        break;
      }
      case "dose-prepared": {
        next = spendAnnaDose(next);
        break;
      }
      case "vial-inherited": {
        // Borrowed mercy: remaining chest only. Dosing her twice leaves less.
        next = inheritAnnaSupply(next, { doses: event.doses, ember: next.annaSupply.ember });
        break;
      }
      case "turn-cleanse-request": {
        cleanseTurn = true;
        break;
      }
      case "arena-hearth-light": {
        lit = true;
        break;
      }
      default: {
        break;
      }
    }
  }
  return { meta: next, arenaHearthLit: lit, cleanseTurn, metaEvents };
};
