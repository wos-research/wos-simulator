# Captured controlled battle reports

This catalog contains **all 160 controlled report cases** supplied with Mk2. Values below are **observed in the captured reports**, not generated predictions. The replay tests compare Mk2 against these observations.

The [machine-readable cases](../fixtures/controlled.json) include complete predictive army stats, troop counts, recorded seeds, expected outcomes and available native Lua vectors. [Requests only](../fixtures/requests.json) can be passed directly to the replay command. [The 301 original reference cases](../fixtures/reference.json) are a separate regression set, not 301 additional validated in-game battles.

Cases use anonymized IDs. Separate fights with identical predictive inputs remain separate rows. Raw packet captures, account/mail identifiers and screenshots are not included. Seeds remain unchanged; each testcase explicitly uses the diagnostic timestamp `reportedSeed - 1`.

**Survivors are shown as Infantry / Lancer / Marksman.** Attacker and defender refer to their actual roles in each report. Skill counts below are recorded activations; omitted entries are unknown, not inferred zeroes. Skill-credited wounded conversion is outside validation.

## Report groups

| Group | Reports |
|---|---:|
| Ambusher: target depletion | 10 |
| Isolated Ambusher | 10 |
| Ambusher + Volley: Marksman depletion | 10 |
| Ambusher + Volley | 10 |
| Isolated Crystal Gunpowder | 25 |
| Crystal Lance + Crystal Shield | 10 |
| Crystal Lance + Crystal Gunpowder | 10 |
| Isolated Crystal Shield / Crystal Lance | 10 |
| Crystal Lance + Crystal Gunpowder + Crystal Shield | 10 |
| Crystal Gunpowder + Crystal Shield / Shield mirrors | 15 |
| Volley + Crystal Gunpowder | 10 |
| Volley + Crystal Gunpowder + Crystal Shield | 10 |
| Isolated Volley | 10 |
| Volley + Crystal Shield | 10 |

## Ambusher: target depletion

| Case | Recorded seed | Attacking troops | Defending troops | Winner | Attacker survivors (I/L/M) | Defender survivors (I/L/M) | Recorded skill activations |
|---|---:|---|---|---|---|---|---|
| mk2-001 | 1789160443 | 5,000 lancer t7 fc1 | 5,000 infantry t5 fc1<br>500 marksman t5 | attacker | 0 / 1,848 / 0 | 0 / 0 / 0 | attacker: Ambusher=18 |
| mk2-002 | 1789160446 | 5,000 lancer t7 fc1 | 5,000 infantry t5 fc1<br>500 marksman t5 | attacker | 0 / 1,834 / 0 | 0 / 0 / 0 | attacker: Ambusher=18 |
| mk2-003 | 1789160449 | 5,000 lancer t7 fc1 | 5,000 infantry t5 fc1<br>500 marksman t5 | attacker | 0 / 2,010 / 0 | 0 / 0 / 0 | attacker: Ambusher=20 |
| mk2-004 | 1789160459 | 5,000 lancer t7 fc1 | 5,000 infantry t5 fc1<br>500 marksman t5 | attacker | 0 / 2,699 / 0 | 0 / 0 / 0 | attacker: Ambusher=19 |
| mk2-005 | 1789160463 | 5,000 lancer t7 fc1 | 5,000 infantry t5 fc1<br>500 marksman t5 | attacker | 0 / 2,082 / 0 | 0 / 0 / 0 | attacker: Ambusher=18 |
| mk2-006 | 1789160837 | 5,000 infantry t5 fc1<br>500 marksman t5 | 1,834 lancer t7 fc1 | attacker | 4,424 / 0 / 96 | 0 / 0 / 0 | defender: Ambusher=7 |
| mk2-007 | 1789160838 | 5,000 infantry t5 fc1<br>500 marksman t5 | 1,848 lancer t7 fc1 | attacker | 3,984 / 0 / 0 | 0 / 0 / 0 | defender: Ambusher=16 |
| mk2-008 | 1789160838 | 5,000 infantry t5 fc1<br>500 marksman t5 | 2,699 lancer t7 fc1 | attacker | 2,691 / 0 / 0 | 0 / 0 / 0 | defender: Ambusher=24 |
| mk2-009 | 1789160840 | 5,000 infantry t5 fc1<br>500 marksman t5 | 2,010 lancer t7 fc1 | attacker | 4,281 / 0 / 93 | 0 / 0 / 0 | defender: Ambusher=6 |
| mk2-010 | 1789160842 | 5,000 infantry t5 fc1<br>500 marksman t5 | 2,082 lancer t7 fc1 | attacker | 3,917 / 0 / 0 | 0 / 0 / 0 | defender: Ambusher=14 |

## Isolated Ambusher

