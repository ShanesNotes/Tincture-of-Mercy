shader_type canvas_item;
render_mode unshaded, blend_mul;

uniform vec4 vellum_tint : source_color = vec4(0.94, 0.88, 0.72, 1.0);
uniform float strength : hint_range(0.0, 0.12) = 0.045;
uniform float warp : hint_range(0.0, 0.05) = 0.012;
uniform float grain_scale : hint_range(40.0, 360.0) = 170.0;
uniform float rib_scale : hint_range(20.0, 180.0) = 92.0;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
    );
}

void fragment() {
    vec2 uv = SCREEN_UV;
    float slow_warp = noise(uv * 9.0 + vec2(3.2, 1.7));
    float ribs = sin((uv.y + slow_warp * warp) * rib_scale) * 0.5 + 0.5;
    float grain = noise(uv * grain_scale);
    float damp = smoothstep(0.38, 0.92, noise(uv * 13.0 + vec2(8.0, 2.0)));
    float paper = (grain - 0.5) * 0.7 + (ribs - 0.5) * 0.28 + damp * 0.42;
    float tint_amount = clamp(strength + paper * strength, 0.0, 0.13);
    COLOR = vec4(mix(vec3(1.0), vellum_tint.rgb, tint_amount), 1.0);
}
