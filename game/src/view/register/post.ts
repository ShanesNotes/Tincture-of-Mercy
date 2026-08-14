/**
 * Register post pipeline (L3/L5/A1/A7): ink outline, quantized depth bands,
 * palette-clamp grade — all data-driven, all killable via `?post=off`
 * (L12: the frame must pass the gate with every post pass disabled).
 *
 * One composite pass over the scene pass:
 * 1. Ink outline (L3/A6): depth-step + surface-bend discontinuity from
 *    screen-space depth, weight in texels from config.
 * 2. Quantized depth bands (L5): stepped desaturation toward muted blue
 *    #263d5e at declared view-distance boundaries. Never continuous haze —
 *    the shift weights are declared in palette.json, so band colors are
 *    themselves declared palette colors.
 * 3. Palette clamp (A1): soft pull toward the nearest declared color
 *    (tokens + ramps + band shifts), computed branchlessly over the
 *    unrolled declared set. Declared colors sit exactly on the set, so the
 *    clamp only binds AA edges and emblem rasters.
 */

import {
  RenderPipeline,
  RenderTarget,
  type Camera,
  type Scene,
  type WebGPURenderer,
} from "three/webgpu";
import {
  abs,
  color,
  cross,
  dot,
  float,
  max,
  min,
  mix,
  pass,
  saturate,
  screenUV,
  smoothstep,
  step,
  vec2,
  vec3,
  vec4,
  screenSize,
} from "three/tsl";

import { REGISTER_CONFIG, type RegisterConfig } from "./config";
import { PALETTE_LAW, declaredColors, tokenHex } from "./palette";
import type { FloatNode, Vec2Node, Vec3Node } from "./patterns";

export interface RegisterPipeline {
  /** Render the current frame to the canvas. */
  readonly render: () => void;
  /** Render into a capture target and read back final sRGB bytes. */
  readonly capture: (target: RenderTarget) => Promise<Uint8Array>;
  readonly setPostEnabled: (enabled: boolean) => void;
  readonly postEnabled: () => boolean;
}

