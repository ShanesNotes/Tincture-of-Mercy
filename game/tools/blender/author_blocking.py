#!/usr/bin/env python3
"""Author from-scratch blocking .blend sources (rigs + clips).

Usage (from repo root):
  blender --background --python game/tools/blender/author_blocking.py -- all
  blender --background --python game/tools/blender/author_blocking.py -- wolf
  blender --background --python game/tools/blender/author_blocking.py -- kalev
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

PLACEHOLDER = (0.973, 0.945, 0.898, 1.0)


def after_ddash() -> list[str]:
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else sys.argv[1:]


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def load_json(path: Path) -> dict:
    return json.loads(path.read_text())


def frame_data() -> dict:
    return load_json(Path(__file__).resolve().parent / "frame_data_v0.json")["moves"]


def reset_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.fps = 60
    scene.render.fps_base = 1.0
    scene.frame_start = 1
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0


def placeholder_mat():
    mat = bpy.data.materials.new("placeholder")
    mat.diffuse_color = PLACEHOLDER
    return mat


def make_box(name: str, size: tuple[float, float, float], center: tuple[float, float, float]):
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
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def add_bone(arm, name, head, tail, parent=None, connect=False):
    eb = arm.data.edit_bones.new(name)
    eb.head = Vector(head)
    eb.tail = Vector(tail)
    eb.roll = 0.0
    if parent:
        eb.parent = arm.data.edit_bones[parent]
        eb.use_connect = connect
    return eb


def new_armature(name: str):
    data = bpy.data.armatures.new(name)
    data.display_type = "OCTAHEDRAL"
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    return obj


def bind(arm, parts, mesh_name: str, mat):
    for obj, bone in parts:
        vg = obj.vertex_groups.new(name=bone)
        vg.add(list(range(len(obj.data.vertices))), 1.0, "REPLACE")
        obj.data.materials.append(mat)
    bpy.ops.object.select_all(action="DESELECT")
    for obj, _ in parts:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = parts[0][0]
    bpy.ops.object.join()
    mesh = bpy.context.active_object
    mesh.name = mesh_name
    mesh.parent = arm
    mod = mesh.modifiers.new("Armature", "ARMATURE")
    mod.object = arm
    mod.use_vertex_groups = True
    return mesh


def new_action(arm, name: str, ticks: int):
    action = bpy.data.actions.new(name)
    action.use_fake_user = True
    action.use_frame_range = True
    action.frame_start = 1
    action.frame_end = ticks
    action.slots.new("OBJECT", arm.name)
    ad = arm.animation_data_create()
    ad.action = action
    ad.action_slot = action.slots[0]
    return action


def key_rot(pb, frame, euler):
    pb.rotation_mode = "XYZ"
    pb.rotation_euler = euler
    pb.keyframe_insert(data_path="rotation_euler", frame=frame)


def key_loc(pb, frame, loc):
    pb.location = loc
    pb.keyframe_insert(data_path="location", frame=frame)


def linearize(action):
    if not action.layers:
        return
    strip = action.layers[0].strips[0]
    for bag in strip.channelbags:
        for fc in bag.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"
                kp.handle_left_type = "FREE"
                kp.handle_right_type = "FREE"


def stash_nla(arm, actions):
    ad = arm.animation_data
    ad.action = None
    for action in actions:
        track = ad.nla_tracks.new()
        track.name = action.name
        strip = track.strips.new(action.name, 1, action)
        if action.slots:
            try:
                strip.action_slot = action.slots[0]
            except Exception:
                pass


def bone(arm, name):
    return arm.pose.bones[name]


# ---------------------------------------------------------------------------
# Kalev
# ---------------------------------------------------------------------------

def build_kalev(root: Path, moves: dict) -> Path:
    reset_scene()
    props = load_json(root / "game" / "assets" / "src" / "kalev_proportions.json")
    H = float(props["head_height_m"])
    ratio = float(props["head_body_ratio"])
    height = H * ratio
    shoulder_w = float(props["shoulder_width_heads"]) * H
    hand_len = float(props["hand_length_heads"]) * H

    head_h = 1.00 * H
    neck_h = 0.35 * H
    torso_h = 2.40 * H
    pelvis_h = 0.55 * H
    thigh_h = 1.70 * H
    shin_h = 1.30 * H
    foot_h = 0.20 * H
    assert abs((head_h + neck_h + torso_h + pelvis_h + thigh_h + shin_h + foot_h) - height) < 1e-6

    z_foot = 0.0
    z_ankle = foot_h
    z_knee = z_ankle + shin_h
    z_hip = z_knee + thigh_h
    z_waist = z_hip + pelvis_h
    z_chest = z_waist + torso_h * 0.55
    z_shoulder = z_waist + torso_h
    z_neck = z_shoulder + neck_h
    z_crown = z_neck + head_h
    upper_arm = 1.25 * H
    forearm = 1.10 * H
    half_sh = shoulder_w / 2.0

    arm = new_armature("KalevArmature")
    bpy.ops.object.mode_set(mode="EDIT")
    add_bone(arm, "root", (0, 0, 0), (0, -0.08, 0))
    add_bone(arm, "hips", (0, 0, z_hip), (0, 0, z_waist), "root")
    add_bone(arm, "spine", (0, 0, z_waist), (0, 0, z_chest), "hips")
    add_bone(arm, "chest", (0, 0, z_chest), (0, 0, z_shoulder), "spine")
    add_bone(arm, "neck", (0, 0, z_shoulder), (0, 0, z_neck), "chest")
    add_bone(arm, "head", (0, 0, z_neck), (0, 0, z_crown), "neck")
    add_bone(arm, "shoulder.L", (0, 0, z_shoulder), (half_sh, 0, z_shoulder), "chest")
    add_bone(arm, "upper_arm.L", (half_sh, 0, z_shoulder), (half_sh, 0, z_shoulder - upper_arm), "shoulder.L")
    add_bone(arm, "forearm.L", (half_sh, 0, z_shoulder - upper_arm), (half_sh, 0, z_shoulder - upper_arm - forearm), "upper_arm.L", True)
    add_bone(arm, "hand.L", (half_sh, 0, z_shoulder - upper_arm - forearm), (half_sh, 0, z_shoulder - upper_arm - forearm - hand_len), "forearm.L", True)
    add_bone(arm, "shoulder.R", (0, 0, z_shoulder), (-half_sh, 0, z_shoulder), "chest")
    add_bone(arm, "upper_arm.R", (-half_sh, 0, z_shoulder), (-half_sh, 0, z_shoulder - upper_arm), "shoulder.R")
    add_bone(arm, "forearm.R", (-half_sh, 0, z_shoulder - upper_arm), (-half_sh, 0, z_shoulder - upper_arm - forearm), "upper_arm.R", True)
    add_bone(arm, "hand.R", (-half_sh, 0, z_shoulder - upper_arm - forearm), (-half_sh, 0, z_shoulder - upper_arm - forearm - hand_len), "forearm.R", True)
    add_bone(arm, "thigh.L", (0.09, 0, z_hip), (0.09, 0, z_knee), "hips")
    add_bone(arm, "shin.L", (0.09, 0, z_knee), (0.09, 0, z_ankle), "thigh.L", True)
    add_bone(arm, "foot.L", (0.09, 0, z_ankle), (0.09, -0.20, z_foot), "shin.L")
    add_bone(arm, "thigh.R", (-0.09, 0, z_hip), (-0.09, 0, z_knee), "hips")
    add_bone(arm, "shin.R", (-0.09, 0, z_knee), (-0.09, 0, z_ankle), "thigh.R", True)
    add_bone(arm, "foot.R", (-0.09, 0, z_ankle), (-0.09, -0.20, z_foot), "shin.R")
    add_bone(arm, "weapon_base", (-half_sh, 0, z_shoulder - upper_arm - forearm), (-half_sh, -0.04, z_shoulder - upper_arm - forearm), "hand.R")
    add_bone(arm, "weapon_tip", (-half_sh, -0.04, z_shoulder - upper_arm - forearm), (-half_sh, -0.72, z_shoulder - upper_arm - forearm + 0.04), "weapon_base", True)
    bpy.ops.object.mode_set(mode="OBJECT")

    mat = placeholder_mat()
    parts = [
        (make_box("hips_m", (0.26, 0.16, pelvis_h), (0, 0, z_hip + pelvis_h / 2)), "hips"),
        (make_box("spine_m", (0.24, 0.14, torso_h * 0.55), (0, 0, z_waist + torso_h * 0.275)), "spine"),
        (make_box("chest_m", (0.32, 0.16, torso_h * 0.45), (0, 0, z_chest + torso_h * 0.225)), "chest"),
        (make_box("neck_m", (0.08, 0.08, neck_h), (0, 0, z_shoulder + neck_h / 2)), "neck"),
        (make_box("head_m", (0.16, 0.18, head_h), (0, -0.01, z_neck + head_h / 2)), "head"),
        (make_box("ual", (0.07, 0.07, upper_arm), (half_sh, 0, z_shoulder - upper_arm / 2)), "upper_arm.L"),
        (make_box("fal", (0.06, 0.06, forearm), (half_sh, 0, z_shoulder - upper_arm - forearm / 2)), "forearm.L"),
        (make_box("hl", (0.05, 0.08, hand_len), (half_sh, 0, z_shoulder - upper_arm - forearm - hand_len / 2)), "hand.L"),
        (make_box("uar", (0.07, 0.07, upper_arm), (-half_sh, 0, z_shoulder - upper_arm / 2)), "upper_arm.R"),
        (make_box("far", (0.06, 0.06, forearm), (-half_sh, 0, z_shoulder - upper_arm - forearm / 2)), "forearm.R"),
        (make_box("hr", (0.05, 0.08, hand_len), (-half_sh, 0, z_shoulder - upper_arm - forearm - hand_len / 2)), "hand.R"),
        (make_box("thl", (0.09, 0.10, thigh_h), (0.09, 0, z_hip - thigh_h / 2)), "thigh.L"),
        (make_box("shl", (0.07, 0.08, shin_h), (0.09, 0, z_knee - shin_h / 2)), "shin.L"),
        (make_box("ftl", (0.08, 0.22, 0.05), (0.09, -0.08, 0.025)), "foot.L"),
        (make_box("thr", (0.09, 0.10, thigh_h), (-0.09, 0, z_hip - thigh_h / 2)), "thigh.R"),
        (make_box("shr", (0.07, 0.08, shin_h), (-0.09, 0, z_knee - shin_h / 2)), "shin.R"),
        (make_box("ftr", (0.08, 0.22, 0.05), (-0.09, -0.08, 0.025)), "foot.R"),
        (make_box("hearth_iron", (0.03, 0.68, 0.03), (-half_sh, -0.36, z_shoulder - upper_arm - forearm + 0.02)), "weapon_base"),
    ]
    bind(arm, parts, "KalevMesh", mat)

    arm["tincture_character"] = "kalev_blocking"
    arm["tincture_weapon_base"] = "weapon_base"
    arm["tincture_weapon_tip"] = "weapon_tip"
    arm["tincture_feet"] = json.dumps(["foot.L", "foot.R"])
    arm["tincture_hurtboxes"] = json.dumps(
        [
            {"name": "head", "bone": "head", "radius": 0.11},
            {"name": "torso", "bone": "spine", "radius": 0.16},
            {"name": "hips", "bone": "hips", "radius": 0.14},
        ]
    )
    arm["tincture_head_body_ratio"] = ratio
    arm["tincture_head_height_m"] = H

    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="POSE")
    for pb in arm.pose.bones:
        pb.rotation_mode = "XYZ"

    actions = []

    # light1 11/4/20
    t = moves["light1"]["ticks"]
    a = new_action(arm, "light1", t)
    r, ua, fa = bone(arm, "root"), bone(arm, "upper_arm.R"), bone(arm, "forearm.R")
    key_rot(ua, 1, (0, 0, 0))
    key_rot(fa, 1, (0, 0, 0))
    key_loc(r, 1, (0, 0, 0))
    key_rot(ua, 11, (1.1, 0.15, -0.4))
    key_rot(fa, 11, (0.6, 0, 0))
    key_loc(r, 11, (0, 0, 0))
    key_rot(ua, 12, (-0.9, 0.1, 0.2))
    key_rot(fa, 12, (0.15, 0, 0))
    key_loc(r, 12, (0, -0.18, 0))
    key_rot(ua, 15, (-0.85, 0.1, 0.2))
    key_rot(fa, 15, (0.1, 0, 0))
    key_loc(r, 15, (0, -0.22, 0))
    key_rot(ua, t, (0, 0, 0))
    key_rot(fa, t, (0, 0, 0))
    key_loc(r, t, (0, -0.08, 0))
    linearize(a)
    actions.append(a)

    # heavy 24/5/34
    t = moves["heavy"]["ticks"]
    a = new_action(arm, "heavy", t)
    ua_l, fa_l = bone(arm, "upper_arm.L"), bone(arm, "forearm.L")
    sp = bone(arm, "spine")
    key_rot(ua, 1, (0, 0, 0))
    key_rot(fa, 1, (0, 0, 0))
    key_rot(ua_l, 1, (0, 0, 0))
    key_rot(sp, 1, (0, 0, 0))
    key_loc(r, 1, (0, 0, 0))
    key_rot(ua, 24, (1.4, 0.2, -0.5))
    key_rot(fa, 24, (0.9, 0, 0))
    key_rot(ua_l, 24, (1.1, -0.15, 0.3))
    key_rot(sp, 24, (0.35, 0, 0))
    key_loc(r, 24, (0, 0.04, 0))
    key_rot(ua, 25, (-1.1, 0.15, 0.15))
    key_rot(fa, 25, (0.2, 0, 0))
    key_rot(ua_l, 25, (-0.4, 0, 0))
    key_rot(sp, 25, (-0.25, 0, 0))
    key_loc(r, 25, (0, -0.35, 0))
    key_rot(ua, 29, (-1.05, 0.15, 0.15))
    key_rot(sp, 29, (-0.2, 0, 0))
    key_loc(r, 29, (0, -0.42, 0))
    key_rot(ua, t, (0, 0, 0))
    key_rot(fa, t, (0, 0, 0))
    key_rot(ua_l, t, (0, 0, 0))
    key_rot(sp, t, (0, 0, 0))
    key_loc(r, t, (0, -0.12, 0))
    linearize(a)
    actions.append(a)

    # roll 43t medium
    t = moves["roll"]["ticks"]
    a = new_action(arm, "roll", t)
    th_l, th_r = bone(arm, "thigh.L"), bone(arm, "thigh.R")
    key_loc(r, 1, (0, 0, 0))
    key_rot(sp, 1, (0, 0, 0))
    key_rot(th_l, 1, (0, 0, 0))
    key_rot(th_r, 1, (0, 0, 0))
    key_loc(r, 8, (0, -0.6, 0.15))
    key_rot(sp, 8, (1.2, 0, 0))
    key_rot(th_l, 8, (1.1, 0, 0))
    key_rot(th_r, 8, (1.0, 0, 0))
    key_loc(r, 22, (0, -1.6, 0.2))
    key_rot(sp, 22, (2.6, 0, 0))
    key_loc(r, 36, (0, -2.3, 0.05))
    key_rot(sp, 36, (0.3, 0, 0))
    key_rot(th_l, 36, (0.2, 0, 0))
    key_rot(th_r, 36, (0.15, 0, 0))
    key_loc(r, t, (0, -2.5, 0))
    key_rot(sp, t, (0, 0, 0))
    key_rot(th_l, t, (0, 0, 0))
    key_rot(th_r, t, (0, 0, 0))
    linearize(a)
    actions.append(a)

    # guard enter/hold/exit
    t = moves["guard"]["ticks"]
    a = new_action(arm, "guard", t)
    key_rot(ua, 1, (0, 0, 0))
    key_rot(fa, 1, (0, 0, 0))
    key_rot(ua_l, 1, (0, 0, 0))
    key_rot(fa_l, 1, (0, 0, 0))
    key_loc(r, 1, (0, 0, 0))
    key_rot(ua, 8, (-0.7, 0.4, 0.6))
    key_rot(fa, 8, (0.8, 0, 0.3))
    key_rot(ua_l, 8, (-0.5, -0.3, -0.4))
    key_rot(fa_l, 8, (0.6, 0, 0))
    key_rot(ua, 24, (-0.7, 0.4, 0.6))
    key_rot(fa, 24, (0.8, 0, 0.3))
    key_rot(ua_l, 24, (-0.5, -0.3, -0.4))
    key_rot(ua, t, (0, 0, 0))
    key_rot(fa, t, (0, 0, 0))
    key_rot(ua_l, t, (0, 0, 0))
    key_rot(fa_l, t, (0, 0, 0))
    linearize(a)
    actions.append(a)

    stash_nla(arm, actions)
    bpy.ops.object.mode_set(mode="OBJECT")
    out = root / "game" / "assets" / "src" / "kalev_blocking.blend"
    out.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(out), compress=True)
    print(f"authored {out}")
    return out


# ---------------------------------------------------------------------------
# Wolf
# ---------------------------------------------------------------------------

def build_wolf(root: Path, moves: dict) -> Path:
    reset_scene()
    props = load_json(root / "game" / "assets" / "src" / "wolf_proportions.json")
    sh = float(props["shoulder_height_m"])
    body = float(props["body_length_m"])
    head_l = float(props["head_length_m"])
    neck_l = float(props["neck_length_m"])
    tail_l = float(props["tail_length_m"])
    chest_w = float(props["chest_width_m"])

    # Face -Y. Shoulder over origin-forward third of body.
    y_hip = body * 0.35
    y_shoulder = -body * 0.35
    z_back = sh
    z_chest = sh + 0.02
    hip_w = chest_w * 0.7
    leg = sh * 0.92

    arm = new_armature("WolfArmature")
    bpy.ops.object.mode_set(mode="EDIT")
    add_bone(arm, "root", (0, 0, 0), (0, -0.08, 0))
    add_bone(arm, "hips", (0, y_hip, z_back), (0, y_hip - 0.08, z_back), "root")
    add_bone(arm, "spine", (0, y_hip, z_back), (0, 0, z_back + 0.02), "hips")
    add_bone(arm, "chest", (0, 0, z_back + 0.02), (0, y_shoulder, z_chest), "spine")
    add_bone(arm, "neck", (0, y_shoulder, z_chest), (0, y_shoulder - neck_l * 0.7, z_chest + 0.06), "chest")
    add_bone(arm, "head", (0, y_shoulder - neck_l * 0.7, z_chest + 0.06), (0, y_shoulder - neck_l * 0.7 - head_l * 0.45, z_chest + 0.04), "neck")
    add_bone(arm, "jaw", (0, y_shoulder - neck_l * 0.7 - head_l * 0.15, z_chest - 0.02), (0, y_shoulder - neck_l * 0.7 - head_l * 0.4, z_chest - 0.06), "head")
    add_bone(arm, "weapon_base", (0, y_shoulder - neck_l * 0.7 - head_l * 0.15, z_chest + 0.02), (0, y_shoulder - neck_l * 0.7 - head_l * 0.2, z_chest + 0.02), "head")
    add_bone(arm, "weapon_tip", (0, y_shoulder - neck_l * 0.7 - head_l * 0.2, z_chest + 0.02), (0, y_shoulder - neck_l - head_l, z_chest - 0.02), "weapon_base", True)
    add_bone(arm, "tail.1", (0, y_hip, z_back), (0, y_hip + tail_l * 0.4, z_back - 0.02), "hips")
    add_bone(arm, "tail.2", (0, y_hip + tail_l * 0.4, z_back - 0.02), (0, y_hip + tail_l * 0.75, z_back - 0.08), "tail.1", True)
    add_bone(arm, "tail.3", (0, y_hip + tail_l * 0.75, z_back - 0.08), (0, y_hip + tail_l, z_back - 0.16), "tail.2", True)

    def add_leg(tag, x, y, z_top):
        add_bone(arm, f"thigh.{tag}", (x, y, z_top), (x, y + 0.02, z_top - leg * 0.48), "hips" if tag.startswith("B") else "chest")
        add_bone(arm, f"shin.{tag}", (x, y + 0.02, z_top - leg * 0.48), (x, y + 0.01, 0.06), f"thigh.{tag}", True)
        add_bone(arm, f"foot.{tag}", (x, y + 0.01, 0.06), (x, y - 0.10, 0.0), f"shin.{tag}")

    add_leg("FL", chest_w * 0.42, y_shoulder + 0.04, z_chest)
    add_leg("FR", -chest_w * 0.42, y_shoulder + 0.04, z_chest)
    add_leg("BL", hip_w * 0.45, y_hip - 0.02, z_back)
    add_leg("BR", -hip_w * 0.45, y_hip - 0.02, z_back)
    bpy.ops.object.mode_set(mode="OBJECT")

    mat = placeholder_mat()
    parts = [
        (make_box("body", (chest_w, body * 0.85, 0.28), (0, 0, z_back)), "spine"),
        (make_box("chest_m", (chest_w * 1.05, 0.22, 0.30), (0, y_shoulder, z_chest)), "chest"),
        (make_box("hips_m", (hip_w, 0.20, 0.26), (0, y_hip, z_back)), "hips"),
        (make_box("neck_m", (0.12, neck_l, 0.14), (0, y_shoulder - neck_l * 0.4, z_chest + 0.04)), "neck"),
        (make_box("head_m", (0.14, head_l * 0.55, 0.14), (0, y_shoulder - neck_l * 0.7 - head_l * 0.22, z_chest + 0.05)), "head"),
        (make_box("muzzle", (0.08, head_l * 0.45, 0.08), (0, y_shoulder - neck_l * 0.7 - head_l * 0.7, z_chest + 0.01)), "weapon_base"),
        (make_box("tail_m", (0.05, tail_l * 0.7, 0.05), (0, y_hip + tail_l * 0.4, z_back - 0.06)), "tail.1"),
        (make_box("thFL", (0.07, 0.08, leg * 0.48), (chest_w * 0.42, y_shoulder + 0.04, z_chest - leg * 0.24)), "thigh.FL"),
        (make_box("shFL", (0.055, 0.06, leg * 0.42), (chest_w * 0.42, y_shoulder + 0.05, 0.06 + leg * 0.21)), "shin.FL"),
        (make_box("ftFL", (0.06, 0.14, 0.04), (chest_w * 0.42, y_shoulder - 0.02, 0.02)), "foot.FL"),
        (make_box("thFR", (0.07, 0.08, leg * 0.48), (-chest_w * 0.42, y_shoulder + 0.04, z_chest - leg * 0.24)), "thigh.FR"),
        (make_box("shFR", (0.055, 0.06, leg * 0.42), (-chest_w * 0.42, y_shoulder + 0.05, 0.06 + leg * 0.21)), "shin.FR"),
        (make_box("ftFR", (0.06, 0.14, 0.04), (-chest_w * 0.42, y_shoulder - 0.02, 0.02)), "foot.FR"),
        (make_box("thBL", (0.08, 0.09, leg * 0.48), (hip_w * 0.45, y_hip - 0.02, z_back - leg * 0.24)), "thigh.BL"),
        (make_box("shBL", (0.06, 0.07, leg * 0.42), (hip_w * 0.45, y_hip, 0.06 + leg * 0.21)), "shin.BL"),
        (make_box("ftBL", (0.06, 0.14, 0.04), (hip_w * 0.45, y_hip - 0.06, 0.02)), "foot.BL"),
        (make_box("thBR", (0.08, 0.09, leg * 0.48), (-hip_w * 0.45, y_hip - 0.02, z_back - leg * 0.24)), "thigh.BR"),
        (make_box("shBR", (0.06, 0.07, leg * 0.42), (-hip_w * 0.45, y_hip, 0.06 + leg * 0.21)), "shin.BR"),
        (make_box("ftBR", (0.06, 0.14, 0.04), (-hip_w * 0.45, y_hip - 0.06, 0.02)), "foot.BR"),
    ]
    bind(arm, parts, "WolfMesh", mat)

    arm["tincture_character"] = "wolf"
    arm["tincture_weapon_base"] = "weapon_base"
    arm["tincture_weapon_tip"] = "weapon_tip"
    arm["tincture_feet"] = json.dumps(["foot.FL", "foot.FR", "foot.BL", "foot.BR"])
    arm["tincture_hurtboxes"] = json.dumps(
        [
            {"name": "body", "bone": "spine", "radius": 0.16},
            {"name": "head", "bone": "head", "radius": 0.10},
        ]
    )

    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="POSE")
    for pb in arm.pose.bones:
        pb.rotation_mode = "XYZ"

    r = bone(arm, "root")
    neck = bone(arm, "neck")
    head = bone(arm, "head")
    spine = bone(arm, "spine")
    t1 = bone(arm, "tail.1")
    th_fl, th_fr = bone(arm, "thigh.FL"), bone(arm, "thigh.FR")
    th_bl, th_br = bone(arm, "thigh.BL"), bone(arm, "thigh.BR")
    actions = []

    def gait_keys(action_name, ticks, step_y, circle=False, crouch=0.0):
        a = new_action(arm, action_name, ticks)
        for fr, u in ((1, 0.0), (ticks // 2, 0.5), (ticks, 1.0)):
            if circle:
                ang = u * (math.pi / 2.0)
                rad = 1.15
                key_loc(r, fr, (math.sin(ang) * rad, -((1 - math.cos(ang)) * rad), 0))
                key_rot(r, fr, (0, 0, -ang))
            else:
                key_loc(r, fr, (0, -step_y * u, 0))
                key_rot(r, fr, (0, 0, 0))
            phase = u * math.pi * 2
            lift = 0.35 + crouch
            key_rot(th_fl, fr, (math.sin(phase) * lift, 0, 0))
            key_rot(th_br, fr, (math.sin(phase) * lift, 0, 0))
            key_rot(th_fr, fr, (math.sin(phase + math.pi) * lift, 0, 0))
            key_rot(th_bl, fr, (math.sin(phase + math.pi) * lift, 0, 0))
            key_rot(neck, fr, (0.05 + crouch * 0.3, 0, 0))
            key_rot(t1, fr, (0, 0, math.sin(phase) * 0.15))
        linearize(a)
        return a

    actions.append(gait_keys("idle", moves["idle"]["ticks"], 0.0, crouch=0.05))
    actions.append(gait_keys("stalk", moves["stalk"]["ticks"], 1.1, crouch=0.2))
    actions.append(gait_keys("circle", moves["circle"]["ticks"], 0.0, circle=True, crouch=0.12))

    # lunge 30/8/22
    t = moves["lunge"]["ticks"]
    a = new_action(arm, "lunge", t)
    key_loc(r, 1, (0, 0, 0))
    key_rot(spine, 1, (0, 0, 0))
    key_rot(th_fl, 1, (0, 0, 0))
    key_rot(th_fr, 1, (0, 0, 0))
    key_rot(neck, 1, (0, 0, 0))
    key_loc(r, 30, (0, 0.15, 0.02))
    key_rot(spine, 30, (0.45, 0, 0))
    key_rot(th_fl, 30, (0.7, 0, 0))
    key_rot(th_fr, 30, (0.7, 0, 0))
    key_rot(th_bl, 30, (-0.4, 0, 0))
    key_rot(th_br, 30, (-0.4, 0, 0))
    key_rot(neck, 30, (0.35, 0, 0))
    key_loc(r, 31, (0, -1.4, 0.35))
    key_rot(spine, 31, (-0.2, 0, 0))
    key_rot(th_fl, 31, (-0.5, 0, 0))
    key_rot(th_fr, 31, (-0.5, 0, 0))
    key_rot(neck, 31, (-0.15, 0, 0))
    key_loc(r, 38, (0, -2.4, 0.08))
    key_rot(spine, 38, (0.1, 0, 0))
    key_loc(r, t, (0, -2.5, 0))
    key_rot(spine, t, (0, 0, 0))
    key_rot(th_fl, t, (0, 0, 0))
    key_rot(th_fr, t, (0, 0, 0))
    key_rot(th_bl, t, (0, 0, 0))
    key_rot(th_br, t, (0, 0, 0))
    key_rot(neck, t, (0, 0, 0))
    linearize(a)
    actions.append(a)

    # flinch
    t = moves["flinch"]["ticks"]
    a = new_action(arm, "flinch", t)
    key_loc(r, 1, (0, 0, 0))
    key_rot(spine, 1, (0, 0, 0))
    key_rot(head, 1, (0, 0, 0))
    key_loc(r, 4, (0, 0.18, 0.04))
    key_rot(spine, 4, (0.25, 0, 0.15))
    key_rot(head, 4, (0.2, 0, 0.2))
    key_loc(r, t, (0, 0.06, 0))
    key_rot(spine, t, (0, 0, 0))
    key_rot(head, t, (0, 0, 0))
    linearize(a)
    actions.append(a)

    # death crumple forward
    t = moves["death_crumple_fwd"]["ticks"]
    a = new_action(arm, "death_crumple_fwd", t)
    key_loc(r, 1, (0, 0, 0))
    key_rot(spine, 1, (0, 0, 0))
    key_rot(neck, 1, (0, 0, 0))
    key_rot(th_fl, 1, (0, 0, 0))
    key_loc(r, 20, (0, -0.35, 0.05))
    key_rot(spine, 20, (0.9, 0, 0))
    key_rot(neck, 20, (0.6, 0, 0))
    key_loc(r, t, (0, -0.55, -0.12))
    key_rot(spine, t, (1.35, 0, 0))
    key_rot(neck, t, (0.8, 0, 0))
    key_rot(th_fl, t, (0.4, 0, 0))
    key_rot(th_fr, t, (0.35, 0, 0))
    linearize(a)
    actions.append(a)

    # death crumple back
    t = moves["death_crumple_back"]["ticks"]
    a = new_action(arm, "death_crumple_back", t)
    key_loc(r, 1, (0, 0, 0))
    key_rot(spine, 1, (0, 0, 0))
    key_rot(neck, 1, (0, 0, 0))
    key_loc(r, 20, (0, 0.25, 0.08))
    key_rot(spine, 20, (-0.8, 0, 0))
    key_rot(neck, 20, (-0.4, 0, 0))
    key_loc(r, t, (0, 0.4, -0.1))
    key_rot(spine, t, (-1.2, 0, 0))
    key_rot(neck, t, (-0.5, 0, 0))
    key_rot(th_bl, t, (0.5, 0, 0))
    key_rot(th_br, t, (0.45, 0, 0))
    linearize(a)
    actions.append(a)

    stash_nla(arm, actions)
    bpy.ops.object.mode_set(mode="OBJECT")
    out = root / "game" / "assets" / "src" / "wolf.blend"
    out.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(out), compress=True)
    print(f"authored {out}")
    return out


def main() -> int:
    args = after_ddash()
    target = (args[0] if args else "all").lower()
    root = repo_root()
    moves = frame_data()
    if target in ("all", "wolf"):
        build_wolf(root, moves)
    if target in ("all", "kalev", "kalev_blocking"):
        build_kalev(root, moves)
    if target not in ("all", "wolf", "kalev", "kalev_blocking"):
        print(f"unknown target {target}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
