# Epic C Opening Act Headless Report

Status: C0-C5 headless substrate pass implemented; C6 Godot graybox remains deferred.

## Lore-binding decisions landed

- Cast ids are named in data and fixtures: `kalev`, `anna`, `iiro`, `wolf_01`, `wolf_02`, `wolf_03`.
- Replay chronology follows the music-compatible order: Two Breaths seed → water → bread → tincture → wolves hold-line → Anna Witness → borrowed mercy / threshold departure.
- `03-opening-act-bible.md` keeps five-act narrative weight while documenting that Epic C replay order is chronological.
- Audio cue hooks are event fields on declared source events: `long_morning_start`, `yard_holds_start`, `yard_holds_resolve_safe`, `yard_holds_resolve_fallen`, `long_pour_start`, `long_pour_resolve`.
- Sensory/camera state is projected from events by `OpeningActSnapshot`: hearth, Anna breath, Iiro posture, notebook state/page, camera focus, first verb tick.
- The mother-witness fixture includes Hesychasm presence; full replay includes Iconographic threshold reading plus `world.cross_threshold` through `VerbInvocation` event shape.
- Wolves have both safe-route and Kalev-fall resolve fixtures. Loot/material remains source-provenance based.

## Headless artifacts

- `Tincture.Tests/Fixtures/opening_act_water_bread_fixture.json`
- `Tincture.Tests/Fixtures/opening_act_tincture_fixture.json`
- `Tincture.Tests/Fixtures/opening_act_mother_witness_fixture.json`
- `Tincture.Tests/Fixtures/opening_act_wolves_hold_line_fixture.json`
- `Tincture.Tests/Fixtures/opening_act_wolves_kalev_falls_fixture.json`
- `Tincture.Tests/Fixtures/opening_act_cabin_prologue_fixture.json`

## Verification evidence

- `dotnet test Tincture.Tests/Tincture.Tests.csproj --filter EpicCOpeningActManifest --nologo` — 3 passed.
- `dotnet test Tincture.Tests/Tincture.Tests.csproj --filter OpeningAct --nologo` — 28 passed.
- `dotnet test Tincture.Tests/Tincture.Tests.csproj --nologo` — 184 passed.
- `dotnet build Tincture.Substrate/Tincture.Substrate.csproj --nologo` — succeeded, 0 warnings/errors.
- `dotnet build Tincture-of-Mercy.csproj --nologo` — succeeded, 0 warnings/errors.
- `python3 design_system/tools/anti_drift.py --mode all --root design_system` — clean.
- `git diff --check` — clean.

## Not done

- C6 Godot title/cabin/yard graybox binding.
- Final art, final map, final dialogue, or final UI.

## Scope exclusion

The working tree contains pre-existing untracked Godot/art/world-lab files (for example `scenes/world_lab/*`, `scenes/sprite_lab/*`, `art/`, `audio/`, and other local asset scaffolding). They are not part of this Epic C C0-C5 headless candidate, were not required by the headless tests, and must remain unstaged for this slice. C6 starts only after this report's headless evidence is accepted.
