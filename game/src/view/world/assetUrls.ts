import arenaCollisionUrl from "../../../assets/build/levels/arena.collision.json?url";
import arenaVisualUrl from "../../../assets/build/levels/arena.visual.glb?url";
import cabinCollisionUrl from "../../../assets/build/levels/cabin.collision.json?url";
import cabinVisualUrl from "../../../assets/build/levels/cabin.visual.glb?url";
import forestCollisionUrl from "../../../assets/build/levels/forest.collision.json?url";
import forestVisualUrl from "../../../assets/build/levels/forest.visual.glb?url";
import levelManifestUrl from "../../../assets/build/levels/manifest.json?url";
import navUrl from "../../../assets/build/levels/ironwood_nav.json?url";
import placementsUrl from "../../../assets/build/levels/ironwood.placements.json?url";
import roadCollisionUrl from "../../../assets/build/levels/road.collision.json?url";
import roadVisualUrl from "../../../assets/build/levels/road.visual.glb?url";
import roadCodaCollisionUrl from "../../../assets/build/levels/road_coda.collision.json?url";
import roadCodaVisualUrl from "../../../assets/build/levels/road_coda.visual.glb?url";
import woodlineCollisionUrl from "../../../assets/build/levels/woodline.collision.json?url";
import woodlineVisualUrl from "../../../assets/build/levels/woodline.visual.glb?url";
import yardCollisionUrl from "../../../assets/build/levels/yard.collision.json?url";
import yardVisualUrl from "../../../assets/build/levels/yard.visual.glb?url";
import kalevGlbUrl from "../../../assets/build/kalev_blocking.cfc533d1eaba.glb?url";
import kalevGuardUrl from "../../../assets/build/kalev_blocking_guard.json?url";
import kalevHeavyUrl from "../../../assets/build/kalev_blocking_heavy.json?url";
import kalevLightUrl from "../../../assets/build/kalev_blocking_light1.json?url";
import kalevManifestUrl from "../../../assets/build/kalev_blocking.manifest.json?url";
import kalevRollUrl from "../../../assets/build/kalev_blocking_roll.json?url";
import wolfCircleUrl from "../../../assets/build/wolf_circle.json?url";
import wolfDeathBackUrl from "../../../assets/build/wolf_death_crumple_back.json?url";
import wolfDeathFwdUrl from "../../../assets/build/wolf_death_crumple_fwd.json?url";
import wolfFlinchUrl from "../../../assets/build/wolf_flinch.json?url";
import wolfGlbUrl from "../../../assets/build/wolf.ac7dfc084aa5.glb?url";
import wolfIdleUrl from "../../../assets/build/wolf_idle.json?url";
import wolfLungeUrl from "../../../assets/build/wolf_lunge.json?url";
import wolfManifestUrl from "../../../assets/build/wolf.manifest.json?url";
import wolfStalkUrl from "../../../assets/build/wolf_stalk.json?url";

export const LEVEL_MANIFEST_URL = levelManifestUrl;
export const PLACEMENTS_URL = placementsUrl;
export const NAV_URL = navUrl;

export const LEVEL_ASSET_URLS: Readonly<Record<string, string>> = {
  "arena.collision.json": arenaCollisionUrl,
  "arena.visual.glb": arenaVisualUrl,
  "cabin.collision.json": cabinCollisionUrl,
  "cabin.visual.glb": cabinVisualUrl,
  "forest.collision.json": forestCollisionUrl,
  "forest.visual.glb": forestVisualUrl,
  "road.collision.json": roadCollisionUrl,
  "road.visual.glb": roadVisualUrl,
  "road_coda.collision.json": roadCodaCollisionUrl,
  "road_coda.visual.glb": roadCodaVisualUrl,
  "woodline.collision.json": woodlineCollisionUrl,
  "woodline.visual.glb": woodlineVisualUrl,
  "yard.collision.json": yardCollisionUrl,
  "yard.visual.glb": yardVisualUrl,
};

export const CHARACTER_ASSET_URLS: Readonly<Record<string, string>> = {
  "kalev_blocking.manifest.json": kalevManifestUrl,
  "kalev_blocking.cfc533d1eaba.glb": kalevGlbUrl,
  "kalev_blocking_guard.json": kalevGuardUrl,
  "kalev_blocking_heavy.json": kalevHeavyUrl,
  "kalev_blocking_light1.json": kalevLightUrl,
  "kalev_blocking_roll.json": kalevRollUrl,
  "wolf.manifest.json": wolfManifestUrl,
  "wolf.ac7dfc084aa5.glb": wolfGlbUrl,
  "wolf_circle.json": wolfCircleUrl,
  "wolf_death_crumple_back.json": wolfDeathBackUrl,
  "wolf_death_crumple_fwd.json": wolfDeathFwdUrl,
  "wolf_flinch.json": wolfFlinchUrl,
  "wolf_idle.json": wolfIdleUrl,
  "wolf_lunge.json": wolfLungeUrl,
  "wolf_stalk.json": wolfStalkUrl,
};
