/**
 * Scene-script schema. Parses `src/data/scene_scripts.json` at the composition
 * boundary (sim runtime cannot import that file).
 */

import type {
  InterruptPolicy,
  ItemTextBinding,
  SceneCatalog,
  SceneExit,
  SceneOpEvent,
  SceneParams,
  SceneScript,
  SceneStep,
  SevenSlotComposition,
  VerbEffect,
  VerbOrder,
} from "./types";

const COMPOSITION_SLOTS = [
  "field",
  "axis",
  "threshold",
  "witness",
  "light",
  "memory",
  "border",
] as const;

const INTERRUPTS = new Set<InterruptPolicy>(["none"]);
const ORDERS = new Set<VerbOrder>(["fixed", "free", "choice"]);
const OP_TYPES = new Set<SceneOpEvent["type"]>([
  "teach-flag",
  "notebook-line",
  "dose-prepared",
  "hud-border-wake",
  "hud-border-state",
  "hearth-dim",
  "hearth-arrive",
  "hearth-rest-request",
  "hearth-refill-request",
  "hearth-respawn-request",
  "hearth-bank-request",
  "hearth-level-request",
  "hearth-craft-request",
  "hearth-leave",
  "names-witness",
  "vial-inherited",
  "item-reveal-request",
  "item-revealed",
  "ceremony-started",
  "ceremony-ended",
  "invulnerable-hold",
  "turn-cleanse-request",
  "arena-hearth-light",
  "unwritten-mark",
  "caleb-misname",
  "slice-exit",
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const fail = (path: string, message: string): never => {
  throw new TypeError(`scene_scripts.json ${path}: ${message}`);
};

const readString = (source: Record<string, unknown>, key: string, path: string): string => {
  const value = source[key];
  if (typeof value !== "string" || value.length === 0) {
    return fail(`${path}.${key}`, "expected a non-empty string");
  }
  return value;
};

const readOptionalString = (
  source: Record<string, unknown>,
  key: string,
  path: string,
): string | undefined => {
  const value = source[key];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "string" || value.length === 0) {
    return fail(`${path}.${key}`, "expected a non-empty string");
  }
  return value;
};

const readInt = (source: Record<string, unknown>, key: string, path: string): number => {
  const value = source[key];
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    return fail(`${path}.${key}`, "expected a safe integer");
  }
  return value;
};

const readBool = (source: Record<string, unknown>, key: string, path: string): boolean => {
  const value = source[key];
  if (typeof value !== "boolean") {
    return fail(`${path}.${key}`, "expected a boolean");
  }
  return value;
};

const readStringList = (value: unknown, path: string): readonly string[] => {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string" || entry.length === 0)) {
    return fail(path, "expected an array of non-empty strings");
  }
  return value;
};

const readFlagMap = (value: unknown, path: string): Readonly<Record<string, number>> => {
  if (value === undefined) {
    return {};
  }
  if (!isRecord(value)) {
    return fail(path, "expected an object of integer flags");
  }
  const flags: Record<string, number> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== "number" || !Number.isSafeInteger(entry)) {
      return fail(`${path}.${key}`, "expected a safe integer");
    }
    flags[key] = entry;
  }
  return flags;
};

const readOp = (value: unknown, path: string): SceneOpEvent => {
  if (!isRecord(value) || typeof value.type !== "string" || !OP_TYPES.has(value.type as SceneOpEvent["type"])) {
    return fail(path, "unknown scene op");
  }
  const type = value.type as SceneOpEvent["type"];
  switch (type) {
    case "teach-flag":
      return { type, flag: readString(value, "flag", path) };
    case "notebook-line":
      return { type, textKey: readString(value, "textKey", path) };
    case "hud-border-state":
      return { type, state: readString(value, "state", path) };
    case "names-witness": {
      const kind = readString(value, "kind", path);
      if (kind !== "kill" && kind !== "witness" && kind !== "notebook") {
        return fail(`${path}.kind`, "expected kill | witness | notebook");
      }
      return { type, kind, sourceId: readString(value, "sourceId", path) };
    }
    case "item-reveal-request":
      return { type, itemId: readString(value, "itemId", path) };
    case "arena-hearth-light":
      return { type, hearthId: readString(value, "hearthId", path) };
    case "unwritten-mark":
      return { type, set: readInt(value, "set", path) };
    default:
      return { type } as SceneOpEvent;
  }
};

