## RDHitGroup <- RefCounted

Defines a hit group for use with `RenderingDevice.raytracing_pipeline_create`. A hit group combines shaders that are executed when a ray intersects geometry. It may include a closest-hit shader, any-hit shader, and intersection shader. Hit groups are referenced by index when populating hit shader binding tables using `RenderingDevice.hit_sbt_range_update`.

**Props:**
- AnyHitShader: RDPipelineShader
- ClosestHitShader: RDPipelineShader
- IntersectionShader: RDPipelineShader

- **any_hit_shader**: Any-hit shader for this hit group. Executed for each potential intersection. Can be `null`.
- **closest_hit_shader**: Closest-hit shader for this hit group. Executed for the closest intersection. Can be `null`.
- **intersection_shader**: Intersection shader for this hit group. Required for non-triangle geometry. Must be `null` when using for triangle geometry.

