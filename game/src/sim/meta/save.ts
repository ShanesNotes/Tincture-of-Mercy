/**
 * Versioned save/load for the whole mercy-loop state (PRD R11).
 *
 * Serialization is canonical — object keys are emitted in sorted order — so
 * save → load → save is byte-identical and a save file can be diffed and hashed.
 * There is exactly one shipped version; anything else is rejected loudly rather
 * than guessed at ("explicit migrate-or-reject on version mismatch").
 */

import { META_STATE_VERSION } from "./types";
import type { MetaState } from "./types";

export const SAVE_VERSION = META_STATE_VERSION;

export type SaveRejectReason = "format" | "version";

export class SaveRejectedError extends Error {
  public readonly reason: SaveRejectReason;

  public constructor(reason: SaveRejectReason, detail: string) {
    super(`Save rejected (${reason}): ${detail}`);
    this.name = "SaveRejectedError";
    this.reason = reason;
  }
}

const REQUIRED_KEYS = [
  "arena",
  "atHearth",
  "defeated",
  "effects",
  "gearWeight",
  "lastHearthId",
  "life",
  "names",
  "numbnessStacks",
  "openPage",
  "pending",
  "pouch",
  "tick",
  "version",
  "vial",
  "vigilRestore",
] as const;

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => entry !== undefined)
    .sort(([left], [right]) => (left < right ? -1 : 1));
  return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`).join(",")}}`;
};

/** Canonical, key-sorted JSON of the whole meta state. */
export const serializeMetaState = (state: MetaState): string => stableStringify(state);

/**
 * Accept a save of the shipped version, reject anything else explicitly.
 * There is no migration path yet: v1 is the first format.
 */
export const migrateOrReject = (saved: unknown): MetaState => {
  if (saved === null || typeof saved !== "object" || Array.isArray(saved)) {
    return rejectFormat("save must be a JSON object");
  }

  const record = saved as Record<string, unknown>;
  const version = record["version"];
  if (typeof version !== "number") {
    return rejectFormat("missing numeric `version`");
  }
  if (version !== SAVE_VERSION) {
    throw new SaveRejectedError(
      "version",
      `unsupported version ${String(version)} (expected ${String(SAVE_VERSION)})`,
    );
  }

  const missing = REQUIRED_KEYS.filter((key) => !(key in record));
  if (missing.length > 0) {
    return rejectFormat(`missing field(s): ${missing.join(", ")}`);
  }

  return saved as MetaState;
};

function rejectFormat(detail: string): never {
  throw new SaveRejectedError("format", detail);
}

/** Parse a serialized save. Throws {@link SaveRejectedError} on anything unknown. */
export const deserializeMetaState = (json: string): MetaState =>
  migrateOrReject(JSON.parse(json) as unknown);
