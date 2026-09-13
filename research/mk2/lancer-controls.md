# FC4/5 lancer controls and FC10 baselines — 2026-09-13

**Points-table follow-up:** The user's table confirms T10 FC5 lancer health 597. The [table audit](troop-table-audit.md) shows that the original generator already returns this value; Mk2's floor override causes 596 and 16 other one-point T10 cell differences. A T10-only table override retains all 160 earlier exact survivor results and makes these nine FC4/5 cases exact. This remains a research comparison; production coefficients are unchanged.

The new inbox batch contains **16 reports**, all with hero-free T10 FC0 infantry attacking a single lancer stack. The actual exported troop IDs are authoritative: seven defenders are T10 FC4, two are T10 FC5, two are T10 FC10, and five are T11 FC10. There are no FC6 or T12 troops in this batch. All files were already enabled; no inbox files were renamed or edited.

These reports substantially narrow the investigation. **The current simulator matches 8/9 FC4/5 reports, with one survivor of total error.** A research-only change from 596 to 597 health for T10 FC5 lancers makes all nine exact. However, the new T10 FC10 controls also miss, so an incorrect T12 stat estimate—or a T11-only baseline problem—cannot explain all remaining errors.

No production mechanics or troop coefficients were changed during this investigation. The one-point FC5 candidate and the FC10 fits below remain diagnostics, not recovered server constants.

## Inputs and reproducibility

The [fixture](fixtures/lancer-fc45-controls.json) removes army names, retains every predictive input and observed total, and adds `timestampSource: "report-inbox"`. The user-supplied seed rule remains **timestamp + 1**. Every hypothesis uses that same stream for a given report: no seed offsets, best-seed selection, or simulation averaging.

The exports contain neither independently recorded seeds nor skill activation counts. Native replay metadata therefore remains `timestampStatus: "unverified"`. The explicitly labelled custom-RNG experiments assign projected Lua draws to different skill checks; their execution metadata remains custom, and the research output separately records the real seed and schedule. They are not presented as independently verified historical replays.

Run from the repository root after installing simulator dependencies:

```sh
simulator/node_modules/.bin/tsx research/mk2/lancer_controls.ts
simulator/node_modules/.bin/tsx research/mk2/lancer_controls.ts --fit
```

The first command runs both native timings, the skill-order hypotheses, and coefficient/precision probes. `--fit` also calls the unchanged original author's fitter. The [saved complete result](reports/lancer-controls-fit.json) includes fixture hashes and per-case output. All generated outputs stay under `research/mk2/reports/`.

## Current production results

Exact means both survivor totals agree as integers. Every predicted winner agrees with the report, but that alone is not an exact replay.

| Defender | Reports | Exact | Sum of absolute survivor errors |
|---|---:|---:|---:|
| T10 FC4 lancer | 7 | 7 | 0 |
| T10 FC5 lancer | 2 | 1 | 1 |
| T10 FC10 lancer | 2 | 0 | 512 |
| T11 FC10 lancer | 5 | 1 | 1151 |
| **All new reports** | **16** | **9** | **1664** |

`A` and `D` designate the surviving side; the other side has zero survivors.

| Case | Defender | Observed | Current simulator |
|---|---|---:|---:|
| 000042 | T10 FC5 | A 685 | A 686 |
| 000043 | T10 FC5 | A 679 | A 679 |
| 000044 | T10 FC4 | A 953 | A 953 |
| 000045 | T10 FC4 | A 952 | A 952 |
| 000046 | T10 FC4 | A 951 | A 951 |
| 000048 | T10 FC4 | A 769 | A 769 |
| 000049 | T10 FC4 | A 766 | A 766 |
| 000052 | T10 FC4 | D 660 | D 660 |
| 000054 | T11 FC10 | D 99 | D 99 |
| 000055 | T11 FC10 | D 51 | D 48 |
| 000056 | T10 FC4 | A 6871 | A 6871 |
| 000057 | T11 FC10 | A 17011 | A 17221 |
| 000058 | T11 FC10 | A 11202 | A 11507 |
| 000059 | T10 FC10 | A 13796 | A 14024 |
| 000060 | T11 FC10 | A 11128 | A 11761 |
| 000062 | T10 FC10 | A 13972 | A 14256 |

Moving Ambusher to round start leaves every FC4/5 result unchanged. It reduces the combined FC10 absolute error from 1663 to 1364, but still only one of those seven reports matches exactly. It does not fix the FC10 cohort.

