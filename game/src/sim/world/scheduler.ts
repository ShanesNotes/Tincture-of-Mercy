import type { WolfAiState } from "../ai";
import type { Vec3 } from "../motion";
import type { WorldDefinition } from "./types";

/** Shared SIM-truth predicate for stepping and debug/presentation snapshots. */
export const isWorldPackActive = (
  pack: WolfAiState,
  player: Vec3,
  definition: WorldDefinition,
): boolean =>
  pack.wolves.some(
    (wolf) =>
      wolf.alert !== "unaware" ||
      wolf.action !== null ||
      wolf.hasToken ||
      Math.hypot(wolf.x - player.x, wolf.y - player.y, wolf.z - player.z) <=
        definition.aiParams.perception.sightRangeM,
  );
