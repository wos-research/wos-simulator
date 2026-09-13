# Lancer investigation handoff — 2026-09-13

Branch: `codex/mk2-controlled-replay`. Start with [the Points-table audit](troop-table-audit.md) and [the latest lancer controls](lancer-controls.md).

## Current implementation

- Main Mk2 has guarded combined lancer timing and **provisional T12 FC10 lancer attack/health 3215/1008**, defense/lethality 10. This fits the original six calibration reports, but is not validated across the later reports. Legacy behavior remains separate.
- Replay seed is **timestamp + 1**. Inbox timestamps have no independently recorded seed, so keep `timestampStatus: "unverified"`; do not manufacture seed evidence or search seed offsets.
- T12 is FC10 only. Expert bonuses are already reflected in displayed stats according to the user; do not add a separate Expert combat effect.

## Next actionable correction

The original generator matches all supplied T1–T10 Points rows. Mk2's blanket floor override introduces **17 one-point differences across 12 T10 FC1–FC5 entries**, including lancer FC5 health **596 instead of 597**.

**This correction is tested in research but NOT applied to production.** Apply the supplied T10 FC1–FC5 Points values with a scoped regression test. The diagnostic override makes all **9/9 FC4/5 lancer reports exact** and preserves the original **160/160** survivor results. Do not globally replace floor with round: that leaves only **38/160** exact. Preserve legacy inputs and the 301 legacy reference expectations.

## Remaining mechanics work

- The FC4/5 controls support consuming Ambusher before Crystal Lance even without enemy marksmen. They cannot distinguish round-start Ambusher from immediately-before-attack timing.
- New FC10 controls currently match **0/2 T10** and **1/5 T11** reports. The discrepancy therefore exists without T12. Resolve Field behavior and high-FC coefficients against these known-troop cases before fitting T12 again.
- All six fixed Ambusher/Field/Lance orders plus the author's constrained `attack = 3 × health` fits leave FC10 mismatches. See saved results for search bounds; these are not proofs excluding other models.
- The table's T11 values differ substantially from the repo's Labyrinth-derived baseline. Its FC1–FC4 rows are not selectable player troops, and it provides no FC9/FC10 or T12 values. Do not treat it as a validated replacement for the current T11 extrapolation.

## Reproduction and data

Curated fixtures and results are committed under `research/mk2`; raw inbox exports remain ignored. The three lancer cohorts contain 6, 21, and 16 reports. Detailed earlier T12 fitting is in [the follow-up](lancer-followup.md).

```sh
npx tsx research/mk2/troop_table_audit.ts
npx tsx research/mk2/lancer_controls.ts --fit
npx tsx research/mk2/lancer_followup.ts --fit
```

Keep new documentation under `research/mk2`, except updates to README-like files. No deploy or merge is part of this handoff.

Pre-push validation: 234 engine tests and 104 dashboard tests passed; engine/dashboard typechecks and the four research-script typechecks passed.