| Case | Recorded seed | Attacking troops | Defending troops | Winner | Attacker survivors (I/L/M) | Defender survivors (I/L/M) | Recorded skill activations |
|---|---:|---|---|---|---|---|---|
| mk2-011 | 1789159698 | 5,000 lancer t7 fc1 | 5,000 infantry t5 fc1<br>5,000 marksman t5 | defender | 0 / 0 / 0 | 4,081 / 0 / 4,572 | attacker: Ambusher=3 |
| mk2-012 | 1789159705 | 5,000 lancer t7 fc1 | 5,000 infantry t5 fc1<br>5,000 marksman t5 | defender | 0 / 0 / 0 | 4,027 / 0 / 4,801 | attacker: Ambusher=1 |
| mk2-013 | 1789159710 | 5,000 lancer t7 fc1 | 5,000 infantry t5 fc1<br>5,000 marksman t5 | defender | 0 / 0 / 0 | 4,173 / 0 / 4,035 | attacker: Ambusher=5 |
| mk2-014 | 1789159714 | 5,000 lancer t7 fc1 | 5,000 infantry t5 fc1<br>5,000 marksman t5 | defender | 0 / 0 / 0 | 4,109 / 0 / 4,341 | attacker: Ambusher=3 |
| mk2-015 | 1789159715 | 5,000 lancer t7 fc1 | 5,000 infantry t5 fc1<br>5,000 marksman t5 | defender | 0 / 0 / 0 | 4,270 / 0 / 3,587 | attacker: Ambusher=9 |
| mk2-016 | 1789159781 | 5,000 infantry t5 fc1<br>5,000 marksman t5 | 5,000 lancer t7 fc1 | attacker | 4,192 / 0 / 3,977 | 0 / 0 / 0 | defender: Ambusher=6 |
| mk2-017 | 1789159786 | 5,000 infantry t5 fc1<br>5,000 marksman t5 | 5,000 lancer t7 fc1 | attacker | 4,192 / 0 / 4,041 | 0 / 0 / 0 | defender: Ambusher=6 |
| mk2-018 | 1789159787 | 5,000 infantry t5 fc1<br>5,000 marksman t5 | 5,000 lancer t7 fc1 | attacker | 4,242 / 0 / 3,737 | 0 / 0 / 0 | defender: Ambusher=7 |
| mk2-019 | 1789159794 | 5,000 infantry t5 fc1<br>5,000 marksman t5 | 5,000 lancer t7 fc1 | attacker | 4,288 / 0 / 3,436 | 0 / 0 / 0 | defender: Ambusher=9 |
| mk2-020 | 1789159798 | 5,000 infantry t5 fc1<br>5,000 marksman t5 | 5,000 lancer t7 fc1 | attacker | 4,166 / 0 / 4,092 | 0 / 0 / 0 | defender: Ambusher=5 |

## Ambusher + Volley: Marksman depletion

| Case | Recorded seed | Attacking troops | Defending troops | Winner | Attacker survivors (I/L/M) | Defender survivors (I/L/M) | Recorded skill activations |
|---|---:|---|---|---|---|---|---|
| mk2-021 | 1789161131 | 5,000 lancer t7 fc1 | 5,000 infantry t5 fc1<br>500 marksman t7 | attacker | 0 / 2,322 / 0 | 0 / 0 / 0 | attacker: Ambusher=23<br>defender: Volley=10 |
| mk2-022 | 1789161135 | 5,000 lancer t7 fc1 | 5,000 infantry t5 fc1<br>500 marksman t7 | defender | 0 / 0 / 0 | 1,397 / 0 / 0 | attacker: Ambusher=15<br>defender: Volley=8 |
| mk2-023 | 1789161136 | 5,000 lancer t7 fc1 | 5,000 infantry t5 fc1<br>500 marksman t7 | attacker | 0 / 2,030 / 0 | 0 / 0 / 0 | attacker: Ambusher=16<br>defender: Volley=11 |
| mk2-024 | 1789161145 | 5,000 lancer t7 fc1 | 5,000 infantry t5 fc1<br>500 marksman t7 | attacker | 0 / 1,568 / 0 | 0 / 0 / 0 | attacker: Ambusher=14<br>defender: Volley=14 |
| mk2-025 | 1789161153 | 5,000 lancer t7 fc1 | 5,000 infantry t5 fc1<br>500 marksman t7 | attacker | 0 / 2,194 / 0 | 0 / 0 / 0 | attacker: Ambusher=24<br>defender: Volley=19 |
| mk2-026 | 1789161210 | 5,000 infantry t5 fc1<br>500 marksman t7 | 5,000 lancer t7 fc1 | defender | 0 / 0 / 0 | 0 / 2,364 / 0 | attacker: Volley=12<br>defender: Ambusher=27 |
| mk2-027 | 1789161212 | 5,000 infantry t5 fc1<br>500 marksman t7 | 5,000 lancer t7 fc1 | defender | 0 / 0 / 0 | 0 / 1,118 / 0 | attacker: Volley=12<br>defender: Ambusher=22 |
| mk2-028 | 1789161214 | 5,000 infantry t5 fc1<br>500 marksman t7 | 5,000 lancer t7 fc1 | defender | 0 / 0 / 0 | 0 / 1,849 / 0 | attacker: Volley=6<br>defender: Ambusher=16 |
| mk2-029 | 1789161216 | 5,000 infantry t5 fc1<br>500 marksman t7 | 5,000 lancer t7 fc1 | attacker | 2,164 / 0 / 0 | 0 / 0 / 0 | attacker: Volley=12<br>defender: Ambusher=13 |
| mk2-030 | 1789161222 | 5,000 infantry t5 fc1<br>500 marksman t7 | 5,000 lancer t7 fc1 | defender | 0 / 0 / 0 | 0 / 1,915 / 0 | attacker: Volley=8<br>defender: Ambusher=14 |

## Ambusher + Volley

