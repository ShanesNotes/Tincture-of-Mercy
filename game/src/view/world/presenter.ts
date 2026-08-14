import { Group, type Object3D } from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";

import { SimClipPlayer } from "./animation";
import type {
  ActorPresentation,
  CharacterAssets,
  LoadedIronwoodAssets,
  WorldPresentation,
} from "./types";

interface ActorView {
  readonly root: Object3D;
  readonly animation: SimClipPlayer;
}

const lerp = (from: number, to: number, alpha: number): number => from + (to - from) * alpha;

const lerpAngle = (from: number, to: number, alpha: number): number => {
  const period = Math.PI * 2;
  const delta = ((((to - from) + Math.PI) % period) + period) % period - Math.PI;
  return from + delta * alpha;
};

const spawnCharacter = (assets: CharacterAssets): Object3D => {
  const clone = cloneSkeleton(assets.template);
  clone.name = `actor.${assets.character}`;
  return clone;
};

export class WorldActorPresenter {
  public readonly root = new Group();
  public readonly fallbackClips = new Set<string>();
  readonly #assets: LoadedIronwoodAssets;
  readonly #actors = new Map<string, ActorView>();
  readonly #previousById = new Map<string, ActorPresentation>();
  readonly #visibleIds = new Set<string>();

  public constructor(assets: LoadedIronwoodAssets) {
    this.#assets = assets;
    this.root.name = "world-actors";
  }

  #getActor(actor: ActorPresentation): ActorView {
    const existing = this.#actors.get(actor.id);
    if (existing !== undefined) return existing;
    const character = actor.kind === "player" ? "kalev" : "wolf";
    const assets = this.#assets.characters.get(character);
    if (assets === undefined) throw new Error(`missing ${character} character assets`);
    const root = spawnCharacter(assets);
    root.name = `actor.${actor.id}`;
    // The wrapper transform is driven only by the interpolated sim pose. Keep
    // it out of three's recursive auto-update walk and commit its matrix only
    // when that pose actually changes; animated bones below it remain auto.
    root.matrixAutoUpdate = false;
    root.updateMatrix();
    const view = {
      root,
      animation: new SimClipPlayer(root, assets, this.fallbackClips),
    };
    this.#actors.set(actor.id, view);
    this.root.add(root);
    return view;
  }

  public apply(
    previous: WorldPresentation,
    current: WorldPresentation,
    alpha: number,
  ): void {
    if (!Number.isFinite(alpha) || alpha < 0 || alpha >= 1) {
      throw new RangeError("world presentation alpha must be in [0, 1)");
    }
    this.#previousById.clear();
    for (const actor of previous.actors) this.#previousById.set(actor.id, actor);
    this.#visibleIds.clear();
    for (const actor of current.actors) {
      const prior = this.#previousById.get(actor.id) ?? actor;
      const view = this.#getActor(actor);
      this.#visibleIds.add(actor.id);
      view.root.visible = actor.alive;
      const x = lerp(prior.position.x, actor.position.x, alpha);
      const y = lerp(prior.position.y, actor.position.y, alpha);
      const z = lerp(prior.position.z, actor.position.z, alpha);
      const facing = lerpAngle(prior.facingRadians, actor.facingRadians, alpha);
      if (
        view.root.position.x !== x ||
        view.root.position.y !== y ||
        view.root.position.z !== z ||
        view.root.rotation.y !== facing
      ) {
        view.root.position.set(x, y, z);
        view.root.rotation.y = facing;
        view.root.updateMatrix();
      }
      const action = actor.action;
      if (actor.active) {
        view.animation.seek({
          move: action?.move ?? "idle",
          actionTick: action?.tick ?? current.tick,
          alpha,
        });
      }
    }
    for (const [id, view] of this.#actors) {
      if (!this.#visibleIds.has(id)) view.root.visible = false;
    }
  }

  public actorObject(id: string): Object3D | null {
    return this.#actors.get(id)?.root ?? null;
  }

  public dispose(): void {
    for (const view of this.#actors.values()) view.animation.dispose();
    this.#actors.clear();
    this.#previousById.clear();
    this.#visibleIds.clear();
    this.root.clear();
  }
}
