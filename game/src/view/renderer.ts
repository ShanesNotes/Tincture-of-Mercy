import { WebGPURenderer } from "three/webgpu";

export interface RendererLawConfig {
  readonly depthOfField: boolean;
  readonly fog: boolean;
  readonly fovPunch: boolean;
  readonly lensFlare: boolean;
  readonly motionBlur: boolean;
  readonly shake: boolean;
}

export const RENDERER_LAW_DEFAULTS: RendererLawConfig = {
  depthOfField: false,
  fog: false,
  fovPunch: false,
  lensFlare: false,
  motionBlur: false,
  shake: false,
};

export type RendererBackendName = "webgl2" | "webgpu";

export interface RendererBootOptions {
  readonly forceWebGL?: boolean;
  readonly laws?: RendererLawConfig;
}

export interface RendererBootResult {
  readonly backend: RendererBackendName;
  readonly renderer: WebGPURenderer;
  readonly reversedDepthBuffer: boolean;
}

export const assertRendererLaws = (config: RendererLawConfig): void => {
  const enabled = Object.entries(config).find(([, value]) => value);
  if (enabled !== undefined) {
    throw new Error(`Renderer law L1 forbids enabling ${enabled[0]}.`);
  }
};

const backendName = (renderer: WebGPURenderer): RendererBackendName => {
  const backend: object = renderer.backend;
  return "isWebGPUBackend" in backend && backend.isWebGPUBackend === true ? "webgpu" : "webgl2";
};

export const bootRenderer = async (
  canvas: HTMLCanvasElement,
  options: RendererBootOptions = {},
): Promise<RendererBootResult> => {
  assertRendererLaws(options.laws ?? RENDERER_LAW_DEFAULTS);
  const renderer = new WebGPURenderer({
    antialias: true,
    canvas,
    forceWebGL: options.forceWebGL ?? false,
    reversedDepthBuffer: true,
  });
  await renderer.init();

  return {
    backend: backendName(renderer),
    renderer,
    reversedDepthBuffer: renderer.reversedDepthBuffer,
  };
};
