#!/usr/bin/env python3
"""Generate curated runtime pixel assets for the Ironwood cabin/world lab.

This is intentionally deterministic and source-preserving: first-draft AI/reference
images stay in art/**/source or character reference folders; this script produces
small, palette-pinned runtime sheets that Godot can import cleanly.
"""
from __future__ import annotations

import json
import argparse
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / "art"

RGBA = tuple[int, int, int, int]
TRANSPARENT: RGBA = (0, 0, 0, 0)
FORCE_CHARACTER_OVERWRITE = False

PROJECT = {
    "ink": (26, 22, 18, 255),
    "ink_soft": (43, 37, 32, 255),
    "damp_ash": (107, 99, 88, 255),
    "vellum_bone": (232, 223, 201, 255),
    "vellum_warm": (239, 230, 208, 255),
    "candle_white": (246, 241, 224, 255),
    "candle_pure": (251, 247, 235, 255),
    "lake_slate": (91, 103, 112, 255),
    "lake_deep": (44, 53, 64, 255),
    "pine_shadow": (42, 51, 41, 255),
    "rot_brown": (74, 58, 38, 255),
    "cedar_brown": (107, 74, 44, 255),
    "old_ochre": (176, 138, 74, 255),
    "pale_heal": (122, 140, 94, 255),
    "pale_heal_deep": (90, 107, 72, 255),
    "verdigris": (110, 138, 124, 255),
    "icon_gold": (199, 154, 58, 255),
    "icon_gold_warm": (217, 176, 87, 255),
    "dragon_red": (138, 32, 24, 255),
    "ember_red": (198, 62, 31, 255),
    "ember_glow": (226, 106, 58, 255),
    "witte_white": (244, 246, 247, 255),
    "witte_blue": (213, 222, 228, 255),
    "witte_cool": (143, 163, 176, 255),
}

LENA = {k: PROJECT[k] for k in [
    "ink", "ink_soft", "damp_ash", "old_ochre", "vellum_warm", "vellum_bone",
    "candle_white", "rot_brown", "cedar_brown", "pine_shadow", "pale_heal", "pale_heal_deep",
]}
BOY = {k: PROJECT[k] for k in [
    "ink", "ink_soft", "damp_ash", "old_ochre", "vellum_warm", "candle_white",
    "rot_brown", "cedar_brown", "pine_shadow",
]}
MOTHER = {k: PROJECT[k] for k in [
    "ink", "ink_soft", "damp_ash", "old_ochre", "vellum_bone", "vellum_warm",
    "candle_white", "rot_brown", "cedar_brown",
]}
WOLF = {k: PROJECT[k] for k in [
    "ink", "ink_soft", "damp_ash", "vellum_bone", "pine_shadow", "rot_brown",
    "cedar_brown", "ember_red", "dragon_red",
]}
KALEV = {k: PROJECT[k] for k in [
    "ink", "ink_soft", "damp_ash", "old_ochre", "vellum_bone", "vellum_warm",
    "candle_white", "rot_brown", "cedar_brown", "pine_shadow", "ember_red",
]}


