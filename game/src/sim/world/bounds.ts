/**
 * Authored void death. S19 finding (a) / r1f-level: nothing in TUNING_V0 names
 * a kill plane, but a fall that never lands never applies lethal fall-damage
 * (that path requires ground contact). Crossing this Y is death through the
 * normal recordDeath / Open Page path. Open Page uses last grounded height
 * (`motion.fallStartY`), not the void coordinate. Player only: applying the
 * same rule to pack actors would rewrite scripted runs where a wolf already
 * walked off baked mesh.
 */
export const WORLD_KILL_PLANE_Y = -10;
