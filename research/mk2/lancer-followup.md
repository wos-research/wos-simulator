# Lower-tier reports: independent T12 lancer check — 2026-09-13

**New controls:** [16 additional FC4/5 and FC10 lancer reports](lancer-controls.md) strongly support Ambusher-before-Lance draws without Field. The current simulator matches 8/9 FC4/5 cases; a one-point FC5 health probe makes those 9/9. The new T10 FC10 cases also miss, so the remaining discrepancy is not confined to T11/T12 base stats.

All **21 new reports** were enabled by removing `.disabled` from their filenames, with contents unchanged. The batch spans 00:36:00–00:47:07 Europe/Berlin, including the reports just before the user's approximate 00:41–00:49 window. IDs are 000013, 000019 and 000022–000040. The unrelated older 000009 file remains disabled.

These reports help: they supply close wins and losses, put T12 lancers on defense, and include known-troop controls. The earlier six-report fit does not establish accurate predictions for this broader cohort. **No new stat coefficients or timing rules from this investigation were adopted into the main simulator.**

## Cohorts and replay conditions

- 13 hero-free, single-stack T10 FC0 infantry versus T12 FC10 lancer reports form the main fitting set. They share the same bonus profiles and vary troop counts, outcomes and timestamps.
- 1 T9 FC0 lancer versus T12 FC10 lancer report is an additional interaction check.
- 5 reports contain known troops with no T12: one T10 FC3 lancer control, one T10 FC9 lancer control and three T11 FC9 infantry controls.
- 1 report includes heroes/widgets; 1 has mixed infantry/lancer attackers. These run for completeness but are excluded from fitting.

Every replay and every fit candidate uses the supplied `timestamp + 1`, with no offsets, alternative seeds, outcome-driven combat corrections or simulation averaging. FC0 is represented by the existing IDs `infantry_t10` and `lancer_t9`. T12 remains FC10 only.

The exporter files were reread after the user's update; their predictive fields were unchanged at the final comparison. Older collector diagnostics flag Expert skills. The user clarified that these affect the already-displayed stats; they are not treated as an additional combat effect or a blocker here. Generic extra-soldier-skill flags alone also do not establish an omitted combat effect. No additional effects were invented from these flags.

The fixture removes army names and adds `timestampSource: "report-inbox"`. Its input hash is stored in the output. No raw account IDs, report IDs or private shares are included. The report exports do not supply independently recorded RNG seeds or proc counts.

## +20% retry

Against the **13 clean infantry-versus-T12 reports**, using existing production timing:

| T12 model | Attack | Health | Exact reports | Sum of absolute survivor errors |
|---|---:|---:|---:|---:|
| Previous six-report fit | 3215 | 1008 | 6/13 | 752 |
| +20%, rounded | 3109 | 1037 | 4/13 | 1117 |
| +20%, floored | 3109 | 1036 | 4/13 | 1178 |
| +20%, unrounded | 3109.2 | 1036.8 | 4/13 | 1124 |
| +20% before FC multiplier, then rounded | 3110 | 1037 | 4/13 | 1096 |

Defense and lethality remain 10. Applying +20% before the FC multiplier and flooring gives the same 3109/1036 pair as the floored row. This tests both the rounding choice and where the assumed increase is applied.

Moving Ambusher to round start, while leaving the rest of the engine unchanged, lowers total error but does not yield an exact cohort: rounded +20% gives 3/13 exact with total absolute error 613; floored gives 4/13 with error 676; unrounded gives 3/13 with error 621. Thus ordinary rounding choice alone does not resolve the discrepancy.

## Original author's stat fitter

The reproduction calls the unchanged `scripts/fit_enemy_base_stats.ts` `findBestEnemyBaseStats` function with timestamp-seeded scoring. Its constraint remains **attack = 3 × health**, with defense and lethality fixed at 10. It fits only the 13 clean infantry-versus-T12 reports; no T12-free controls, hero cases, mixed cases or old six cases enter the objective.

Health is searched from 950 to 1150 in steps of 0.1, then each selected optimum is refined within ±0.1 in steps of 0.001. The extra decimal places describe a numerical search, not recovered game precision. Both the author's default bias objective and mean absolute error (MAE) are reported. Bias can cancel positive and negative errors, so every result includes per-case errors and exact-match counts.

| Timing | Objective | Fitted attack | Fitted health | Exact clean reports | Total absolute error | Old six still exact |
|---|---|---:|---:|---:|---:|---:|
| Current | MAE | 3130.209 | 1043.403 | 2/13 | 326 | 5/6 |
| Current | Bias | 3135.198 | 1045.066 | 3/13 | 402 | 5/6 |
| Round-start Ambusher | MAE | 3124.647 | 1041.549 | 6/13 | 163 | 5/6 |
| Round-start Ambusher | Bias | 3123.312 | 1041.104 | 5/13 | 186 | 5/6 |

The best MAE result is close to a 20% upgrade on the current T11 baseline, but it still misses seven clean reports and one of the old six. It is not a replacement for the provisional catalogue coefficients.

