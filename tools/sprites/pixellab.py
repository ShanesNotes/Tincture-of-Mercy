"""PixelLab.ai integration for the Tincture of Mercy sprite pipeline.

Uses the v2 REST API directly via stdlib urllib. The published Python SDK
(pixellab v1.0.8) is pinned to API v1 and does not expose the character /
animation endpoints we need (create-character-v3, animate-character, etc.).
Sticking to stdlib also keeps the rest of the sprite CLI dependency-light.

Workflow
  ./sprite pixellab balance                              — verify key, show credits
  ./sprite pixellab character create <char> [<pass>]     — create v3 character from a
                                                            south-facing reference; save
                                                            character_id
  ./sprite pixellab generate <char> <pass>               — animate locked character →
                                                            full runtime sheet (2 anims ×
                                                            4 directions = 8 jobs for
                                                            locomotion); polls jobs, fetches
                                                            frames, crops to canvas, palette-
                                                            snaps, saves runtime
  ./sprite pixellab assemble <char> <pass> <frames-dir>  — local-only manual fallback
                                                            for web-UI generations

State per character: tools/sprites/pixellab_state/<character>.json.
"""
from __future__ import annotations

import base64
import io
import json
import os
import sys
import time
import urllib.error
import urllib.request
import zipfile
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from PIL import Image

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from _common import (  # noqa: E402
    TOOLS_DIR, ART_ROOT,
    load_spec, green, red, yellow, blue, dim, header, relpath,
)
from palette import by_name  # noqa: E402
import animation_catalog  # noqa: E402
import runtime_sheet  # noqa: E402
import source_intake  # noqa: E402

API_BASE = "https://api.pixellab.ai/v2"
ENV_API_KEY = "PIXELLAB_SECRET"
PIXELLAB_STATE_DIR = TOOLS_DIR / "pixellab_state"
PALETTE_DIR = TOOLS_DIR / "palettes"

# Back-compat export for callers/tests from the original scaffolding.
ANIM_TEMPLATE_BY_KEY: dict[str, tuple[str, str]] = animation_catalog.ANIM_TEMPLATE_BY_KEY


# ---------------------------------------------------------------------------
# State persistence
# ---------------------------------------------------------------------------

@dataclass
class CharacterState:
    """Minimal per-character PixelLab state. JSON-serializable.

    pending_animations[pass_name][template][direction] = job_id
        Tracks in-flight jobs so a crashed/timed-out run can be resumed without
        paying again. Cleared on successful completion of a pass.
    """
    character: str
    character_id: str
    prompt: str
    created_at: str
    canvas_w: int
    canvas_h: int
    palette: str
    last_animations: dict[str, list[str]]
    pending_animations: dict[str, dict[str, dict[str, str]]] | None = None

    @classmethod
    def load(cls, character: str) -> "CharacterState | None":
        path = PIXELLAB_STATE_DIR / f"{character}.json"
        if not path.exists():
            return None
        raw = json.loads(path.read_text())
        # Back-compat: fill in optional fields when loading older states.
        raw.setdefault("pending_animations", {})
        return cls(**raw)

    def save(self) -> Path:
        PIXELLAB_STATE_DIR.mkdir(parents=True, exist_ok=True)
        path = PIXELLAB_STATE_DIR / f"{self.character}.json"
        payload = asdict(self)
        if payload.get("pending_animations") is None:
            payload["pending_animations"] = {}
        path.write_text(json.dumps(payload, indent=2) + "\n")
        return path


# ---------------------------------------------------------------------------
# HTTP layer
# ---------------------------------------------------------------------------

def _require_key() -> str:
    key = os.environ.get(ENV_API_KEY)
    if not key:
        raise SystemExit(
            f"{ENV_API_KEY} env var not set.\n"
            "  Get a key at https://pixellab.ai/account (Apprentice plan or higher)\n"
            "  Then: export PIXELLAB_SECRET=<your-token>"
        )
    return key


