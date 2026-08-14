#!/usr/bin/env python3
"""Author the Ironwood leg graybox .blend (metric, named collections).

Usage (from game/):
  python3 assets/src/levels/author_ironwood.py
  blender --background --python assets/src/levels/author_ironwood.py
"""

from __future__ import annotations

import math
import os
import sys
from pathlib import Path

ZONES = ("CABIN", "YARD", "WOODLINE", "FOREST", "ROAD", "ARENA", "ROAD_CODA")
PLACEHOLDER = (0.973, 0.945, 0.898, 1.0)
METRICS = {
    "capsule_radius": 0.35,
    "capsule_height": 1.75,
    "step_height": 0.35,
    "max_slope_deg": 45.0,
    "min_doorway": 0.9,
    "max_survivable_drop": 6.0,
}


def find_blender() -> Path:
    env = os.environ.get("BLENDER")
    if env:
        return Path(env)
    here = Path(__file__).resolve()
    candidates = [
        Path("/home/ark/.local/bin/blender"),
        Path("/usr/bin/blender"),
        Path("/usr/local/bin/blender"),
    ]
    for path in here.parents:
        candidates.append(path / "blender")
    for path in candidates:
        if path.is_file() and os.access(path, os.X_OK):
            return path
    from shutil import which

    found = which("blender")
    if found:
        return Path(found)
    raise SystemExit("blender not found; set BLENDER=")


def ensure_bpy():
    if "bpy" in sys.modules:
        return
    blender = find_blender()
    os.execv(str(blender), [str(blender), "--background", "--python", str(Path(__file__).resolve()), "--", *sys.argv[1:]])


ensure_bpy()

import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402


def reset_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.fps = 60
    scene.render.fps_base = 1.0
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0
    scene["tincture_level"] = "ironwood"
    for key, value in METRICS.items():
        scene[f"tincture_{key}"] = value


def placeholder_mat():
    mat = bpy.data.materials.get("placeholder")
    if mat is None:
        mat = bpy.data.materials.new("placeholder")
    mat.diffuse_color = PLACEHOLDER
    return mat


def ensure_collection(name: str):
    col = bpy.data.collections.get(name)
    if col is None:
        col = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(col)
    return col


def link_to(obj, col) -> None:
    if obj.name not in col.objects:
        col.objects.link(obj)
    scene_col = bpy.context.scene.collection
    if obj.name in scene_col.objects:
        scene_col.objects.unlink(obj)


def assign_mat(obj) -> None:
    mat = placeholder_mat()
    obj.data.materials.clear()
    obj.data.materials.append(mat)


def tag(obj, zone: str, collision: bool = True) -> None:
    obj["tincture_zone"] = zone
    obj["tincture_collision"] = 1 if collision else 0


def add_mesh(col, name: str, verts, faces, collision: bool = True):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    assign_mat(obj)
    tag(obj, col.name, collision)
    link_to(obj, col)
    return obj


def add_box(col, name: str, size, center, collision: bool = True):
    sx, sy, sz = size
    cx, cy, cz = center
    hx, hy, hz = sx / 2.0, sy / 2.0, sz / 2.0
    verts = [
        (cx - hx, cy - hy, cz - hz),
        (cx + hx, cy - hy, cz - hz),
        (cx + hx, cy + hy, cz - hz),
        (cx - hx, cy + hy, cz - hz),
        (cx - hx, cy - hy, cz + hz),
        (cx + hx, cy - hy, cz + hz),
        (cx + hx, cy + hy, cz + hz),
        (cx - hx, cy + hy, cz + hz),
    ]
    faces = [
        (0, 1, 2, 3),
        (4, 7, 6, 5),
        (0, 4, 5, 1),
        (1, 5, 6, 2),
        (2, 6, 7, 3),
        (3, 7, 4, 0),
    ]
    return add_mesh(col, name, verts, faces, collision)


