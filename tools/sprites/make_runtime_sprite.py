#!/usr/bin/env python3
"""Convert a high-resolution source sprite sheet into a runtime-ready Godot PNG.

Usage:
  python3 tools/sprites/make_runtime_sprite.py \
      --source path/to/source.png \
      --output art/characters/<name>/sheets/<name>_<purpose>_<canvas>.png \
      --palette kalev \
      --source-frames 4 \
      --target-cols 4 \
      --target-rows 1 \
      --frame-w 64 --frame-h 96 \
      --baseline-y 84

Input: any PNG (RGB or RGBA), arbitrary dimensions, with one or more character
       frames laid out left-to-right (or in a grid via --source-cols/--source-rows).
       Background may be a baked checkerboard, a solid fill, or already transparent.

Output: PNG, RGBA, exactly target dimensions, palette-quantized to the named
        per-character palette, character feet anchored at baseline_y in each cell.

Pipeline steps per frame:
  1. Crop the source cell from the input grid.
  2. Detect background colors (sampled from cell border + checkerboard heuristic).
  3. Replace background pixels with alpha=0; threshold semi-transparent edges.
  4. Crop tightly to non-transparent bounding box.
  5. Resize aspect-preserving to fit (frame_w − 8) × (baseline_y − 4) using NEAREST.
  6. Quantize every opaque pixel to the nearest palette color (Euclidean RGB).
  7. Composite into the output cell with feet aligned to baseline_y.

After save, the validator runs automatically and reports PASS/FAIL.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image

# Allow running as script (no package context) by adjusting sys.path.
_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from palette import RGB, PALETTES, by_name  # noqa: E402


RESIZE_METHODS = {
    "nearest": Image.Resampling.NEAREST,
    "box": Image.Resampling.BOX,
    "bilinear": Image.Resampling.BILINEAR,
    "bicubic": Image.Resampling.BICUBIC,
    "lanczos": Image.Resampling.LANCZOS,
}


def resize_filter(method: str) -> Image.Resampling:
    try:
        return RESIZE_METHODS[method]
    except KeyError as exc:
        known = ", ".join(sorted(RESIZE_METHODS))
        raise ValueError(f"unknown resize method {method!r}; expected one of: {known}") from exc


# ---------------------------------------------------------------------------
# Background detection and removal
# ---------------------------------------------------------------------------

def sample_border_colors(im: Image.Image, depth: int = 2) -> list[RGB]:
    """Collect every pixel within `depth` rows/cols of each edge."""
    rgba = im.convert("RGBA")
    w, h = rgba.size
    px = rgba.load()
    samples: list[RGB] = []
    for d in range(depth):
        for x in range(w):
            samples.append(px[x, d][:3])
            samples.append(px[x, h - 1 - d][:3])
        for y in range(h):
            samples.append(px[d, y][:3])
            samples.append(px[w - 1 - d, y][:3])
    return samples


def detect_background_colors(im: Image.Image, top_n: int = 4, min_share: float = 0.05) -> list[RGB]:
    """Return RGB tuples that dominate the border (likely background)."""
    from collections import Counter
    samples = sample_border_colors(im, depth=2)
    counts = Counter(samples)
    total = sum(counts.values()) or 1
    bg = []
    for color, n in counts.most_common(top_n):
        if n / total >= min_share:
            bg.append(color)
    # Always include the single most common color, even if below threshold.
    if not bg and counts:
        bg.append(counts.most_common(1)[0][0])
    return bg


def remove_background(im: Image.Image, bg_colors: list[RGB], tol: int = 16,
                       alpha_threshold: int = 128) -> Image.Image:
    """Replace background-matching pixels with alpha=0; binarize edge alpha."""
    rgba = im.convert("RGBA").copy()
    px = rgba.load()
    w, h = rgba.size

    def is_bg(c: tuple[int, int, int]) -> bool:
        for br, bg, bb in bg_colors:
            if abs(c[0] - br) <= tol and abs(c[1] - bg) <= tol and abs(c[2] - bb) <= tol:
                return True
        return False

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if a < alpha_threshold:
                px[x, y] = (0, 0, 0, 0)
                continue
            if is_bg((r, g, b)):
                px[x, y] = (0, 0, 0, 0)
                continue
            # binarize edge alpha (no semi-transparency in runtime sprites)
            if a < 255:
                px[x, y] = (r, g, b, 255)
    return rgba


# ---------------------------------------------------------------------------
# Palette quantization
# ---------------------------------------------------------------------------

def quantize_to_palette(im: Image.Image, palette: list[RGB]) -> Image.Image:
    """Snap every opaque pixel to the nearest palette color (RGB Euclidean)."""
    rgba = im.convert("RGBA").copy()
    px = rgba.load()
    w, h = rgba.size
    cache: dict[tuple[int, int, int], tuple[int, int, int, int]] = {}

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            key = (r, g, b)
            snapped = cache.get(key)
            if snapped is None:
                nearest = min(palette, key=lambda c: (r - c[0]) ** 2 + (g - c[1]) ** 2 + (b - c[2]) ** 2)
                snapped = (nearest[0], nearest[1], nearest[2], 255)
                cache[key] = snapped
            px[x, y] = snapped
    return rgba


def binarize_alpha(im: Image.Image, threshold: int = 128) -> Image.Image:
    """Force alpha to project-runtime legal values after non-nearest resampling."""
    rgba = im.convert("RGBA").copy()
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < threshold:
                px[x, y] = (0, 0, 0, 0)
            elif a != 255:
                px[x, y] = (r, g, b, 255)
    return rgba


# ---------------------------------------------------------------------------
# Connected-component subject isolation
# ---------------------------------------------------------------------------

def isolate_main_subject(im: Image.Image, min_pixel_floor: int = 5,
                           x_overlap_tolerance: int = 5) -> Image.Image:
    """Mask out shadow blobs, noise specks, and neighboring-cell bleed while
    preserving anatomy and held items.

    Strategy: find the largest connected non-transparent component (the main figure).
    Then for every *other* component:
      - drop if smaller than `min_pixel_floor` (chroma-key bleed / stray specks)
      - drop if strictly below the main's y-range (likely a ground shadow)
      - drop if its x-range is more than `x_overlap_tolerance` pixels away from the
        main's x-range on either side (likely cell bleed from a neighboring figure
        in a multi-cell source sheet)
      - keep otherwise (anatomy briefly disconnected in a walk frame, held items
        beside the body, hat brims slightly off the head)

    The x-overlap rule is what distinguishes legitimate disconnected anatomy from
    pixels that belong to a different figure entirely. Position is the right
    discriminator here, not size — a held notebook and a cell-bleed strip can
    be the same pixel count.

    Operates on a flat alpha buffer for speed (Pillow per-pixel access is slow).
    """
    rgba = im.convert("RGBA").copy()
    w, h = rgba.size
    n = w * h
    if n == 0:
        return rgba
    alpha = list(rgba.getchannel("A").getdata())

    visited = bytearray(n)
    # Each component: (indices, xmin, xmax, ymin, ymax). x and y ranges computed
    # during BFS to avoid a second scan.
    components: list[tuple[list[int], int, int, int, int]] = []
    for start in range(n):
        if visited[start] or alpha[start] == 0:
            continue
        stack = [start]
        comp_indices: list[int] = []
        ymin = ymax = start // w
        xmin = xmax = start % w
        while stack:
            i = stack.pop()
            if visited[i] or alpha[i] == 0:
                continue
            visited[i] = 1
            comp_indices.append(i)
            y = i // w
            x = i % w
            if y < ymin: ymin = y
            if y > ymax: ymax = y
            if x < xmin: xmin = x
            if x > xmax: xmax = x
            if x > 0:     stack.append(i - 1)
            if x < w - 1: stack.append(i + 1)
            if i >= w:    stack.append(i - w)
            if i < n - w: stack.append(i + w)
        if comp_indices:
            components.append((comp_indices, xmin, xmax, ymin, ymax))

    if not components:
        return rgba

    components.sort(key=lambda c: -len(c[0]))
    main_indices, main_xmin, main_xmax, main_ymin, main_ymax = components[0]

    keep = bytearray(n)
    for i in main_indices:
        keep[i] = 1

    for indices, c_xmin, c_xmax, c_ymin, c_ymax in components[1:]:
        if len(indices) < min_pixel_floor:
            continue  # noise speck
        if c_ymin > main_ymax:
            continue  # strictly below main → ground shadow
        # x-overlap (with tolerance) — a held item or briefly-disconnected limb
        # should sit within a few pixels of the main's horizontal extent.
        if c_xmax + x_overlap_tolerance < main_xmin:
            continue  # entirely to the left of main with too large a gap
        if c_xmin - x_overlap_tolerance > main_xmax:
            continue  # entirely to the right of main with too large a gap → cell bleed
        for i in indices:
            keep[i] = 1

    raw = bytearray(rgba.tobytes())
    for i in range(n):
        if not keep[i]:
            j = i * 4
            raw[j] = 0
            raw[j + 1] = 0
            raw[j + 2] = 0
            raw[j + 3] = 0
    return Image.frombytes("RGBA", (w, h), bytes(raw))


# ---------------------------------------------------------------------------
# Frame processing
# ---------------------------------------------------------------------------

def process_frame(cell: Image.Image, frame_w: int, frame_h: int, baseline_y: int,
                   palette: list[RGB], bg_colors: list[RGB], gutter: int = 4,
                   resize_method: str = "nearest") -> Image.Image:
    """Take one source cell and produce a runtime-format frame."""
    cell = remove_background(cell, bg_colors)
    cell = isolate_main_subject(cell)

    bbox = cell.getchannel("A").getbbox()
    if bbox is None:
        return Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))

    cell = cell.crop(bbox)

    max_w = frame_w - gutter * 2
    max_h = baseline_y - gutter
    scale = min(max_w / cell.width, max_h / cell.height)
    new_w = max(1, round(cell.width * scale))
    new_h = max(1, round(cell.height * scale))

    cell = cell.resize((new_w, new_h), resize_filter(resize_method))
    cell = binarize_alpha(cell)
    cell = quantize_to_palette(cell, palette)

    out = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
    x = (frame_w - new_w) // 2
    y = baseline_y - new_h + 1
    out.alpha_composite(cell, (x, y))
    return out


# ---------------------------------------------------------------------------
# Sheet composition
# ---------------------------------------------------------------------------

def source_grid_bounds(col: int, row: int, source_w: int, source_h: int,
                       source_cols: int, source_rows: int) -> tuple[int, int, int, int]:
    """Return crop bounds for a grid cell, covering all pixels even when unevenly divisible."""
    x0 = col * source_w // source_cols
    x1 = (col + 1) * source_w // source_cols
    y0 = row * source_h // source_rows
    y1 = (row + 1) * source_h // source_rows
    return (x0, y0, x1, y1)


def _require_positive(name: str, value: int) -> None:
    if value <= 0:
        raise ValueError(f"{name} must be positive, got {value}")

def passthrough_sheet(source_path: Path, output_path: Path, palette: list[RGB],
                       target_cols: int, target_rows: int,
                       frame_w: int, frame_h: int) -> Image.Image:
    """Industry-standard path: source IS the runtime sheet.

    The artist delivers a transparent PNG at the exact runtime dimensions, with
    cells laid out matching the spec. The pipeline only validates dimensions
    and snaps near-palette colors to exact palette tokens. No chroma key, no
    isolation, no aspect-fit — the sprite is authored to spec.
    """
    src = Image.open(source_path).convert("RGBA")
    expected = (target_cols * frame_w, target_rows * frame_h)
    if src.size != expected:
        raise ValueError(
            f"passthrough requires source dims to equal target sheet dims; "
            f"got {src.size}, expected {expected}"
        )
    snapped = quantize_to_palette(src, palette)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    snapped.save(output_path, format="PNG")
    return snapped


def compose_sheet(source_path: Path, output_path: Path, palette: list[RGB],
                   source_frames: int, source_cols: int, source_rows: int,
                   target_cols: int, target_rows: int,
                   frame_w: int, frame_h: int, baseline_y: int,
                   start_target_index: int,
                   resize_method: str = "nearest") -> Image.Image:
    for name, value in (
        ("source_frames", source_frames),
        ("source_cols", source_cols),
        ("source_rows", source_rows),
        ("target_cols", target_cols),
        ("target_rows", target_rows),
        ("frame_w", frame_w),
        ("frame_h", frame_h),
    ):
        _require_positive(name, value)
    if start_target_index < 0:
        raise ValueError(f"start_target_index must be non-negative, got {start_target_index}")

    src = Image.open(source_path).convert("RGBA")
    src_w, src_h = src.size
    expected_sheet = (target_cols * frame_w, target_rows * frame_h)

    # Industry-standard fast path: source is already at runtime shape.
    # No chroma keying, no isolation, no aspect-fit — just palette-snap and save.
    if src.size == expected_sheet and start_target_index == 0:
        print("native source detected (dims match runtime); using passthrough.")
        return passthrough_sheet(
            source_path=source_path,
            output_path=output_path,
            palette=palette,
            target_cols=target_cols,
            target_rows=target_rows,
            frame_w=frame_w,
            frame_h=frame_h,
        )

    # Legacy path: high-res chroma source → chroma-key → isolate → aspect-fit → quantize.
    # Triggered only when source dims do not match the runtime sheet shape.
    resize_filter(resize_method)  # validate early for clearer CLI errors.
    print(f"source shape != runtime; using chroma+isolate+fit path ({resize_method} resize).")
    if source_cols * source_rows < source_frames:
        raise ValueError(
            f"source grid {source_cols}×{source_rows} cannot hold {source_frames} frames"
        )
    bg_colors = detect_background_colors(src)

    output = Image.new("RGBA", expected_sheet, (0, 0, 0, 0))

    for i in range(source_frames):
        sc = i % source_cols
        sr = i // source_cols
        cell = src.crop(source_grid_bounds(sc, sr, src_w, src_h, source_cols, source_rows))
        processed = process_frame(
            cell, frame_w, frame_h, baseline_y, palette, bg_colors,
            resize_method=resize_method,
        )

        target_index = start_target_index + i
        tc = target_index % target_cols
        tr = target_index // target_cols
        if tr >= target_rows:
            break
        output.alpha_composite(processed, (tc * frame_w, tr * frame_h))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output.save(output_path, format="PNG")
    return output


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--source", required=True, type=Path, help="path to source PNG")
    parser.add_argument("--output", required=True, type=Path, help="output runtime PNG path")
    parser.add_argument("--palette", required=True, choices=sorted(PALETTES), help="palette name (kalev/lena/mother/boy/wolf/project)")
    parser.add_argument("--source-frames", type=int, default=4, help="number of frames present in source")
    parser.add_argument("--source-cols", type=int, default=None, help="columns in source grid (default: source-frames if rows=1)")
    parser.add_argument("--source-rows", type=int, default=1, help="rows in source grid")
    parser.add_argument("--target-cols", type=int, default=None, help="columns in output sheet (default: source-frames)")
    parser.add_argument("--target-rows", type=int, default=1, help="rows in output sheet")
    parser.add_argument("--frame-w", type=int, default=64, help="output frame width")
    parser.add_argument("--frame-h", type=int, default=96, help="output frame height")
    parser.add_argument("--baseline-y", type=int, default=84, help="feet anchor y inside each cell")
    parser.add_argument("--start-target-index", type=int, default=0, help="first cell index to fill in the output (for partial sheets)")
    parser.add_argument(
        "--resize-method",
        choices=sorted(RESIZE_METHODS),
        default="nearest",
        help="resampling for non-runtime-sized sources; nearest for true pixel art, box/lanczos for AI masters",
    )
    parser.add_argument("--no-validate", action="store_true", help="skip running the validator after save")
    args = parser.parse_args(argv)

    palette = by_name(args.palette)
    source_cols = args.source_cols or args.source_frames
    target_cols = args.target_cols or args.source_frames

    print(f"source: {args.source}  palette: {args.palette}  frames: {args.source_frames}")
    print(f"target: {args.output}  size: {target_cols * args.frame_w}×{args.target_rows * args.frame_h}")

    compose_sheet(
        source_path=args.source,
        output_path=args.output,
        palette=palette,
        source_frames=args.source_frames,
        source_cols=source_cols,
        source_rows=args.source_rows,
        target_cols=target_cols,
        target_rows=args.target_rows,
        frame_w=args.frame_w,
        frame_h=args.frame_h,
        baseline_y=args.baseline_y,
        start_target_index=args.start_target_index,
        resize_method=args.resize_method,
    )

    if not args.no_validate:
        # Defer import so this module can run without the validator on path issues
        try:
            import validate_sprite
        except ImportError:
            from . import validate_sprite  # type: ignore
        rc = validate_sprite.run(
            path=args.output,
            expected_w=target_cols * args.frame_w,
            expected_h=args.target_rows * args.frame_h,
            palette=palette,
            frame_w=args.frame_w,
            frame_h=args.frame_h,
            baseline_y=args.baseline_y,
            target_cols=target_cols,
            target_rows=args.target_rows,
        )
        return rc
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