const readEffect = (value: unknown, path: string): VerbEffect => {
  if (!isRecord(value)) {
    return fail(path, "expected an effect object");
  }
  const eventsRaw = value.events;
  const events =
    eventsRaw === undefined
      ? undefined
      : !Array.isArray(eventsRaw)
        ? fail(`${path}.events`, "expected an array")
        : eventsRaw.map((entry, index) => readOp(entry, `${path}.events[${index}]`));
  const textFromItem = value.textFromItem;
  if (textFromItem !== undefined && textFromItem !== true) {
    return fail(`${path}.textFromItem`, "expected true when set");
  }
  return {
    textKeys: value.textKeys === undefined ? undefined : readStringList(value.textKeys, `${path}.textKeys`),
    textFromItem: textFromItem === true ? true : undefined,
    flags: value.flags === undefined ? undefined : readFlagMap(value.flags, `${path}.flags`),
    addFlags: value.addFlags === undefined ? undefined : readFlagMap(value.addFlags, `${path}.addFlags`),
    events,
  };
};

const readExit = (value: unknown, path: string): SceneExit => {
  if (!isRecord(value)) {
    return fail(path, "expected an exit object");
  }
  const exit: SceneExit = {
    allVerbsApplied: value.allVerbsApplied === undefined ? undefined : readBool(value, "allVerbsApplied", path),
    afterAnyVerb: value.afterAnyVerb === undefined ? undefined : readBool(value, "afterAnyVerb", path),
    afterTicks: value.afterTicks === undefined ? undefined : readInt(value, "afterTicks", path),
  };
  if (!exit.allVerbsApplied && !exit.afterAnyVerb && exit.afterTicks === undefined) {
    return fail(path, "needs allVerbsApplied, afterAnyVerb, or afterTicks");
  }
  return exit;
};

const readComposition = (value: unknown, path: string): SevenSlotComposition | null => {
  if (value === null) {
    return null;
  }
  if (!isRecord(value)) {
    return fail(path, "expected a seven-slot composition or null");
  }
  const slots = {} as Record<(typeof COMPOSITION_SLOTS)[number], string>;
  for (const slot of COMPOSITION_SLOTS) {
    slots[slot] = readString(value, slot, path);
  }
  return slots;
};

const readStep = (value: unknown, path: string): SceneStep => {
  if (!isRecord(value)) {
    return fail(path, "expected a step object");
  }
  const interrupt = readString(value, "interrupt", path);
  if (!INTERRUPTS.has(interrupt as InterruptPolicy)) {
    return fail(`${path}.interrupt`, "only interrupt policy \"none\" is authored");
  }
  const verbOrder = readString(value, "verbOrder", path);
  if (!ORDERS.has(verbOrder as VerbOrder)) {
    return fail(`${path}.verbOrder`, "expected fixed | free | choice");
  }
  const verbs = readStringList(value.verbs, `${path}.verbs`);
  const effectsRaw = value.verbEffects;
  if (!isRecord(effectsRaw)) {
    return fail(`${path}.verbEffects`, "expected an object");
  }
  const verbEffects: Record<string, VerbEffect> = {};
  for (const verb of verbs) {
    const effect = effectsRaw[verb];
    if (effect === undefined) {
      return fail(`${path}.verbEffects.${verb}`, "missing effect");
    }
    verbEffects[verb] = readEffect(effect, `${path}.verbEffects.${verb}`);
  }
  for (const key of Object.keys(effectsRaw)) {
    if (!verbs.includes(key)) {
      return fail(`${path}.verbEffects.${key}`, "effect for a verb not in the step");
    }
  }
  const staged = value.stagedAnchorId;
  if (staged !== null && (typeof staged !== "string" || staged.length === 0)) {
    return fail(`${path}.stagedAnchorId`, "expected a string or null");
  }
  return {
    id: readString(value, "id", path),
    stagedAnchorId: staged,
    propAnchorId: readOptionalString(value, "propAnchorId", path),
    verbs,
    verbOrder: verbOrder as VerbOrder,
    interrupt: interrupt as InterruptPolicy,
    exit: readExit(value.exit, `${path}.exit`),
    verbEffects,
    onEnter: value.onEnter === undefined ? undefined : readEffect(value.onEnter, `${path}.onEnter`),
    onExit: value.onExit === undefined ? undefined : readEffect(value.onExit, `${path}.onExit`),
  };
};

