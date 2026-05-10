# Backlog — Visual & Gameplay — v0.8.1

Priority-tagged, buildable tasks for the prototype slice. Each task carries: ID, title, owner role, dependencies, acceptance gate, status. Ordered for execution; do not skip ahead without satisfying dependencies.

**Priorities:**
- **P0** — must ship in v0.8.1 prototype. Blocks the slice.
- **P1** — needed for slice polish; ship if time allows, defer to post-P0 if not.
- **P2** — reserved for post-P0. Documented here only to prevent scope drift.

**Roles:** ART, ANIM, UI, AUDIO, GD (Godot/code), DATA (resource authoring), DESIGN (review/spec).

---

## 1. Foundations (P0 — week 1)

| ID | Task | Role | Deps | Acceptance |
|---|---|---|---|---|
| F-01 | Create Godot 4.6 project; folder structure per `godot_asset_manifest_v0_8_1.md` §1 | GD | — | Tree exists; commit. |
| F-02 | Import all five fonts with pixel-fidelity settings | GD | F-01 | Filter Disabled, MSDF off, hinting None. |
| F-03 | Author `theme_ironwood.tres` (panels, buttons, labels, line-edits) | UI | F-02 | Renders identical to `ui_kits/game/index.html` Ironwood reading. |
| F-04 | Author `theme_wittehaven.tres` | UI | F-03 | Mono-witte font, 0px radius, shadow-witte; Wittehaven kit reading matches. |
| F-05 | Author `theme_paradise.tres` | UI | F-03 | Vellum-bone bg, halo glow stylebox, IM Fell only. |
| F-06 | Implement `KalevState` autoload (Burden / Pressure / Numbness / regime / Ember-recent / proximity flags) | GD | F-01 | Signals fire on change; no float exposed in API. |
| F-07 | Implement `RegimeManager` autoload (theme-swap on UI root) | GD | F-03..F-05 | `set_regime()` swaps theme without re-mounting UI scenes. |
| F-08 | Implement `RegisterLookup` autoload (`tactile(field_id, value, regime_id)`) | GD, DATA | F-06, F-07 | Returns folk/sanctioned/sacred wording through the single UI lookup API. |
| F-09 | Author three `RegisterLexiconResource` `.tres` resources | DATA | F-08 | Cover all field IDs used by Patient panel, Pouch, Wheel, Notebook. |
| F-10 | Implement `Beat` autoload (held-frame timer, mark/disclosure pairs, manuscript-intercut handler) | GD | F-01 | Emits all signals from `godot_design_delta_v0_8_1.md` §5.2. |
| F-11 | Implement `CaptionLayer` autoload + `data/captions.tres` mapping | GD, DATA | F-01 | Captions render bottom-of-frame for any audio mark file in `audio/mark/`. |
| F-12 | Implement `Notebook` autoload (append-only, `user://notebook.dat`) | GD | F-01 | Unit test confirms delete fails; entries persist across save/load. |

---

## 2. Shaders & VFX (P0 — week 1)

| ID | Task | Role | Deps | Acceptance |
|---|---|---|---|---|
| S-01 | `tremor.gdshader` (cursor + administer-ember frame 3 brace) | GD | F-06 | Amplitude 0 at Pressure≤1, ±0.5px at Pressure≥3. Opt-out reduces to 0. |
| S-02 | `numb_blur.gdshader` (patient name only, Ironwood only) | GD | F-06, F-07 | Bypassed in Wittehaven panel. Opt-out replaces with 24% opacity fade. |
| S-03 | `vellum_noise.gdshader` (1–3% on `Panel` tagged `vellum`) | GD | F-03 | Static; never animated. |
| S-04 | `halo.gdshader` (1px icon-gold ring, 12px outer offset) | GD | F-05 | Renders only when regime == paradise. |
| S-05 | `water_pattern.gdshader` (4-frame cycle, lake-slate on vellum) | GD | F-01 | Used on icon panels with underworld band. |
| V-01 | `cold_breath.tscn` (GPUParticles2D, 1–2px vellum-bone, 24% opacity) | GD | F-01 | Idle in cold scenes only. |
| V-02 | `hearth_glow.tscn` (PointLight2D, warm) | GD | F-01 | 18% dim during Cabin Beat 3. |
| V-03 | `candle_glow.tscn` (PointLight2D + flicker) | GD | F-01 | Three pan positions in Bethany. |
| V-04 | `window_cool_zone.tscn` (lake-slate PointLight2D) | GD | F-01 | Never blends with candle zone in Bethany. |
| V-05 | `fluorescent_hum_rim.tscn` (4px witte-cool rim on paint cans) | GD | F-01 | Fades 1.5s on Kalev passage. |
| V-06 | `ember_local_flash.tscn` (220ms, patient panel only) | GD | F-01 | Never screen-wide. |

