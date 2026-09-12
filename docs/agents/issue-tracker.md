# Issue Tracker Configuration

This repo tracks work in its **design-system spec pack**, not in a generic ticket folder.

- Issue root: `design_system/v0_9_mercy_rpg_substrate/ISSUE_SLICES.md` — the slice list and its dependency order. `PRD.md` beside it carries the active requirements. Read both before picking work; `AGENTS.md` names them as the boot sequence.
- One slice per entry in `ISSUE_SLICES.md`. Gates (`B0`, and the ones after it) are the ordering constraint: substrate slices land before opening-act content.
- Triage state: the `Status:` field on the slice entry (`open` / `claimed` / `resolved`), plus the house labels (`needs-triage` · `needs-info` · `ready-for-agent` · `ready-for-human` · `wontfix`)
- `.scratch/` is **gitignored** here (see `.gitignore`) — it holds orchestration worktrees and local run state, never durable tracker state.
- ADRs live in `docs/adr/`.
- Do not create GitHub/GitLab issues; the private remote (`github.com/ShanesNotes/Tincture-of-Mercy`) carries code only, planning stays in-tree.

## Wayfinding operations (`/wayfinder`)

- **Map**: `design_system/v0_9_mercy_rpg_substrate/<effort>-map.md` — Destination / Notes / Decisions-so-far / Not-yet-specified / Out-of-scope, labelled `wayfinder:map` in its header
- **Child ticket**: an entry in `ISSUE_SLICES.md` with the question in the body; a `Type:` line records `research` / `prototype` / `grilling` / `task`
- **Blocking**: a `Blocked by:` line on the entry; a ticket is unblocked when every listed ticket is `resolved`
- **Frontier**: open, unblocked, unclaimed tickets — first in gate order wins
- **Claim**: set `Status: claimed` before any work
- **Resolve**: append the answer under `## Answer`, set `Status: resolved`, then add a one-line gist + link to the map's Decisions-so-far
- **HITL discipline** (house rule, 2026-07-10): grilling/prototype tickets are never self-answered by an agent. Technical calls may go through a Claude+Codex+Grok pseudo-grill with dissents recorded on the ticket; taste/policy/rights/destructive calls get `Label: ready-for-human` and blocking edges re-wired around them.
