#!/usr/bin/env python3
"""Headless Ironwood .blend → per-zone graybox GLB + collision + placements.

Usage (from game/):
  python3 tools/blender/export_level.py
  blender --background --python tools/blender/export_level.py -- \\
      assets/src/levels/ironwood.blend assets/build/levels
"""

from __future__ import annotations

import hashlib
import json
import os
import struct
import sys
from pathlib import Path

GLTF_MAGIC = 0x46546C67
JSON_CHUNK = 0x4E4F534A
SCHEMA = "tincture.level.v0"
COLLISION_SCHEMA = "tincture.collision.v0"
ZONES = ("CABIN", "YARD", "WOODLINE", "FOREST", "ROAD", "ARENA", "ROAD_CODA")
METRICS = {
    "capsuleRadius": 0.35,
    "capsuleHeight": 1.75,
    "stepHeight": 0.35,
    "maxSlopeDeg": 45.0,
    "minDoorway": 0.9,
    "maxSurvivableDrop": 6.0,
}


def find_blender() -> Path:
    env = os.environ.get("BLENDER")
    if env:
        return Path(env)
    candidates = [
        Path("/home/ark/.local/bin/blender"),
        Path("/usr/bin/blender"),
        Path("/usr/local/bin/blender"),
    ]
    from shutil import which

    found = which("blender")
    if found:
        candidates.insert(0, Path(found))
    for path in candidates:
        if path.is_file() and os.access(path, os.X_OK):
            return path
    raise SystemExit("blender not found; set BLENDER=")


def ensure_bpy() -> None:
    if "bpy" in sys.modules:
        return
    blender = find_blender()
    os.execv(
        str(blender),
        [str(blender), "--background", "--python", str(Path(__file__).resolve()), "--", *sys.argv[1:]],
    )


ensure_bpy()

import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402


def after_ddash() -> list[str]:
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else sys.argv[1:]


def game_root() -> Path:
    return Path(__file__).resolve().parents[2]


def r6(x: float) -> float:
    return float(f"{float(x):.6f}")


def to_game(v: Vector) -> tuple[float, float, float]:
    # Blender Z-up, +Y toward arena → game Y-up, -Z toward arena.
    return (r6(v.x), r6(v.z), r6(-v.y))


def quantize_mm(v: tuple[float, float, float]) -> tuple[int, int, int]:
    return (round(v[0] * 1000.0), round(v[1] * 1000.0), round(v[2] * 1000.0))


def from_mm(v: tuple[int, int, int]) -> list[float]:
    return [v[0] / 1000.0, v[1] / 1000.0, v[2] / 1000.0]


def sanitize_glb(path: Path) -> str:
    data = path.read_bytes()
    magic, _version, _length = struct.unpack_from("<III", data, 0)
    if magic != GLTF_MAGIC:
        raise RuntimeError(f"not a GLB: {path}")
    offset = 12
    chunks: list[tuple[int, bytes]] = []
    while offset + 8 <= len(data):
        clen, ctype = struct.unpack_from("<II", data, offset)
        offset += 8
        cdata = data[offset : offset + clen]
        offset += clen
        chunks.append((ctype, cdata))
    rebuilt: list[tuple[int, bytes]] = []
    for ctype, cdata in chunks:
        if ctype == JSON_CHUNK:
            raw = cdata.rstrip(b" \x00")
            obj = json.loads(raw.decode("utf-8"))
            version = (obj.get("asset") or {}).get("version", "2.0")
            obj["asset"] = {"generator": "tincture-export/0", "version": version}
            obj.pop("extras", None)
            packed = json.dumps(obj, sort_keys=True, separators=(",", ":")).encode("utf-8")
            pad = (4 - (len(packed) % 4)) % 4
            packed = packed + (b" " * pad)
            rebuilt.append((ctype, packed))
        else:
            pad = (4 - (len(cdata) % 4)) % 4
            rebuilt.append((ctype, cdata + (b"\x00" * pad)))
    body = b""
    for ctype, cdata in rebuilt:
        body += struct.pack("<II", len(cdata), ctype) + cdata
    blob = struct.pack("<III", GLTF_MAGIC, 2, 12 + len(body)) + body
    path.write_bytes(blob)
    return hashlib.sha256(blob).hexdigest()


def enable_gltf() -> None:
    try:
        bpy.ops.preferences.addon_enable(module="io_scene_gltf2")
    except Exception:
        pass


def write_json(path: Path, obj: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, sort_keys=True) + "\n")


def collection_meshes(name: str):
    col = bpy.data.collections.get(name)
    if col is None:
        raise RuntimeError(f"missing collection {name}")
    return [obj for obj in col.objects if obj.type == "MESH"]


