# Mk2 scope correction and captured follow-up evidence

The user directed Mk2 to continue from its current kernel and abandoned the proposed original-stat rollback. Research prioritizes missing RNG timing, skill ordering, and random-number consumption. Established source mechanics are protected; existing rounding discrepancies remain documented rather than treated as free fitting parameters. The broad FC rounding override exceeded the original evidence scope, but no blanket restoration is authorized or planned. Isolated comparisons may inform a clearly stated discrepancy; every new active-kernel behavior change still requires explicit user approval.

The [15 additional report fixtures](../testcases/mk2/followup_20260913.json) retain predictive inputs, recorded seeds, observed winner, six survivor values and three explicit activation counts per report. Their [fixed historical comparisons](../research/mk2/followup_results_20260913.json) describe the unchanged catalogue14 runtime and private candidates, not a new kernel implementation. Separate fights stay separate; missing observations are not inferred as zero.

| Cohort | Reports | Active catalogue14 exact | Historical private candidate |
|---|---:|---:|---|
| E1 mixed Lancer/Marksman, reverse direction |5|0|U0 4/5; U1 5/5|
| E1 additional forward accounting batch |5|1|U0 4/5; U1 5/5|
| T7 FC4 Marksman health, first direction, collected before scope correction |5|5|Original-health-only comparison 0/5|

The two E1 cohorts provide one successful-unused Volley accounting contrast in each orientation: the report includes an activation that U0 omits and U1 includes. Both predictions use identical candidate battle/RNG execution; the difference is reported activation accounting. This supports a specific comparison but does not uniquely expose server internals. These historical candidates also used the altered T7 FC3 Marksman health246 instead of original247. The dependency on catalogue assumptions must be reported in any proposed production change. An optional original-catalogue comparison is retained as separate research; the user abandoned rollback and authorized continued current-baseline testing. No inference transfers automatically to Crystal Shield, Ambusher, other tiers or heroes.

The historical health comparison is preserved as collected evidence, not a recommendation to alter source stats. Outcome agreement alone does not uniquely prove a troop coefficient. The planned follow-on health experiment was paused during the scope discussion and has not been dispatched. The user subsequently abandoned rollback and resumed isolated research; priority remains unresolved RNG behavior, with no stat fitting used to claim proof.

The collected, independently audited corpus represented by this checkpoint contains381 distinct reports:342 match the unchanged catalogue14 active kernel and39 remain pending. The prior published checkpoint contained366 reports:336 exact and30 pending. The five additional reverse health fights completed before the scope correction are preserved privately but have not been released for further stat comparisons or counted as validated fixtures here.

Raw packets, player/mail identifiers, device details and screenshots remain private. Original captured seeds are retained. Diagnostic timestamps are reportedSeed minus one; they are not independent evidence of the server's seeding clock. Independent trigger-time observations remain a separate RNG question.

Reproduce the new15 through the normal loader from the repository root:

```sh
node --import ./simulator/node_modules/tsx/dist/loader.mjs scripts/run_testcases.ts --testcase-root testcases/mk2 --matching followup_20260913 --workers 1 --human
```

Expected catalogue14 outcome:15 executed,6 exact,9 known mismatches,0 processing errors. Historical experimental matches do not convert the nine active-kernel failures into passes.


Subsequent checkpoint: the [twenty-report continuation](mk2-continuation-20260913.md) publishes the five reverse health controls and fifteen further C2 observations, reaching401 reports (347 exact,54 pending). It also records the completed fixed original/current-catalogue E1 robustness comparison. The preceding counts and pending-work descriptions are historical.


The user subsequently approved the exact E1 Volley/Lance correction. See the [catalogue15 integration and validation](mk2-scoped-volley-lance-20260913.md) for its narrow guard, unchanged original stats/probabilities, and the406-report checkpoint. Earlier comparisons above remain historical.
