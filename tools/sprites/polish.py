"""Open a runtime sheet in Aseprite with the project palette pre-loaded.

If an .aseprite working file exists at art/characters/<name>/aseprite/<name>_<pass>.aseprite,
that file is opened directly. Otherwise the runtime PNG is opened with the palette argument
(Aseprite then lets the user save as .aseprite to start a working file).

Usage (via CLI dispatcher):
  ./sprite polish <character> <pass>
"""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from _common import (  # noqa: E402
    CharacterSpec, find_aseprite,
    green, red, yellow, dim, header, relpath,
)


def run(spec: CharacterSpec, pass_name: str) -> int:
    pass_spec = spec.get_pass(pass_name)
    aseprite = find_aseprite()
    if not aseprite:
        print(red("Aseprite not found. Set ASEPRITE_BIN, install Aseprite to ~/Applications/, "
                  "or add it to PATH."))
        return 1

    runtime = spec.runtime_path(pass_name)
    if not runtime.exists():
        print(red(f"no runtime sheet at {relpath(runtime)}; run `./sprite convert {spec.name} {pass_name}` first."))
        return 1

    palette = spec.palette_gpl()
    if not palette.exists():
        print(yellow(f"palette file missing at {relpath(palette)}; "
                      f"run `python3 tools/sprites/palette.py` to regenerate."))
        # Continue anyway — Aseprite will open without forced palette.

    aseprite_file = spec.aseprite_path(pass_name)
    aseprite_file.parent.mkdir(parents=True, exist_ok=True)

    header(f"polish  {spec.name} · {pass_name}")
    print(dim(f"binary:  {aseprite}"))
    if aseprite_file.exists():
        print(green("opening  ") + relpath(aseprite_file))
        cmd = [aseprite, str(aseprite_file)]
    else:
        print(green("opening  ") + relpath(runtime))
        if palette.exists():
            print(dim(f"palette: {relpath(palette)}"))
        cmd = [aseprite, "--palette", str(palette), str(runtime)] if palette.exists() else [aseprite, str(runtime)]

    print(dim(f"\nWhen done editing in Aseprite:\n"
              f"  • File → Save Copy As… → {relpath(runtime)}\n"
              f"  • Or run `./sprite aseprite-watch` in another terminal to auto-export saves\n"))

    # Spawn Aseprite without blocking the shell
    try:
        subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                         start_new_session=True)
    except Exception as e:
        print(red(f"failed to launch: {e}"))
        return 1
    return 0


def _main(argv: list[str] | None = None) -> int:
    import argparse
    from _common import load_spec
    parser = argparse.ArgumentParser()
    parser.add_argument("character")
    parser.add_argument("pass_name", metavar="pass")
    args = parser.parse_args(argv)
    return run(load_spec(args.character), args.pass_name)


if __name__ == "__main__":
    raise SystemExit(_main())