---

## 3. Tilesets & worldspace (P0 — week 2)

| ID | Task | Role | Deps | Acceptance |
|---|---|---|---|---|
| T-01 | Cabin tileset (24 tiles + 4 custom data fields) | ART, GD | F-01 | Walkable / audio_class / regime_lock / wear_index populated. |
| T-02 | Ironwood Road tileset (28 tiles) | ART, GD | F-01 | Crossroads barricade tile renders the manuscript-rule label. |
| T-03 | Bethany tileset (26 tiles, three sickbed variants) | ART, GD | F-01 | Three blanket colors per `art_direction_v0_8_1.md` §2.4. |
| T-04 | Manuscript UI tile atlas (12 tiles; no IC XC NIKA in P0) | ART | F-01 | Marginalia motifs at 12×12. IC XC NIKA/halo/narthex plates remain post-P0 Paradise reservations. |
| T-05 | Wittehaven placeholder tileset (6 tiles) | ART | F-01 | Sufficient for crossroads paint-can prop only. |

---

## 4. Sprites & animation (P0 — week 2–3)

| ID | Task | Role | Deps | Acceptance |
|---|---|---|---|---|
| C-01 | Kalev sprite sheet + AnimationTree | ART, ANIM | T-01 | All 8 anims; tremor binding on administer-ember frame 3. |
| C-02 | Lena sprite sheet + AnimationTree | ART, ANIM | T-03 | Hand-on-shoulder anim available for Bethany Beat 5. |
| C-03 | Birdie sprite sheet + AnimationTree | ART, ANIM | T-02 | Carry-water + apple-refusal/follow anims. 48×64. |
| C-04 | Eli bedridden sprite + breath state machine | ART, ANIM | T-01 | Three states; "still" frame includes cedar dog beside hand. |
| C-05 | Miriam Toll bedridden sprite | ART, ANIM | T-03 | Lake-slate blanket; dragon-red variant for icon panel only. |
| C-06 | Nora Finch bedridden sprite | ART, ANIM | T-03 | Cedar-brown blanket; cough animation. |
| C-07 | Dr. Amos Bell bedridden sprite | ART, ANIM | T-03 | Verdigris blanket; reading glasses on tin saucer prop. |
| C-08 | Bethany resident generic sprites (3 palette variants) | ART, ANIM | T-03 | **P1.** Placeholder palette swap acceptable in v0.8.1. |

---

## 5. Props (P0 — week 3)

| ID | Task | Role | Deps | Acceptance |
|---|---|---|---|---|
| P-01 | Cedar dog 14×14 (with halo variant for Paradise) | ART | F-01 | Renders identically across regimes except Paradise halo. |
| P-02 | Notebook 64×48 (closed/open + per-page micro-detail) | ART | F-01 | Coffee ring / fingerprint / smudge per page. |
| P-03 | Pouch 32×24 cedar-leather | ART | F-01 | No glow, no count indicator on the sprite itself. |
| P-04 | Ember vial three states (sealed/uncorked/empty) | ART | F-01 | Only sustained ember-red beyond apple. |
| P-05 | Kettle three states (cold/hot/whistling) | ART, ANIM | F-01 | Whistling 4-frame loop. |
| P-06 | Pulseleaf cluster 32×24 (2-frame breath shimmer) | ART, ANIM | F-01 | 1800ms cycle. |
| P-07 | Apple 12×12 (worm hole, single ember-red core pixel) | ART | F-01 | Not appetizing; clearly winter-wormed. |
| P-08 | Hearth fire 32×24 (4-frame, 480ms loop) | ART, ANIM | F-01 | Brightest center-frame; flicker irregular. |
| P-09 | Candle 12×16 (3-frame flicker, 600ms) | ART, ANIM | F-01 | Breath-synced. |
| P-10 | Water basin / tin cup / jar shelf props | ART | F-01 | Static. |
| P-11 | Wittehaven paint can 16×24 | ART | F-01 | Witte-white can with witte-cool rim + dulled ember-red drip. |
| P-12 | Torn ribbon 32×16 (3-frame flutter) | ART, ANIM | F-01 | Partial mono-witte lettering; never picked up. |

