# Points-table audit — 2026-09-13

The two user-supplied screenshots contain 63 troop rows and 252 Points cells. Riders are lancers, Hunters are marksmen, and the Damage column is compared with the simulator's lethality field. Defense and Damage are 10 throughout. The Level rating columns are not combat coefficients and were excluded.

**The original generator matches all 45 supplied T1–T10 rows, including T10 FC5 lancer health 597.** The 596 value is introduced by our Mk2 floor override, not by the original generator. Mk2 differs from the screenshots in **17 attack/health cells across 12 T10 FC1–FC5 entries**. T11 has a separate, much larger baseline discrepancy.

No production coefficients were changed by this audit. Its replay experiments use isolated configuration copies.

## Why 597 becomes 596

The original [`generateTroopStats`](../../simulator/src/troopStats.ts) uses `Math.round(base * multiplier)`. T10 FC5 lancer health is:

```text
472 × 1.04 × 1.05^4 = 596.667708
Math.round(...) = 597
Math.floor(...) = 596
```

[`mk2Config`](../../simulator/src/mk2/mechanics.ts) replaces attack/health with `Math.floor` for every FC troop through T10. That rule came from a different controlled-report cohort. Its blanket extension to these T10 entries disagrees with the supplied table.

This concerns base troop coefficients, not the earlier truncation of displayed percentage bonuses.

## Every T10 mismatch

Pairs below are **attack / health**. The original generator equals the table in every row. Every listed difference is exactly one point in the affected cell.

| Troop | FC | Current Mk2 | Table / original generator |
|---|---:|---:|---:|
| Infantry | 1 | 490 / 1472 | **491 / 1473** |
| Infantry | 3 | 541 / 1623 | **541 / 1624** |
| Infantry | 4 | 568 / 1704 | **568 / 1705** |
| Infantry | 5 | 596 / 1790 | **597 / 1790** |
| Lancer | 1 | 1472 / 490 | **1473 / 491** |
| Lancer | 3 | 1623 / 541 | **1624 / 541** |
| Lancer | 4 | 1704 / 568 | **1705 / 568** |
| Lancer | 5 | 1790 / 596 | **1790 / 597** |
| Marksman | 1 | 1963 / 368 | **1964 / 368** |
| Marksman | 2 | 2061 / 386 | **2062 / 387** |
| Marksman | 3 | 2164 / 405 | **2165 / 406** |
| Marksman | 5 | 2386 / 447 | **2387 / 448** |

T10 FC2 infantry/lancers and FC4 marksmen match already. All 30 T1–T10 FC0 rows match both code paths, including every defense/lethality cell. There are no supplied FC6–FC10 or T12 Points rows to audit.

## T11 is a different issue

The catalogue explicitly identifies its infantry baseline **551 / 1653** as a Labyrinth-only T11 FC0 calibration and extrapolates player T11 from it. The screenshot's row labelled 11 instead gives **520 / 1561**. Swapping infantry attack/health gives the lancer baseline; marksman values are also different.

These are the table entries with corresponding catalogue IDs:

| Troop | FC | Original generator and Mk2 | Table |
|---|---:|---:|---:|
| Infantry | 0 | 551 / 1653 | 520 / 1561 |
| Infantry | 5 | 697 / 2090 | 658 / 1973 |
| Lancer | 0 | 1653 / 551 | 1561 / 520 |
| Lancer | 5 | 2090 / 697 | 1973 / 658 |
| Marksman | 0 | 2204 / 413 | 2082 / 390 |
| Marksman | 5 | 2786 / 522 | 2632 / 494 |

The generator is roughly 6% higher. These mismatches come from its T11 baseline, not Mk2 flooring: Mk2 leaves T11 coefficients alone.

The table also shows T11 FC1–FC4. The catalogue does not offer those player troop IDs; its player T11 range begins at FC5. The audit records what the low-level generator would calculate for them, but labels all 12 such rows as **not catalogued**. Across all 18 T11 table rows, the formula differs in all 36 attack/health cells; only six of those rows correspond to catalogue entries.

The table alone does not establish that its T11 values apply to the current player troops or to the Labyrinth-only baseline. In fact, multiplying the table's own rounded T11 FC0 values does not consistently reconstruct its later rows: infantry health `1561 × 1.04` rounds to 1623, while the table gives 1624; at FC2 it rounds to 1705, while the table gives 1704. This could reflect underlying coefficients, different derivation, or inaccuracies in the table. It is not enough to infer FC9/FC10 values or replace the T11 baseline automatically.

## Replay checks

All experiments keep each report's timestamp-derived seed. The 160 recorded-seed controls compare all six survivor counts; the newer inbox reports supply survivor totals. This audit does not claim an additional skill-proc regression check.

| Research configuration | Original 160 controls | New 16 reports | Earlier 21 reports |
|---|---:|---:|---:|
| Current Mk2 | 160/160 | 9/16 | 7/21 |
| Override only supplied T10 FC1–FC5 Points | 160/160 | **10/16** | 7/21 |
| Round all T1–T10 FC coefficients | **38/160** | 10/16 | 7/21 |

The T10-only override makes **all nine FC4/5 lancer reports exact**. The existing T10 FC3 lancer control remains exact. It leaves higher-FC coefficients unchanged and does not resolve the six remaining FC10 misses in the new batch.

A global rounding change breaks 122 previously exact controls. The evidence supports a correction scoped to the supplied T10 entries, while retaining the separate measured coefficients for the older control profiles. Merely switching all of Mk2 from floor to round is not supported.

## Files and reproduction

- [Transcribed Points rows](fixtures/troop-table-points.json): all 63 rows, with the level-notation assumption and source description.
- [Complete audit](reports/troop-table-audit.json): every stat comparison, hypothetical T11 distinctions, table-base reconstruction, and all replay outcomes.
- [Audit runner](troop_table_audit.ts).

From the repository root, after installing simulator dependencies:

```sh
simulator/node_modules/.bin/tsx research/mk2/troop_table_audit.ts
```

The script uses the main engine, preserves original catalogue objects, and writes only its audit result under `research/mk2/reports/`. Its fixture hash ties the comparisons to the transcribed screenshot data.
