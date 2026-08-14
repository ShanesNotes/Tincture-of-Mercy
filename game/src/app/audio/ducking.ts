import type { AudioParams, DuckGroup } from "./types";

export type DuckGains = Record<DuckGroup, number>;

const GROUPS: readonly DuckGroup[] = ["none", "combat", "ambience", "sting", "ui"];

export const identityDuckGains = (): DuckGains => ({
  none: 1,
  combat: 1,
  ambience: 1,
  sting: 1,
  ui: 1,
});

/**
 * Combat ducks ambience. Death sting ducks every other group.
 * Simultaneous sources take the strongest (minimum) multiplier per target.
 */
export const resolveDuckGains = (
  activeGroups: readonly DuckGroup[],
  params: AudioParams,
): DuckGains => {
  const gains = identityDuckGains();
  for (const group of activeGroups) {
    const edges = params.ducking[group];
    if (edges === undefined) {
      continue;
    }
    for (const [target, amount] of Object.entries(edges)) {
      if (!GROUPS.includes(target as DuckGroup)) {
        continue;
      }
      const key = target as DuckGroup;
      const current = gains[key];
      if (amount < current) {
        gains[key] = amount;
      }
    }
  }
  return gains;
};

export const busGain = (
  params: AudioParams,
  bus: "master" | "sfx" | "ambience",
  duck: number,
  cueGain: number,
  reducedFeedback: boolean,
  isBodyLayer: boolean,
): number => {
  const reduced =
    reducedFeedback && isBodyLayer ? params.reducedFeedback.bodyGainScale : 1;
  return params.buses.master * params.buses[bus] * duck * cueGain * reduced;
};