def add_cylinder(col, name: str, radius: float, height: float, center, segments: int = 10, collision: bool = True):
    cx, cy, cz = center
    hz = height / 2.0
    verts = []
    for ring_z in (cz - hz, cz + hz):
        for i in range(segments):
            ang = 2.0 * math.pi * i / segments
            verts.append((cx + radius * math.cos(ang), cy + radius * math.sin(ang), ring_z))
    verts.append((cx, cy, cz - hz))
    verts.append((cx, cy, cz + hz))
    bot_c = segments * 2
    top_c = bot_c + 1
    faces = []
    for i in range(segments):
        j = (i + 1) % segments
        faces.append((i, j, segments + j, segments + i))
        faces.append((bot_c, j, i))
        faces.append((top_c, segments + i, segments + j))
    return add_mesh(col, name, verts, faces, collision)


def add_wedge(col, name: str, start, end, width: float, thickness: float):
    """Ramp from start to end (centers of the slab ends). Walkable top follows the pitch."""
    sx, sy, sz = start
    ex, ey, ez = end
    dx, dy = ex - sx, ey - sy
    length = math.hypot(dx, dy)
    if length <= 1e-6:
        raise ValueError(f"wedge {name} has zero length")
    nx, ny = -dy / length, dx / length
    hw = width / 2.0
    ht = thickness / 2.0
    # perpendicular in XY, up is Z
    verts = [
        (sx + nx * hw, sy + ny * hw, sz - ht),
        (sx - nx * hw, sy - ny * hw, sz - ht),
        (ex - nx * hw, ey - ny * hw, ez - ht),
        (ex + nx * hw, ey + ny * hw, ez - ht),
        (sx + nx * hw, sy + ny * hw, sz + ht),
        (sx - nx * hw, sy - ny * hw, sz + ht),
        (ex - nx * hw, ey - ny * hw, ez + ht),
        (ex + nx * hw, ey + ny * hw, ez + ht),
    ]
    faces = [
        (0, 1, 2, 3),
        (4, 7, 6, 5),
        (0, 4, 5, 1),
        (1, 5, 6, 2),
        (2, 6, 7, 3),
        (3, 7, 4, 0),
    ]
    return add_mesh(col, name, verts, faces, True)


def add_bowl(col, name: str, center, radius: float, depth: float, rings: int = 4, segs: int = 20):
    cx, cy, cz = center
    verts = [(cx, cy, cz - depth)]
    for ring in range(1, rings + 1):
        t = ring / rings
        r = radius * t
        z = cz - depth * (1.0 - t * t)
        for s in range(segs):
            ang = 2.0 * math.pi * s / segs
            verts.append((cx + r * math.cos(ang), cy + r * math.sin(ang), z))
    faces = []
    for s in range(segs):
        a = 1 + s
        b = 1 + (s + 1) % segs
        faces.append((0, b, a))
    for ring in range(1, rings):
        off = 1 + (ring - 1) * segs
        nxt = 1 + ring * segs
        for s in range(segs):
            s2 = (s + 1) % segs
            faces.append((off + s, nxt + s, nxt + s2, off + s2))
    return add_mesh(col, name, verts, faces, True)


def add_empty(col, name: str, loc, kind: str, extra: dict | None = None, scale=(0.4, 0.4, 0.4)):
    obj = bpy.data.objects.new(name, None)
    obj.empty_display_type = "PLAIN_AXES"
    obj.empty_display_size = 0.4
    obj.location = Vector(loc)
    obj.scale = scale
    obj["tincture_kind"] = kind
    obj["tincture_zone"] = col.name
    if extra:
        for key, value in extra.items():
            obj[key] = value
    link_to(obj, col)
    return obj


