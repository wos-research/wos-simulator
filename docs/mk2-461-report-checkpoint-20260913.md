# Opposing Marksman checkpoint — 461 reports

The unchanged Mk2 v16 kernel reproduces all ten newly captured hero-free battles between 100 T5 FC3 Marksmen on each side: five in each attack direction. Both chronological first reports were checked independently against raw packets before their four remaining reports were released.

Across these ten reports, review checked all ten recorded seeds, 60 survivor slots, 20 explicit Crystal Gunpowder counters, 320 raw modifier fields, and 240 normalized stat axes. Both normal testcase-loader runs pass all five cases without errors. Raw packet files and private identity mappings remain local; this branch includes anonymized executable fixtures and observed-versus-simulated results.

Current reviewed total: **403/461 exact**, with all 461 winners matching. The 58 existing failures remain: 42 affect only skill counts and 16 also affect survivors. Original 160 controlled reports remain exact. No kernel mechanics, troop stats, probabilities, or seeds were changed for this checkpoint.

Exact means winner, all six troop survivor counts and every required explicit supported chance-skill activation count. It does not include every possible report field or uniquely establish hidden server call order. These fixtures replay independently recorded report seeds; their timestamp fields are derived as seed minus one, so this is not independent verification of timestamp-based seeding.

Separate ordering candidates remain under review and are not included in this checkpoint's accuracy total.
