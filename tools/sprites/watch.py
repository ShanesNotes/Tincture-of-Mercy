"""Watch a directory (default ~/Downloads) for sprite-source PNG drops.

Filename convention: `<character>_<pass>.png` (or any longer name starting with that prefix,
e.g. `kalev_idle_front_attempt3.png`). The watcher matches the longest known character+pass
prefix it can find against the loaded specs.

Behaviour on match:
  1. Stamp the file into art/characters/<character>/source/<character>_<pass>_source.png
  2. Also archive a timestamped copy under .../source/attempts/ for iteration history
  3. Run convert → validate
  4. Auto-preview on PASS

Stays running until interrupted (Ctrl+C). Uses polling (1s interval) for portability.
"""
from __future__ import annotations

import shutil
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from _common import (  # noqa: E402
    REPO_ROOT, TOOLS_DIR, ART_ROOT,
    list_specs, load_spec,
    green, red, yellow, blue, dim, bold, header, relpath,
)


POLL_INTERVAL = 1.0


def match_filename(stem: str) -> tuple[str, str] | None:
    """Return (character, pass_name) if filename stem starts with a known character+pass."""
    for char in list_specs():
        if not stem.startswith(f"{char}_"):
            continue
        spec = load_spec(char)
        rest = stem[len(char) + 1:]
        # Match the longest pass name that is a prefix of `rest` followed by end or `_`.
        matches = sorted(spec.passes.keys(), key=len, reverse=True)
        for pname in matches:
            if rest == pname or rest.startswith(pname + "_"):
                return (char, pname)
    return None


def archive_attempt(source: Path, character: str, pass_name: str) -> Path:
    archive_dir = ART_ROOT / character / "source" / "attempts"
    archive_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    dest = archive_dir / f"{character}_{pass_name}_{ts}.png"
    counter = 2
    while dest.exists():
        dest = archive_dir / f"{character}_{pass_name}_{ts}_{counter}.png"
        counter += 1
    shutil.copy2(source, dest)
    return dest


def process_drop(source_path: Path) -> bool:
    """Return True if the file was claimed and processed (success or failure), False if ignored."""
    if not source_path.is_file() or source_path.suffix.lower() != ".png":
        return False
    match = match_filename(source_path.stem)
    if not match:
        print(dim(f"skipped   {relpath(source_path)} (no known character/pass match)"))
        return False
    character, pass_name = match
    spec = load_spec(character)

    print()
    print(bold(f"detected  ") + f"{relpath(source_path)} → {character} · {pass_name}")

    # Archive + canonical staging
    archived = archive_attempt(source_path, character, pass_name)
    staged = spec.source_path(pass_name)
    staged.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source_path, staged)
    print(dim(f"  staged    {relpath(staged)}"))
    print(dim(f"  archived  {relpath(archived)}"))

    # Convert + validate (validate runs inside make_runtime_sprite.py)
    cmd = [
        sys.executable, str(TOOLS_DIR / "cli.py"),
        "convert", character, pass_name,
    ]
    rc = subprocess.call(cmd)
    if rc == 0:
        print(green("\n  PASS") + dim(" — runtime sheet ready"))
    else:
        print(red("\n  FAIL") + dim(" — see acceptance log above"))
    return True


def run(directory: Path) -> int:
    if not directory.is_dir():
        print(red(f"watch directory does not exist: {directory}"))
        return 1
    header(f"watch  {directory}")
    print(dim(f"watching for <character>_<pass>.png drops; Ctrl+C to stop"))
    print(dim(f"known characters: {', '.join(list_specs())}"))

    seen: dict[Path, float] = {}
    # prime with current files so existing items don't re-trigger
    for f in directory.glob("*.png"):
        try:
            seen[f] = f.stat().st_mtime
        except FileNotFoundError:
            pass

    try:
        while True:
            for f in directory.glob("*.png"):
                try:
                    mtime = f.stat().st_mtime
                except FileNotFoundError:
                    continue
                last = seen.get(f)
                if last is not None and last >= mtime:
                    continue
                # debounce — wait one cycle to ensure file write is complete
                time.sleep(POLL_INTERVAL)
                try:
                    new_mtime = f.stat().st_mtime
                except FileNotFoundError:
                    continue
                if new_mtime != mtime:
                    # Keep the old timestamp so the next stable polling cycle
                    # still processes this drop instead of marking it handled.
                    continue
                seen[f] = mtime
                process_drop(f)
            time.sleep(POLL_INTERVAL)
    except KeyboardInterrupt:
        print(dim("\nstopped."))
        return 0


def _main(argv: list[str] | None = None) -> int:
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--directory", default="~/Downloads")
    args = parser.parse_args(argv)
    return run(Path(args.directory).expanduser())


if __name__ == "__main__":
    raise SystemExit(_main())