def collection_empties(name: str):
    col = bpy.data.collections.get(name)
    if col is None:
        return []
    return [obj for obj in col.objects if obj.type == "EMPTY"]


def iter_world_tris(obj):
    deps = bpy.context.evaluated_depsgraph_get()
    ev = obj.evaluated_get(deps)
    mesh = ev.to_mesh()
    if hasattr(mesh, "calc_loop_triangles"):
        mesh.calc_loop_triangles()
    mw = obj.matrix_world
    for tri in mesh.loop_triangles:
        yield [mw @ mesh.vertices[i].co.copy() for i in tri.vertices]
    ev.to_mesh_clear()


def bake_collision(tris: list[tuple[list[Vector], bool]]) -> dict:
    """1mm-quantize, weld, drop slivers, stable triangle order (D8)."""
    index: dict[tuple[int, int, int], int] = {}
    vertices: list[list[float]] = []
    raw_tris: list[tuple[tuple[int, int, int], bool]] = []

    def weld(v: Vector) -> int:
        key = quantize_mm(to_game(v))
        found = index.get(key)
        if found is not None:
            return found
        idx = len(vertices)
        index[key] = idx
        vertices.append(from_mm(key))
        return idx

    for pts, nav in tris:
        i0, i1, i2 = weld(pts[0]), weld(pts[1]), weld(pts[2])
        if i0 == i1 or i1 == i2 or i2 == i0:
            continue
        ax, ay, az = vertices[i0]
        bx, by, bz = vertices[i1]
        cx, cy, cz = vertices[i2]
        ux, uy, uz = bx - ax, by - ay, bz - az
        vx, vy, vz = cx - ax, cy - ay, cz - az
        nx = uy * vz - uz * vy
        ny = uz * vx - ux * vz
        nz = ux * vy - uy * vx
        if (nx * nx + ny * ny + nz * nz) < 1e-12:
            continue
        # Rotate so the smallest vertex index is first; preserve winding.
        trip = (i0, i1, i2)
        pivot = min(range(3), key=lambda k: trip[k])
        raw_tris.append(((trip[pivot], trip[(pivot + 1) % 3], trip[(pivot + 2) % 3]), nav))

    raw_tris.sort(key=lambda item: (item[0], not item[1]))
    # Drop exact duplicates after the stable sort. A playable copy wins.
    triangles: list[list[int]] = []
    nav_exclude: list[int] = []
    prev = None
    for tri, nav in raw_tris:
        if tri == prev:
            continue
        if not nav:
            nav_exclude.append(len(triangles))
        triangles.append([tri[0], tri[1], tri[2]])
        prev = tri
    payload = {
        "schema": COLLISION_SCHEMA,
        "quantizationMm": 1,
        "triCount": len(triangles),
        "triangles": triangles,
        "vertexCount": len(vertices),
        "vertices": vertices,
    }
    if nav_exclude:
        payload["navExclude"] = nav_exclude
    return payload


def collision_sha(payload: dict) -> str:
    body = {
        "triangles": payload["triangles"],
        "vertices": payload["vertices"],
    }
    blob = json.dumps(body, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(blob).hexdigest()


def aabb_of(verts: list[list[float]]) -> dict:
    if not verts:
        return {"max": [0.0, 0.0, 0.0], "min": [0.0, 0.0, 0.0]}
    xs = [v[0] for v in verts]
    ys = [v[1] for v in verts]
    zs = [v[2] for v in verts]
    return {
        "max": [r6(max(xs)), r6(max(ys)), r6(max(zs))],
        "min": [r6(min(xs)), r6(min(ys)), r6(min(zs))],
    }


def export_zone_glb(name: str, dest: Path) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.data.objects:
        obj.hide_set(False)
        obj.hide_viewport = False
        obj.hide_render = False
        obj.select_set(False)
    for obj in collection_meshes(name):
        obj.select_set(True)
    dest.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(dest),
        export_format="GLB",
        export_copyright="",
        export_extras=False,
        export_cameras=False,
        export_lights=False,
        export_materials="PLACEHOLDER",
        export_animations=False,
        export_skins=False,
        export_yup=True,
        export_apply=True,
        export_morph=False,
        use_selection=True,
        use_visible=True,
        export_image_format="NONE",
    )


