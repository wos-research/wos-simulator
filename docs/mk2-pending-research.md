# Pending mixed-skill research — September 13, 2026

The additional [13 report fixtures](../testcases/mk2/research_pending_20260913.json) preserve completed research that has **not been implemented in the current Mk2 kernel**. They contain unchanged predictive army inputs, recorded seeds, captured survivors and explicit skill activation counts. No expected result was generated from a candidate model. They are separate from the passing campaign collection.

Together with the previously published [first C2 report](../testcases/mk2/unresolved_c2_20260913.json) and [first E1 report](../testcases/mk2/unresolved_e1_20260913.json), the shared repository now exposes all15 planned reports in these two research cohorts. The original two IDs and records are retained without duplication. Statements in earlier campaign checkpoints that four reports remained held out describe that earlier stage; those reports have since been released and analyzed as described here.

| Cohort | Captured marches | Reports now represented | Current kernel exact | Private fixed candidate exact |
|---|---|---:|---:|---:|
| E1, no Shield |500 T5 FC4 Lancers +500 T7 FC3 Marksmen versus1000 T5 FC1 Infantry; five each role|10|0/10|VL1:10/10|
| C2, with Shield |500 T5 FC4 Lancers +500 T7 FC3 Marksmen attack1000 T5 FC5 Infantry|5|0/5|VC_BEFORE_GP:5/5|

Exact means the winner, all six survivor counts and every relevant explicitly observed chance-skill activation count agree. E1 has three sources: Lance10%, Volley10%, Gunpowder20%. C2 adds Shield37.5%. Missing counters remain unknown; explicit zeroes remain zero. Several E1 survivor predictions agree while proc counts disagree, so survivor-only agreement is insufficient.

## What the private candidates do

**E1 VL1:** reserve the living Marksman's Volley draw immediately before the same side's normal Crystal Lance draw, then apply its cached result at the existing Marksman attack slot. Other stats, probabilities, targeting and scheduling remain fixed. The first report was development evidence; four forward reports and five opposite-role reports were subsequently evaluated under the unchanged candidate with chronological first-case gates and explicit release of the remaining cases. The ten reports include unused failed reservations, but no unused successful reservation. Whether an unused successful reservation should count as a Volley activation remains untested. This prevents treating every behavior in the proposed scope as established.

**C2 VC_BEFORE_GP:** reserve live Volley immediately before normal Lancer-triggered reactive Shield, retain the existing Marksman application slot, and extend the previously tested Gunpowder deferral into this exact mixed context. The candidate changes no seed, probability, coefficient, troop count or damage target. It was fixed before evaluation on the already-open first C2 diagnostic; its match there is development evidence. The remaining four originally held-out reports then matched without further adjustment. The five reports have no unused reservation, so they do not settle cancellation accounting. Fresh opposite-role confirmation in the exact FC4 profile and relevant boundary checks are still required before a production decision. Upgraded troop buildings must not silently substitute FC5 profiles for these FC4 experiments.

These results support specific candidate comparisons within the tested model. They do not uniquely reveal server internals, establish all possible skill interactions, or authorize a general ordering rule. The private candidate adapters and full traces are retained in the local research archive; this supplement supplies reproducible current-kernel failures and the documented candidate outcomes, not runnable candidate implementations.

## Fixture identity and validation

New IDs001–004 are the four C2 confirmations,005–008 the four E1 forward confirmations, and009–013 the five E1 reverse reports. Each ID begins `mk2-research-pending-20260913-`. Separate fights remain separate rows even when their inputs or observations coincide. Account names/IDs, mail IDs, formation IDs, device ports, raw packets and screenshots remain private. Private mapping and integrity records connect each anonymized fixture to its captured report and preserved input.

Direct-wire audits retained all captured modifiers, expert context, explicit counters and empty hero/extra-effect fields. The malformed80,100-troop C2 setup remains privately quarantined by composition and is not one of these15 planned reports. It was not excluded because of its result.

Run from the repository root:

```sh
node --import ./simulator/node_modules/tsx/dist/loader.mjs scripts/run_testcases.ts --testcase-root testcases/mk2 --matching research_pending_20260913 --workers 1 --human
```

Verified through the normal loader against `expedition-mk2-lua54-catalogue-13`: **13 executed,13 expected mismatches,0 passes,0 processing errors,13 existing unsupported mixed-timing warnings; exit status1**. Adding these records does not increase the passing total. Running the entire Mk2 testcase directory includes these known failures.

The latest five T10 FC5 Lancer health reports are a separate passing campaign addition: both fixed596/597 health alternatives match allfive, so they provide no discriminating health evidence yet. No health correction or mixed-ordering candidate is promoted by this supplement. Recorded-seed replay also remains distinct from independently deriving the seed from battle time.
