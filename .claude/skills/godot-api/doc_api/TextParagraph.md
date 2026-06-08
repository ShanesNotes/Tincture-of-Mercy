## TextParagraph <- RefCounted

Abstraction over TextServer for handling a single paragraph of text.

**Props:**
- Alignment: int (HorizontalAlignment) = 0
- BreakFlags: int (TextServer.LineBreakFlag) = 3
- CustomPunctuation: string = ""
- Direction: int (TextServer.Direction) = 0
- EllipsisChar: string = "…"
- JustificationFlags: int (TextServer.JustificationFlag) = 163
- LineSpacing: float = 0.0
- MaxLinesVisible: int = -1
- Orientation: int (TextServer.Orientation) = 0
- PreserveControl: bool = false
- PreserveInvalid: bool = true
- TextOverrunBehavior: int (TextServer.OverrunBehavior) = 0
- Width: float = -1.0

- **alignment**: Paragraph horizontal alignment.
- **break_flags**: Line breaking rules. For more info see TextServer.
- **custom_punctuation**: Custom punctuation character list, used for word breaking. If set to empty string, server defaults are used.
- **direction**: Text writing direction.
- **ellipsis_char**: Ellipsis character used for text clipping.
- **justification_flags**: Line fill alignment rules.
- **line_spacing**: Additional vertical spacing between lines (in pixels), spacing is added to line descent. This value can be negative.
- **max_lines_visible**: Limits the lines of text shown.
- **orientation**: Text orientation.
- **preserve_control**: If set to `true` text will display control characters.
- **preserve_invalid**: If set to `true` text will display invalid characters.
- **text_overrun_behavior**: The clipping behavior when the text exceeds the paragraph's set width.
- **width**: Paragraph width.

**Methods:**
- AddObject(Variant key, Vector2 size, int inlineAlign = 5, int length = 1, float baseline = 0.0) -> bool - Adds inline object to the text buffer, `key` must be unique. In the text, object is represented as `length` object replacement characters.
- AddString(string text, Font font, int fontSize, string language = "", Variant meta = null) -> bool - Adds text span and font to draw it.
- Clear() - Clears text paragraph (removes text and inline objects).
- ClearDropcap() - Removes dropcap.
- Draw(Rid canvas, Vector2 pos, Color color = Color(1, 1, 1, 1), Color dcColor = Color(1, 1, 1, 1), float oversampling = 0.0) - Draw all lines of the text and drop cap into a canvas item at a given position, with `color`. `pos` specifies the top left corner of the bounding box. If `oversampling` is greater than zero, it is used as font oversampling factor, otherwise viewport oversampling settings are used.
- DrawDropcap(Rid canvas, Vector2 pos, Color color = Color(1, 1, 1, 1), float oversampling = 0.0) - Draw drop cap into a canvas item at a given position, with `color`. `pos` specifies the top left corner of the bounding box. If `oversampling` is greater than zero, it is used as font oversampling factor, otherwise viewport oversampling settings are used.
- DrawDropcapOutline(Rid canvas, Vector2 pos, int outlineSize = 1, Color color = Color(1, 1, 1, 1), float oversampling = 0.0) - Draw drop cap outline into a canvas item at a given position, with `color`. `pos` specifies the top left corner of the bounding box. If `oversampling` is greater than zero, it is used as font oversampling factor, otherwise viewport oversampling settings are used.
- DrawLine(Rid canvas, Vector2 pos, int line, Color color = Color(1, 1, 1, 1), float oversampling = 0.0) - Draw single line of text into a canvas item at a given position, with `color`. `pos` specifies the top left corner of the bounding box. If `oversampling` is greater than zero, it is used as font oversampling factor, otherwise viewport oversampling settings are used.
- DrawLineOutline(Rid canvas, Vector2 pos, int line, int outlineSize = 1, Color color = Color(1, 1, 1, 1), float oversampling = 0.0) - Draw outline of the single line of text into a canvas item at a given position, with `color`. `pos` specifies the top left corner of the bounding box. If `oversampling` is greater than zero, it is used as font oversampling factor, otherwise viewport oversampling settings are used.
- DrawOutline(Rid canvas, Vector2 pos, int outlineSize = 1, Color color = Color(1, 1, 1, 1), Color dcColor = Color(1, 1, 1, 1), float oversampling = 0.0) - Draw outlines of all lines of the text and drop cap into a canvas item at a given position, with `color`. `pos` specifies the top left corner of the bounding box. If `oversampling` is greater than zero, it is used as font oversampling factor, otherwise viewport oversampling settings are used.
- Duplicate() -> TextParagraph - Duplicates this TextParagraph.
- GetDropcapLines() -> int - Returns number of lines used by dropcap.
- GetDropcapRid() -> Rid - Returns drop cap text buffer RID.
- GetDropcapSize() -> Vector2 - Returns drop cap bounding box size.
- GetInferredDirection() -> int - Returns the text writing direction inferred by the BiDi algorithm.
- GetLineAscent(int line) -> float - Returns the text line ascent (number of pixels above the baseline for horizontal layout or to the left of baseline for vertical).
- GetLineCount() -> int - Returns number of lines in the paragraph.
- GetLineDescent(int line) -> float - Returns the text line descent (number of pixels below the baseline for horizontal layout or to the right of baseline for vertical).
- GetLineObjectRect(int line, Variant key) -> Rect2 - Returns bounding rectangle of the inline object.
- GetLineObjects(int line) -> Godot.Collections.Array - Returns array of inline objects in the line.
- GetLineRange(int line) -> Vector2i - Returns character range of the line.
- GetLineRid(int line) -> Rid - Returns TextServer line buffer RID.
- GetLineSize(int line) -> Vector2 - Returns size of the bounding box of the line of text. Returned size is rounded up.
- GetLineUnderlinePosition(int line) -> float - Returns pixel offset of the underline below the baseline.
- GetLineUnderlineThickness(int line) -> float - Returns thickness of the underline.
- GetLineWidth(int line) -> float - Returns width (for horizontal layout) or height (for vertical) of the line of text.
- GetNonWrappedSize() -> Vector2 - Returns the size of the bounding box of the paragraph, without line breaks.
- GetRange() -> Vector2i - Returns the character range of the paragraph.
- GetRid() -> Rid - Returns TextServer full string buffer RID.
- GetSize() -> Vector2 - Returns the size of the bounding box of the paragraph.
- HasObject(Variant key) -> bool - Returns `true` if an object with `key` is embedded in this shaped text buffer.
- HitTest(Vector2 coords) -> int - Returns caret character offset at the specified coordinates. This function always returns a valid position.
- ResizeObject(Variant key, Vector2 size, int inlineAlign = 5, float baseline = 0.0) -> bool - Sets new size and alignment of embedded object.
- SetBidiOverride(Godot.Collections.Array override) - Overrides BiDi for the structured text. Override ranges should cover full source text without overlaps. BiDi algorithm will be used on each range separately.
- SetDropcap(string text, Font font, int fontSize, Rect2 dropcapMargins = Rect2(0, 0, 0, 0), string language = "") -> bool - Sets drop cap, overrides previously set drop cap. Drop cap (dropped capital) is a decorative element at the beginning of a paragraph that is larger than the rest of the text.
- TabAlign(float[] tabStops) - Aligns paragraph to the given tab-stops.