| Case | Recorded seed | Attacking troops | Defending troops | Winner | Attacker survivors (I/L/M) | Defender survivors (I/L/M) | Recorded skill activations |
|---|---:|---|---|---|---|---|---|
| mk2-031 | 1789160187 | 5,000 lancer t7 fc1 | 5,000 infantry t5 fc1<br>5,000 marksman t7 | defender | 0 / 0 / 0 | 4,483 / 0 / 4,232 | attacker: Ambusher=6<br>defender: Volley=3 |
| mk2-032 | 1789160190 | 5,000 lancer t7 fc1 | 5,000 infantry t5 fc1<br>5,000 marksman t7 | defender | 0 / 0 / 0 | 4,117 / 0 / 4,957 | attacker: Ambusher=1<br>defender: Volley=1 |
| mk2-033 | 1789160194 | 5,000 lancer t7 fc1 | 5,000 infantry t5 fc1<br>5,000 marksman t7 | defender | 0 / 0 / 0 | 4,181 / 0 / 4,677 | attacker: Ambusher=3<br>defender: Volley=0 |
| mk2-034 | 1789160206 | 5,000 lancer t7 fc1 | 5,000 infantry t5 fc1<br>5,000 marksman t7 | defender | 0 / 0 / 0 | 4,365 / 0 / 4,118 | attacker: Ambusher=6<br>defender: Volley=0 |
| mk2-035 | 1789160212 | 5,000 lancer t7 fc1 | 5,000 infantry t5 fc1<br>5,000 marksman t7 | defender | 0 / 0 / 0 | 4,274 / 0 / 4,531 | attacker: Ambusher=4<br>defender: Volley=1 |
| mk2-036 | 1789160261 | 5,000 infantry t5 fc1<br>5,000 marksman t7 | 5,000 lancer t7 fc1 | attacker | 4,342 / 0 / 4,554 | 0 / 0 / 0 | attacker: Volley=4<br>defender: Ambusher=4 |
| mk2-037 | 1789160265 | 5,000 infantry t5 fc1<br>5,000 marksman t7 | 5,000 lancer t7 fc1 | attacker | 4,471 / 0 / 4,200 | 0 / 0 / 0 | attacker: Volley=2<br>defender: Ambusher=7 |
| mk2-038 | 1789160269 | 5,000 infantry t5 fc1<br>5,000 marksman t7 | 5,000 lancer t7 fc1 | attacker | 4,306 / 0 / 4,599 | 0 / 0 / 0 | attacker: Volley=2<br>defender: Ambusher=4 |
| mk2-039 | 1789160272 | 5,000 infantry t5 fc1<br>5,000 marksman t7 | 5,000 lancer t7 fc1 | attacker | 4,298 / 0 / 4,746 | 0 / 0 / 0 | attacker: Volley=4<br>defender: Ambusher=2 |
| mk2-040 | 1789160274 | 5,000 infantry t5 fc1<br>5,000 marksman t7 | 5,000 lancer t7 fc1 | attacker | 4,299 / 0 / 4,389 | 0 / 0 / 0 | attacker: Volley=1<br>defender: Ambusher=4 |

## Isolated Crystal Gunpowder

| Case | Recorded seed | Attacking troops | Defending troops | Winner | Attacker survivors (I/L/M) | Defender survivors (I/L/M) | Recorded skill activations |
|---|---:|---|---|---|---|---|---|
| mk2-041 | 1789153123 | 10,000 marksman t5 fc3 | 10,000 infantry t5 fc1 | attacker | 0 / 0 / 9,090 | 0 / 0 / 0 | attacker: Gunpowder=4 |
| mk2-042 | 1789153129 | 10,000 marksman t5 fc3 | 10,000 infantry t5 fc1 | attacker | 0 / 0 / 9,074 | 0 / 0 / 0 | attacker: Gunpowder=3 |
| mk2-043 | 1789153134 | 10,000 marksman t5 fc3 | 10,000 infantry t5 fc1 | attacker | 0 / 0 / 9,139 | 0 / 0 / 0 | attacker: Gunpowder=7 |
| mk2-044 | 1789153134 | 10,000 marksman t5 fc3 | 10,000 infantry t5 fc1 | attacker | 0 / 0 / 9,139 | 0 / 0 / 0 | attacker: Gunpowder=7 |
| mk2-045 | 1789153157 | 10,000 marksman t5 fc3 | 10,000 infantry t5 fc1 | attacker | 0 / 0 / 9,147 | 0 / 0 / 0 | attacker: Gunpowder=7 |
| mk2-046 | 1789153465 | 10,000 marksman t5 fc3 | 10,000 infantry t5 fc1 | attacker | 0 / 0 / 9,109 | 0 / 0 / 0 | attacker: Gunpowder=5 |
| mk2-047 | 1789153468 | 10,000 marksman t5 fc3 | 10,000 infantry t5 fc1 | attacker | 0 / 0 / 9,123 | 0 / 0 / 0 | attacker: Gunpowder=6 |
| mk2-048 | 1789153473 | 10,000 marksman t5 fc3 | 10,000 infantry t5 fc1 | attacker | 0 / 0 / 9,080 | 0 / 0 / 0 | attacker: Gunpowder=3 |
| mk2-049 | 1789153476 | 10,000 marksman t5 fc3 | 10,000 infantry t5 fc1 | attacker | 0 / 0 / 9,090 | 0 / 0 / 0 | attacker: Gunpowder=5 |
| mk2-050 | 1789153489 | 10,000 marksman t5 fc3 | 10,000 infantry t5 fc1 | attacker | 0 / 0 / 9,161 | 0 / 0 / 0 | attacker: Gunpowder=7 |
| mk2-051 | 1789153950 | 5,000 marksman t5 fc3 | 10,000 infantry t5 fc1 | attacker | 0 / 0 / 3,673 | 0 / 0 / 0 | attacker: Gunpowder=8 |
| mk2-052 | 1789153953 | 5,000 marksman t5 fc3 | 10,000 infantry t5 fc1 | attacker | 0 / 0 / 3,702 | 0 / 0 / 0 | attacker: Gunpowder=11 |
| mk2-053 | 1789153956 | 5,000 marksman t5 fc3 | 10,000 infantry t5 fc1 | attacker | 0 / 0 / 3,685 | 0 / 0 / 0 | attacker: Gunpowder=11 |
| mk2-054 | 1789153959 | 5,000 marksman t5 fc3 | 10,000 infantry t5 fc1 | attacker | 0 / 0 / 3,650 | 0 / 0 / 0 | attacker: Gunpowder=10 |
| mk2-055 | 1789153967 | 5,000 marksman t5 fc3 | 10,000 infantry t5 fc1 | attacker | 0 / 0 / 3,689 | 0 / 0 / 0 | attacker: Gunpowder=12 |
| mk2-056 | 1789154110 | 5,000 marksman t5 fc3 | 10,000 infantry t5 fc1 | attacker | 0 / 0 / 3,681 | 0 / 0 / 0 | attacker: Gunpowder=10 |
| mk2-057 | 1789154113 | 5,000 marksman t5 fc3 | 10,000 infantry t5 fc1 | attacker | 0 / 0 / 3,689 | 0 / 0 / 0 | attacker: Gunpowder=10 |
| mk2-058 | 1789154115 | 5,000 marksman t5 fc3 | 10,000 infantry t5 fc1 | attacker | 0 / 0 / 3,706 | 0 / 0 / 0 | attacker: Gunpowder=14 |
| mk2-059 | 1789154156 | 5,000 marksman t5 fc3 | 10,000 infantry t5 fc1 | attacker | 0 / 0 / 3,677 | 0 / 0 / 0 | attacker: Gunpowder=9 |
| mk2-060 | 1789154158 | 5,000 marksman t5 fc3 | 10,000 infantry t5 fc1 | attacker | 0 / 0 / 3,647 | 0 / 0 / 0 | attacker: Gunpowder=8 |
| mk2-061 | 1789154530 | 10,000 infantry t5 fc1 | 5,000 marksman t5 fc3 | defender | 0 / 0 / 0 | 0 / 0 / 3,734 | defender: Gunpowder=13 |
| mk2-062 | 1789154532 | 10,000 infantry t5 fc1 | 5,000 marksman t5 fc3 | defender | 0 / 0 / 0 | 0 / 0 / 3,781 | defender: Gunpowder=17 |
| mk2-063 | 1789154535 | 10,000 infantry t5 fc1 | 5,000 marksman t5 fc3 | defender | 0 / 0 / 0 | 0 / 0 / 3,683 | defender: Gunpowder=10 |
| mk2-064 | 1789154538 | 10,000 infantry t5 fc1 | 5,000 marksman t5 fc3 | defender | 0 / 0 / 0 | 0 / 0 / 3,757 | defender: Gunpowder=14 |
| mk2-065 | 1789154546 | 10,000 infantry t5 fc1 | 5,000 marksman t5 fc3 | defender | 0 / 0 / 0 | 0 / 0 / 3,745 | defender: Gunpowder=14 |

