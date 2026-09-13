import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadSimulatorConfig} from '../config-node';
import {adaptTestcaseEntry, testcaseReplayOptions} from '../tooling/testcases';
import {prepareBattle, runPrepared} from '../simulator';
import type {BattleInput, SideId} from '../types';
import {createMk2Config, normalizeMechanics, type Mk2Mechanics} from './mechanics';
import {replayMk2} from './replay';
import {createBattleRng} from './battle_rng';
import {orderCrystalShield, crystalShieldExtraHits} from './crystal_shield';
import {gunpowderTiming} from './gunpowder_timing';
import {terminalVolleyShield} from './terminal_volley_shield';
import {createScopedC2Volley, exactC2Scope} from './scoped_c2_volley';

const config = loadSimulatorConfig();
const read = (name: string): any[] => JSON.parse(readFileSync(new URL(`../../../testcases/mk2/${name}`, import.meta.url), 'utf8'));
const cases = ['forward','reverse','reverse2','reverse3'].flatMap(role => read('c2_one_infantry_'+role+'_20260913.json'));
assert.equal(cases.length, 20);
assert.equal(new Set(cases.map(row => row.test_id)).size, 20);
const inputFor = (row: any): BattleInput => structuredClone({engagement_type: row.engagement_type, attacker: row.attacker, defender: row.defender});
const base = inputFor(cases[0]);
function compile(input: BattleInput, options: Mk2Mechanics = {}) {
  const mechanics = normalizeMechanics(options), compiled = prepareBattle(input, createMk2Config(config, mechanics));
  orderCrystalShield(compiled, mechanics);
  return {compiled, mechanics};
}
function observed(result: ReturnType<typeof replayMk2>, row: any) {
  const procs: any = {attacker: {}, defender: {}};
  assert.equal(Object.keys(row.observed.skillProcs.attacker).length + Object.keys(row.observed.skillProcs.defender).length, 4, 'four explicit chance counters including zero');
  for (const side of ['attacker', 'defender'] as const) {
    for (const reportId of Object.keys(row.observed.skillProcs[side])) {
      const idMap: Record<string,string> = {'90006':'Volley','90007':'CrystalShield','90008':'CrystalLance','90009':'CrystalGunpowder'};
      const ids = new Set([idMap[reportId]]);
      const skills = result.skillReport[side].filter(s => ids.has(s.skillId));
      assert.ok(ids.size && skills.length, `${row.test_id}: missing explicit skill ${reportId}`);
      procs[side][reportId] = skills.reduce((sum, s) => sum + s.skillActivations, 0);
    }
  }
  return {winner: result.winner, remaining: result.remaining, procs};
}

test('20 anonymized exact-scope C2 reports match all observed fields; reference retains the measured 20 mismatches', () => {
  let referenceExact = 0, successfulUnused = 0, usedOnlyExact = 0;
  const witnessIds: string[] = [];
  for (const row of cases) {
    const before = JSON.stringify(row), input = inputFor(row);
    const active = replayMk2(input, config, {...row.replay, trace: true});
    const reference = replayMk2(input, config, {...row.replay, trace: true, c2Volley: 'reference'});
    const expected = {winner: row.observed.winner, remaining: row.observed.remaining, procs: row.observed.skillProcs};
    assert.deepEqual(observed(active, row), expected, row.test_id);
    try {assert.deepEqual(observed(reference, row), expected); referenceExact++;} catch {}
    const metadata = active.replayMetadata.c2Volley as any;
    assert.equal(metadata?.policy, 'scoped-u1');
    successfulUnused += metadata.unusedSuccessfulCredits > 0 ? 1 : 0;
    if (metadata.unusedSuccessfulCredits > 0) witnessIds.push(row.test_id);
    const usedOnly = structuredClone(active);
    const mixedSide = row.attacker.troops.lancer_t5_fc5 ? 'attacker' : 'defender';
    usedOnly.skillReport[mixedSide].find(s => s.skillId === 'Volley')!.skillActivations -= metadata.unusedSuccessfulCredits;
    try {assert.deepEqual(observed(usedOnly, row), expected); usedOnlyExact++;} catch {}
    for (const side of ['attacker','defender'] as const)
      assert.equal(Object.values(active.remaining[side]).reduce((a,b)=>a+b,0),row.observed.totals[side]);
    assert.equal(reference.replayMetadata.c2Volley, undefined);
    assert.equal(active.replayMetadata.effectiveSeed, String(row.replay.reportedSeed));
    assert.equal(active.replayMetadata.seedSource, 'recorded-seed');
    assert.equal(JSON.stringify(row), before);
  }
  assert.equal(referenceExact, 0);
  assert.equal(successfulUnused, 3);
  assert.equal(usedOnlyExact, 17);
  assert.deepEqual(witnessIds, ['mk2-c2-one-infantry-forward-20260913-004','mk2-c2-one-infantry-forward-20260913-005','mk2-c2-one-infantry-reverse3-20260913-004']);
});

