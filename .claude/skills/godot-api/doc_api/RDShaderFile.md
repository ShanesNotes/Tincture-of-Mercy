## RDShaderFile <- Resource

Compiled shader file in SPIR-V form. See also RDShaderSource. RDShaderFile is only meant to be used with the RenderingDevice API. It should not be confused with Godot's own Shader resource, which is what Godot's various nodes use for high-level shader programming.

**Props:**
- BaseError: string = ""

- **base_error**: The base compilation error message, which indicates errors not related to a specific shader stage if non-empty. If empty, shader compilation is not necessarily successful (check RDShaderSPIRV's error message members).

**Methods:**
- GetSpirv(StringName version = &"") -> RDShaderSPIRV - Returns the SPIR-V intermediate representation for the specified shader `version`.
- GetVersionList() -> StringName[] - Returns the list of compiled versions for this shader.
- SetBytecode(RDShaderSPIRV bytecode, StringName version = &"") - Sets the SPIR-V `bytecode` that will be compiled for the specified `version`.

