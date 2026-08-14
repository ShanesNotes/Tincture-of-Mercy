import { Box3, BoxGeometry, Group, Mesh, MeshBasicMaterial, Vector3 } from "three";
import { describe, expect, it } from "vitest";

import { auditRegisterMaterials } from "../register/materials";
import { ATLAS } from "../register/patterns";
import { batchStaticZone, stripToPooledRegister } from "./staticBatch";

describe("static world batching", () => {
  it("bakes world transforms into one register-bound zone mesh", () => {
    const root = new Group();
    root.name = "zone.test";
    const left = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial());
    const right = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial());
    left.position.x = -2;
    right.position.x = 2;
    root.add(left, right);

    const material = stripToPooledRegister(
      root,
      {
        family: "muted",
        cell: ATLAS.GRANITE,
        uvScale: 1,
        lineStrength: 0.2,
        shadeByPattern: 0.2,
      },
      new Map(),
    );
    expect(batchStaticZone(root, material)).toBe(2);

    const meshes: Mesh[] = [];
    root.traverse((child) => {
      if ((child as Mesh).isMesh === true) meshes.push(child as Mesh);
    });
    expect(meshes).toHaveLength(1);
    expect(auditRegisterMaterials(root)).toEqual([]);
    const bounds = new Box3().setFromObject(root);
    expect(bounds.min.x).toBeCloseTo(-2.5);
    expect(bounds.max.x).toBeCloseTo(2.5);
    expect(bounds.getCenter(new Vector3()).x).toBeCloseTo(0);
  });
});
