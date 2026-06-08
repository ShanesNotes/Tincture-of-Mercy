## RDPipelineShader <- RefCounted

Wraps a shader resource and allows specialization constants to be applied at pipeline creation time. Used by `RenderingDevice.raytracing_pipeline_create` for ray generation, miss, and hit shaders. The pipeline selects the required shader stage automatically.

**Props:**
- Shader: Rid = RID()
- SpecializationConstants: RDPipelineSpecializationConstant[] = []

- **shader**: Shader resource. The required stage is selected by the pipeline.
- **specialization_constants**: Specialization constants applied to the selected shader stage at pipeline creation time.

