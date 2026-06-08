## RDShaderSPIRV <- Resource

RDShaderSPIRV represents an RDShaderFile's code for various shader stages, as well as possible compilation error messages. SPIR-V is a low-level intermediate shader representation. This intermediate representation is not used directly by GPUs for rendering, but it can be compiled into binary shaders that GPUs can understand. Unlike compiled shaders, SPIR-V is portable across GPU models and driver versions. This object is used by RenderingDevice.

**Props:**
- BytecodeAnyHit: byte[] = PackedByteArray()
- BytecodeClosestHit: byte[] = PackedByteArray()
- BytecodeCompute: byte[] = PackedByteArray()
- BytecodeFragment: byte[] = PackedByteArray()
- BytecodeIntersection: byte[] = PackedByteArray()
- BytecodeMiss: byte[] = PackedByteArray()
- BytecodeRaygen: byte[] = PackedByteArray()
- BytecodeTesselationControl: byte[] = PackedByteArray()
- BytecodeTesselationEvaluation: byte[] = PackedByteArray()
- BytecodeVertex: byte[] = PackedByteArray()
- CompileErrorAnyHit: string = ""
- CompileErrorClosestHit: string = ""
- CompileErrorCompute: string = ""
- CompileErrorFragment: string = ""
- CompileErrorIntersection: string = ""
- CompileErrorMiss: string = ""
- CompileErrorRaygen: string = ""
- CompileErrorTesselationControl: string = ""
- CompileErrorTesselationEvaluation: string = ""
- CompileErrorVertex: string = ""

- **bytecode_any_hit**: The SPIR-V bytecode for the any hit shader stage.
- **bytecode_closest_hit**: The SPIR-V bytecode for the closest hit shader stage.
- **bytecode_compute**: The SPIR-V bytecode for the compute shader stage.
- **bytecode_fragment**: The SPIR-V bytecode for the fragment shader stage.
- **bytecode_intersection**: The SPIR-V bytecode for the intersection shader stage.
- **bytecode_miss**: The SPIR-V bytecode for the miss shader stage.
- **bytecode_raygen**: The SPIR-V bytecode for the ray generation shader stage.
- **bytecode_tesselation_control**: The SPIR-V bytecode for the tessellation control shader stage.
- **bytecode_tesselation_evaluation**: The SPIR-V bytecode for the tessellation evaluation shader stage.
- **bytecode_vertex**: The SPIR-V bytecode for the vertex shader stage.
- **compile_error_any_hit**: The compilation error message for the any hit shader stage (set by the SPIR-V compiler and Godot). If empty, shader compilation was successful.
- **compile_error_closest_hit**: The compilation error message for the closest hit shader stage (set by the SPIR-V compiler and Godot). If empty, shader compilation was successful.
- **compile_error_compute**: The compilation error message for the compute shader stage (set by the SPIR-V compiler and Godot). If empty, shader compilation was successful.
- **compile_error_fragment**: The compilation error message for the fragment shader stage (set by the SPIR-V compiler and Godot). If empty, shader compilation was successful.
- **compile_error_intersection**: The compilation error message for the intersection shader stage (set by the SPIR-V compiler and Godot). If empty, shader compilation was successful.
- **compile_error_miss**: The compilation error message for the miss shader stage (set by the SPIR-V compiler and Godot). If empty, shader compilation was successful.
- **compile_error_raygen**: The compilation error message for the ray generation shader stage (set by the SPIR-V compiler and Godot). If empty, shader compilation was successful.
- **compile_error_tesselation_control**: The compilation error message for the tessellation control shader stage (set by the SPIR-V compiler and Godot). If empty, shader compilation was successful.
- **compile_error_tesselation_evaluation**: The compilation error message for the tessellation evaluation shader stage (set by the SPIR-V compiler and Godot). If empty, shader compilation was successful.
- **compile_error_vertex**: The compilation error message for the vertex shader stage (set by the SPIR-V compiler and Godot). If empty, shader compilation was successful.

**Methods:**
- GetStageBytecode(int stage) -> byte[] - Equivalent to getting one of `bytecode_compute`, `bytecode_fragment`, `bytecode_tesselation_control`, `bytecode_tesselation_evaluation`, `bytecode_vertex`.
- GetStageCompileError(int stage) -> string - Returns the compilation error message for the given shader `stage`. Equivalent to getting one of `compile_error_compute`, `compile_error_fragment`, `compile_error_tesselation_control`, `compile_error_tesselation_evaluation`, `compile_error_vertex`.
- SetStageBytecode(int stage, byte[] bytecode) - Sets the SPIR-V `bytecode` for the given shader `stage`. Equivalent to setting one of `bytecode_compute`, `bytecode_fragment`, `bytecode_tesselation_control`, `bytecode_tesselation_evaluation`, `bytecode_vertex`.
- SetStageCompileError(int stage, string compileError) - Sets the compilation error message for the given shader `stage` to `compile_error`. Equivalent to setting one of `compile_error_compute`, `compile_error_fragment`, `compile_error_tesselation_control`, `compile_error_tesselation_evaluation`, `compile_error_vertex`.

