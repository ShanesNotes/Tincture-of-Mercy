/**
 * Combat-engagement seam. Integration binds a live flag; this module only
 * asserts it. D2: staged frames exist only in no-damage moments.
 */

import type { CombatEngagement } from "./types";

export class SceneEngagementError extends Error {
  readonly scriptId: string;

  constructor(scriptId: string) {
    super(`D2 forbids a staged scene during combat engagement (script "${scriptId}").`);
    this.name = "SceneEngagementError";
    this.scriptId = scriptId;
  }
}

/** Entering a staged scene asserts there is no live engagement. */
export const assertNoEngagement = (engagement: CombatEngagement, scriptId: string): void => {
  if (engagement.engaged) {
    throw new SceneEngagementError(scriptId);
  }
};

export const idleEngagement = (): CombatEngagement => ({ engaged: false });
