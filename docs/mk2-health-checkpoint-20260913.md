# FC5 Lancer health checkpoint — September 13, 2026

This checkpoint preserves all ten completed larger-army health reports: **500 T10 FC5 Lancers versus 5,000 T5 non-FC Marksmen, five battles each direction**. The [normal-format testcases](../testcases/mk2/health_pending_20260913.json) contain the captured armies, player modifiers, recorded seeds, winner, all six survivor counts, and both explicitly observed Ambusher/Lance activation counts. Separate fights retain separate IDs. They are pending evidence, outside the 326 passing-report corpus.

| Fixed model | Lancers attack | Lancers defend | Combined exact |
|---|---:|---:|---:|
| Current v13, T10 FC5 Lancer health 596 | 0/5 | 0/5 | 0/10 |
| Private candidate, restore original health 597 only | 5/5 | 5/5 | 10/10 |

The [per-report comparison](../research/mk2/health_pending_results_20260913.json) retains each model's survivors and explicit skill counts. The candidate changes only this original catalogue cell; it does not adjust captured player stats, seeds, troop counts, probabilities or skill order. Both actual current kernels produced identical full battle outputs and RNG traces for these reports.

The ten preceding 500-Lancer versus 1,500-Marksman reports, already published as campaign fixtures 150–159, matched both health values and could not distinguish them. Larger troop counts were selected prospectively using arbitrary planning seeds, before opening the new reports. Each direction used the first chronological report as a gate before the manager released its four original held-out reports. No case was chosen or removed based on its outcome.

**The production kernel remains `expedition-mk2-lua54-catalogue-13`.** This publication preserves evidence before a production decision. Restoring 597 still requires the planned integration and regression comparison: all 326 previous captured observations must remain exact; the 316 passing reports outside this troop profile and all 15 pending mixed reports must retain full battle/RNG behavior. Ten prior passing reports use the affected profile and may change internal traces while preserving every observation. The local pre-change archive contains both actual kernels' complete results for all 341 reports.

Independent direct-wire reviews checked ten seeds, 60 survivor observations and 20 explicit chance-skill counts, with captured modifiers and expert context unchanged across the ten reports. Finalized capture hashes and frozen candidate dependencies were verified. Missing counters are never treated as zero. Recorded-seed replay does not independently establish how the game derives its seed from battle time. These results do not establish blanket rounding, other catalogue cells, heroes or T12 mechanics.

Raw packet captures, account/mail identifiers, device metadata and source-to-fixture mappings remain in the private research archive. The shared files provide anonymized predictive inputs and observed battle results sufficient to reproduce the current-kernel failures. Private candidate code is not promoted by publishing its comparison results.

Run the current kernel from the repository root:

```sh
node --import ./simulator/node_modules/tsx/dist/loader.mjs scripts/run_testcases.ts --testcase-root testcases/mk2 --matching health_pending_20260913 --workers 1 --human
```

Verified checkpoint result: ten processed reports, ten observable mismatches, zero processing errors and warnings; exit status 1. These failures remain visible rather than being reclassified as passing tests.

The snapshot includes all ten health reports finalized before this publication request was processed. Concurrent emulator batches that were still being captured are outside this checkpoint and will be added after finalization and review.
