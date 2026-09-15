# Scoped ordering checkpoint — 461 captured reports

Mk2 catalogue17 reproduces all **461 reviewed reports exactly using their recorded seeds**, compared with403 under catalogue16. Exact means the winner, all six survivor values and every explicitly captured supported chance-skill activation count:461 winner checks,2,766 survivor checks and1,004 counter checks. Missing counters are not inferred as zero. The original160 controlled reports still match.

Three additions address the58 previous failures. Their guards pin the tested troop profiles, counts, army modifiers, skill definitions and mechanic settings. No troop stats, damage coefficients, probabilities, report observations or seeds changed.

| Added scope | Captured armies | Evidence and behavior |
|---|---|---|
| Four-source AV |100 T10 FC5 Lancers +100 T7 FC3 Marksmen versus500 T5 FC1 Infantry; both tested roles/modifier sets |10 reports: reserve Volley after Ambusher and before Crystal Lance; use the cached result at the existing Marksman slot. Previous kernel2/10; now10/10. |
| Older FC4 E1/C2 |500 T5 FC4 Lancers +500 T7 FC3 Marksmen versus1,000 T5 FC1 Infantry in both tested roles, or attacking1,000 T5 FC5 Infantry |15 reports: reserve Volley before Lance; in the Shield cohort reserve before normal reactive Shield and defer Gunpowder in that exact context. Previous kernel0/15; now15/15. The opposite-role FC5 Infantry cohort remains outside the guard. |
| Infantry-five |500 T5 FC5 Lancers +5 T7 FC3 Marksmen versus5 T5 FC5 Infantry; five exact captured role/modifier groups |35 reports: reserve Volley before normal Lancer-triggered Shield/Lance, retain the Marksman application slot and scoped Gunpowder deferral. Previous kernel0/35; now35/35. |

These additions change60 reports' replay wrappers, including two four-source reports that already matched observed totals. All401 reports outside the new guards preserve complete results, RNG traces and warnings, apart from the shared global version label. The scopes are disjoint. Each of the60 proposed replays matches its independently reviewed standalone candidate's complete shared and research output.

## Evidence limits

The reports distinguish the frozen ordering candidates within their captured contexts. They do not expose every server RNG call or prove a universal rule. The development reports and subsequent independent confirmations remain distinguished in the historical research notes. Regression preservation is compatibility evidence, not proof of a new mechanic.

These three additions preserve existing trigger-only accounting for a reserved successful Volley whose attack never happens. None of these cohorts supplied the successful-unused witness needed to settle that accounting rule. Their metadata explicitly says `unusedSuccessRuleValidated: false`; they add no untested terminal credit. Earlier E1 and Infantry-one rules retain their separately supported accounting behavior.

Recorded seeds remain necessary for exact replay. Fixture timestamps marked `derived-report-seed-minus-one` are constructed from those seeds, not independent seed evidence. New mirror reports also contradict a universal integer march-trigger timestamp plus one: six recorded seeds were trigger time plus one and four equaled trigger time. This does not identify the actual seeding event or establish an alternative formula.

Higher tiers/FC levels, other modifiers/combinations and heroes remain unvalidated. The four-source hook accepts the equivalent default dashboard representation of its exact armies; the FC4 and Infantry-five guards retain the strict captured-input shape. A nearby or differently represented army can therefore remain outside those guards.

## Reproduce

All461 anonymized report fixtures already exist under `testcases/mk2/`; this update does not duplicate them. Original raw packets, character identifiers and private provenance remain local. `simulator/src/mk2/scoped_ordering.test.ts` identifies the60 existing fixtures and checks observations, reference switches, scope exclusions, dashboard representation and synthetic reservation lifecycle behavior.

From the repository root:

```sh
node --import ./simulator/node_modules/tsx/dist/loader.mjs --test "simulator/src/**/*.test.ts"
node ./simulator/node_modules/typescript/bin/tsc --noEmit --project simulator/tsconfig.json
node --import ./simulator/node_modules/tsx/dist/loader.mjs scripts/run_testcases.ts --testcase-root testcases/mk2 --workers 1 --human
```

For an affected fixture, replay options `fourSourceVolley`, `fc4Volley` or `inf5Volley` accept `"reference"` to disable that addition. These options belong at the replay top level, not inside `replay.mechanics`.

Installed-runtime validation passed:335 simulator tests (including301 legacy outcome fixtures and the original160 controlled reports),104 dashboard tests, simulator TypeScript checking and production dashboard build. All461 fresh shared/research replays equal the frozen candidate archives; only the shared version label changes. The normal CLI also confirms461/461 controlled reports with zero processing errors.

The broad CLI command above additionally visits the separate56-entry `report_inbox_20260913.json`:29 execute,13 disagree with game results and27 cannot run because their profiles are unsupported. It therefore exits1. Those external reports are preserved and are not included in this controlled checkpoint; do not interpret461/461 as a claim that every file in this directory passes. The [per-report results manifest](../research/mk2/mk2-ordering-v17-checkpoint-20260913.json) identifies all461 checked cases and pins their22 existing fixture files.
