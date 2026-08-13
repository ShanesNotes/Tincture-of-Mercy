# v1.0 Gates — machine rows first, panels second, two clean rounds to pass

Protocol: machine rows exit 0 before any panel convenes. Panels are cross-model (never the author), judge against fixed evidence, cite rubric rows. Scenario set + tuning tables frozen per round. Both backends sit every gate (60fps bar: WebGPU only). Gamepad is the feel-reference device. Gauntlet = adversarial audit (blind finders, confirmed-defect-only) + these gates, looped until two consecutive clean rounds of everything.

## Latency & pacing (machine)
- P1 Input edge → sim acceptance ≤1 tick; zero lost press edges (instrumented replay).
- P2 Keypress → animation-state transition ≤3 ticks (50ms); fail >4.
- P3 p95 input→first-presented-frame ≤33.3ms engine-side at 60Hz (≤25ms at 120Hz).
- P4 Frame pacing: no periodic double/skip tick artifacts at 60/120/144Hz displays (pacing test).
- P5 Buffer correctness: input within the buffer window of any recovery executes on the first actionable tick, 100% of scripted cases.

## Feel Gate (Playwright scripted scenarios → sim log + video + input overlay + i-frame debug)
- F1 Input honesty: buffered attack/dodge/item fires on first legal tick; no dead press; move stick ≠ camera stick.
- F2 Commitment: startup/recovery locked; only documented cancels (state-machine assert); every attack ≥18 ticks non-cancellable recovery; no roll-cancel before recovery−6.
- F3 Telegraph: every wolf/Warden active ≥12 ticks readable wind-up; boss ordinary openers ≥18 ticks, heavy tells ≥30; blind panel identifies attack type from startup alone ≥80% over the fixed 20-clip sample.
- F4 Impact: hit vs whiff unmistakable — sim hitstop within ±10ms of table, ink-bloom/border pulse within 2 ticks, distinct SFX sample-accurate; zero camera shake anywhere; no juice on air.
- F5 I-frame honesty: debug overlay matches the table for all three Burden bands; a roll begun within ±6 ticks of an active start avoids it for every move in the game (no unavoidable attacks).
- F6 Punish honesty: scripted bot lands a light on every whiffed/recovering boss move except the declared bait; punish windows match ENCOUNTERS.md.
- F7 Breath grammar: empty bar denies roll; regen delay felt; ≤3 lights or ≤4 rolls consecutively at base; empty→full ≤3.0s.
- F8 Weight: displacement curves, never velocity slides; feet plant on recovery; committed flask drink is punishable and survivable-if-timed.
- F9 Attend: target occluded ≤8 consecutive ticks; both bodies on screen with ≥12% margin through strafes; switch intentional (flick threshold + cooldown); clean re-acquire on target death.
- F10 Pack fairness: attack token holds — no true combo from multiple angles; wolves reposition, not blend.
- F11 Death loop: death → re-control at Hearth ≤6.0s including load; Open Page within 0.5m of death site; enemies stay dead until rest.
- F12 Ember wantedness: scripted boss attempts with and without Ember demonstrate real advantage; Numbness cost visibly fires (text degradation + stat deltas).

## Art Gate (screenshot harness, scripted scenes vs the 4 fixed reference plates: rapunzel-019, rapunzel-023, snow-white-014, snow-white-030)
Machine rows:
- A1 Palette covenant: ≥92% of sampled pixels within ΔE 6 of the 7 tokens + declared value ramps; covenant triad proportions within ±8% of the zone's assigned mix.
- A2 Renderer law asserts: no DoF/fog/motion-blur/lens-flare/shake flags anywhere (config + runtime assert).
- A3 Red precision: oxblood hue-mask ≤5% frame coverage outside declared red-field states.
- A4 Grayscale survival: state structure readable in value-only conversion (contrast-band check).
- A5 Border verdict: HUD border state visibly differs across ≥3 world states (image diff).
- A6 Ink outline present on character silhouettes (edge-density band).
- A7 No-post baseline: A1–A6 re-pass with all post disabled.
Panel rows (blind, citations against rows):
- A8 Depth as planes: distance = flatter + more patterned + quantized bands; never hazier.
- A9 Emblem light: every light has a named source + verb; zero generic glow.
- A10 Silhouette role test: role readable from pure-ink stills before costume detail.
- A11 Face restraint: no expression sheets, no glowing eyes; state carried by hands/gaze/posture/marks.
- A12 Material memory: damage/restoration keeps seams; repaired ≠ new.
- A13 Seven-slot composition: field/axis/threshold/witness/light/memory/border nameable per staged scene.
- A14 Carrier check: every red/gold element attached to a named material with a job.
- A15 Same-workshop judgment vs the four plates: would these frames pass as output of the same hand?

## Performance & platform (machine)
- Perf: p95 frame ≤13.3ms at 1080p WebGPU during the boss with 3 actors; no frame >33ms across a 3-minute run; sim-step p95, render CPU/GPU p95, boot time, heap/VRAM ceilings, shader precompile verified (zero first-use compile stutter), GLB/texture disposal proven.
- Determinism: golden replays byte-stable same-V8; replay format versioned; collision-mesh hash matches.
- Lifecycle: blur→pause before enemies advance; resume requires input; no post-suspension damage burst.
- WebGL2 fallback: boots, completes the e2e slice, passes the Art Gate (not the 60fps bar).

## Adversarial audit
Blind finders receive goal contract + diff only (no author rationale). Confirmed defects with repro only; false positives are the enemy. Finder = seat that authored least of the diff; author fixes; finder re-checks. One clean round (zero confirmed) per wave; final gauntlet requires two consecutive clean rounds of audit + all gates together.
