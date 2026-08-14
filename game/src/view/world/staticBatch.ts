import { Mesh, type Material, type Object3D } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import {
  rampMaterial,
  type RampBinding,
} from "../register/materials";

export type RegisterMaterialPool = Map<string, Material>;

const bindingKey = (binding: RampBinding): string =>
  JSON.stringify([
    binding.family,
    binding.cell,
    binding.uvScale,
    binding.lineStrength,
    binding.shadeByPattern,
    binding.edges ?? [],
    binding.lineToken ?? null,
  ]);

const materialsOf = (material: Material | Material[]): readonly Material[] =>
  Array.isArray(material) ? material : [material];

/** Rebind an imported subtree to one pooled register material. */
export const stripToPooledRegister = (
  root: Object3D,
  binding: RampBinding,
  pool: RegisterMaterialPool,
): Material => {
  const key = bindingKey(binding);
  let material = pool.get(key);
  if (material === undefined) {
    material = rampMaterial(binding);
    pool.set(key, material);
  }

  const imported = new Set<Material>();
  root.traverse((child) => {
    const mesh = child as Mesh;
    if (mesh.isMesh !== true) return;
    for (const source of materialsOf(mesh.material)) {
      if (source !== material) imported.add(source);
    }
    mesh.material = material;
  });
  for (const source of imported) source.dispose();
  return material;
};

/**
 * Bake the transforms of a static GLB zone and merge its register-identical
 * meshes. Zones remain separate, retaining the useful authored frustum-cull
 * granularity while replacing dozens of submissions with one.
 */
export const batchStaticZone = (root: Object3D, material: Material): number => {
  root.updateMatrixWorld(true);
  const meshes: Mesh[] = [];
  root.traverse((child) => {
    const mesh = child as Mesh;
    if (mesh.isMesh !== true) return;
    if ((mesh as Mesh & { readonly isSkinnedMesh?: boolean }).isSkinnedMesh === true) {
      throw new Error(`Static level zone ${root.name} contains a skinned mesh.`);
    }
    meshes.push(mesh);
  });
  if (meshes.length <= 1) return meshes.length;

  const transformed = meshes.map((mesh) => mesh.geometry.clone().applyMatrix4(mesh.matrixWorld));
  const merged = mergeGeometries(transformed, false);
  for (const geometry of transformed) geometry.dispose();
  if (merged === null) {
    throw new Error(`Static level zone ${root.name} has incompatible mesh attributes.`);
  }
  merged.computeBoundingBox();
  merged.computeBoundingSphere();

  for (const mesh of meshes) mesh.geometry.dispose();
  root.clear();
  root.position.set(0, 0, 0);
  root.rotation.set(0, 0, 0);
  root.scale.set(1, 1, 1);
  root.updateMatrixWorld(true);
  const batched = new Mesh(merged, material);
  batched.name = `${root.name}.static-batch`;
  root.add(batched);
  return meshes.length;
};
