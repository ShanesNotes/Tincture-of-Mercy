#!/usr/bin/env python3
"""Meshy.ai text-to-3d → optional refine → optional rig.

Reads MESHY_API_KEY at runtime from ~/.claude.json
  projects["/home/ark/gizmo"].mcpServers.meshy.env.MESHY_API_KEY
Never hardcodes or writes the key.

Cache: game/assets/src/meshy/<id>/
  provenance.json + downloaded glb/fbx. Matching settings_hash skips work.

On unreachable API / invalid key / timeout / failed task: write a fallback
provenance and exit 0 so the Blender blocking path can proceed.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

API = "https://api.meshy.ai"
CLAUDE_JSON = Path.home() / ".claude.json"
GIZMO_PROJECT = "/home/ark/gizmo"
POLL_S = 5.0

ART_CONSTRAINTS = (
    "Tincture of Mercy art direction: carved-figure silhouette, no glowing eyes, "
    "no fantasy scale inflation, restrained face, pattern-over-texture, "
    "palette-covenant materials (parchment/ironwood/oxblood), elongated adult "
    "proportions ~1:7.5 head:body when humanoid. Real-world animal anatomy when wolf."
)

DEFAULTS = {
    "wolf": {
        "prompt": (
            "A real grey wolf standing, quadruped, accurate wolf proportions, "
            "lean winter coat, no glowing eyes, no armor, no saddle, no fantasy "
            "features, clean silhouette, low-poly blocking friendly."
        ),
        "pose_mode": "",
        "height_meters": 0.75,
        "rig": False,
        "refine": False,
    },
    "kalev": {
        "prompt": (
            "Adult male apothecary standing A-pose, elongated 1:7.5 head-to-body, "
            "long hands, worn wool coat and linen, restrained face, no smile, "
            "no glowing eyes, carved-figure silhouette, folk-ironwood clothing."
        ),
        "pose_mode": "a-pose",
        "height_meters": 1.8,
        "rig": True,
        "refine": True,
    },
}


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def read_api_key() -> str:
    data = json.loads(CLAUDE_JSON.read_text())
    return data["projects"][GIZMO_PROJECT]["mcpServers"]["meshy"]["env"]["MESHY_API_KEY"]


def settings_hash(payload: dict) -> str:
    blob = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(blob).hexdigest()[:16]


def request(method: str, path: str, key: str, body: dict | None = None, timeout: int = 30):
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(
        API + path,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read()
        return json.loads(raw.decode() or "null")


def download(url: str, dest: Path, timeout: int = 120) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        dest.write_bytes(resp.read())


def write_json(path: Path, obj: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, sort_keys=True) + "\n")


def fallback(out_dir: Path, reason: str, settings: dict) -> int:
    print(f"meshy: FALLBACK — {reason}", file=sys.stderr)
    write_json(
        out_dir / "provenance.json",
        {
            "status": "fallback",
            "reason": reason,
            "settings": settings,
            "settings_hash": settings_hash(settings),
            "files": [],
            "task_ids": {},
        },
    )
    return 0


def poll(kind: str, task_id: str, key: str, timeout_s: float) -> dict:
    path = {
        "preview": f"/openapi/v2/text-to-3d/{task_id}",
        "refine": f"/openapi/v2/text-to-3d/{task_id}",
        "rig": f"/openapi/v1/rigging/{task_id}",
    }[kind]
    deadline = time.monotonic() + timeout_s
    last = {}
    while time.monotonic() < deadline:
        last = request("GET", path, key)
        status = last.get("status")
        print(f"meshy: {kind} {task_id} {status} {last.get('progress', 0)}%", file=sys.stderr)
        if status == "SUCCEEDED":
            return last
        if status in ("FAILED", "CANCELED"):
            raise RuntimeError(f"{kind} {status}: {last.get('task_error')}")
        time.sleep(POLL_S)
    raise TimeoutError(f"{kind} {task_id} still {last.get('status')} after {timeout_s}s")


def generate(asset_id: str, prompt: str, *, refine: bool, rig: bool, pose_mode: str, height_meters: float, timeout_s: float) -> int:
    root = repo_root()
    out_dir = root / "game" / "assets" / "src" / "meshy" / asset_id
    settings = {
        "id": asset_id,
        "prompt": prompt,
        "art_constraints": ART_CONSTRAINTS,
        "mode": "preview",
        "refine": refine,
        "rig": rig,
        "pose_mode": pose_mode,
        "height_meters": height_meters,
        "model_type": "lowpoly",
        "target_formats": ["glb", "fbx"],
        "ai_model": "latest",
    }
    wanted = settings_hash(settings)
    prov_path = out_dir / "provenance.json"
    if prov_path.exists():
        prev = json.loads(prov_path.read_text())
        files_ok = all((out_dir / f).is_file() for f in prev.get("files", []))
        if prev.get("settings_hash") == wanted and prev.get("status") == "ok" and files_ok:
            print(f"meshy: cache hit {out_dir}", file=sys.stderr)
            return 0

    try:
        key = read_api_key()
        if not key:
            return fallback(out_dir, "MESHY_API_KEY empty", settings)
    except (OSError, KeyError, json.JSONDecodeError) as exc:
        return fallback(out_dir, f"cannot read API key: {exc}", settings)

    full_prompt = f"{prompt} {ART_CONSTRAINTS}"[:600]
    task_ids: dict[str, str] = {}
    files: list[str] = []

    try:
        preview_body = {
            "mode": "preview",
            "prompt": full_prompt,
            "model_type": "lowpoly",
            "target_formats": ["glb", "fbx"],
            "ai_model": "latest",
        }
        if pose_mode:
            preview_body["pose_mode"] = pose_mode
        created = request("POST", "/openapi/v2/text-to-3d", key, preview_body)
        preview_id = created["result"]
        task_ids["preview"] = preview_id
        preview = poll("preview", preview_id, key, timeout_s)

        urls = preview.get("model_urls") or {}
        if urls.get("glb"):
            download(urls["glb"], out_dir / "preview.glb")
            files.append("preview.glb")
        if urls.get("fbx"):
            download(urls["fbx"], out_dir / "preview.fbx")
            files.append("preview.fbx")

        source_id = preview_id
        if refine:
            created = request(
                "POST",
                "/openapi/v2/text-to-3d",
                key,
                {
                    "mode": "refine",
                    "preview_task_id": preview_id,
                    "enable_pbr": False,
                    "target_formats": ["glb", "fbx"],
                    "ai_model": "latest",
                },
            )
            refine_id = created["result"]
            task_ids["refine"] = refine_id
            refined = poll("refine", refine_id, key, timeout_s)
            urls = refined.get("model_urls") or {}
            if urls.get("glb"):
                download(urls["glb"], out_dir / "refine.glb")
                files.append("refine.glb")
            if urls.get("fbx"):
                download(urls["fbx"], out_dir / "refine.fbx")
                files.append("refine.fbx")
            source_id = refine_id

        if rig:
            created = request(
                "POST",
                "/openapi/v1/rigging",
                key,
                {"input_task_id": source_id, "height_meters": height_meters},
            )
            rig_id = created["result"]
            task_ids["rig"] = rig_id
            rigged = poll("rig", rig_id, key, timeout_s)
            result = rigged.get("result") or {}
            # Do not download Meshy basic_animations (walk/run) — those are
            # not our clips. Only the rigged bind-pose character.
            if result.get("rigged_character_glb_url"):
                download(result["rigged_character_glb_url"], out_dir / "rigged.glb")
                files.append("rigged.glb")
            if result.get("rigged_character_fbx_url"):
                download(result["rigged_character_fbx_url"], out_dir / "rigged.fbx")
                files.append("rigged.fbx")

        write_json(
            prov_path,
            {
                "status": "ok",
                "settings": settings,
                "settings_hash": wanted,
                "task_ids": task_ids,
                "files": files,
                "prompt_sent": full_prompt,
            },
        )
        print(f"meshy: wrote {out_dir}", file=sys.stderr)
        return 0
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, RuntimeError, KeyError, OSError) as exc:
        return fallback(out_dir, str(exc), settings)


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--id", help="cache folder name (wolf, kalev, …)")
    p.add_argument("--prompt", help="generation prompt; default from built-in art-direction set")
    p.add_argument("--all", action="store_true", help="generate the pipeline-proof pair (wolf, kalev)")
    p.add_argument("--refine", action="store_true", help="run refine after preview")
    p.add_argument("--no-refine", action="store_true")
    p.add_argument("--rig", action="store_true", help="run humanoid rigging after refine/preview")
    p.add_argument("--no-rig", action="store_true")
    p.add_argument("--pose-mode", default=None, help="a-pose | t-pose | empty")
    p.add_argument("--height-meters", type=float, default=None)
    p.add_argument("--timeout", type=float, default=480.0, help="per-stage poll timeout seconds")
    args = p.parse_args(argv)

    jobs: list[tuple[str, dict]] = []
    if args.all:
        jobs = list(DEFAULTS.items())
    elif args.id:
        base = dict(DEFAULTS.get(args.id, {
            "prompt": args.prompt or args.id,
            "pose_mode": "",
            "height_meters": 1.7,
            "rig": False,
            "refine": False,
        }))
        jobs = [(args.id, base)]
    else:
        p.error("provide --id or --all")

    rc = 0
    for asset_id, spec in jobs:
        prompt = args.prompt or spec["prompt"]
        refine = spec["refine"] if not (args.refine or args.no_refine) else args.refine
        rig = spec["rig"] if not (args.rig or args.no_rig) else args.rig
        pose = spec["pose_mode"] if args.pose_mode is None else args.pose_mode
        height = spec["height_meters"] if args.height_meters is None else args.height_meters
        rc = generate(
            asset_id,
            prompt,
            refine=refine,
            rig=rig,
            pose_mode=pose,
            height_meters=height,
            timeout_s=args.timeout,
        ) or rc
    return rc


if __name__ == "__main__":
    raise SystemExit(main())
