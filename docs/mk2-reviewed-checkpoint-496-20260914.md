# Reviewed controlled evidence: 496 reports

The reviewed controlled corpus contains **496 reports: 471 exact and 25 pending against active catalogue17**, with **487 correct winners**. This additive checkpoint carries forward the [486-report checkpoint](mk2-reviewed-checkpoint-486-20260914.md): its 471 exact reports and 481 correct winners have not been rerun here. The latest ten add zero exact reports and six correct winners. The external inbox is unchanged.

| New cohort | Reports | Active exact | Active correct winners | Frozen private exact |
|---|---:|---:|---:|---:|
| Ambusher source death, mixed attacker | 5 | 0 | 2 | 5 |
| Opposing T10 Lancers, new context, forward | 5 | 0 | 4 | 5 |

All twenty-five mismatches remain pending. Private comparison models are not installed, and no kernel change or full-corpus rerun is claimed. The figures below are derived from each original comparator and independently reproduced with the unchanged shared kernel.

| Cohort / suffix | Observed winner | Active H0 winner | Active exact | Active winner correct | Frozen private exact |
|---|---|---|---:|---:|---:|
| Source death reverse / 001 | defender | attacker | 0 | 0 | 1 |
| Source death reverse / 002 | attacker | attacker | 0 | 1 | 1 |
| Source death reverse / 003 | attacker | attacker | 0 | 1 | 1 |
| Source death reverse / 004 | defender | attacker | 0 | 0 | 1 |
| Source death reverse / 005 | attacker | defender | 0 | 0 | 1 |
| T10 forward / 001 | defender | defender | 0 | 1 | 1 |
| T10 forward / 002 | attacker | defender | 0 | 0 | 1 |
| T10 forward / 003 | defender | defender | 0 | 1 | 1 |
| T10 forward / 004 | attacker | attacker | 0 | 1 | 1 |
| T10 forward / 005 | defender | defender | 0 | 1 | 1 |

Each new fixture retains its original recorded packet seed, independently captured integer notification/march timestamp, six survivor slots and four explicit activation counts, including zeros. Raw modifier, expert and troop-profile evidence is allowlisted and anonymized. Account names, UIDs, device serials, coordinates, original report/mail IDs, capture paths and packet captures are excluded; retaining exact times and seeds does not guarantee unlinkability. Each public replay supplies the recorded seed explicitly. All ten new timestamp-plus-one relations pass descriptively; the two earlier checkpoint-486 exceptions remain preserved and this relation is never used to adjust seeds or exclude reports. Source-death seed-derived adapter timestamps are separately labelled as provenance.

The source-death reverse cohort has 100 T5 FC3 Marksmen plus one T10 FC5 Lancer attacking 100 T5 FC5 Lancers. Frozen R1 and G1 match all five; R0 and G0 match winners and survivors but miss successful post-death Ambusher credits. Their additional credits are 3, 7, 8, 5 and 4 respectively. Full G0/G1 gameplay and RNG results agree apart from the declared activation credit; full R1/G1 numerical comparisons also agree after excluding diagnostic metadata and phase labels. These reverse cases cannot uniquely identify physical roll placement. The opposite direction previously separated those models, with G1 exact in all five; across both source-death directions G1 is exact in ten reports, while the prior forward fifth retains its timestamp discrepancy.

G0/G1 reserve the Ambusher roll before the first attack, including the living-source first round, and materialize a living-source effect at the original Lancer trigger. Their follow-up design was frozen after the first forward diagnostic failed, based on a source audit predating that outcome. Forty fixed arbitrary-seed role scenarios preceded that follow-up evaluation. The reverse candidate files remained frozen before any reverse model-level outcome release. Each cohort released one chronological diagnostic before its four confirmation outcomes. Collection UI summary screens were seen operationally; model-level seeds, proc counts and outcomes were inspected only after the corresponding releases. No fitting of seeds, stats, probabilities or permutations was performed.

The T10 forward cohort has 100 T10 FC5 Lancers on each side, no heroes and its exact exported modifier and expert context. Frozen candidate and reference match all five full battle and native-RNG results; H0 matches none exactly. This cohort concerns the new-context forward guard and does not establish behavior in arbitrary actor contexts. All model failures remain in the result files.

Verification covers ten native recorded seeds, 60 survivor fields and 40 explicit counters. Exported shared-kernel replay reproduces all ten original H0 comparisons. The ordinary testcase CLI reports ten expected mismatches, zero errors and zero timestamp warnings (exit status 1). Frozen source and artifact hash checks are retained privately.

```sh
node --import ./simulator/node_modules/tsx/dist/loader.mjs scripts/run_testcases.ts --testcase-root testcases/mk2 --matching mk2-ambusher-source-death-reverse-20260914 --workers 1 --human
node --import ./simulator/node_modules/tsx/dist/loader.mjs scripts/run_testcases.ts --testcase-root testcases/mk2 --matching mk2-opposing-t10-lance-forward-20260914 --workers 1 --human
```

Each command should report five mismatches. See the [machine-readable checkpoint](../research/mk2/reviewed-checkpoint-496-20260914.json), [active replay](../research/mk2/latest-ten-active-replay-20260914.json), [source-death comparisons](../research/mk2/mk2-ambusher-source-death-reverse-20260914_results.json), and [T10 comparisons](../research/mk2/mk2-opposing-t10-lance-forward-20260914_results.json).