## Crystal Lance + Crystal Shield

| Case | Recorded seed | Attacking troops | Defending troops | Winner | Attacker survivors (I/L/M) | Defender survivors (I/L/M) | Recorded skill activations |
|---|---:|---|---|---|---|---|---|
| mk2-066 | 1789156722 | 5,000 lancer t5 fc4 | 5,000 infantry t5 fc5 | defender | 0 / 0 / 0 | 2,424 / 0 / 0 | attacker: Lance=11<br>defender: Shield=40 |
| mk2-067 | 1789156726 | 5,000 lancer t5 fc4 | 5,000 infantry t5 fc5 | defender | 0 / 0 / 0 | 2,561 / 0 / 0 | attacker: Lance=10<br>defender: Shield=47 |
| mk2-068 | 1789156728 | 5,000 lancer t5 fc4 | 5,000 infantry t5 fc5 | defender | 0 / 0 / 0 | 2,282 / 0 / 0 | attacker: Lance=17<br>defender: Shield=44 |
| mk2-069 | 1789156734 | 5,000 lancer t5 fc4 | 5,000 infantry t5 fc5 | defender | 0 / 0 / 0 | 2,383 / 0 / 0 | attacker: Lance=12<br>defender: Shield=40 |
| mk2-070 | 1789156738 | 5,000 lancer t5 fc4 | 5,000 infantry t5 fc5 | defender | 0 / 0 / 0 | 2,527 / 0 / 0 | attacker: Lance=8<br>defender: Shield=41 |
| mk2-071 | 1789156796 | 5,000 infantry t5 fc5 | 5,000 lancer t5 fc4 | attacker | 2,141 / 0 / 0 | 0 / 0 / 0 | attacker: Shield=46<br>defender: Lance=10 |
| mk2-072 | 1789156799 | 5,000 infantry t5 fc5 | 5,000 lancer t5 fc4 | attacker | 2,269 / 0 / 0 | 0 / 0 / 0 | attacker: Shield=41<br>defender: Lance=7 |
| mk2-073 | 1789156801 | 5,000 infantry t5 fc5 | 5,000 lancer t5 fc4 | attacker | 2,333 / 0 / 0 | 0 / 0 / 0 | attacker: Shield=38<br>defender: Lance=6 |
| mk2-074 | 1789156807 | 5,000 infantry t5 fc5 | 5,000 lancer t5 fc4 | attacker | 2,153 / 0 / 0 | 0 / 0 / 0 | attacker: Shield=40<br>defender: Lance=12 |
| mk2-075 | 1789156810 | 5,000 infantry t5 fc5 | 5,000 lancer t5 fc4 | attacker | 2,230 / 0 / 0 | 0 / 0 / 0 | attacker: Shield=42<br>defender: Lance=11 |

## Crystal Lance + Crystal Gunpowder

