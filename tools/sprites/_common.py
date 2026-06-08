"""Shared helpers: path resolution, spec loading, Aseprite discovery."""
from __future__ import annotations

import json
import os
import re
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
TOOLS_DIR = REPO_ROOT / "tools" / "sprites"
SPECS_DIR = TOOLS_DIR / "specs"
PALETTES_DIR = TOOLS_DIR / "palettes"
ART_ROOT = REPO_ROOT / "art" / "characters"
CHARACTER_NAME_RE = re.compile(r"^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$")


@dataclass
class CharacterSpec:
    name: str
    palette: str
    default_frame_w: int
    default_frame_h: int
    default_baseline_y: int
    passes: dict[str, dict]
    raw: dict

    def get_pass(self, pass_name: str) -> dict:
        if pass_name not in self.passes:
            raise SystemExit(
                f"character '{self.name}' has no pass '{pass_name}'. "
                f"Known passes: {sorted(self.passes)}"
            )
        return self.passes[pass_name]

    def frame_w(self, pass_name: str) -> int:
        return self.passes[pass_name].get("frame_w", self.default_frame_w)

    def frame_h(self, pass_name: str) -> int:
        return self.passes[pass_name].get("frame_h", self.default_frame_h)

    def baseline_y(self, pass_name: str) -> int:
        return self.passes[pass_name].get("baseline_y", self.default_baseline_y)

    def target_cols(self, pass_name: str) -> int:
        return self.passes[pass_name]["target_cols"]

    def target_rows(self, pass_name: str) -> int:
        return self.passes[pass_name]["target_rows"]

    def sheet_w(self, pass_name: str) -> int:
        return self.target_cols(pass_name) * self.frame_w(pass_name)

    def sheet_h(self, pass_name: str) -> int:
        return self.target_rows(pass_name) * self.frame_h(pass_name)

    def canvas_label(self, pass_name: str) -> str:
        return f"{self.frame_w(pass_name)}x{self.frame_h(pass_name)}"

    def source_path(self, pass_name: str) -> Path:
        return ART_ROOT / self.name / "source" / f"{self.name}_{pass_name}_source.png"

    def master_path(self, pass_name: str) -> Path:
        return ART_ROOT / self.name / "masters" / f"{self.name}_{pass_name}_master.png"

    def runtime_path(self, pass_name: str) -> Path:
        return (
            ART_ROOT / self.name / "sheets"
            / f"{self.name}_{pass_name}_{self.canvas_label(pass_name)}.png"
        )

    def aseprite_path(self, pass_name: str) -> Path:
        return ART_ROOT / self.name / "aseprite" / f"{self.name}_{pass_name}.aseprite"

    def preview_dir(self) -> Path:
        return ART_ROOT / self.name / "preview"

    def palette_gpl(self) -> Path:
        return PALETTES_DIR / f"{self.palette}.gpl"


def load_spec(name: str) -> CharacterSpec:
    validate_character_name(name)
    path = SPECS_DIR / f"{name}.json"
    if not path.exists():
        known = sorted(p.stem for p in SPECS_DIR.glob("*.json"))
        raise SystemExit(f"no spec for character '{name}' at {path}. Known: {known}")
    raw = json.loads(path.read_text())
    if raw.get("name") != name:
        raise SystemExit(f"spec {path} declares name={raw.get('name')!r}; expected {name!r}")
    _validate_spec_shape(path, raw)
    return CharacterSpec(
        name=raw["name"],
        palette=raw["palette"],
        default_frame_w=raw.get("default_frame_w", 64),
        default_frame_h=raw.get("default_frame_h", 96),
        default_baseline_y=raw.get("default_baseline_y", 84),
        passes=raw["passes"],
        raw=raw,
    )


def list_specs() -> list[str]:
    return sorted(p.stem for p in SPECS_DIR.glob("*.json"))


