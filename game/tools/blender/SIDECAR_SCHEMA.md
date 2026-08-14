# Sidecar schema (tincture.sidecar.v0)

One JSON file per authored clip, sampled at **60 Hz** (1 sample = 1 sim tick).
The sim consumes the sidecar; the view loads the hashed GLB for skinning only.

Clips are sliced to `frame_data_v0.json` (copied verbatim from `TUNING_V0.md` where that table names a move). Never retarget the table to a longer clip.

## File name

`{character}_{clip}.json` next to `{character}.{sha256_12}.glb`.

## Object

```json
{
  "schema": "tincture.sidecar.v0",
  "character": "wolf",
  "clip": "lunge",
  "ticks": 60,
  "tickHz": 60,
  "glb": "wolf.a1b2c3d4e5f6.glb",
  "glbHash": "<sha256 hex of sanitized GLB>",
  "rootXZ": [[0.0, 0.0], [0.0, -0.01]],
  "events": [{"tick": 30, "type": "hitbox_on"}],
  "sockets": {
    "weaponBase": [[0.1, 0.9, 0.2]],
    "weaponTip": [[0.1, 0.95, 0.55]]
  },
  "hurtboxes": [
    {
      "tick": 0,
      "capsules": [
        {"name": "torso", "a": [0, 0.7, 0], "b": [0, 1.1, 0], "r": 0.16}
      ]
    }
  ],
  "footContacts": [
    {"tick": 0, "feet": ["foot.BL", "foot.BR"]}
  ]
}
```

| Field | Rule |
|---|---|
| `ticks` | Integer. Must equal the named row in `frame_data_v0.json`. |
| `rootXZ` | Length `ticks`. Game-space ground plane `[x, z]` (Y-up). Blender Z-up `(x,y,z)` → `(x, -y)`. |
| `events` | `{tick, type}` with `0 <= tick < ticks`. Types: `hitbox_on`, `hitbox_off`, `iframe_on`, `iframe_off`, `actionable`, `guard_enter`, `guard_hold`, `guard_exit`, `hyperarmor_on`, `hyperarmor_off`, `sfx_swing`. |
| `sockets.weaponBase` / `weaponTip` | Length `ticks`. Game-space `[x, y, z]`. |
| `hurtboxes` | Length `ticks`. Each `capsules[]` is `{name, a, b, r}` in game space. |
| `footContacts` | Length `ticks`. `feet` lists planted bone names this tick. |
| `glbHash` | SHA-256 of the sanitized GLB this sidecar was sampled from. |

## Space

Game space is three.js Y-up, character faces −Z at rest. Exporter converts Blender Z-up / −Y-forward.

## Attack phase mapping

For a move with `startup` / `active` / `recovery`:

- ticks `[0, startup)` — startup
- ticks `[startup, startup+active)` — active (`hitbox_on` at `startup`, `hitbox_off` at `startup+active`)
- ticks `[startup+active, ticks)` — recovery

`ticks` **must** equal `startup + active + recovery`.
