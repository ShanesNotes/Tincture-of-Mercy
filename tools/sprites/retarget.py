"""High-resolution master/source retargeting into reviewable runtime candidates.

This is the safe lane for AI-generated "pixel art" masters: generate or ingest
larger art, downconvert through several deterministic filters, validate each
candidate, and promote only after review.
"""
from __future__ import annotations

import json
import shutil
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw

from _common import CharacterSpec, ART_ROOT, dim, green, header, red, relpath, yellow
from make_runtime_sprite import RESIZE_METHODS, compose_sheet
from palette import by_name
import validate_sprite


DEFAULT_METHODS = ("box", "nearest", "lanczos")


@dataclass
class Candidate:
    method: str
    path: Path
    validation: validate_sprite.ValidationReport

    @property
    def ok(self) -> bool:
        return self.validation.ok

    def to_dict(self) -> dict[str, Any]:
        return {
            "method": self.method,
            "path": relpath(self.path),
            "ok": self.ok,
            "validation": {
                "notes": self.validation.notes,
                "failures": self.validation.failures,
                "stats": self.validation.stats,
            },
        }


def _candidate_methods(method: str) -> list[str]:
    if method == "all":
        return list(DEFAULT_METHODS)
    if method not in RESIZE_METHODS:
        known = ", ".join(sorted([*RESIZE_METHODS, "all"]))
        raise SystemExit(f"unknown retarget method {method!r}; expected one of: {known}")
    return [method]


def _default_source(spec: CharacterSpec, pass_name: str) -> Path:
    master = spec.master_path(pass_name)
    if master.exists():
        return master
    return spec.source_path(pass_name)


def _candidate_root(spec: CharacterSpec, pass_name: str) -> Path:
    stamp = datetime.now().strftime("%Y%m%dT%H%M%S%z")
    return spec.preview_dir() / "candidates" / f"{stamp}-{pass_name}-master-retarget"


def _validate_candidate(spec: CharacterSpec, pass_name: str, path: Path) -> validate_sprite.ValidationReport:
    return validate_sprite.validate_runtime_sheet(
        path=path,
        expected_w=spec.sheet_w(pass_name),
        expected_h=spec.sheet_h(pass_name),
        palette=by_name(spec.palette),
        frame_w=spec.frame_w(pass_name),
        frame_h=spec.frame_h(pass_name),
        baseline_y=spec.baseline_y(pass_name),
        target_cols=spec.target_cols(pass_name),
        target_rows=spec.target_rows(pass_name),
    )