## What the FC4/5 reports say about RNG

At both FC levels, the modeled Ambusher chance is 20%. Crystal Lance is 10% at FC4 and 15% at FC5; Incandescent Field is absent. The FC0 infantry have no chance-based troop skills, so this setup isolates the relative ordering of two random checks.

Using the current coefficients:

| Per-round projected draw schedule | Exact new FC4/5 reports |
|---|---:|
| Ambusher, then Crystal Lance | 8/9 |
| Crystal Lance, then Ambusher | 1/9 |
| Crystal Lance only; skip Ambusher without marksmen | 0/9 |

The earlier T10 FC3 lancer control, case 000019, also matches with Ambusher then Lance; reversing the order misses by 32 survivors, and skipping Ambusher misses by 22.

This strongly supports consuming an Ambusher roll even when there is no marksman target, before the Lance check, in these duels. It does **not** distinguish Ambusher at round start from Ambusher immediately before the lancer attack: no other random check occurs between those points here. It also does not establish the placement of Field in FC10 fights.

The harness verifies exactly one call per applicable skill per round, rejects duplicate or unexpected calls, and checks that its baseline schedule reproduces native production survivors and round counts for every included duel.

## The remaining FC5 survivor

Current Mk2 normalization floors T10 FC5 lancer attack/health to **1790/596**. Ordinary rounding of the same formula gives **1790/597**. Changing only this troop's health to 597 reproduces both FC5 reports exactly; the seven FC4 cases are unaffected, yielding **9/9** across the new simpler controls.

This is a base-troop coefficient rounding probe, separate from the earlier question about truncating displayed percentage bonuses. Raising all of either side's displayed bonuses by just under 0.01 percentage points does not fix case 000042. The tested bonus-precision bounds therefore do not explain this one-survivor discrepancy by themselves.

Two FC5 reports with the same troop counts are insufficient to establish a universal rounding rule. The original 160 controls cover different troop IDs and do not validate T10 FC5 lancer coefficients. We have not replaced Mk2's broader floor rule with round-to-nearest.

## FC10 mechanics and the author's stat fitter

With current coefficients, none of the six fixed permutations of Ambusher, Field, and Lance fits either FC10 cohort exactly. The two schedules omitting Ambusher also fail. Alternative coefficient probes—rounding, ceiling, 1–3% scaling, and changing post-FC7 growth from 4% to 5%—do not jointly resolve these cases.

The unchanged `findBestEnemyBaseStats` function from `scripts/fit_enemy_base_stats.ts` was then run separately for T10 FC10 and T11 FC10 under all six three-skill schedules. It retains **attack = 3 × health**, defense/lethality 10, and minimizes mean absolute error. Each report uses its original timestamp-derived stream.

- T10 health: 720–810, step 0.1.
- T11 health: 830–960, step 0.1.
- Each optimum is refined over ±0.1 health, step 0.001.

The lowest absolute-error fits across the six schedules are:

| Cohort | Schedule | Fitted attack | Fitted health | Exact | Total absolute error |
|---|---|---:|---:|---:|---:|
| T10 FC10, 2 reports | Ambusher → Lance → Field | 2255.796 | 751.932 | 0/2 | 6 |
| T11 FC10, 5 reports | Ambusher → Field → Lance | 2646.882 | 882.294 | 2/5 | 101 |

The best T10 fit misses by −3 and +3 survivors. The best T11 fit has signed errors 0, 0, −44, +45, and −12 in case order 000054, 000055, 000057, 000058, 000060. These are numerical optima under constrained hypotheses, not measurements of server precision. Different preferred schedules across the two cohorts are another reason not to promote these fits into the engine.

The bounded searches do not exclude independent attack/health coefficients, conditional draw schedules, different Field semantics, or other model errors. They establish that simply picking another fixed roll order and rerunning the author's constrained fitter does not yield exact replays for the new known-troop controls.

## Implication for the T12 work

The FC4/5 batch provides the intended simpler mechanics control despite the corrected FC levels. The FC10 T10 reports are especially useful because they expose a discrepancy without any T11 or T12 baseline assumption.

The next investigation should therefore resolve the shared high-FC lancer behavior—particularly Field and the high-FC coefficients—against these known-troop cases before treating a T11 fit as ground truth for a +20% T12 estimate. The [previous 21-report analysis](lancer-followup.md) and original six T12 reports remain necessary cross-checks. More copies of the same FC4 fight are not the immediate priority.
