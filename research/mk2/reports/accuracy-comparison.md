# WOS Mk2 replay accuracy comparison

Tested 2026-09-12 against commit `680c8dd1c7c930adc27f41aa480019e53af64cc4` on `codex/mk2-controlled-replay`.

**The 160/160 recorded-seed replay claim reproduces exactly. This five-run comparison does not demonstrate an overall winner or survivor prediction improvement when the historical seed is unavailable.**

| Metric | Mk2, recorded seed | Normal, five seeds per report | Mk2, five unrelated seeds per report |
|---|---:|---:|---:|
| Simulation runs | 160 | 800 | 800 |
| Correct winner, using majority for five-run groups | 160/160 | 158/160 (98.75%) | 158/160 (98.75%) |
| Individual runs with correct winner | 160/160 | 785/800 (98.125%) | 784/800 (98.0%) |
| Exact winner + all six survivor counts | 160/160 | 3/800 | 4/800 |
| Exact winner + survivors + recorded skill counts | 160/160 | 0/800 | 0/800 |
| Mean survivor error, troops | 0 | 231.15 | 235.98 |
| Mean survivor error / initial combined troops | 0% | 1.854% | 1.898% |
| Median survivor error, troops | 0 | 76.90 | 79.00 |
| Mean total skill-activation count error per report | 0 | 6.475 | 5.131 |

For sampled runs, survivor error compares the mean prediction across five runs with the recorded result, sums absolute errors across the six attacker/defender × infantry/lancer/marksman counts, then averages equally across the 160 reports. It is not error per individual troop-type cell. Skill error uses the same five-run averaging and sums errors across all recorded chance-skill counts for each report. The exact-match rows score individual runs.

Mk2 with unrelated seeds was closer on survivor counts in 78 reports; the normal engine was closer in 82. Its mean survivor error was approximately 2.1% higher in this sample. The mean per-run survivor error was almost identical: 285.64 troops for normal and 285.62 for Mk2. Average skill-count error fell by approximately 20.8% (6.475 to 5.131). These results support better skill-count modeling within these controls, but five samples per report are too few to establish small differences reliably.

## What was verified

- The shipped Mk2 suite passed **191/191 tests**, with zero failures, skips, or TODOs in this portable suite. This includes the 160 replay assertions, 145 saved native Lua RNG vectors, reference-mode preservation, and snapshot/hash/hook-reversal checks.
- The shipped validator independently reported **160/160 exact**, covering 65 one-source, 75 two-source, and 20 three-source reports.
- A separate comparison harness checked every winner and all six survivor counts without using the shipped `compare` or `audit` functions. It independently mapped the game skill IDs and confirmed **275/275** recorded per-side skill activation counts for Mk2.
- The normal engine was loaded directly from `simulator/src`, using its normal config loader and `prepareBattle` / `runPrepared`. No Mk2 mechanics or extension configuration were injected into this baseline.
- The normal engine independently matched **301/301 saved reference outcomes**, including winner, survivor counts, and rounds, using the reference fixture seed. These are preservation checks against saved simulator outputs; they do not provide 301 additional game-accuracy tests.
- All 64 files in the pinned upstream manifest equal the current normal source after reversing the five documented Mk2 hook patches and normalizing line endings. The byte hashes differ because the pinned copy uses different line endings.

## Scope and interpretation

The 160 controlled reports contain **34 distinct troop/stat battle inputs** and **156 distinct input/mechanics/timestamp requests**. All battles are hero-free, use only T5/T7 troop IDs (including FC variants), and include one to three random skill sources. They do not establish accuracy for heroes, T11/T12, all troop tiers, or untested mixed-tier stacks. The cohort named “Lance + Gunpowder” does not itself validate mixed tiers within a troop type.

Mk2 receives the recorded seed indirectly as `timestamp = reportedSeed - 1`. That information allows it to reconstruct the historical RNG stream. Neither expected survivor counts nor observed skill activations were supplied to the replay function. Matching those results is strong evidence of replay consistency for the supplied controls, but the exported data does not establish an independent held-out evaluation or verify the anonymized observations against private raw traffic.

