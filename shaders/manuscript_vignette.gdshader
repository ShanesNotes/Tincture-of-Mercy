shader_type canvas_item;

// Damp-manuscript vignette: darken the page edges so the rendered scene reads
// as a contained illumination on parchment rather than an unbordered photo.
// Kept additive-friendly: this shader paints transparent at the center and
// blends toward `edge_color` at the corners; lights and CanvasModulate are
// composited beneath, so the vignette never crushes the warm hearth.

uniform vec4 edge_color : source_color = vec4(0.05, 0.06, 0.09, 1.0);
uniform float aspect : hint_range(0.5, 3.0) = 1.7777;     // 16:9 default
uniform float inner_radius : hint_range(0.0, 1.5) = 0.55; // where darkening starts
uniform float outer_radius : hint_range(0.0, 2.0) = 1.15; // where darkening saturates
uniform float strength : hint_range(0.0, 1.0) = 0.78;
uniform float grain : hint_range(0.0, 0.2) = 0.04;
uniform float warm_floor : hint_range(0.0, 0.4) = 0.10;   // warm wash at bottom (hearth bleed)
uniform vec4 warm_color : source_color = vec4(0.45, 0.22, 0.08, 1.0);

float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

void fragment() {
    vec2 centered = UV - vec2(0.5);
    centered.x *= aspect;
    float d = length(centered);

    // Page vignette: smoothstep from inner to outer, scaled by strength.
    float v = smoothstep(inner_radius, outer_radius, d) * strength;

    // Tiny page-grain so the dark edges don't look like a flat gradient.
    float g = (hash21(UV * vec2(640.0, 360.0)) - 0.5) * grain;
    v = clamp(v + g, 0.0, 1.0);

    // Warm wash near the bottom edge: gentle hearth bleed up into the frame.
    float warm = smoothstep(0.62, 0.98, UV.y) * warm_floor;

    vec3 rgb = edge_color.rgb * v + warm_color.rgb * warm;
    float a = max(v, warm * 0.7);

    COLOR = vec4(rgb, a);
}
