## LabelSettings <- Resource

LabelSettings is a resource that provides common settings to customize the text in a Label. It will take priority over the properties defined in `Control.theme`. The resource can be shared between multiple labels and changed on the fly, so it's convenient and flexible way to setup text style.

**Props:**
- Font: Font
- FontColor: Color = Color(1, 1, 1, 1)
- FontSize: int = 16
- LineSpacing: float = 3.0
- OutlineColor: Color = Color(1, 1, 1, 1)
- OutlineSize: int = 0
- ParagraphSpacing: float = 0.0
- ShadowColor: Color = Color(0, 0, 0, 0)
- ShadowOffset: Vector2 = Vector2(1, 1)
- ShadowSize: int = 1
- StackedOutlineCount: int = 0
- StackedOutline{index}/color: Color = Color(0, 0, 0, 1)
- StackedOutline{index}/size: int = 0
- StackedShadowCount: int = 0
- StackedShadow{index}/color: Color = Color(0, 0, 0, 1)
- StackedShadow{index}/offset: Vector2 = Vector2i(1, 1)
- StackedShadow{index}/outlineSize: int = 0

- **font**: Font used for the text.
- **font_color**: Color of the text.
- **font_size**: Size of the text.
- **line_spacing**: Additional vertical spacing between lines (in pixels), spacing is added to line descent. This value can be negative.
- **outline_color**: The color of the outline.
- **outline_size**: Text outline size.
- **paragraph_spacing**: Vertical space between paragraphs. Added on top of `line_spacing`.
- **shadow_color**: Color of the shadow effect. If alpha is `0`, no shadow will be drawn.
- **shadow_offset**: Offset of the shadow effect, in pixels.
- **shadow_size**: Size of the shadow effect.
- **stacked_outline_count**: The number of stacked outlines.
- **stacked_outline_{index}/color**: The color of the outline at `index`. **Note:** `index` is a value in the `0 .. stacked_outline_count - 1` range.
- **stacked_outline_{index}/size**: The size of the outline at `index`. **Note:** `index` is a value in the `0 .. stacked_outline_count - 1` range.
- **stacked_shadow_count**: The number of stacked shadows.
- **stacked_shadow_{index}/color**: The color of the shadow at `index`. **Note:** `index` is a value in the `0 .. stacked_shadow_count - 1` range.
- **stacked_shadow_{index}/offset**: The offset of the shadow at `index`. **Note:** `index` is a value in the `0 .. stacked_shadow_count - 1` range.
- **stacked_shadow_{index}/outline_size**: The size of the shadow outline at `index`. **Note:** `index` is a value in the `0 .. stacked_shadow_count - 1` range.

**Methods:**
- AddStackedOutline(int index = -1) - Adds a new stacked outline to the label at the given `index`. If `index` is `-1`, the new stacked outline will be added at the end of the list.
- AddStackedShadow(int index = -1) - Adds a new stacked shadow to the label at the given `index`. If `index` is `-1`, the new stacked shadow will be added at the end of the list.
- GetStackedOutlineColor(int index) -> Color - Returns the color of the stacked outline at `index`.
- GetStackedOutlineSize(int index) -> int - Returns the size of the stacked outline at `index`.
- GetStackedShadowColor(int index) -> Color - Returns the color of the stacked shadow at `index`.
- GetStackedShadowOffset(int index) -> Vector2 - Returns the offset of the stacked shadow at `index`.
- GetStackedShadowOutlineSize(int index) -> int - Returns the outline size of the stacked shadow at `index`.
- MoveStackedOutline(int fromIndex, int toPosition) - Moves the stacked outline at index `from_index` to the given position `to_position` in the array.
- MoveStackedShadow(int fromIndex, int toPosition) - Moves the stacked shadow at index `from_index` to the given position `to_position` in the array.
- RemoveStackedOutline(int index) - Removes the stacked outline at index `index`.
- RemoveStackedShadow(int index) - Removes the stacked shadow at index `index`.
- SetStackedOutlineColor(int index, Color color) - Sets the color of the stacked outline identified by the given `index` to `color`.
- SetStackedOutlineSize(int index, int size) - Sets the size of the stacked outline identified by the given `index` to `size`.
- SetStackedShadowColor(int index, Color color) - Sets the color of the stacked shadow identified by the given `index` to `color`.
- SetStackedShadowOffset(int index, Vector2 offset) - Sets the offset of the stacked shadow identified by the given `index` to `offset`.
- SetStackedShadowOutlineSize(int index, int size) - Sets the outline size of the stacked shadow identified by the given `index` to `size`.

