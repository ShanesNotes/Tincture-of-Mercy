import { PerspectiveCamera } from "three";

import { clamp } from "./math";
import type { CameraParams, DepthParams } from "./params";
import type { CameraState } from "./state";

/** The renderer surface the rig needs — kept minimal so it is testable headless. */
export interface ReversedDepthRenderer {
  readonly reversedDepthBuffer: boolean;
}

/** D2 fixes a reverse-Z depth buffer; near/far still have to be ordered and positive. */
export const assertReverseZDepthRange = (depth: DepthParams): void => {
  if (!depth.reverseZ) {
    throw new Error("D2 requires a reverse-Z depth buffer for the souls near/far span.");
  }
  if (!(depth.nearMeters > 0) || !(depth.farMeters > depth.nearMeters)) {
    throw new RangeError("Camera depth range must satisfy 0 < near < far.");
  }
};

/** Fails loudly if the camera is bound to a renderer without reversed depth. */
export const assertReversedDepthRenderer = (renderer: ReversedDepthRenderer): void => {
  if (!renderer.reversedDepthBuffer) {
    throw new Error("D2 requires the renderer to run with reversedDepthBuffer enabled.");
  }
};

/**
 * The three-side glue: everything above this file is pure math. The rig writes
 * position, yaw and pitch onto a PerspectiveCamera and never writes roll —
 * the YXZ euler keeps the Z term structurally zero (D2 / renderer law L1).
 */
export class CameraRig {
  public readonly camera: PerspectiveCamera;
  readonly #params: CameraParams;

  public constructor(params: CameraParams, aspect = 1) {
    assertReverseZDepthRange(params.depth);
    this.#params = params;
    this.camera = new PerspectiveCamera(
      params.fov.defaultDegrees,
      aspect,
      params.depth.nearMeters,
      params.depth.farMeters,
    );
    this.camera.up.set(0, 1, 0);
    this.camera.rotation.order = "YXZ";
  }

  public setAspect(aspect: number): void {
    if (!Number.isFinite(aspect) || aspect <= 0) {
      throw new RangeError("Camera aspect must be a positive finite number.");
    }
    if (this.camera.aspect !== aspect) {
      this.camera.aspect = aspect;
      this.camera.updateProjectionMatrix();
    }
  }

  public bindRenderer(renderer: ReversedDepthRenderer): void {
    assertReversedDepthRenderer(renderer);
  }

  public apply(state: CameraState): void {
    this.camera.position.set(state.position.x, state.position.y, state.position.z);
    this.camera.rotation.set(state.pitchRadians, state.yawRadians, 0, "YXZ");

    const fov = clamp(state.fovDegrees, this.#params.fov.minDegrees, this.#params.fov.maxDegrees);
    if (this.camera.fov !== fov) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
  }
}
