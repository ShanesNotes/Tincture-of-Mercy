/**
 * SIM → music binder (slice s19). Pure and headless: it projects one
 * {@link WorldDebugSnapshot} into the {@link MusicState} DTO the s29 music
 * system latches. Which track a state earns stays entirely in
 * `src/data/music_params.json`; this file only reads world truth and names it
 * in the vocabulary those rules match on.
 *
 * Type-only imports from `./music` on purpose: `music.ts` reaches
 * `node:fs` through `loadCommittedAudioParams`, and this binder must stay
 * browser-safe so the audio barrel can re-export it.
 */

import type { WorldDebugBoss, WorldDebugSnapshot } from "../../sim/world/types";
import type { MusicState } from "./music";

/**
 * Baked s20 level zone ids → the music-zone vocabulary the rule table actually
 * matches. Only `arena` and `threshold` carry rules; everything else reaches
 * the table's terminal `silence` rule, which is why the fallback lowercases the
 * baked id rather than inventing a name for it.
 *
 * ROAD_CODA is the threshold: ENCOUNTERS names the Birdie coda the "post-boss
 * road threshold" and DECISIONS locks it as a "non-combat threshold", and
 * `road_motif` is the brief unaccompanied threshold line that fires once per
 * entry. The approach ROAD stays `road` — the road's default is silence.
 */
const MUSIC_ZONE_BY_LEVEL_ZONE: Readonly<Record<string, string>> = {
  ARENA: "arena",
  ROAD_CODA: "threshold",
};

/** Outside every baked box: the module's own default zone, which the table leaves silent. */
const UNBAKED_ZONE = "road";

const musicZone = (zoneId: string | null): string => {
  if (zoneId === null) {
    return UNBAKED_ZONE;
  }
  return MUSIC_ZONE_BY_LEVEL_ZONE[zoneId] ?? zoneId.toLowerCase();
};

/**
 * 0 whenever no Warden bed is licensed. The ceremony keeps the phase it is
 * transitioning from for free: `sim/boss` only flips `phase` to `p2` on the
 * tick the ceremony ends, and `music_params` matches the ceremony on the
 * `ceremony` flag alone, so `bossPhase` never has to be special-cased for it.
 */
const bossPhaseFor = (boss: WorldDebugBoss): number => {
  if (!boss.present || boss.arena === "outside" || boss.defeated) {
    return 0;
  }
  if (boss.phase === "p1") {
    return 1;
  }
  if (boss.phase === "p2") {
    return 2;
  }
  return 0;
};

export const musicStateFromWorld = (snapshot: WorldDebugSnapshot): MusicState => ({
  zone: musicZone(snapshot.zoneId),
  bossPhase: bossPhaseFor(snapshot.boss),
  inCombat: snapshot.engaged,
  hearthRest: (snapshot.hearth.nearbyId !== null && snapshot.hearth.lit) || snapshot.meta.atHearth,
  ceremony: snapshot.boss.ceremonyActive,
});
