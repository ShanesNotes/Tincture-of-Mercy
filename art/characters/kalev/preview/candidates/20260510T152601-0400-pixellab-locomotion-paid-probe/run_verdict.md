# Kalev PixelLab locomotion paid probe verdict

Status: recovered, not promoted.

What happened:
- Authorized paid probe completed all 8 PixelLab jobs.
- Direct frame URLs returned HTTP 403 for every frame, even with bearer-token retry.
- Canonical sheet was restored from backup; no generated runtime was promoted.
- Documented `GET /characters/{character_id}/zip` export recovered all animation PNGs without extra generation spend.
- ZIP recovery candidate assembled and validated PASS.

Candidate art:
- `kalev_locomotion_from_pixellab_zip_latest_64x96.png`
- `preview_from_zip_latest/`
- `locomotion_current_vs_pixellab_zip_candidate_board_2x.png`

Visual decision:
- Do not promote. The candidate is cleaner and technically valid, but it is smaller/thinner and loses too much of Kalev's coat mass, burdened silhouette, and hand/notebook readability compared with the current canonical and the preferred v1 identity direction.

Pipeline fixes made:
- Blank/all-transparent runtime sheets now fail validation.
- PixelLab generation now falls back to character ZIP export when direct frame URLs fail or return incomplete frames.
- Generated-frame missing cells now fail the generate command and keep pending job IDs for retry instead of silently passing.
- Regression tests cover blank validation and ZIP fallback group selection/padding.

Validation:
- `python3 -m unittest tests.test_sprite_tools -v` PASS, 36 tests.
- `./tools/sprite validate kalev idle_front` PASS after restore.
- `./tools/sprite validate kalev locomotion` PASS after restore.
- `./tools/sprite health`: 2 PASS, 7 MISSING.
