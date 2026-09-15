# Catalogue19: scoped Ambusher integration

Catalogue19 adds two narrowly supported RNG behaviors. It changes no troop statistics, skill probabilities, damage formulas or normal attack/effect slots.

| Captured armies | Evidence | Installed behavior |
|---|---:|---|
| 100 T5 FC5 Lancers versus 10 T10 FC5 Lancers + 100 T5 FC3 Marksmen, both roles | 10 reports | Reserve the mixed army's Ambusher roll before the round's first chance, then use the cached result at its original live trigger. Preserve the separately established post-death roll/count behavior. |
| 25 T10 FC5 Infantry + 100 T10 FC5 Lancers on each side, both observed modifier assignments | 10 reports | Reserve attacker then defender Ambusher rolls before ordinary same-round chances. Apply their results at the original Lancer triggers. |

The guards include exact counts, troop profiles, captured modifiers, no heroes/joiners, relevant source definitions and combat settings. Untested contexts retain the prior behavior. Both changes have explicit reference switches. The new optional round-start callback is inactive for other contexts; it leaves original attack and effect scheduling intact. Unsupported own-Infantry cache/death paths fail explicitly rather than inventing a rule.

The first experiment's forward reports distinguish every-round reservation from first-live-round-only reservation. Its reverse reports are role controls: those candidates agree numerically in that orientation. In the second experiment, a controlled reference retaining the original normal attack slots matches all ten reports; switching normal scheduling as well fails all ten complete comparisons. These observations support the scoped corrections but do not uniquely identify the game's physical execution phase among every possible explanation.

Both installed Mk2 kernels preserve the complete results and native RNG traces of all496 previous reports and exactly matches all20 additions. Exactness means winner, all six survivor counts and every explicitly captured chance-skill activation count. Complete sanitized combat reports are included as evidence, but other fields such as casualty categories are not silently added to that exactness claim.

All20 new fixtures retain original reported seeds and independently linked battle timestamps. The older seed-minus-one research adapter is disclosed separately. Descriptive timestamp-plus-one agreement for these20 reports is not a universal timestamp derivation claim. No seeds, modifiers, probabilities or outcomes were fitted.

The20 reports are distinct fights, even when payloads coincide. Their four full sanitized report sidecars retain combat fields; only nonmechanical formation identity is replaced by disclosed side-local ordinals, while private capture envelopes are excluded. Historical staged catalogue18 comparisons remain available:0/20 exact,17/20 winners correct for these additions. The prior496 were exact under catalogue18.

Validation:341 engine tests pass, including the301 legacy reference outcomes and exact original-source reconstruction. TypeScript passes. The normal testcase CLI executes65 files/516 reports with0 errors,97 carried-forward warnings and516 complete exact comparisons. See the [machine-readable validation](../research/mk2/installed-catalogue19-validation-20260914.json) and [complete fixture manifest](../research/mk2/evidence516-installed-corpus-manifest-20260914.json). The separate T7 and asymmetric Infantry experiments are outside this checkpoint.

`replay.ownInfantryAmbusher: "reference"` disables only the new own-Infantry reservation; `replay.globalAmbusher: "reference"` disables the guarded global Ambusher adapter. The normal testcase loader forwards both options. Historical staged comparisons describe catalogue18 and remain unchanged. Original source behavior can still be reconstructed byte-for-byte through the updated reversible-port manifest.

The current corpus and publication manifests hash repository text with LF newlines, so verification is consistent across operating systems. They retain local staged-byte hashes separately. Earlier staging manifests retain their original local package digests and are historical provenance, not portable checkout hashes.