def _request(method: str, path: str, *, body: dict | None = None,
              expect_json: bool = True, timeout: int = 60) -> Any:
    """Send a Bearer-auth'd request to the v2 API.

    Raises SystemExit with a friendly message on auth/quota/rate-limit errors;
    bubbles up other HTTP errors as urllib.error.HTTPError so callers can act
    on them.
    """
    key = _require_key()
    url = f"{API_BASE}{path}"
    headers = {"Authorization": f"Bearer {key}"}
    data: bytes | None = None
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            payload = resp.read()
    except urllib.error.HTTPError as exc:
        body_text = exc.read().decode("utf-8", errors="replace") if hasattr(exc, "read") else ""
        if exc.code == 401:
            raise SystemExit("PixelLab: 401 invalid API token. Check PIXELLAB_SECRET.")
        if exc.code == 402:
            raise SystemExit(f"PixelLab: 402 insufficient credits. {body_text}")
        if exc.code == 422:
            raise SystemExit(f"PixelLab: 422 validation error.\n{body_text}")
        if exc.code == 429:
            raise SystemExit("PixelLab: 429 rate limit / concurrency cap. Retry shortly.")
        if exc.code == 423:
            raise urllib.error.HTTPError(url, exc.code, "still generating", exc.headers, None)  # let caller poll
        raise SystemExit(f"PixelLab: HTTP {exc.code} on {method} {path}\n{body_text}")
    if not expect_json:
        return payload
    return json.loads(payload.decode("utf-8"))


def _post(path: str, body: dict, **kw) -> Any: return _request("POST", path, body=body, **kw)
def _get(path: str, **kw) -> Any:               return _request("GET",  path, **kw)


def _download(url: str, timeout: int = 30) -> bytes:
    """Fetch a frame URL with auth fallback.

    PixelLab's documentation describes rotation/frame URLs as public, but live
    requests have returned 403 on bare GETs. Try unauth'd first (cheap when it
    works), then retry with the API bearer token.
    """
    last_exc: Exception | None = None
    for use_auth in (False, True):
        req = urllib.request.Request(url)
        if use_auth:
            req.add_header("Authorization", f"Bearer {_require_key()}")
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read()
        except urllib.error.HTTPError as exc:
            last_exc = exc
            if exc.code in (401, 403) and not use_auth:
                continue
            raise
        except urllib.error.URLError as exc:
            last_exc = exc
            raise
    if last_exc:
        raise last_exc
    raise RuntimeError("unreachable")


def _download_zip(character_id: str, timeout: int = 90) -> bytes:
    """Fall back to GET /characters/{id}/zip — the documented public-by-id route."""
    return _request("GET", f"/characters/{character_id}/zip",
                    expect_json=False, timeout=timeout)


def _zip_group_for_template(template: str, animations: dict[str, Any]) -> str | None:
    """Return the newest ZIP animation group matching a PixelLab template name.

    The character-detail API reports animation types such as ``breathing-idle``
    and ``walking``, while the ZIP export currently stores friendly folder names
    such as ``animating-<hash>`` and ``walking-<hash>``. The ZIP metadata is
    insertion ordered, so "newest" matches the direct-URL path's last-group
    behavior.
    """
    exact = [name for name in animations if name == template or name.startswith(f"{template}-")]
    if exact:
        return exact[-1]

    if template == "breathing-idle":
        idleish = [
            name for name, directions in animations.items()
            if (
                name.startswith(("breathing", "idle", "animating-"))
                and not name.startswith("walking-")
                and any(len(frames) <= 4 for frames in directions.values())
            )
        ]
        if idleish:
            return idleish[-1]
    return None


def _frames_from_character_zip(
    *,
    character_id: str,
    plan: dict[str, Any],
    target_cols: int,
    run: source_intake.SourceIntakeRun,
) -> dict[str, dict[int, Path]]:
    """Recover animation frames from the documented character ZIP export.

    Live frame URLs can return 403 even with bearer auth. The v2 docs expose
    ``GET /characters/{id}/zip`` as the supported export route; this helper uses
    it as a non-generative recovery path and lays out files using the same
    ``<animation_key>_<column>.png`` seam as direct downloads.
    """
    zip_bytes = _download_zip(character_id, timeout=180)
    zip_path = run.raw_dir / "pixellab_character_export.zip"
    zip_path.write_bytes(zip_bytes)
    run.add_artifact("pixellab_character_zip", zip_path)

    frames_by_key: dict[str, dict[int, Path]] = {}
    selected_groups: dict[str, str] = {}
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
        metadata = json.loads(z.read("metadata.json").decode("utf-8"))
        animations = metadata.get("frames", {}).get("animations", {})

        for template, items in plan["templates"].items():
            group_name = _zip_group_for_template(template, animations)
            if not group_name:
                print(yellow(f"  ZIP fallback: no animation group for template '{template}'"))
                continue
            selected_groups[template] = group_name
            by_direction = animations.get(group_name, {})
            for item in items:
                key = item["key"]
                direction = item["direction"]
                frame_names = by_direction.get(direction) or []
                if not frame_names:
                    print(yellow(f"  ZIP fallback: no frames for {key} ({direction})"))
                    continue
                for col_index in range(target_cols):
                    src_idx = min(col_index, len(frame_names) - 1)
                    raw_path = run.raw_dir / f"{key}_{col_index}.png"
                    raw_path.write_bytes(z.read(frame_names[src_idx]))
                    frames_by_key.setdefault(key, {})[col_index] = raw_path
                    run.add_artifact(
                        "zip_frame",
                        raw_path,
                        animation_key=key,
                        column=col_index,
                        source_frame_index=src_idx,
                        template_animation_id=template,
                        zip_group=group_name,
                    )

    run.add_event(
        "zip_fallback_used",
        {
            "selected_groups": selected_groups,
            "frames": sum(len(cols) for cols in frames_by_key.values()),
        },
    )
    return frames_by_key