const readScript = (value: unknown, path: string, id: string): SceneScript => {
  if (!isRecord(value)) {
    return fail(path, "expected a script object");
  }
  const interrupt = readString(value, "interrupt", path);
  if (!INTERRUPTS.has(interrupt as InterruptPolicy)) {
    return fail(`${path}.interrupt`, "only interrupt policy \"none\" is authored");
  }
  const stepsRaw = value.steps;
  if (!Array.isArray(stepsRaw) || stepsRaw.length === 0) {
    return fail(`${path}.steps`, "expected a non-empty step list");
  }
  const steps = stepsRaw.map((step, index) => readStep(step, `${path}.steps[${index}]`));
  const scriptId = readString(value, "id", path);
  if (scriptId !== id) {
    return fail(`${path}.id`, `must equal catalog key "${id}"`);
  }
  const beat = value.beat;
  if (typeof beat !== "number" && typeof beat !== "string") {
    return fail(`${path}.beat`, "expected a number or string");
  }
  const composition = readComposition(value.composition, `${path}.composition`);
  const holdsFrame = steps.some((step) => step.stagedAnchorId !== null);
  if (holdsFrame && composition === null) {
    return fail(`${path}.composition`, "CM1 requires seven slots on every staged script");
  }
  return {
    id: scriptId,
    beat,
    registerLocked: readBool(value, "registerLocked", path),
    repeatable: readBool(value, "repeatable", path),
    interrupt: interrupt as InterruptPolicy,
    composition,
    steps,
  };
};

const readItems = (value: unknown, path: string): Readonly<Record<string, ItemTextBinding>> => {
  if (!isRecord(value)) {
    return fail(path, "expected an items object");
  }
  const items: Record<string, ItemTextBinding> = {};
  for (const [id, entry] of Object.entries(value)) {
    if (!isRecord(entry)) {
      return fail(`${path}.${id}`, "expected an object");
    }
    items[id] = { textKeys: readStringList(entry.textKeys, `${path}.${id}.textKeys`) };
  }
  return items;
};

const readParams = (value: unknown): SceneParams => {
  if (!isRecord(value)) {
    return fail("params", "expected an object");
  }
  const params: SceneParams = {
    ceremonyHoldTicks: readInt(value, "ceremonyHoldTicks", "params"),
    ceremonyPulsePercent: readInt(value, "ceremonyPulsePercent", "params"),
    hearthDimPercent: readInt(value, "hearthDimPercent", "params"),
    hearthDimRampSteps: readInt(value, "hearthDimRampSteps", "params"),
    annaStartingDoses: readInt(value, "annaStartingDoses", "params"),
    stagedFovDegrees: readInt(value, "stagedFovDegrees", "params"),
    items: readItems(value.items, "params.items"),
  };
  if (params.ceremonyHoldTicks <= 0 || params.annaStartingDoses <= 0) {
    return fail("params", "ceremonyHoldTicks and annaStartingDoses must be positive");
  }
  if (params.hearthDimRampSteps !== 1) {
    return fail("params.hearthDimRampSteps", "EN9 is one declared ramp step");
  }
  if (params.stagedFovDegrees < 38 || params.stagedFovDegrees > 48) {
    return fail("params.stagedFovDegrees", "D2 FOV band is 38–48");
  }
  return params;
};

/** Validate raw JSON into a catalog. Throws on any schema miss. */
export const parseSceneScripts = (raw: unknown): SceneCatalog => {
  if (!isRecord(raw)) {
    return fail("", "expected an object");
  }
  const params = readParams(raw.params);
  if (!isRecord(raw.scripts)) {
    return fail("scripts", "expected an object");
  }
  const scripts: Record<string, SceneScript> = {};
  for (const [id, entry] of Object.entries(raw.scripts)) {
    scripts[id] = readScript(entry, `scripts.${id}`, id);
  }
  const ceremony = scripts.warden_ceremony;
  const hold = ceremony?.steps[0]?.exit.afterTicks;
  if (hold !== params.ceremonyHoldTicks) {
    return fail("scripts.warden_ceremony", "hold ticks must match params.ceremonyHoldTicks");
  }
  return { params, scripts };
};

export const COMPOSITION_SLOT_NAMES = COMPOSITION_SLOTS;
export const REQUIRED_SCRIPT_IDS = [
  "cabin_prologue",
  "anna_gravity",
  "hearth_vigil",
  "warden_ceremony",
  "warden_aftermath",
  "birdie_coda",
  "item_revelation",
] as const;
