/**
 * Deterministic staged-scene host. Scenes are data scripts; this file is the
 * state machine. Interrupt policy is "none": nothing skips or aborts a beat.
 */

import { assertNoEngagement } from "./combat";
import type {
  ActiveScene,
  CombatEngagement,
  EnterContext,
  SceneCatalog,
  SceneEvent,
  ScenePresentation,
  SceneResult,
  SceneScript,
  SceneState,
  SceneStep,
  VerbEffect,
} from "./types";
import { SCENE_STATE_VERSION } from "./types";

const sortFlags = (flags: Readonly<Record<string, number>>): Readonly<Record<string, number>> =>
  Object.fromEntries(Object.keys(flags).sort().map((key) => [key, flags[key] ?? 0]));

const withFlags = (
  flags: Readonly<Record<string, number>>,
  patch: Readonly<Record<string, number>>,
): Readonly<Record<string, number>> => sortFlags({ ...flags, ...patch });

const addFlags = (
  flags: Readonly<Record<string, number>>,
  patch: Readonly<Record<string, number>>,
): Readonly<Record<string, number>> => {
  const next = { ...flags };
  for (const [key, delta] of Object.entries(patch)) {
    next[key] = (next[key] ?? 0) + delta;
  }
  return sortFlags(next);
};

const scriptOf = (catalog: SceneCatalog, id: string): SceneScript => {
  const script = catalog.scripts[id];
  if (script === undefined) {
    throw new Error(`unknown scene script "${id}"`);
  }
  return script;
};

const stepOf = (script: SceneScript, index: number): SceneStep => {
  const step = script.steps[index];
  if (step === undefined) {
    throw new Error(`scene "${script.id}" has no step ${index}`);
  }
  return step;
};

const remainingDoses = (state: SceneState, catalog: SceneCatalog): number => {
  const start = catalog.params.annaStartingDoses;
  const given = state.flags["anna.dosesAdministered"] ?? 0;
  return Math.max(0, start - given);
};

const itemText = (catalog: SceneCatalog, itemId: string | null): readonly string[] => {
  if (itemId === null) {
    return [];
  }
  return catalog.params.items[itemId]?.textKeys ?? [];
};

const hearthIdOf = (active: ActiveScene): string => active.hearthId ?? "cabin";

