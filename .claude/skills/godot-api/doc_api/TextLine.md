## TextLine <- RefCounted

Abstraction over TextServer for handling a single line of text.

**Props:**
- Alignment: int (HorizontalAlignment) = 0
- Direction: int (TextServer.Direction) = 0
- EllipsisChar: string = "…"
- Flags: int (TextServer.JustificationFlag) = 3
- Orientation: int (TextServer.Orientation) = 0
- PreserveControl: bool = false
- PreserveInvalid: bool = true
- TextOverrunBehavior: int (TextServer.OverrunBehavior) = 3
- Width: float = -1.0

- **alignment**: Sets text alignment within the line as if the line was horizontal.
- **direction**: Text writing direction.
- **ellipsis_char**: Ellipsis character used for text clipping.
- **flags**: Line alignment rules. For more info see TextServer.
- **orientation**: Text orientation.
- **preserve_control**: If set to `true` text will display control characters.
- **preserve_invalid**: If set to `true` text will display invalid characters.
- **text_overrun_behavior**: The clipping behavior when the text exceeds the text line's set width.
- **width**: Text line width.

**Methods:**
- AddObject(Variant key, Vector2 size, int inlineAlign = 5, int length = 1, float baseline = 0.0) -> bool - Adds inline object to the text buffer, `key` must be unique. In the text, object is represented as `length` object replacement characters.
- AddString(string text, Font font, int fontSize, string language = "", Variant meta = null) -> bool - Adds text span and font to draw it.
- Clear() - Clears text line (removes text and inline objects).
- Draw(Rid canvas, Vector2 pos, Color color = Color(1, 1, 1, 1), float oversampling = 0.0) - Draw text into a canvas item at a given position, with `color`. `pos` specifies the top left corner of the bounding box. If `oversampling` is greater than zero, it is used as font oversampling factor, otherwise viewport oversampling settings are used.
- DrawOutline(Rid canvas, Vector2 pos, int outlineSize = 1, Color color = Color(1, 1, 1, 1), float oversampling = 0.0) - Draw text into a canvas item at a given position, with `color`. `pos` specifies the top left corner of the bounding box. If `oversampling` is greater than zero, it is used as font oversampling factor, otherwise viewport oversampling settings are used.
- Duplicate() -> TextLine - Duplicates this TextLine.
- GetInferredDirection() -> int - Returns the text writing direction inferred by the BiDi algorithm.
- GetLineAscent() -> float - Returns the text ascent (number of pixels above the baseline for horizontal layout or to the left of baseline for vertical).
- GetLineDescent() -> float - Returns the text descent (number of pixels below the baseline for horizontal layout or to the right of baseline for vertical).
- GetLineUnderlinePosition() -> float - Returns pixel offset of the underline below the baseline.
- GetLineUnderlineThickness() -> float - Returns thickness of the underline.
- GetLineWidth() -> float - Returns width (for horizontal layout) or height (for vertical) of the text.
- GetObjectRect(Variant key) -> Rect2 - Returns bounding rectangle of the inline object.
- GetObjects() -> Godot.Collections.Array - Returns array of inline objects.
- GetRid() -> Rid - Returns TextServer buffer RID.
- GetSize() -> Vector2 - Returns size of the bounding box of the text.
- HasObject(Variant key) -> bool - Returns `true` if an object with `key` is embedded in this line.
- HitTest(float coords) -> int - Returns caret character offset at the specified pixel offset at the baseline. This function always returns a valid position.
- ResizeObject(Variant key, Vector2 size, int inlineAlign = 5, float baseline = 0.0) -> bool - Sets new size and alignment of embedded object.
- SetBidiOverride(Godot.Collections.Array override) - Overrides BiDi for the structured text. Override ranges should cover full source text without overlaps. BiDi algorithm will be used on each range separately.
- TabAlign(float[] tabStops) - Aligns text to the given tab-stops.