def _b64_image(path: Path) -> dict:
    """Encode a local PNG as the API's `Base64Image` shape."""
    return {
        "type": "base64",
        "base64": base64.b64encode(path.read_bytes()).decode("ascii"),
        "format": "png",
    }


def _wait_for_job(job_id: str, *, every: float = 5.0, timeout: float = 600.0,
                   label: str = "job") -> dict:
    """Poll /background-jobs/{id} until completed/failed. Returns the final payload."""
    deadline = time.time() + timeout
    last_print = 0.0
    while time.time() < deadline:
        try:
            j = _get(f"/background-jobs/{job_id}")
        except urllib.error.HTTPError as exc:
            if exc.code == 423:
                time.sleep(every); continue
            raise
        status = j.get("status")
        now = time.time()
        if now - last_print > every:
            print(dim(f"    [{label}] {status}…"))
            last_print = now
        if status == "completed":
            return j
        if status == "failed":
            raise SystemExit(f"PixelLab: {label} {job_id} failed: {j}")
        time.sleep(every)
    raise SystemExit(f"PixelLab: {label} {job_id} timed out after {timeout:.0f}s")


def _default_reference(character: str) -> Path | None:
    drafts = ART_ROOT / character / "_drafts"
    if not drafts.is_dir():
        return None
    candidates = [
        drafts / f"{character}_reference.png",
        *sorted(drafts.glob(f"{character}_*_idle_*.png")),
        *sorted(drafts.glob(f"{character}_v*idle*.png")),
    ]
    for c in candidates:
        if c.is_file():
            return c
    return None


# ---------------------------------------------------------------------------
# balance
# ---------------------------------------------------------------------------

def cmd_balance(args) -> int:
    header("pixellab balance")
    if not os.environ.get(ENV_API_KEY):
        print(red(f"  {ENV_API_KEY} not set"))
        print(dim("  export PIXELLAB_SECRET=<your-token>"))
        return 1
    try:
        balance = _get("/balance")
    except SystemExit as exc:
        print(red(f"  {exc}"))
        return 1
    print(green(f"  authenticated"))
    if isinstance(balance, dict):
        credits = balance.get("credits") or {}
        sub = balance.get("subscription") or {}
        if "usd" in credits:   print(f"  USD credits: ${credits['usd']}")
        if "generations" in sub:
            total = sub.get("total")
            print(f"  generations: {sub['generations']}" + (f" / {total}" if total else ""))
    return 0


# Back-compat alias — earlier scaffolding called it `status`.
cmd_status = cmd_balance


# ---------------------------------------------------------------------------
# character create
# ---------------------------------------------------------------------------

KALEV_DEFAULT_PROMPT = (
    "Kalev Ward, age 33, weathered cedar-brown coat to mid-thigh, scarf and "
    "collar mass framing the face, leather notebook in left hand, medicine "
    "pouch on right hip, practical boots, burdened shoulders, tired and grave. "
    "Hard one-pixel ink outline, no anti-aliasing, palette-pinned, transparent "
    "background. Front-facing idle pose."
)


