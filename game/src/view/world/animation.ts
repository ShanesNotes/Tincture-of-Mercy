import { AnimationMixer, LoopOnce, type AnimationAction, type Object3D } from "three";

import type { CharacterAssets } from "./types";

export interface AnimationSeek {
  readonly move: string;
  readonly actionTick: number;
  readonly alpha: number;
}

/**
 * Simulation-owned animation clock. Switching clips is discrete at a sim
 * action edge; every rendered frame seeks the active mixer to
 * (actionTick + alpha) / 60. No real-delta mixer update exists here.
 */
export class SimClipPlayer {
  readonly #assets: CharacterAssets;
  readonly #mixer: AnimationMixer;
  readonly #fallbacks: Set<string>;
  #activeMove: string | null = null;
  #activeAction: AnimationAction | null = null;

  public constructor(root: Object3D, assets: CharacterAssets, fallbacks: Set<string>) {
    this.#assets = assets;
    this.#mixer = new AnimationMixer(root);
    this.#fallbacks = fallbacks;
  }

  public seek(input: AnimationSeek): void {
    if (!Number.isFinite(input.actionTick) || input.actionTick < 0) {
      throw new RangeError("animation actionTick must be finite and non-negative");
    }
    if (!Number.isFinite(input.alpha) || input.alpha < 0 || input.alpha >= 1) {
      throw new RangeError("animation alpha must be in [0, 1)");
    }

    const requestedClip = this.#assets.visualClips[input.move];
    const neutralClip = this.#assets.visualClips.idle;
    const clipName = requestedClip ?? neutralClip;
    if (clipName === undefined) {
      throw new Error(`${this.#assets.character} has no visual clip for ${input.move} or idle`);
    }
    if (this.#activeMove !== input.move) {
      if (requestedClip === undefined) {
        this.#fallbacks.add(
          `${this.#assets.character}.${input.move}: unmapped action; using ${clipName}`,
        );
      } else {
        const declaredReason = this.#assets.fallbacks[input.move];
        if (declaredReason !== undefined) {
          this.#fallbacks.add(`${this.#assets.character}.${input.move}: ${declaredReason}`);
        }
      }
      const clip = this.#assets.animations.find((candidate) => candidate.name === clipName);
      if (clip === undefined) {
        throw new Error(`${this.#assets.character} GLB does not contain clip ${clipName}`);
      }
      this.#mixer.stopAllAction();
      const action = this.#mixer.clipAction(clip);
      action.reset();
      action.setLoop(LoopOnce, 1);
      action.clampWhenFinished = true;
      action.play();
      this.#activeAction = action;
      this.#activeMove = input.move;
    }

    // Sidecar binding is checked by the loader. Its 60 Hz clock is the
    // authority for this conversion even when a fallback GLB clip is shorter.
    // Neutral playback loops at the accepted sidecar boundary; committed
    // actions remain one-shot and clamp at the end of their visual fallback.
    const sidecar = this.#assets.sidecars.get(clipName);
    const actionTick =
      input.move === "idle" && sidecar !== undefined
        ? input.actionTick % sidecar.ticks
        : input.actionTick;
    this.#mixer.setTime((actionTick + input.alpha) / 60);
  }

  public dispose(): void {
    if (this.#activeAction !== null) this.#activeAction.stop();
    this.#mixer.stopAllAction();
    this.#mixer.uncacheRoot(this.#mixer.getRoot());
  }
}
