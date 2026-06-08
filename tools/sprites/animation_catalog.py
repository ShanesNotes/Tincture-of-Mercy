"""Data-backed animation-key support catalog for PixelLab sprite generation."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class AnimationCapability:
    key: str
    status: str
    template_animation_id: str | None = None
    direction: str | None = None
    adapter: str = "pixellab_rest"
    note: str = ""

    @property
    def supported(self) -> bool:
        return self.status == "supported" and bool(self.template_animation_id and self.direction)


_SUPPORTED: dict[str, AnimationCapability] = {
    "idle_down": AnimationCapability("idle_down", "supported", "breathing-idle", "south"),
    "idle_left": AnimationCapability("idle_left", "supported", "breathing-idle", "west"),
    "idle_up": AnimationCapability("idle_up", "supported", "breathing-idle", "north"),
    "idle_right": AnimationCapability("idle_right", "supported", "breathing-idle", "east"),
    "walk_down": AnimationCapability("walk_down", "supported", "walking", "south"),
    "walk_left": AnimationCapability("walk_left", "supported", "walking", "west"),
    "walk_up": AnimationCapability("walk_up", "supported", "walking", "north"),
    "walk_right": AnimationCapability("walk_right", "supported", "walking", "east"),
}

_DOG_SUPPORTED: dict[str, AnimationCapability] = {
    "idle_down": AnimationCapability("idle_down", "supported", "idle", "south"),
    "idle_left": AnimationCapability("idle_left", "supported", "idle", "west"),
    "idle_up": AnimationCapability("idle_up", "supported", "idle", "north"),
    "idle_right": AnimationCapability("idle_right", "supported", "idle", "east"),
    "walk_down": AnimationCapability("walk_down", "supported", "walk-6-frames", "south"),
    "walk_left": AnimationCapability("walk_left", "supported", "walk-6-frames", "west"),
    "walk_up": AnimationCapability("walk_up", "supported", "walk-6-frames", "north"),
    "walk_right": AnimationCapability("walk_right", "supported", "walk-6-frames", "east"),
}

_MANUAL_OR_TBD = {
    "write_name",
    "wash",
    "warm",
    "sit",
    "kneel",
    "administer_ember",
    "self_administer",
    "recoil_neutral",
    "hurt",
    "dodge_brace",
    "push_guard",
    "downed",
}

# Back-compat constant used by earlier PixelLab scaffolding/tests.
ANIM_TEMPLATE_BY_KEY: dict[str, tuple[str, str]] = {
    key: (cap.template_animation_id or "", cap.direction or "")
    for key, cap in _SUPPORTED.items()
}


def capability_for(key: str, *, profile: str = "humanoid") -> AnimationCapability:
    supported = _DOG_SUPPORTED if profile == "dog" else _SUPPORTED
    if key in supported:
        return supported[key]
    if key in _MANUAL_OR_TBD:
        return AnimationCapability(
            key=key,
            status="unsupported",
            note="manual/Aseprite or PixelLab template mapping TBD; use pixellab assemble for local frames",
        )
    return AnimationCapability(
        key=key,
        status="unsupported",
        note="unknown animation key; add an animation_catalog mapping before paid generation",
    )


def plan_animation_keys(
    keys: list[str],
    *,
    pending: dict[str, dict[str, str]] | None = None,
    profile: str = "humanoid",
) -> dict[str, Any]:
    supported: list[dict[str, Any]] = []
    unsupported: list[dict[str, Any]] = []
    templates: dict[str, list[dict[str, Any]]] = {}
    pending = pending or {}

    for row_index, key in enumerate(keys):
        cap = capability_for(key, profile=profile)
        row = {
            "key": key,
            "row_index": row_index,
            "status": cap.status,
            "adapter": cap.adapter,
            "note": cap.note,
        }
        if cap.supported:
            assert cap.template_animation_id is not None and cap.direction is not None
            row.update({
                "template_animation_id": cap.template_animation_id,
                "direction": cap.direction,
            })
            supported.append(row)
            templates.setdefault(cap.template_animation_id, []).append(row)
        else:
            unsupported.append(row)

    jobs_total = sum(len(items) for items in templates.values())
    jobs_to_fire = 0
    for template, items in templates.items():
        already = pending.get(template, {})
        jobs_to_fire += len([item for item in items if item["direction"] not in already])

    return {
        "supported": supported,
        "unsupported": unsupported,
        "templates": templates,
        "job_count": jobs_total,
        "jobs_to_fire": jobs_to_fire,
        "requires_paid_generation": jobs_to_fire > 0,
    }


def unsupported_message(plan: dict[str, Any]) -> str:
    unsupported = plan.get("unsupported") or []
    if not unsupported:
        return ""
    names = ", ".join(item["key"] for item in unsupported)
    notes = "; ".join(f"{item['key']}: {item.get('note') or 'unsupported'}" for item in unsupported)
    return f"unsupported animation key(s): {names}. {notes}"