def cmd_character_create(args) -> int:
    spec = load_spec(args.character)
    spec.get_pass(args.pass_name)
    fw = spec.frame_w(args.pass_name)
    fh = spec.frame_h(args.pass_name)

    prompt = args.prompt or (KALEV_DEFAULT_PROMPT if args.character == "kalev" else None)
    if not prompt:
        raise SystemExit(
            f"no default prompt for character '{args.character}'. "
            f"Pass --prompt to override."
        )

    reference_path = Path(args.reference).expanduser().resolve() if args.reference else _default_reference(args.character)
    if not reference_path or not reference_path.is_file():
        raise SystemExit(
            f"no reference image found for '{args.character}'. "
            f"Pass --reference <path/to/south_facing.png>. "
            f"Default search: art/characters/{args.character}/_drafts/"
        )

    with Image.open(reference_path) as ref_img:
        ref_size = ref_img.size
    if ref_size[0] > 256 or ref_size[1] > 256:
        raise SystemExit(
            f"reference image {reference_path.name} is {ref_size[0]}×{ref_size[1]}; "
            f"v3 requires ≤ 256×256. Resize first or pick a different reference."
        )

    header(f"pixellab character create  {args.character} ({fw}×{fh})")
    print(f"  reference: {relpath(reference_path)} ({ref_size[0]}×{ref_size[1]})")
    print(f"  palette:   {spec.palette}")
    prompt_hash = source_intake.prompt_provenance(prompt)["sha256"][:12]
    print(f"  prompt:    hash={prompt_hash} length={len(prompt)}")

    if args.dry_run:
        print(yellow("  --dry-run: skipping API call"))
        return 0

    template_id = getattr(args, "template_id", None) or ("dog" if args.character == "wolf" else "mannequin")

    body = {
        "description": prompt,
        "reference_image": _b64_image(reference_path),
        "image_size": {"width": fw, "height": fh},
        "view": "low top-down",
        "template_id": template_id,
        "no_background": True,
    }
    if args.seed is not None:
        body["seed"] = args.seed

    run = source_intake.begin_run(
        character=args.character,
        pass_name=args.pass_name,
        adapter="pixellab_rest",
        operation="create-character-v3",
        seed=args.seed,
        prompt=prompt,
        expected_operations=[{
            "endpoint": "/create-character-v3",
            "image_size": {"width": fw, "height": fh},
            "template_id": template_id,
            "reference": reference_path,
        }],
        root=getattr(args, "intake_root", None),
    )
    run.add_artifact("reference_image", reference_path)
    # The manifest and sanitized request fingerprint are written before the
    # paid POST; if provenance cannot be written, the POST never happens.
    run.add_request("/create-character-v3", body)

    print(dim("  POST /create-character-v3 …"))
    resp = _post("/create-character-v3", body)
    char_id = resp["character_id"]
    job_id = resp["background_job_id"]
    run.add_job("/create-character-v3", job_id, character_id=char_id)
    print(green(f"  character_id: {char_id}"))
    print(dim(f"  job_id:       {job_id}"))

    print(dim("  polling job until completion…"))
    _wait_for_job(job_id, label="character-create")

    state = CharacterState(
        character=args.character,
        character_id=char_id,
        prompt=prompt,
        created_at=datetime.now(timezone.utc).isoformat(),
        canvas_w=fw, canvas_h=fh,
        palette=spec.palette,
        last_animations={},
    )
    saved = state.save()
    print(green(f"  state saved: {relpath(saved)}"))

    rotation_count = _save_rotations(args.character, char_id)
    run.add_artifact(
        "pixellab_rotations_dir",
        ART_ROOT / args.character / "_drafts" / "pixellab_rotations",
        count=rotation_count,
    )
    run.set_status("completed", character_id=char_id, state_path=saved)
    return 0


def _save_rotations(character: str, character_id: str) -> int:
    """Pull all 8 rotation PNGs to art/characters/<char>/_drafts/pixellab_rotations/.

    Strategy: try individual rotation_urls first (cheap, fast), fall back to the
    /characters/{id}/zip endpoint if that fails. Returns count of saved frames.
    """
    rot_dir = ART_ROOT / character / "_drafts" / "pixellab_rotations"
    rot_dir.mkdir(parents=True, exist_ok=True)

    detail = _get(f"/characters/{character_id}")
    rot_urls = detail.get("rotation_urls") or {}
    saved = 0
    failed: list[str] = []
    for direction, url in rot_urls.items():
        try:
            blob = _download(url)
            (rot_dir / f"{direction}.png").write_bytes(blob)
            saved += 1
        except Exception as exc:  # noqa: BLE001
            failed.append(f"{direction} ({exc})")

    if failed and saved == 0:
        # Direct URLs all failed. Fall back to ZIP.
        print(yellow(f"  individual URL fetch failed; trying ZIP fallback"))
        try:
            zip_bytes = _download_zip(character_id)
            import zipfile
            with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
                for name in z.namelist():
                    if name.startswith("rotations/") and name.endswith(".png"):
                        direction = Path(name).stem
                        (rot_dir / f"{direction}.png").write_bytes(z.read(name))
                        saved += 1
        except Exception as exc:  # noqa: BLE001
            print(red(f"  ZIP fallback failed: {exc}"))
            for f in failed[:3]:
                print(red(f"    · {f}"))
            return 0

    if saved:
        print(green(f"  {saved} rotations saved: {relpath(rot_dir)}"))
    return saved