const expandOps = (
  state: SceneState,
  catalog: SceneCatalog,
  active: ActiveScene,
  effect: VerbEffect,
  events: SceneEvent[],
): { readonly flags: Readonly<Record<string, number>>; readonly textKeys: readonly string[] } => {
  let flags = state.flags;
  if (effect.flags !== undefined) {
    flags = withFlags(flags, effect.flags);
  }
  if (effect.addFlags !== undefined) {
    flags = addFlags(flags, effect.addFlags);
    if (effect.addFlags["anna.dosesAdministered"] !== undefined) {
      flags = withFlags(flags, {
        "anna.dosesRemaining": remainingDoses({ ...state, flags }, catalog),
      });
    }
  }
  const itemKeys = effect.textFromItem === true ? itemText(catalog, active.itemId) : [];
  const textKeys = [...(effect.textKeys ?? []), ...itemKeys];
  const tick = state.tick;
  for (const op of effect.events ?? []) {
    switch (op.type) {
      case "teach-flag":
        events.push({ type: "teach-flag", tick, flag: op.flag });
        break;
      case "notebook-line":
        events.push({ type: "notebook-line", tick, textKey: op.textKey });
        break;
      case "dose-prepared":
        events.push({ type: "dose-prepared", tick, remaining: remainingDoses({ ...state, flags }, catalog) });
        break;
      case "hud-border-wake":
        events.push({ type: "hud-border-wake", tick });
        break;
      case "hud-border-state":
        events.push({ type: "hud-border-state", tick, state: op.state });
        break;
      case "hearth-dim":
        events.push({
          type: "hearth-dim",
          tick,
          rampSteps: catalog.params.hearthDimRampSteps,
          percent: catalog.params.hearthDimPercent,
        });
        break;
      case "hearth-arrive":
        events.push({ type: "hearth-arrive", tick, hearthId: hearthIdOf(active) });
        break;
      case "hearth-rest-request":
        events.push({ type: "hearth-rest-request", tick, hearthId: hearthIdOf(active) });
        break;
      case "hearth-refill-request":
        events.push({ type: "hearth-refill-request", tick, hearthId: hearthIdOf(active) });
        break;
      case "hearth-respawn-request":
        events.push({ type: "hearth-respawn-request", tick, hearthId: hearthIdOf(active) });
        break;
      case "hearth-bank-request":
        events.push({ type: "hearth-bank-request", tick, hearthId: hearthIdOf(active) });
        break;
      case "hearth-level-request":
        events.push({ type: "hearth-level-request", tick, hearthId: hearthIdOf(active) });
        break;
      case "hearth-craft-request":
        events.push({ type: "hearth-craft-request", tick, hearthId: hearthIdOf(active) });
        break;
      case "hearth-leave":
        events.push({ type: "hearth-leave", tick, hearthId: hearthIdOf(active) });
        break;
      case "names-witness":
        events.push({ type: "names-witness", tick, kind: op.kind, sourceId: op.sourceId });
        break;
      case "vial-inherited":
        events.push({ type: "vial-inherited", tick, doses: remainingDoses({ ...state, flags }, catalog) });
        break;
      case "item-reveal-request":
        events.push({ type: "item-reveal-request", tick, itemId: op.itemId });
        break;
      case "item-revealed":
        events.push({
          type: "item-revealed",
          tick,
          itemId: active.itemId ?? "",
          textKeys: itemText(catalog, active.itemId),
        });
        break;
      case "ceremony-started":
        events.push({ type: "ceremony-started", tick, holdTicks: catalog.params.ceremonyHoldTicks });
        break;
      case "ceremony-ended":
        events.push({ type: "ceremony-ended", tick });
        break;
      case "invulnerable-hold":
        events.push({
          type: "invulnerable-hold",
          tick,
          ticks: catalog.params.ceremonyHoldTicks,
          dealsDamage: false,
        });
        break;
      case "turn-cleanse-request":
        events.push({ type: "turn-cleanse-request", tick });
        break;
      case "arena-hearth-light":
        events.push({ type: "arena-hearth-light", tick, hearthId: op.hearthId });
        break;
      case "unwritten-mark":
        events.push({ type: "unwritten-mark", tick, set: op.set !== 0 });
        break;
      case "caleb-misname":
        events.push({ type: "caleb-misname", tick, textKey: "npc.birdie.caleb_misname" });
        break;
      case "slice-exit":
        events.push({ type: "slice-exit", tick });
        break;
    }
  }
  return { flags, textKeys };
};

const availableVerbs = (step: SceneStep, applied: readonly string[]): readonly string[] => {
  const leftover = step.verbs.filter((verb) => !applied.includes(verb));
  if (step.verbOrder === "fixed") {
    const next = leftover[0];
    return next === undefined ? [] : [next];
  }
  return leftover;
};

const exitMet = (step: SceneStep, applied: readonly string[], ticksInStep: number): boolean => {
  if (step.exit.allVerbsApplied === true) {
    return step.verbs.every((verb) => applied.includes(verb));
  }
  if (step.exit.afterAnyVerb === true) {
    return applied.length > 0;
  }
  if (step.exit.afterTicks !== undefined) {
    return ticksInStep >= step.exit.afterTicks;
  }
  return false;
};

const holdCamera = (tick: number, anchorId: string | null, events: SceneEvent[]): void => {
  if (anchorId !== null) {
    events.push({ type: "camera-hold", tick, anchorId });
  }
};

const releaseCamera = (tick: number, anchorId: string | null, events: SceneEvent[]): void => {
  if (anchorId !== null) {
    events.push({ type: "camera-release", tick, anchorId });
  }
};

