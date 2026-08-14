#!/usr/bin/env python3
"""CI gate: sidecar tick counts must match frame_data_v0.json.

Exit 0 on match, non-zero on drift. Usage:
  python3 game/tools/blender/check_sidecar.py game/assets/build
"""

from __future__ import annotations

import json
import sys
from pathlib import Path


def load_table(path: Path) -> dict:
    return json.loads(path.read_text())


def is_sidecar(obj: object) -> bool:
    return isinstance(obj, dict) and obj.get("schema") == "tincture.sidecar.v0" and "clip" in obj


def check_one(path: Path, moves: dict) -> list[str]:
    errors: list[str] = []
    obj = json.loads(path.read_text())
    if not is_sidecar(obj):
        return errors
    clip = obj["clip"]
    if clip not in moves:
        errors.append(f"{path.name}: unknown clip {clip!r} (not in frame_data_v0.json)")
        return errors
    row = moves[clip]
    want = int(row["ticks"])
    got = int(obj["ticks"])
    if got != want:
        errors.append(f"{path.name}: ticks {got} != table {want} ({clip})")
    if "startup" in row and "active" in row and "recovery" in row:
        summed = int(row["startup"]) + int(row["active"]) + int(row["recovery"])
        if summed != want:
            errors.append(f"frame_data_v0.json {clip}: ticks {want} != startup+active+recovery {summed}")
        events = {(int(e["tick"]), e["type"]) for e in obj.get("events", [])}
        on_t = int(row["startup"])
        off_t = int(row["startup"]) + int(row["active"])
        if (on_t, "hitbox_on") not in events:
            errors.append(f"{path.name}: missing hitbox_on @{on_t}")
        if (off_t, "hitbox_off") not in events:
            errors.append(f"{path.name}: missing hitbox_off @{off_t}")
    if clip == "guard":
        events = {(int(e["tick"]), e["type"]) for e in obj.get("events", [])}
        if (0, "guard_enter") not in events:
            errors.append(f"{path.name}: missing guard_enter @0")
        hold_t = int(row["enter"])
        exit_t = int(row["enter"]) + int(row["hold"])
        if (hold_t, "guard_hold") not in events:
            errors.append(f"{path.name}: missing guard_hold @{hold_t}")
        if (exit_t, "guard_exit") not in events:
            errors.append(f"{path.name}: missing guard_exit @{exit_t}")
        phase_sum = int(row["enter"]) + int(row["hold"]) + int(row["exit"])
        if phase_sum != want:
            errors.append(f"frame_data_v0.json guard: ticks {want} != enter+hold+exit {phase_sum}")
    if clip == "roll" and "iframes" in row:
        events = {(int(e["tick"]), e["type"]) for e in obj.get("events", [])}
        lo, hi = row["iframes"]
        if (int(lo), "iframe_on") not in events:
            errors.append(f"{path.name}: missing iframe_on @{lo}")
        if (int(hi) + 1, "iframe_off") not in events:
            errors.append(f"{path.name}: missing iframe_off @{int(hi)+1}")
    n = got
    if len(obj.get("rootXZ", [])) != n:
        errors.append(f"{path.name}: rootXZ length {len(obj.get('rootXZ', []))} != {n}")
    sockets = obj.get("sockets") or {}
    for name in ("weaponBase", "weaponTip"):
        if name not in sockets:
            errors.append(f"{path.name}: missing sockets.{name}")
        elif len(sockets[name]) != n:
            errors.append(f"{path.name}: sockets.{name} length {len(sockets[name])} != {n}")
    if len(obj.get("hurtboxes", [])) != n:
        errors.append(f"{path.name}: hurtboxes length {len(obj.get('hurtboxes', []))} != {n}")
    if len(obj.get("footContacts", [])) != n:
        errors.append(f"{path.name}: footContacts length {len(obj.get('footContacts', []))} != {n}")
    for e in obj.get("events", []):
        t = int(e["tick"])
        if t < 0 or t >= n:
            errors.append(f"{path.name}: event tick {t} out of range [0,{n})")
    return errors


def main(argv: list[str] | None = None) -> int:
    argv = list(sys.argv[1:] if argv is None else argv)
    if not argv:
        print("usage: check_sidecar.py <build_dir>", file=sys.stderr)
        return 2
    build = Path(argv[0])
    table_path = Path(__file__).resolve().parent / "frame_data_v0.json"
    table = load_table(table_path)
    moves = table["moves"]
    errors: list[str] = []
    sidecars = []
    for path in sorted(build.glob("*.json")):
        try:
            obj = json.loads(path.read_text())
        except json.JSONDecodeError as exc:
            errors.append(f"{path.name}: invalid JSON ({exc})")
            continue
        if is_sidecar(obj):
            sidecars.append(path)
            errors.extend(check_one(path, moves))
    if len(sidecars) < 10:
        errors.append(f"expected >= 10 clip sidecars, found {len(sidecars)}")
    if errors:
        print("SIDECAR DRIFT", file=sys.stderr)
        for line in errors:
            print(f"  {line}", file=sys.stderr)
        return 1
    print(f"ok: {len(sidecars)} sidecars match frame_data_v0.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
