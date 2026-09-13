# New Shield accounting witnesses and ALG controls

Ten additional independently verified reports bring the captured corpus to **416 reports: 366 exact under catalogue15 and 50 pending**. This update adds evidence only. No simulator source, troop stat, probability or active ordering rule changes.

## Shield accounting

Five hero-free forward fights used 500 T5 FC5 Lancers plus 5 T7 FC3 Marksmen against 1 T5 FC5 Infantry. The active kernel matches none completely, although winner and all six survivor counts agree in all five. The previously frozen ordering candidate with unused successful Volley credit matches 5/5; the same candidate without that credit matches 3/5.

The distinguishing public cases are `mk2-c2-one-infantry-forward-20260913-004` and `mk2-c2-one-infantry-forward-20260913-005`. Their explicitly encoded Volley counts are 2 and 1; the no-credit model predicts 1 and 0. All other observations agree with the credit model. Raw seeds, all survivor slots, all four explicit chance counters, all sixteen modifiers per actor and expert context were independently verified. Modifiers and experts remained unchanged across this batch.

The candidate reserves Volley before the Lancer's reactive Shield check and extends the existing Gunpowder deferral to this exact mixed army. Its two accounting variants share those ordering and damage behaviors; they differ only in credit for a successful reservation whose attack is unused in the model. The reports expose activation totals, not the server's internal attack sequence. These cases distinguish the frozen models; they do not uniquely establish every internal event or justify extrapolation to untested inputs.

This is the first observed accounting distinction in the tested Shield context. The earlier 30 five-Infantry FC5 C2 reports did not contain that distinction. The reverse one-Infantry batch is underway. The candidate remains outside the active kernel.

## Ambusher, Lance and Gunpowder

Five forward fights used 100 T10 FC5 Lancers plus 100 T5 FC3 Marksmen against 500 T5 FC1 Infantry, with no heroes. All five match the unchanged kernel: Lancer survivors are 85, 87, 85, 85 and 85, with 100 Marksmen surviving each time and no defending survivors. All fifteen supplied chance-skill activation counts match.

All five seeds, thirty survivor slots and fifteen explicit raw counters were independently verified. The Infantry actor's sixteen raw modifier fields were each 500 below its earlier baseline; the actual captured values were retained without compensation. Expert context was unchanged. The reverse orientation is being tested separately. These are additional compatibility controls, not a new mechanics correction.

## Reproduction and scope

Fixtures are in `testcases/mk2/alg_forward_20260913.json` and `testcases/mk2/c2_one_infantry_forward_20260913.json`; their comparison evidence is in the correspondingly named files under `research/mk2`. Public files use anonymous sides and report IDs. Packet files, private identities and source mappings remain local.

Both new files were executed through the normal testcase CLI: ten cases executed, five exact, five expected mismatches, zero processing errors. ALG has zero warnings; C2 has five unsupported-context warnings. The earlier 406-report validation remains applicable because runtime source is unchanged. The last kernel validation passed 322 tests, eight sampler checks, TypeScript checking and the dashboard build; those were not redundantly rerun for this evidence-only update.

Across the current corpus, all 416 winners match. Of the fifty incomplete matches, thirty-eight have correct survivors and differing skill counters; twelve also differ in Lancer survivors. The original 160 controls continue to pass. Independent timestamp-to-seed derivation, broader combinations, heroes and T12 remain outside the established scope.