const openStep = (
  state: SceneState,
  catalog: SceneCatalog,
  script: SceneScript,
  stepIndex: number,
  base: Omit<ActiveScene, "stepIndex" | "ticksInStep" | "appliedVerbs" | "textKeys">,
  events: SceneEvent[],
): { readonly active: ActiveScene; readonly flags: Readonly<Record<string, number>> } => {
  const step = stepOf(script, stepIndex);
  events.push({ type: "scene-step", tick: state.tick, scriptId: script.id, stepId: step.id });
  holdCamera(state.tick, step.stagedAnchorId, events);
  const active: ActiveScene = {
    ...base,
    stepIndex,
    ticksInStep: 0,
    appliedVerbs: [],
    textKeys: [],
  };
  if (step.onEnter === undefined) {
    return { active, flags: state.flags };
  }
  const applied = expandOps(state, catalog, active, step.onEnter, events);
  return {
    active: { ...active, textKeys: applied.textKeys },
    flags: applied.flags,
  };
};

const closeScene = (
  state: SceneState,
  script: SceneScript,
  active: ActiveScene,
  flags: Readonly<Record<string, number>>,
  events: SceneEvent[],
): SceneState => {
  const step = stepOf(script, active.stepIndex);
  releaseCamera(state.tick, step.stagedAnchorId, events);
  events.push({ type: "scene-exited", tick: state.tick, scriptId: script.id });
  const completed = script.repeatable ? state.completed : [...state.completed, script.id];
  return {
    ...state,
    active: null,
    flags,
    completed,
  };
};

const advanceOrClose = (
  state: SceneState,
  catalog: SceneCatalog,
  script: SceneScript,
  active: ActiveScene,
  flags: Readonly<Record<string, number>>,
  events: SceneEvent[],
): SceneState => {
  const step = stepOf(script, active.stepIndex);
  if (!exitMet(step, active.appliedVerbs, active.ticksInStep)) {
    return { ...state, active, flags };
  }
  if (step.onExit !== undefined) {
    const applied = expandOps({ ...state, flags }, catalog, active, step.onExit, events);
    flags = applied.flags;
  }
  releaseCamera(state.tick, step.stagedAnchorId, events);
  const nextIndex = active.stepIndex + 1;
  if (nextIndex >= script.steps.length) {
    return closeScene(state, script, active, flags, events);
  }
  const opened = openStep(
    { ...state, flags },
    catalog,
    script,
    nextIndex,
    {
      scriptId: active.scriptId,
      ticksInScene: active.ticksInScene,
      itemId: active.itemId,
      hearthId: active.hearthId,
    },
    events,
  );
  return { ...state, active: opened.active, flags: opened.flags };
};

export const createSceneState = (catalog: SceneCatalog): SceneState => ({
  version: SCENE_STATE_VERSION,
  tick: 0,
  active: null,
  flags: sortFlags({
    "anna.dosesAdministered": 0,
    "anna.dosesRemaining": catalog.params.annaStartingDoses,
    "hud.unwrittenMark": 0,
    "hud.woken": 0,
    "slice.exit": 0,
    "ui.titleCard": 0,
  }),
  completed: [],
});

export const stepSceneClock = (state: SceneState): SceneState => ({
  ...state,
  tick: state.tick + 1,
});

export const tryEnterScene = (
  state: SceneState,
  scriptId: string,
  catalog: SceneCatalog,
  engagement: CombatEngagement,
  context: EnterContext = {},
): SceneResult => {
  assertNoEngagement(engagement, scriptId);
  const script = scriptOf(catalog, scriptId);
  if (state.active !== null) {
    return { state, events: [] };
  }
  if (!script.repeatable && state.completed.includes(scriptId)) {
    return { state, events: [] };
  }
  const events: SceneEvent[] = [];
  events.push({ type: "title-card", tick: state.tick, shown: false });
  const first = stepOf(script, 0);
  events.push({
    type: "scene-entered",
    tick: state.tick,
    scriptId,
    anchorId: first.stagedAnchorId,
  });
  const opened = openStep(
    state,
    catalog,
    script,
    0,
    {
      scriptId,
      ticksInScene: 0,
      itemId: context.itemId ?? null,
      hearthId: context.hearthId ?? (scriptId === "hearth_vigil" ? "cabin" : null),
    },
    events,
  );
  return { state: { ...state, active: opened.active, flags: opened.flags }, events };
};

