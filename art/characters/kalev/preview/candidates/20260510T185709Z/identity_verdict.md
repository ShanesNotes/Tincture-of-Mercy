# Kalev identity verdict — local imagegen reference

Score: 78/100  
Verdict: revise, but usable as pre-PixelLab identity guide  
Paid PixelLab generation: not authorized / not run

## Summary

The local generated Kalev reference is worthwhile as a design target: it improves silhouette, scarf/coat language, healer-traveler grounding, and facial identity. It should not replace shipped canonical sheets and should not yet become the identity lock for paid animation.

## Works

- Reads as a worn, grounded, practical mercy-RPG healer rather than weapon-forward action hero.
- Long coat, scarf mass, boots, and lowered arms read clearly at 1x.
- Head/hair/beard identity is clearer than baseline.
- Pouch/belt gear is present.
- Notebook/book-like token exists, but needs stronger deliberate placement.

## Risks / revise points

- Proportion is taller, broader, and more adult-heroic than shipped Kalev.
- Face is more detailed/stern; baseline is gentler and more sprite-native.
- Coat taper is a little too sharp/trench-heroic.
- Scarf is good but too dramatic/voluminous.
- Pose is too confident/portrait-like; Kalev should feel passive, burdened, slightly hunched.
- Downscale variants are noisy; final sprite needs clean clusters, not literal detail transfer.

## Aseprite / PixelLab guidance

- Do not spend PixelLab from this identity lock yet.
- Use this image as a design guide, not production sprite.
- Keep shipped sheet proportions closer: compact, softer, slightly hunched.
- Borrow only identity improvements: clearer hair/beard, scarf silhouette, coat lapel, pouch/notebook tokens.
- Reduce portrait detail into large readable clusters.
- Make notebook a deliberate light vertical rectangle/token.
- Preserve baseline walk-cycle anatomy and rotation logic.
- Avoid sharpening into combat-hero posture.

## Gate D state

Gate D does **not** pass yet for professional animation identity lock. Recommended next local step: generate or hand-polish a revised identity reference with compact/hunched posture, gentler face, less dramatic scarf, and stronger notebook token before any paid PixelLab run.

## User preference update — 2026-05-10

User prefers version 1 over the revised generation. Treat version 1 as the stronger art-direction reference. The revision feedback is retained as guardrails, not as a replacement direction.

Forward direction: use version 1 for Kalev's personality/silhouette/appeal, then apply only targeted production constraints during Aseprite/Pixellab prep: cleaner clusters, slightly less heroic stance if needed, explicit notebook token, baseline-safe feet, and no downscale noise.

## V1 production-lock execution update — local, no paid API

Version 1 has been split into two asset lanes:

1. **Gameplay sprite lane** — use the left mini-sprite from the generated image, not the large portrait, as the 64×96 identity-lock source.
2. **Portrait/card lane** — preserve the larger right-side figure as dialogue / character-card concept art.

Created gameplay identity artifacts:

- `art/characters/kalev/preview/candidates/20260510T185709Z/v1_production_lock/kalev_v1_sprite_reference_crop.png`
- `art/characters/kalev/preview/candidates/20260510T185709Z/v1_production_lock/kalev_v1_sprite_identity_lock_64x96.png`
- `art/characters/kalev/preview/candidates/20260510T185709Z/v1_production_lock/kalev_v1_idle_front_identity_lock_candidate_64x96.png`
- `art/characters/kalev/preview/candidates/20260510T185709Z/v1_production_lock/kalev_v1_production_lock_review_board.png`

Created portrait/card artifacts:

- `art/characters/kalev/portraits/kalev_v1_fullbody_portrait.png`
- `art/characters/kalev/portraits/kalev_v1_dialogue_bust_256.png`
- `art/characters/kalev/portraits/kalev_v1_dialogue_bust_512.png`

Validation evidence:

- `v1_lock_candidate_validate.log`: direct candidate validation PASS.
- Temporary canonical idle-front integration preview PASS.
- Canonical idle-front sheet restored and revalidated PASS.
- Canonical preview/catalog regenerated after restore.
- Secret-marker audit PASS for new local artifacts.

Updated verdict: version 1 remains the preferred identity direction. The 64×96 v1 mini-sprite lock is technically valid and useful as a gameplay identity lock/reference, but it is still a static local candidate, not promoted runtime animation. Next paid PixelLab step remains gated on explicit authorization.