def build_cabin(col) -> None:
    # Floor 7×8, top at 0.16. Door on +Y (toward yard), 1.2m clear.
    add_box(col, "cabin_floor", (7.0, 8.0, 0.16), (0.0, 0.0, 0.08))
    add_box(col, "cabin_wall_back", (7.2, 0.22, 2.6), (0.0, -4.0, 1.46))
    add_box(col, "cabin_wall_west", (0.22, 8.0, 2.6), (-3.5, 0.0, 1.46))
    add_box(col, "cabin_wall_east", (0.22, 8.0, 2.6), (3.5, 0.0, 1.46))
    add_box(col, "cabin_wall_door_l", (2.9, 0.22, 2.6), (-2.05, 4.0, 1.46))
    add_box(col, "cabin_wall_door_r", (2.9, 0.22, 2.6), (2.05, 4.0, 1.46))
    add_box(col, "cabin_door_lintel", (1.2, 0.22, 0.4), (0.0, 4.0, 2.4))
    add_box(col, "cabin_roof", (7.6, 8.4, 0.16), (0.0, 0.0, 2.84), collision=False)
    add_box(col, "cabin_porch", (5.2, 2.6, 0.12), (0.0, 5.35, 0.06))
    add_cylinder(col, "cabin_porch_post_w", 0.12, 2.2, (-2.2, 6.4, 1.16), 8)
    add_cylinder(col, "cabin_porch_post_e", 0.12, 2.2, (2.2, 6.4, 1.16), 8)
    add_box(col, "cabin_hearth", (1.5, 0.8, 0.9), (0.0, -3.15, 0.61))
    add_box(col, "cabin_bed", (2.1, 1.15, 0.46), (-2.45, -1.15, 0.39))
    add_box(col, "cabin_table", (1.4, 0.9, 0.72), (1.85, 0.35, 0.52))

    add_empty(col, "spawn.player", (0.55, 1.2, 0.16), "spawn_player", {"yaw": 0.0, "role": "player"})
    add_empty(col, "hearth.cabin", (0.0, -3.15, 0.16), "hearth", {"id": "cabin"})
    add_empty(col, "item.water", (-1.6, 3.2, 0.28), "item", {"id": "water"})
    add_empty(col, "item.bread", (1.7, 0.35, 0.9), "item", {"id": "bread"})
    add_empty(col, "item.vial", (1.95, 0.55, 0.9), "item", {"id": "vial"})
    add_empty(col, "item.hearth_iron", (0.55, -3.0, 0.7), "item", {"id": "hearth_iron"})
    add_empty(col, "nav.cabin", (0.0, 0.2, 0.16), "nav_landmark", {"landmark": "cabin"})
    add_empty(col, "nav.anchor.door", (0.0, 4.0, 0.16), "nav_anchor", {"landmark": "door"})
    add_empty(
        col,
        "cam.anna_death",
        (2.15, 1.55, 1.55),
        "camera",
        {
            "scene": "anna_death",
            "look_at_x": -2.45,
            "look_at_y": -1.15,
            "look_at_z": 0.7,
            "cm": "CM6-CM12",
            "field": "white mercy field tilting toward vigil",
            "axis": "bed horizontal against room verticals",
            "threshold": "the bed itself",
            "witness": "Iiro at the margin; the cup",
            "light": "hearth warm, dimmed one ramp step",
            "memory": "the vial — borrowed mercy",
            "border": "footer death line in graphite",
        },
    )
    add_empty(
        col,
        "cam.hearth_vigil",
        (1.7, -0.4, 1.4),
        "camera",
        {
            "scene": "hearth_vigil",
            "look_at_x": 0.0,
            "look_at_y": -3.15,
            "look_at_z": 0.8,
            "cm": "CM13-CM19",
            "field": "black vigil field",
            "axis": "the flame vertical",
            "threshold": "hearth stone ring",
            "witness": "Cedar Dog at pouch slot 1",
            "light": "hearth warm/vigil",
            "memory": "notebook opened, Names written",
            "border": "lit-state ornament; vigil seal",
        },
    )
    add_empty(
        col,
        "cam.item_revelation",
        (2.45, 1.25, 1.3),
        "camera",
        {
            "scene": "item_revelation",
            "look_at_x": 1.85,
            "look_at_y": 0.35,
            "look_at_z": 0.75,
            "cm": "CM27-CM33",
            "field": "parchment field, one focal object",
            "axis": "the vial, relic approach",
            "threshold": "the act of taking",
            "witness": "one small emblem only",
            "light": "one named emitter, never self-glow",
            "memory": "soot and fill line",
            "border": "footer cartouche, folk name",
        },
    )


