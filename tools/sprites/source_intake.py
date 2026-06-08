"""Sanitized source-intake provenance for sprite-generation inputs.

A source-intake run records where non-canonical art came from before it becomes
runtime art. It is intentionally local and offline-testable: no bearer tokens,
request headers, raw base64 payloads, or private frame URLs are persisted.
"""
from __future__ import annotations

import hashlib
import json
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_HERE = Path(__file__).resolve().parent
import sys
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))

from _common import ART_ROOT, REPO_ROOT, relpath  # noqa: E402

MANIFEST_VERSION = 1
PROMPT_POLICY_HASH_ONLY = "hash_only"
REDACTED = "<redacted>"

_SECRET_KEY_PARTS = (
    "authorization",
    "auth",
    "bearer",
    "token",
    "secret",
    "api_key",
    "apikey",
    "password",
    "header",
)
_IMAGE_PAYLOAD_KEYS = {
    "base64",
    "reference_image",
    "color_image",
    "image",
    "image_data",
}
_PROMPT_TEXT_KEYS = {
    "prompt",
    "description",
    "text_prompt",
    "negative_prompt",
}
_PRIVATE_URL_KEYS = {
    "url",
    "urls",
    "frame_url",
    "frame_urls",
    "rotation_url",
    "rotation_urls",
    "download_url",
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_run_id(adapter: str, operation: str | None = None) -> str:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    suffix = uuid.uuid4().hex[:8]
    op = (operation or "run").replace("/", "-").replace("_", "-")
    return f"{stamp}-{adapter}-{op}-{suffix}"


def intake_root(character: str, root: Path | str | None = None) -> Path:
    if root is not None:
        return Path(root).expanduser().resolve()
    return ART_ROOT / character / "_drafts" / "source_intake"


def _path_string(path: Path | str) -> str:
    p = Path(path)
    try:
        return relpath(p.resolve())
    except Exception:  # noqa: BLE001 - best-effort path display only
        return str(path)


def _looks_sensitive_string(value: str) -> bool:
    lower = value.lower()
    return (
        lower.startswith("bearer ")
        or "pixellab_secret" in lower
        or "authorization:" in lower
        or "api-key" in lower
    )


def sanitize(value: Any, *, key: str | None = None) -> Any:
    """Return a JSON-safe, provenance-safe copy of ``value``.

    The sanitizer is intentionally conservative. It keeps structural request
    intent (template IDs, directions, canvas sizes, seeds) while redacting tokens,
    headers, base64 images, and remote URLs that may be bearer-gated.
    """
    key_l = (key or "").lower()
    if any(part in key_l for part in _SECRET_KEY_PARTS):
        return REDACTED
    if key_l in _IMAGE_PAYLOAD_KEYS:
        return REDACTED
    if key_l in _PROMPT_TEXT_KEYS:
        if isinstance(value, dict) and {"policy", "sha256"}.issubset(value):
            return {str(k): sanitize(v) for k, v in sorted(value.items(), key=lambda kv: str(kv[0]))}
        if isinstance(value, str):
            return prompt_provenance(value)
        return REDACTED
    if key_l in _PRIVATE_URL_KEYS:
        return REDACTED
    if isinstance(value, Path):
        return _path_string(value)
    if isinstance(value, dict):
        return {str(k): sanitize(v, key=str(k)) for k, v in sorted(value.items(), key=lambda kv: str(kv[0]))}
    if isinstance(value, (list, tuple, set)):
        return [sanitize(v, key=key) for v in value]
    if isinstance(value, str):
        if _looks_sensitive_string(value):
            return REDACTED
        # Long base64 payloads are not useful in manifests and can embed source art.
        if len(value) > 240 and all(c.isalnum() or c in "+/=" for c in value[:240]):
            return REDACTED
        return value
    if value is None or isinstance(value, (bool, int, float)):
        return value
    return repr(value)


def stable_json(value: Any) -> str:
    return json.dumps(sanitize(value), sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def request_fingerprint(request_body: Any) -> str:
    return sha256_text(stable_json(request_body))


def prompt_provenance(prompt: str | None, policy: str = PROMPT_POLICY_HASH_ONLY) -> dict[str, Any] | None:
    if prompt is None:
        return None
    if policy != PROMPT_POLICY_HASH_ONLY:
        raise ValueError(f"unsupported prompt provenance policy: {policy}")
    return {
        "policy": PROMPT_POLICY_HASH_ONLY,
        "sha256": sha256_text(prompt),
        "length": len(prompt),
    }


def validation_to_dict(report: Any) -> dict[str, Any]:
    return {
        "ok": bool(getattr(report, "ok", False)),
        "path": _path_string(getattr(report, "path", "")),
        "notes": list(getattr(report, "notes", [])),
        "failures": list(getattr(report, "failures", [])),
        "stats": sanitize(getattr(report, "stats", {})),
    }


@dataclass
class SourceIntakeRun:
    """Mutable handle around a source-intake manifest.json."""

    run_dir: Path
    manifest: dict[str, Any]

    @property
    def manifest_path(self) -> Path:
        return self.run_dir / "manifest.json"

    @property
    def raw_dir(self) -> Path:
        return self.run_dir / "raw"

    @property
    def normalized_dir(self) -> Path:
        return self.run_dir / "normalized"

    @property
    def reports_dir(self) -> Path:
        return self.run_dir / "reports"

    def write(self) -> Path:
        self.run_dir.mkdir(parents=True, exist_ok=True)
        self.raw_dir.mkdir(parents=True, exist_ok=True)
        self.normalized_dir.mkdir(parents=True, exist_ok=True)
        self.reports_dir.mkdir(parents=True, exist_ok=True)
        self.manifest["updated_at"] = utc_now()
        safe = sanitize(self.manifest)
        self.manifest_path.write_text(json.dumps(safe, indent=2, sort_keys=True) + "\n")
        return self.manifest_path

    def set_status(self, status: str, **fields: Any) -> Path:
        self.manifest["status"] = status
        for key, value in fields.items():
            self.manifest[key] = sanitize(value)
        return self.write()

    def add_event(self, kind: str, details: dict[str, Any] | None = None) -> Path:
        self.manifest.setdefault("events", []).append({
            "at": utc_now(),
            "kind": kind,
            "details": sanitize(details or {}),
        })
        return self.write()

    def add_request(self, endpoint: str, body: dict[str, Any]) -> Path:
        request_record = {
            "at": utc_now(),
            "endpoint": endpoint,
            "fingerprint": request_fingerprint(body),
            "body": sanitize(body),
        }
        self.manifest.setdefault("requests", []).append(request_record)
        return self.write()

    def add_job(self, endpoint: str, job_id: str, **details: Any) -> Path:
        self.manifest.setdefault("jobs", []).append({
            "at": utc_now(),
            "endpoint": endpoint,
            "job_id": job_id,
            "details": sanitize(details),
        })
        return self.write()

    def add_artifact(self, kind: str, path: Path | str, **details: Any) -> Path:
        self.manifest.setdefault("artifacts", []).append({
            "at": utc_now(),
            "kind": kind,
            "path": _path_string(path),
            "details": sanitize(details),
        })
        return self.write()

    def add_validation(self, report: Any) -> Path:
        self.manifest["validation"] = validation_to_dict(report)
        return self.write()

    def write_report(self, name: str, payload: dict[str, Any]) -> Path:
        path = self.reports_dir / name
        path.write_text(json.dumps(sanitize(payload), indent=2, sort_keys=True) + "\n")
        self.add_artifact("report", path)
        return path


def begin_run(
    *,
    character: str,
    pass_name: str | None,
    adapter: str,
    operation: str,
    seed: int | None = None,
    prompt: str | None = None,
    expected_operations: list[dict[str, Any]] | None = None,
    root: Path | str | None = None,
    run_id: str | None = None,
) -> SourceIntakeRun:
    """Create a pending source-intake manifest and return its mutable handle."""
    rid = run_id or new_run_id(adapter, operation)
    run_dir = intake_root(character, root) / rid
    manifest: dict[str, Any] = {
        "schema_version": MANIFEST_VERSION,
        "run_id": rid,
        "created_at": utc_now(),
        "updated_at": utc_now(),
        "status": "pending",
        "adapter": adapter,
        "operation": operation,
        "character": character,
        "pass": pass_name,
        "seed": seed,
        "prompt": prompt_provenance(prompt),
        "expected_operations": sanitize(expected_operations or []),
        "events": [],
        "requests": [],
        "jobs": [],
        "artifacts": [],
    }
    run = SourceIntakeRun(run_dir=run_dir, manifest=manifest)
    run.write()  # fail closed before any paid/external operation can proceed
    return run