| Case | Recorded seed | Attacking troops | Defending troops | Winner | Attacker survivors (I/L/M) | Defender survivors (I/L/M) | Recorded skill activations |
|---|---:|---|---|---|---|---|---|
| mk2-076 | 1789157684 | 5,000 lancer t5 fc4<br>5,000 marksman t5 fc3 | 10,000 infantry t5 fc1 | attacker | 0 / 4,330 / 5,000 | 0 / 0 / 0 | attacker: Lance=1, Gunpowder=5 |
| mk2-077 | 1789157690 | 5,000 lancer t5 fc4<br>5,000 marksman t5 fc3 | 10,000 infantry t5 fc1 | attacker | 0 / 4,352 / 5,000 | 0 / 0 / 0 | attacker: Lance=4, Gunpowder=5 |
| mk2-078 | 1789157694 | 5,000 lancer t5 fc4<br>5,000 marksman t5 fc3 | 10,000 infantry t5 fc1 | attacker | 0 / 4,336 / 5,000 | 0 / 0 / 0 | attacker: Lance=1, Gunpowder=7 |
| mk2-079 | 1789157695 | 5,000 lancer t5 fc4<br>5,000 marksman t5 fc3 | 10,000 infantry t5 fc1 | attacker | 0 / 4,329 / 5,000 | 0 / 0 / 0 | attacker: Lance=2, Gunpowder=5 |
| mk2-080 | 1789157698 | 5,000 lancer t5 fc4<br>5,000 marksman t5 fc3 | 10,000 infantry t5 fc1 | attacker | 0 / 4,324 / 5,000 | 0 / 0 / 0 | attacker: Lance=2, Gunpowder=3 |
| mk2-081 | 1789157742 | 10,000 infantry t5 fc1 | 5,000 lancer t5 fc4<br>5,000 marksman t5 fc3 | defender | 0 / 0 / 0 | 0 / 4,365 / 5,000 | defender: Lance=4, Gunpowder=5 |
| mk2-082 | 1789157748 | 10,000 infantry t5 fc1 | 5,000 lancer t5 fc4<br>5,000 marksman t5 fc3 | defender | 0 / 0 / 0 | 0 / 4,337 / 5,000 | defender: Lance=1, Gunpowder=6 |
| mk2-083 | 1789157749 | 10,000 infantry t5 fc1 | 5,000 lancer t5 fc4<br>5,000 marksman t5 fc3 | defender | 0 / 0 / 0 | 0 / 4,326 / 5,000 | defender: Lance=2, Gunpowder=6 |
| mk2-084 | 1789157759 | 10,000 infantry t5 fc1 | 5,000 lancer t5 fc4<br>5,000 marksman t5 fc3 | defender | 0 / 0 / 0 | 0 / 4,344 / 5,000 | defender: Lance=4, Gunpowder=3 |
| mk2-085 | 1789157800 | 10,000 infantry t5 fc1 | 5,000 lancer t5 fc4<br>5,000 marksman t5 fc3 | defender | 0 / 0 / 0 | 0 / 4,341 / 5,000 | defender: Lance=3, Gunpowder=6 |

## Isolated Crystal Shield / Crystal Lance

| Case | Recorded seed | Attacking troops | Defending troops | Winner | Attacker survivors (I/L/M) | Defender survivors (I/L/M) | Recorded skill activations |
|---|---:|---|---|---|---|---|---|
| mk2-086 | 1789154933 | 5,000 infantry t5 fc5 | 10,000 marksman t5 | attacker | 3,165 / 0 / 0 | 0 / 0 / 0 | attacker: Shield=29 |
| mk2-087 | 1789154934 | 5,000 infantry t5 fc5 | 10,000 marksman t5 | attacker | 3,140 / 0 / 0 | 0 / 0 / 0 | attacker: Shield=28 |
| mk2-088 | 1789154937 | 5,000 infantry t5 fc5 | 10,000 marksman t5 | attacker | 3,143 / 0 / 0 | 0 / 0 / 0 | attacker: Shield=24 |
| mk2-089 | 1789154946 | 5,000 infantry t5 fc5 | 10,000 marksman t5 | attacker | 3,072 / 0 / 0 | 0 / 0 / 0 | attacker: Shield=20 |
| mk2-090 | 1789154958 | 5,000 infantry t5 fc5 | 10,000 marksman t5 | attacker | 3,141 / 0 / 0 | 0 / 0 / 0 | attacker: Shield=26 |
| mk2-091 | 1789155154 | 5,000 lancer t5 fc4 | 10,000 infantry t5 fc1 | attacker | 0 / 3,259 / 0 | 0 / 0 / 0 | attacker: Lance=13 |
| mk2-092 | 1789155157 | 5,000 lancer t5 fc4 | 10,000 infantry t5 fc1 | attacker | 0 / 3,126 / 0 | 0 / 0 / 0 | attacker: Lance=7 |
| mk2-093 | 1789155161 | 5,000 lancer t5 fc4 | 10,000 infantry t5 fc1 | attacker | 0 / 3,086 / 0 | 0 / 0 / 0 | attacker: Lance=6 |
| mk2-094 | 1789155167 | 5,000 lancer t5 fc4 | 10,000 infantry t5 fc1 | attacker | 0 / 3,167 / 0 | 0 / 0 / 0 | attacker: Lance=9 |
| mk2-095 | 1789155175 | 5,000 lancer t5 fc4 | 10,000 infantry t5 fc1 | attacker | 0 / 3,129 / 0 | 0 / 0 / 0 | attacker: Lance=6 |

## Crystal Lance + Crystal Gunpowder + Crystal Shield