for (const id of ['mk2-c2-one-infantry-forward-20260913-004', 'mk2-c2-one-infantry-forward-20260913-005', 'mk2-c2-one-infantry-reverse3-20260913-004']) {
  test(`${id}: successful unused reservation credits exactly one activation without a new attack or draw`, () => {
    const row = cases.find(c => c.test_id === id); assert.ok(row);
    const input = inputFor(row), {compiled, mechanics} = compile(input);
    const stream = createBattleRng(String(row.replay.reportedSeed), true);
    const adapter = createScopedC2Volley(compiled, stream, mechanics); assert.ok(adapter);
    const result = runPrepared(compiled, undefined, {mode: 'trace', rng: adapter.rng,
      attackScheduling: mechanics.attackScheduling, onEmptyUnit: adapter.onEmptyUnit,
      beforeExtraAttack: crystalShieldExtraHits(mechanics),
      beforeExhaustedExtraAttack: terminalVolleyShield(compiled, mechanics).beforeExhaustedExtraAttack,
      deferAttackSkill: adapter.deferAttackSkill});
    const before = structuredClone(result), rngBefore = structuredClone(stream.metadata());
    const metadata = adapter.finish(result), side: SideId = row.attacker.troops.lancer_t5_fc5 ? 'attacker' : 'defender';
    assert.equal(metadata.unusedSuccessfulCredits, 1);
    assert.ok(metadata.reservations.some(r => r.status === 'unused' && r.passed));
    assert.deepEqual(stream.metadata(), rngBefore);
    const volley = result.skillReport[side].find(s => s.skillId === 'Volley'); assert.ok(volley);
    assert.equal(volley.skillActivations, before.skillReport[side].find(s => s.skillId === 'Volley')!.skillActivations + 1);
    const restored = structuredClone(result); restored.skillReport[side].find(s => s.skillId === 'Volley')!.skillActivations--;
    assert.deepEqual(restored, before, 'accounting must not modify any other result field or damage job');
  });
}

test('changed counts, modifiers, heroes and extra profile keys retain current reference behavior', () => {
  const mutations: [string, (input: any) => void][] = [
    ['LC count', i => i.attacker.troops.lancer_t5_fc5++],
    ['MM count', i => i.attacker.troops.marksman_t7_fc3++],
    ['Inf count', i => i.defender.troops.infantry_t5_fc5++],
    ['modifier', i => i.attacker.stats.marksman.health += 0.01],
    ['hero', i => i.attacker.heroes = {Mia: {skill_1: 1}}],
    ['joiner', i => i.attacker.joiner_heroes = {Mia: {skill_1: 1}}],
    ['empty passive field', i => i.attacker.passive = {}],
    ['extra positive profile', i => i.attacker.troops.lancer_t7_fc5 = 1],
    ['extra zero profile', i => i.attacker.troops.lancer_t7_fc5 = 0],
    ['opposing zero profile', i => i.defender.troops.marksman_t5 = 0],
    ['FC4 LC', i => {delete i.attacker.troops.lancer_t5_fc5; i.attacker.troops.lancer_t5_fc4 = 500;}],
    ['Ambusher', i => {delete i.attacker.troops.lancer_t5_fc5; i.attacker.troops.lancer_t10_fc5 = 500;}],
    ['no Shield', i => {delete i.defender.troops.infantry_t5_fc5; i.defender.troops.infantry_t5_fc1 = 1;}]
  ];
  for (const [label, mutate] of mutations) {
    const input = structuredClone(base); mutate(input);
    const {compiled, mechanics} = compile(input);
    assert.equal(exactC2Scope(compiled, mechanics), null, label);
    const opts = {reportedSeed: cases[0].replay.reportedSeed, trace: true};
    const current = replayMk2(input, config, opts), reference = replayMk2(input, config, {...opts, c2Volley: 'reference'});
    assert.deepEqual(current, reference, label);
    assert.equal(current.replayMetadata.c2Volley, undefined, label);
  }
});

