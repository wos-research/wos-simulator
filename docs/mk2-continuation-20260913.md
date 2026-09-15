# Captured continuation: twenty additional reports

This evidence-only update brings the published corpus to **401 distinct reports: 347 exact under the unchanged catalogue14 kernel and 54 pending**. No combat, RNG, troop-stat, or hero behavior is changed. Rollback remains abandoned; specific new kernel changes require the user's explicit approval.

The [20 fixtures](../testcases/mk2/continuation_20260913.json) preserve captured armies, modifiers, recorded seeds, winner, all six survivor counts and every required explicit chance-skill activation count. The [historical comparisons](../research/mk2/continuation_results_20260913.json) retain experimental predictions separately from current-kernel results.

| Cohort | Reports | Current exact | Fixed experimental comparison |
|---|---:|---:|---|
| T7 FC4 Marksmen versus FC5 Infantry, reverse health control | 5 | 5 | Original-health-only alternative 0/5 |
| FC5 Lancers/FC3 Marksmen versus FC5 Infantry, first pair forward | 5 | 0 | U0 and U1 both 5/5 |
| Same armies, first pair reverse | 5 | 0 | U0 and U1 both 5/5 |
| Same profiles, second pair additional forward | 5 | 0 | U0 and U1 both 5/5 |

The fifteen C2 reports exercise Crystal Lance, Volley, Crystal Gunpowder and opposing Crystal Shield. The frozen candidate reserves a live Volley roll before reactive Shield/Lance while retaining its prior Gunpowder deferral. U0 and U1 have identical battle execution and RNG draws; they differ only in whether a successful unused reservation counts as a reported Volley activation. **None of these fifteen contains that distinguishing event**, so they support the ordering comparison but do not settle unused-success accounting with Shield. These candidates remain outside the active kernel.

Both latest C2 batches recorded a decrease of 500 in each of the Infantry side's sixteen raw modifier fields relative to the prospective baseline. The replay uses each report's actual normalized modifiers, independently reconstructed from those raw fields. No adjustment was made to recover a match. Expert context, troop profiles and the four chance sources remained unchanged. The cause of the modifier change is not established by this audit.

The five historical health controls are preserved as fixed comparisons, not unique proof of a coefficient or authorization to change established source values. They complete the reverse batch noted as private in the preceding checkpoint. No additional health experiments were dispatched for this update.

Separately, the fifteen earlier E1 reports now have a private, unapplied proposal for their exact tested army counts and normalized modifiers: reserve Volley before Lance and count a successful unused reservation. It matches all fifteen, versus one under the active kernel. The E1 observable and labelled-RNG conclusions also survive a fixed comparison using both the joint current and original participating troop catalogues. That robustness check does not extend the rule to Shield, Ambusher, different armies or heroes, and does not uniquely identify server internals.

All packet captures were finalized before decoding, with stopped capture processes and matching stable remote/local hashes. Independent raw review checked 20 reported seeds, 120 survivor slots and 75 explicit activation counts. Missing values remain unknown. Mail copies were linked using independent battle timing and march identity; separate fights were not merged merely because combat contents matched.

Raw captures, identities, private account/device details and screenshots remain private. Diagnostic timestamps derive from the reported seed minus one; timestamp-to-seed inference remains unresolved.

From the repository root:

```sh
node --import ./simulator/node_modules/tsx/dist/loader.mjs scripts/run_testcases.ts --testcase-root testcases/mk2 --matching continuation_20260913 --workers 1 --human
```

Expected catalogue14 result: 20 executed, 5 exact, 15 known mismatches, zero processing errors. The expected mismatch exit status does not mean the pending cases passed.
