#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT"

mkdir -p screenshots
touch screenshots/.gdignore
OUT=${1:-screenshots/current.avi}
LOG=${OUT%.*}.log
RUNNER=.capture/run_godot
if [[ ! -x "$RUNNER" ]]; then
  RUNNER=godot
fi

DOTNET=${DOTNET:-dotnet}
TIMEOUT=${TIMEOUT:-timeout}
FRAMES=${FRAMES:-240}

$DOTNET build Tincture-of-Mercy.csproj
$TIMEOUT 120 "$RUNNER" --write-movie "$OUT" --quit-after "$FRAMES" > "$LOG" 2>&1
printf 'current=%s\nlog=%s\n' "$OUT" "$LOG"
