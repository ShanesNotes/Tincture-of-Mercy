/**
 * Warden ceremony + aftermath trigger contract. Boss logic (s24) calls these
 * at the authored Pulse threshold; this slice does not own the fight.
 */

import { tryEnterScene } from "./host";
import type {
  CombatEngagement,
  EnterContext,
  SceneCatalog,
  SceneParams,
  SceneResult,
  SceneState,
} from "./types";

export interface WardenCeremonyContract {
  /** ENCOUNTERS / TUNING_V0: the ceremony begins at ~55% Pulse. */
  readonly pulsePercent: number;
  /** TUNING_V0: 90t invulnerable, deals no damage. */
  readonly holdTicks: number;
  /** True when remaining Pulse has crossed the authored threshold. */
  shouldBegin(bossPulse: number, bossMaxPulse: number): boolean;
  /**
   * Boss logic calls this after clearing combat engagement. The ceremony is a
   * no-damage staged hold (D2); {@link CombatEngagement.engaged} must be false.
   */
  begin(state: SceneState, engagement: CombatEngagement): SceneResult;
}

export interface WardenAftermathContract {
  /** Call after the Warden is down. No title card is ever emitted as shown. */
  begin(state: SceneState, engagement: CombatEngagement): SceneResult;
}

const crossedThreshold = (bossPulse: number, bossMaxPulse: number, percent: number): boolean => {
  if (bossMaxPulse <= 0) {
    return false;
  }
  return bossPulse * 100 <= bossMaxPulse * percent;
};

export const createWardenCeremonyTrigger = (
  catalog: SceneCatalog,
  params: SceneParams = catalog.params,
): WardenCeremonyContract => ({
  pulsePercent: params.ceremonyPulsePercent,
  holdTicks: params.ceremonyHoldTicks,
  shouldBegin: (bossPulse, bossMaxPulse) =>
    crossedThreshold(bossPulse, bossMaxPulse, params.ceremonyPulsePercent),
  begin: (state, engagement) => tryEnterScene(state, "warden_ceremony", catalog, engagement),
});

export const createWardenAftermathTrigger = (catalog: SceneCatalog): WardenAftermathContract => ({
  begin: (state, engagement) => tryEnterScene(state, "warden_aftermath", catalog, engagement),
});

export const beginItemRevelation = (
  state: SceneState,
  catalog: SceneCatalog,
  engagement: CombatEngagement,
  itemId: string,
): SceneResult => {
  const context: EnterContext = { itemId };
  return tryEnterScene(state, "item_revelation", catalog, engagement, context);
};
