"""Side-by-side source vs runtime comparison for a character pass.

For each target cell, render the corresponding source cell (rescaled to the
same frame box, magenta keyed to transparent) next to the runtime cell at a
configurable zoom factor. Useful during Aseprite polish to spot anatomy or
held items that the conversion filter dropped.

Output: art/characters/<char>/preview/<char>_<pass>_compare_zoom<N>x.png
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

from _common import CharacterSpec, green, dim, header, relpath


MAGENTA_THRESHOLD = 80  # same heuristic as make_runtime_sprite.is_chroma_key (loose)


def _key_magenta(im: Image.Image) -> Image.Image:
    """Rough chroma key for the source preview only — mark magenta-ish pixels transparent."""
    rgba = im.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r > 200 and b > 200 and g < 90:
                px[x, y] = (0, 0, 0, 0)
    return rgba


def _source_cell(src: Image.Image, sc: int, sr: int, source_cols: int, source_rows: int) -> Image.Image:
    sw, sh = src.size
    x0 = sc * sw // source_cols
    x1 = (sc + 1) * sw // source_cols
    y0 = sr * sh // source_rows
    y1 = (sr + 1) * sh // source_rows
    return src.crop((x0, y0, x1, y1))


def _fit(cell: Image.Image, w: int, h: int) -> Image.Image:
    """Aspect-preserving fit into (w, h) using NEAREST, on a transparent canvas."""
    cw, ch = cell.size
    scale = min(w / cw, h / ch)
    nw, nh = max(1, int(round(cw * scale))), max(1, int(round(ch * scale)))
    resized = cell.resize((nw, nh), Image.NEAREST)
    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    canvas.alpha_composite(resized, ((w - nw) // 2, (h - nh) // 2))
    return canvas


def run(spec: CharacterSpec, pass_name: str, zoom: int = 4) -> int:
    pass_spec = spec.get_pass(pass_name)
    source_path = spec.source_path(pass_name)
    runtime_path = spec.runtime_path(pass_name)
    if not source_path.exists():
        print(f"missing source: {relpath(source_path)}")
        return 1
    if not runtime_path.exists():
        print(f"missing runtime: {relpath(runtime_path)}")
        return 1

    fw, fh = spec.frame_w(pass_name), spec.frame_h(pass_name)
    target_cols = spec.target_cols(pass_name)
    target_rows = spec.target_rows(pass_name)
    source_cols = pass_spec["source_cols"]
    source_rows = pass_spec["source_rows"]
    source_frames = pass_spec["source_frames"]
    keys = pass_spec.get("animation_keys", [])

    src = _key_magenta(Image.open(source_path))
    runtime = Image.open(runtime_path).convert("RGBA")

    # Each comparison block: [source_fit] [gap] [runtime_cell], scaled by zoom.
    pair_w = (fw * 2 + 2) * zoom
    pair_h = (fh + 12) * zoom  # extra room for label strip
    grid_w = pair_w * target_cols
    grid_h = pair_h * target_rows

    out = Image.new("RGBA", (grid_w, grid_h), (24, 22, 20, 255))

    for tr in range(target_rows):
        for tc in range(target_cols):
            i = tr * target_cols + tc
            if i >= source_frames:
                continue
            sc = i % source_cols
            sr = i // source_cols
            src_cell = _fit(_source_cell(src, sc, sr, source_cols, source_rows), fw, fh)
            run_cell = runtime.crop((tc * fw, tr * fh, (tc + 1) * fw, (tr + 1) * fh))

            pair = Image.new("RGBA", (fw * 2 + 2, fh), (40, 36, 34, 255))
            pair.alpha_composite(src_cell, (0, 0))
            pair.alpha_composite(run_cell, (fw + 2, 0))
            pair_z = pair.resize((pair.width * zoom, pair.height * zoom), Image.NEAREST)
            out.alpha_composite(pair_z, (tc * pair_w, tr * pair_h))

    out_path = spec.preview_dir() / f"{spec.name}_{pass_name}_compare_zoom{zoom}x.png"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out.save(out_path)

    header(f"compare  {spec.name} · {pass_name}")
    print(f"  source : {relpath(source_path)}")
    print(f"  runtime: {relpath(runtime_path)}")
    print(green(f"  saved  : {relpath(out_path)}  ({out.size[0]}×{out.size[1]})"))
    if keys:
        print(dim("  rows order: " + ", ".join(keys)))
    return 0
