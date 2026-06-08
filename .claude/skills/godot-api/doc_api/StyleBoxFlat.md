## StyleBoxFlat <- StyleBox

By configuring various properties of this style box, you can achieve many common looks without the need of a texture. This includes optionally rounded borders, antialiasing, shadows, and skew. Setting corner radius to high values is allowed. As soon as corners overlap, the stylebox will switch to a relative system: [codeblock lang=text] height = 30 corner_radius_top_left = 50 corner_radius_bottom_left = 100 [/codeblock] The relative system now would take the 1:2 ratio of the two left corners to calculate the actual corner width. Both corners added will **never** be more than the height. Result: [codeblock lang=text] corner_radius_top_left: 10 corner_radius_bottom_left: 20 [/codeblock]

**Props:**
- AntiAliasing: bool = true
- AntiAliasingSize: float = 1.0
- BgColor: Color = Color(0.6, 0.6, 0.6, 1)
- BorderBlend: bool = false
- BorderColor: Color = Color(0.8, 0.8, 0.8, 1)
- BorderWidthBottom: int = 0
- BorderWidthLeft: int = 0
- BorderWidthRight: int = 0
- BorderWidthTop: int = 0
- CornerDetail: int = 8
- CornerRadiusBottomLeft: int = 0
- CornerRadiusBottomRight: int = 0
- CornerRadiusTopLeft: int = 0
- CornerRadiusTopRight: int = 0
- DrawCenter: bool = true
- ExpandMarginBottom: float = 0.0
- ExpandMarginLeft: float = 0.0
- ExpandMarginRight: float = 0.0
- ExpandMarginTop: float = 0.0
- ShadowColor: Color = Color(0, 0, 0, 0.6)
- ShadowOffset: Vector2 = Vector2(0, 0)
- ShadowSize: int = 0
- Skew: Vector2 = Vector2(0, 0)

- **anti_aliasing**: Antialiasing draws a small ring around the edges, which fades to transparency. As a result, edges look much smoother. This is only noticeable when using rounded corners or `skew`. **Note:** When using beveled corners with 45-degree angles (`corner_detail` = 1), it is recommended to set `anti_aliasing` to `false` to ensure crisp visuals and avoid possible visual glitches.
- **anti_aliasing_size**: This changes the size of the antialiasing effect. `1.0` is recommended for an optimal result at 100% scale, identical to how rounded rectangles are rendered in web browsers and most vector drawing software. **Note:** Higher values may produce a blur effect but can also create undesired artifacts on small boxes with large-radius corners.
- **bg_color**: The background color of the stylebox.
- **border_blend**: If `true`, the border will fade into the background color.
- **border_color**: Sets the color of the border.
- **border_width_bottom**: Border width for the bottom border.
- **border_width_left**: Border width for the left border.
- **border_width_right**: Border width for the right border.
- **border_width_top**: Border width for the top border.
- **corner_detail**: This sets the number of vertices used for each corner. Higher values result in rounder corners but take more processing power to compute. When choosing a value, you should take the corner radius (`set_corner_radius_all`) into account. For corner radii less than 10, `4` or `5` should be enough. For corner radii less than 30, values between `8` and `12` should be enough. A corner detail of `1` will result in chamfered corners instead of rounded corners, which is useful for some artistic effects.
- **corner_radius_bottom_left**: The bottom-left corner's radius. If `0`, the corner is not rounded.
- **corner_radius_bottom_right**: The bottom-right corner's radius. If `0`, the corner is not rounded.
- **corner_radius_top_left**: The top-left corner's radius. If `0`, the corner is not rounded.
- **corner_radius_top_right**: The top-right corner's radius. If `0`, the corner is not rounded.
- **draw_center**: Toggles drawing of the inner part of the stylebox.
- **expand_margin_bottom**: Expands the stylebox outside of the control rect on the bottom edge. Useful in combination with `border_width_bottom` to draw a border outside the control rect. **Note:** Unlike `StyleBox.content_margin_bottom`, `expand_margin_bottom` does *not* affect the size of the clickable area for Controls. This can negatively impact usability if used wrong, as the user may try to click an area of the StyleBox that cannot actually receive clicks.
- **expand_margin_left**: Expands the stylebox outside of the control rect on the left edge. Useful in combination with `border_width_left` to draw a border outside the control rect. **Note:** Unlike `StyleBox.content_margin_left`, `expand_margin_left` does *not* affect the size of the clickable area for Controls. This can negatively impact usability if used wrong, as the user may try to click an area of the StyleBox that cannot actually receive clicks.
- **expand_margin_right**: Expands the stylebox outside of the control rect on the right edge. Useful in combination with `border_width_right` to draw a border outside the control rect. **Note:** Unlike `StyleBox.content_margin_right`, `expand_margin_right` does *not* affect the size of the clickable area for Controls. This can negatively impact usability if used wrong, as the user may try to click an area of the StyleBox that cannot actually receive clicks.
- **expand_margin_top**: Expands the stylebox outside of the control rect on the top edge. Useful in combination with `border_width_top` to draw a border outside the control rect. **Note:** Unlike `StyleBox.content_margin_top`, `expand_margin_top` does *not* affect the size of the clickable area for Controls. This can negatively impact usability if used wrong, as the user may try to click an area of the StyleBox that cannot actually receive clicks.
- **shadow_color**: The color of the shadow. This has no effect if `shadow_size` is lower than 1.
- **shadow_offset**: The shadow offset in pixels. Adjusts the position of the shadow relatively to the stylebox.
- **shadow_size**: The shadow size in pixels.
- **skew**: If set to a non-zero value on either axis, `skew` distorts the StyleBox horizontally and/or vertically. This can be used for "futuristic"-style UIs. Positive values skew the StyleBox towards the right (X axis) and upwards (Y axis), while negative values skew the StyleBox towards the left (X axis) and downwards (Y axis). **Note:** To ensure text does not touch the StyleBox's edges, consider increasing the StyleBox's content margin (see `StyleBox.content_margin_bottom`). It is preferable to increase the content margin instead of the expand margin (see `expand_margin_bottom`), as increasing the expand margin does not increase the size of the clickable area for Controls.

**Methods:**
- GetBorderWidth(int margin) -> int - Returns the specified `Side`'s border width.
- GetBorderWidthMin() -> int - Returns the smallest border width out of all four borders.
- GetCornerRadius(int corner) -> int - Returns the given `corner`'s radius.
- GetExpandMargin(int margin) -> float - Returns the size of the specified `Side`'s expand margin.
- SetBorderWidth(int margin, int width) - Sets the specified `Side`'s border width to `width` pixels.
- SetBorderWidthAll(int width) - Sets the border width to `width` pixels for all sides.
- SetCornerRadius(int corner, int radius) - Sets the corner radius to `radius` pixels for the given `corner`.
- SetCornerRadiusAll(int radius) - Sets the corner radius to `radius` pixels for all corners.
- SetExpandMargin(int margin, float size) - Sets the expand margin to `size` pixels for the specified `Side`.
- SetExpandMarginAll(float size) - Sets the expand margin to `size` pixels for all sides.

