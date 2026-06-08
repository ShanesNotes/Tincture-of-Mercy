"""Project-wide sprite health check.

For every character × pass declared in tools/sprites/specs/, report:
  - source sheet present (Y/N)
  - runtime sheet present (Y/N)
  - validation result (PASS/FAIL/MISSING)
  - aseprite working file present (Y/N)
  - last-modified timestamps

Usage (via CLI dispatcher):
  ./sprite health
"""
from __future__ import annotations

import sys
from datetime import datetime
from pathlib import Path

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from _common import (  # noqa: E402
    list_specs, load_spec,
    green, red, yellow, dim, bold, header, relpath,
)
from palette import by_name  # noqa: E402
from validate_sprite import validate_runtime_sheet  # noqa: E402


def _stamp(p: Path) -> str:
    if not p.exists():
        return "—"
    return datetime.fromtimestamp(p.stat().st_mtime).strftime("%Y-%m-%d %H:%M")


def _validate(character: str, pass_name: str) -> tuple[str, str]:
    """Run the canonical validator and classify the result."""
    spec = load_spec(character)
    runtime = spec.runtime_path(pass_name)
    if not runtime.exists():
        return ("MISSING", "—")
    try:
        report = validate_runtime_sheet(
            path=runtime,
            expected_w=spec.sheet_w(pass_name),
            expected_h=spec.sheet_h(pass_name),
            palette=by_name(spec.palette),
            frame_w=spec.frame_w(pass_name),
            frame_h=spec.frame_h(pass_name),
            baseline_y=spec.baseline_y(pass_name),
            target_cols=spec.target_cols(pass_name),
            target_rows=spec.target_rows(pass_name),
        )
    except TimeoutError:
        return ("TIMEOUT", "validator hung")
    except Exception as exc:
        return ("FAIL", f"validator error: {exc}")
    if report.ok:
        return ("PASS", f"unique colors: {report.stats.get('colors', '—')}")
    return ("FAIL", report.failures[0] if report.failures else "see ./sprite validate output")


def _status_exit_code(pass_status_counts: dict[str, int]) -> int:
    return 1 if pass_status_counts.get("FAIL", 0) or pass_status_counts.get("TIMEOUT", 0) else 0


def run() -> int:
    header("project sprite health")

    rows: list[tuple[str, str, str, str, str, str]] = []
    pass_count = 0
    pass_status_counts = {"PASS": 0, "FAIL": 0, "MISSING": 0, "TIMEOUT": 0}

    for character in list_specs():
        spec = load_spec(character)
        for pass_name in spec.passes:
            pass_count += 1
            source = spec.source_path(pass_name)
            runtime = spec.runtime_path(pass_name)
            aseprite = spec.aseprite_path(pass_name)
            status, detail = _validate(character, pass_name)
            pass_status_counts[status] = pass_status_counts.get(status, 0) + 1
            rows.append((
                f"{character}/{pass_name}",
                "Y" if source.exists() else "—",
                "Y" if runtime.exists() else "—",
                status,
                "Y" if aseprite.exists() else "—",
                detail or _stamp(runtime),
            ))

    # Render
    headers = ("character/pass", "src", "rt", "status", "asep", "note")
    widths = [max(len(h), max((len(r[i]) for r in rows), default=0)) for i, h in enumerate(headers)]
    sep = " " + dim("│") + " "
    print()
    print(sep.join(bold(h.ljust(widths[i])) for i, h in enumerate(headers)))
    print(dim(" ┼ ".join("─" * w for w in widths)))
    for r in rows:
        cells = []
        for i, val in enumerate(r):
            text = val.ljust(widths[i])
            if headers[i] == "status":
                if val == "PASS":     text = green(text)
                elif val == "FAIL":   text = red(text)
                elif val == "MISSING": text = dim(text)
                elif val == "TIMEOUT": text = yellow(text)
            cells.append(text)
        print(sep.join(cells))

    print()
    summary_parts = []
    if pass_status_counts.get("PASS"):    summary_parts.append(green(f"{pass_status_counts['PASS']} pass"))
    if pass_status_counts.get("FAIL"):    summary_parts.append(red(f"{pass_status_counts['FAIL']} fail"))
    if pass_status_counts.get("MISSING"): summary_parts.append(dim(f"{pass_status_counts['MISSING']} missing"))
    if pass_status_counts.get("TIMEOUT"): summary_parts.append(yellow(f"{pass_status_counts['TIMEOUT']} timeout"))
    print(f"{pass_count} passes total — " + ", ".join(summary_parts))
    print()
    return _status_exit_code(pass_status_counts)


if __name__ == "__main__":
    raise SystemExit(run())
