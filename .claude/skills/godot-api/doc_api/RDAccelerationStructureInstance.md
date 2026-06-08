## RDAccelerationStructureInstance <- RefCounted

RDAccelerationStructureInstance describes an instance of a Bottom-Level Acceleration Structure (BLAS) used in the `RenderingDevice.tlas_build` method.

**Props:**
- Blas: Rid = RID()
- Flags: int (RenderingDevice.AccelerationStructureInstanceFlagBits) = 0
- HitSbtRange: int = 0
- Id: int = 0
- Mask: int = 255
- Transform: Transform3D = Transform3D(1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0)

- **blas**: The BLAS referenced by this instance. If `null`, the instance is treated as a placeholder but still contributes to `gl_InstanceIndex` in GLSL.
- **flags**: Flags for the instance.
- **hit_sbt_range**: Hit shader binding table range used for this instance, allocated using the `RenderingDevice.hit_sbt_range_alloc` method.
- **id**: Custom instance ID that can be accessed in GLSL using `gl_InstanceCustomIndexEXT`.
- **mask**: Visibility mask used to control which rays can intersect this instance.
- **transform**: Transform applied to the referenced BLAS for this instance.

