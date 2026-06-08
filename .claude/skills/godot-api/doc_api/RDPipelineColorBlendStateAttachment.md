## RDPipelineColorBlendStateAttachment <- RefCounted

Controls how blending between source and destination fragments is performed when using RenderingDevice. For reference, this is how common user-facing blend modes are implemented in Godot's 2D renderer: **Mix:** **Add:** **Subtract:** **Multiply:** **Pre-multiplied alpha:**

**Props:**
- AlphaBlendOp: int (RenderingDevice.BlendOperation) = 0
- ColorBlendOp: int (RenderingDevice.BlendOperation) = 0
- DstAlphaBlendFactor: int (RenderingDevice.BlendFactor) = 0
- DstColorBlendFactor: int (RenderingDevice.BlendFactor) = 0
- EnableBlend: bool = false
- SrcAlphaBlendFactor: int (RenderingDevice.BlendFactor) = 0
- SrcColorBlendFactor: int (RenderingDevice.BlendFactor) = 0
- WriteA: bool = true
- WriteB: bool = true
- WriteG: bool = true
- WriteR: bool = true

- **alpha_blend_op**: The blend mode to use for the alpha channel.
- **color_blend_op**: The blend mode to use for the red/green/blue color channels.
- **dst_alpha_blend_factor**: Controls how the blend factor for the alpha channel is determined based on the destination's fragments.
- **dst_color_blend_factor**: Controls how the blend factor for the color channels is determined based on the destination's fragments.
- **enable_blend**: If `true`, performs blending between the source and destination according to the factors defined in `src_color_blend_factor`, `dst_color_blend_factor`, `src_alpha_blend_factor` and `dst_alpha_blend_factor`. The blend modes `color_blend_op` and `alpha_blend_op` are also taken into account, with `write_r`, `write_g`, `write_b` and `write_a` controlling the output.
- **src_alpha_blend_factor**: Controls how the blend factor for the alpha channel is determined based on the source's fragments.
- **src_color_blend_factor**: Controls how the blend factor for the color channels is determined based on the source's fragments.
- **write_a**: If `true`, writes the new alpha channel to the final result.
- **write_b**: If `true`, writes the new blue color channel to the final result.
- **write_g**: If `true`, writes the new green color channel to the final result.
- **write_r**: If `true`, writes the new red color channel to the final result.

**Methods:**
- SetAsMix() - Convenience method to perform standard mix blending with straight (non-premultiplied) alpha. This sets `enable_blend` to `true`, `src_color_blend_factor` to `RenderingDevice.BLEND_FACTOR_SRC_ALPHA`, `dst_color_blend_factor` to `RenderingDevice.BLEND_FACTOR_ONE_MINUS_SRC_ALPHA`, `src_alpha_blend_factor` to `RenderingDevice.BLEND_FACTOR_SRC_ALPHA` and `dst_alpha_blend_factor` to `RenderingDevice.BLEND_FACTOR_ONE_MINUS_SRC_ALPHA`.

