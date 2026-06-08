#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT"

BASELINE=${1:-screenshots/baseline.avi}
CURRENT=${2:-screenshots/current.avi}
OUTDIR=${3:-screenshots/compare}
SECOND=${SECOND:-00:00:02}

if [[ ! -f "$BASELINE" ]]; then
  echo "missing baseline movie: $BASELINE" >&2
  exit 1
fi
if [[ ! -f "$CURRENT" ]]; then
  echo "missing current movie: $CURRENT" >&2
  exit 1
fi

mkdir -p "$OUTDIR"
ffmpeg -y -i "$BASELINE" -ss "$SECOND" -frames:v 1 -update 1 "$OUTDIR/baseline.png" >/dev/null 2>&1
ffmpeg -y -i "$CURRENT" -ss "$SECOND" -frames:v 1 -update 1 "$OUTDIR/current.png" >/dev/null 2>&1
cat > "$OUTDIR/index.html" <<HTML
<!doctype html>
<meta charset="utf-8">
<title>Tincture visual comparison</title>
<style>
body { margin: 24px; background: #1a1612; color: #e8dfc9; font-family: Georgia, serif; }
.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
figure { margin: 0; }
img { width: 100%; image-rendering: pixelated; border: 2px solid #2b2520; }
figcaption { margin-top: 8px; color: #c79a3a; }
</style>
<h1>Tincture visual comparison</h1>
<p>Frame extracted at ${SECOND}. Baseline and current use the same 240-frame Godot movie path.</p>
<div class="grid">
  <figure><img src="baseline.png" alt="baseline frame"><figcaption>baseline — ${BASELINE}</figcaption></figure>
  <figure><img src="current.png" alt="current frame"><figcaption>current — ${CURRENT}</figcaption></figure>
</div>
HTML
printf 'compare=%s\n' "$OUTDIR/index.html"
