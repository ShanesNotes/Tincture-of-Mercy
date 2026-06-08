"""Generate animated-GIF previews + 4× nearest-neighbor zoom PNG of a runtime sheet.

Usage (via CLI dispatcher):
  ./sprite preview <character> <pass>

Outputs land under art/characters/<character>/preview/:
  <character>_<pass>_<canvas>_zoom4x.png        — sheet at 4× zoom (visual review)
  <character>_<pass>_<animation>.gif            — one GIF per animation row that has frames
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from _common import CharacterSpec, green, red, yellow, dim, header, relpath  # noqa: E402


# Vellum-warm — used as opaque GIF background since GIF transparency is fragile.
GIF_BG = (239, 230, 208)


def _row_frames(im: Image.Image, row: int, target_cols: int, fw: int, fh: int) -> list[Image.Image]:
    frames: list[Image.Image] = []
    for col in range(target_cols):
        cell = im.crop((col * fw, row * fh, (col + 1) * fw, (row + 1) * fh))
        if cell.getchannel("A").getbbox() is None:
            continue
        frames.append(cell)
    return frames


def _frame_to_gif_friendly(frame: Image.Image, scale: int) -> Image.Image:
    bg = Image.new("RGB", (frame.width * scale, frame.height * scale), GIF_BG)
    zoomed = frame.resize((frame.width * scale, frame.height * scale), Image.Resampling.NEAREST)
    bg.paste(zoomed, (0, 0), zoomed)
    return bg


def run(spec: CharacterSpec, pass_name: str) -> int:
    pass_spec = spec.get_pass(pass_name)
    sheet_path = spec.runtime_path(pass_name)
    if not sheet_path.exists():
        print(red(f"no runtime sheet at {relpath(sheet_path)}; run `./sprite convert {spec.name} {pass_name}` first."))
        return 1

    out_dir = spec.preview_dir()
    out_dir.mkdir(parents=True, exist_ok=True)

    fw = spec.frame_w(pass_name)
    fh = spec.frame_h(pass_name)
    cols = spec.target_cols(pass_name)
    rows = spec.target_rows(pass_name)
    canvas = spec.canvas_label(pass_name)
    anim_keys: list[str] = pass_spec.get("animation_keys", [])

    header(f"preview  {spec.name} · {pass_name}  {dim(f'{cols}×{rows} cells, {fw}×{fh} px each')}")

    im = Image.open(sheet_path).convert("RGBA")

    # 4× zoom PNG (RGBA preserved)
    zoom_path = out_dir / f"{spec.name}_{pass_name}_{canvas}_zoom4x.png"
    zoom = im.resize((im.width * 4, im.height * 4), Image.Resampling.NEAREST)
    zoom.save(zoom_path, format="PNG")
    print(green("zoom 4×  ") + relpath(zoom_path))

    # GIFs per animation row that has frames
    gifs_made = 0
    skipped = 0
    for row in range(rows):
        frames = _row_frames(im, row, cols, fw, fh)
        if not frames:
            skipped += 1
            continue
        anim_label = anim_keys[row] if row < len(anim_keys) else f"row{row}"
        gif_frames = [_frame_to_gif_friendly(f, scale=4) for f in frames]
        gif_path = out_dir / f"{spec.name}_{pass_name}_{anim_label}.gif"
        gif_frames[0].save(
            gif_path,
            save_all=True,
            append_images=gif_frames[1:],
            duration=120,            # ~8fps; readable for breath cycles
            loop=0,
            optimize=False,
        )
        print(green(f"gif      ") + f"{relpath(gif_path)}  {dim(f'({len(frames)} frames)')}")
        gifs_made += 1

    if gifs_made == 0:
        print(yellow(f"no GIFs produced — every row was empty"))
        return 1
    print(dim(f"\n{gifs_made} animation(s) rendered, {skipped} empty row(s) skipped"))
    return 0


def _main(argv: list[str] | None = None) -> int:
    import argparse
    from _common import load_spec
    parser = argparse.ArgumentParser()
    parser.add_argument("character")
    parser.add_argument("pass_name", metavar="pass")
    args = parser.parse_args(argv)
    spec = load_spec(args.character)
    return run(spec, args.pass_name)


if __name__ == "__main__":
    raise SystemExit(_main())
