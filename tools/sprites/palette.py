"""Project palette tokens and per-character subsets.

The canonical hex values mirror design_system/colors_and_type.css. Both the
runtime-sprite compiler (make_runtime_sprite.py) and the validator
(validate_sprite.py) consume these tables.

Per-character subsets are upper bounds — a single sprite sheet may use any
prefix of its character's palette. Cross-pass discipline (Pass 1 coat color
must equal Pass 4 coat color, etc.) is enforced by snapping every pixel to
the same palette table.
"""
from __future__ import annotations

# (r, g, b) tuples; alpha is handled separately (255 opaque, 0 transparent).
RGB = tuple[int, int, int]


def _hex(s: str) -> RGB:
    s = s.lstrip("#")
    return (int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16))


# ---------------------------------------------------------------------------
# Project palette (mirrors design_system/colors_and_type.css)
# ---------------------------------------------------------------------------

PROJECT_PALETTE: dict[str, RGB] = {
    # Manuscript / paper
    "ink":           _hex("#1A1612"),
    "ink-soft":      _hex("#2B2520"),
    "damp-ash":      _hex("#6B6358"),
    "vellum-bone":   _hex("#E8DFC9"),
    "vellum-warm":   _hex("#EFE6D0"),
    "candle-white":  _hex("#F6F1E0"),
    "candle-pure":   _hex("#FBF7EB"),
    # Cold Michigan
    "lake-slate":    _hex("#5B6770"),
    "lake-deep":     _hex("#2C3540"),
    "pine-shadow":   _hex("#2A3329"),
    "rot-brown":     _hex("#4A3A26"),
    "cedar-brown":   _hex("#6B4A2C"),
    "old-ochre":     _hex("#B08A4A"),
    # Healing
    "pale-heal":     _hex("#7A8C5E"),
    "pale-heal-deep":_hex("#5A6B48"),
    "verdigris":     _hex("#6E8A7C"),
    # Earned (sparing)
    "icon-gold":     _hex("#C79A3A"),
    "icon-gold-warm":_hex("#D9B057"),
    "dragon-red":    _hex("#8A2018"),
    "ember-red":     _hex("#C63E1F"),
    "ember-glow":    _hex("#E26A3A"),
    # Wittehaven (later)
    "witte-white":   _hex("#F4F6F7"),
    "witte-blue":    _hex("#D5DEE4"),
    "witte-cool":    _hex("#8FA3B0"),
}


# ---------------------------------------------------------------------------
# Per-character subsets — upper bounds the validator enforces
# ---------------------------------------------------------------------------

KALEV_PALETTE: list[RGB] = [
    PROJECT_PALETTE[name] for name in (
        "ink",            # outline, hair, boots
        "ink-soft",       # face line
        "damp-ash",       # skin shadow, scarf mid
        "old-ochre",      # skin mid-tone (warm tan); essential for face quantization
        "vellum-bone",    # notebook page
        "vellum-warm",    # skin highlight, vial glass
        "candle-white",   # cloth highlight (Pass 2)
        "rot-brown",      # coat shadow, pouch deep
        "cedar-brown",    # coat base, pencil shaft
        "pine-shadow",    # scarf base
        "ember-red",      # tincture vial liquid (Pass 3 only, ≤4 px)
    )
]

LENA_PALETTE: list[RGB] = [
    PROJECT_PALETTE[name] for name in (
        "ink",
        "ink-soft",
        "damp-ash",
        "old-ochre",      # skin mid-tone
        "vellum-warm",
        "vellum-bone",
        "candle-white",
        "rot-brown",
        "cedar-brown",
        "pine-shadow",
        "pale-heal",
        "pale-heal-deep",
    )
]

MOTHER_PALETTE: list[RGB] = [
    PROJECT_PALETTE[name] for name in (
        "ink",
        "ink-soft",
        "damp-ash",
        "old-ochre",      # skin mid-tone
        "vellum-bone",
        "vellum-warm",
        "candle-white",
        "rot-brown",
        "cedar-brown",
    )
]

BOY_PALETTE: list[RGB] = [
    PROJECT_PALETTE[name] for name in (
        "ink",
        "ink-soft",
        "damp-ash",
        "old-ochre",      # skin mid-tone
        "vellum-warm",
        "candle-white",
        "rot-brown",
        "cedar-brown",
        "pine-shadow",
    )
]

WOLF_PALETTE: list[RGB] = [
    PROJECT_PALETTE[name] for name in (
        "ink",
        "ink-soft",
        "damp-ash",
        "vellum-bone",
        "pine-shadow",
        "rot-brown",
        "cedar-brown",
        "ember-red",      # eye-light, ≤1 px per frame, living state only
        "dragon-red",     # tongue, bite frame only, ≤3 px
    )
]

BIRDIE_PALETTE: list[RGB] = [
    PROJECT_PALETTE[name] for name in (
        "ink",
        "ink-soft",
        "damp-ash",
        "vellum-warm",
        "lake-deep",
        "pine-shadow",
        "rot-brown",
        "old-ochre",
    )
]


PALETTES: dict[str, list[RGB]] = {
    "kalev":   KALEV_PALETTE,
    "lena":    LENA_PALETTE,
    "mother":  MOTHER_PALETTE,
    "boy":     BOY_PALETTE,
    "wolf":    WOLF_PALETTE,
    "birdie":  BIRDIE_PALETTE,
    "project": list(PROJECT_PALETTE.values()),
}


def by_name(name: str) -> list[RGB]:
    """Return a palette by character or 'project' for the full set."""
    if name not in PALETTES:
        raise KeyError(f"Unknown palette '{name}'. Known: {sorted(PALETTES)}")
    return PALETTES[name]


def to_gpl(palette: list[RGB], name: str) -> str:
    """Render a palette as a GIMP .gpl file (loadable in Aseprite/LibreSprite)."""
    lines = [
        "GIMP Palette",
        f"Name: Tincture of Mercy — {name}",
        "Columns: 4",
        "#",
    ]
    # Build a reverse lookup from RGB → token name for comments
    rev = {rgb: tok for tok, rgb in PROJECT_PALETTE.items()}
    for r, g, b in palette:
        token = rev.get((r, g, b), "")
        lines.append(f"{r:>3} {g:>3} {b:>3}\t{token}")
    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    # Emit GPL files for every palette (run: python3 -m tools.sprites.palette)
    import sys
    from pathlib import Path
    out_dir = Path(__file__).parent / "palettes"
    out_dir.mkdir(parents=True, exist_ok=True)
    for name, pal in PALETTES.items():
        path = out_dir / f"{name}.gpl"
        path.write_text(to_gpl(pal, name))
        print(f"wrote {path} ({len(pal)} colors)")
