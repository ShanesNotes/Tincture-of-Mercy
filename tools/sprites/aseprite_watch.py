"""Watch art/characters/*/aseprite/*.aseprite for save events; auto-export to sheets/ + validate.

Use case: open a runtime sheet via `./sprite polish`, edit in Aseprite, hit Ctrl+S.
This watcher detects the save and produces an updated PNG runtime sheet via Aseprite's CLI,
then runs the project validator.

Usage (via CLI dispatcher):
  ./sprite aseprite-watch
"""
from __future__ import annotations

import subprocess
import sys
import time
from pathlib import Path

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from _common import (  # noqa: E402
    ART_ROOT, TOOLS_DIR,
    list_specs, load_spec, find_aseprite,
    green, red, yellow, dim, bold, header, relpath,
)


POLL_INTERVAL = 1.0


def find_aseprite_files() -> list[tuple[Path, str, str]]:
    """Return [(file, character, pass), …] for every .aseprite that maps to a known spec."""
    out: list[tuple[Path, str, str]] = []
    for character in list_specs():
        spec = load_spec(character)
        for pass_name in spec.passes:
            f = spec.aseprite_path(pass_name)
            if f.exists():
                out.append((f, character, pass_name))
    return out


def export_and_validate(aseprite_bin: str, asefile: Path, character: str, pass_name: str) -> int:
    spec = load_spec(character)
    runtime = spec.runtime_path(pass_name)
    runtime.parent.mkdir(parents=True, exist_ok=True)
    cmd = [aseprite_bin, "-b", str(asefile), "--save-as", str(runtime)]
    print(dim(f"  $ {' '.join(cmd)}"))
    try:
        subprocess.check_call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except subprocess.CalledProcessError as e:
        print(red(f"  aseprite export failed (rc={e.returncode})"))
        return 1
    # validate
    validate_cmd = [
        sys.executable, str(TOOLS_DIR / "cli.py"),
        "validate", character, pass_name,
    ]
    return subprocess.call(validate_cmd)


def run() -> int:
    aseprite = find_aseprite()
    if not aseprite:
        print(red("Aseprite not found. Set ASEPRITE_BIN, install Aseprite, or add it to PATH."))
        return 1

    header("aseprite-watch")
    print(dim(f"binary:  {aseprite}"))
    files = find_aseprite_files()
    if not files:
        print(yellow("no .aseprite working files found yet — open one with `./sprite polish` first."))
        return 0
    print(dim(f"watching {len(files)} working file(s); Ctrl+C to stop:"))
    for f, _, _ in files:
        print(dim(f"  {relpath(f)}"))
    print()

    seen: dict[Path, float] = {f: f.stat().st_mtime for f, _, _ in files}

    try:
        while True:
            current = find_aseprite_files()
            for f, character, pass_name in current:
                try:
                    mtime = f.stat().st_mtime
                except FileNotFoundError:
                    continue
                last = seen.get(f)
                if last is None:
                    seen[f] = mtime
                    print(bold(f"discovered ") + f"{relpath(f)}")
                    continue
                if mtime <= last:
                    continue
                # debounce
                time.sleep(POLL_INTERVAL)
                try:
                    new_mtime = f.stat().st_mtime
                except FileNotFoundError:
                    continue
                if new_mtime != mtime:
                    # Keep the previous processed timestamp so long saves are
                    # still exported once the file becomes stable.
                    continue
                seen[f] = mtime
                print()
                print(bold(f"saved      ") + f"{relpath(f)}  →  {character} · {pass_name}")
                rc = export_and_validate(aseprite, f, character, pass_name)
                if rc == 0:
                    print(green("  PASS"))
                else:
                    print(red("  FAIL"))
            time.sleep(POLL_INTERVAL)
    except KeyboardInterrupt:
        print(dim("\nstopped."))
        return 0


if __name__ == "__main__":
    raise SystemExit(run())
