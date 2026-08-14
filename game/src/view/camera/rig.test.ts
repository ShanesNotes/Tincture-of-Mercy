import { Euler } from "three";
import { describe, expect, it } from "vitest";

import { degreesToRadians } from "./math";
import { CAMERA_PARAMS, parseCameraParams } from "./params";
import { assertReverseZDepthRange, assertReversedDepthRenderer, CameraRig } from "./rig";
import { createCameraState, holdFrame, type StagedFrameSpec } from "./state";

const params = CAMERA_PARAMS;

const rawWithDepth = (depth: Record<string, unknown>): unknown => ({
  ...structuredClone(params),
  depth,
});

describe("assertReverseZDepthRange", () => {
  it("accepts the shipped depth range", () => {
    expect(() => assertReverseZDepthRange(params.depth)).not.toThrow();
  });

  it("rejects a forward-Z buffer", () => {
    expect(() => assertReverseZDepthRange({ ...params.depth, reverseZ: false })).toThrow(/D2/);
  });

  it.each([
    ["a zero near plane", { nearMeters: 0, farMeters: 100, reverseZ: true }],
    ["an inverted range", { nearMeters: 10, farMeters: 1, reverseZ: true }],
  ])("rejects %s", (_label, depth) => {
    expect(() => assertReverseZDepthRange(depth)).toThrow(/near/);
  });
});

describe("assertReversedDepthRenderer", () => {
  it("passes a reversed-depth renderer and fails a forward one", () => {
    expect(() => assertReversedDepthRenderer({ reversedDepthBuffer: true })).not.toThrow();
    expect(() => assertReversedDepthRenderer({ reversedDepthBuffer: false })).toThrow(/D2/);
  });
});

describe("CameraRig", () => {
  it("boots inside the D2 FOV band with the reverse-Z depth range", () => {
    const rig = new CameraRig(params, 16 / 9);
    expect(rig.camera.fov).toBe(params.fov.defaultDegrees);
    expect(rig.camera.near).toBe(params.depth.nearMeters);
    expect(rig.camera.far).toBe(params.depth.farMeters);
    expect(rig.camera.rotation.order).toBe("YXZ");
  });

  it("refuses to build on a forward-Z depth range", () => {
    const forwardZ = parseCameraParams(
      rawWithDepth({ nearMeters: 0.1, farMeters: 1200, reverseZ: false }),
    );
    expect(() => new CameraRig(forwardZ)).toThrow(/D2/);
  });

  it("writes the solved pose onto the three camera", () => {
    const rig = new CameraRig(params, 16 / 9);
    const state = createCameraState(params, { x: 2, y: 0, z: -3 });
    rig.apply(state);
    expect(rig.camera.position.x).toBeCloseTo(state.position.x, 12);
    expect(rig.camera.position.y).toBeCloseTo(state.position.y, 12);
    expect(rig.camera.position.z).toBeCloseTo(state.position.z, 12);
    expect(rig.camera.rotation.y).toBeCloseTo(state.yawRadians, 12);
    expect(rig.camera.rotation.x).toBeCloseTo(state.pitchRadians, 12);
  });

  it("never writes roll, at any yaw and pitch (L1)", () => {
    const rig = new CameraRig(params, 16 / 9);
    const base = createCameraState(params, { x: 0, y: 0, z: 0 });
    for (const yawDegrees of [-179, -90, -33, 0, 47, 90, 179]) {
      for (const pitchDegrees of [params.orbit.pitchMinDegrees, -12, 0, params.orbit.pitchMaxDegrees]) {
        rig.apply({
          ...base,
          yawRadians: degreesToRadians(yawDegrees),
          pitchRadians: degreesToRadians(pitchDegrees),
        });
        expect(rig.camera.rotation.z).toBe(0);
        const worldEuler = new Euler().setFromQuaternion(rig.camera.quaternion, "YXZ");
        expect(worldEuler.z).toBeCloseTo(0, 12);
        expect(rig.camera.up.y).toBe(1);
      }
    }
  });

  it("clamps a staged FOV into the band before it reaches the projection", () => {
    const rig = new CameraRig(params, 16 / 9);
    const spec: StagedFrameSpec = {
      beat: "hearth-rest",
      pivot: { x: 0, y: 1.2, z: 0 },
      yawRadians: 0,
      pitchRadians: 0,
      distanceMeters: 3,
      fovDegrees: 40,
    };
    const staged = holdFrame(createCameraState(params, { x: 0, y: 0, z: 0 }), spec, {
      damageContext: false,
    });
    rig.apply({ ...staged, fovDegrees: 90 });
    expect(rig.camera.fov).toBe(params.fov.maxDegrees);
    rig.apply({ ...staged, fovDegrees: 10 });
    expect(rig.camera.fov).toBe(params.fov.minDegrees);
    rig.apply(staged);
    expect(rig.camera.fov).toBe(spec.fovDegrees);
  });

  it("rebuilds the projection only on a real aspect change", () => {
    const rig = new CameraRig(params, 1);
    rig.setAspect(16 / 9);
    expect(rig.camera.aspect).toBeCloseTo(16 / 9, 12);
    expect(() => rig.setAspect(0)).toThrow(/aspect/);
  });

  it("binds only to a renderer running reversed depth", () => {
    const rig = new CameraRig(params);
    expect(() => rig.bindRenderer({ reversedDepthBuffer: true })).not.toThrow();
    expect(() => rig.bindRenderer({ reversedDepthBuffer: false })).toThrow(/D2/);
  });
});
