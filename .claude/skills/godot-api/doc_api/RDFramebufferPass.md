## RDFramebufferPass <- RefCounted

This class contains the list of attachment descriptions for a framebuffer pass. Each points with an index to a previously supplied list of texture attachments. Multipass framebuffers can optimize some configurations in mobile. On desktop, they provide little to no advantage. This object is used by RenderingDevice.

**Props:**
- ColorAttachments: int[] = PackedInt32Array()
- DepthAttachment: int = -1
- InputAttachments: int[] = PackedInt32Array()
- PreserveAttachments: int[] = PackedInt32Array()
- ResolveAttachments: int[] = PackedInt32Array()

- **color_attachments**: Color attachments in order starting from 0. If this attachment is not used by the shader, pass ATTACHMENT_UNUSED to skip.
- **depth_attachment**: Depth attachment. ATTACHMENT_UNUSED should be used if no depth buffer is required for this pass.
- **input_attachments**: Used for multipass framebuffers (more than one render pass). Converts an attachment to an input. Make sure to also supply it properly in the RDUniform for the uniform set.
- **preserve_attachments**: Attachments to preserve in this pass (otherwise they are erased).
- **resolve_attachments**: If the color attachments are multisampled, non-multisampled resolve attachments can be provided.

**Enums:**
**Constants:** ATTACHMENT_UNUSED=-1
  - ATTACHMENT_UNUSED: Attachment is unused.