export const createRegisterPipeline = (
  renderer: WebGPURenderer,
  scene: Scene,
  camera: Camera,
  config: RegisterConfig = REGISTER_CONFIG,
): RegisterPipeline => {
  const pipeline = new RenderPipeline(renderer);
  // samples: 0 — the pass must never MSAA-blit its depth/stencil (illegal
  // on the WebGL2 backend with reversed-depth float depth textures) and the
  // register wants hard stepped edges, not multisample softening.
  const scenePass = pass(scene, camera, { samples: 0 });
  const sceneColor = scenePass.getTextureNode();
  const sceneDepth = scenePass.getTextureNode("depth");

  const near = (camera as { near?: number }).near ?? 0.1;
  const far = (camera as { far?: number }).far ?? 1000;
  const fov = ((camera as { fov?: number }).fov ?? 50) * (Math.PI / 180);
  const aspect = (camera as { aspect?: number }).aspect ?? 1;

  // viewZ from raw depth; the foundation boots with a reversed depth
  // buffer (D2), and the formula below is the reversed form of
  // perspectiveDepthToViewZ (three r185 ViewportDepthNode).
  const viewZAt = (sampleUv: Vec2Node): FloatNode => {
    const depth = sceneDepth.sample(sampleUv).x;
    return float(near)
      .mul(far)
      .div(float(near - far).mul(depth).sub(near));
  };

  // Reconstruct a view-space position for surface-bend detection.
  const viewPosAt = (sampleUv: Vec2Node): Vec3Node => {
    const zDist = viewZAt(sampleUv).negate();
    const ndc = sampleUv.mul(2).sub(1);
    const tanHalf = Math.tan(fov / 2);
    return vec3(
      ndc.x.mul(tanHalf * aspect).mul(zDist),
      ndc.y.mul(tanHalf).mul(zDist),
      zDist.negate(),
    );
  };

  const texel = vec2(1, 1).div(screenSize);
  const weight = float(config.outline.weightTexels);
  const off = (dx: number, dy: number): Vec2Node =>
    screenUV.add(vec2(dx, dy).mul(texel).mul(weight));

  // --- Ink outline (L3/A6) ------------------------------------------------
  const zC = viewZAt(screenUV);
  const z00 = viewZAt(off(-1, -1));
  const z11 = viewZAt(off(1, 1));
  const z01 = viewZAt(off(-1, 1));
  const z10 = viewZAt(off(1, -1));

  const depthGradient = max(abs(z00.sub(z11)), abs(z01.sub(z10)));
  const depthEdge = smoothstep(
    config.outline.depthThreshold,
    config.outline.depthThreshold * 2,
    depthGradient,
  );

  // Surface bend: opposing finite-difference normals from reconstructed
  // view positions disagree at creases (the "normal discontinuity" half of
  // the outline law without a separate normal buffer).
  const pC = viewPosAt(screenUV);
  const pR = viewPosAt(off(1, 0));
  const pU = viewPosAt(off(0, 1));
  const pL = viewPosAt(off(-1, 0));
  const pD = viewPosAt(off(0, -1));
  const crossRU = cross(pR.sub(pC), pU.sub(pC));
  const crossLD = cross(pC.sub(pL), pC.sub(pD));
  // Guard: on a perfectly flat field both crosses are ~zero and normalize
  // would NaN the whole frame. Degenerate → no bend, no edge.
  const lenRU = crossRU.length();
  const lenLD = crossLD.length();
  const validNormals = step(1e-6, lenRU).mul(step(1e-6, lenLD));
  const nRU = crossRU.div(max(lenRU, 1e-6));
  const nLD = crossLD.div(max(lenLD, 1e-6));
  const bend = saturate(float(1).sub(saturate(dot(nRU, nLD)))).mul(validNormals);
  const bendThreshold = 1 - Math.cos(config.outline.normalThreshold);
  const normalEdge = smoothstep(bendThreshold, bendThreshold * 2, bend);

  const edge = max(depthEdge, normalEdge);
  const inkColor = color(tokenHex(PALETTE_LAW, "ink")).rgb;

  // --- Quantized depth bands (L5) ------------------------------------------
  const distance = zC.negate();
  const blueShift = PALETTE_LAW.depthBandBlueShift;
  const bandColor = color(tokenHex(PALETTE_LAW, "blue")).rgb;
  let bandWeight: FloatNode = float(blueShift[0] ?? 0);
  config.depthBands.viewZBoundaries.forEach((boundary, index) => {
    const next = blueShift[index + 1] ?? blueShift[blueShift.length - 1] ?? 1;
    bandWeight = mix(bandWeight, float(next), step(boundary, distance));
  });

  // --- Palette clamp (A1) ---------------------------------------------------
  const gradedColor: Vec3Node = sceneColor.rgb.toVar();
  const outlined: Vec3Node = mix(gradedColor, inkColor, edge);
  const banded: Vec3Node = mix(outlined, bandColor, bandWeight).toVar();

  // Branchless nearest-declared search over the unrolled declared set:
  // exact for on-palette pixels (distance 0), a soft pull for AA edges.
  let bestDistance: FloatNode = float(1e9);
  let bestColor: Vec3Node = vec3(0);
  for (const declared of declaredColors(PALETTE_LAW)) {
    const candidate = color(declared.hex).rgb;
    const delta = banded.sub(candidate);
    const distanceSq = dot(delta, delta);
    const closer = step(distanceSq, bestDistance);
    bestColor = mix(bestColor, candidate, closer);
    bestDistance = min(bestDistance, distanceSq);
  }
  // Soft knee (config.knee is a ΔE scale; ~ΔE 100 ≈ 1.0 linear distance in
  // the palette's mid range — close enough for a soft pull, exact at 0).
  const pull = saturate(bestDistance.sqrt().mul(100 / config.clamp.knee)).mul(
    config.clamp.strength,
  );
  const clamped = vec4(mix(banded, bestColor, pull), 1);

  let postEnabled = true;
  pipeline.outputColorTransform = true;

  const applyOutput = (): void => {
    pipeline.outputNode = postEnabled ? clamped : sceneColor;
    pipeline.needsUpdate = true;
  };
  applyOutput();

  return {
    render: () => {
      pipeline.render();
    },
    capture: async (target: RenderTarget) => {
      renderer.setRenderTarget(target);
      pipeline.render();
      const pixels = await renderer.readRenderTargetPixelsAsync(
        target,
        0,
        0,
        target.width,
        target.height,
      );
      renderer.setRenderTarget(null);
      return pixels instanceof Uint8Array
        ? pixels
        : new Uint8Array(pixels.buffer, pixels.byteOffset, pixels.byteLength);
    },
    setPostEnabled: (enabled: boolean) => {
      postEnabled = enabled;
      applyOutput();
    },
    postEnabled: () => postEnabled,
  };
};