test('custom base/effect definitions and unmeasured mechanics fail the guard; invalid policy throws', () => {
  const {compiled, mechanics} = compile(structuredClone(base));
  const record = compiled.config.troopStats.marksman_t7_fc3;
  assert.ok(Object.isFrozen(record.stats));
  compiled.config.troopStats.marksman_t7_fc3 = {...record, stats: {...record.stats, health: 999}};
  assert.equal(compiled.config.troopStats.marksman_t7_fc3.stats.health, 999);
  assert.equal(exactC2Scope(compiled, mechanics), null);
  const effectCase = compile(structuredClone(base));
  effectCase.compiled.config.troopSkills.skills.CrystalLance.effects['CrystalLance/1'].value = [99, 99];
  assert.equal(exactC2Scope(effectCase.compiled, effectCase.mechanics), null);
  for (const options of [{attackScheduling: 'reference'}, {volleyAfterDeath: 'skip'}, {volleyShield: 'reference'}, {gunpowderTiming: 'reference'}] as Mk2Mechanics[]) {
    const c = compile(structuredClone(base), options); assert.equal(exactC2Scope(c.compiled, c.mechanics), null);
  }
  for (const value of ['', null, 1, 'broader']) assert.throws(() => replayMk2(base, config, {reportedSeed: 100001, c2Volley: value} as any), /Unknown scoped C2 policy/);
});


test('normal testcase adapter preserves all20 scoped matches with its own undefined seed key', () => {
  for (const row of cases) {
    const before = JSON.stringify(row), diagnostics: string[] = [];
    const input = adaptTestcaseEntry(row, {}, diagnostics);
    const options = testcaseReplayOptions(row); assert.ok(options);
    assert.deepEqual(diagnostics, []);
    assert.ok(Object.hasOwn(input, 'seed'), 'exercise the real adapter-produced key');
    assert.equal(input.seed, undefined);
    const {compiled, mechanics} = compile(input, options.mechanics);
    assert.ok(exactC2Scope(compiled, mechanics), row.test_id);
    const result = replayMk2(input, config, {...options, trace: true});
    const direct = replayMk2(inputFor(row), config, {...options, trace: true});
    assert.deepEqual(observed(result, row), {winner: row.observed.winner, remaining: row.observed.remaining, procs: row.observed.skillProcs}, row.test_id);
    assert.equal((result.replayMetadata.c2Volley as any)?.policy, 'scoped-u1');
    assert.deepEqual(result.attacks, direct.attacks);
    assert.deepEqual(result.rng, direct.rng);
    assert.equal(JSON.stringify(row), before);
    assert.ok(Object.hasOwn(input, 'seed'));
    assert.equal(input.seed, undefined);
  }
});

test('normal adapter defined seed values remain outside the scoped C2 gate', () => {
  const row = cases[0], options = testcaseReplayOptions(row); assert.ok(options);
  for (const seed of [0, 1, '', 'explicit-seed']) {
    const input = adaptTestcaseEntry(row, {seed});
    assert.equal(input.seed, seed);
    const {compiled, mechanics} = compile(input, options.mechanics);
    assert.equal(exactC2Scope(compiled, mechanics), null);
    const result = replayMk2(input, config, {...options, trace: true});
    assert.equal(result.replayMetadata.c2Volley, undefined);
    assert.deepEqual(result, replayMk2(input, config, {...options, trace: true, c2Volley: 'reference'}));
  }
});