def _write_contact_sheet(
    *,
    spec: CharacterSpec,
    pass_name: str,
    source: Path,
    candidates: list[Candidate],
    out_dir: Path,
    zoom: int = 2,
) -> Path:
    fw, fh = spec.frame_w(pass_name), spec.frame_h(pass_name)
    sheet_w, sheet_h = spec.sheet_w(pass_name), spec.sheet_h(pass_name)
    pad = 8
    label_h = 24
    gap = 12
    columns = []
    for candidate in candidates:
        im = Image.open(candidate.path).convert("RGBA")
        columns.append((candidate, im.resize((sheet_w * zoom, sheet_h * zoom), Image.Resampling.NEAREST)))

    out_w = max(1, len(columns)) * (sheet_w * zoom) + max(0, len(columns) - 1) * gap + pad * 2
    out_h = sheet_h * zoom + label_h + pad * 2
    out = Image.new("RGBA", (out_w, out_h), (26, 23, 20, 255))
    draw = ImageDraw.Draw(out)
    for i, (candidate, image) in enumerate(columns):
        x = pad + i * (sheet_w * zoom + gap)
        label = f"{candidate.method} · {'PASS' if candidate.ok else 'FAIL'}"
        draw.text((x, pad), label, fill=(240, 230, 200, 255) if candidate.ok else (240, 120, 100, 255))
        # Checkerboard behind alpha.
        bg = Image.new("RGBA", image.size, (58, 54, 49, 255))
        bg_draw = ImageDraw.Draw(bg)
        sq = max(8, 8 * zoom)
        for yy in range(0, bg.height, sq):
            for xx in range(0, bg.width, sq):
                if (xx // sq + yy // sq) % 2:
                    bg_draw.rectangle([xx, yy, xx + sq - 1, yy + sq - 1], fill=(76, 70, 63, 255))
        bg.alpha_composite(image)
        out.alpha_composite(bg, (x, pad + label_h))
        for col in range(spec.target_cols(pass_name) + 1):
            gx = x + col * fw * zoom
            draw.line([(gx, pad + label_h), (gx, pad + label_h + sheet_h * zoom)], fill=(125, 112, 96, 130))
        for row in range(spec.target_rows(pass_name) + 1):
            gy = pad + label_h + row * fh * zoom
            draw.line([(x, gy), (x + sheet_w * zoom, gy)], fill=(125, 112, 96, 130))

    out_path = out_dir / f"{spec.name}_{pass_name}_retarget_compare_zoom{zoom}x.png"
    out.save(out_path)
    return out_path


def _promote(spec: CharacterSpec, pass_name: str, candidate: Candidate) -> Path:
    if not candidate.ok:
        raise SystemExit(f"refusing to promote failing candidate: {relpath(candidate.path)}")
    runtime = spec.runtime_path(pass_name)
    stamp = datetime.now().strftime("%Y%m%dT%H%M%S%z")
    backup_dir = ART_ROOT / spec.name / "_backups" / f"{stamp}-pre-master-retarget"
    backup_dir.mkdir(parents=True, exist_ok=True)
    if runtime.exists():
        shutil.copy2(runtime, backup_dir / runtime.name)
    runtime.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(candidate.path, runtime)
    return backup_dir


def run(
    spec: CharacterSpec,
    pass_name: str,
    *,
    source: Path | None = None,
    method: str = "box",
    promote: bool = False,
) -> int:
    pass_spec = spec.get_pass(pass_name)
    source_path = (source or _default_source(spec, pass_name)).expanduser().resolve()
    if not source_path.exists():
        print(red(f"missing master/source: {relpath(source_path)}"))
        print(dim(f"expected master: {relpath(spec.master_path(pass_name))}"))
        print(dim(f"fallback source : {relpath(spec.source_path(pass_name))}"))
        return 1

    methods = _candidate_methods(method)
    if promote and len(methods) != 1:
        print(red("--promote requires a single --method, not --method all"))
        return 1

    out_dir = _candidate_root(spec, pass_name)
    out_dir.mkdir(parents=True, exist_ok=True)
    palette = by_name(spec.palette)
    candidates: list[Candidate] = []

    header(f"retarget  {spec.name} · {pass_name}")
    print(dim(f"source : {relpath(source_path)}"))
    print(dim(f"target : {spec.sheet_w(pass_name)}×{spec.sheet_h(pass_name)} "
              f"({spec.target_cols(pass_name)}×{spec.target_rows(pass_name)} cells, "
              f"{spec.frame_w(pass_name)}×{spec.frame_h(pass_name)})"))
    print(dim(f"methods: {', '.join(methods)}"))

    for method_name in methods:
        out_path = out_dir / f"{spec.name}_{pass_name}_{method_name}_{spec.canvas_label(pass_name)}.png"
        compose_sheet(
            source_path=source_path,
            output_path=out_path,
            palette=palette,
            source_frames=pass_spec["source_frames"],
            source_cols=pass_spec["source_cols"],
            source_rows=pass_spec["source_rows"],
            target_cols=spec.target_cols(pass_name),
            target_rows=spec.target_rows(pass_name),
            frame_w=spec.frame_w(pass_name),
            frame_h=spec.frame_h(pass_name),
            baseline_y=spec.baseline_y(pass_name),
            start_target_index=0,
            resize_method=method_name,
        )
        report = _validate_candidate(spec, pass_name, out_path)
        candidates.append(Candidate(method=method_name, path=out_path, validation=report))
        status = green("PASS") if report.ok else red("FAIL")
        print(f"  {status} {method_name:<8} {relpath(out_path)}")
        if not report.ok:
            for failure in report.failures:
                print(yellow(f"           - {failure}"))

    compare_path = _write_contact_sheet(
        spec=spec,
        pass_name=pass_name,
        source=source_path,
        candidates=candidates,
        out_dir=out_dir,
    )
    report_path = out_dir / "retarget_report.json"
    report_path.write_text(json.dumps({
        "character": spec.name,
        "pass": pass_name,
        "source": relpath(source_path),
        "candidate_dir": relpath(out_dir),
        "compare": relpath(compare_path),
        "candidates": [c.to_dict() for c in candidates],
    }, indent=2, sort_keys=True) + "\n")
    print(green(f"compare: {relpath(compare_path)}"))
    print(dim(f"report : {relpath(report_path)}"))

    if promote:
        backup = _promote(spec, pass_name, candidates[0])
        print(green(f"promoted: {relpath(spec.runtime_path(pass_name))}"))
        print(dim(f"backup  : {relpath(backup)}"))

    return 0 if any(c.ok for c in candidates) else 1
