## RDUniform <- RefCounted

This object is used by RenderingDevice.

**Props:**
- Binding: int = 0
- UniformType: int (RenderingDevice.UniformType) = 3

- **binding**: The uniform's binding.
- **uniform_type**: The uniform's data type.

**Methods:**
- AddId(Rid id) - Binds the given id to the uniform. The data associated with the id is then used when the uniform is passed to a shader.
- ClearIds() - Unbinds all ids currently bound to the uniform.
- GetIds() -> RID[] - Returns an array of all ids currently bound to the uniform.

