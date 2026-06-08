#!/usr/bin/env python3
"""Tincture of Mercy sprite-pipeline CLI.

Usage:
  ./sprite <command> [args]

Commands:
  list                              list known characters and passes
  ingest <file> <character> <pass>  copy a file from anywhere into source/
  convert <character> <pass>        source → runtime (deterministic pipeline)
  retarget <character> <pass>       high-res master/source → reviewable runtime candidate(s)
  validate <character> <pass>       runtime acceptance check
  preview <character> <pass>        produce GIFs + 4× zoom PNG for visual review
  compare <character> <pass>        side-by-side source vs runtime cells (polish aid)
  polish <character> <pass>         open runtime sheet in Aseprite with palette pre-loaded
  watch                             watch ~/Downloads for character_pass.png drops
  health                            validate every runtime sheet across the project
  catalog                           build art/characters/index.html dashboard
  scaffold <character>              create folder structure + spec stub for a new character
  aseprite-watch                    auto-export .aseprite saves to sheets/ + validate
  path <character> <pass> <kind>    print canonical source/master/runtime/aseprite/preview path
  metadata <character> <pass>       print spec-backed JSON for scripts
  aseprite-run <script> <char> <pass>
                                    run a project Aseprite Lua script headlessly
  pixellab balance                  verify PIXELLAB_SECRET + show credits/quota
  pixellab character create <char>  generate v3 character (south-facing reference) + save character_id
  pixellab generate <char> <pass>   animate locked character → runtime sheet
  pixellab assemble <char> <pass> <dir>
                                    lay out individual frame PNGs into spec grid

All commands resolve dimensions, palette, baseline from tools/sprites/specs/<character>.json.
No flags needed for routine use.
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from _common import (  # noqa: E402
    REPO_ROOT, TOOLS_DIR,
    load_spec, list_specs, find_aseprite, validate_character_name,
    green, red, yellow, dim, bold, header, relpath,
)

ASEPRITE_SCRIPTS_DIR = TOOLS_DIR / "aseprite_scripts"


# ---------------------------------------------------------------------------
# list
# ---------------------------------------------------------------------------

def cmd_list(args) -> int:
    header("characters & passes")
    for name in list_specs():
        spec = load_spec(name)
        print(f"\n  {bold(name)} {dim('— palette: ' + spec.palette)}")
        for pass_name, pass_spec in spec.passes.items():
            sheet = relpath(spec.runtime_path(pass_name))
            exists = spec.runtime_path(pass_name).exists()
            mark = green("✓") if exists else dim("·")
            cols = spec.target_cols(pass_name)
            rows = spec.target_rows(pass_name)
            fw = spec.frame_w(pass_name)
            fh = spec.frame_h(pass_name)
            print(f"    {mark} {pass_name:<14} {dim(f'{cols}×{rows} cells, {cols*fw}×{rows*fh} px →')} {sheet}")
    print()
    return 0


# ---------------------------------------------------------------------------
# ingest — copy a file into source/<character>_<pass>_source.png
# ---------------------------------------------------------------------------

def cmd_ingest(args) -> int:
    src = Path(args.file).expanduser().resolve()
    if not src.exists():
        print(red(f"file not found: {src}"))
        return 1
    spec = load_spec(args.character)
    spec.get_pass(args.pass_name)
    ingest_kind = getattr(args, "ingest_kind", "source")
    target = spec.master_path(args.pass_name) if ingest_kind == "master" else spec.source_path(args.pass_name)
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, target)
    print(green(f"ingested  ") + f"{relpath(target)}")
    if args.then_convert:
        if ingest_kind == "master":
            args.source = str(target)
            if getattr(args, "resize_method", None) is None:
                args.resize_method = "box"
        return cmd_convert(args)
    return 0


# ---------------------------------------------------------------------------
# convert — source → runtime
# ---------------------------------------------------------------------------

def cmd_convert(args) -> int:
    spec = load_spec(args.character)
    pass_spec = spec.get_pass(args.pass_name)
    from_kind = getattr(args, "from_kind", "source")
    source = spec.master_path(args.pass_name) if from_kind == "master" else spec.source_path(args.pass_name)
    explicit_source = getattr(args, "source", None)
    if explicit_source:
        source = Path(explicit_source).expanduser().resolve()
    resize_method = getattr(args, "resize_method", None) or ("box" if from_kind == "master" else "nearest")
    if not source.exists():
        print(red(f"no source at {relpath(source)}; run `./sprite ingest <file> {args.character} {args.pass_name}` first."))
        return 1

    output = spec.runtime_path(args.pass_name)
    cmd = [
        sys.executable, str(TOOLS_DIR / "make_runtime_sprite.py"),
        "--source", str(source),
        "--output", str(output),
        "--palette", spec.palette,
        "--source-frames", str(pass_spec["source_frames"]),
        "--source-cols",   str(pass_spec["source_cols"]),
        "--source-rows",   str(pass_spec["source_rows"]),
        "--target-cols",   str(spec.target_cols(args.pass_name)),
        "--target-rows",   str(spec.target_rows(args.pass_name)),
        "--frame-w",       str(spec.frame_w(args.pass_name)),
        "--frame-h",       str(spec.frame_h(args.pass_name)),
        "--baseline-y",    str(spec.baseline_y(args.pass_name)),
        "--resize-method", resize_method,
    ]
    header(f"convert  {args.character} · {args.pass_name}")
    print(dim(f"source: {relpath(source)}"))
    print(dim(f"output: {relpath(output)}"))
    sys.stdout.flush()
    rc = subprocess.call(cmd)
    if rc == 0 and getattr(args, "auto_preview", True):
        # auto-generate preview
        preview_args = argparse.Namespace(character=args.character, pass_name=args.pass_name)
        cmd_preview(preview_args)
    return rc


# ---------------------------------------------------------------------------
# retarget — high-res master/source → runtime candidates
# ---------------------------------------------------------------------------

def cmd_retarget(args) -> int:
    import retarget as retarget_mod  # type: ignore
    spec = load_spec(args.character)
    source = Path(args.source).expanduser().resolve() if args.source else None
    return retarget_mod.run(
        spec,
        args.pass_name,
        source=source,
        method=args.method,
        promote=args.promote,
    )


# ---------------------------------------------------------------------------
# validate — standalone acceptance check
# ---------------------------------------------------------------------------

def cmd_validate(args) -> int:
    spec = load_spec(args.character)
    spec.get_pass(args.pass_name)
    output = spec.runtime_path(args.pass_name)
    if not output.exists():
        print(red(f"no runtime at {relpath(output)}"))
        return 1
    cmd = [
        sys.executable, str(TOOLS_DIR / "validate_sprite.py"),
        "--path", str(output),
        "--expected-w", str(spec.sheet_w(args.pass_name)),
        "--expected-h", str(spec.sheet_h(args.pass_name)),
        "--palette", spec.palette,
        "--frame-w", str(spec.frame_w(args.pass_name)),
        "--frame-h", str(spec.frame_h(args.pass_name)),
        "--baseline-y", str(spec.baseline_y(args.pass_name)),
        "--target-cols", str(spec.target_cols(args.pass_name)),
        "--target-rows", str(spec.target_rows(args.pass_name)),
    ]
    return subprocess.call(cmd)


# ---------------------------------------------------------------------------
# preview — GIF per animation row + 4× zoom PNG
# ---------------------------------------------------------------------------

def cmd_preview(args) -> int:
    import preview as preview_mod  # type: ignore
    spec = load_spec(args.character)
    return preview_mod.run(spec, args.pass_name)


# ---------------------------------------------------------------------------
# compare — side-by-side source vs runtime cells
# ---------------------------------------------------------------------------

def cmd_compare(args) -> int:
    import compare as compare_mod  # type: ignore
    spec = load_spec(args.character)
    return compare_mod.run(spec, args.pass_name, zoom=args.zoom)


# ---------------------------------------------------------------------------
# polish — open runtime sheet in Aseprite with palette
# ---------------------------------------------------------------------------

def cmd_polish(args) -> int:
    import polish as polish_mod  # type: ignore
    spec = load_spec(args.character)
    return polish_mod.run(spec, args.pass_name)


# ---------------------------------------------------------------------------
# watch — Downloads watcher
# ---------------------------------------------------------------------------

def cmd_watch(args) -> int:
    import watch as watch_mod  # type: ignore
    return watch_mod.run(directory=Path(args.directory).expanduser())


# ---------------------------------------------------------------------------
# health — validate every runtime sheet
# ---------------------------------------------------------------------------

def cmd_health(args) -> int:
    import health as health_mod  # type: ignore
    return health_mod.run()


# ---------------------------------------------------------------------------
# catalog — HTML dashboard
# ---------------------------------------------------------------------------

def cmd_catalog(args) -> int:
    import catalog as catalog_mod  # type: ignore
    return catalog_mod.run()


# ---------------------------------------------------------------------------
# scaffold — new character bootstrap
# ---------------------------------------------------------------------------

def cmd_scaffold(args) -> int:
    import scaffold as scaffold_mod  # type: ignore
    return scaffold_mod.run(validate_character_name(args.character))


# ---------------------------------------------------------------------------
# path — print canonical asset paths for scripts/tools
# ---------------------------------------------------------------------------

def cmd_path(args) -> int:
    spec = load_spec(args.character)
    spec.get_pass(args.pass_name)
    path_by_kind = {
        "source": spec.source_path(args.pass_name),
        "master": spec.master_path(args.pass_name),
        "runtime": spec.runtime_path(args.pass_name),
        "aseprite": spec.aseprite_path(args.pass_name),
        "preview": spec.preview_dir(),
    }
    print(path_by_kind[args.kind])
    return 0


# ---------------------------------------------------------------------------
# metadata — JSON context for Aseprite Lua scripts
# ---------------------------------------------------------------------------

def sprite_metadata(spec, pass_name: str) -> dict:
    pass_spec = spec.get_pass(pass_name)
    return {
        "character": spec.name,
        "pass": pass_name,
        "palette": spec.palette,
        "frame_w": spec.frame_w(pass_name),
        "frame_h": spec.frame_h(pass_name),
        "baseline_y": spec.baseline_y(pass_name),
        "target_cols": spec.target_cols(pass_name),
        "target_rows": spec.target_rows(pass_name),
        "sheet_w": spec.sheet_w(pass_name),
        "sheet_h": spec.sheet_h(pass_name),
        "source_frames": pass_spec["source_frames"],
        "source_cols": pass_spec["source_cols"],
        "source_rows": pass_spec["source_rows"],
        "animation_keys": pass_spec.get("animation_keys", []),
        "paths": {
            "source": str(spec.source_path(pass_name)),
            "master": str(spec.master_path(pass_name)),
            "runtime": str(spec.runtime_path(pass_name)),
            "aseprite": str(spec.aseprite_path(pass_name)),
            "preview": str(spec.preview_dir()),
            "palette_gpl": str(spec.palette_gpl()),
        },
    }


def cmd_metadata(args) -> int:
    spec = load_spec(args.character)
    payload = sprite_metadata(spec, args.pass_name)
    print(json.dumps(payload, indent=2, sort_keys=True))
    return 0


# ---------------------------------------------------------------------------
# aseprite-run — batch Aseprite Lua scripts with spec params
# ---------------------------------------------------------------------------

def list_aseprite_scripts() -> list[Path]:
    return sorted(
        p for p in ASEPRITE_SCRIPTS_DIR.glob("*.lua")
        if p.name != "tom_sprite_lib.lua"
    )


def _resolve_aseprite_script(script_name: str) -> Path:
    name = script_name if script_name.endswith(".lua") else f"{script_name}.lua"
    path = ASEPRITE_SCRIPTS_DIR / name
    if not path.exists():
        known = ", ".join(p.stem for p in list_aseprite_scripts())
        raise SystemExit(f"unknown Aseprite script '{script_name}'. Known: {known}")
    return path


def _parse_script_params(raw_params: list[str]) -> list[str]:
    out: list[str] = []
    for item in raw_params:
        if "=" not in item:
            raise SystemExit(f"--param must be key=value, got: {item}")
        key, value = item.split("=", 1)
        if not key:
            raise SystemExit(f"--param key cannot be empty: {item}")
        out.append(f"{key}={value}")
    return out


def cmd_aseprite_run(args) -> int:
    aseprite = find_aseprite()
    if not aseprite:
        print(red("Aseprite not found. Set ASEPRITE_BIN, install Aseprite, or add it to PATH."))
        return 1

    spec = load_spec(args.character)
    spec.get_pass(args.pass_name)
    script = _resolve_aseprite_script(args.script)

    input_path = Path(args.input).expanduser().resolve() if args.input else spec.aseprite_path(args.pass_name)
    if not input_path.exists():
        fallback = spec.runtime_path(args.pass_name)
        if args.input:
            print(red(f"input not found: {input_path}"))
            return 1
        input_path = fallback
    if not input_path.exists():
        print(red(f"no Aseprite or runtime input found for {spec.name}/{args.pass_name}"))
        return 1

    output_path = None
    if args.output:
        output_path = Path(args.output).expanduser().resolve()
    elif args.in_place:
        output_path = input_path

    cmd = [
        aseprite,
        "-b",
        str(input_path),
        "--script-param", f"repo={REPO_ROOT}",
        "--script-param", f"character={spec.name}",
        "--script-param", f"pass={args.pass_name}",
        "--script-param", "batch=1",
    ]
    for param in _parse_script_params(args.param or []):
        cmd.extend(["--script-param", param])
    cmd.extend(["--script", str(script)])
    if output_path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        cmd.extend(["--save-as", str(output_path)])

    header(f"aseprite-run  {script.stem}  {spec.name} · {args.pass_name}")
    print(dim(f"input : {relpath(input_path)}"))
    if output_path:
        print(dim(f"output: {relpath(output_path)}"))
    print(dim(f"$ {' '.join(str(c) for c in cmd)}"))
    sys.stdout.flush()
    rc = subprocess.call(cmd)
    if rc != 0:
        return rc
    if args.validate and output_path and output_path == spec.runtime_path(args.pass_name).resolve():
        validate_args = argparse.Namespace(character=spec.name, pass_name=args.pass_name)
        return cmd_validate(validate_args)
    return 0


# ---------------------------------------------------------------------------
# aseprite-watch — auto-export saves
# ---------------------------------------------------------------------------

def cmd_aseprite_watch(args) -> int:
    import aseprite_watch as aw_mod  # type: ignore
    return aw_mod.run()


# ---------------------------------------------------------------------------
# diagnose — environment check
# ---------------------------------------------------------------------------

def cmd_diagnose(args) -> int:
    header("environment diagnostics")
    print(f"  repo root:    {REPO_ROOT}")
    print(f"  python:       {sys.version.split()[0]}")
    try:
        import PIL
        print(f"  Pillow:       {PIL.__version__}")
    except ImportError:
        print(red("  Pillow:       NOT INSTALLED — pip install pillow"))
    aseprite = find_aseprite()
    if aseprite:
        print(green(f"  aseprite:     {aseprite}"))
        try:
            v = subprocess.check_output([aseprite, "--version"], text=True, timeout=5).strip()
            print(f"  aseprite ver: {v}")
        except Exception as e:
            print(yellow(f"  aseprite ver: could not read ({e})"))
    else:
        print(yellow("  aseprite:     not found (set ASEPRITE_BIN to override)"))
    print(f"  characters:   {', '.join(list_specs())}")
    print()
    return 0


# ---------------------------------------------------------------------------
# main parser
# ---------------------------------------------------------------------------

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="sprite", description=__doc__,
                                      formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="cmd", required=True)

    sub.add_parser("list").set_defaults(func=cmd_list)
    sub.add_parser("diagnose").set_defaults(func=cmd_diagnose)

    p = sub.add_parser("ingest", help="copy a file into source/ for a character+pass")
    p.add_argument("file")
    p.add_argument("character")
    p.add_argument("pass_name", metavar="pass")
    p.add_argument("--as", dest="ingest_kind", choices=("source", "master"), default="source")
    p.add_argument(
        "--resize-method",
        choices=("nearest", "box", "bilinear", "bicubic", "lanczos"),
        default=None,
        help="downsample filter when used with --then-convert; master defaults to box",
    )
    p.add_argument("--then-convert", action="store_true")
    p.set_defaults(func=cmd_ingest)

    p = sub.add_parser("convert", help="source → runtime")
    p.add_argument("character")
    p.add_argument("pass_name", metavar="pass")
    p.add_argument("--source", help="explicit source path (override spec)")
    p.add_argument("--from", dest="from_kind", choices=("source", "master"), default="source")
    p.add_argument(
        "--resize-method",
        choices=("nearest", "box", "bilinear", "bicubic", "lanczos"),
        default=None,
        help="non-runtime-sized source downsample filter; source defaults to nearest, master defaults to box",
    )
    p.add_argument("--no-preview", dest="auto_preview", action="store_false")
    p.set_defaults(func=cmd_convert)

    p = sub.add_parser("retarget", help="high-res master/source → reviewable runtime candidate(s)")
    p.add_argument("character")
    p.add_argument("pass_name", metavar="pass")
    p.add_argument("--source", help="explicit master/source PNG (default: master path, then source path)")
    p.add_argument(
        "--method",
        choices=("box", "nearest", "bilinear", "bicubic", "lanczos", "all"),
        default="box",
        help="candidate downsample filter; use 'all' to compare box/nearest/lanczos",
    )
    p.add_argument("--promote", action="store_true", help="copy a passing single-method candidate to runtime")
    p.set_defaults(func=cmd_retarget)

    p = sub.add_parser("validate", help="runtime acceptance check")
    p.add_argument("character")
    p.add_argument("pass_name", metavar="pass")
    p.set_defaults(func=cmd_validate)

    p = sub.add_parser("preview", help="GIF + 4× zoom PNG of runtime sheet")
    p.add_argument("character")
    p.add_argument("pass_name", metavar="pass")
    p.set_defaults(func=cmd_preview)

    p = sub.add_parser("compare", help="side-by-side source vs runtime cells (polish aid)")
    p.add_argument("character")
    p.add_argument("pass_name", metavar="pass")
    p.add_argument("--zoom", type=int, default=4)
    p.set_defaults(func=cmd_compare)

    p = sub.add_parser("polish", help="open runtime sheet in Aseprite with palette")
    p.add_argument("character")
    p.add_argument("pass_name", metavar="pass")
    p.set_defaults(func=cmd_polish)

    p = sub.add_parser("watch", help="watch directory for character_pass.png drops")
    p.add_argument("--directory", default="~/Downloads")
    p.set_defaults(func=cmd_watch)

    sub.add_parser("health", help="validate every runtime sheet").set_defaults(func=cmd_health)
    sub.add_parser("catalog", help="build HTML dashboard").set_defaults(func=cmd_catalog)
    sub.add_parser("aseprite-watch", help="auto-export .aseprite saves").set_defaults(func=cmd_aseprite_watch)

    p = sub.add_parser("scaffold", help="bootstrap a new character")
    p.add_argument("character")
    p.set_defaults(func=cmd_scaffold)

    p = sub.add_parser("path", help="print a canonical sprite path for scripts")
    p.add_argument("character")
    p.add_argument("pass_name", metavar="pass")
    p.add_argument("kind", choices=("source", "master", "runtime", "aseprite", "preview"))
    p.set_defaults(func=cmd_path)

    p = sub.add_parser("metadata", help="print spec-backed JSON for scripts")
    p.add_argument("character")
    p.add_argument("pass_name", metavar="pass")
    p.set_defaults(func=cmd_metadata)

    p = sub.add_parser("aseprite-run", help="run a project Aseprite Lua script headlessly")
    p.add_argument("script", help="script name, with or without .lua")
    p.add_argument("character")
    p.add_argument("pass_name", metavar="pass")
    p.add_argument("--input", help="input .aseprite/.png (default: aseprite file, then runtime)")
    p.add_argument("--output", help="write a copy to this path after the script runs")
    p.add_argument("--in-place", action="store_true", help="save back to the input path")
    p.add_argument("--param", action="append", default=[], help="extra Lua app.params entry, key=value")
    p.add_argument("--validate", action="store_true", help="validate when output is the canonical runtime path")
    p.set_defaults(func=cmd_aseprite_run)

    import pixellab as pixellab_mod  # type: ignore
    pixellab_mod.add_subcommand(sub)

    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
