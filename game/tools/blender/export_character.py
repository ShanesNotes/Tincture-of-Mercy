#!/usr/bin/env python3
"""Headless .blend → hashed GLB + per-clip 60Hz sidecars.

Usage (from repo root):
  blender --background --python game/tools/blender/export_character.py -- \\
      game/assets/src/wolf.blend game/assets/build
"""

from __future__ import annotations

import hashlib
import json
import struct
import sys
from pathlib import Path

import bpy
from mathutils import Vector

GLTF_MAGIC = 0x46546C67
JSON_CHUNK = 0x4E4F534A
SCHEMA = "tincture.sidecar.v0"


def after_ddash() -> list[str]:
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else sys.argv[1:]


def r6(x: float) -> float:
    return round(float(x), 6)


def to_game(v: Vector) -> list[float]:
    # Blender Z-up, -Y forward → game Y-up, -Z forward
    return [r6(v.x), r6(v.z), r6(-v.y)]


def to_game_xz(v: Vector) -> list[float]:
    return [r6(v.x), r6(-v.y)]


def tools_dir() -> Path:
    return Path(__file__).resolve().parent


def load_frame_data() -> dict:
    return json.loads((tools_dir() / "frame_data_v0.json").read_text())


def sanitize_glb(path: Path) -> str:
    data = path.read_bytes()
    magic, version, _length = struct.unpack_from("<III", data, 0)
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


def find_armature():
    for obj in bpy.data.objects:
        if obj.type == "ARMATURE":
            return obj
    raise RuntimeError("no armature in blend")


def custom(obj, name: str, default: str) -> str:
    return str(obj.get(name, default))


def parse_json_prop(obj, name: str, default):
    raw = obj.get(name)
    if not raw:
        return default
    if isinstance(raw, (list, dict)):
        return raw
    return json.loads(raw)


def events_for(clip: str, ticks: int, row: dict) -> list[dict]:
    ev: list[dict] = []
    if "startup" in row and "active" in row:
        on_t = int(row["startup"])
        off_t = on_t + int(row["active"])
        ev.append({"tick": on_t, "type": "hitbox_on"})
        ev.append({"tick": off_t, "type": "hitbox_off"})
        if clip in ("light1", "heavy", "lunge"):
            ev.append({"tick": max(0, on_t - 3), "type": "sfx_swing"})
    if clip == "heavy" and "hyperarmor" in row:
        lo, hi = row["hyperarmor"]
        ev.append({"tick": int(lo), "type": "hyperarmor_on"})
        ev.append({"tick": int(hi) + 1, "type": "hyperarmor_off"})
    if clip == "roll" and "iframes" in row:
        lo, hi = row["iframes"]
        ev.append({"tick": int(lo), "type": "iframe_on"})
        ev.append({"tick": int(hi) + 1, "type": "iframe_off"})
        ev.append({"tick": int(row["actionableFrom"]), "type": "actionable"})
    if clip == "guard":
        ev.append({"tick": 0, "type": "guard_enter"})
        ev.append({"tick": int(row["enter"]), "type": "guard_hold"})
        ev.append({"tick": int(row["enter"]) + int(row["hold"]), "type": "guard_exit"})
    ev = [e for e in ev if 0 <= e["tick"] < ticks]
    ev.sort(key=lambda e: (e["tick"], e["type"]))
    return ev


def bone_world(arm, name: str) -> tuple[Vector, Vector]:
    pb = arm.pose.bones[name]
    mw = arm.matrix_world @ pb.matrix
    head = mw @ Vector((0.0, 0.0, 0.0))
    tail = mw @ Vector((0.0, pb.length, 0.0))
    return head, tail


def activate_action(arm, action) -> None:
    ad = arm.animation_data_create()
    ad.action = action
    if action.slots:
        ad.action_slot = action.slots[0]


