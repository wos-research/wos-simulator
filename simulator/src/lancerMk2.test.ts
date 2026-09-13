import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadSimulatorConfig } from "./config-node";
import { prepareBattle, runPrepared, simulateBattles } from "./simulator";
import { adaptTestcaseEntry } from "./tooling/testcases";
import { createBattleRng } from "./mk2/battle_rng";
import { CALIBRATED_T12_LANCER, isCalibratedLancerDuel } from "./mk2/lancer_duel";
import { createTroopStatsRecord } from "./troopStats";
import type { SimulatorConfig } from "./types";

const cases = JSON.parse(readFileSync(new URL("../../research/mk2/fixtures/lancer-fc10.json", import.meta.url), "utf8"));
const config = loadSimulatorConfig();
const inputFor = (i = 0) => adaptTestcaseEntry(cases[i]);
const customStats = (attack: number, health: number): SimulatorConfig => ({ ...config, troopStats: {
  ...config.troopStats, lancer_t12_fc10: createTroopStatsRecord({ ...CALIBRATED_T12_LANCER,
    stats: { attack, health, defense: 10, lethality: 10 } }),
} });
const predictions = (source = config) => cases.map((_: unknown, i: number) =>
  runPrepared(prepareBattle(inputFor(i), source)).remaining.attacker.lancer);

test("all six FC10 lancer calibration reports match exact winners and survivors with timestamp + 1", () => {
  const before = JSON.stringify(config);
  for (let i = 0; i < cases.length; i++) {
    const input = inputFor(i), original = JSON.stringify(input), expected = cases[i].game_report_result[0];
    const result = runPrepared(prepareBattle(input, config));
    assert.deepEqual(result.remaining, {
      attacker: { infantry: 0, lancer: expected.attacker, marksman: 0 },
      defender: { infantry: 0, lancer: expected.defender, marksman: 0 },
    }, cases[i].test_id);
    assert.equal(result.winner, "attacker");
    assert.equal(result.execution?.seed, String(BigInt(input.timestamp!) + 1n));
    assert.equal(result.execution?.timestampSource, "report-inbox");
    assert.equal(result.execution?.timestampStatus, "unverified");
    assert.equal(result.execution?.historicalSeedMatched, false);
    assert(result.execution?.warnings.some(w => /provisional/.test(w)));
    assert.equal(simulateBattles(input, config, { count: 5 }).length, 1);
    assert.equal(JSON.stringify(input), original);
  }
  assert.equal(cases.length, 6);
  assert.equal(JSON.stringify(config), before);
  assert.equal(config.troopStats.lancer_t12_fc10, undefined);
});

test("outcomes are independent of testcase IDs and expected results", () => {
  for (let i = 0; i < cases.length; i++) {
    const changed = { ...cases[i], test_id: "arbitrary", game_report_result: [{ attacker: 0, defender: 999 }] };
    const actual = runPrepared(prepareBattle(adaptTestcaseEntry(changed), config));
    assert.equal(actual.remaining.attacker.lancer, cases[i].game_report_result[0].attacker);
  }
});

test("+20% stats leave one mismatch; multiple independent stat pairs match all six", () => {
  assert.deepEqual(predictions(customStats(3109, 1037)), [992, 991, 180, 993, 991, 990]);
  assert.deepEqual(predictions(customStats(3220, 1007)), predictions());
  assert.deepEqual(predictions(), [992, 991, 180, 992, 991, 990]);
});

test("combined lancer model consumes both Ambushers, target Field, then dealer Lance", () => {
  const rng = createBattleRng(inputFor().timestamp, true);
  const result = runPrepared(prepareBattle(inputFor(), config), undefined, { rng: rng.rng, mode: "trace" });
  const events = rng.metadata().events!;
  assert.deepEqual(events.slice(0, 6).map(e => [e.side, e.skillId, e.roll]), [
    ["attacker", "Ambusher", 8225], ["defender", "Ambusher", 2939],
    ["defender", "IncandescentField", 9459], ["attacker", "CrystalLance", 2328],
    ["attacker", "IncandescentField", 5043], ["defender", "CrystalLance", 6136],
  ]);
  assert.equal(result.remaining.attacker.lancer, 992);
  assert.equal(rng.metadata().seed, "1789240022");
  assert(events.some(e => Number(e.lastRawDraw) > Number(e.firstRawDraw)), "Lua projection retains rejection draws");
});

test("each actual Lance extra hit rolls Field without recursively rolling Lance or Ambusher", () => {
  const rng = createBattleRng(inputFor(2).timestamp, true);
  runPrepared(prepareBattle(inputFor(2), config), undefined, { rng: rng.rng });
  const extra = rng.metadata().events!.filter(e => e.phase === "extra_attack");
  assert.equal(extra.length, 8);
  assert(extra.every(e => e.skillId === "IncandescentField" && e.side === e.takerSide));
});

test("lancer timing guard rejects mixed stacks, passive bonuses, heroes, and altered skills", () => {
  assert(isCalibratedLancerDuel(prepareBattle(inputFor(), config)));
  const mixed = inputFor(); mixed.attacker.troops.infantry_t10_fc9 = 1;
  const compiled = prepareBattle(mixed, config);
  assert.equal(isCalibratedLancerDuel(compiled), false);
  assert.equal(compiled.mk2?.options.ambusherTiming, undefined);
  assert(compiled.mk2?.warnings.some(w => /unvalidated/.test(w)));
  const passive = inputFor(); passive.attacker.passive = { "troop.attack.up": 1 } as any;
  assert.equal(isCalibratedLancerDuel(prepareBattle(passive, config)), false);
  const hero = prepareBattle(inputFor(), config);
  hero.fighters.attacker.heroes.push({} as any);
  assert.equal(isCalibratedLancerDuel(hero), false);
  for (const id of ["CrystalLance", "IncandescentField"]) {
    const altered = prepareBattle(inputFor(), config);
    altered.fighters.attacker.troopSkills.find(s => s.id === id)!.effects[0].value = 50;
    assert.equal(isCalibratedLancerDuel(altered), false, id);
  }
  const chance = prepareBattle(inputFor(), config);
  chance.fighters.attacker.troopSkills.find(s => s.id === "Ambusher")!.compiledTrigger!.probabilityPct = 30;
  assert.equal(isCalibratedLancerDuel(chance), false);
});

test("legacy does not silently use provisional T12 stats", () => {
  const compiled = prepareBattle({ ...inputFor(), mechanicsVersion: "legacy" }, config);
  assert(compiled.fighters.attacker.diagnostics.includes("Unsupported troop id lancer_t12_fc10"));
  assert.equal(compiled.fighters.attacker.initialTroops.lancer, 0);
  assert.equal(compiled.mk2, undefined);
});