---

## 6. UI scenes (P0 — week 3)

| ID | Task | Role | Deps | Acceptance |
|---|---|---|---|---|
| U-01 | Pouch HUD scene (8×2 grid, persistent) | UI, GD | F-03..F-05, F-08 | Slot tiles theme-swap correctly; Ember cannot target Eli during care; self-use becomes available after Eli's name is written. |
| U-02 | Tincture Wheel scene (200×200 HUD / 320×320 mid-craft) | UI, GD | F-08, F-09 | Quality reads tactile only. No celebration sound on excellent. |
| U-03 | Patient panel scene (420×320, theme-swapping) | UI, GD | F-08, F-09, S-02 | Numbness blur applies to name only, Ironwood only. |
| U-04 | Notebook scene (480×420) + graphite underrule overlay | UI, GD | F-12 | Append-only confirmed by unit test. Graphite underrule on still-patient names only; page 77 line 7 remains reserved outside P0. |
| U-05 | State overlay scene (280×72, three rows) | UI, GD | F-06 | Never numeric; state-words from controlled vocabulary. Pressure/Numbness fade in Paradise. |
| U-06 | Dialogue band (1920×120) | UI, GD | F-08 | Speaker name in Cinzel overline; no portrait avatars. |
| U-07 | Manuscript intercut handler scene | UI, GD | F-10 | Loads icon-panel texture, holds ≥4s, vellum-bone fade. |
| U-08 | Iron Ledger scene | UI, GD | — | **P2.** post-P0. |

---

## 7. Audio (P0 — week 4)

| ID | Task | Role | Deps | Acceptance |
|---|---|---|---|---|
| A-01 | Bed: cabin hearth (normal + dim) | AUDIO | F-01 | Loops cleanly; –22 LUFS for dim. |
| A-02 | Bed: wind in pines | AUDIO | F-01 | 60s loop. |
| A-03 | Bed: Bethany sickroom murmur + 3 candles | AUDIO | F-01 | Three candle pan positions audible. |
| A-04 | Bed: notebook pencil scratch | AUDIO | F-01 | Plays only during write beats. |
| A-05 | Marks: door close, kettle whistle, vial uncork, breath cease, cedar-dog click | AUDIO | F-11 | All have caption entries; –12 LUFS. |
| A-06 | Marks: snow crunch (×4), wood step (×4), fluorescent hum, cup placed | AUDIO | F-11 | Variants randomize. Hum captioned. |
| A-07 | Marks: notebook open/close, page turn, pencil stroke | AUDIO | F-11 | Pencil stroke layered per name written. |
| A-08 | UI: panel open/close, wheel engage, wheel-quality-sound | AUDIO | F-11 | **No sound on excellent quality.** No sound on unlock/achievement (none exist). |

---

## 8. Scene assembly (P0 — week 4–5)