def cmd_character_refresh(args) -> int:
    """Re-fetch rotation PNGs for an existing character_id without re-paying."""
    state = CharacterState.load(args.character)
    if not state:
        raise SystemExit(
            f"no PixelLab character for '{args.character}'. "
            f"Run `./sprite pixellab character create {args.character}` first."
        )
    header(f"pixellab character refresh  {args.character}")
    print(f"  character_id: {state.character_id}")
    n = _save_rotations(args.character, state.character_id)
    return 0 if n > 0 else 1


def cmd_adopt_job(args) -> int:
    """Inject an orphan job_id into pending_animations so the next `generate` resumes it."""
    state = CharacterState.load(args.character)
    if not state:
        raise SystemExit(f"no PixelLab character for '{args.character}'.")
    state.pending_animations = state.pending_animations or {}
    state.pending_animations.setdefault(args.pass_name, {})
    state.pending_animations[args.pass_name].setdefault(args.template, {})
    state.pending_animations[args.pass_name][args.template][args.direction] = args.job_id
    saved = state.save()
    print(green(f"  adopted: pass={args.pass_name} template={args.template} "
                f"direction={args.direction} job={args.job_id}"))
    print(dim(f"  state: {relpath(saved)}"))
    print(dim(f"  next: ./tools/sprite pixellab generate {args.character} {args.pass_name}"))
    return 0


# ---------------------------------------------------------------------------
# generate
# ---------------------------------------------------------------------------

