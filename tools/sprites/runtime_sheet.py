"""Shared frame-folder/frame-path to runtime-sheet assembly for sprite intake.

This module is the deterministic local seam used by PixelLab REST output, manual
frame folders, future MCP output, and Aseprite-extension exports before the
runtime validator decides whether a sheet is canonical.
"""
from __future__ import annotations

import json
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from PIL import Image

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from palette import by_name  # noqa: E402
from make_runtime_sprite import quantize_to_palette  # noqa: E402
import validate_sprite  # noqa: E402


@dataclass
class AssemblyReport:
    character: str
    pass_name: str
    runtime_output: Path
    frame_w: int
    frame_h: int
    target_cols: int
    target_rows: int
    animation_keys: list[str]
    source_frames: dict[str, str] = field(default_factory=dict)
    normalized_frames: dict[str, str] = field(default_factory=dict)
    missing_frames: list[str] = field(default_factory=list)
    validation: validate_sprite.ValidationReport | None = None

    @property
    def ok(self) -> bool:
        return bool(self.validation and self.validation.ok)

    def to_dict(self) -> dict[str, Any]:
        return {
            "character": self.character,
            "pass": self.pass_name,
            "runtime_output": str(self.runtime_output),
            "frame_w": self.frame_w,
            "frame_h": self.frame_h,
            "target_cols": self.target_cols,
            "target_rows": self.target_rows,
            "animation_keys": self.animation_keys,
            "source_frames": self.source_frames,
            "normalized_frames": self.normalized_frames,
            "missing_frames": self.missing_frames,
            "validation": None if self.validation is None else {
                "ok": self.validation.ok,
                "path": str(self.validation.path),
                "notes": self.validation.notes,
                "failures": self.validation.failures,
                "stats": self.validation.stats,
            },
        }

    def write_json(self, path: Path) -> Path:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(self.to_dict(), indent=2, sort_keys=True) + "\n")
        return path


def fit_to_cell(frame: Image.Image, fw: int, fh: int, baseline_y: int) -> Image.Image:
    """Crop alpha bbox, nearest-neighbor scale, and anchor feet at baseline.

    The validator treats ``baseline_y`` as the bottom-most opaque row inside a
    non-empty cell, so the pasted sprite is offset by one pixel after scaling.
    """
    canvas = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
    src = frame.convert("RGBA")
    bb = src.getchannel("A").getbbox()
    if not bb:
        return canvas
    cropped = src.crop(bb)
    cw, ch = cropped.size
    max_w = fw - 4
    max_h = baseline_y - 4
    scale = min(max_w / cw, max_h / ch, 1.0)
    new_w = max(1, round(cw * scale))
    new_h = max(1, round(ch * scale))
    resized = cropped.resize((new_w, new_h), Image.NEAREST)
    canvas.alpha_composite(resized, ((fw - new_w) // 2, baseline_y - new_h + 1))
    return canvas


def _frame_key(key: str, col_index: int) -> str:
    return f"{key}_{col_index}"


def frame_paths_from_dir(frames_dir: Path, animation_keys: list[str], target_cols: int) -> dict[str, dict[int, Path]]:
    frames: dict[str, dict[int, Path]] = {}
    for key in animation_keys:
        for col_index in range(target_cols):
            candidate = frames_dir / f"{key}_{col_index}.png"
            if candidate.exists():
                frames.setdefault(key, {})[col_index] = candidate
    return frames


def assemble_frame_dir(
    *,
    spec: Any,
    pass_name: str,
    frames_dir: Path,
    output_path: Path | None = None,
    normalized_dir: Path | None = None,
    validate: bool = True,
) -> AssemblyReport:
    keys = list(spec.get_pass(pass_name).get("animation_keys", []))
    frames = frame_paths_from_dir(frames_dir, keys, spec.target_cols(pass_name))
    return assemble_frame_paths(
        spec=spec,
        pass_name=pass_name,
        frames_by_key=frames,
        output_path=output_path,
        normalized_dir=normalized_dir,
        validate=validate,
    )


def assemble_frame_paths(
    *,
    spec: Any,
    pass_name: str,
    frames_by_key: dict[str, dict[int, Path]],
    output_path: Path | None = None,
    normalized_dir: Path | None = None,
    validate: bool = True,
) -> AssemblyReport:
    pass_spec = spec.get_pass(pass_name)
    fw = spec.frame_w(pass_name)
    fh = spec.frame_h(pass_name)
    baseline_y = spec.baseline_y(pass_name)
    target_cols = spec.target_cols(pass_name)
    target_rows = spec.target_rows(pass_name)
    keys = list(pass_spec.get("animation_keys", []))
    output = output_path or spec.runtime_path(pass_name)

    sheet = Image.new("RGBA", (target_cols * fw, target_rows * fh), (0, 0, 0, 0))
    report = AssemblyReport(
        character=spec.name,
        pass_name=pass_name,
        runtime_output=output,
        frame_w=fw,
        frame_h=fh,
        target_cols=target_cols,
        target_rows=target_rows,
        animation_keys=keys,
    )

    for row_index, key in enumerate(keys):
        row_frames = frames_by_key.get(key, {})
        for col_index in range(target_cols):
            frame_path = row_frames.get(col_index)
            cell_name = _frame_key(key, col_index)
            if frame_path is None or not frame_path.exists():
                report.missing_frames.append(f"{cell_name}.png")
                continue
            frame = Image.open(frame_path)
            cell = fit_to_cell(frame, fw, fh, baseline_y)
            sheet.alpha_composite(cell, (col_index * fw, row_index * fh))
            report.source_frames[cell_name] = str(frame_path)

    palette = by_name(spec.palette)
    sheet = quantize_to_palette(sheet, palette)

    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output)

    if normalized_dir is not None:
        normalized_dir.mkdir(parents=True, exist_ok=True)
        for row_index, key in enumerate(keys):
            for col_index in range(target_cols):
                cell_name = _frame_key(key, col_index)
                if f"{cell_name}.png" in report.missing_frames:
                    continue
                crop = sheet.crop((col_index * fw, row_index * fh, (col_index + 1) * fw, (row_index + 1) * fh))
                norm_path = normalized_dir / f"{cell_name}.png"
                crop.save(norm_path)
                report.normalized_frames[cell_name] = str(norm_path)

    if validate:
        report.validation = validate_sprite.validate_runtime_sheet(
            path=output,
            expected_w=target_cols * fw,
            expected_h=target_rows * fh,
            palette=palette,
            frame_w=fw,
            frame_h=fh,
            baseline_y=baseline_y,
            target_cols=target_cols,
            target_rows=target_rows,
        )
    return report