| ID | Task | Role | Deps | Acceptance |
|---|---|---|---|---|
| SC-01 | Cabin scene (4 beats per `scene_composition_bible_v0_8_1.md` §5) | GD, DESIGN | F-10, T-01, C-01, C-04, U-01..U-07, A-01, A-05 | All composition gates pass. Eli always dies. Ember cannot target Eli; self-use unlocks after Eli's name is written. |
| SC-02 | Cabin death icon panel + intercut wiring | ART, GD | SC-01 | Held 4s; vellum-bone fade; hard cut to next scene. |
| SC-03 | Ironwood Road scene (3 segments, 3 beats per §6) | GD, DESIGN | F-10, T-02, C-01, C-03, U-01..U-07, A-02, A-06 | East fork barriered; paint cans + ribbon present at crossroads. |
| SC-04 | Birdie apple-refusal icon panel + intercut wiring | ART, GD | SC-03 | Mandatory after the apple refusal; Birdie refuses the apple and follows anyway. |
| SC-05 | Bethany scene (6 beats per §7) | GD, DESIGN | F-10, T-03, C-01..C-07, U-01..U-07, A-03, A-05, A-07 | All composition gates pass. Birdie always brings cup to Bell. |
| SC-06 | Bethany triage icon panel + intercut wiring | ART, GD | SC-05 | Earned colors per §11.3. Held 5s. |
| SC-07 | Hospital-language fragment trigger (§4.6) | GD | F-06, U-02 | Fires for ~1s when Pressure≥shaking AND Numbness≥slight distance, in Ironwood. |

---

## 9. Anti-drift safeguards (P0 — week 5)

| ID | Task | Role | Deps | Acceptance |
|---|---|---|---|---|
| AD-01 | P0 vocabulary gate (`anti_drift.py --mode p0-vocabulary`) — CI / pre-commit | GD | — | Build fails on any restricted P0 word in user-facing strings. Scope expands when post-P0 packets register sanctioned vocabulary. |
| AD-02 | Numeric-leak grep on UI labels | GD | — | Any digit in `Label` text without `@allow_numeric` tag fails build. |
| AD-03 | Combat-symbol grep on P0 class names | GD | — | `*Enemy*` / `*Damage*` / `*Hit*` / `*Combat*` / `*Boss*` class names fail build **inside P0 directories** (`scripts/p0_*`, `scenes/p0_*`). Post-P0 packets may use these in their own scoped directories. |
| AD-04 | Theme-coverage check | GD | F-03..F-05 | All three theme `.tres` files define identical override key set. |
| AD-05 | Notebook append-only test | GD | F-12 | `notebook.delete_entry(0)` returns error. |
| AD-06 | Caption-coverage test | GD, AUDIO | F-11 | Every `audio/mark/*.ogg` has matching caption key. |
| AD-07 | Silhouette test harness (renders sprite black-on-white at 1×) | GD, ART | C-01..C-07 | All named characters identifiable in pure silhouette. |
| AD-08 | Acceptance-test runner (per `acceptance_tests_v0_8_1.md`) | GD, DESIGN | All scenes | Full suite runs in CI. |

---

## 10. P1 — polish (week 6, if time allows)

| ID | Task | Role | Notes |
|---|---|---|---|
| PL-01 | Bethany resident generic sprites — three real palette variants (not swap) | ART | Replaces C-08 placeholder. |
| PL-02 | Wittehaven placeholder tileset → light polish (signage type, paint can detail) | ART | Still placeholder; foreshadow only. |
| PL-03 | Settings panel (tremor amplitude, numbness blur opt-out, audio levels, caption visibility) | UI, GD | Accessibility minimums per `ui_regime_system_v0_8_1.md` §10. |
| PL-04 | Cold-breath tuning per scene (Cabin, Ironwood, Bethany window-zone) | GD | Particle count, lifetime, color tweak. |
| PL-05 | Hand-authored micro-detail per notebook page (coffee ring, fingerprint, smudge) | ART | Already in P-02 brief; polish per page. |
| PL-06 | Audio-mix pass: Bethany three-candle pan positions tightened | AUDIO | Subtle. |
| PL-07 | Per-scene held-frame timing review with DESIGN | DESIGN | All numbers in `scene_composition_bible_v0_8_1.md` are starting points. |

---

## 11. P2 — reserved (do not start in P0)

