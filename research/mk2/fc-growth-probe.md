# FC growth and T11/T12 tier rounding — 2026-09-13

The user proposed two separate hypotheses:

1. Keep FC1–FC5 growth, then use **+5% at FC6, FC7 and FC8; +2.5% at FC9 and FC10**.
2. For player T11, use **`round(round(T10_base × 1.20) × FC_multiplier)`**, potentially repeating the tier increase for T12.

The tier formula is a promising T11 baseline candidate, but neither hypothesis produces an exact report cohort. The proposed FC curve makes the known T10 FC9/FC10 controls worse. No production coefficients or timing rules were changed.

## Method

The [runner](fc_growth_probe.ts) evaluates all 43 curated lancer-investigation reports. The primary known-troop comparisons contain three T10 FC9/FC10 lancer reports and eight T11 reports: three FC9 infantry and five FC10 lancer cases. No T12 troops appear in those 11 controls.

Every run keeps **seed = timestamp + 1**. Both current production timing and the experimental round-start Ambusher option are tested. No coefficients are fitted and no seeds are searched. Variant configurations are isolated copies; the original catalogue is checked for mutation.

The probe also tests final rounding instead of flooring, FC5 integer anchors, rounding after each FC level, omitting the inner tier rounding, and applying the proposed T12 +20% before or after FC scaling. These checks address arithmetic interpretation, not untested Field mechanics. The table's alternative T11 values are not substituted, and the Labyrinth-only FC0 catalogue entry is retained.

There are 30 model combinations and two timing settings: 2,580 deterministic battle evaluations. The [complete result](reports/fc-growth-probe.json) records all variants, coefficients, per-case outcomes, seeds, timestamp status, and input hashes.

## Proposed FC growth alone

Starting from the existing FC5 factor `1.2641265`, the proposed curve gives:

| FC | Current factor | Proposed factor | Relative change |
|---|---:|---:|---:|
| 6 | 1.327332825 | 1.327332825 | 0% |
| 7 | 1.393699466 | 1.393699466 | 0% |
| 8 | 1.449447445 | 1.463384440 | +0.9615% |
| 9 | 1.507425343 | 1.499969051 | −0.4946% |
| 10 | 1.567722356 | 1.537468277 | −1.9298% |

The extra growth at FC8 is outweighed by reducing FC9/FC10 to 2.5%. Under the current rounding policy, T10 FC10 lancer attack/health fall from **2219/739 to 2177/725**.

With current production timing, the three known T10 high-FC controls have total absolute survivor error **516 with the current curve, versus 1004 with the proposed curve**. Neither has an exact match in those three cases. The two FC10 examples are:

| Case | Report attacker survivors | Current curve | Proposed curve |
|---|---:|---:|---:|
| 000059 | 13796 | 14024 | 14277 |
| 000062 | 13972 | 14256 | 14487 |

For all 11 known high-FC controls, retaining the Labyrinth-derived T11 model, total absolute error rises from **1888 to 3258**. Round-start Ambusher also worsens: **1594 to 2976**. Final-rounding and FC5-anchor alternatives do not produce an exact known-troop cohort either.

This does not establish the game's true growth curve independently of mechanics. It establishes that the proposed curve does not fix these reports under the tested engine behavior.

## T10 ×1.20 to derive player T11

Applying the user's inner rounding to T10 FC0 Points produces:

```text
T11 infantry base: attack round(472 × 1.20) = 566
                   health round(1416 × 1.20) = 1699
T11 lancer base:   attack 1699, health 566
```

The outer rounding then applies the selected FC factor. With the current curve, this gives **853/2561** for FC9 infantry and **2664/887** for FC10 lancers. These are stronger than the current Labyrinth-derived player coefficients.

The following comparison holds production timing and the existing T10 rounding policy fixed, changing only the selected tier baseline and/or FC curve:

| Player T11 baseline | FC curve | Exact T11 reports | T11 total absolute error | T10 total absolute error |
|---|---|---:|---:|---:|
| Current Labyrinth extrapolation | Current | 1/8 | 1372 | 516 |
| Current Labyrinth extrapolation | Proposed | 1/8 | 2254 | 1004 |
| `round(T10 base × 1.20)` | Current | **2/8** | **400** | 516 |
| `round(T10 base × 1.20)` | Proposed | 1/8 | 868 | 1004 |

The FC9 infantry reports are especially informative because they contain neither Ambusher, Crystal Lance, nor Incandescent Field. They still include infantry skills, so they are not a mechanics-free stat measurement.

| Case | Current signed survivor error | T10 ×1.20, current FC curve | T10 ×1.20, proposed FC curve |
|---|---:|---:|---:|
| 000033 | +49 | **+2** | +11 |
| 000035 | +30 | **+1** | +6 |
| 000037 | +142 | **+8** | +34 |

Their total absolute error falls from **221 to 11** using the new tier formula with the existing FC curve. This is stronger evidence for investigating the player T11 baseline separately from the Labyrinth baseline. It still does not give exact results.

For the five T11 FC10 lancer reports, the same model has errors `0, 0, +49, −248, +92`. Thus the residual is not simply uniform underestimation. Using round-start Ambusher reduces the combined T11 absolute error to 298, but only one of eight reports remains exact.

Omitting the inner rounding also fails to settle the formula: with the current FC curve and current timing, its T11 absolute error is 391 rather than 400; with round-start timing it is 322 rather than 298. The reports do not uniquely establish where the game rounds.

## Another +20% from T11 to T12

Repeating the inner tier rounding gives a provisional T12 lancer base of:

```text
attack = round(round(1416 × 1.20) × 1.20) = 2039
health = round(round(472 × 1.20) × 1.20) = 679
```

With the current FC curve, the outer FC10 rounding gives **3197/1064**. With the proposed FC curve, it gives **3135/1044**. Defense/lethality remain 10.

Using current timing, these models match **2/13** and **3/13** of the earlier clean infantry-versus-T12 reports, respectively. The proposed-curve version with round-start Ambusher reaches **6/13**, but misses two of the original six calibration reports (**4/6 exact**). That is an improvement in some comparisons, not a model that fits all cohorts.

The existing provisional T12 pair remains 3215/1008. None of these new hypotheses was promoted into production or used to overwrite saved expected outcomes.

## Continue

The T11 ×1.20 hypothesis is worth retaining as a candidate. The current FC curve fits these controls better than the proposed FC curve, but high-FC coefficients and Field mechanics remain unresolved. Continue validating known T10/T11 controls before adopting another tier increase for T12.

From the repository root, after installing simulator dependencies:

```sh
npx tsx research/mk2/fc_growth_probe.ts
```

The earlier [T10 Points correction](troop-table-audit.md) remains a separate pending production change. A diagnostic global rounding variant here is not a recommendation to replace Mk2 flooring across every troop tier.