def cmd_generate(args) -> int:
    """Generate PixelLab animation frames and assemble through local intake seams.

    Dry-run remains entirely local: no REST, downloads, or polling. Real runs
    write a pending sanitized source-intake manifest before the first paid POST,
    then append job IDs, raw frames, normalized cells, runtime output, and
    validation evidence as the run progresses.
    """
    spec = load_spec(args.character)
    pass_spec = spec.get_pass(args.pass_name)
    fw = spec.frame_w(args.pass_name)
    fh = spec.frame_h(args.pass_name)
    keys = list(pass_spec.get("animation_keys", []))

    state = CharacterState.load(args.character)
    pending = (state.pending_animations or {}).get(args.pass_name, {}) if state else {}
    template_profile = "dog" if args.character == "wolf" else "humanoid"
    plan = animation_catalog.plan_animation_keys(keys, pending=pending, profile=template_profile)

    header(f"pixellab generate  {args.character} · {args.pass_name}")
    print(f"  animation keys: {len(keys)}")
    print(f"  supported:      {len(plan['supported'])}")
    print(f"  job count:      {plan['job_count']} ({plan['jobs_to_fire']} new)")

    if plan["unsupported"]:
        message = animation_catalog.unsupported_message(plan)
        print(red(f"  {message}"))
        raise SystemExit(message)

    if not state:
        raise SystemExit(
            f"no PixelLab character for '{args.character}'. "
            f"Run `./sprite pixellab character create {args.character}` first."
        )
    if (state.canvas_w, state.canvas_h) != (fw, fh):
        raise SystemExit(
            f"character canvas {state.canvas_w}×{state.canvas_h} doesn't match "
            f"pass canvas {fw}×{fh}"
        )

    print(f"  character_id: {state.character_id}")
    print(f"  templates:    {', '.join(plan['templates'].keys())}")
    if pending:
        n_existing = sum(len(d) for d in pending.values())
        print(yellow(f"  resuming: {n_existing} previously-fired job(s) found in state"))

    if args.dry_run:
        print(yellow("  --dry-run: skipping API calls"))
        for template, items in plan["templates"].items():
            already = pending.get(template, {})
            to_fire = [item["direction"] for item in items if item["direction"] not in already]
            print(dim(f"    would POST /animate-character template={template} "
                      f"new={to_fire}, resume={list(already)}"))
        return 0

    color_image: dict | None = None
    swatch = PALETTE_DIR / f"{spec.palette}_swatch.png"
    if swatch.is_file():
        color_image = _b64_image(swatch)
        print(dim(f"  color_image:  {relpath(swatch)}"))

    expected_operations = []
    for template, items in plan["templates"].items():
        already = pending.get(template, {})
        missing_dirs = [item["direction"] for item in items if item["direction"] not in already]
        expected_operations.append({
            "endpoint": "/animate-character",
            "template_animation_id": template,
            "directions": missing_dirs,
            "resume": list(already),
        })

    run = source_intake.begin_run(
        character=args.character,
        pass_name=args.pass_name,
        adapter="pixellab_rest",
        operation="animate-character",
        seed=getattr(args, "seed", None),
        prompt=state.prompt,
        expected_operations=expected_operations,
        root=getattr(args, "intake_root", None),
    )

    # PHASE 1 — Fire all missing animations and persist IDs immediately.
    state.pending_animations = state.pending_animations or {}
    state.pending_animations.setdefault(args.pass_name, {})

    for template, items in plan["templates"].items():
        already = state.pending_animations[args.pass_name].setdefault(template, {})
        missing_dirs = [item["direction"] for item in items if item["direction"] not in already]
        if not missing_dirs:
            print(blue(f"  [{template}] all directions already in flight; skipping fire"))
            continue
        print(blue(f"  [{template}] firing dirs={missing_dirs}"))
        body = {
            "character_id": state.character_id,
            "template_animation_id": template,
            "directions": missing_dirs,
        }
        if color_image:
            body["color_image"] = color_image
            body["force_colors"] = True
        if getattr(args, "seed", None) is not None:
            body["seed"] = args.seed

        # CRITICAL: write sanitized request provenance before the paid POST.
        run.add_request("/animate-character", body)
        resp = _post("/animate-character", body)
        job_ids = resp.get("background_job_ids") or []
        resp_dirs = resp.get("directions") or missing_dirs
        for job_id, direction in zip(job_ids, resp_dirs):
            already[direction] = job_id
            run.add_job("/animate-character", job_id, template_animation_id=template, direction=direction)
            print(dim(f"    {direction}: {job_id}"))
        # CRITICAL: persist IDs immediately so a crash before polling is recoverable.
        state.save()

    # PHASE 2 — Poll all jobs round-robin across templates × directions.
    timeout = float(getattr(args, "timeout", 600.0))
    poll_interval = float(getattr(args, "poll_interval", 5.0))
    print(dim(f"  polling {sum(len(d) for d in state.pending_animations[args.pass_name].values())} "
              f"job(s); timeout {timeout:.0f}s each"))
    poll_targets: list[tuple[str, str, str]] = []  # (template, direction, job_id)
    for template, items in plan["templates"].items():
        for item in items:
            direction = item["direction"]
            job_id = state.pending_animations[args.pass_name].get(template, {}).get(direction)
            if job_id:
                poll_targets.append((template, direction, job_id))

    deadline = time.time() + timeout
    while poll_targets and time.time() < deadline:
        for template, direction, job_id in list(poll_targets):
            try:
                j = _get(f"/background-jobs/{job_id}")
            except urllib.error.HTTPError as exc:
                if exc.code == 423:
                    continue
                raise
            status = j.get("status")
            if status == "completed":
                print(green(f"    ✓ {template}/{direction}"))
                run.add_event("job_completed", {"template": template, "direction": direction, "job_id": job_id})
                poll_targets = [t for t in poll_targets if t[2] != job_id]
            elif status == "failed":
                safe_payload = source_intake.sanitize(j)
                run.set_status("failed", failed_job={"template": template, "direction": direction, "job_id": job_id, "payload": safe_payload})
                raise SystemExit(f"PixelLab: {template}/{direction} ({job_id}) failed: {safe_payload}")
            else:
                print(dim(f"    · {template}/{direction} {status}"))
        if poll_targets:
            time.sleep(poll_interval)
    if poll_targets:
        names = ", ".join(f"{t}/{d}" for t, d, _ in poll_targets)
        run.set_status("timed_out", remaining_jobs=[{"template": t, "direction": d, "job_id": j} for t, d, j in poll_targets])
        raise SystemExit(
            f"timed out after {timeout:.0f}s with {len(poll_targets)} job(s) still running: {names}.\n"
            f"  Re-run `./sprite pixellab generate {args.character} {args.pass_name}` to resume."
        )

    # PHASE 3 — Fetch character detail, download raw frames, assemble locally.
    print(dim("  fetching character detail for frame URLs…"))
    detail = _get(f"/characters/{state.character_id}")
    anim_groups: dict[str, dict] = {}
    for group in detail.get("animations") or []:
        # Multiple animation runs of the same type may exist; prefer the most recent.
        anim_groups[group["animation_type"]] = group

    frames_by_key: dict[str, dict[int, Path]] = {}
    fetch_failures = 0
    for template, items in plan["templates"].items():
        if template not in anim_groups:
            print(yellow(f"  template '{template}' not found in character detail; skipping"))
            continue
        by_direction = {d["direction"]: d for d in anim_groups[template].get("directions", [])}
        for item in items:
            key = item["key"]
            direction = item["direction"]
            data = by_direction.get(direction)
            if not data:
                print(yellow(f"  no frames for {key}"))
                continue
            frame_urls = data.get("frames", [])
            print(dim(f"    {key}: {len(frame_urls)} frames"))
            for col_index in range(spec.target_cols(args.pass_name)):
                if not frame_urls:
                    continue
                src_idx = min(col_index, len(frame_urls) - 1)
                try:
                    blob = _download(frame_urls[src_idx])
                except Exception as exc:  # noqa: BLE001
                    fetch_failures += 1
                    print(yellow(f"    fetch failed col {col_index}: {exc}"))
                    continue
                raw_path = run.raw_dir / f"{key}_{col_index}.png"
                raw_path.write_bytes(blob)
                frames_by_key.setdefault(key, {})[col_index] = raw_path
                run.add_artifact("raw_frame", raw_path, animation_key=key, column=col_index, source_frame_index=src_idx)

    expected_frames = len(keys) * spec.target_cols(args.pass_name)
    fetched_frames = sum(len(cols) for cols in frames_by_key.values())
    if fetch_failures or fetched_frames < expected_frames:
        print(yellow(
            f"  direct frame fetch incomplete ({fetched_frames}/{expected_frames}); "
            "trying character ZIP export fallback"
        ))
        try:
            zip_frames = _frames_from_character_zip(
                character_id=state.character_id,
                plan=plan,
                target_cols=spec.target_cols(args.pass_name),
                run=run,
            )
        except Exception as exc:  # noqa: BLE001
            print(yellow(f"  ZIP fallback failed: {exc}"))
        else:
            zip_count = sum(len(cols) for cols in zip_frames.values())
            if zip_count:
                print(green(f"  ZIP fallback recovered {zip_count}/{expected_frames} frame cells"))
                frames_by_key = zip_frames

    assembly = runtime_sheet.assemble_frame_paths(
        spec=spec,
        pass_name=args.pass_name,
        frames_by_key=frames_by_key,
        output_path=spec.runtime_path(args.pass_name),
        normalized_dir=run.normalized_dir,
        validate=True,
    )
    report_path = run.write_report("assembly_report.json", assembly.to_dict())
    if assembly.validation:
        run.add_validation(assembly.validation)
    run.add_artifact("runtime_sheet", assembly.runtime_output)
    generation_ok = bool(assembly.validation and assembly.validation.ok and not assembly.missing_frames)
    run.set_status(
        "completed" if generation_ok else "validation_failed",
        runtime_output=assembly.runtime_output,
        assembly_report=report_path,
    )
    print(green(f"  runtime: {relpath(assembly.runtime_output)}"))
    if assembly.validation and not assembly.validation.ok:
        print(yellow("  validation recorded FAIL; runtime sheet is not canonical until fixed"))
        for fail in assembly.validation.failures[:6]:
            print(yellow(f"    · {fail}"))
    if assembly.missing_frames:
        print(yellow(f"  {len(assembly.missing_frames)} generated frame(s) missing; keeping pending jobs for retry"))
        for name in assembly.missing_frames[:8]:
            print(yellow(f"    · {name}"))
        if len(assembly.missing_frames) > 8:
            print(yellow(f"    · … +{len(assembly.missing_frames) - 8} more"))
        state.save()
        return 1

    # PHASE 4 — Clear pending; record completed jobs for traceability.
    finished_ids = [
        jid for d in state.pending_animations.get(args.pass_name, {}).values()
        for jid in d.values()
    ]
    state.last_animations[args.pass_name] = finished_ids
    state.pending_animations.pop(args.pass_name, None)
    state.save()
    return 0 if assembly.ok else 1


