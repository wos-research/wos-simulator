# Controlled casualty projection

`simulator/src/mk2/controlledCasualties.ts` provides the optional `projectControlledCasualties(context, initial, remaining)` function. Call it after a recorded-seed replay when its context is independently confirmed. It does not run automatically, change combat damage or RNG, or alter replay defaults.

For each troop type separately, it calculates losses as initial troops minus surviving troops, then:

- dead: zero
- wounded: ceiling of 35% of losses
- minor wounded: the remaining losses

The arithmetic uses BigInt internally to avoid floating-point rounding or multiplication overflow. Initial and survivor counts must be nonnegative safe integers, with survivors no greater than initial troops. Counts include Infantry, Lancer and Marksman entries for both sides.

The caller must explicitly confirm battletype 9, a controlled occupied-tile battle, no heroes, one formation per side, no hospital overflow on either side, and one positive profile for each present troop type. Unknown or unsupported contexts and mixed profiles are rejected. These assertions must come from the actual battle setup and independent context evidence; do not infer them from a desired outcome. The returned `validated-controlled-context` status describes this limited evidence scope, not every battle of type 9.

## Validation

The twenty fixtures in `testcases/mk2/controlled_casualties_20260913.json` reference campaign cases 002–021. Tests replay their original armies and recorded seeds, then apply the projection to predicted survivors and compare all **150 explicit wire category values** from 50 soldier records. The report tags for dead, wounded and minor wounded were present in every record, including all 50 explicitly encoded zero-death values; no missing category was silently replaced with zero.

Hospital context came from independent controller UI observations before and after testing, plus a conservative upper bound on possible new wounded in each ten-fight cohort. Both characters remained well below half capacity. For the first cohort, observed infirmary increases exactly equal the pilot's wounded plus its ten reports' wounded.

The arithmetic was frozen before these reports were released to its implementer. Some battles had already been collected, so this is validation against unseen reports after an analysis freeze, rather than a claim all collection occurred after the freeze. An earlier 161-fight retrospective audit also matched the arithmetic conditionally, but its historical hospital context and explicit wire presence were not established; those cases are not represented as independently confirmed-context fixtures here.

The second ten-fight cohort uses 1,000 T10 FC4 Lancers against 500 T5 FC1 Infantry, five each direction. Its 60 additional explicit category values match the unchanged projection using both actual kernels after the separately validated Lancer attack correction. Infirmary increases of 37 and 1,750 wounded reconcile exactly to those raw reports. This extends casualty evidence without changing its formula or treating the former combat profile as exact.

The tests also check context rejection, separate-type rounding, unsafe and malformed counts, zero and one loss, maximum-safe-integer arithmetic, and that combat/RNG results remain unchanged by projection.

## Limits

These cases cannot distinguish rounding per troop type from rounding per soldier stack because each type has one positive profile. They do reject rounding once after combining a mixed army's losses. Multiple players/formations, mixed tiers within a type, other battle modes, hospitals at capacity, and hero settlement effects are outside scope. There is **no per-skill kill-credit projection**: engine skill damage is not automatically the report's attributed wounded count.

Run from `simulator` using the installed dependencies:

```sh
npx tsx --test src/mk2/controlledCasualties.test.ts
npm run typecheck
```

The dashboard's existing synthetic overview is a separate display estimate: it rounds from whole-army totals and does not call this function. It is not covered by the per-type settlement validation above. Wiring confirmed settlement into that display requires the actual per-type counts and confirmed battle context; the synthetic overview alone does not supply them.