def ensure(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def rgba(rgb: tuple[int, int, int] | tuple[int, int, int, int]) -> RGBA:
    if len(rgb) == 4:
        return rgb  # type: ignore[return-value]
    return (rgb[0], rgb[1], rgb[2], 255)  # type: ignore[index]


def put_shadow_feet(draw: ImageDraw.ImageDraw, cx: int, baseline: int, width: int, c: RGBA) -> None:
    # Anchor-pixel shadow kept opaque/palette-safe for validator baseline.
    draw.line((cx - width // 2, baseline, cx + width // 2, baseline), fill=c)


def draw_person_64(kind: str, direction: str, phase: int, action: str = "idle") -> Image.Image:
    p = LENA if kind == "lena" else KALEV
    img = Image.new("RGBA", (64, 96), TRANSPARENT)
    d = ImageDraw.Draw(img)
    cx = 32
    walk = action.startswith("walk")
    bob_cycle = [0, 1, 0, -1, 0]
    leg_cycle = [-3, -1, 3, 1, 0]
    bob = bob_cycle[phase % 5] if walk else ([0, 1, 0, 0, -1][phase % 5] if action.startswith("idle") else 0)
    leg = leg_cycle[phase % 5] if walk else 0
    if direction == "left":
        cx -= 1
    if direction == "right":
        cx += 1

    face = p["vellum_warm"]
    skin_shadow = p["old_ochre"]
    hair = p["cedar_brown"] if kind == "lena" else p["ink_soft"]
    hair_dark = p["rot_brown"] if kind == "lena" else p["ink"]
    coat = p["pale_heal"] if kind == "lena" else p["rot_brown"]
    coat_shadow = p["pale_heal_deep"] if kind == "lena" else p["pine_shadow"]
    trim = p["candle_white"] if kind == "lena" else p["old_ochre"]
    boot = p["ink_soft"]

    # coordinate bands
    hy = 10 + bob
    ty = 34 + bob
    waist = 57 + bob
    base = 84
    put_shadow_feet(d, cx, base, 18, p["ink_soft"])

    if direction in ("down", "left", "right"):
        # hair hood/back mass
        if direction == "down":
            d.rectangle((cx - 10, hy + 1, cx + 10, hy + 15), fill=hair_dark)
            d.rectangle((cx - 8, hy + 4, cx + 8, hy + 20), fill=face)
            d.rectangle((cx - 10, hy + 4, cx - 7, hy + 22), fill=hair)
            d.rectangle((cx + 7, hy + 4, cx + 10, hy + 22), fill=hair)
            d.point((cx - 4, hy + 13), fill=p["ink"])
            d.point((cx + 4, hy + 13), fill=p["ink"])
            d.line((cx - 2, hy + 18, cx + 2, hy + 18), fill=skin_shadow)
            if kind == "lena":
                d.line((cx - 8, hy + 8, cx + 8, hy + 8), fill=p["old_ochre"])
        else:
            sign = -1 if direction == "left" else 1
            d.rectangle((cx - 8, hy + 3, cx + 8, hy + 20), fill=hair_dark)
            d.rectangle((cx - 5, hy + 6, cx + 7, hy + 19), fill=face)
            d.rectangle((cx - 9, hy + 5, cx - 5, hy + 22), fill=hair)
            eye_x = cx + 5 * sign
            d.point((eye_x, hy + 13), fill=p["ink"])
            d.point((eye_x, hy + 14), fill=p["ink"])
    else:  # up/back
        d.rectangle((cx - 10, hy + 1, cx + 10, hy + 22), fill=hair_dark)
        d.rectangle((cx - 8, hy + 6, cx + 8, hy + 24), fill=hair)
        if kind == "lena":
            d.line((cx - 7, hy + 11, cx + 7, hy + 11), fill=p["old_ochre"])

    # torso/cloak silhouette
    if direction in ("left", "right"):
        sign = -1 if direction == "left" else 1
        d.polygon([(cx - 7, ty), (cx + 8, ty + 2), (cx + 9, waist), (cx - 8, waist + 3)], fill=coat_shadow)
        d.rectangle((cx - 5, ty + 2, cx + 7, waist), fill=coat)
        d.line((cx + 8 * sign, ty + 5, cx + 11 * sign, ty + 23), fill=trim)
        arm_x = cx + 8 * sign
        d.line((arm_x, ty + 10, arm_x + 5 * sign, ty + 31), fill=coat_shadow, width=3)
        if action == "hand_on_shoulder":
            d.line((arm_x, ty + 11, arm_x + 15 * sign, ty + 12), fill=coat_shadow, width=3)
            d.rectangle((arm_x + 14 * sign - (2 if sign > 0 else 0), ty + 10, arm_x + 14 * sign + (2 if sign < 0 else 0), ty + 14), fill=face)
        d.line((cx - 4, waist, cx - 7 + leg, base), fill=boot, width=4)
        d.line((cx + 4, waist, cx + 5 - leg, base), fill=boot, width=4)
    else:
        d.polygon([(cx - 12, ty), (cx + 12, ty), (cx + 15, waist + 3), (cx - 15, waist + 3)], fill=coat_shadow)
        d.rectangle((cx - 9, ty + 1, cx + 9, waist + 1), fill=coat)
        d.line((cx, ty + 3, cx, waist), fill=trim)
        arm_l = cx - 13 - (1 if walk and leg > 0 else 0)
        arm_r = cx + 13 + (1 if walk and leg < 0 else 0)
        d.line((cx - 10, ty + 7, arm_l, waist - 6), fill=coat_shadow, width=3)
        d.line((cx + 10, ty + 7, arm_r, waist - 6), fill=coat_shadow, width=3)
        if action == "hand_on_shoulder":
            d.line((cx - 9, ty + 9, cx - 22, ty + 15), fill=coat_shadow, width=3)
            d.rectangle((cx - 24, ty + 13, cx - 20, ty + 17), fill=face)
        d.line((cx - 5, waist + 1, cx - 7 + leg, base), fill=boot, width=4)
        d.line((cx + 5, waist + 1, cx + 7 - leg, base), fill=boot, width=4)
        d.point((cx - 7 + leg, base), fill=p["ink"])
        d.point((cx + 7 - leg, base), fill=p["ink"])
    return img


def draw_boy_48(direction: str, phase: int, action: str = "idle") -> Image.Image:
    p = BOY
    img = Image.new("RGBA", (48, 64), TRANSPARENT)
    d = ImageDraw.Draw(img)
    cx = 24
    walk = action.startswith("walk")
    bob = ([0, 1, 0, -1, 0][phase % 5] if walk else [0, 0, 1, 0, -1][phase % 5])
    leg = [-2, -1, 2, 1, 0][phase % 5] if walk else 0
    hy = 6 + bob
    ty = 25 + bob
    waist = 42 + bob
    base = 56
    face = p["vellum_warm"]
    hair = p["cedar_brown"]
    coat = p["rot_brown"]
    scarf = p["old_ochre"]
    boot = p["ink_soft"]
    put_shadow_feet(d, cx, base, 13, p["ink_soft"])

    if direction == "up":
        d.rectangle((cx - 7, hy, cx + 7, hy + 14), fill=p["rot_brown"])
        d.rectangle((cx - 5, hy + 4, cx + 5, hy + 15), fill=hair)
    elif direction in ("left", "right"):
        sign = -1 if direction == "left" else 1
        d.rectangle((cx - 6, hy, cx + 6, hy + 13), fill=hair)
        d.rectangle((cx - 4, hy + 4, cx + 5, hy + 14), fill=face)
        d.point((cx + 4 * sign, hy + 9), fill=p["ink"])
    else:
        d.rectangle((cx - 7, hy, cx + 7, hy + 12), fill=hair)
        d.rectangle((cx - 5, hy + 4, cx + 5, hy + 16), fill=face)
        d.point((cx - 3, hy + 10), fill=p["ink"])
        d.point((cx + 3, hy + 10), fill=p["ink"])
        d.line((cx - 1, hy + 14, cx + 1, hy + 14), fill=p["old_ochre"])

    d.rectangle((cx - 7, ty, cx + 7, waist), fill=coat)
    d.line((cx - 7, ty + 3, cx + 7, ty + 3), fill=scarf)
    if direction in ("left", "right"):
        sign = -1 if direction == "left" else 1
        d.line((cx + 7 * sign, ty + 4, cx + 11 * sign, waist - 2), fill=p["ink_soft"], width=2)
    else:
        d.line((cx - 8, ty + 5, cx - 10, waist - 2), fill=p["ink_soft"], width=2)
        d.line((cx + 8, ty + 5, cx + 10, waist - 2), fill=p["ink_soft"], width=2)
    if action == "receive_bread":
        d.line((cx - 7, ty + 7, cx - 14, ty + 12), fill=p["ink_soft"], width=2)
        d.line((cx + 7, ty + 7, cx + 14, ty + 12), fill=p["ink_soft"], width=2)
        d.rectangle((cx - 4, ty + 13, cx + 4, ty + 16), fill=p["old_ochre"])
        d.line((cx - 3, ty + 13, cx + 3, ty + 13), fill=p["candle_white"])
    d.line((cx - 4, waist, cx - 5 + leg, base), fill=boot, width=3)
    d.line((cx + 4, waist, cx + 5 - leg, base), fill=boot, width=3)
    return img


def compose_sheet(frames: list[list[Image.Image]], fw: int, fh: int) -> Image.Image:
    rows = len(frames)
    cols = max(len(r) for r in frames)
    sheet = Image.new("RGBA", (fw * cols, fh * rows), TRANSPARENT)
    for y, row in enumerate(frames):
        for x, frame in enumerate(row):
            sheet.alpha_composite(frame, (x * fw, y * fh))
    return sheet


def save_png(img: Image.Image, path: Path) -> Path:
    ensure(path.parent)
    img.save(path)
    return path


def save_character_png(img: Image.Image, path: Path) -> Path:
    """Save a generated character fallback without clobbering curated art.

    The environment generator is allowed to iterate freely, but runtime
    character sheets may have PixelLab source-intake, Aseprite polish, or manual
    touch-up at the same canonical path. Default behavior is therefore
    conservative: fill gaps, never replace existing character sheets unless the
    caller explicitly passes --force-character-overwrite.
    """
    if path.exists() and not FORCE_CHARACTER_OVERWRITE:
        print(f"preserve existing character sheet: {path.relative_to(ROOT)}")
        return path
    return save_png(img, path)


def generate_lena() -> tuple[Path, Path]:
    directions = ["down", "left", "up", "right"]
    rows: list[list[Image.Image]] = []
    for direction in directions:
        rows.append([draw_person_64("lena", direction, i, "idle") for i in range(5)])
    for direction in directions:
        rows.append([draw_person_64("lena", direction, i, "walk") for i in range(5)])
    rows.append([draw_person_64("lena", "down", i, "hand_on_shoulder") for i in range(5)])
    return (
        save_character_png(compose_sheet(rows, 64, 96), ART / "characters/lena/sheets/lena_locomotion_64x96.png"),
        save_character_png(compose_sheet(rows[:8], 64, 96), ART / "characters/lena/sheets/lena_pixellab_locomotion_64x96.png"),
    )


def generate_boy() -> tuple[Path, Path]:
    directions = ["down", "left", "up", "right"]
    rows: list[list[Image.Image]] = []
    for direction in directions:
        rows.append([draw_boy_48(direction, i, "idle") for i in range(5)])
    for direction in directions:
        rows.append([draw_boy_48(direction, i, "walk") for i in range(5)])
    rows.append([draw_boy_48("down", i, "receive_bread") for i in range(5)])
    sheet = compose_sheet(rows, 48, 64)
    boy_path = save_character_png(sheet, ART / "characters/boy/sheets/boy_locomotion_48x64.png")
    iiro_path = save_character_png(compose_sheet(rows[:8], 48, 64), ART / "characters/iiro/sheets/iiro_locomotion_48x64.png")
    return boy_path, iiro_path


def generate_mother() -> tuple[Path, Path]:
    p = MOTHER
    rows: list[list[Image.Image]] = []
    for row_name in ["breath_calm", "breath_thinning", "fading"]:
        row: list[Image.Image] = []
        for i in range(5):
            img = Image.new("RGBA", (96, 48), TRANSPARENT)
            d = ImageDraw.Draw(img)
            base = 44
            pulse = [0, -1, 0, 1, 0][i]
            fade = row_name == "fading"
            skin = p["vellum_bone"] if row_name != "fading" else p["damp_ash"]
            blanket = p["rot_brown"] if row_name != "fading" else p["ink_soft"]
            highlight = p["old_ochre"] if row_name != "fading" else p["damp_ash"]
            # bed/pillow included so bedside sprite reads even over floor.
            d.rectangle((8, 28, 88, base), fill=p["cedar_brown"])
            d.rectangle((10, 18, 28, 33), fill=p["candle_white"])
            d.rectangle((25, 20 + pulse, 82, 36 + pulse), fill=blanket)
            d.line((27, 22 + pulse, 80, 22 + pulse), fill=highlight)
            d.rectangle((24, 16 + pulse, 42, 29 + pulse), fill=skin)
            d.rectangle((23, 15 + pulse, 34, 24 + pulse), fill=p["cedar_brown"])
            d.point((39, 22 + pulse), fill=p["ink"])
            if row_name == "breath_thinning" and i in (2, 3):
                d.point((48, 18, ), fill=p["candle_white"])
            if fade:
                d.line((43, 30, 57, 30), fill=p["damp_ash"])
            # validator baseline anchor.
            d.line((8, base, 88, base), fill=p["ink_soft"])
            row.append(img)
        rows.append(row)
    sheet = compose_sheet(rows, 96, 48)
    mother_path = save_character_png(sheet, ART / "characters/mother/sheets/mother_bedside_96x48.png")
    anna_path = save_character_png(sheet, ART / "characters/anna/sheets/anna_bedside_96x48.png")
    return mother_path, anna_path


def transform_frame(frame: Image.Image, dx: int = 0, dy: int = 0) -> Image.Image:
    out = Image.new("RGBA", frame.size, TRANSPARENT)
    out.alpha_composite(frame, (dx, dy))
    return out


def load_kalev_base(row: int, col: int = 0) -> Image.Image:
    sheet = Image.open(ART / "characters/kalev/sheets/kalev_locomotion_64x96.png").convert("RGBA")
    return sheet.crop((col * 64, row * 96, (col + 1) * 64, (row + 1) * 96))




def clamp_baseline(img: Image.Image, baseline: int, anchor_color: RGBA, left: int = 16, right: int = 48) -> Image.Image:
    px = img.load()
    for y in range(baseline + 1, img.height):
        for x in range(img.width):
            px[x, y] = TRANSPARENT
    d = ImageDraw.Draw(img)
    d.line((left, baseline, right, baseline), fill=anchor_color)
    return img

def draw_kalev_action(action: str, phase: int) -> Image.Image:
    p = KALEV
    row_hint = 0 if action in {"write_name", "wash", "warm", "administer_ember", "self_administer", "recoil_neutral", "hurt", "dodge_brace", "push_guard"} else 1
    base = load_kalev_base(row_hint, phase % 5)
    img = base.copy()
    d = ImageDraw.Draw(img)
    cx = 32
    base_y = 84
    # Keep every action anchored even if the visible pose is seated/downed.
    d.line((cx - 9, base_y, cx + 9, base_y), fill=p["ink_soft"])
    if action == "write_name":
        d.rectangle((20, 52, 45, 60), fill=p["vellum_bone"])
        d.line((24, 55, 39, 55), fill=p["damp_ash"])
        d.line((36, 47, 43, 55), fill=p["old_ochre"], width=2)
    elif action == "wash":
        d.rectangle((22, 56, 43, 62), fill=p["damp_ash"])
        d.line((24, 55, 41, 55), fill=p["candle_white"])
        d.point((29 + phase % 3, 54), fill=p["vellum_bone"])
    elif action == "warm":
        d.rectangle((26, 58, 38, 64), fill=p["ember_red"])
        d.point((31, 56), fill=p["old_ochre"])
        d.line((22, 46, 29, 56), fill=p["old_ochre"], width=2)
        d.line((42, 46, 35, 56), fill=p["old_ochre"], width=2)
    elif action == "sit":
        img = transform_frame(load_kalev_base(0, phase % 5), 0, 7)
        d = ImageDraw.Draw(img)
        d.rectangle((19, 67, 45, 76), fill=p["rot_brown"])
        d.line((20, base_y, 44, base_y), fill=p["ink_soft"])
    elif action == "kneel":
        img = transform_frame(load_kalev_base(0, phase % 5), 0, 4)
        d = ImageDraw.Draw(img)
        d.rectangle((23, 68, 42, 76), fill=p["pine_shadow"])
        d.line((22, base_y, 42, base_y), fill=p["ink_soft"])
    elif action == "administer_ember":
        d.line((39, 45, 53, 53), fill=p["old_ochre"], width=2)
        d.rectangle((51, 51, 55, 57), fill=p["ember_red"])
    elif action == "self_administer":
        d.rectangle((35, 34, 39, 42), fill=p["ember_red"])
        d.line((38, 43, 34, 49), fill=p["old_ochre"], width=2)
    elif action == "recoil_neutral":
        img = transform_frame(load_kalev_base(0, phase % 5), -2 + phase % 2, 0)
        d = ImageDraw.Draw(img)
        d.line((22, 43, 15, 37), fill=p["pine_shadow"], width=3)
        d.line((42, 43, 49, 37), fill=p["pine_shadow"], width=3)
        d.line((23, base_y, 41, base_y), fill=p["ink_soft"])
    elif action == "hurt":
        img = transform_frame(load_kalev_base(0, phase % 5), -3, 2)
        d = ImageDraw.Draw(img)
        d.line((42, 32, 48, 26), fill=p["ember_red"])
        d.line((21, base_y, 39, base_y), fill=p["ink_soft"])
    elif action == "dodge_brace":
        img = transform_frame(load_kalev_base(1, phase % 5), -4 if phase % 2 else 3, 1)
        d = ImageDraw.Draw(img)
        d.rectangle((17, 47, 25, 61), fill=p["pine_shadow"])
        d.line((20, base_y, 43, base_y), fill=p["ink_soft"])
    elif action == "push_guard":
        d.line((19, 43, 10, 41), fill=p["pine_shadow"], width=3)
        d.line((45, 43, 55, 41), fill=p["pine_shadow"], width=3)
        d.rectangle((8, 38, 13, 45), fill=p["old_ochre"])
        d.rectangle((52, 38, 57, 45), fill=p["old_ochre"])
    elif action == "downed":
        img = Image.new("RGBA", (64, 96), TRANSPARENT)
        d = ImageDraw.Draw(img)
        d.rectangle((17, 67, 48, 81), fill=p["rot_brown"])
        d.rectangle((38, 60, 53, 73), fill=p["vellum_warm"])
        d.rectangle((37, 59, 49, 66), fill=p["ink_soft"])
        d.line((14, base_y, 51, base_y), fill=p["ink_soft"])
    return clamp_baseline(img, base_y, p["ink_soft"], 15, 49)


def generate_kalev_missing() -> list[Path]:
    outputs: list[Path] = []
    care_rows = [[draw_kalev_action(action, i) for i in range(5)] for action in ["write_name", "wash", "warm", "sit", "kneel"]]
    outputs.append(save_character_png(compose_sheet(care_rows, 64, 96), ART / "characters/kalev/sheets/kalev_care_64x96.png"))
    tincture_rows = [[draw_kalev_action(action, i) for i in range(5)] for action in ["administer_ember", "self_administer", "recoil_neutral"]]
    outputs.append(save_character_png(compose_sheet(tincture_rows, 64, 96), ART / "characters/kalev/sheets/kalev_tincture_64x96.png"))
    combat_rows = [[draw_kalev_action(action, i) for i in range(5)] for action in ["hurt", "dodge_brace", "push_guard", "downed"]]
    outputs.append(save_character_png(compose_sheet(combat_rows, 64, 96), ART / "characters/kalev/sheets/kalev_combat_64x96.png"))
    return outputs


def draw_wolf_frame(direction: str, phase: int, action: str) -> Image.Image:
    p = WOLF
    img = Image.new("RGBA", (96, 64), TRANSPARENT)
    d = ImageDraw.Draw(img)
    cx, base = 48, 60
    leg = [-4, -2, 4, 2, 0][phase % 5] if "walk" in action or action == "lunge" else 0
    put_shadow_feet(d, cx, base, 36, p["ink_soft"])
    body = p["damp_ash"]
    dark = p["ink_soft"]
    hi = p["vellum_bone"]
    if direction in ("left", "right") or action in {"lunge", "hurt_flee_death"}:
        sign = -1 if direction == "left" else 1
        if action == "hurt_flee_death":
            sign = -1
        bx = cx + (4 if action == "lunge" else 0) * sign
        d.rectangle((bx - 23, 30, bx + 16, 45), fill=body)
        d.rectangle((bx - 18, 26, bx + 10, 32), fill=dark)
        hx0 = bx + 14 * sign
        d.rectangle((hx0 - (2 if sign > 0 else 12), 25, hx0 + (12 if sign > 0 else 2), 39), fill=dark)
        d.point((hx0 + 8 * sign, 31), fill=p["ember_red"] if action == "lunge" else p["ink"])
        d.line((bx - 25 * sign, 32, bx - 35 * sign, 26), fill=dark, width=3)
        for lx, off in [(-16, leg), (-5, -leg), (6, -leg), (15, leg)]:
            d.line((bx + lx, 44, bx + lx + off // 2, base), fill=p["ink"], width=3)
        if action == "pack_call":
            d.line((hx0 + 8 * sign, 25, hx0 + 14 * sign, 19), fill=hi, width=2)
        if action == "hurt_flee_death":
            d.line((bx - 10, 28, bx - 4, 22), fill=p["dragon_red"])
    else:
        d.rectangle((cx - 16, 27, cx + 16, 44), fill=body)
        d.rectangle((cx - 12, 20, cx + 12, 34), fill=dark)
        if direction == "down":
            d.point((cx - 5, 27), fill=p["ink"])
            d.point((cx + 5, 27), fill=p["ink"])
        d.line((cx - 9, 44, cx - 12 + leg, base), fill=p["ink"], width=3)
        d.line((cx + 9, 44, cx + 12 - leg, base), fill=p["ink"], width=3)
    return img


def generate_wolf() -> tuple[Path, Path]:
    full_specs = [
        ("idle", "down"), ("walk_down", "down"), ("walk_left", "left"), ("walk_up", "up"),
        ("walk_right", "right"), ("pack_call", "right"), ("lunge", "right"), ("hurt_flee_death", "left"),
    ]
    full_rows = [[draw_wolf_frame(direction, i, action) for i in range(5)] for action, direction in full_specs]
    locomotion_specs = [
        ("idle_down", "down"), ("walk_down", "down"), ("idle_left", "left"), ("walk_left", "left"),
        ("idle_up", "up"), ("walk_up", "up"), ("idle_right", "right"), ("walk_right", "right"),
    ]
    locomotion_rows = [[draw_wolf_frame(direction, i, action) for i in range(5)] for action, direction in locomotion_specs]
    return (
        save_character_png(compose_sheet(full_rows, 96, 64), ART / "characters/wolf/sheets/wolf_full_sheet_96x64.png"),
        save_character_png(compose_sheet(locomotion_rows, 96, 64), ART / "characters/wolf/sheets/wolf_locomotion_96x64.png"),
    )


def generate_birdie() -> Path:
    p = PROJECT
    frames = []
    for i in range(4):
        img = Image.new("RGBA", (32, 32), TRANSPARENT)
        d = ImageDraw.Draw(img)
        flap = [0, -2, 0, 2][i]
        d.line((8, 27, 24, 27), fill=p["ink_soft"])
        d.rectangle((13, 12, 20, 20), fill=p["pine_shadow"])
        d.rectangle((15, 8, 22, 15), fill=p["damp_ash"])
        d.point((20, 11), fill=p["ink"])
        d.point((23, 12), fill=p["old_ochre"])
        d.line((13, 15, 7, 13 + flap), fill=p["lake_deep"], width=2)
        d.line((18, 20, 16, 26), fill=p["old_ochre"])
        d.line((20, 20, 22, 26), fill=p["old_ochre"])
        frames.append(img)
    return save_character_png(compose_sheet([frames], 32, 32), ART / "characters/birdie/sheets/birdie_idle_32x32.png")


def draw_birdie_child_48(direction: str, phase: int) -> Image.Image:
    p = PROJECT
    img = Image.new("RGBA", (48, 64), TRANSPARENT)
    d = ImageDraw.Draw(img)
    cx = 24
    bob = [0, 0, 1, 0, -1][phase % 5]
    hy = 8 + bob
    ty = 27 + bob
    waist = 43 + bob
    base = 56
    put_shadow_feet(d, cx, base, 15, p["ink_soft"])

    face = p["vellum_warm"]
    hair = p["ink_soft"]
    hair_dark = p["ink"]
    coat = p["rot_brown"]
    coat_shadow = p["pine_shadow"]
    scarf = p["old_ochre"]
    mitten = p["damp_ash"]
    boot = p["ink_soft"]

    if direction == "up":
        d.rectangle((cx - 7, hy, cx + 7, hy + 12), fill=hair_dark)
        d.rectangle((cx - 6, hy + 5, cx + 6, hy + 15), fill=hair)
        d.rectangle((cx - 12, ty + 2, cx + 10, waist + 4), fill=coat_shadow)
        d.rectangle((cx - 9, ty, cx + 9, waist + 2), fill=coat)
        d.line((cx - 3, ty + 4, cx - 3, waist), fill=scarf)
    elif direction in ("left", "right"):
        sign = -1 if direction == "left" else 1
        d.rectangle((cx - 7, hy, cx + 6, hy + 13), fill=hair_dark)
        d.rectangle((cx - 4, hy + 5, cx + 4, hy + 15), fill=face)
        d.point((cx + 4 * sign, hy + 10), fill=p["ink"])
        d.rectangle((cx - 10, ty + 1, cx + 9, waist + 3), fill=coat_shadow)
        d.rectangle((cx - 7, ty, cx + 8, waist + 1), fill=coat)
        d.rectangle((cx - 9, ty - 3, cx + 3, ty + 2), fill=coat)
        d.line((cx + 7 * sign, ty + 7, cx + 11 * sign, waist - 3), fill=coat_shadow, width=3)
        d.rectangle((cx + 10 * sign - (2 if sign > 0 else 0), waist - 5, cx + 10 * sign + (2 if sign < 0 else 0), waist - 2), fill=mitten)
        d.line((cx - 4, waist, cx - 5, base), fill=boot, width=3)
        d.line((cx + 4, waist, cx + 5, base), fill=boot, width=3)
        return img
    else:
        d.rectangle((cx - 7, hy, cx + 7, hy + 12), fill=hair_dark)
        d.rectangle((cx - 4, hy + 5, cx + 4, hy + 16), fill=face)
        d.point((cx - 2, hy + 10), fill=p["ink"])
        d.point((cx + 2, hy + 10), fill=p["ink"])
        d.line((cx - 2, hy + 14, cx + 2, hy + 14), fill=p["old_ochre"])
        d.rectangle((cx - 12, ty + 2, cx + 10, waist + 4), fill=coat_shadow)
        d.rectangle((cx - 9, ty, cx + 9, waist + 2), fill=coat)
        d.rectangle((cx - 13, ty - 3, cx - 2, ty + 2), fill=coat)
        d.line((cx - 8, ty + 8, cx - 13, waist - 4), fill=coat_shadow, width=3)
        d.line((cx + 8, ty + 8, cx + 12, waist - 4), fill=coat_shadow, width=3)
        d.rectangle((cx + 10, waist - 7, cx + 14, waist - 3), fill=mitten)

    d.line((cx - 4, waist, cx - 5, base), fill=boot, width=3)
    d.line((cx + 4, waist, cx + 5, base), fill=boot, width=3)
    return img


def generate_birdie_character_idle() -> Path:
    rows = [[draw_birdie_child_48(direction, i) for i in range(5)] for direction in ["down", "left", "up", "right"]]
    return save_character_png(compose_sheet(rows, 48, 64), ART / "characters/birdie/sheets/birdie_character_idle_48x64.png")


def add_texture(d: ImageDraw.ImageDraw, base: tuple[int, int, int, int], alt: tuple[int, int, int, int], mod: int = 5) -> None:
    """Deterministic single-pixel texture for 32x32 hand-authored tiles.

    The first pass of this tileset intentionally used very simple icon tiles so
    the Godot scene could be wired quickly. This pass keeps the same runtime
    contract and tile indices, but pushes the tiles closer to a real production
    read: clustered noise, contact shadows, knots, snow catch-lights, and
    readable silhouettes instead of flat placeholder blocks.
    """
    del base
    for y in range(32):
        for x in range(32):
            if (x * 3 + y * 5 + (x // 7) * 11 + (y // 5) * 13) % mod == 0:
                d.point((x, y), fill=alt)


def cluster_texture(d: ImageDraw.ImageDraw, alt: RGBA, mod: int, y_min: int = 0, y_max: int = 31) -> None:
    """Add sparse 2px clusters; more organic than even checker noise."""
    for y in range(y_min, y_max + 1):
        for x in range(32):
            h = (x * 37 + y * 61 + (x * y) * 3) & 0xFF
            if h % mod == 0:
                d.point((x, y), fill=alt)
                if x + 1 < 32 and h % (mod * 2) == 0:
                    d.point((x + 1, y), fill=alt)


def snow_speckles(d: ImageDraw.ImageDraw, bright: RGBA, cool: RGBA) -> None:
    for y in range(32):
        for x in range(32):
            h = (x * 17 + y * 29 + x * y) % 97
            if h == 0:
                d.point((x, y), fill=bright)
            elif h == 7:
                d.point((x, y), fill=cool)


def plank_lines(d: ImageDraw.ImageDraw, base: RGBA, dark: RGBA, light: RGBA, shadow: RGBA) -> None:
    d.rectangle((0, 0, 31, 31), fill=base)
    for yy in [7, 15, 23, 31]:
        d.line((0, yy, 31, yy), fill=dark)
        if yy > 1:
            d.line((0, yy - 1, 31, yy - 1), fill=shadow)
    # Staggered plank seams avoid a wallpaper grid.
    for yy, seams in [(0, [11, 24]), (8, [6, 19]), (16, [14, 27]), (24, [9, 21])]:
        for xx in seams:
            d.line((xx, yy + 1, xx, min(yy + 6, 31)), fill=dark)
            if xx + 1 < 32:
                d.point((xx + 1, yy + 2), fill=light)
    for x, y in [(5, 5), (18, 11), (27, 20), (12, 27)]:
        d.ellipse((x, y, x + 3, y + 2), outline=dark)
        d.point((x + 1, y + 1), fill=shadow)


def draw_log_wall(d: ImageDraw.ImageDraw, p: dict[str, RGBA]) -> None:
    d.rectangle((0, 0, 31, 31), fill=p["ink_soft"])
    for y in [1, 8, 15, 22]:
        d.rectangle((0, y, 31, y + 5), fill=p["cedar_brown"])
        d.line((0, y, 31, y), fill=p["old_ochre"])
        d.line((0, y + 5, 31, y + 5), fill=p["rot_brown"])
        # Log end/knots.
        for x in [5 + (y % 4), 20 - (y % 3)]:
            d.ellipse((x, y + 1, x + 3, y + 3), outline=p["rot_brown"])
            d.point((x + 1, y + 2), fill=p["ink_soft"])
    d.rectangle((0, 29, 31, 31), fill=p["ink_soft"])


def tile_image(name: str) -> Image.Image:
    p = PROJECT
    img = Image.new("RGBA", (32, 32), p["witte_blue"])
    d = ImageDraw.Draw(img)
    if name == "snow":
        d.rectangle((0, 0, 31, 31), fill=p["witte_blue"])
        d.polygon([(0, 24), (31, 19), (31, 31), (0, 31)], fill=p["witte_cool"])
        d.line((0, 23, 31, 18), fill=p["witte_white"])
        snow_speckles(d, p["witte_white"], p["lake_slate"])
        d.point((7, 11), fill=p["candle_pure"])
        d.point((23, 7), fill=p["candle_pure"])
    elif name == "snow_shadow":
        d.rectangle((0, 0, 31, 31), fill=p["witte_blue"])
        d.polygon([(0, 20), (9, 16), (20, 18), (31, 13), (31, 31), (0, 31)], fill=p["witte_cool"])
        cluster_texture(d, p["lake_slate"], 37)
        d.line((0, 20, 9, 16, 20, 18, 31, 13), fill=p["witte_white"])
    elif name == "road":
        d.rectangle((0, 0, 31, 31), fill=p["damp_ash"])
        d.polygon([(0, 0), (31, 4), (31, 31), (0, 27)], fill=p["rot_brown"])
        d.polygon([(0, 3), (31, 7), (31, 26), (0, 23)], fill=p["damp_ash"])
        cluster_texture(d, p["old_ochre"], 19)
        cluster_texture(d, p["ink_soft"], 31)
        # Trampled snow flecks across the mud.
        for x, y in [(3, 9), (8, 21), (15, 13), (22, 26), (27, 16)]:
            d.line((x, y, x + 3, y - 1), fill=p["witte_blue"])
    elif name == "road_edge":
        d.rectangle((0, 0, 31, 31), fill=p["witte_blue"])
        snow_speckles(d, p["witte_white"], p["witte_cool"])
        d.polygon([(0, 8), (31, 1), (31, 31), (0, 31)], fill=p["damp_ash"])
        d.line((0, 7, 31, 0), fill=p["witte_white"])
        cluster_texture(d, p["rot_brown"], 23, 7, 31)
        for x, y in [(4, 17), (13, 23), (25, 10)]:
            d.point((x, y), fill=p["old_ochre"])
    elif name == "floor":
        plank_lines(d, p["cedar_brown"], p["rot_brown"], p["old_ochre"], p["ink_soft"])
    elif name == "floor_shadow":
        plank_lines(d, p["rot_brown"], p["ink_soft"], p["old_ochre"], p["ink"])
        d.rectangle((0, 0, 31, 31), outline=p["ink_soft"])
        d.polygon([(0, 0), (31, 0), (31, 10), (0, 18)], fill=p["ink_soft"])
        cluster_texture(d, p["cedar_brown"], 29)
    elif name == "wall":
        draw_log_wall(d, p)
    elif name == "door":
        draw_log_wall(d, p)
        d.rectangle((6, 3, 25, 31), fill=p["ink_soft"])
        d.rectangle((8, 6, 23, 31), fill=p["rot_brown"])
        for y in [10, 17, 24]:
            d.line((9, y, 22, y), fill=p["cedar_brown"])
        d.line((13, 7, 13, 31), fill=p["ink_soft"])
        d.point((21, 18), fill=p["icon_gold_warm"])
        d.line((8, 5, 23, 5), fill=p["old_ochre"])
    elif name == "tree":
        d.rectangle((0, 0, 31, 31), fill=p["witte_blue"])
        snow_speckles(d, p["witte_white"], p["witte_cool"])
        d.ellipse((7, 25, 25, 31), fill=p["witte_cool"])
        d.rectangle((14, 18, 18, 31), fill=p["rot_brown"])
        d.line((18, 20, 18, 31), fill=p["ink_soft"])
        d.polygon([(16, 1), (5, 18), (27, 18)], fill=p["pine_shadow"])
        d.polygon([(16, 6), (3, 24), (29, 24)], fill=p["pale_heal_deep"])
        d.polygon([(16, 12), (6, 29), (27, 29)], fill=p["pine_shadow"])
        d.line((8, 18, 24, 18), fill=p["witte_white"])
        d.line((6, 24, 26, 24), fill=p["witte_white"])
        d.point((13, 11), fill=p["verdigris"])
        d.point((20, 16), fill=p["verdigris"])
    elif name == "brush":
        d.rectangle((0, 0, 31, 31), fill=p["witte_blue"])
        snow_speckles(d, p["witte_white"], p["witte_cool"])
        d.ellipse((3, 23, 29, 30), fill=p["witte_cool"])
        for x, top, color in [(5, 16, "pale_heal_deep"), (10, 12, "pine_shadow"), (15, 14, "pale_heal"), (21, 11, "pine_shadow"), (26, 15, "pale_heal_deep")]:
            d.line((x, 27, x + 2, top), fill=p[color], width=2)
            d.point((x + 1, top), fill=p["witte_white"])
            d.point((x + 2, top + 3), fill=p["verdigris"])
    elif name == "stone":
        d.rectangle((0, 0, 31, 31), fill=p["witte_blue"])
        snow_speckles(d, p["witte_white"], p["witte_cool"])
        d.ellipse((7, 16, 26, 26), fill=p["ink_soft"])
        d.polygon([(9, 16), (20, 13), (27, 20), (24, 25), (10, 25), (6, 21)], fill=p["damp_ash"])
        d.line((10, 16, 20, 14), fill=p["vellum_bone"])
        d.line((9, 25, 25, 25), fill=p["ink_soft"])
        d.point((18, 19), fill=p["lake_slate"])
    elif name == "hearth":
        plank_lines(d, p["cedar_brown"], p["rot_brown"], p["old_ochre"], p["ink_soft"])
        d.rectangle((3, 4, 28, 29), fill=p["ink_soft"])
        d.rectangle((6, 7, 25, 26), fill=p["damp_ash"])
        d.rectangle((8, 9, 23, 24), outline=p["vellum_bone"])
        d.polygon([(12, 23), (15, 13), (18, 23)], fill=p["ember_red"])
        d.polygon([(14, 22), (16, 15), (20, 22)], fill=p["ember_glow"])
        d.point((16, 12), fill=p["candle_pure"])
    elif name == "bed":
        plank_lines(d, p["cedar_brown"], p["rot_brown"], p["old_ochre"], p["ink_soft"])
        d.rectangle((3, 7, 29, 28), fill=p["ink_soft"])
        d.rectangle((5, 9, 28, 26), fill=p["rot_brown"])
        d.rectangle((6, 10, 14, 18), fill=p["candle_white"])
        d.rectangle((14, 10, 27, 25), fill=p["old_ochre"])
        d.line((15, 15, 27, 15), fill=p["cedar_brown"])
        d.line((6, 26, 28, 26), fill=p["ink_soft"])
    elif name == "table":
        plank_lines(d, p["cedar_brown"], p["rot_brown"], p["old_ochre"], p["ink_soft"])
        d.ellipse((5, 9, 27, 23), fill=p["ink_soft"])
        d.rectangle((7, 9, 25, 21), fill=p["rot_brown"])
        d.line((8, 10, 24, 10), fill=p["old_ochre"])
        d.point((13, 14), fill=p["candle_white"])
        for x in [9, 23]:
            d.line((x, 21, x, 29), fill=p["ink_soft"], width=2)
    elif name == "icon":
        draw_log_wall(d, p)
        d.rectangle((6, 4, 25, 26), fill=p["ink_soft"])
        d.rectangle((8, 6, 23, 24), fill=p["icon_gold"])
        d.rectangle((13, 10, 18, 17), fill=p["vellum_warm"])
        d.point((15, 12), fill=p["candle_pure"])
        d.line((10, 21, 21, 21), fill=p["dragon_red"])
        d.point((15, 20), fill=p["ember_red"])
    elif name == "rug":
        # Repeatable fabric tile. The earlier bordered version looked like many
        # tiny picture frames when used as a multi-tile cabin rug.
        d.rectangle((0, 0, 31, 31), fill=p["dragon_red"])
        for y in [3, 11, 19, 27]:
            d.line((0, y, 31, y), fill=p["rot_brown"])
        for x in [7, 15, 23, 31]:
            d.line((x, 0, x, 31), fill=p["ember_red"])
        for x, y in [(6, 6), (18, 10), (27, 18), (11, 24), (23, 28)]:
            d.point((x, y), fill=p["old_ochre"])
        d.line((0, 0, 31, 0), fill=p["old_ochre"])
        d.line((0, 31, 31, 31), fill=p["ink_soft"])
    elif name == "fence":
        d.rectangle((0, 0, 31, 31), fill=p["witte_blue"])
        snow_speckles(d, p["witte_white"], p["witte_cool"])
        for x in [4, 14, 24]:
            d.rectangle((x, 8, x + 4, 29), fill=p["rot_brown"])
            d.line((x, 8, x + 4, 8), fill=p["old_ochre"])
            d.line((x + 4, 9, x + 4, 29), fill=p["ink_soft"])
        d.rectangle((0, 14, 31, 18), fill=p["cedar_brown"])
        d.line((0, 14, 31, 14), fill=p["old_ochre"])
        d.rectangle((0, 21, 31, 23), fill=p["rot_brown"])
        d.line((0, 23, 31, 23), fill=p["ink_soft"])
    elif name == "logs":
        d.rectangle((0, 0, 31, 31), fill=p["witte_blue"])
        snow_speckles(d, p["witte_white"], p["witte_cool"])
        d.ellipse((4, 24, 29, 31), fill=p["witte_cool"])
        for y, dx in [(14, 3), (19, 0), (24, 4)]:
            d.rectangle((5 + dx, y, 27, y + 4), fill=p["rot_brown"])
            d.line((6 + dx, y, 26, y), fill=p["old_ochre"])
            d.ellipse((4 + dx, y, 9 + dx, y + 4), outline=p["old_ochre"])
            d.point((7 + dx, y + 2), fill=p["ink_soft"])
    elif name == "window":
        draw_log_wall(d, p)
        d.rectangle((5, 7, 26, 23), fill=p["ink_soft"])
        d.rectangle((7, 9, 24, 21), fill=p["lake_deep"])
        d.rectangle((8, 10, 14, 15), fill=p["lake_slate"])
        d.line((15, 9, 15, 21), fill=p["old_ochre"])
        d.line((7, 15, 24, 15), fill=p["old_ochre"])
        d.point((10, 11), fill=p["candle_white"])
    elif name == "cabinet":
        plank_lines(d, p["cedar_brown"], p["rot_brown"], p["old_ochre"], p["ink_soft"])
        d.rectangle((7, 5, 25, 29), fill=p["ink_soft"])
        d.rectangle((9, 7, 23, 27), fill=p["rot_brown"])
        d.line((16, 7, 16, 27), fill=p["ink_soft"])
        d.line((10, 13, 22, 13), fill=p["cedar_brown"])
        d.point((14, 17), fill=p["icon_gold_warm"])
        d.point((18, 17), fill=p["icon_gold_warm"])
    elif name == "threshold_light":
        d.rectangle((0, 0, 31, 31), fill=p["damp_ash"])
        cluster_texture(d, p["rot_brown"], 23)
        d.polygon([(0, 0), (31, 0), (25, 31), (6, 31)], fill=p["old_ochre"])
        d.polygon([(7, 3), (24, 3), (21, 31), (10, 31)], fill=p["icon_gold_warm"])
        cluster_texture(d, p["vellum_warm"], 17)
        d.line((6, 31, 25, 31), fill=p["candle_white"])
    elif name == "snow_drift":
        d.rectangle((0, 0, 31, 31), fill=p["witte_blue"])
        d.polygon([(0, 15), (7, 10), (17, 13), (31, 8), (31, 31), (0, 31)], fill=p["witte_white"])
        d.polygon([(0, 23), (9, 19), (21, 22), (31, 16), (31, 31), (0, 31)], fill=p["witte_cool"])
        d.line((1, 15, 7, 10, 17, 13, 30, 8), fill=p["candle_pure"])
        snow_speckles(d, p["candle_pure"], p["lake_slate"])
    elif name == "snow_tracks":
        d.rectangle((0, 0, 31, 31), fill=p["witte_blue"])
        snow_speckles(d, p["witte_white"], p["witte_cool"])
        for x, y in [(9, 7), (19, 12), (11, 18), (21, 24)]:
            d.rectangle((x, y, x + 4, y + 2), fill=p["lake_slate"])
            d.point((x + 1, y), fill=p["witte_cool"])
    elif name == "road_ruts":
        d.rectangle((0, 0, 31, 31), fill=p["damp_ash"])
        d.polygon([(0, 0), (31, 3), (31, 31), (0, 28)], fill=p["rot_brown"])
        d.polygon([(0, 4), (31, 7), (31, 25), (0, 22)], fill=p["damp_ash"])
        for x in [8, 21]:
            d.line((x, 1, x - 2, 31), fill=p["ink_soft"], width=2)
            d.line((x + 2, 1, x, 31), fill=p["old_ochre"])
        cluster_texture(d, p["witte_blue"], 23)
    elif name == "floor_light":
        plank_lines(d, p["old_ochre"], p["cedar_brown"], p["vellum_warm"], p["rot_brown"])
        d.polygon([(0, 0), (31, 0), (24, 31), (7, 31)], fill=p["icon_gold_warm"])
        cluster_texture(d, p["candle_white"], 19)
    elif name == "floor_worn":
        plank_lines(d, p["cedar_brown"], p["rot_brown"], p["old_ochre"], p["ink_soft"])
        for x, y in [(3, 5), (17, 12), (25, 27), (10, 22)]:
            d.rectangle((x, y, x + 4, y + 1), fill=p["damp_ash"])
        d.line((0, 30, 31, 30), fill=p["ink_soft"])
    elif name == "wall_corner":
        draw_log_wall(d, p)
        d.rectangle((0, 0, 5, 31), fill=p["ink_soft"])
        d.line((5, 0, 5, 31), fill=p["old_ochre"])
        d.rectangle((26, 0, 31, 31), fill=p["rot_brown"])
    elif name == "wall_shadow":
        draw_log_wall(d, p)
        d.polygon([(0, 0), (31, 0), (31, 31), (16, 31)], fill=p["ink_soft"])
        for y in [7, 14, 21]:
            d.line((0, y, 17, y), fill=p["rot_brown"])
    elif name == "roof":
        d.rectangle((0, 0, 31, 31), fill=p["ink_soft"])
        for y in [2, 8, 14, 20, 26]:
            d.line((0, y, 31, y + 4), fill=p["rot_brown"], width=3)
            d.line((0, y - 1, 31, y + 3), fill=p["cedar_brown"])
        cluster_texture(d, p["old_ochre"], 29)
    elif name == "roof_snow":
        d.rectangle((0, 0, 31, 31), fill=p["ink_soft"])
        for y in [7, 14, 21, 28]:
            d.line((0, y, 31, y + 3), fill=p["rot_brown"], width=2)
        d.polygon([(0, 0), (31, 0), (31, 12), (20, 9), (12, 14), (0, 10)], fill=p["witte_blue"])
        d.line((0, 10, 12, 14, 20, 9, 31, 12), fill=p["witte_white"])
        snow_speckles(d, p["candle_pure"], p["lake_slate"])
    elif name == "porch":
        d.rectangle((0, 0, 31, 31), fill=p["witte_cool"])
        d.rectangle((0, 5, 31, 31), fill=p["cedar_brown"])
        for y in [11, 18, 25]:
            d.line((0, y, 31, y), fill=p["rot_brown"])
        for x in [6, 18, 29]:
            d.line((x, 5, x, 31), fill=p["old_ochre"])
        d.line((0, 5, 31, 5), fill=p["witte_white"])
    elif name == "hearth_left":
        plank_lines(d, p["cedar_brown"], p["rot_brown"], p["old_ochre"], p["ink_soft"])
        d.rectangle((10, 3, 31, 29), fill=p["ink_soft"])
        d.rectangle((14, 7, 31, 26), fill=p["damp_ash"])
        d.line((15, 8, 31, 8), fill=p["vellum_bone"])
        d.polygon([(22, 24), (26, 14), (30, 24)], fill=p["ember_red"])
        d.point((27, 13), fill=p["candle_pure"])
    elif name == "hearth_right":
        plank_lines(d, p["cedar_brown"], p["rot_brown"], p["old_ochre"], p["ink_soft"])
        d.rectangle((0, 3, 21, 29), fill=p["ink_soft"])
        d.rectangle((0, 7, 17, 26), fill=p["damp_ash"])
        d.line((0, 8, 16, 8), fill=p["vellum_bone"])
        d.polygon([(3, 24), (7, 15), (12, 24)], fill=p["ember_glow"])
    elif name == "bed_head":
        plank_lines(d, p["cedar_brown"], p["rot_brown"], p["old_ochre"], p["ink_soft"])
        d.rectangle((2, 7, 31, 28), fill=p["ink_soft"])
        d.rectangle((4, 9, 31, 26), fill=p["rot_brown"])
        d.rectangle((5, 10, 22, 19), fill=p["candle_white"])
        d.rectangle((20, 11, 31, 25), fill=p["old_ochre"])
        d.line((4, 26, 31, 26), fill=p["ink_soft"])
    elif name == "bed_foot":
        plank_lines(d, p["cedar_brown"], p["rot_brown"], p["old_ochre"], p["ink_soft"])
        d.rectangle((0, 7, 29, 28), fill=p["ink_soft"])
        d.rectangle((0, 10, 27, 26), fill=p["rot_brown"])
        d.rectangle((0, 11, 22, 25), fill=p["old_ochre"])
        d.line((0, 16, 22, 16), fill=p["cedar_brown"])
        d.line((0, 26, 28, 26), fill=p["ink_soft"])
    elif name == "table_long":
        plank_lines(d, p["cedar_brown"], p["rot_brown"], p["old_ochre"], p["ink_soft"])
        d.rectangle((3, 9, 29, 22), fill=p["ink_soft"])
        d.rectangle((5, 8, 27, 20), fill=p["rot_brown"])
        d.line((6, 9, 26, 9), fill=p["old_ochre"])
        d.rectangle((11, 12, 16, 16), fill=p["vellum_bone"])
        d.point((21, 13), fill=p["candle_white"])
        for x in [7, 25]:
            d.line((x, 20, x, 29), fill=p["ink_soft"], width=2)
    elif name == "chair":
        plank_lines(d, p["cedar_brown"], p["rot_brown"], p["old_ochre"], p["ink_soft"])
        d.rectangle((10, 7, 22, 16), fill=p["rot_brown"])
        d.rectangle((8, 16, 24, 23), fill=p["cedar_brown"])
        d.line((11, 23, 9, 29), fill=p["ink_soft"], width=2)
        d.line((21, 23, 23, 29), fill=p["ink_soft"], width=2)
    elif name == "herb_shelf":
        draw_log_wall(d, p)
        d.rectangle((3, 8, 28, 11), fill=p["rot_brown"])
        d.rectangle((3, 20, 28, 23), fill=p["rot_brown"])
        for x, c in [(7, "pale_heal"), (13, "old_ochre"), (20, "verdigris"), (25, "candle_white")]:
            d.line((x, 11, x - 1, 17), fill=p[c], width=2)
        d.rectangle((10, 23, 16, 28), fill=p["damp_ash"])
    elif name == "crate":
        d.rectangle((0, 0, 31, 31), fill=p["witte_blue"])
        snow_speckles(d, p["witte_white"], p["witte_cool"])
        d.rectangle((6, 10, 26, 27), fill=p["rot_brown"])
        d.rectangle((8, 12, 24, 25), fill=p["cedar_brown"])
        d.line((8, 12, 24, 25), fill=p["old_ochre"])
        d.line((24, 12, 8, 25), fill=p["old_ochre"])
        d.line((6, 27, 26, 27), fill=p["ink_soft"])
    elif name == "barrel":
        d.rectangle((0, 0, 31, 31), fill=p["witte_blue"])
        snow_speckles(d, p["witte_white"], p["witte_cool"])
        d.ellipse((9, 7, 23, 13), fill=p["old_ochre"])
        d.rectangle((8, 10, 24, 27), fill=p["rot_brown"])
        d.ellipse((8, 22, 24, 29), fill=p["ink_soft"])
        d.line((10, 15, 22, 15), fill=p["old_ochre"])
        d.line((10, 22, 22, 22), fill=p["old_ochre"])
    elif name == "candle_stand":
        plank_lines(d, p["cedar_brown"], p["rot_brown"], p["old_ochre"], p["ink_soft"])
        d.line((16, 12, 16, 28), fill=p["ink_soft"], width=2)
        d.line((11, 28, 21, 28), fill=p["ink_soft"])
        d.rectangle((14, 8, 18, 14), fill=p["candle_white"])
        d.point((16, 6), fill=p["ember_glow"])
        d.point((16, 5), fill=p["candle_pure"])
    elif name == "pine_small":
        d.rectangle((0, 0, 31, 31), fill=p["witte_blue"])
        snow_speckles(d, p["witte_white"], p["witte_cool"])
        d.rectangle((15, 21, 17, 31), fill=p["rot_brown"])
        d.polygon([(16, 7), (8, 21), (25, 21)], fill=p["pine_shadow"])
        d.polygon([(16, 12), (7, 26), (26, 26)], fill=p["pale_heal_deep"])
        d.line((9, 21, 24, 21), fill=p["witte_white"])
    elif name == "stump":
        d.rectangle((0, 0, 31, 31), fill=p["witte_blue"])
        snow_speckles(d, p["witte_white"], p["witte_cool"])
        d.ellipse((7, 23, 25, 31), fill=p["witte_cool"])
        d.rectangle((11, 15, 22, 27), fill=p["rot_brown"])
        d.ellipse((10, 12, 23, 18), fill=p["old_ochre"])
        d.ellipse((14, 14, 19, 17), outline=p["ink_soft"])
        d.line((11, 27, 22, 27), fill=p["ink_soft"])
    elif name == "empty":
        d.rectangle((0, 0, 31, 31), fill=TRANSPARENT)
    return img


TILE_NAMES = [
    "snow", "snow_shadow", "road", "road_edge", "floor", "floor_shadow", "wall", "door",
    "tree", "brush", "stone", "hearth", "bed", "table", "icon", "rug",
    "fence", "logs", "window", "cabinet", "threshold_light", "empty",
    "snow_drift", "snow_tracks", "road_ruts", "floor_light", "floor_worn", "wall_corner", "wall_shadow", "roof",
    "roof_snow", "porch", "hearth_left", "hearth_right", "bed_head", "bed_foot", "table_long", "chair",
    "herb_shelf", "crate", "barrel", "candle_stand", "pine_small", "stump",
]


def generate_environment_tileset() -> tuple[Path, Path]:
    cols = 8
    rows = (len(TILE_NAMES) + cols - 1) // cols
    atlas = Image.new("RGBA", (cols * 32, rows * 32), TRANSPARENT)
    for idx, name in enumerate(TILE_NAMES):
        atlas.alpha_composite(tile_image(name), ((idx % cols) * 32, (idx // cols) * 32))
    path = save_png(atlas, ART / "environment/tilesets/ironwood_cabin_runtime_32.png")
    manifest = {
        "tile_size": 32,
        "columns": cols,
        "tiles": {name: idx for idx, name in enumerate(TILE_NAMES)},
        "source_refs": [
            "art/environment/source/downloads_20260510_first_drafts/interior-cabin.png",
            "art/environment/source/downloads_20260510_first_drafts/ironwood-envrionment.png",
            "art/environment/source/downloads_20260510_first_drafts/building-cabin-outdoor.png",
        ],
        "note": "Runtime tiles are deterministic curated pixel tiles using the downloaded drafts as motif/color references; source drafts remain preserved separately.",
    }
    manifest_path = ART / "environment/tilesets/ironwood_cabin_runtime_32.json"
    ensure(manifest_path.parent)
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
    zoom = atlas.resize((atlas.width * 4, atlas.height * 4), Image.Resampling.NEAREST)
    save_png(zoom, ART / "environment/preview/ironwood_cabin_runtime_tiles_zoom4.png")
    return path, manifest_path


def make_character_contact(paths: list[Path]) -> Path:
    zoom = 3
    thumbs = []
    for p in paths:
        im = Image.open(p).convert("RGBA")
        # crop first row for wide sheets to keep board inspectable.
        if im.height > 192:
            im = im.crop((0, 0, min(im.width, 480), min(im.height, 96)))
        thumb = im.resize((im.width * zoom, im.height * zoom), Image.Resampling.NEAREST)
        thumbs.append((p, thumb))
    font = ImageFont.load_default()
    width = max(t.width for _, t in thumbs) + 24
    height = sum(t.height + 34 for _, t in thumbs) + 12
    board = Image.new("RGBA", (width, height), (18, 16, 14, 255))
    d = ImageDraw.Draw(board)
    y = 8
    for p, t in thumbs:
        d.text((8, y), str(p.relative_to(ROOT)), fill=(239, 230, 208, 255), font=font)
        y += 14
        board.alpha_composite(t, (8, y))
        y += t.height + 18
    return save_png(board, ART / "characters/preview/cabin_cast_runtime_contact.png")


def write_manifests(outputs: list[Path], env_manifest: Path) -> None:
    char_manifest = ART / "characters/cabin_cast_manifest.md"
    lines = [
        "# Cabin cast runtime sprite manifest",
        "",
        "Generated by `tools/assets/generate_cabin_scene_assets.py`.",
        "",
        "## Runtime sheets",
    ]
    for p in outputs:
        lines.append(f"- `{p.relative_to(ROOT)}`")
    lines.extend([
        "",
        "## PixelLab-backed upgrades",
        "- `art/characters/lena/sheets/lena_pixellab_locomotion_64x96.png` — paid PixelLab humanoid route can replace the deterministic fallback at this same runtime path.",
        "- `art/characters/iiro/sheets/iiro_locomotion_48x64.png` — paid PixelLab humanoid route can replace the deterministic fallback at this same runtime path.",
        "- `art/characters/wolf/sheets/wolf_locomotion_96x64.png` — paid PixelLab dog-template route can replace the deterministic fallback at this same runtime path.",
        "- Source-intake manifests for paid runs live under each character's `_drafts/source_intake/` directory; bearer tokens and remote URLs are redacted.",
        "",
        "## Source/reference preservation",
        "- Anna source/reference: `art/characters/anna/anna_reference.png` and `art/characters/_analysis_64x96_trials/anna_ref_identity_64x96.png`.",
        "- Iiro source/reference: `art/characters/iiro/iiro_reference.png` and `art/characters/_analysis_64x96_trials/iiro_ref_identity_64x96.png`.",
        "- Lena source/reference: `art/characters/lena/lena_v1_idle.png` and `art/characters/_analysis_64x96_trials/lena_ref_identity_64x96.png`.",
        "- Birdie source/reference: `art/characters/birdie/birdie_design_asset.png`.",
        "- Kalev canonical locomotion remains `art/characters/kalev/sheets/kalev_locomotion_64x96.png`; generated action sheets are first playable runtime passes.",
        "",
        "## Quality boundary",
        "These sheets are palette-pinned, baseline-safe runtime passes meant to make the Godot scene playable now. They are not final hand-polished portrait/animation locks.",
    ])
    char_manifest.write_text("\n".join(lines) + "\n")

    env_md = ART / "environment/asset_manifest.md"
    env_md.write_text("\n".join([
        "# Ironwood/cabin runtime environment manifest",
        "",
        "Generated by `tools/assets/generate_cabin_scene_assets.py`.",
        "",
        f"- Runtime tileset: `{(ART / 'environment/tilesets/ironwood_cabin_runtime_32.png').relative_to(ROOT)}`",
        f"- Tileset metadata: `{env_manifest.relative_to(ROOT)}`",
        "- Zoom review: `art/environment/preview/ironwood_cabin_runtime_tiles_zoom4.png`",
        "- Source drafts preserved under `art/environment/source/downloads_20260510_first_drafts/`.",
        "",
        "The runtime tileset intentionally avoids direct noisy downscales from the draft sheets. The drafts are used as motif references; runtime pixels are clean, low-color, nearest-filtered, and Godot-ready.",
        "",
        "## Current tile vocabulary",
        f"- {len(TILE_NAMES)} 32×32 tiles: snow/road variants, log cabin floors/walls/roof, multi-tile hearth/bed/table pieces, forest props, and cabin clutter.",
        "- Existing tile indices are append-only so Godot scene references remain stable across generator passes.",
        "- Character runtime sheets are preserved by default. Use `--force-character-overwrite` only when intentionally replacing curated/PixelLab/manual-polished sheets.",
        "",
        "## Godot integration",
        "- World lab scene: `scenes/world_lab/ironwood_world_lab.tscn`",
        "- Runtime script: `scenes/world_lab/IronwoodWorldLab.cs`",
        "- Latest proof bundle is under `screenshots/result/`.",
    ]) + "\n")


def main() -> int:
    global FORCE_CHARACTER_OVERWRITE
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--force-character-overwrite",
        action="store_true",
        help="Replace existing runtime character sheets. Default preserves PixelLab/manual-polished sheets.",
    )
    args = parser.parse_args()
    FORCE_CHARACTER_OVERWRITE = args.force_character_overwrite

    outputs: list[Path] = []
    outputs.extend(generate_kalev_missing())
    outputs.extend(generate_lena())
    outputs.extend(generate_boy())
    outputs.extend(generate_mother())
    outputs.extend(generate_wolf())
    outputs.append(generate_birdie())
    outputs.append(generate_birdie_character_idle())
    env_path, env_manifest = generate_environment_tileset()
    contact = make_character_contact(outputs)
    write_manifests(outputs, env_manifest)
    print("Generated runtime character sheets:")
    for p in outputs:
        print(f"  {p.relative_to(ROOT)}")
    print(f"Generated environment tileset: {env_path.relative_to(ROOT)}")
    print(f"Generated review board: {contact.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
