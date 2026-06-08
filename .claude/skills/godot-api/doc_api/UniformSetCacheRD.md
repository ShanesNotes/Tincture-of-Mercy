## UniformSetCacheRD <- Object

Uniform set cache manager for RenderingDevice-based renderers. Provides a way to create a uniform set and reuse it in subsequent calls for as long as the uniform set exists. Uniform set will automatically be cleaned up when dependent objects are freed.

**Methods:**
- GetCache(Rid shader, int set, RDUniform[] uniforms) -> Rid - Creates/returns a cached uniform set based on the provided uniforms for a given shader.