def build_yard(col) -> None:
    add_box(col, "yard_ground", (16.2, 15.7, 0.12), (0.0, 14.25, -0.06))
    # Woodpile chokepoint: 2.3m gap, west side of the 12m bowl.
    add_box(col, "yard_woodpile_a", (2.4, 2.2, 1.35), (-6.4, 13.4, 0.67))
    add_box(col, "yard_woodpile_b", (1.7, 1.9, 1.05), (-1.7, 13.6, 0.52))
    add_cylinder(col, "yard_stump", 0.35, 0.45, (4.6, 10.2, 0.22), 8)
    add_empty(col, "spawn.wolf.yard.baiter.0", (2.2, 16.2, 0.0), "spawn_wolf", {"pack": "yard", "role": "baiter"})
    add_empty(col, "spawn.wolf.yard.lunger.0", (-0.8, 17.4, 0.0), "spawn_wolf", {"pack": "yard", "role": "lunger"})
    add_empty(col, "spawn.wolf.yard.harrier.0", (3.4, 14.1, 0.0), "spawn_wolf", {"pack": "yard", "role": "harrier"})
    add_empty(col, "nav.yard", (1.0, 15.0, 0.0), "nav_landmark", {"landmark": "yard"})
    add_empty(col, "nav.drop.bottom", (11.0, 7.2, 0.0), "nav_drop", {"end": "bottom"})


def build_woodline(col) -> None:
    add_box(col, "woodline_ground", (8.0, 10.2, 0.12), (0.0, 27.0, -0.06))
    add_box(col, "woodline_wall_w", (0.4, 10.0, 2.4), (-1.7, 27.0, 1.2))
    add_box(col, "woodline_wall_e", (0.4, 10.0, 2.4), (1.7, 27.0, 1.2))
    add_cylinder(col, "woodline_post_sw", 0.45, 8.5, (-2.15, 22.6, 4.25), 10)
    add_cylinder(col, "woodline_post_se", 0.45, 8.5, (2.15, 22.6, 4.25), 10)
    add_cylinder(col, "woodline_post_nw", 0.5, 9.0, (-2.2, 31.4, 4.5), 10)
    add_cylinder(col, "woodline_post_ne", 0.5, 9.0, (2.2, 31.4, 4.5), 10)
    add_empty(col, "spawn.wolf.doorway.lunger.0", (0.0, 27.2, 0.0), "spawn_wolf", {"pack": "doorway", "role": "lunger"})
    add_empty(col, "nav.anchor.woodline", (0.0, 27.0, 0.0), "nav_anchor", {"landmark": "woodline"})


def build_forest(col) -> None:
    add_box(col, "forest_ground", (36.0, 26.2, 0.12), (0.0, 45.0, -0.06))
    # West return lane (LOOP_B) connecting forest to west yard.
    add_box(col, "forest_west_lane", (9.0, 12.4, 0.12), (-12.4, 27.0, -0.06))
    # Fence at y=30 with a 2.4m gate gap centered at x=-12.4.
    add_box(col, "forest_gate_fence_w", (3.4, 0.18, 2.2), (-15.5, 30.0, 1.1))
    add_box(col, "forest_gate_fence_e", (3.6, 0.18, 2.2), (-9.2, 30.0, 1.1))
    add_box(col, "gate_loop_b", (2.4, 0.16, 2.2), (-12.4, 30.0, 1.1))
    # LOOP_A: ramp + elevated ledge dropping 2.7m near the cabin/yard.
    add_wedge(col, "loop_a_ramp", (11.0, 36.2, 0.08), (11.0, 42.4, 2.70), 2.4, 0.16)
    add_box(col, "loop_a_ledge", (3.0, 34.6, 0.16), (11.0, 25.3, 2.70))
    add_box(col, "loop_a_rail_e", (0.16, 34.6, 0.9), (12.42, 25.3, 3.23))
    add_box(col, "loop_a_rail_w_n", (0.16, 31.2, 0.9), (9.58, 26.9, 3.23))
    # South end left open as the drop (2.7m, survivable).

    trunks = [
        ("forest_pine_a", 0.62, 11.0, (5.6, 38.0, 5.5)),
        ("forest_pine_b", 0.70, 12.0, (-5.1, 42.5, 6.0)),
        ("forest_pine_c", 0.58, 10.4, (7.8, 51.0, 5.2)),
        ("forest_pine_d", 0.74, 13.0, (-7.2, 54.0, 6.5)),
        ("forest_pine_e", 0.55, 10.0, (6.2, 34.4, 5.0)),
        ("forest_pine_f", 0.60, 11.2, (-6.0, 36.2, 5.6)),
        ("forest_pine_g", 0.66, 11.6, (8.4, 46.5, 5.8)),
    ]
    for name, radius, height, center in trunks:
        add_cylinder(col, name, radius, height, center, 10)

    add_empty(col, "gate.loop_b", (-12.4, 30.0, 0.0), "gate", {"id": "loop_b", "locked": 1})
    add_empty(col, "nav.forest", (0.0, 45.0, 0.0), "nav_landmark", {"landmark": "forest"})
    add_empty(col, "nav.drop.top", (11.0, 8.2, 2.78), "nav_drop", {"end": "top"})
    add_empty(col, "nav.gate.a", (-12.4, 28.6, 0.0), "nav_gate", {"end": "a"})
    add_empty(col, "nav.gate.b", (-12.4, 31.4, 0.0), "nav_gate", {"end": "b"})
    add_empty(col, "spawn.wolf.den.lunger.0", (13.2, 52.0, 0.0), "spawn_wolf", {"pack": "den", "role": "lunger"})


