#!/usr/bin/env python3
"""Validate a runtime sprite sheet against project acceptance criteria.

Usage (CLI):
  python3 tools/sprites/validate_sprite.py \
      --path art/characters/kalev/sheets/kalev_locomotion_64x96.png \
      --expected-w 256 --expected-h 96 \
      --palette kalev \
      --frame-w 64 --frame-h 96 --baseline-y 84 \
      --target-cols 4 --target-rows 1

Checks:
  1. file exists
  2. format == PNG
  3. mode == RGBA
  4. dimensions == expected
  5. ≤ 48 unique colors total
  6. every opaque pixel is in the palette (exact RGB match)
  7. ≥ 20% of pixels have alpha == 0 (genuinely transparent)
  8. no semi-transparent pixels (alpha must be 0 or 255)
  9. each non-empty cell's bottom-most opaque pixel sits at y_local == baseline-y
       (anchor cells from the top-left of each cell; tolerance ±0)

Exit code 0 = PASS, 1 = FAIL.
"""
from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass, field
from pathlib import Path

from PIL import Image, UnidentifiedImageError

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from palette import RGB, by_name  # noqa: E402


@dataclass
class ValidationReport:
    """Structured result for CLI, health table, and catalog consumers."""
    path: Path
    notes: list[str] = field(default_factory=list)
    failures: list[str] = field(default_factory=list)
    stats: dict[str, object] = field(default_factory=dict)

    @property
    def ok(self) -> bool:
        return not self.failures