| Case | Recorded seed | Attacking troops | Defending troops | Winner | Attacker survivors (I/L/M) | Defender survivors (I/L/M) | Recorded skill activations |
|---|---:|---|---|---|---|---|---|
| mk2-096 | 1789157178 | 5,000 lancer t5 fc4<br>5,000 marksman t5 fc3 | 10,000 infantry t5 fc5 | attacker | 0 / 0 / 2,714 | 0 / 0 / 0 | attacker: Lance=11, Gunpowder=20<br>defender: Shield=65 |
| mk2-097 | 1789157183 | 5,000 lancer t5 fc4<br>5,000 marksman t5 fc3 | 10,000 infantry t5 fc5 | attacker | 0 / 0 / 1,056 | 0 / 0 / 0 | attacker: Lance=1, Gunpowder=20<br>defender: Shield=64 |
| mk2-098 | 1789157187 | 5,000 lancer t5 fc4<br>5,000 marksman t5 fc3 | 10,000 infantry t5 fc5 | attacker | 0 / 0 / 1,799 | 0 / 0 / 0 | attacker: Lance=7, Gunpowder=20<br>defender: Shield=64 |
| mk2-099 | 1789157191 | 5,000 lancer t5 fc4<br>5,000 marksman t5 fc3 | 10,000 infantry t5 fc5 | attacker | 0 / 0 / 2,193 | 0 / 0 / 0 | attacker: Lance=4, Gunpowder=23<br>defender: Shield=70 |
| mk2-100 | 1789157194 | 5,000 lancer t5 fc4<br>5,000 marksman t5 fc3 | 10,000 infantry t5 fc5 | attacker | 0 / 0 / 2,331 | 0 / 0 / 0 | attacker: Lance=5, Gunpowder=21<br>defender: Shield=59 |
| mk2-101 | 1789157286 | 10,000 infantry t5 fc5 | 5,000 lancer t5 fc4<br>5,000 marksman t5 fc3 | defender | 0 / 0 / 0 | 0 / 0 / 1,532 | attacker: Shield=74<br>defender: Lance=1, Gunpowder=23 |
| mk2-102 | 1789157291 | 10,000 infantry t5 fc5 | 5,000 lancer t5 fc4<br>5,000 marksman t5 fc3 | defender | 0 / 0 / 0 | 0 / 0 / 1,736 | attacker: Shield=72<br>defender: Lance=2, Gunpowder=23 |
| mk2-103 | 1789157292 | 10,000 infantry t5 fc5 | 5,000 lancer t5 fc4<br>5,000 marksman t5 fc3 | defender | 0 / 0 / 0 | 0 / 0 / 1,182 | attacker: Shield=62<br>defender: Lance=2, Gunpowder=15 |
| mk2-104 | 1789157299 | 10,000 infantry t5 fc5 | 5,000 lancer t5 fc4<br>5,000 marksman t5 fc3 | defender | 0 / 0 / 0 | 0 / 0 / 1,834 | attacker: Shield=56<br>defender: Lance=4, Gunpowder=14 |
| mk2-105 | 1789157304 | 10,000 infantry t5 fc5 | 5,000 lancer t5 fc4<br>5,000 marksman t5 fc3 | defender | 0 / 0 / 0 | 0 / 0 / 1,106 | attacker: Shield=66<br>defender: Lance=1, Gunpowder=15 |

## Crystal Gunpowder + Crystal Shield / Shield mirrors

| Case | Recorded seed | Attacking troops | Defending troops | Winner | Attacker survivors (I/L/M) | Defender survivors (I/L/M) | Recorded skill activations |
|---|---:|---|---|---|---|---|---|
| mk2-106 | 1789155811 | 5,000 marksman t5 fc3 | 5,000 infantry t5 fc5 | defender | 0 / 0 / 0 | 1,047 / 0 / 0 | attacker: Gunpowder=27<br>defender: Shield=46 |
| mk2-107 | 1789155814 | 5,000 marksman t5 fc3 | 5,000 infantry t5 fc5 | defender | 0 / 0 / 0 | 1,213 / 0 / 0 | attacker: Gunpowder=16<br>defender: Shield=42 |
| mk2-108 | 1789155818 | 5,000 marksman t5 fc3 | 5,000 infantry t5 fc5 | defender | 0 / 0 / 0 | 819 / 0 / 0 | attacker: Gunpowder=26<br>defender: Shield=41 |
| mk2-109 | 1789155822 | 5,000 marksman t5 fc3 | 5,000 infantry t5 fc5 | defender | 0 / 0 / 0 | 1,218 / 0 / 0 | attacker: Gunpowder=16<br>defender: Shield=36 |
| mk2-110 | 1789155827 | 5,000 marksman t5 fc3 | 5,000 infantry t5 fc5 | defender | 0 / 0 / 0 | 1,347 / 0 / 0 | attacker: Gunpowder=11<br>defender: Shield=27 |
| mk2-111 | 1789155875 | 5,000 infantry t5 fc5 | 5,000 infantry t5 fc5 | defender | 0 / 0 / 0 | 423 / 0 / 0 | attacker: Shield=172<br>defender: Shield=196 |
| mk2-112 | 1789155881 | 5,000 infantry t5 fc5 | 5,000 infantry t5 fc5 | defender | 0 / 0 / 0 | 316 / 0 / 0 | attacker: Shield=197<br>defender: Shield=201 |
| mk2-113 | 1789155884 | 5,000 infantry t5 fc5 | 5,000 infantry t5 fc5 | defender | 0 / 0 / 0 | 334 / 0 / 0 | attacker: Shield=213<br>defender: Shield=205 |
| mk2-114 | 1789155889 | 5,000 infantry t5 fc5 | 5,000 infantry t5 fc5 | defender | 0 / 0 / 0 | 347 / 0 / 0 | attacker: Shield=201<br>defender: Shield=211 |
| mk2-115 | 1789155893 | 5,000 infantry t5 fc5 | 5,000 infantry t5 fc5 | defender | 0 / 0 / 0 | 329 / 0 / 0 | attacker: Shield=187<br>defender: Shield=199 |
| mk2-116 | 1789156195 | 5,000 infantry t5 fc5 | 5,000 marksman t5 fc3 | attacker | 1,681 / 0 / 0 | 0 / 0 / 0 | attacker: Shield=42<br>defender: Gunpowder=16 |
| mk2-117 | 1789156201 | 5,000 infantry t5 fc5 | 5,000 marksman t5 fc3 | attacker | 1,470 / 0 / 0 | 0 / 0 / 0 | attacker: Shield=35<br>defender: Gunpowder=19 |
| mk2-118 | 1789156202 | 5,000 infantry t5 fc5 | 5,000 marksman t5 fc3 | attacker | 1,439 / 0 / 0 | 0 / 0 / 0 | attacker: Shield=36<br>defender: Gunpowder=22 |
| mk2-119 | 1789156205 | 5,000 infantry t5 fc5 | 5,000 marksman t5 fc3 | attacker | 1,719 / 0 / 0 | 0 / 0 / 0 | attacker: Shield=31<br>defender: Gunpowder=13 |
| mk2-120 | 1789156213 | 5,000 infantry t5 fc5 | 5,000 marksman t5 fc3 | attacker | 1,368 / 0 / 0 | 0 / 0 / 0 | attacker: Shield=35<br>defender: Gunpowder=23 |