export const applyVerb = (
  state: SceneState,
  verb: string,
  catalog: SceneCatalog,
): SceneResult => {
  const active = state.active;
  if (active === null) {
    return {
      state,
      events: [{ type: "verb-rejected", tick: state.tick, scriptId: "", verb, reason: "inactive" }],
    };
  }
  const script = scriptOf(catalog, active.scriptId);
  const step = stepOf(script, active.stepIndex);
  const events: SceneEvent[] = [];
  if (!step.verbs.includes(verb)) {
    events.push({
      type: "verb-rejected",
      tick: state.tick,
      scriptId: script.id,
      verb,
      reason: "unknown",
    });
    return { state, events };
  }
  if (active.appliedVerbs.includes(verb)) {
    events.push({
      type: "verb-rejected",
      tick: state.tick,
      scriptId: script.id,
      verb,
      reason: "already-applied",
    });
    return { state, events };
  }
  if (step.verbOrder === "fixed" && availableVerbs(step, active.appliedVerbs)[0] !== verb) {
    events.push({
      type: "verb-rejected",
      tick: state.tick,
      scriptId: script.id,
      verb,
      reason: "order",
    });
    return { state, events };
  }
  const effect = step.verbEffects[verb];
  if (effect === undefined) {
    events.push({
      type: "verb-rejected",
      tick: state.tick,
      scriptId: script.id,
      verb,
      reason: "unknown",
    });
    return { state, events };
  }
  const applied = expandOps(state, catalog, active, effect, events);
  const nextActive: ActiveScene = {
    ...active,
    appliedVerbs: [...active.appliedVerbs, verb],
    textKeys: applied.textKeys,
  };
  events.push({
    type: "verb-applied",
    tick: state.tick,
    scriptId: script.id,
    stepId: step.id,
    verb,
    textKeys: applied.textKeys,
  });
  const advanced = advanceOrClose(
    { ...state, flags: applied.flags },
    catalog,
    script,
    nextActive,
    applied.flags,
    events,
  );
  return { state: advanced, events };
};

/** Advance one tick. Timed holds (the 90t ceremony) exit here. */
export const stepScene = (state: SceneState, catalog: SceneCatalog): SceneResult => {
  const ticked = stepSceneClock(state);
  const active = ticked.active;
  if (active === null) {
    return { state: ticked, events: [] };
  }
  const script = scriptOf(catalog, active.scriptId);
  const nextActive: ActiveScene = {
    ...active,
    ticksInStep: active.ticksInStep + 1,
    ticksInScene: active.ticksInScene + 1,
  };
  const events: SceneEvent[] = [];
  const advanced = advanceOrClose(ticked, catalog, script, nextActive, ticked.flags, events);
  return { state: advanced, events };
};

export const presentScene = (state: SceneState, catalog: SceneCatalog): ScenePresentation => {
  const active = state.active;
  if (active === null) {
    return {
      scriptId: null,
      stepId: null,
      stagedAnchorId: null,
      propAnchorId: null,
      availableVerbs: [],
      textKeys: [],
      registerLocked: false,
      flags: state.flags,
      titleCard: false,
    };
  }
  const script = scriptOf(catalog, active.scriptId);
  const step = stepOf(script, active.stepIndex);
  return {
    scriptId: script.id,
    stepId: step.id,
    stagedAnchorId: step.stagedAnchorId,
    propAnchorId: step.propAnchorId ?? null,
    availableVerbs: availableVerbs(step, active.appliedVerbs),
    textKeys: active.textKeys,
    registerLocked: script.registerLocked,
    flags: state.flags,
    titleCard: false,
  };
};

export const isSceneActive = (state: SceneState): boolean => state.active !== null;

export const sceneTextKeys = (events: readonly SceneEvent[]): readonly string[] => {
  const keys: string[] = [];
  for (const event of events) {
    if (event.type === "verb-applied" || event.type === "item-revealed") {
      keys.push(...event.textKeys);
    }
    if (event.type === "notebook-line") {
      keys.push(event.textKey);
    }
    if (event.type === "caleb-misname") {
      keys.push(event.textKey);
    }
  }
  return keys;
};