A broader exploratory check also tested the 62 previously exact stat pairs under all six fixed per-round permutations of Ambusher/Field/Lance, plus two variants that skip Ambusher when there is no marksman target. None matched all 13 new clean reports; the best exact count was 8/13. A coarse independent attack/health scan of 3528 candidates across those schedules also had no exact cohort. The [exploratory search artifact](reports/lancer-followup-searches.json) records the per-schedule results and scan ranges. These bounded searches do not prove that no other model or coefficient pair can fit; they show why picking another equally exact old pair is insufficient.

## Known-troop controls reveal a separate calibration issue

The existing model matches case 000019 (T10 FC0 infantry versus T10 FC3 lancers) exactly: 2495 attacker survivors. It misses case 000034 (T10 FC9 lancers): 15490 versus 15486 observed.

It also misses all three T11 FC9 infantry controls:

| Case | Observed attacker survivors | Current model |
|---|---:|---:|
| 000033 | 12951 | 13000 |
| 000035 | 34573 | 34603 |
| 000037 | 12489 | 12631 |

A shared effective infantry coefficient pair **attack 854.6 / health 2563.8**, retaining defense/lethality 10 and the current skill rules, reproduces all three exactly. The current catalogue uses **831 / 2492**. This check also uses the original fitter, swapping its lancer attack/health family for infantry, with infantry attack 800–880 in steps of 0.05.

That is evidence to investigate the existing T11 FC9 baseline and its mechanics before defining T12 as a percentage above T11. It is not proof that 854.6/2563.8 are the actual server stats: fitted coefficients can absorb an incorrect skill or damage rule. The simulator's T11 FC0 anchor comes from Labyrinth and is extrapolated to player FC tiers; these new controls test that extrapolation. A simple switch to 5% FC growth beyond FC7 did not resolve these controls either.

## Per-report results

`A` means attacker survivors; `D` means defender survivors. The other side has zero survivors. All predicted winners match the reports, but exact survivor counts do not. The fitted column uses the round-start MAE result, without applying the separate T11 control fit.

| Case | Group | Report | Previous model | +20% | Author fit + round-start Ambusher |
|---|---|---:|---:|---:|---:|
| 000013 | infantry-vs-t12 | A 37928 | A 37966 | A 38006 | A 37898 |
| 000019 | known-troop-control | A 2495 | A 2495 | A 2495 | A 2495 |
| 000022 | infantry-vs-t12 | D 589 | D 589 | D 589 | D 589 |
| 000023 | infantry-vs-t12 | D 59 | D 59 | D 57 | D 57 |
| 000024 | infantry-vs-t12 | D 475 | D 476 | D 476 | D 474 |
| 000025 | infantry-vs-t12 | A 10120 | A 10389 | A 10423 | A 10044 |
| 000026 | infantry-vs-t12 | D 453 | D 453 | D 453 | D 453 |
| 000027 | infantry-vs-t12 | D 166 | D 164 | D 163 | D 166 |
| 000028 | infantry-vs-t12 | A 14362 | A 14615 | A 14745 | A 14355 |
| 000029 | lancer-vs-t12 | D 388 | D 384 | D 384 | D 389 |
| 000030 | infantry-vs-t12 | D 267 | D 267 | D 266 | D 267 |
| 000031 | infantry-vs-t12 | D 217 | D 219 | D 218 | D 216 |
| 000032 | infantry-vs-t12 | A 23897 | A 24084 | A 24242 | A 23943 |
| 000033 | known-troop-control | A 12951 | A 13000 | A 13000 | A 13000 |
| 000034 | known-troop-control | A 15486 | A 15490 | A 15490 | A 15495 |
| 000035 | known-troop-control | A 34573 | A 34603 | A 34603 | A 34603 |
| 000036 | infantry-vs-t12 | D 265 | D 265 | D 265 | D 265 |
| 000037 | known-troop-control | A 12489 | A 12631 | A 12631 | A 12631 |
| 000038 | heroes | A 46922 | A 47017 | A 47056 | A 47151 |
| 000039 | infantry-vs-t12 | D 26 | D 26 | D 26 | D 26 |
| 000040 | mixed | A 44431 | A 44433 | A 44436 | A 44430 |

## Reproduce and next steps

From the repository root, after installing simulator dependencies:

```sh
simulator/node_modules/.bin/tsx research/mk2/lancer_followup.ts
simulator/node_modules/.bin/tsx research/mk2/lancer_followup.ts --fit
```

The first command reruns the saved reports against the previous coefficients and all +20% variants. `--fit` also runs the original author's two objectives and the T11 control check. Outputs stay under `research/mk2/reports/`; [the full saved result](reports/lancer-followup-fit.json) contains every comparison and fitting residual.

The next useful investigation is to validate the existing FC9/T11 baseline and determine the remaining Field/Lance interaction, then rerun both report cohorts together. Actual skill activation counts and raw seed fields from these already-collected reports would discriminate timing models more directly than additional copies of the same one-sided fight. The existing reports are useful evidence and stay enabled; no new battles are required merely to repeat this analysis.
