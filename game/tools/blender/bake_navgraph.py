#!/usr/bin/env python3
"""Sample walkable collision → s14 walk-graph (nodes / edges / offMeshLinks).

Usage (from game/):
  python3 tools/blender/bake_navgraph.py
  python3 tools/blender/bake_navgraph.py assets/build/levels src/data/levels
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

STEP_H = 0.35
MAX_SLOPE_DEG = 45.0
MAX_SURVIVABLE_DROP = 6.0
GRID = 1.0
CONNECT_RADIUS = 1.55  # 8-neighborhood on a 1m grid (diag = 1.414)
LANDMARK_LINK_R = 2.6
CELL = 4.0
UP_DOT = math.cos(math.radians(MAX_SLOPE_DEG))


def game_root() -> Path:
    return Path(__file__).resolve().parents[2]


def r6(x: float) -> float:
    return float(f"{float(x):.6f}")


def write_json(path: Path, obj: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, sort_keys=True) + "\n")


def load_json(path: Path):
    return json.loads(path.read_text())


def tri_normal(a, b, c):
    ux, uy, uz = b[0] - a[0], b[1] - a[1], b[2] - a[2]
    vx, vy, vz = c[0] - a[0], c[1] - a[1], c[2] - a[2]
    nx = uy * vz - uz * vy
    ny = uz * vx - ux * vz
    nz = ux * vy - uy * vx
    length = math.sqrt(nx * nx + ny * ny + nz * nz)
    if length <= 1e-12:
        return None
    return (nx / length, ny / length, nz / length)


def moller(orig, dire, a, b, c):
    eps = 1e-8
    e1 = (b[0] - a[0], b[1] - a[1], b[2] - a[2])
    e2 = (c[0] - a[0], c[1] - a[1], c[2] - a[2])
    px = dire[1] * e2[2] - dire[2] * e2[1]
    py = dire[2] * e2[0] - dire[0] * e2[2]
    pz = dire[0] * e2[1] - dire[1] * e2[0]
    det = e1[0] * px + e1[1] * py + e1[2] * pz
    if abs(det) < eps:
        return None
    inv = 1.0 / det
    tx = orig[0] - a[0]
    ty = orig[1] - a[1]
    tz = orig[2] - a[2]
    u = (tx * px + ty * py + tz * pz) * inv
    if u < 0.0 or u > 1.0:
        return None
    qx = ty * e1[2] - tz * e1[1]
    qy = tz * e1[0] - tx * e1[2]
    qz = tx * e1[1] - ty * e1[0]
    v = (dire[0] * qx + dire[1] * qy + dire[2] * qz) * inv
    if v < 0.0 or u + v > 1.0:
        return None
    t = (e2[0] * qx + e2[1] * qy + e2[2] * qz) * inv
    if t < 0.0:
        return None
    return t


class Collision:
    def __init__(self, triangles: list[tuple]):
        self.tris = triangles
        self.buckets: dict[tuple[int, int], list[int]] = {}
        for i, (a, b, c, _n, walk) in enumerate(triangles):
            xs = (a[0], b[0], c[0])
            zs = (a[2], b[2], c[2])
            x0, x1 = int(math.floor(min(xs) / CELL)), int(math.floor(max(xs) / CELL))
            z0, z1 = int(math.floor(min(zs) / CELL)), int(math.floor(max(zs) / CELL))
            for ix in range(x0, x1 + 1):
                for iz in range(z0, z1 + 1):
                    self.buckets.setdefault((ix, iz), []).append(i)
            # unused walk flag kept for filtering at query time
            _ = walk

    def candidates(self, x: float, z: float, pad: float = 0.5):
        seen: set[int] = set()
        x0 = int(math.floor((x - pad) / CELL))
        x1 = int(math.floor((x + pad) / CELL))
        z0 = int(math.floor((z - pad) / CELL))
        z1 = int(math.floor((z + pad) / CELL))
        out = []
        for ix in range(x0, x1 + 1):
            for iz in range(z0, z1 + 1):
                for idx in self.buckets.get((ix, iz), ()):
                    if idx in seen:
                        continue
                    seen.add(idx)
                    out.append(self.tris[idx])
        return out

    def ray_down(self, x: float, z: float, y0: float = 24.0, walkable_only: bool = False):
        orig = (x, y0, z)
        dire = (0.0, -1.0, 0.0)
        best_t = None
        best = None
        for a, b, c, n, walk in self.candidates(x, z, 0.75):
            if walkable_only and not walk:
                continue
            hit = moller(orig, dire, a, b, c)
            if hit is None or hit > 40.0:
                continue
            if best_t is None or hit < best_t:
                best_t = hit
                best = (y0 - hit, n, walk)
        return best

    def segment_blocked(self, p0, p1) -> bool:
        """True if a mid-capsule XZ segment hits a non-walkable triangle."""
        dx, dy, dz = p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]
        length = math.sqrt(dx * dx + dy * dy + dz * dz)
        if length < 1e-6:
            return False
        dire = (dx / length, dy / length, dz / length)
        samples = (
            (p0[0], p0[2]),
            (p1[0], p1[2]),
            ((p0[0] + p1[0]) * 0.5, (p0[2] + p1[2]) * 0.5),
        )
        seen: set[int] = set()
        for sx, sz in samples:
            for a, b, c, n, walk in self.candidates(sx, sz, 1.6):
                idx = id(a)
                if idx in seen:
                    continue
                seen.add(idx)
                if walk:
                    continue
                # Only treat near-vertical faces as walls.
                if n[1] > 0.35:
                    continue
                hit = moller(p0, dire, a, b, c)
                if hit is None:
                    continue
                if 0.05 < hit < length - 0.05:
                    return True
        return False


def load_collision(build: Path, manifest: dict) -> Collision:
    tris = []
    for zone, meta in manifest["zones"].items():
        payload = load_json(build / meta["collision"])
        verts = payload["vertices"]
        for i0, i1, i2 in payload["triangles"]:
            a, b, c = verts[i0], verts[i1], verts[i2]
            n = tri_normal(a, b, c)
            if n is None:
                continue
            # Flip downward faces so the walkable test is stable.
            if n[1] < 0:
                a, c = c, a
                n = (-n[0], -n[1], -n[2])
            walk = n[1] >= UP_DOT
            tris.append((tuple(a), tuple(b), tuple(c), n, walk))
        _ = zone
    return Collision(tris)


def nav_by_id(placements: dict) -> dict[str, dict]:
    return {row["id"]: row for row in placements.get("nav", [])}


def sample_grid(world: Collision, bounds: dict) -> dict[tuple[int, int], tuple[float, float, float]]:
    minx = math.floor(bounds["min"][0] / GRID)
    maxx = math.ceil(bounds["max"][0] / GRID)
    minz = math.floor(bounds["min"][2] / GRID)
    maxz = math.ceil(bounds["max"][2] / GRID)
    hits: dict[tuple[int, int], tuple[float, float, float]] = {}
    for ix in range(minx, maxx + 1):
        for iz in range(minz, maxz + 1):
            x = ix * GRID
            z = iz * GRID
            hit = world.ray_down(x, z, walkable_only=True)
            if hit is None:
                continue
            y, _n, _walk = hit
            hits[(ix, iz)] = (r6(x), r6(y), r6(z))
    return hits


def union_bounds(manifest: dict) -> dict:
    mins = [math.inf, math.inf, math.inf]
    maxs = [-math.inf, -math.inf, -math.inf]
    for meta in manifest["zones"].values():
        b = meta["bounds"]
        for i in range(3):
            mins[i] = min(mins[i], b["min"][i])
            maxs[i] = max(maxs[i], b["max"][i])
    return {"min": mins, "max": maxs}


def can_step(a, b) -> bool:
    dx = b[0] - a[0]
    dy = b[1] - a[1]
    dz = b[2] - a[2]
    horiz = math.hypot(dx, dz)
    if horiz < 1e-6:
        return abs(dy) <= 1e-4
    if abs(dy) > STEP_H + 1e-6:
        return False
    slope = math.degrees(math.atan2(abs(dy), horiz))
    return slope <= MAX_SLOPE_DEG + 1e-6


def main() -> int:
    args = [a for a in sys.argv[1:] if a != "--"]
    root = game_root()
    build = Path(args[0]).resolve() if args else (root / "assets/build/levels")
    data = Path(args[1]).resolve() if len(args) > 1 else (root / "src/data/levels")
    manifest_path = build / "manifest.json"
    if not manifest_path.is_file():
        print(f"missing {manifest_path}; run export_level.py first", file=sys.stderr)
        return 2

    manifest = load_json(manifest_path)
    placements = load_json(build / manifest["placements"])
    world = load_collision(build, manifest)
    bounds = union_bounds(manifest)
    grid = sample_grid(world, bounds)

    nodes: list[dict] = []
    by_id: dict[str, dict] = {}

    def add_node(nid: str, x: float, y: float, z: float) -> None:
        if nid in by_id:
            return
        rec = {"id": nid, "x": r6(x), "y": r6(y), "z": r6(z)}
        by_id[nid] = rec
        nodes.append(rec)

    for (ix, iz), (x, y, z) in sorted(grid.items()):
        add_node(f"s{ix}_{iz}", x, y, z)

    nav = nav_by_id(placements)

    def place_named(empty_id: str, node_id: str) -> None:
        rec = nav.get(empty_id)
        if rec is None:
            raise RuntimeError(f"missing placement {empty_id}")
        p = rec["position"]
        add_node(node_id, p[0], p[1], p[2])

    place_named("nav.cabin", "cabin")
    place_named("nav.yard", "yard")
    place_named("nav.forest", "forest")
    place_named("nav.arena", "arena")
    place_named("nav.drop.top", "drop_top")
    place_named("nav.drop.bottom", "drop_bottom")
    place_named("nav.gate.a", "gate_a")
    place_named("nav.gate.b", "gate_b")
    for rec in placements.get("nav", []):
        if rec["kind"] == "nav_anchor":
            lid = str(rec.get("landmark", rec["id"].split(".")[-1]))
            add_node(f"anchor_{lid}", rec["position"][0], rec["position"][1], rec["position"][2])

    drop_dy = by_id["drop_top"]["y"] - by_id["drop_bottom"]["y"]
    if not (2.5 - 1e-3 <= drop_dy <= 3.0 + 1e-3):
        raise RuntimeError(f"LOOP_A drop is {drop_dy:.3f}m; expected 2.5–3.0")
    if drop_dy >= MAX_SURVIVABLE_DROP:
        raise RuntimeError(f"LOOP_A drop {drop_dy:.3f}m is not survivable")

    edges: list[dict] = []
    seen_edges: set[tuple[str, str]] = set()

    def add_edge(frm: str, to: str, bidirectional: bool = True, conditional: bool | None = None) -> None:
        a, b = (frm, to) if frm <= to else (to, frm)
        key = (a, b, bidirectional, bool(conditional))
        if key in seen_edges:
            return
        if frm == to:
            return
        seen_edges.add(key)
        rec: dict = {"from": frm, "to": to}
        if not bidirectional:
            rec["bidirectional"] = False
        if conditional:
            rec["conditional"] = True
        edges.append(rec)

    # 8-neighborhood among grid samples.
    offsets = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]
    for (ix, iz), pa in grid.items():
        ia = f"s{ix}_{iz}"
        for dx, dz in offsets:
            jx, jz = ix + dx, iz + dz
            pb = grid.get((jx, jz))
            if pb is None:
                continue
            ib = f"s{jx}_{jz}"
            if ia >= ib:
                continue
            if not can_step(pa, pb):
                continue
            mid_y = (pa[1] + pb[1]) * 0.5 + 0.9
            p0 = (pa[0], mid_y, pa[2])
            p1 = (pb[0], mid_y, pb[2])
            if world.segment_blocked(p0, p1):
                continue
            add_edge(ia, ib)

    # Link authored landmarks / anchors onto nearby samples of similar height.
    named = [n for n in nodes if not n["id"].startswith("s")]
    samples = [n for n in nodes if n["id"].startswith("s")]
    for node in named:
        origin = (node["x"], node["y"], node["z"])
        nearby = []
        for other in samples:
            dx = other["x"] - origin[0]
            dy = other["y"] - origin[1]
            dz = other["z"] - origin[2]
            horiz = math.hypot(dx, dz)
            if horiz > LANDMARK_LINK_R:
                continue
            if abs(dy) > STEP_H + 0.05:
                continue
            if not can_step(origin, (other["x"], other["y"], other["z"])):
                continue
            mid = (origin[0], origin[1] + 0.9, origin[2])
            dest = (other["x"], other["y"] + 0.9, other["z"])
            if world.segment_blocked(mid, dest):
                continue
            nearby.append((horiz, other["id"]))
        nearby.sort()
        for _d, oid in nearby[:4]:
            add_edge(node["id"], oid)

    # Gate is a closed collider; the only crossing is the flagged shortcut.
    add_edge("gate_a", "gate_b", bidirectional=True, conditional=True)

    off = [{"from": "drop_top", "to": "drop_bottom", "kind": "drop"}]

    nodes.sort(key=lambda n: n["id"])
    edges.sort(key=lambda e: (e["from"], e["to"], e.get("conditional", False)))
    graph = {
        "edges": edges,
        "nodes": nodes,
        "offMeshLinks": off,
    }

    write_json(build / "ironwood_nav.json", graph)
    write_json(data / "ironwood_nav.json", graph)

    manifest["nav"] = "ironwood_nav.json"
    write_json(build / "manifest.json", manifest)
    write_json(data / "ironwood_manifest.json", manifest)
    write_json(data / "ironwood_placements.json", placements)

    print(f"nav nodes={len(nodes)} edges={len(edges)} offMesh={len(off)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
