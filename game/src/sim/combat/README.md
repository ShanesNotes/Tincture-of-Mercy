# Combat simulation

Load `src/data/frame_data.json` and `src/data/combat_params.json` as `unknown`,
then pass both values to `compileCombatData`. The returned immutable data and
fingerprint drive `createCombatSimulation` / `stepCombatSimulation`.

Each simulation frame supplies drained input edges plus optional weapon sweeps.
The reducer accepts damage only when the attacker owns an active action window;
it derives damage, hitstop, re-hit timing, and knockback from compiled frame data.
Use `sampleWeaponCapsule` and `sampleHurtboxCapsules` to build sweeps from accepted
Blender sidecars. Combat state, including actor-local input slots and re-hit
ledger, is serializable and included in every state hash.

After an intentional combat-rule or scripted-scenario change, regenerate the
committed per-tick golden hashes from `game/`:

```sh
npm run replay:regen
```

Review the fixture diff, then run `npm run verify`. Replay loading rejects a
rules-fingerprint mismatch, so tuning changes cannot silently reuse old hashes.