def empty_record(obj) -> dict:
    kind = str(obj.get("tincture_kind", "empty"))
    loc = to_game(obj.matrix_world.translation)
    rec: dict = {
        "id": obj.name,
        "kind": kind,
        "position": [loc[0], loc[1], loc[2]],
        "zone": str(obj.get("tincture_zone", "")),
    }
    skip = {"tincture_kind", "tincture_zone"}
    extras = {}
    for key in obj.keys():
        if key.startswith("_") or key in skip:
            continue
        value = obj[key]
        if isinstance(value, (str, int, float, bool)):
            extras[str(key)] = value
    if "look_at_x" in extras:
        look = to_game(Vector((float(extras.pop("look_at_x")), float(extras.pop("look_at_y")), float(extras.pop("look_at_z")))))
        rec["lookAt"] = [look[0], look[1], look[2]]
    short = extras.pop("id", None)
    rec.update(extras)
    if short is not None:
        rec["key"] = short
    return rec


def group_placements(records: list[dict]) -> dict:
    def take(*kinds: str) -> list[dict]:
        return [r for r in records if r["kind"] in kinds]

    records_sorted = sorted(records, key=lambda r: r["id"])
    return {
        "schema": "tincture.placements.v0",
        "cameras": take("camera"),
        "gates": take("gate"),
        "hearths": take("hearth"),
        "iiroRoute": take("iiro_waypoint"),
        "items": take("item"),
        "lanternHang": take("lantern_hang"),
        "nav": take("nav_landmark", "nav_anchor", "nav_drop", "nav_gate"),
        "snareRing": take("snare"),
        "spawns": take("spawn_player", "spawn_wolf", "spawn_npc"),
        "witherZones": take("wither"),
        "all": records_sorted,
    }


def main() -> int:
    args = after_ddash()
    root = game_root()
    blend = Path(args[0]).resolve() if args else (root / "assets/src/levels/ironwood.blend")
    build = Path(args[1]).resolve() if len(args) > 1 else (root / "assets/build/levels")
    if not blend.is_file():
        print(f"missing blend: {blend}", file=sys.stderr)
        return 2
    build.mkdir(parents=True, exist_ok=True)

    enable_gltf()
    bpy.ops.wm.open_mainfile(filepath=str(blend))
    scene = bpy.context.scene
    scene.render.fps = 60
    scene.render.fps_base = 1.0
    if bpy.context.object is not None:
        bpy.ops.object.mode_set(mode="OBJECT")

    mat = bpy.data.materials.get("placeholder")
    if mat is None:
        mat = bpy.data.materials.new("placeholder")
    mat.diffuse_color = (0.973, 0.945, 0.898, 1.0)
    for obj in bpy.data.objects:
        if obj.type == "MESH":
            obj.data.materials.clear()
            obj.data.materials.append(mat)

    zones_out: dict[str, dict] = {}
    all_empties: list[dict] = []
    for zone in ZONES:
        slug = zone.lower()
        glb_path = build / f"{slug}.visual.glb"
        col_path = build / f"{slug}.collision.json"
        export_zone_glb(zone, glb_path)
        visual_sha = sanitize_glb(glb_path)
        tris = []
        for obj in collection_meshes(zone):
            if int(obj.get("tincture_collision", 1)) != 1:
                continue
            nav = int(obj.get("tincture_nav", 1)) == 1
            tris.extend((pts, nav) for pts in iter_world_tris(obj))
        collision = bake_collision(tris)
        collision["zone"] = zone
        write_json(col_path, collision)
        sha = collision_sha(collision)
        exclude = set(collision.get("navExclude", []))
        playable = [
            collision["vertices"][index]
            for tri_index, tri in enumerate(collision["triangles"])
            if tri_index not in exclude
            for index in tri
        ]
        bounds = aabb_of(playable if playable else collision["vertices"])
        zones_out[zone] = {
            "bounds": bounds,
            "collision": col_path.name,
            "sha256": sha,
            "triCount": collision["triCount"],
            "visualGlb": glb_path.name,
            "visualSha256": visual_sha,
        }
        all_empties.extend(empty_record(obj) for obj in collection_empties(zone))
        print(f"{zone} collision={sha[:12]} tris={collision['triCount']} glb={visual_sha[:12]}")

    placements = group_placements(all_empties)
    write_json(build / "ironwood.placements.json", placements)
    write_json(build / "ironwood.zones.json", {k: v["bounds"] for k, v in zones_out.items()})

    manifest = {
        "schema": SCHEMA,
        "generator": "tincture-export/0",
        "metrics": METRICS,
        "placements": "ironwood.placements.json",
        "source": blend.name,
        "up": "y",
        "units": "meters",
        "zones": zones_out,
        "zonesFile": "ironwood.zones.json",
    }
    write_json(build / "manifest.json", manifest)

    data_dir = root / "src/data/levels"
    data_dir.mkdir(parents=True, exist_ok=True)
    write_json(data_dir / "ironwood_placements.json", placements)
    write_json(data_dir / "ironwood_manifest.json", manifest)
    print(f"wrote {build / 'manifest.json'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
