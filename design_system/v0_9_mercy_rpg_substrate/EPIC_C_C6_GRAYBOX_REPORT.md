# Epic C C6 Godot Graybox Report

Status: C6 placeholder graybox and Anna/threshold copy pass implemented. This is not final art, final music, final dialogue, or production encounter content.

## Scope delivered

- Added a narrow cabin graybox scene at `scenes/cabin/cabin_graybox.tscn`.
- Added `CabinGrayboxAdapter`, a presentation-only Godot adapter that consumes `OpeningActSnapshot` / event-projected truth and updates labels, actor placeholders, camera focus, inventory, recognition, and audio cue display.
- Added `OpeningActGrayboxKeys` as a source-testable C6 presentation contract for actor ids and snapshot/event field keys.
- Updated opening fixtures with restrained placeholder copy for Anna's death, Anna's notebook name, the Iconographic threshold read, and `world.cross_threshold`.
- Updated opening replay tests so copy and recognition labels are fixture-stable and source-event provenance remains enforced.
- Added a C6 structural guard proving the graybox adapter files exist and consume the required snapshot-shaped keys.

## Preserved boundaries

- Godot owns layout and display only. Canonical state remains in substrate event streams and `OpeningActSnapshot`.
- The graybox does not instantiate an `OutcomeResolver`, resurrect `CombatTable`, or store authoritative inventory/threat/recognition/patient state.
- `world.cross_threshold` remains a VerbInvocation-routed event shape; no new appender was added.
- `scenes/world_lab/*` remains reference/out-of-scope and was not promoted into C6.
- C2.5 fixture-reader spike was skipped.
- Full audio manager/music production is deferred; C6 only proves `active_audio_cue` can be displayed from snapshot metadata.

## C6 copy decisions

- Anna death event copy: `Anna's breath stops with Kalev still beside her.`
- Anna notebook copy: `Anna — written after breath stopped.`
- Iconographic threshold copy: `The threshold reads as a leaving, not a rescue.`
- Threshold crossing copy: `Page 66 stays open as Kalev crosses the threshold.`

These are placeholder-quality canonical-copy candidates, not final dialogue. They are intentionally restrained and keyed to existing event fields.

## Verification evidence

- `dotnet test Tincture.Tests/Tincture.Tests.csproj --no-restore --filter "FullyQualifiedName~Tincture.Tests.Opening.OpeningActStructureTests" --nologo` — 7 passed.
- `dotnet test Tincture.Tests/Tincture.Tests.csproj --no-restore --filter OpeningActFixtureReplayTests --nologo` — 10 passed.
- `dotnet build Tincture-of-Mercy.csproj --no-restore --nologo` — succeeded, 0 warnings/errors.

Final acceptance run is recorded in the ultragoal ledger for this slice.

## Not done

- Godot editor/runtime E2E playthrough of the graybox scene.
- Final lighting/camera tuning, final title/cinematic sequence, final art, final music adapter, and final dialogue.
- Production encounter AI scene integration beyond placeholder display of snapshot truth.

## Dirty-tree exclusion

The workspace still contains pre-existing unrelated dirty/untracked files (`README.md`, older design docs, prompt edits, generated `.uid` files, art/audio/world-lab files, and other asset scaffolding). The C6 commit stages only C6-owned files and fixture/test/report changes.
