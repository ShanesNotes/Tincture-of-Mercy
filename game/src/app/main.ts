import {
  BoxGeometry,
  Color,
  Mesh,
  MeshBasicNodeMaterial,
  PerspectiveCamera,
  Scene,
  TSL,
} from "three/webgpu";

import { createSimState, type SimState } from "../sim/state";
import { stepTick } from "../sim/tick";
import { bootRenderer } from "../view/renderer";
import { FixedTickLoop, startAnimationLoop } from "./loop";

const makeCanvas = (): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.dataset.testid = "game-canvas";
  canvas.setAttribute("aria-label", "Tincture of Mercy game view");
  return canvas;
};

export const bootApp = async (): Promise<void> => {
  const mount = document.querySelector<HTMLElement>("#app");
  if (mount === null) {
    throw new Error("Missing #app mount point.");
  }

  document.body.dataset.bootStatus = "loading";
  const canvas = makeCanvas();
  mount.append(canvas);

  const forceWebGL = new URLSearchParams(window.location.search).get("renderer") === "webgl2";
  const boot = await bootRenderer(canvas, { forceWebGL });
  document.body.dataset.rendererBackend = boot.backend;

  const scene = new Scene();
  scene.background = new Color("#f8f1e5");
  const camera = new PerspectiveCamera(44, 1, 0.1, 1_000);
  camera.position.set(0, 0, 4);

  const material = new MeshBasicNodeMaterial();
  material.colorNode = TSL.color("#a87a2e");
  const marker = new Mesh(new BoxGeometry(1, 1.6, 0.3), material);
  scene.add(marker);

  const resize = (): void => {
    const width = Math.max(window.innerWidth, 1);
    const height = Math.max(window.innerHeight, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    boot.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    boot.renderer.setSize(width, height);
  };
  resize();
  window.addEventListener("resize", resize);

  let state: SimState = createSimState(0x544f_4d31);
  const loop = new FixedTickLoop({
    render: (alpha) => {
      marker.rotation.y = (state.tick + alpha) * 0.01;
      document.body.dataset.simTick = String(state.tick);
      boot.renderer.render(scene, camera);
    },
    step: () => {
      state = stepTick(state, []);
    },
  });

  document.body.dataset.simTick = String(state.tick);
  startAnimationLoop(loop);
  document.body.dataset.bootStatus = "ready";
};
