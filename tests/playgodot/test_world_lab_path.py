from __future__ import annotations

import asyncio
import os

import pytest

from .conftest import GODOT_PROJECT, get_free_port


def test_world_lab_launches_for_cinematic_path(playgodot_available: bool) -> None:
    if not playgodot_available:
        pytest.skip("Set PLAYGODOT_ENABLED=1 and GODOT_PATH to the automation Godot fork to run this E2E scaffold.")

    asyncio.run(_run_world_lab_launch())


async def _run_world_lab_launch() -> None:
    from playgodot import Godot

    port = get_free_port()
    async with Godot.launch(
        str(GODOT_PROJECT),
        headless=True,
        timeout=20.0,
        godot_path=os.environ["GODOT_PATH"],
        remote_debug_port=port,
    ) as game:
        await game.wait_for_node("/root/Main/IronwoodWorldLab")
        await game.screenshot(str(GODOT_PROJECT / "screenshots" / "playgodot_world_lab.png"))
