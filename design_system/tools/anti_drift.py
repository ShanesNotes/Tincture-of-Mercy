#!/usr/bin/env python3
"""
anti_drift.py — Tincture of Mercy v0.8.1 contract gate.

Scans the project tree for canon, naming, and architectural drift, and
exits non-zero if any violation is found. Designed to run as a pre-commit
hook and in CI.

Usage:
    python3 tools/anti_drift.py [--mode all|canon|tokens|p0-vocabulary|forbidden|numeric]
                                [--root .]
                                [--json]

Modes:
    all             (default) — runs every check.
    canon           — canonical name + reservation checks only.
    tokens          — Theme/CSS color-token containment check only.
    p0-vocabulary   — restricted P0 player-facing strings.
    forbidden       — alias for `p0-vocabulary` (legacy name).
    numeric         — flag raw numeric state in user-facing UI (heuristic).

Scope note:
    The `p0-vocabulary` rule is **scoped to the P0 prototype**. The strings
    it restricts (heal, buff, XP, loot, quest, enemy, etc.) are not
    universally banned from the project — they are restricted in P0
    player-facing copy because the prototype must read as care, not as
    Diablo / WoW / Stardew. Post-P0 packets (combat layer, RPG progression,
    etc.) may register sanctioned vocabulary via the allowlist.
    See `v0_8_1/canonical_locks_v0_8_1.md` §14 and §17.

Exit codes:
    0   clean.
    1   one or more violations.
    2   tool error (bad path / missing files).

Notes:
    * Only string/symbol checks. Does not type-check Godot scripts.
    * Allowlist: tools/anti_drift_allowlist.json — see schema below.
    * Designer-facing: violations include a one-line *why* and a *fix*.
    * The spec lives in v0_8_1/canonical_locks_v0_8_1.md and
      v0_8_1/errata_v0_8_to_v0_8_1.md. If a check feels wrong, the spec
      wins — update the spec first, then this script.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SCAN_EXTS = {
    ".md", ".txt", ".gd", ".cs", ".tres", ".tscn", ".gdshader",
    ".html", ".htm", ".css", ".js", ".jsx", ".ts", ".tsx",
    ".json", ".yaml", ".yml", ".toml", ".ini",
}

SKIP_DIRS = {
    ".git", "node_modules", "dist", "build", ".venv", "__pycache__",
    "ui_kits", "uploads", "assets",
    # Designer-prose v0.8 docs are read but only canon checks run on
    # them — the script differentiates by path.
}

# Files that may legitimately mention forbidden terms in *meta* contexts
# (errata, locks, anti-drift script itself, the allowlist, the README).
META_FILES_RE = re.compile(
    r"(^|/)("
    r"errata_v0_8_to_v0_8_1\.md"
    r"|canonical_locks_v0_8_1\.md"
    r"|backlog_visual_gameplay_v0_8_1\.md"
    r"|acceptance_tests_v0_8_1\.md"
    r"|godot_scaffold_start_prompt_v0_8_1\.md"
    r"|PROMPT_GODOT_SCAFFOLD_AGENT_v0_8_1\.md"
    r"|implementation_start_order_v0_8_1\.md"
    r"|INDEX\.md"
    r"|README\.md"
    r"|SKILL\.md"
    r"|tools/anti_drift\.py"
    r"|tools/anti_drift_allowlist\.json"
    r")$"
)

# Player-facing scripts/scenes are subject to forbidden-term checks.
PLAYER_FACING_DIRS = ("scenes/", "scripts/ui/", "data/captions/", "data/register_lexicons/")

# Files where IBM Plex Mono / IBMPlexMono must appear if any mono is set.
THEME_DIR_RE = re.compile(r"(^|/)themes/")


# ---------------------------------------------------------------------------
# Canonical name table
# ---------------------------------------------------------------------------

CANON_RENAMES: list[tuple[str, str, str]] = [
    # (forbidden, replacement, why)
    (r"\bnora\s+field\b",  "Nora Finch",  "Patient name is Nora Finch in v0.8.1."),
    (r"\bnora_field\b",    "nora_finch",  "Resource id is nora_finch in v0.8.1."),
    (r"\bdr_bell\b",       "dr_amos_bell","Resource id is dr_amos_bell in v0.8.1."),
    (r"\bbitterleaf\b",    "(remove)",    "Bitterleaf is not in P0."),
    (r"\bjetbrains\s*mono\b", "IBM Plex Mono",
        "Wittehaven mono font is IBM Plex Mono in v0.8.1."),
    (r"\bember[_ ]slot[_ ]?8\b", "ember_slot_16",
        "Ember lives in pouch slot 16."),
    (r"\bquest[_ ]log\b", "notebook",
        "P0: the notebook records names and outcomes — never collapse a "
        "post-P0 QuestLog into Notebook. Post-P0 quest layers must scaffold "
        "their own QuestLog autoload."),
]

# Reservation locks: terms that must not appear in P0 player-facing files.
P2_RESERVED_TERMS: list[tuple[str, str]] = [
    (r"\bIC\s*XC\s*NIKA\b", "Sacred icon glyphs are P2 / Paradise only."),
    (r"\bnarthex\b",        "Narthex composition is P2 / Paradise only."),
    (r"\bhalo(s)?\b",       "Halo motif is P2 / Paradise only."),
]

# Restricted P0 player-facing copy strings.
#
# These are restricted in P0 player-facing copy because the prototype must
# read as care, not as Diablo / WoW / Stardew. They remain available as
# developer code identifiers, and as player-facing copy in post-P0 systems
# (combat layer, RPG progression, professions, tiered crafting, quest log).
# See canonical_locks_v0_8_1.md §14 and §17.
#
# When a post-P0 packet sanctions one of these surfaces, scope an exception
# in tools/anti_drift_allowlist.json against that packet's directory.
P0_VOCABULARY_RESTRICTED: list[tuple[str, str]] = [
    (r"\bheal(ed|ing|s)?\b",     "P0: use 'tend' / 'rest' / patient name. Open for post-P0 layers."),
    (r"\bbuff(s|ed|ing)?\b",     "P0: no buffs in the prototype. Open for post-P0 RPG layer."),
    (r"\bdebuff(s|ed|ing)?\b",   "P0: no debuffs in the prototype. Open for post-P0 RPG layer."),
    (r"\bxp\b",                  "P0: no XP in the prototype. Open for post-P0 progression layer."),
    (r"\blevel\s*up\b",          "P0: no level-up. Open for post-P0 progression layer."),
    (r"\bunlock(ed|s|ing)?\b",   "P0: no unlocks in player-facing copy. Open for post-P0 progression layer."),
    (r"\bachievement(s)?\b",     "P0: no achievements. Open for post-P0 meta layer."),
    (r"\bloot\b",                "P0: no loot. Open for post-P0 loot/rarity layer."),
    (r"\bskill\s*tree\b",        "P0: no skill tree. Open for post-P0 progression layer."),
    (r"\bboss\b",                "P0: no bosses. Open for post-P0 antagonist layer."),
    (r"\benem(y|ies)\b",         "P0: the enemy is FIRST not flesh and blood. Open for post-P0 antagonist layer."),
    (r"\bquest\b",               "P0: use 'notebook' / 'beat'. Open for post-P0 quest layer with its own QuestLog autoload."),
    (r"\bobjective(s)?\b",       "P0: no objectives panel. Open for post-P0 quest layer."),
    (r"\bmorality\b",            "P0: no morality meter. Open for post-P0 reputation/alignment layer with its own surface."),
    (r"\brespawn(ed|s|ing)?\b",  "P0: no respawn. Open for post-P0 layers."),
    (r"\bcrit(s|ical)?\b",       "P0: no criticals. Open for post-P0 combat/RPG layers."),
    (r"\btier\b",                "P0: no tiers. Open for post-P0 loot/rarity layer."),
    (r"\b(legendary|epic|rare)\b", "P0: no rarity grades. Open for post-P0 loot/rarity layer."),
    (r"\bcombo(s)?\b",           "P0: no combos. Open for post-P0 combat layer."),
    (r"\bdamage\b",              "P0: no damage. Open for post-P0 combat layer."),
    (r"\bweapon(s)?\b",          "P0: no weapons. Open for post-P0 combat layer."),
    (r"\battack(s|ed|ing)?\b",   "P0: no attacks. Open for post-P0 combat layer."),
    (r"\bstat(s)?\b",            "P0: no stats label in player-facing UI. Open for post-P0 RPG layer with its own character-sheet surface."),
]

# Backwards-compat alias — the rule was previously named FORBIDDEN_PLAYER_FACING.
FORBIDDEN_PLAYER_FACING = P0_VOCABULARY_RESTRICTED

# Forbidden state numbers in player-facing UI: heuristic — match
# Pressure/Burden/Numbness lines that contain a numeric value.
NUMERIC_STATE_RE = re.compile(
    r"\b(pressure|burden|numbness)\b[^\n@]{0,40}[:=]\s*[-+]?\d", re.IGNORECASE
)
ALLOW_NUMERIC_RE = re.compile(r"@allow_numeric\b")


# ---------------------------------------------------------------------------
# Token containment (CSS / Theme colors)
# ---------------------------------------------------------------------------

HEX_COLOR_RE = re.compile(r"#[0-9A-Fa-f]{3,8}\b")
COLOR_TOKENS_FILE = "colors_and_type.css"


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class Violation:
    file: str
    line: int
    rule: str
    message: str
    fix: str
    snippet: str = ""

    def to_dict(self) -> dict:
        return {
            "file": self.file,
            "line": self.line,
            "rule": self.rule,
            "message": self.message,
            "fix": self.fix,
            "snippet": self.snippet,
        }


@dataclass
class Allowlist:
    entries: list[dict] = field(default_factory=list)

    def matches(self, v: Violation) -> bool:
        for e in self.entries:
            if e.get("rule") and e["rule"] != v.rule:
                continue
            if e.get("file") and not v.file.endswith(e["file"]):
                continue
            if e.get("contains") and e["contains"] not in v.snippet:
                continue
            return True
        return False


# ---------------------------------------------------------------------------
# File walking
# ---------------------------------------------------------------------------

def iter_files(root: Path) -> Iterable[Path]:
    for dirpath, dirnames, filenames in os.walk(root):
        # Prune skip dirs in-place.
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in filenames:
            p = Path(dirpath) / fn
            if p.suffix.lower() in SCAN_EXTS:
                yield p


def is_meta_file(rel: str) -> bool:
    return META_FILES_RE.search(rel.replace(os.sep, "/")) is not None


def is_player_facing(rel: str) -> bool:
    rel = rel.replace(os.sep, "/")
    return any(rel.startswith(d) or "/" + d in "/" + rel for d in PLAYER_FACING_DIRS)


def is_theme(rel: str) -> bool:
    return THEME_DIR_RE.search(rel.replace(os.sep, "/")) is not None


# ---------------------------------------------------------------------------
# Checks
# ---------------------------------------------------------------------------

def check_canon(rel: str, line_no: int, line: str) -> list[Violation]:
    out: list[Violation] = []
    for pat, repl, why in CANON_RENAMES:
        m = re.search(pat, line, re.IGNORECASE)
        if m:
            out.append(Violation(
                file=rel, line=line_no, rule="canon-rename",
                message=f"forbidden term: {m.group(0)!r}",
                fix=f"replace with: {repl}",
                snippet=line.strip(),
            ))
    return out


def check_p2_reservations(rel: str, line_no: int, line: str) -> list[Violation]:
    if not is_player_facing(rel):
        return []
    out: list[Violation] = []
    for pat, why in P2_RESERVED_TERMS:
        m = re.search(pat, line)
        if m:
            out.append(Violation(
                file=rel, line=line_no, rule="p2-reserved",
                message=f"P2-reserved term in player-facing file: {m.group(0)!r}",
                fix=why,
                snippet=line.strip(),
            ))
    return out


def check_p0_vocabulary(rel: str, line_no: int, line: str) -> list[Violation]:
    """Check for restricted P0 player-facing vocabulary.

    Restrictions are scoped to P0. Strings remain available for post-P0
    systems (combat, RPG progression, professions, etc.) — see
    canonical_locks_v0_8_1.md §14 and §17. Post-P0 packets register their
    sanctioned vocabulary surfaces via tools/anti_drift_allowlist.json.
    """
    if not is_player_facing(rel):
        return []
    # Skip lines that are obviously code identifiers (e.g. signal names).
    if line.lstrip().startswith(("#", "//", "/*")):
        return []
    out: list[Violation] = []
    for pat, fix in P0_VOCABULARY_RESTRICTED:
        m = re.search(pat, line, re.IGNORECASE)
        if m:
            out.append(Violation(
                file=rel, line=line_no, rule="p0-vocabulary",
                message=f"restricted P0 player-facing term: {m.group(0)!r}",
                fix=fix,
                snippet=line.strip(),
            ))
    return out


# Backwards-compat alias — older callers may import the previous name.
check_forbidden_player_facing = check_p0_vocabulary


def check_numeric_state(rel: str, line_no: int, line: str) -> list[Violation]:
    if not is_player_facing(rel):
        return []
    if ALLOW_NUMERIC_RE.search(line):
        return []
    m = NUMERIC_STATE_RE.search(line)
    if not m:
        return []
    return [Violation(
        file=rel, line=line_no, rule="numeric-state",
        message="raw Pressure/Burden/Numbness value in player-facing file",
        fix="route through RegisterLookup.tactile(...) or annotate "
            "with @allow_numeric if this is a designer comment.",
        snippet=line.strip(),
    )]


def load_color_tokens(root: Path) -> set[str]:
    p = root / COLOR_TOKENS_FILE
    if not p.exists():
        return set()
    text = p.read_text(encoding="utf-8", errors="replace")
    return {h.lower() for h in HEX_COLOR_RE.findall(text)}


def check_token_color(rel: str, line_no: int, line: str, tokens: set[str]) -> list[Violation]:
    if not is_theme(rel):
        return []
    out: list[Violation] = []
    for h in HEX_COLOR_RE.findall(line):
        if h.lower() not in tokens:
            out.append(Violation(
                file=rel, line=line_no, rule="theme-token",
                message=f"Theme color {h} not present in {COLOR_TOKENS_FILE}",
                fix="define the color in colors_and_type.css first, then "
                    "reference it from the Theme — no inventing colors here.",
                snippet=line.strip(),
            ))
    return out


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------

def scan(root: Path, mode: str) -> list[Violation]:
    tokens = load_color_tokens(root) if mode in ("all", "tokens") else set()
    violations: list[Violation] = []

    for path in iter_files(root):
        rel = str(path.relative_to(root))
        # Meta files do canon checks on themselves but not forbidden-copy.
        meta = is_meta_file(rel)
        try:
            text = path.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue

        for line_no, line in enumerate(text.splitlines(), start=1):
            if mode in ("all", "canon"):
                if not meta:
                    violations.extend(check_canon(rel, line_no, line))
                violations.extend(check_p2_reservations(rel, line_no, line))
            if mode in ("all", "p0-vocabulary", "forbidden") and not meta:
                violations.extend(check_p0_vocabulary(rel, line_no, line))
            if mode in ("all", "numeric") and not meta:
                violations.extend(check_numeric_state(rel, line_no, line))
            if mode in ("all", "tokens") and tokens:
                violations.extend(check_token_color(rel, line_no, line, tokens))

    return violations


def load_allowlist(root: Path) -> Allowlist:
    p = root / "tools" / "anti_drift_allowlist.json"
    if not p.exists():
        return Allowlist()
    try:
        raw = json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return Allowlist()
    return Allowlist(entries=raw.get("entries", []))


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description="Tincture of Mercy v0.8.1 anti-drift gate.")
    ap.add_argument("--mode", default="all",
                    choices=["all", "canon", "tokens", "p0-vocabulary", "forbidden", "numeric"])
    ap.add_argument("--root", default=".", help="Project root.")
    ap.add_argument("--json", action="store_true", help="Emit JSON report.")
    args = ap.parse_args(argv)

    root = Path(args.root).resolve()
    if not root.exists():
        print(f"anti_drift: root not found: {root}", file=sys.stderr)
        return 2

    violations = scan(root, args.mode)
    allow = load_allowlist(root)
    violations = [v for v in violations if not allow.matches(v)]

    if args.json:
        print(json.dumps({"violations": [v.to_dict() for v in violations]},
                         indent=2))
    else:
        if not violations:
            print("anti_drift: clean.")
        else:
            print(f"anti_drift: {len(violations)} violation(s).\n")
            for v in violations:
                print(f"  {v.file}:{v.line}  [{v.rule}]  {v.message}")
                print(f"      fix:  {v.fix}")
                if v.snippet:
                    print(f"      line: {v.snippet}")
                print()

    return 0 if not violations else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