## Volley + Crystal Gunpowder

| Case | Recorded seed | Attacking troops | Defending troops | Winner | Attacker survivors (I/L/M) | Defender survivors (I/L/M) | Recorded skill activations |
|---|---:|---|---|---|---|---|---|
| mk2-121 | 1789161571 | 5,000 marksman t7 fc3 | 10,000 infantry t5 fc1 | attacker | 0 / 0 / 3,998 | 0 / 0 / 0 | attacker: Gunpowder=2, Volley=3 |
| mk2-122 | 1789161577 | 5,000 marksman t7 fc3 | 10,000 infantry t5 fc1 | attacker | 0 / 0 / 4,054 | 0 / 0 / 0 | attacker: Gunpowder=4, Volley=3 |
| mk2-123 | 1789161582 | 5,000 marksman t7 fc3 | 10,000 infantry t5 fc1 | attacker | 0 / 0 / 4,086 | 0 / 0 / 0 | attacker: Gunpowder=5, Volley=5 |
| mk2-124 | 1789161584 | 5,000 marksman t7 fc3 | 10,000 infantry t5 fc1 | attacker | 0 / 0 / 4,204 | 0 / 0 / 0 | attacker: Gunpowder=12, Volley=6 |
| mk2-125 | 1789161586 | 5,000 marksman t7 fc3 | 10,000 infantry t5 fc1 | attacker | 0 / 0 / 4,166 | 0 / 0 / 0 | attacker: Gunpowder=9, Volley=7 |
| mk2-126 | 1789161634 | 10,000 infantry t5 fc1 | 5,000 marksman t7 fc3 | defender | 0 / 0 / 0 | 0 / 0 / 4,062 | defender: Gunpowder=5, Volley=5 |
| mk2-127 | 1789161637 | 10,000 infantry t5 fc1 | 5,000 marksman t7 fc3 | defender | 0 / 0 / 0 | 0 / 0 / 4,117 | defender: Gunpowder=7, Volley=5 |
| mk2-128 | 1789161639 | 10,000 infantry t5 fc1 | 5,000 marksman t7 fc3 | defender | 0 / 0 / 0 | 0 / 0 / 4,122 | defender: Gunpowder=6, Volley=5 |
| mk2-129 | 1789161652 | 10,000 infantry t5 fc1 | 5,000 marksman t7 fc3 | defender | 0 / 0 / 0 | 0 / 0 / 4,130 | defender: Gunpowder=9, Volley=5 |
| mk2-130 | 1789161652 | 10,000 infantry t5 fc1 | 5,000 marksman t7 fc3 | defender | 0 / 0 / 0 | 0 / 0 / 4,130 | defender: Gunpowder=9, Volley=5 |

## Volley + Crystal Gunpowder + Crystal Shield

| Case | Recorded seed | Attacking troops | Defending troops | Winner | Attacker survivors (I/L/M) | Defender survivors (I/L/M) | Recorded skill activations |
|---|---:|---|---|---|---|---|---|
| mk2-131 | 1789162224 | 5,000 marksman t7 fc3 | 10,000 infantry t5 fc5 | defender | 0 / 0 / 0 | 5,227 / 0 / 0 | attacker: Gunpowder=16, Volley=7<br>defender: Shield=37 |
| mk2-132 | 1789162228 | 5,000 marksman t7 fc3 | 10,000 infantry t5 fc5 | defender | 0 / 0 / 0 | 5,722 / 0 / 0 | attacker: Gunpowder=9, Volley=4<br>defender: Shield=34 |
| mk2-133 | 1789162237 | 5,000 marksman t7 fc3 | 10,000 infantry t5 fc5 | defender | 0 / 0 / 0 | 5,232 / 0 / 0 | attacker: Gunpowder=17, Volley=9<br>defender: Shield=43 |
| mk2-134 | 1789162242 | 5,000 marksman t7 fc3 | 10,000 infantry t5 fc5 | defender | 0 / 0 / 0 | 5,277 / 0 / 0 | attacker: Gunpowder=16, Volley=8<br>defender: Shield=40 |
| mk2-135 | 1789162244 | 5,000 marksman t7 fc3 | 10,000 infantry t5 fc5 | defender | 0 / 0 / 0 | 5,331 / 0 / 0 | attacker: Gunpowder=16, Volley=7<br>defender: Shield=38 |
| mk2-136 | 1789162292 | 10,000 infantry t5 fc5 | 5,000 marksman t7 fc3 | attacker | 5,192 / 0 / 0 | 0 / 0 / 0 | attacker: Shield=39<br>defender: Gunpowder=13, Volley=8 |
| mk2-137 | 1789162292 | 10,000 infantry t5 fc5 | 5,000 marksman t7 fc3 | attacker | 5,192 / 0 / 0 | 0 / 0 / 0 | attacker: Shield=39<br>defender: Gunpowder=13, Volley=8 |
| mk2-138 | 1789162292 | 10,000 infantry t5 fc5 | 5,000 marksman t7 fc3 | attacker | 5,192 / 0 / 0 | 0 / 0 / 0 | attacker: Shield=39<br>defender: Gunpowder=13, Volley=8 |
| mk2-139 | 1789162296 | 10,000 infantry t5 fc5 | 5,000 marksman t7 fc3 | attacker | 5,374 / 0 / 0 | 0 / 0 / 0 | attacker: Shield=36<br>defender: Gunpowder=16, Volley=7 |
| mk2-140 | 1789162313 | 10,000 infantry t5 fc5 | 5,000 marksman t7 fc3 | attacker | 5,327 / 0 / 0 | 0 / 0 / 0 | attacker: Shield=33<br>defender: Gunpowder=16, Volley=6 |

