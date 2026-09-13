# Mk2 captured-report checkpoint: 451 reports

The unchanged catalogue16 kernel matches 393 of 451 independently reviewed seeded reports exactly. All 451 winners match. Of the 58 incomplete matches, 42 differ only in explicitly recorded skill activation counts and 16 also differ in survivor counts. The original 160 controlled reports remain exact; the additional failures come from expanded test coverage.

This evidence-only update adds ten distinct battles, including all ten active-kernel mismatches. It changes no simulator source, stats, probabilities or mechanics.

## Five-Infantry reverse batch

Five T5 FC5 Infantry attacked 500 T5 FC5 Lancers plus five T7 FC3 Marksmen, without heroes. All five reports have the expected winner and survivors under the active kernel, but different skill activation counts.

The previously frozen ordering candidate matches all five under both unused-success accounting alternatives. These reports therefore support that scoped ordering comparison but do not distinguish whether a successful reserved Volley should be counted when its attack never happens. No such successful unused reservation occurs in the matching candidate's traces. The installed one-Infantry correction has not been extended to this five-Infantry context.

Fixtures: `testcases/mk2/c2_five_infantry_reverse_20260913.json`. Recorded active and experimental comparisons: `research/mk2/c2_five_infantry_reverse_results_20260913.json`.

## Reverse four-source batch

500 T5 FC1 Infantry attacked 100 T10 FC5 Lancers plus 100 T7 FC3 Marksmen, without heroes. This combines Ambusher, Crystal Lance, Volley and Gunpowder. The active kernel matches zero of five reports exactly. Three reports differ by one Lancer survivor; two retain the correct survivors but differ in skill counts. All five winners match.

The candidate frozen before this batch that reserves Volley after Ambusher and before Crystal Lance matches all five reverse reports. Combined with the five forward reports, it matches 10/10, versus 2/10 for the active kernel and 1/10 for reserving Volley before Ambusher. Both unused-success accounting alternatives still match 10/10: the matching candidate has no successful unused reservation in these reports. The ordering comparison has therefore gained reverse-role support, while that accounting boundary remains unresolved. The candidate is not installed or counted in the active match rate.

Fixtures: `testcases/mk2/four_skill_reverse_pending_20260913.json`. Active comparisons: `research/mk2/four_skill_reverse_results_20260913.json`.

## Remaining active mismatches

| Captured group | Reports not matching |
| --- | ---: |
| Earlier FC4 mixed-skill combinations | 15 |
| FC5 mixed armies against five FC5 Infantry | 35 |
| Four-source Lancer/Marksman combination, both roles | 8 |

## Verification and limits

For the ten additions, independent review checked the raw packets against ten recorded seeds, 60 survivor slots, 40 explicit skill counts, all 320 raw modifier fields and 240 normalized stat axes. Expert context matches the frozen baselines. Public fixtures retain the predictive inputs and observations exactly; identities, device paths and raw packet mappings remain private.

Both new fixture files run through the normal testcase loader with zero processing errors and the expected five mismatches each. The nonzero exit codes are retained as known combat mismatches, not described as passing tests. Earlier catalogue16 validation remains documented in `mk2-c2-checkpoint-20260913.md`; no runtime code changed in this update.

An exact match refers to captured winner, survivors and explicit supported chance-skill counts. It does not uniquely prove the server's internal event sequence. Recorded-seed replay remains distinct from independently deriving the seed from battle time. Untested profiles, modifiers, combinations and heroes are not covered by these observations.
