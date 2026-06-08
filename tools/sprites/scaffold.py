"""Scaffold a new character: folders + spec stub + reminder of next steps.

Usage (via CLI dispatcher):
  ./sprite scaffold <character>

Creates:
  art/characters/<character>/
    source/
    sheets/
    aseprite/
    preview/
  tools/sprites/specs/<character>.json   (stub; edit before first use)
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from _common import (  # noqa: E402
    ART_ROOT, SPECS_DIR, PALETTES_DIR,
    list_specs, validate_character_name,
    green, red, yellow, dim, header, relpath,
)


STUB = {
    "name": "<NAME>",
    "palette": "<PALETTE>",
    "default_frame_w": 64,
    "default_frame_h": 96,
    "default_baseline_y": 84,
    "passes": {
        "<PASS>": {
            "description": "FILL ME IN — what does this pass cover?",
            "source_frames": 4,
            "source_cols": 4,
            "source_rows": 1,
            "target_cols": 4,
            "target_rows": 1,
            "animation_keys": ["idle_down"]
        }
    }
}


def run(character: str) -> int:
    character = validate_character_name(character)
    if character in list_specs():
        print(red(f"character '{character}' already has a spec at {relpath(SPECS_DIR / (character + '.json'))}"))
        return 1

    header(f"scaffold  {character}")

    # Folders
    for sub in ("source", "sheets", "aseprite", "preview"):
        path = ART_ROOT / character / sub
        path.mkdir(parents=True, exist_ok=True)
        print(green("created  ") + relpath(path))

    # Spec stub
    spec_path = SPECS_DIR / f"{character}.json"
    stub = json.loads(json.dumps(STUB))  # deep copy
    stub["name"] = character
    stub["palette"] = character if (PALETTES_DIR / f"{character}.gpl").exists() else "project"
    spec_path.write_text(json.dumps(stub, indent=2) + "\n")
    print(green("wrote    ") + relpath(spec_path))

    print()
    print(dim("next steps:"))
    print(dim(f"  1. edit {relpath(spec_path)} — set canvas, passes, source-grid shape"))
    print(dim(f"  2. add a palette subset to tools/sprites/palette.py if {character} needs one"))
    print(dim(f"  3. regenerate .gpl files: python3 tools/sprites/palette.py"))
    print(dim(f"  4. drop a source PNG in ~/Downloads named {character}_<pass>.png and `./sprite watch`"))
    print()
    return 0


def _main(argv: list[str] | None = None) -> int:
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("character")
    args = parser.parse_args(argv)
    return run(args.character)


if __name__ == "__main__":
    raise SystemExit(_main())