The normal core also supports fixed seeds; omitting a seed uses `simulator-default`, so repeated calls without a changing seed would not average away RNG. This comparison explicitly supplied five different seeds per report. Each seed is derived from a fixed SHA-256 label independent of expected outcomes; no seeds were searched or selected for favorable results. The unrelated-seed Mk2 control uses the same five numeric seed labels through its Lua RNG. Different RNG algorithms produce different streams even with the same numeric seed.

Five runs reduce some simulation noise, but a single observed fight can be a rare result even when a model predicts its distribution correctly. These five runs are not a confidence interval. The reported percentages and errors describe this sample, and small differences should not be treated as statistically established. Repeated reports share 34 input profiles and are not 160 independent battle configurations.

## Cohort survivor errors

Each value is the mean error of the five-run mean prediction in troops, using the six-count metric defined above. Mk2 with the recorded seed has zero error in every cohort.

| Cohort | Reports | Normal | Mk2, unrelated seeds |
|---|---:|---:|---:|
| Ambusher / depletion | 10 | 267.24 | 374.90 |
| Ambusher | 10 | 418.60 | 399.40 |
| Ambusher + Volley / depletion | 10 | 1265.52 | 1252.64 |
| Ambusher + Volley | 10 | 318.78 | 328.42 |
| Gunpowder FC3 | 25 | 31.04 | 27.94 |
| Lance → Shield | 10 | 81.80 | 95.58 |
| Lance + Gunpowder | 10 | 14.68 | 14.10 |
| Shield → Lance | 10 | 46.16 | 28.58 |
| Three chance sources | 10 | 470.96 | 473.94 |
| Two chance sources | 15 | 161.76 | 126.07 |
| Volley + Gunpowder | 10 | 48.26 | 46.06 |
| Volley + Gunpowder + Shield | 10 | 112.80 | 106.88 |
| Volley | 10 | 274.70 | 353.80 |
| Volley + Shield | 10 | 58.68 | 42.36 |

## Two winner disagreements

Both sampled engines missed the same two recorded winners, and all five sampled runs chose the opposing winner in each case:

- `mk2-022`: the game observation has the defender winning with 1,397 infantry remaining; the normal five-run mean instead has 1,894 attacking lancers remaining.
- `mk2-029`: the game observation has the attacker winning with 2,164 infantry remaining; the normal five-run mean instead has 1,951 defending lancers remaining.

Both belong to Ambusher + Volley / depletion. Mk2 reproduces both recorded outcomes exactly when given their historical seeds.

## Reproduce and inspect

The committed sources were exported into `/private/tmp/wos-mk2-accuracy-20260912`. The original checkout was not modified. The tests and final comparison used Node.js `v22.22.3` and the package-locked `tsx` version `4.23.12`. An initial run with locally available `tsx 4.22.1` produced identical per-run results; installing the locked version did not change any comparison result.

The commands below use the tsx Node loader directly because the tsx CLI’s IPC socket is blocked by the execution sandbox. They run the same test files and validator as the package scripts.

```sh
cd /private/tmp/wos-mk2-accuracy-20260912/research/mk2
node --import ./node_modules/tsx/dist/loader.mjs --test *.test.ts
node --import ./node_modules/tsx/dist/loader.mjs validate.ts
node --import ./node_modules/tsx/dist/loader.mjs /Users/pcb/Documents/wos_projects/artifacts/wos-mk2-accuracy-20260912/compare.mts /private/tmp/wos-mk2-accuracy-20260912 /Users/pcb/Documents/wos_projects/artifacts/wos-mk2-accuracy-20260912
```

Fixture SHA-256: `84f4371fccffe2ff3a7723b61dc93daf314c103261506f1805424acd237f1272`.

- `compare.mts`: independent reproducible comparison harness.
- `results.json`: all 1,760 scored runs with seeds, survivors, winners, rounds, per-skill counts, cohort summaries, and normal-engine reference checks.
- [Per-case comparison](accuracy-cases.md): compact table for all 160 reports.
- `mk2-tests.log`: successful locked-dependency test run.
- `mk2-validation.log` and `official-validation-results.json`: shipped validator output.
- `comparison.log`: successful locked-dependency comparison output.

The raw comparison harness, JSON results, and logs remain in `/Users/pcb/Documents/wos_projects/artifacts/wos-mk2-accuracy-20260912`.
