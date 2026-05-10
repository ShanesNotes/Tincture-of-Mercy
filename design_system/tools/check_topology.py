#!/usr/bin/env python3
"""
check_topology.py — Godot topology drift gate for Tincture of Mercy v0.8.1.

This gate is deliberately narrower than anti_drift.py. It checks live scaffold
contracts for stale path/name topology after the Godot C# topology cleanup.
History/provenance docs are excluded by default.

Usage:
    python3 design_system/tools/check_topology.py [--root .] [--json]
    python3 design_system/tools/check_topology.py --include-history

Exit codes:
    0 clean
    1 topology violations found
    2 tool/config error
"""

from __future__ import annotations

import argparse
import fnmatch
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

SCAN_EXTS = {".md", ".txt", ".html", ".htm"}
ALLOWED_SECTION_WORDS = (
    "rejected",
    "alternative",
    "history",
    "migration note",
    "deprecated",
)
DISALLOWED_LIVE_SECTION_WORDS = (
    "acceptance criteria",
    "implementation steps",
    "scaffold",
    "asset manifest",
    "canonical topology",
    "required files",
    "folder structure",
    "project structure",
)


@dataclass(frozen=True)
class Rule:
    name: str
    pattern: re.Pattern[str]
    message: str
    fix: str


@dataclass
class Violation:
    file: str
    line: int
    rule: str
    message: str
    fix: str
    snippet: str

    def to_dict(self) -> dict[str, object]:
        return {
            "file": self.file,
            "line": self.line,
            "rule": self.rule,
            "message": self.message,
            "fix": self.fix,
            "snippet": self.snippet,
        }


RULES: tuple[Rule, ...] = (
    Rule(
        "stale-scene-path",
        re.compile(r"(?:res://)?\bscenes/world/(?:cabin|ironwood_road|bethany)(?:_clinic)?\.tscn|\bscenes/world/"),
        "stale world scene path",
        "use scenes/cabin/cabin.tscn, scenes/ironwood_road/ironwood_road.tscn, or scenes/bethany/bethany.tscn",
    ),
    Rule(
        "stale-script-bucket",
        re.compile(r"\bscripts/world/"),
        "stale world script bucket",
        "put scene-specific C# beside its .tscn; put reusable/global code under scripts/autoloads, scripts/resources, or scripts/components",
    ),
    Rule(
        "stale-ui-scene",
        re.compile(r"(?<!kalev_)state_overlay\.tscn|dialogue_band\.tscn|consequence_summary\.tscn"),
        "stale P0 UI scene file name",
        "use kalev_state_overlay.tscn, dialogue_box.tscn, or manuscript_intercut.tscn",
    ),
    Rule(
        "stale-caption-path",
        re.compile(r"\b(?:res://)?data/captions/"),
        "stale caption folder path",
        "use the single table data/captions.tres",
    ),
    Rule(
        "stale-tincture-ingredient-path",
        re.compile(r"\b(?:res://)?data/tincture/ingredient_[a-z0-9_]+\.tres"),
        "stale tincture ingredient resource path",
        "use data/ingredients/*.tres; reserve data/tincture/ for wheel_axes.tres and tincture-system resources",
    ),
    Rule(
        "stale-feature-root",
        re.compile(r"\b(?:res://)?features/[a-z0-9_./-]+"),
        "feature-sliced root promoted into live contract",
        "use conventional Godot roots: scenes/, scripts/, data/, art/, audio/, themes/",
    ),
    Rule(
        "stale-theme-name",
        re.compile(r"\b(?:ironwood_theme|wittehaven_theme|paradise_theme)\.tres"),
        "stale theme file naming",
        "use theme_ironwood.tres, theme_wittehaven.tres, and theme_paradise.tres",
    ),
    Rule(
        "stale-audio-root",
        re.compile(r"\baudio/ambience/"),
        "stale audio ambience root",
        "use audio/bed/ for ambient bed assets",
    ),
    Rule(
        "stale-tool-root",
        re.compile(r"(?<![\w./-])tools/(?:anti_drift|check_topology|anti_drift_allowlist|topology_allowlist)(?:\.py|\.json)?"),
        "stale root tools path",
        "use design_system/tools/... from the project root, or ../tools/... from design_system/v0_8_1 docs",
    ),
)


def default_root() -> Path:
    return Path(__file__).resolve().parents[2]


def rel_for(root: Path, path: Path) -> str:
    return path.relative_to(root).as_posix()


def iter_live_files(root: Path) -> Iterable[Path]:
    readme = root / "README.md"
    if readme.exists():
        yield readme
    v081 = root / "design_system" / "v0_8_1"
    if v081.exists():
        for path in sorted(v081.rglob("*")):
            if path.is_file() and path.suffix.lower() in SCAN_EXTS:
                yield path