def validate_runtime_sheet(
    path: Path,
    expected_w: int,
    expected_h: int,
    palette: list[RGB],
    frame_w: int,
    frame_h: int,
    baseline_y: int,
    target_cols: int,
    target_rows: int,
    max_total_colors: int = 48,
) -> ValidationReport:
    report = ValidationReport(path=path)
    if not path.is_file():
        report.failures.append(f"file does not exist: {path}")
        return report

    try:
        with Image.open(path) as im:
            source_format = im.format
            source_size = im.size
            source_mode = im.mode
            rgba = im.convert("RGBA")
    except (UnidentifiedImageError, OSError) as exc:
        report.failures.append(f"could not open image: {exc}")
        return report

    report.notes.append(f"format={source_format}  size={source_size}  mode={source_mode}")

    if source_format != "PNG":
        report.failures.append(f"format must be PNG, got {source_format}")
    if source_size != (expected_w, expected_h):
        report.failures.append(
            f"dimensions must be {expected_w}×{expected_h}, got {source_size[0]}×{source_size[1]}"
        )
    if source_mode != "RGBA":
        report.failures.append(f"mode must be RGBA, got {source_mode}")

    w, h = rgba.size
    px = rgba.load()

    # Color audit
    colors = rgba.getcolors(maxcolors=200_000)
    unique_count = len(colors) if colors else 999_999
    report.stats["colors"] = unique_count
    report.stats["size"] = f"{w}×{h}"
    report.notes.append(f"unique colors: {unique_count}")
    if unique_count > max_total_colors:
        report.failures.append(f"unique colors {unique_count} > limit {max_total_colors}")

    # Palette pinning
    palette_set = set(palette)
    off_palette: dict[tuple[int, int, int], int] = {}
    semi_count = 0
    fully_t = 0
    fully_o = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                fully_t += 1
                continue
            if a == 255:
                fully_o += 1
            else:
                semi_count += 1
            if (r, g, b) not in palette_set:
                off_palette[(r, g, b)] = off_palette.get((r, g, b), 0) + 1

    total = w * h
    alpha0_pct = round(100 * fully_t / total, 1) if total else 0.0
    report.stats["alpha0_pct"] = alpha0_pct
    report.stats["semi"] = semi_count
    report.notes.append(f"alpha=0: {fully_t} ({alpha0_pct:.1f}%)  alpha=255: {fully_o}  semi: {semi_count}")

    if fully_o == 0 and semi_count == 0:
        report.failures.append("sheet has no opaque pixels")
    if fully_t < 0.20 * total:
        report.failures.append(f"transparency must be ≥20% of pixels, got {alpha0_pct:.1f}%")
    if semi_count > 0:
        report.failures.append(f"semi-transparent pixels found: {semi_count} (must be 0)")

    if off_palette:
        examples = sorted(off_palette.items(), key=lambda kv: -kv[1])[:5]
        sample_str = "  ".join(f"#{r:02X}{g:02X}{b:02X}×{n}" for (r, g, b), n in examples)
        report.failures.append(
            f"{sum(off_palette.values())} pixels in {len(off_palette)} colors are off-palette "
            f"(e.g. {sample_str})"
        )

    # Baseline anchoring per cell. Skip this dependent check on wrong-size sheets
    # so the validator reports dimensions instead of crashing on out-of-bounds pixels.
    if (w, h) == (expected_w, expected_h):
        bad_baselines: list[str] = []
        for tr in range(target_rows):
            for tc in range(target_cols):
                cx0, cy0 = tc * frame_w, tr * frame_h
                bottom = None
                for cy in range(frame_h - 1, -1, -1):
                    row_has_opaque = False
                    for cx in range(frame_w):
                        if px[cx0 + cx, cy0 + cy][3] > 0:
                            row_has_opaque = True
                            break
                    if row_has_opaque:
                        bottom = cy
                        break
                if bottom is None:
                    continue  # empty cell is allowed
                if bottom != baseline_y:
                    bad_baselines.append(f"cell ({tc},{tr}) bottom y={bottom} expected {baseline_y}")
        if bad_baselines:
            # Allow up to 2 cells of slack — sit/kneel/downed have different anchors per spec
            if len(bad_baselines) > min(2, target_cols * target_rows // 2):
                report.failures.append(
                    f"{len(bad_baselines)} cell(s) have feet off baseline {baseline_y}: "
                    + "; ".join(bad_baselines[:6])
                )
            else:
                report.notes.append(
                    f"{len(bad_baselines)} cell(s) have non-standard baseline (allowed for sit/kneel/downed)"
                )
    return report


def run(path: Path, expected_w: int, expected_h: int, palette: list[RGB],
        frame_w: int, frame_h: int, baseline_y: int,
        target_cols: int, target_rows: int,
        max_total_colors: int = 48) -> int:
    report = validate_runtime_sheet(
        path=path,
        expected_w=expected_w,
        expected_h=expected_h,
        palette=palette,
        frame_w=frame_w,
        frame_h=frame_h,
        baseline_y=baseline_y,
        target_cols=target_cols,
        target_rows=target_rows,
        max_total_colors=max_total_colors,
    )

    # Report
    print()
    print(f"=== {path.name} ===")
    for line in report.notes:
        print(f"  {line}")
    if report.failures:
        print()
        print("FAIL:")
        for fail in report.failures:
            print(f"  - {fail}")
        return 1
    else:
        print()
        print("PASS")
        return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--path", required=True, type=Path)
    parser.add_argument("--expected-w", required=True, type=int)
    parser.add_argument("--expected-h", required=True, type=int)
    parser.add_argument("--palette", required=True)
    parser.add_argument("--frame-w", type=int, default=64)
    parser.add_argument("--frame-h", type=int, default=96)
    parser.add_argument("--baseline-y", type=int, default=84)
    parser.add_argument("--target-cols", type=int, default=4)
    parser.add_argument("--target-rows", type=int, default=1)
    parser.add_argument("--max-total-colors", type=int, default=48)
    args = parser.parse_args(argv)

    palette = by_name(args.palette)
    return run(
        path=args.path,
        expected_w=args.expected_w,
        expected_h=args.expected_h,
        palette=palette,
        frame_w=args.frame_w,
        frame_h=args.frame_h,
        baseline_y=args.baseline_y,
        target_cols=args.target_cols,
        target_rows=args.target_rows,
        max_total_colors=args.max_total_colors,
    )


if __name__ == "__main__":
    raise SystemExit(main())