| ID | Task | Notes |
|---|---|---|
| R-01 | Mackinac threshold scene + icon panel | Reservations only. Composition locked in `scene_composition_bible_v0_8_1.md` §12. |
| R-02 | Wittehaven Block 0044 scene + Iron Ledger panel | Reservations only. |
| R-03 | Paradise narthex scene + IC XC NIKA plate | Reservations only. |
| R-04 | Score / score panel | **Will not be built.** Documented to prevent re-introduction. |
| R-05 | Achievement / unlock system | **Will not be built.** Documented to prevent re-introduction. |
| R-06 | Combat / enemies / damage | **Will not be built.** Documented to prevent re-introduction. |
| R-07 | Music score | Deferred to v0.9+; may remain absent. |
| R-08 | Multiplayer / multiplayer chat | Out of scope permanently. |

---

## 12. Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Drift toward legibility (numbers leak; case-language creeps in) | High | AD-01 + AD-02 + AD-03 in CI. Re-read `ui_regime_system_v0_8_1.md` §12 weekly. |
| Pixel-art production time underestimated | High | Author manuscript UI first (smaller footprint, theme-portable); sprites second; tilesets third. |
| Audio captions skipped under deadline | Medium | AD-06 in CI; build fails if skipped. |
| Beat timing tuned to feel "responsive" instead of "composed" | Medium | DESIGN review (PL-07); held frames are valid; resist motion. |
| Hospital-language fragment (§4.6) overplayed | Medium | Trigger requires both high Pressure and high Numbness simultaneously; cap to ~1s; do not extend. |
| Birdie misread as transactional NPC | Medium | Beat composition + dialogue lines fixed in spec; do not add affinity meter. |
| Wittehaven palette bleeds into Ironwood | Low (with safeguards) | Theme swap is on root CanvasLayer only; cross-regime contamination is a bug. |
| Notebook becomes a quest log in P0 | High if unwatched | Append-only test (AD-05) + naming convention (`Notebook` autoload in P0; if post-P0 introduces quests, scaffold a separate `QuestLog` autoload — never collapse it into `Notebook`). |

---

## 13. Sequencing summary

```
Week 1:  Foundations (F-*) + Shaders/VFX (S-*, V-*)
Week 2:  Tilesets (T-*)  + Sprites part 1 (C-01..C-04)
Week 3:  Sprites part 2 (C-05..C-07)  + Props (P-*) + UI scenes (U-*)
Week 4:  Audio (A-*)  + Scene assembly part 1 (SC-01..SC-04)
Week 5:  Scene assembly part 2 (SC-05..SC-07) + Anti-drift (AD-*)
Week 6:  P1 polish + acceptance suite green
```

The schedule assumes one engineer (GD), one pixel artist (ART/ANIM), one designer (DESIGN). Audio (AUDIO) part-time. UI (UI) overlaps with GD. If the team is smaller, defer all P1 to v0.9 and tighten Week 6 to acceptance-suite-only.

---

## 14. Definition of done (v0.8.1 prototype)

The slice is done when **all of the following are true:**

1. All P0 tasks complete; status moved to ✅ in `godot_asset_manifest_v0_8_1.md`.
2. Acceptance suite (`acceptance_tests_v0_8_1.md`) passes 100%.
3. The three scenes (Cabin / Ironwood Road / Bethany) play start-to-finish in sequence without crashing.
4. The three icon-panel intercuts render at scene closes.
5. The notebook persists across sessions and remains append-only.
6. P0 vocabulary gate (`anti_drift.py --mode p0-vocabulary`) returns zero hits in user-facing strings.
7. No numeric stat is visible to the player anywhere except: pouch quantity glyphs, Wittehaven sanctioned chart props (where intended), and the §4.6 hospital-language fragment moments.
8. No music plays. No celebration sounds play on excellent quality, recovery, or scene completion.
9. The cedar dog appears in Kalev's inventory at scene 1 and is never removable by player action.
10. Eli always dies. Ember cannot target Eli during Cabin care; self-use unlocks only after Eli's name is written. The east fork at the crossroads is always barriered. Lena's Beat-1 line in Bethany is fixed.

If any of these is false, the slice is not done. Fix the slice; do not relax the gate.