## Isolated Volley

| Case | Recorded seed | Attacking troops | Defending troops | Winner | Attacker survivors (I/L/M) | Defender survivors (I/L/M) | Recorded skill activations |
|---|---:|---|---|---|---|---|---|
| mk2-141 | 1789158240 | 5,000 marksman t7 | 10,000 infantry t5 fc1 | defender | 0 / 0 / 0 | 2,733 / 0 / 0 | attacker: Volley=9 |
| mk2-142 | 1789158244 | 5,000 marksman t7 | 10,000 infantry t5 fc1 | defender | 0 / 0 / 0 | 1,513 / 0 / 0 | attacker: Volley=19 |
| mk2-143 | 1789158246 | 5,000 marksman t7 | 10,000 infantry t5 fc1 | defender | 0 / 0 / 0 | 2,468 / 0 / 0 | attacker: Volley=9 |
| mk2-144 | 1789158250 | 5,000 marksman t7 | 10,000 infantry t5 fc1 | defender | 0 / 0 / 0 | 2,303 / 0 / 0 | attacker: Volley=13 |
| mk2-145 | 1789158256 | 5,000 marksman t7 | 10,000 infantry t5 fc1 | defender | 0 / 0 / 0 | 1,824 / 0 / 0 | attacker: Volley=15 |
| mk2-146 | 1789158323 | 10,000 infantry t5 fc1 | 5,000 marksman t7 | attacker | 2,118 / 0 / 0 | 0 / 0 / 0 | defender: Volley=10 |
| mk2-147 | 1789158325 | 10,000 infantry t5 fc1 | 5,000 marksman t7 | attacker | 2,707 / 0 / 0 | 0 / 0 / 0 | defender: Volley=8 |
| mk2-148 | 1789158326 | 10,000 infantry t5 fc1 | 5,000 marksman t7 | attacker | 2,367 / 0 / 0 | 0 / 0 / 0 | defender: Volley=12 |
| mk2-149 | 1789158327 | 10,000 infantry t5 fc1 | 5,000 marksman t7 | attacker | 2,522 / 0 / 0 | 0 / 0 / 0 | defender: Volley=11 |
| mk2-150 | 1789158350 | 10,000 infantry t5 fc1 | 5,000 marksman t7 | attacker | 2,427 / 0 / 0 | 0 / 0 / 0 | defender: Volley=10 |

## Volley + Crystal Shield

| Case | Recorded seed | Attacking troops | Defending troops | Winner | Attacker survivors (I/L/M) | Defender survivors (I/L/M) | Recorded skill activations |
|---|---:|---|---|---|---|---|---|
| mk2-151 | 1789159091 | 5,000 marksman t7 | 10,000 infantry t5 fc5 | defender | 0 / 0 / 0 | 9,055 / 0 / 0 | attacker: Volley=5<br>defender: Shield=16 |
| mk2-152 | 1789159095 | 5,000 marksman t7 | 10,000 infantry t5 fc5 | defender | 0 / 0 / 0 | 9,035 / 0 / 0 | attacker: Volley=3<br>defender: Shield=8 |
| mk2-153 | 1789159101 | 5,000 marksman t7 | 10,000 infantry t5 fc5 | defender | 0 / 0 / 0 | 8,980 / 0 / 0 | attacker: Volley=7<br>defender: Shield=17 |
| mk2-154 | 1789159103 | 5,000 marksman t7 | 10,000 infantry t5 fc5 | defender | 0 / 0 / 0 | 9,147 / 0 / 0 | attacker: Volley=0<br>defender: Shield=10 |
| mk2-155 | 1789159106 | 5,000 marksman t7 | 10,000 infantry t5 fc5 | defender | 0 / 0 / 0 | 9,089 / 0 / 0 | attacker: Volley=3<br>defender: Shield=13 |
| mk2-156 | 1789159157 | 10,000 infantry t5 fc5 | 5,000 marksman t7 | attacker | 9,114 / 0 / 0 | 0 / 0 / 0 | attacker: Shield=12<br>defender: Volley=1 |
| mk2-157 | 1789159162 | 10,000 infantry t5 fc5 | 5,000 marksman t7 | attacker | 9,106 / 0 / 0 | 0 / 0 / 0 | attacker: Shield=13<br>defender: Volley=2 |
| mk2-158 | 1789159169 | 10,000 infantry t5 fc5 | 5,000 marksman t7 | attacker | 9,085 / 0 / 0 | 0 / 0 / 0 | attacker: Shield=13<br>defender: Volley=3 |
| mk2-159 | 1789159171 | 10,000 infantry t5 fc5 | 5,000 marksman t7 | attacker | 9,153 / 0 / 0 | 0 / 0 / 0 | attacker: Shield=13<br>defender: Volley=1 |
| mk2-160 | 1789159174 | 10,000 infantry t5 fc5 | 5,000 marksman t7 | attacker | 9,167 / 0 / 0 | 0 / 0 / 0 | attacker: Shield=12<br>defender: Volley=0 |