def iter_history_files(root: Path) -> Iterable[Path]:
    lore = root / "docs" / "lore"
    if lore.exists():
        for path in sorted(lore.rglob("*")):
            if path.is_file() and path.suffix.lower() in SCAN_EXTS:
                yield path


def load_allowlist(root: Path) -> list[dict[str, object]]:
    path = root / "design_system" / "tools" / "topology_allowlist.json"
    if not path.exists():
        return []
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # malformed allowlist should fail as tool error
        raise ValueError(f"invalid allowlist JSON: {path}: {exc}") from exc
    entries = raw.get("entries", [])
    if not isinstance(entries, list):
        raise ValueError(f"invalid allowlist schema: {path}: entries must be a list")
    for i, entry in enumerate(entries):
        if not isinstance(entry, dict):
            raise ValueError(f"invalid allowlist entry {i}: must be object")
        for required in ("rule", "file", "why", "owner"):
            if not entry.get(required):
                raise ValueError(f"invalid allowlist entry {i}: missing {required!r}")
    return entries


def allowlist_matches(entries: list[dict[str, object]], violation: Violation) -> bool:
    for entry in entries:
        if entry.get("rule") != violation.rule:
            continue
        file_pat = str(entry.get("file", ""))
        if not (fnmatch.fnmatch(violation.file, file_pat) or violation.file.endswith(file_pat)):
            continue
        contains = entry.get("contains")
        if contains and str(contains) not in violation.snippet:
            continue
        return True
    return False


def heading_for_line(current_heading: str, line: str) -> str:
    if line.lstrip().startswith("#"):
        return line.lstrip("#").strip().lower()
    return current_heading


def section_allows_stale(heading: str) -> bool:
    h = heading.lower()
    if any(word in h for word in DISALLOWED_LIVE_SECTION_WORDS):
        return False
    return any(word in h for word in ALLOWED_SECTION_WORDS)


def scan_file(root: Path, path: Path, allowlist: list[dict[str, object]], *, history_is_strict: bool) -> list[Violation]:
    rel = rel_for(root, path)
    if rel.startswith(("_archive/", ".omx/")):
        return []
    is_history = rel.startswith("docs/lore/")
    if is_history and not history_is_strict:
        return []

    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except OSError as exc:
        raise ValueError(f"could not read {rel}: {exc}") from exc

    violations: list[Violation] = []
    heading = ""
    for line_no, line in enumerate(text.splitlines(), start=1):
        heading = heading_for_line(heading, line)
        if section_allows_stale(heading):
            continue
        for rule in RULES:
            match = rule.pattern.search(line)
            if not match:
                continue
            snippet = line.strip()
            message = f"{rule.message}: {match.group(0)}"
            violation = Violation(rel, line_no, rule.name, message, rule.fix, snippet)
            if not allowlist_matches(allowlist, violation):
                violations.append(violation)
    return violations


def scan(root: Path, *, include_history: bool, strict_history: bool) -> list[Violation]:
    allowlist = load_allowlist(root)
    files = list(iter_live_files(root))
    if include_history or strict_history:
        files.extend(iter_history_files(root))
    violations: list[Violation] = []
    for path in files:
        violations.extend(scan_file(root, path, allowlist, history_is_strict=strict_history))
    return violations


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Tincture of Mercy topology drift gate.")
    parser.add_argument("--root", default=None, help="Repository root. Defaults to this script's repo root.")
    parser.add_argument("--json", action="store_true", help="Emit JSON report.")
    parser.add_argument("--include-history", action="store_true", help="Include docs/lore in the scan; non-strict unless --strict-history is also set.")
    parser.add_argument("--strict-history", action="store_true", help="Fail on stale topology in docs/lore too.")
    args = parser.parse_args(argv)

    root = Path(args.root).resolve() if args.root else default_root()
    if not root.exists():
        print(f"check_topology: root not found: {root}", file=sys.stderr)
        return 2
    if not (root / "README.md").exists() or not (root / "design_system" / "v0_8_1").exists():
        print(f"check_topology: root does not look like this repository: {root}", file=sys.stderr)
        return 2

    try:
        violations = scan(root, include_history=args.include_history, strict_history=args.strict_history)
    except ValueError as exc:
        print(f"check_topology: {exc}", file=sys.stderr)
        return 2

    if args.json:
        print(json.dumps({"violations": [v.to_dict() for v in violations]}, indent=2))
    elif not violations:
        print("check_topology: clean.")
    else:
        print(f"check_topology: {len(violations)} violation(s).\n")
        for v in violations:
            print(f"  {v.file}:{v.line}  [{v.rule}]  {v.message}")
            print(f"      fix:  {v.fix}")
            print(f"      line: {v.snippet}")
            print()
    return 0 if not violations else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
