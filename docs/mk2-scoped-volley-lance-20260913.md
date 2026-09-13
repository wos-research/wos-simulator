# Scoped Volley/Lance ordering and activation accounting

The user approved this specific RNG correction. Catalogue15 reserves a live Volley roll before Crystal Lance in the exact supported mixed army, applies its result at the existing Marksman slot, and counts a successful unused reservation as one Volley activation. That accounting increment causes no attack, damage or extra RNG draw.

## Supported inputs

Exactly500 T5 FC5 Lancers plus5 T7 FC3 Marksmen against25 T5 FC1 Infantry, in either orientation, with the captured normalized modifiers and canonical skill definitions checked by `scoped_e1_volley.ts`. Heroes and joiners must be explicitly absent. Other counts, profiles, modifiers, additional effects, alternate scheduling or defined input seeds remain outside the guard. Both previously audited joint current/original participating-stat configurations are accepted without changing either catalogue.

The normal testcase adapter adds an optional `seed: undefined` property. The guard treats this as absent; defined seeds and other unexpected input keys remain excluded. Regression tests exercise the real adapter, preventing a direct-API-only success claim. Recorded replay seeds are supplied through replay options as before.

Outside this scope, current Mk2 combat and RNG behavior are unchanged. API callers can explicitly compare the previous behavior with `e1Volley: 'reference'` in `Mk2ReplayOptions`. The research backend exposes the same comparison under `request.mechanics.e1Volley`. No original troop-stat formula, troop value, probability, target-selection rule or hero definition is changed in this update.

## Evidence

All15 previously captured E1 reports now match winner, all six survivor counts and all supplied chance-skill activation counts, versus1/15 before this change. The two distinguishing unused-success witnesses are public fixtures `mk2-followup-20260913-004` and `mk2-followup-20260913-007`, one in each orientation. They differ from the zero-credit alternative by exactly one reported activation.

The same observable conclusions and labelled RNG predictions survive the fixed joint current/original-catalogue comparison. This supports the scoped model; it does not uniquely identify every server-internal event or establish the rule for other armies. The engine guard sees normalized inputs, so capture-side checks of raw expert context and all sixteen modifier fields remain necessary.

The latest five independently verified C2 fights are included in [new fixtures](../testcases/mk2/c2_accounting_followup_20260913.json), with [historical comparisons](../research/mk2/c2_accounting_followup_results_20260913.json). All five remain pending under catalogue15. They provide no successful-unused accounting witness with Shield. Across the30 small FC5 C2 reports collected so far, that accounting question remains unresolved; neither the E1 approval nor regression agreement resolves it.

The published captured corpus now contains **406 distinct reports:361 exact under catalogue15 and45 pending**. Earlier evidence files retain their historical catalogue14 candidate comparisons. Those are historical measurements, not current pass labels. The separate timestamp-only inbox is excluded from this recorded-seed count.

## Validation and limits

The full simulator suite passes322 tests, including the original160 captured controls,301 legacy reference outcomes and45,440 native Lua values. Seven scoped tests cover the15 reports, both unused-success witnesses, exact-scope rejection, actual loader behavior and explicit reference mode. TypeScript checking passes. The real testcase loader processes all406 recorded-seed fixtures with361 exact,45 known mismatches and zero processing errors; the first401 and latestfive were run separately.

An initial overly broad loader invocation also included56 enabled timestamp-only inbox cases and produced27 processing errors. That output is preserved privately and is not presented as a passing test or part of the406 controlled cases. No inbox outcomes were used to fit this correction.

The global version changes from14 to15. That is an intentional metadata difference, not a claim that all full serialized outputs remain byte-identical. The private pre-install comparison preserved every combat/RNG/warning output outside the scoped rule; the installed checks separately verify actual paths and metadata handling. Independent timestamp-to-seed derivation, other skill combinations, heroes andT12 remain unresolved or outside scope.

The installed shared and research kernels were also replayed directly against all406 reviewed request archives:812 complete result wrappers agree with the reviewed candidate, permitting only the shared version14-to-15 metadata change. All8 sampler checks pass against the actual installed research backend. The dashboard production build passes. These checks verify implementation and compatibility; they do not broaden the in-game evidence scope.