# ---------------------------------------------------------------------------
# assemble (manual fallback)
# ---------------------------------------------------------------------------

def cmd_assemble(args) -> int:
    """Lay out a folder of individual frame PNGs into the spec's grid.

    Files must be named `<animation_key>_<frame_index>.png` (e.g. `idle_down_0.png`).
    """
    spec = load_spec(args.character)
    spec.get_pass(args.pass_name)

    frames_dir = Path(args.frames_dir).expanduser().resolve()
    if not frames_dir.is_dir():
        raise SystemExit(f"frames dir not found: {frames_dir}")

    header(f"pixellab assemble  {args.character} · {args.pass_name}")
    print(f"  frames dir: {relpath(frames_dir)}")

    run = source_intake.begin_run(
        character=args.character,
        pass_name=args.pass_name,
        adapter=getattr(args, "adapter", "manual_frames"),
        operation="assemble",
        expected_operations=[{"local_frames_dir": frames_dir}],
        root=getattr(args, "intake_root", None),
    )
    run.add_artifact("frames_dir", frames_dir)

    assembly = runtime_sheet.assemble_frame_dir(
        spec=spec,
        pass_name=args.pass_name,
        frames_dir=frames_dir,
        output_path=spec.runtime_path(args.pass_name),
        normalized_dir=run.normalized_dir,
        validate=True,
    )
    report_path = run.write_report("assembly_report.json", assembly.to_dict())
    if assembly.validation:
        run.add_validation(assembly.validation)
    run.add_artifact("runtime_sheet", assembly.runtime_output)
    run.set_status(
        "completed" if assembly.ok else "validation_failed",
        runtime_output=assembly.runtime_output,
        assembly_report=report_path,
    )

    print(green(f"  runtime: {relpath(assembly.runtime_output)}"))
    if assembly.missing_frames:
        print(yellow(f"  {len(assembly.missing_frames)} frames missing (cells left transparent):"))
        for name in assembly.missing_frames[:8]:
            print(yellow(f"    · {name}"))
        if len(assembly.missing_frames) > 8:
            print(yellow(f"    · … +{len(assembly.missing_frames) - 8} more"))
    if assembly.validation and not assembly.validation.ok:
        print(yellow("  validation recorded FAIL; runtime sheet is not canonical until fixed"))
        for fail in assembly.validation.failures[:6]:
            print(yellow(f"    · {fail}"))
    return 0


