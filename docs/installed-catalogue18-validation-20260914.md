# Installed catalogue18 validation: 496 exact reports

Installed catalogue18 reproduces **all 496 reviewed controlled reports exactly**, including winners, survivors and explicit activation counts. The historical catalogue17 baseline was 471 exact, 25 pending and 487 correct winners. That baseline documentation remains a record of the earlier behavior.

The 25 newly covered reports match the unchanged frozen private candidates in complete shared- and research-kernel output and native RNG. Checks preserve all 25 original recorded packet seeds, 150 survivor fields and 100 explicit activation counts. For the prior 471 reports, complete outputs and native RNG match their archived SHA rows; the sole output normalization is shared `replayMetadata.version` from catalogue18 to catalogue17. All 496 also pass standard/trace gameplay and activation parity in both kernels.

The regular public CLI passes 496/496 controlled cases from 45 byte-identical installed fixture files: zero failures, zero errors and 97 retained warnings. The separate external inbox is excluded from that controlled result. An initial broad directory run included that inbox and is preserved privately; its unsupported cases and mismatches are not claimed as corrected. Engine tests pass 335/335; the final typecheck exits zero.

The final installed source differs from the reviewed private proposal only by line endings and an explicit missing-stats early rejection in both T10 scope guards. Missing optional stats now cause the scoped model to decline the case instead of throwing. This cannot expand a guard requiring nonzero exact stats. Installed and private source hashes were recorded before and after the final run and remained unchanged. A successful earlier run before that guard fix is retained separately and is not the final validation.

The two Ambusher corrections apply only to the exact tested troop profiles, armies, roles, hero-free conditions, experts and numerical actor contexts. The T10 cohort contains fifteen cases across the released guards; the source-death cohort contains ten across both roles. Model agreement does not uniquely establish the server's physical roll timing, especially where R1 and G1 are observationally equivalent in the mixed-attacker role.

Recorded-seed replay and timestamp derivation are separate claims. Shared replay uses the original packet-seed override; the research kernel uses an explicitly labelled seed-minus-one replay adapter. Genuine captured notification/march timestamps remain unchanged, including the earlier exceptions to the timestamp-plus-one relationship. Nothing here resolves those timing exceptions or implies fitted seeds, stats or probabilities.

Collection UI summaries were seen operationally. Model-level seed, counter and holdout access followed the corresponding diagnostic and confirmation releases. The installed correction and this validation preserve the frozen model failures and do not retroactively describe the historical baseline as exact.

See the accompanying machine-readable validation summary for counts and limitations. No account names, raw report identifiers or private capture paths are included in this document.

## Installed rules and exact scope

- Opposing Lancers: for the fifteen supported reports with 100 T10 FC5 Lancers on each side, reserve the defender's Ambusher roll before the attacker's Crystal Lance roll. Apply the reserved result at the defender's existing Ambusher trigger. The guard admits only the three tested role/modifier contexts; the old-context reverse direction remains excluded.
- Source death: for the ten supported reports with 100 T5 FC5 Lancers against one T10 FC5 Lancer plus 100 T5 FC3 Marksmen, reserve the mixed army's Ambusher roll before the first attack each round. After its Lancer dies, continue that draw and count successful activations without applying an effect, reviving troops, or creating an attack. Both tested directions are supported.

Troop stats, probabilities, normal attack scheduling and seed resolution were not changed. The implementation is in [scoped_t10_ambusher.ts](../simulator/src/mk2/scoped_t10_ambusher.ts) and [scoped_global_ambusher.ts](../simulator/src/mk2/scoped_global_ambusher.ts). Explicit `t10Ambusher: 'reference'` and `globalAmbusher: 'reference'` replay options preserve the prior behavior for comparisons.

The [machine-readable installed result](../research/mk2/installed-catalogue18-validation-20260914.json) is the current checkpoint. The [catalogue17 comparison](mk2-reviewed-checkpoint-496-20260914.md) records the historical mismatches. All controlled replay fixtures and observations are included in [testcases/mk2](../testcases/mk2/); `report_inbox_20260913.json` is the separate external inbox.