def sample_clip(arm, action, character: str, clip: str, ticks: int, row: dict, glb_name: str, glb_hash: str) -> dict:
    activate_action(arm, action)
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = ticks
    weapon_base = custom(arm, "tincture_weapon_base", "weapon_base")
    weapon_tip = custom(arm, "tincture_weapon_tip", "weapon_tip")
    feet = parse_json_prop(arm, "tincture_feet", ["foot.L", "foot.R"])
    hurt_spec = parse_json_prop(
        arm,
        "tincture_hurtboxes",
        [{"name": "torso", "bone": "spine", "radius": 0.16}],
    )
    root_name = "root" if "root" in arm.pose.bones else arm.pose.bones[0].name
    plant_eps = 0.06

    root_xz = []
    base_pts = []
    tip_pts = []
    hurtboxes = []
    contacts = []

    for tick in range(ticks):
        scene.frame_set(tick + 1)
        bpy.context.view_layer.update()
        root_head, _ = bone_world(arm, root_name)
        root_xz.append(to_game_xz(root_head))
        bh, _ = bone_world(arm, weapon_base)
        _, tt = bone_world(arm, weapon_tip)
        base_pts.append(to_game(bh))
        tip_pts.append(to_game(tt))
        caps = []
        for spec in hurt_spec:
            h, t = bone_world(arm, spec["bone"])
            caps.append({"name": spec["name"], "a": to_game(h), "b": to_game(t), "r": r6(spec["radius"])})
        hurtboxes.append({"tick": tick, "capsules": caps})
        planted = []
        for fname in feet:
            if fname not in arm.pose.bones:
                continue
            fh, ft = bone_world(arm, fname)
            if min(fh.z, ft.z) <= plant_eps:
                planted.append(fname)
        contacts.append({"tick": tick, "feet": planted})

    return {
        "schema": SCHEMA,
        "character": character,
        "clip": clip,
        "ticks": ticks,
        "tickHz": 60,
        "glb": glb_name,
        "glbHash": glb_hash,
        "rootXZ": root_xz,
        "events": events_for(clip, ticks, row),
        "sockets": {"weaponBase": base_pts, "weaponTip": tip_pts},
        "hurtboxes": hurtboxes,
        "footContacts": contacts,
    }


def strip_materials_to_placeholder() -> None:
    mat = bpy.data.materials.get("placeholder")
    if mat is None:
        mat = bpy.data.materials.new("placeholder")
    mat.diffuse_color = (0.973, 0.945, 0.898, 1.0)
    for obj in bpy.data.objects:
        if obj.type != "MESH":
            continue
        obj.data.materials.clear()
        obj.data.materials.append(mat)


def export_glb(dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(dest),
        export_format="GLB",
        export_copyright="",
        export_extras=False,
        export_cameras=False,
        export_lights=False,
        export_materials="PLACEHOLDER",
        export_animations=True,
        export_animation_mode="ACTIONS",
        export_nla_strips=True,
        export_anim_single_armature=True,
        export_force_sampling=True,
        export_frame_range=False,
        export_optimize_animation_size=False,
        export_skins=True,
        export_yup=True,
        export_apply=False,
        export_current_frame=False,
        export_rest_position_armature=True,
        export_def_bones=False,
        export_leaf_bone=False,
        export_all_influences=False,
        export_morph=False,
        use_selection=False,
        use_visible=True,
        export_image_format="NONE",
    )


def write_json(path: Path, obj: dict) -> None:
    path.write_text(json.dumps(obj, indent=2, sort_keys=True) + "\n")


def main() -> int:
    args = after_ddash()
    if len(args) < 2:
        print("usage: export_character.py -- <blend> <build_dir>", file=sys.stderr)
        return 2
    blend = Path(args[0]).resolve()
    build = Path(args[1]).resolve()
    build.mkdir(parents=True, exist_ok=True)

    bpy.ops.wm.open_mainfile(filepath=str(blend))
    scene = bpy.context.scene
    scene.render.fps = 60
    scene.render.fps_base = 1.0

    arm = find_armature()
    character = custom(arm, "tincture_character", blend.stem)
    table = load_frame_data()
    moves = table["moves"]

    strip_materials_to_placeholder()

    # Drop stale hashed GLBs for this character so a hash change does not leave orphans.
    for old in build.glob(f"{character}.*.glb"):
        old.unlink()
    tmp = build / f"{character}.tmp.glb"
    export_glb(tmp)
    digest = sanitize_glb(tmp)
    glb_name = f"{character}.{digest[:12]}.glb"
    glb_path = build / glb_name
    tmp.replace(glb_path)

    written = []
    actions = [a for a in bpy.data.actions if not a.name.startswith("tmp")]
    for action in sorted(actions, key=lambda a: a.name):
        clip = action.name
        if clip not in moves:
            print(f"export: skip action {clip!r} (not in frame_data_v0.json)")
            continue
        row = moves[clip]
        ticks = int(row["ticks"])
        sidecar = sample_clip(arm, action, character, clip, ticks, row, glb_name, digest)
        out = build / f"{character}_{clip}.json"
        write_json(out, sidecar)
        written.append(out.name)
        print(f"export: {out.name} ticks={ticks}")

    write_json(
        build / f"{character}.manifest.json",
        {
            "character": character,
            "glb": glb_name,
            "glbHash": digest,
            "sidecars": written,
            "source": str(blend.name),
        },
    )
    print(f"export: {glb_name} sha256={digest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
