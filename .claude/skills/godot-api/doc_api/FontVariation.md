## FontVariation <- Font

Provides OpenType variations, simulated bold / slant, and additional font settings like OpenType features and extra spacing. To use simulated bold font variant: To set the coordinate of multiple variation axes:

**Props:**
- BaseFont: Font
- BaselineOffset: float = 0.0
- OpentypeFeatures: Godot.Collections.Dictionary = {}
- PaletteCustomColors: Color[] = PackedColorArray()
- PaletteIndex: int = 0
- SpacingBottom: int = 0
- SpacingGlyph: int = 0
- SpacingSpace: int = 0
- SpacingTop: int = 0
- VariationEmbolden: float = 0.0
- VariationFaceIndex: int = 0
- VariationOpentype: Godot.Collections.Dictionary = {}
- VariationTransform: Transform2D = Transform2D(1, 0, 0, 1, 0, 0)

- **base_font**: Base font used to create a variation. If not set, default Theme font is used.
- **baseline_offset**: Extra baseline offset (as a fraction of font height).
- **opentype_features**: A set of OpenType feature tags. More info: .
- **palette_custom_colors**: An array of colors to override predefined palette. Use `Color(0, 0, 0, 0)`, to keep predefined palette color at specific position.
- **palette_index**: A palette index.
- **spacing_bottom**: Extra spacing at the bottom of the line in pixels.
- **spacing_glyph**: Extra spacing between graphical glyphs.
- **spacing_space**: Extra width of the space glyphs.
- **spacing_top**: Extra spacing at the top of the line in pixels.
- **variation_embolden**: If is not equal to zero, emboldens the font outlines. Negative values reduce the outline thickness. **Note:** Emboldened fonts might have self-intersecting outlines, which will prevent MSDF fonts and TextMesh from working correctly.
- **variation_face_index**: Active face index in the TrueType / OpenType collection file.
- **variation_opentype**: Font OpenType variation coordinates. More info: . **Note:** This Dictionary uses OpenType tags as keys. Variation axes can be identified both by tags ([int], e.g. `0x77678674`) and names (String, e.g. `wght`). Some axes might be accessible by multiple names. For example, `wght` refers to the same axis as `weight`. Tags on the other hand are unique. To convert between names and tags, use `TextServer.name_to_tag` and `TextServer.tag_to_name`. **Note:** To get available variation axes of a font, use `Font.get_supported_variation_list`.
- **variation_transform**: 2D transform, applied to the font outlines, can be used for slanting, flipping and rotating glyphs. For example, to simulate italic typeface by slanting, apply the following transform `Transform2D(1.0, slant, 0.0, 1.0, 0.0, 0.0)`.

**Methods:**
- SetSpacing(int spacing, int value) - Sets the spacing for `spacing` to `value` in pixels (not relative to the font size).

