import { quantizeMm } from "./math";
import type { AiEvent, WolfActorState, WolfAiState } from "./types";

const wolfTuple = (wolf: WolfActorState): readonly (string | number | boolean | null)[] => [
  wolf.id,
  wolf.role,
  wolf.alive ? 1 : 0,
  quantizeMm(wolf.x),
  quantizeMm(wolf.y),
  quantizeMm(wolf.z),
  quantizeMm(wolf.yaw),
  quantizeMm(wolf.pulse),
  wolf.alert,
  wolf.alertTimer,
  wolf.confirmTimer,
  wolf.hasToken ? 1 : 0,
  wolf.lastAttackTick,
  wolf.action === null ? "" : `${wolf.action.id}:${String(wolf.action.startedTick)}`,
  wolf.mode,
  wolf.fleeReturnTick,
  wolf.path.join(","),
  wolf.pathIndex,
  wolf.assignedSlot,
  wolf.crowdFailure,
  wolf.circleSign,
  wolf.feintReadyTick,
];

const eventTuple = (entry: AiEvent): readonly (string | number)[] => [
  entry.tick,
  entry.kind,
  entry.wolfId,
  entry.detail,
];

const stableJson = (state: WolfAiState): string =>
  JSON.stringify([
    state.version,
    state.tick,
    state.pack.homeX,
    state.pack.homeY,
    state.pack.homeZ,
    state.pack.aggressionTier,
    state.pack.tokenHolderId,
    state.pack.tokenResolvedTick,
    state.pack.tokenReleaseTick,
    state.pack.howlCount,
    state.wolves.map(wolfTuple),
    state.events.map(eventTuple),
  ]);

export const hashWolfAiState = (state: WolfAiState): string => {
  let hash = 0x811c_9dc5;
  for (const character of stableJson(state)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 0x0100_0193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};