def validate_character_name(name: str) -> str:
    """Return `name` if it is a safe project character id, else abort with guidance."""
    if not CHARACTER_NAME_RE.fullmatch(name):
        raise SystemExit(
            f"invalid character name '{name}'. Use lowercase snake_case "
            "(example: kalev, dr_amos, wolf_01)."
        )
    return name


def _positive_int(raw: dict, key: str, context: str) -> None:
    value = raw.get(key)
    if not isinstance(value, int) or value <= 0:
        raise SystemExit(f"{context}: '{key}' must be a positive integer")


def _validate_spec_shape(path: Path, raw: dict) -> None:
    """Fail early on spec typos that would otherwise surface as noisy KeyErrors."""
    for key in ("name", "palette", "passes"):
        if key not in raw:
            raise SystemExit(f"{path}: missing required key '{key}'")
    if not isinstance(raw["passes"], dict) or not raw["passes"]:
        raise SystemExit(f"{path}: 'passes' must be a non-empty object")
    for key in ("default_frame_w", "default_frame_h", "default_baseline_y"):
        if key in raw:
            _positive_int(raw, key, str(path))
    required_pass_keys = (
        "source_frames",
        "source_cols",
        "source_rows",
        "target_cols",
        "target_rows",
    )
    for pass_name, pass_spec in raw["passes"].items():
        if not isinstance(pass_name, str) or not CHARACTER_NAME_RE.fullmatch(pass_name):
            raise SystemExit(f"{path}: invalid pass name '{pass_name}' (use lowercase snake_case)")
        if not isinstance(pass_spec, dict):
            raise SystemExit(f"{path}: pass '{pass_name}' must be an object")
        context = f"{path} pass '{pass_name}'"
        for key in required_pass_keys:
            _positive_int(pass_spec, key, context)
        if pass_spec["source_cols"] * pass_spec["source_rows"] < pass_spec["source_frames"]:
            raise SystemExit(
                f"{context}: source grid {pass_spec['source_cols']}×{pass_spec['source_rows']} "
                f"cannot hold {pass_spec['source_frames']} frames"
            )
        if "animation_keys" in pass_spec and not isinstance(pass_spec["animation_keys"], list):
            raise SystemExit(f"{context}: 'animation_keys' must be a list when present")


def find_aseprite() -> str | None:
    """Locate the Aseprite binary across common installs."""
    env = os.environ.get("ASEPRITE_BIN")
    if env:
        env_path = Path(env).expanduser()
        if env_path.exists():
            return str(env_path)
        found = shutil.which(env)
        return found
    for name in ("aseprite", "Aseprite", "Aseprite.AppImage"):
        found = shutil.which(name)
        if found:
            return found
    candidates = [
        Path.home() / "Applications" / "Aseprite.AppImage",
        Path.home() / "Applications" / "Aseprite" / "aseprite",
        Path("/opt/aseprite/aseprite"),
        Path("/usr/local/bin/aseprite"),
        Path("/Applications/Aseprite.app/Contents/MacOS/aseprite"),
    ]
    for c in candidates:
        if c.exists():
            return str(c)
    return None


# ---------------------------------------------------------------------------
# Pretty terminal helpers (no external deps)
# ---------------------------------------------------------------------------

USE_COLOR = sys.stdout.isatty()


def _wrap(text: str, code: str) -> str:
    if not USE_COLOR:
        return text
    return f"\033[{code}m{text}\033[0m"


def green(text: str) -> str: return _wrap(text, "32")
def red(text: str) -> str:   return _wrap(text, "31")
def yellow(text: str) -> str: return _wrap(text, "33")
def blue(text: str) -> str:  return _wrap(text, "34")
def dim(text: str) -> str:   return _wrap(text, "2")
def bold(text: str) -> str:  return _wrap(text, "1")


def header(text: str) -> None:
    print()
    print(bold(text))
    print(dim("─" * len(text)))


def relpath(p: Path) -> str:
    """Path relative to repo root for terminal output."""
    try:
        return str(p.relative_to(REPO_ROOT))
    except ValueError:
        return str(p)