# ---------------------------------------------------------------------------
# CLI argument shaping
# ---------------------------------------------------------------------------

def add_subcommand(sub) -> None:
    p = sub.add_parser("pixellab", help="PixelLab.ai integration")
    inner = p.add_subparsers(dest="action", required=True)

    inner.add_parser("balance", help="check API key + show credits/quota").set_defaults(func=cmd_balance)
    inner.add_parser("status",  help="alias of `balance`").set_defaults(func=cmd_balance)

    char = inner.add_parser("character", help="character lifecycle")
    char_sub = char.add_subparsers(dest="char_action", required=True)
    cc = char_sub.add_parser("create", help="generate v3 character + save id")
    cc.add_argument("character")
    cc.add_argument("pass_name", metavar="pass", nargs="?", default="idle_front",
                    help="pass that defines canvas size (default: idle_front)")
    cc.add_argument("--prompt", help="text prompt; defaults baked in for kalev")
    cc.add_argument("--reference", help="path to a south-facing reference PNG (≤256×256)")
    cc.add_argument(
        "--template-id",
        default=None,
        help="PixelLab body template; defaults to mannequin, or dog for wolf",
    )
    cc.add_argument("--seed", type=int, default=None)
    cc.add_argument("--dry-run", action="store_true")
    cc.set_defaults(func=cmd_character_create)

    rf = char_sub.add_parser("refresh",
                              help="re-fetch 8 rotations for an existing character_id "
                                   "(no new generations)")
    rf.add_argument("character")
    rf.set_defaults(func=cmd_character_refresh)

    aj = inner.add_parser("adopt-job",
                           help="manually inject an in-flight job_id into pending_animations "
                                "(use when the script crashed before saving)")
    aj.add_argument("character")
    aj.add_argument("pass_name", metavar="pass")
    aj.add_argument("template", help="e.g. 'breathing-idle' or 'walking'")
    aj.add_argument("direction", help="south | south-east | east | north-east | north | north-west | west | south-west")
    aj.add_argument("job_id")
    aj.set_defaults(func=cmd_adopt_job)

    gen = inner.add_parser("generate", help="animate locked character → runtime sheet")
    gen.add_argument("character")
    gen.add_argument("pass_name", metavar="pass")
    gen.add_argument("--seed", type=int, default=None)
    gen.add_argument("--timeout", type=int, default=1800,
                     help="overall poll timeout across ALL jobs in seconds (default: 1800 = 30min)")
    gen.add_argument("--poll-interval", type=float, default=10.0,
                     help="seconds between polls (default: 10)")
    gen.add_argument("--dry-run", action="store_true")
    gen.set_defaults(func=cmd_generate)

    asm = inner.add_parser("assemble", help="lay out individual frame PNGs into spec grid")
    asm.add_argument("character")
    asm.add_argument("pass_name", metavar="pass")
    asm.add_argument("frames_dir", metavar="frames-dir")
    asm.add_argument(
        "--adapter",
        default="manual_frames",
        choices=("manual_frames", "aseprite_extension", "pixellab_mcp"),
        help="source-intake adapter label for provenance (default: manual_frames)",
    )
    asm.set_defaults(func=cmd_assemble)