def build_road(col) -> None:
    add_box(col, "road_ground", (12.0, 60.2, 0.12), (0.0, 88.0, -0.06))
    roadside = [
        ("road_pine_e1", 0.55, 10.0, (5.4, 70.0, 5.0)),
        ("road_pine_e2", 0.62, 11.2, (5.6, 90.0, 5.6)),
        ("road_pine_e3", 0.50, 9.4, (5.2, 110.0, 4.7)),
        ("road_pine_w1", 0.58, 10.6, (-5.3, 75.0, 5.3)),
        ("road_pine_w2", 0.64, 11.8, (-5.6, 95.0, 5.9)),
    ]
    for name, radius, height, center in roadside:
        add_cylinder(col, name, radius, height, center, 10)
    add_box(col, "road_hearth_pad", (2.2, 2.2, 0.14), (4.2, 116.0, 0.07))
    add_box(col, "road_hearth", (1.1, 1.1, 0.7), (4.2, 116.0, 0.49))

    add_empty(col, "hearth.road", (4.2, 116.0, 0.14), "hearth", {"id": "road"})
    add_empty(col, "nav.anchor.road_mid", (0.0, 88.0, 0.0), "nav_anchor", {"landmark": "road_mid"})
    add_empty(col, "wither.pocket_a", (12.5, 82.0, 0.0), "wither", {"id": "pocket_a", "radius": 4.5})
    add_empty(col, "wither.pocket_b", (-12.0, 102.0, 0.0), "wither", {"id": "pocket_b", "radius": 4.5})
    add_empty(col, "spawn.wolf.road.baiter.0", (1.2, 78.0, 0.0), "spawn_wolf", {"pack": "road", "role": "baiter"})
    add_empty(col, "spawn.wolf.road.lunger.0", (-1.1, 82.5, 0.0), "spawn_wolf", {"pack": "road", "role": "lunger"})
    add_empty(col, "spawn.wolf.road.harrier.0", (2.0, 86.0, 0.0), "spawn_wolf", {"pack": "road", "role": "harrier"})
    add_empty(col, "spawn.wolf.road.baiter.1", (-1.8, 91.0, 0.0), "spawn_wolf", {"pack": "road", "role": "baiter"})
    add_empty(col, "spawn.wolf.den.harrier.0", (13.0, 92.0, 0.0), "spawn_wolf", {"pack": "den", "role": "harrier"})

    iiro = [
        (0.0, 62.0, 0.0),
        (0.6, 70.0, 0.0),
        (2.1, 78.0, 0.0),
        (3.4, 86.0, 0.0),
        (1.0, 94.0, 0.0),
        (-1.6, 102.0, 0.0),
        (0.4, 110.0, 0.0),
        (0.0, 116.5, 0.0),
    ]
    for i, loc in enumerate(iiro):
        add_empty(col, f"iiro.{i:02d}", loc, "iiro_waypoint", {"index": i})


