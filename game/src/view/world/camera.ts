import type { PerspectiveCamera } from "three";

import {
  CAMERA_PARAMS,
  CameraRig,
  createCameraLineOfSight,
  createCameraState,
  holdFrame,
  pitchTowards,
  presentCamera,
  releaseFrame,
  stepCamera,
  subtract,
  yawTowards,
  type CameraState,
  type CameraProbe,
  type StagedFrameSpec,
  type Vec3,
} from "../camera";
import type { LoadedIronwoodAssets, CameraWorldEvent, WorldPresentation } from "./types";

const placementPoint = (value: readonly [number, number, number]): Vec3 => ({
  x: value[0],
  y: value[1],
  z: value[2],
});

/**
 * The world camera only needs the first obstruction along its pivot-to-lens
 * segment. A BVH ray with the authored camera-radius clearance answers that
 * directly; actor movement continues to use the full swept-capsule solver.
 */
const createWorldCameraProbe = (assets: LoadedIronwoodAssets): CameraProbe =>
  (from, to, radiusMeters) => {
    const delta = subtract(to, from);
    const distance = Math.hypot(delta.x, delta.y, delta.z);
    if (distance <= 1e-9) return 1;
    const hit = assets.collisionWorld.raycast({
      origin: from,
      direction: delta,
      maxDistance: distance,
    });
    return hit === null
      ? 1
      : Math.max(0, Math.min(1, (hit.distance - radiusMeters) / distance));
  };

const stagedSpec = (
  event: Extract<CameraWorldEvent, { readonly type: "camera-hold" }>,
  assets: LoadedIronwoodAssets,
): StagedFrameSpec => {
  const anchor = assets.placementById.get(event.anchorId);
  if (anchor?.lookAt === undefined) {
    throw new Error(`camera hold references missing placement anchor ${event.anchorId}`);
  }
  const position = placementPoint(anchor.position);
  const pivot = placementPoint(anchor.lookAt);
  const forward = subtract(pivot, position);
  return {
    beat: event.beat,
    pivot,
    yawRadians: yawTowards(forward),
    pitchRadians: pitchTowards(forward),
    distanceMeters: Math.hypot(forward.x, forward.y, forward.z),
    fovDegrees: CAMERA_PARAMS.fov.defaultDegrees,
  };
};

export class WorldCameraBinding {
  public readonly rig: CameraRig;
  readonly #assets: LoadedIronwoodAssets;
  readonly #probe: CameraProbe;
  readonly #lineOfSight: ReturnType<typeof createCameraLineOfSight>;
  readonly #pendingEvents: CameraWorldEvent[] = [];
  #previous: CameraState;
  #current: CameraState;
  #aspect = 1;
  #presentedTick = -1;

  public constructor(
    assets: LoadedIronwoodAssets,
    reversedDepthRenderer: { readonly reversedDepthBuffer: boolean },
    initialPlayerPosition: Vec3,
  ) {
    this.#assets = assets;
    this.rig = new CameraRig(CAMERA_PARAMS);
    this.rig.bindRenderer(reversedDepthRenderer);
    this.#current = createCameraState(CAMERA_PARAMS, initialPlayerPosition);
    this.#previous = this.#current;
    this.#probe = createWorldCameraProbe(assets);
    this.#lineOfSight = createCameraLineOfSight(assets.collisionWorld);
  }

  public get camera(): PerspectiveCamera {
    return this.rig.camera;
  }

  public setAspect(aspect: number): void {
    this.#aspect = aspect;
    this.rig.setAspect(aspect);
  }

  public consume(events: readonly CameraWorldEvent[]): void {
    this.#pendingEvents.push(...events);
  }

  public apply(presentation: WorldPresentation, alpha: number): void {
    const player = presentation.actors.find((actor) => actor.kind === "player");
    if (player === undefined) throw new Error("world presentation has no player actor");
    const attendTarget =
      presentation.attendTargetId === null
        ? null
        : presentation.actors.find((actor) => actor.id === presentation.attendTargetId) ?? null;

    if (presentation.tick !== this.#presentedTick) {
      this.#previous = this.#current;
      for (const event of this.#pendingEvents.splice(0)) {
        if (event.type === "camera-release") {
          this.#current = releaseFrame(this.#current);
          continue;
        }
        // D2 is s12's law and `holdFrame` throws on it, which is right for a
        // module that should never be asked. Composition can be asked: combat
        // can open while a scene already holds the frame. The answer is to
        // decline the staged plate and keep gameplay framing, not to throw a
        // rendering error out of requestAnimationFrame and stop the game.
        if (presentation.damageContext) continue;
        this.#current = holdFrame(this.#current, stagedSpec(event, this.#assets), {
          damageContext: false,
        });
      }
      this.#current = stepCamera(this.#current, CAMERA_PARAMS, {
        playerPosition: player.position,
        playerMoveYaw: player.facingRadians,
        attendTargetPosition: attendTarget?.position ?? null,
        orbit: presentation.orbit,
        aspect: this.#aspect,
        damageContext: presentation.damageContext,
        probe: this.#probe,
        lineOfSight: this.#lineOfSight,
      });
      this.#presentedTick = presentation.tick;
    }

    this.rig.apply(presentCamera(this.#previous, this.#current, alpha));
  }
}
