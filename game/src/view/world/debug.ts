import {
  Color,
  CapsuleGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  Vector3,
} from "three";

import type { ActorPresentation, Point3 } from "./types";

interface CapsuleMesh {
  readonly mesh: Mesh;
  readonly material: MeshBasicMaterial;
}

const Y_AXIS = new Vector3(0, 1, 0);

const point = (value: Point3): Vector3 => new Vector3(value.x, value.y, value.z);

const setCapsuleTransform = (
  entry: CapsuleMesh,
  start: Point3,
  end: Point3,
  radius: number,
): void => {
  const from = point(start);
  const to = point(end);
  const axis = to.clone().sub(from);
  const length = axis.length();
  entry.mesh.geometry.dispose();
  entry.mesh.geometry = new CapsuleGeometry(radius, length, 4, 8);
  entry.mesh.position.copy(from).add(to).multiplyScalar(0.5);
  entry.mesh.quaternion.copy(
    length > 1e-8 ? new Quaternion().setFromUnitVectors(Y_AXIS, axis.normalize()) : new Quaternion(),
  );
};

/** Debug-only wire capsules. Data is copied exclusively from WorldPresentation. */
export class SimCapsuleOverlay {
  public readonly root = new Group();
  readonly #pool: CapsuleMesh[] = [];

  public constructor(enabled: boolean) {
    this.root.name = "sim-capsule-overlay";
    this.root.visible = enabled;
  }

  #entry(index: number): CapsuleMesh {
    const existing = this.#pool[index];
    if (existing !== undefined) return existing;
    const material = new MeshBasicMaterial({
      color: new Color("#365a49"),
      depthTest: false,
      transparent: true,
      opacity: 0.85,
      wireframe: true,
    });
    const mesh = new Mesh(new CapsuleGeometry(0.1, 0.1, 4, 8), material);
    mesh.renderOrder = 10_000;
    const entry = { mesh, material };
    this.#pool.push(entry);
    this.root.add(mesh);
    return entry;
  }

  public apply(actors: readonly ActorPresentation[]): void {
    if (!this.root.visible) return;
    let cursor = 0;
    for (const actor of actors) {
      for (const capsule of actor.hurtboxes) {
        const entry = this.#entry(cursor);
        cursor += 1;
        entry.mesh.visible = true;
        entry.material.color.set(actor.invulnerable ? "#f8f1e5" : "#365a49");
        setCapsuleTransform(entry, capsule.start, capsule.end, capsule.radius);
      }
      for (const capsule of actor.hitboxes) {
        const entry = this.#entry(cursor);
        cursor += 1;
        entry.mesh.visible = true;
        entry.material.color.set("#7e2531");
        setCapsuleTransform(entry, capsule.start, capsule.end, capsule.radius);
      }
    }
    for (let index = cursor; index < this.#pool.length; index += 1) {
      const entry = this.#pool[index];
      if (entry !== undefined) entry.mesh.visible = false;
    }
  }

  public dispose(): void {
    for (const entry of this.#pool) {
      entry.mesh.geometry.dispose();
      entry.material.dispose();
    }
    this.#pool.length = 0;
    this.root.clear();
  }
}