def build_arena(col) -> None:
    add_box(col, "arena_approach", (10.0, 10.2, 0.12), (0.0, 122.5, -0.06))
    add_bowl(col, "arena_bowl", (0.0, 136.0, 0.0), 9.0, 0.40, rings=4, segs=20)
    add_box(col, "arena_entry_threshold", (4.0, 0.6, 0.12), (0.0, 127.0, 0.06))
    # Colonnade: 12 oversized trunks, 30° spacing, entry gap at -Y.
    for i in range(12):
        ang = math.radians(15.0 + 30.0 * i)
        x = 11.5 * math.cos(ang)
        y = 136.0 + 11.5 * math.sin(ang)
        add_cylinder(col, f"arena_pine_{i:02d}", 0.85, 14.0, (x, y, 7.0), 10)
    # Snare-line posts; skip the two chords that cover the entry (i=9,10 around 270°).
    for i in range(16):
        ang = math.radians(-90.0 + i * 22.5)
        x = 9.2 * math.cos(ang)
        y = 136.0 + 9.2 * math.sin(ang)
        add_empty(col, f"snare.{i:02d}", (x, y, 0.35), "snare", {"index": i, "segment": i})
        if i in (0, 15):
            continue
        add_box(col, f"snare_post_{i:02d}", (0.12, 0.12, 0.7), (x, y, 0.35))
    add_empty(col, "lantern.hang", (0.0, 145.1, 3.4), "lantern_hang", {"verb": "guide"})
    add_box(col, "arena_lantern_hook", (0.2, 0.2, 0.35), (0.0, 145.1, 3.4), collision=False)
    add_empty(col, "nav.arena", (0.0, 136.0, -0.38), "nav_landmark", {"landmark": "arena"})
    add_empty(col, "nav.anchor.arena_entry", (0.0, 127.0, 0.0), "nav_anchor", {"landmark": "arena_entry"})
    add_empty(
        col,
        "cam.warden_intro",
        (0.0, 124.2, 1.7),
        "camera",
        {
            "scene": "warden_intro",
            "look_at_x": 0.0,
            "look_at_y": 136.0,
            "look_at_z": 1.8,
            "cm": "CM20-CM26",
            "field": "custody green — colonnade enclosing",
            "axis": "light shaft he stands into",
            "threshold": "snare-line ring",
            "witness": "tin tags, enumerable",
            "light": "lantern guide turned accuse",
            "memory": "well-kept axe, stripped insignia",
            "border": "boss-phase verdict; no title card",
        },
    )


def build_coda(col) -> None:
    add_box(col, "coda_straight", (8.0, 10.0, 0.12), (0.0, 150.5, -0.06))
    add_box(col, "coda_bend", (12.0, 10.0, 0.12), (6.0, 158.5, -0.06))
    add_box(col, "coda_bethany", (12.0, 8.0, 0.12), (16.0, 164.0, -0.06))
    add_empty(col, "spawn.birdie", (10.2, 160.0, 0.0), "spawn_npc", {"id": "birdie"})
    add_empty(col, "nav.anchor.birdie", (8.0, 158.0, 0.0), "nav_anchor", {"landmark": "birdie"})
    add_empty(
        col,
        "cam.birdie_coda",
        (4.2, 154.0, 1.6),
        "camera",
        {
            "scene": "birdie_coda",
            "look_at_x": 10.2,
            "look_at_y": 160.0,
            "look_at_z": 0.9,
            "cm": "CM34-CM40",
            "field": "route conversion toward Bethany",
            "axis": "the road's S-curve",
            "threshold": "the bend/fork",
            "witness": "Birdie small at the margin",
            "light": "late overcast gold break, guide",
            "memory": "the apple offered and refused",
            "border": "unwritten Warden mark if unread",
        },
    )


def main() -> int:
    reset_scene()
    builders = {
        "CABIN": build_cabin,
        "YARD": build_yard,
        "WOODLINE": build_woodline,
        "FOREST": build_forest,
        "ROAD": build_road,
        "ARENA": build_arena,
        "ROAD_CODA": build_coda,
    }
    for name in ZONES:
        builders[name](ensure_collection(name))

    out = Path(__file__).resolve().parent / "ironwood.blend"
    out.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(out), compress=True)
    print(f"wrote {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
