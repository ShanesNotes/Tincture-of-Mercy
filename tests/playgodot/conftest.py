from __future__ import annotations

import os
import socket
from pathlib import Path

import pytest

GODOT_PROJECT = Path(__file__).resolve().parents[2]


def get_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
        probe.bind(("127.0.0.1", 0))
        return int(probe.getsockname()[1])


@pytest.fixture(scope="session")
def playgodot_available() -> bool:
    return os.environ.get("PLAYGODOT_ENABLED") == "1" and bool(os.environ.get("GODOT_PATH"))
