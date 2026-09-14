# Scoped Ambusher and terminal Volley replay on locked source stats

Thirty captured battles now reproduce their winner, all six survivor counts,
and all 150 explicitly reported skill counters on the locked-stat kernel.
The previous kernel reproduced 3/30 exactly, 26/30 winner/survivor outcomes,
and 68/150 explicit skill counters. The installed CLI verifies 415/657 exact
across the bounded published corpus; all 627 previous results, comparison
fields, replay metadata, and warnings are unchanged. The remaining 242
mismatches are retained, including the deterministic FC1 discrepancies.

## What changed

For the six captured army/modifier contexts below, reserve Ambusher then
Volley before the ordinary Lancer chance rolls. Execute attacks in their
original slots. Credit successful reserved Volley rolls even when the attack
never executes, and the captured Ambusher counts after its Lancer source dies.
The result recorder receives those credits before materializing the result;
the accounting does not create extra damage or attacks.

The new optional battle-end hook is inert outside the scoped adapter. The
testcase loader and dashboard saved replay settings retain the required
`terminalVolleyEvidence`. Missing or altered context keeps baseline behavior.

| Pure march | Mixed march | Captures |
| --- | --- | ---: |
| 5 T5 FC5 Lancers | 10 T10 FC5 Lancers + 25 T7 FC3 Marksmen | 10 |
| 3 T5 FC5 Lancers | 10 T10 FC5 Lancers + 25 T7 FC3 Marksmen | 10 |
| 10 T5 FC5 Lancers | 1 T10 FC5 Lancer + 5 T7 FC3 Marksmen | 10 |

Each row includes both attacking directions. Exact captured modifiers,
experts, troop profiles, empty hero/extra-skill context, battle type, relevant
skill definitions, and mechanics settings are required. The guard includes
each full configured troop record (id, type, tier, FC level, and stats), since
FC metadata changes skill eligibility and levels even if numeric stats stay
the same. It contains no seed, report-ID, or expected-outcome whitelist.
An explicit default 1,500-round cap is equivalent to an omitted cap; other
caps fall outside this evidence scope.

No troop stats, skill probabilities, damage formulas, or captured seeds were
changed. Piddly's T1–T10/FC0–FC5 source-stat range remains locked. The guard's
T7 FC3 Marksman health is 247, matching that existing locked configuration;
it does not write or override the stat catalogue.

## Evidence and limits

The [coverage manifest](locked-terminal-30-coverage-20260914.json) links all
30 portable fixtures. The [report projections](locked-terminal-30-reports-20260914.json)
preserve normalized decoded battle data, with formation IDs replaced by
side-local ordinals. Complete raw bytes and private identity mappings remain
preserved locally; their hashes are included. These projections do not claim
to include every section of the original wire payload. Seeds remain separate
from timestamps and their recorded provenance. Absent counters are not
converted to zero.

This is retrospective transfer validation of previously captured experiments
from the calibrated branch onto locked source stats. Fifteen terminal-context
reports had served as prospective checks during the earlier experiment; this
transfer itself is not a new prospective study. Two reports witness successful
unused Volley credits. Nine source-death reports contain 25 modeled successful
Ambusher credits after Lancer death. The original raw counters support the
combined model, but do not expose server instruction order or establish each
component independently by a new ablation. No broader troop/count/modifier or
hero combination is established. The inherited Gunpowder-scope warning remains.

Independent review covered raw context/counter/seed provenance, 114 full-profile
scope probes, witness replays, saved-settings deep copies, and complete saved
standard/trace comparisons for all 657 reports. Production loader, dashboard
conversion, simulation/trace API functions, and saved-settings paths were
exercised. This does not claim a browser/HTTP/database end-to-end test.

Installed validation: 384/413 simulator tests pass; the 29 failing tests are
the same captured-result failures present at baseline `7fba3d6` (380/409).
Their expected observations have not been edited or skipped. All four new
simulator tests pass, as do all 109 dashboard tests and strict simulator
TypeScript. The original 301 reference outcomes and all 180 locked troop
profiles pass their existing checks. The reversible-port manifest includes
the new optional hook and still reconstructs all five original engine files
to their unchanged original hashes; the test itself is unchanged.

The source transfer is pinned to calibrated commit
`426a12c4fbec2f7616537b55acdbf57c75bd4bfc`. The installed baseline before this
change is `7fba3d67c056d9779ac21de105c6069c24bfe972`. No changes from a mutable
calibrated checkout or its later opposing-Marksman experiment were imported.

## Reproduce

From the repository root, replay the 30 new captured fixtures through the
installed CLI:

```sh
node --import ./simulator/node_modules/tsx/dist/loader.mjs scripts/run_testcases.ts --testcase-root testcases/mk2 --matching mk2-locked-terminal-20260914 --workers 2
```

The 657-report comparison above uses all files in `testcases/mk2` except
`report_inbox_20260913.json`, the separate timestamp-only inbox. Running the
whole directory also evaluates that inbox and therefore has a different
denominator. A nonzero comparison exit code is expected for the larger corpus
while known mismatches remain; inspect execution errors separately from
comparison failures.

Simulator regression tests include the captured terminal fixtures, scope
rejection, standard/trace behavior and default-cap equivalence. Dashboard
tests cover saved replay evidence preservation and isolation of copied data.
