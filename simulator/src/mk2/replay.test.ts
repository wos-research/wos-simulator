import test from 'node:test';
import assert from 'node:assert/strict';
import {loadSimulatorConfig} from '../config-node';
import {prepareBattle, runPrepared} from '../simulator';
import {replayMk2} from './replay';
import {normalizeTimestamp, normalizeReportedSeed, resolveSeed} from './seed';
import {createMk2Config, normalizeMechanics} from './mechanics';
import {createBattleRng} from './battle_rng';
import type {BattleInput, SkillFile} from '../types';
import {buildSimulatorConfig} from '../config';

const config = loadSimulatorConfig();
const input = () => ({attacker: {troops: {marksman_t5_fc3: 1000}}, defender: {troops: {infantry_t5_fc1: 1000}}});

test('recorded seed precedence preserves missing, matching and mismatching timestamp provenance', () => {
  assert.deepEqual(resolveSeed().metadata, {seedSource: 'default', effectiveSeed: '1', reportedSeed: null,
    timestamp: '000000', timestampSource: 'missing-default', timestampSeed: '1', timestampMatchesRecordedSeed: null});
  const recorded = replayMk2(input(), config, {reportedSeed: 42, trace: true});
  assert.equal(recorded.replayMetadata.timestamp, null);
  assert.equal(recorded.replayMetadata.timestampMatchesRecordedSeed, null);
  const match = replayMk2(input(), config, {reportedSeed: '42', timestamp: 41, timestampSource: 'derived-report-seed-minus-one', trace: true});
  assert.equal(match.replayMetadata.timestampMatchesRecordedSeed, true);
  assert.equal(match.replayMetadata.timestampSource, 'derived-report-seed-minus-one');
  const mismatch = replayMk2(input(), config, {reportedSeed: 42, timestamp: 100, trace: true});
  assert.equal(mismatch.replayMetadata.timestampMatchesRecordedSeed, false);
  assert.equal(mismatch.replayMetadata.effectiveSeed, '42');
  assert.equal(mismatch.replayMetadata.timestampSeed, '101');
  assert.ok(mismatch.warnings.some(w => w.includes('differs from recorded seed')));
  for (const other of [match, mismatch]) {
    assert.deepEqual(other.remaining, recorded.remaining);
    assert.deepEqual(other.skillReport, recorded.skillReport);
    assert.deepEqual(other.rng, recorded.rng);
  }
  const inferred = replayMk2(input(), config, {timestamp: 41});
  assert.equal(inferred.replayMetadata.seedSource, 'timestamp');
  assert.equal(inferred.replayMetadata.timestampMatchesRecordedSeed, null);
  assert.ok(inferred.warnings.some(w => w.includes('unverified hypothesis')));
});

test('seed boundaries remain lossless and reject unsafe, fractional or malformed inputs', () => {
  assert.equal(normalizeTimestamp('9223372036854775806'), '9223372036854775806');
  assert.equal(resolveSeed({timestamp: '9223372036854775806'}).metadata.effectiveSeed, '9223372036854775807');
  for (const bad of [null, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '', '1e9', '0x10', '9223372036854775807', true])
    assert.throws(() => normalizeTimestamp(bad));
  for (const bad of [null, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '', '1e9', '0x10', '9223372036854775808', '-9223372036854775809', true])
    assert.throws(() => normalizeReportedSeed(bad));
  assert.equal(normalizeReportedSeed('-9223372036854775808'), '-9223372036854775808');
  assert.equal(normalizeReportedSeed('9223372036854775807'), '9223372036854775807');
  assert.equal(normalizeReportedSeed('00042'), '42');
  assert.equal(resolveSeed({reportedSeed: 0}).metadata.effectiveSeed, '0');
  assert.throws(() => resolveSeed({timestampSource: ''}));
});

test('all skills share the labelled integer stream and certainty does not consume RNG', () => {
  const result = replayMk2(input(), config, {trace: true});
  assert.deepEqual(result.rng.events!.slice(0, 12).map(event => event.roll), [3485, 1511, 2039, 4054, 4061, 2792, 1918, 638, 8778, 9476, 4722, 507]);
  assert.ok(result.rng.events!.every(event => event.skillId === 'CrystalGunpowder'));
  const stream = createBattleRng('1', true);
  assert.equal(stream.rng.chance!(0), false);
  assert.equal(stream.rng.chance!(100), true);
  assert.equal(stream.metadata().calls, 0);
  assert.equal(stream.metadata().draws, 0);
  assert.throws(() => stream.rng(), /Unlabelled/);
});

test('tracing does not alter predictions and caller inputs/config remain unchanged', () => {
  const battle = input(), snapshot = JSON.stringify(battle), catalogue = JSON.stringify(config);
  const plain = replayMk2(battle, config, {reportedSeed: 42}), traced = replayMk2(battle, config, {reportedSeed: 42, trace: true});
  assert.deepEqual(traced.remaining, plain.remaining);
  for (const side of ['attacker', 'defender'] as const)
    assert.deepEqual(traced.skillReport[side].map(({triggersSeen, ...skill}) => skill), plain.skillReport[side].map(({triggersSeen, ...skill}) => skill));
  assert.equal(plain.rng.events, undefined);
  assert.ok(traced.rng.events!.length > 0);
  assert.equal(JSON.stringify(battle), snapshot);
  assert.equal(JSON.stringify(config), catalogue);
});

test('Mk2 configuration preserves reference profiles and introduces no hero or T12 definitions', () => {
  const current = createMk2Config(config, normalizeMechanics());
  assert.deepEqual(current.heroDefinitions, config.heroDefinitions);
  assert.deepEqual(Object.keys(current.troopStats), Object.keys(config.troopStats));
  assert.ok(!Object.values(current.troopStats).some(troop => troop.tier === 12));
  assert.equal(current.troopSkills.skills.Volley.effects['Volley/1'].type, 'extra_skill_attack');
  assert.equal(config.troopSkills.skills.Volley.effects['Volley/1'].type, 'active.troop.damage.up');
  // Historical floor945/177 is preserved at commit 755bd728167a29e54d247ed3733363e3e1a6be11.
  assert.deepEqual(current.troopStats.marksman_t5_fc3, config.troopStats.marksman_t5_fc3);
  for (const [id, troop] of Object.entries(config.troopStats))
    if (troop.tier > 10) assert.deepEqual(current.troopStats[id], troop);
  const reference = createMk2Config(config, normalizeMechanics({fcRounding: 'nearest', volleyShield: 'reference'}));
  assert.deepEqual(reference.troopStats, config.troopStats);
  assert.deepEqual(reference.troopSkills, config.troopSkills);
});

test('invalid mechanics and empty armies fail explicitly; a low cap retains its draw', () => {
  for (const mechanics of [{rng: 'legacy'}, {fcRounding: 'wrong'}, {gunpowderTiming: null}, null, []])
    assert.throws(() => normalizeMechanics(mechanics as any));
  assert.throws(() => replayMk2(input(), config, {trace: 'true'} as any));
  assert.throws(() => replayMk2({attacker: {troops: {}}, defender: input().defender}, config), /empty/);
  const capped = replayMk2({...input(), maxRounds: 1}, config);
  assert.equal(capped.winner, 'draw');
  assert.deepEqual(capped.replayMetadata.termination, {reason: 'round-cap', rounds: 1});
});

test('optional delayed dispatch processes persistent extra effects and their delays only once', () => {
  const probe: SkillFile = {name: 'TimingProbe', skills: {probe: {trigger: {type: 'battle_start'}, effects: {
    'probe/persistent': {type: 'extra_skill_attack', value: [10], duration: {attacks: {count: 100}}, units: {applies_to: ['marksman'], applies_vs: 'enemy.all'}, trigger_damage_jobs: [{source: 'use.source', target: 'use.target'}]},
    'probe/delayed': {type: 'extra_skill_attack', value: [10], units: {applies_to: ['marksman'], applies_vs: 'enemy.all'}, duration: {attacks: {delay: 1, count: 100}}, trigger_damage_jobs: [{source: 'use.source', target: 'use.target'}]}
  }}}};
  const withProbe = buildSimulatorConfig({heroDefinitions: {...config.heroDefinitions, TimingProbe: probe}, heroGenerationStats: config.heroGenerationStats, troopSkills: config.troopSkills});
  const battle = {maxRounds: 3, attacker: {troops: {marksman_t7_fc3: 1000}, heroes: [{name: 'TimingProbe', levels: {probe: 1}}]}, defender: {troops: {infantry_t5_fc1: 100000}}};
  const prepared = prepareBattle(battle, createMk2Config(withProbe, normalizeMechanics()));
  const current = runPrepared(prepared, undefined, {mode: 'trace', rng: () => 0, deferAttackSkill: p => p.skill.id === 'CrystalGunpowder'});
  const reference = runPrepared(prepared, undefined, {mode: 'trace', rng: () => 0});
  for (const result of [current, reference]) {
    assert.deepEqual(result.attacks.filter(hit => hit.sourceEffectId === 'probe/persistent').map(hit => hit.round), [1, 2, 3]);
    assert.deepEqual(result.attacks.filter(hit => hit.sourceEffectId === 'probe/delayed').map(hit => hit.round), [2, 3]);
    assert.deepEqual(result.attacks.filter(hit => hit.sourceEffectId === 'CrystalGunpowder/1').map(hit => hit.round), [1, 2, 3]);
  }
  assert.deepEqual(current.remaining, reference.remaining);
  assert.deepEqual(current.extraSkillAttackJobsByEffect, reference.extraSkillAttackJobsByEffect);
});


test('additional troop skills and hero contexts retain reference Gunpowder timing with warnings', () => {
  const variants: BattleInput[] = [
    {attacker: {troops: {marksman_t7_fc3: 5000}}, defender: {troops: {infantry_t7_fc5: 10000}}},
    {attacker: {troops: {marksman_t7_fc3: 5000}}, defender: {troops: {infantry_t5_fc8: 10000}}},
    {attacker: {troops: {marksman_t7_fc3: 5000}}, defender: {troops: {infantry_t5_fc10: 10000}}},
    {attacker: {troops: {marksman_t7_fc3: 5000}, heroes: [{name: 'Greg', levels: {skill_1: 1}}]}, defender: {troops: {infantry_t5_fc5: 10000}}}
  ];
  for (const battle of variants) {
    const current = replayMk2(battle, config, {reportedSeed: 42, trace: true});
    const reference = replayMk2(battle, config, {reportedSeed: 42, trace: true, mechanics: {gunpowderTiming: 'reference'}});
    assert.ok(current.warnings.some(w => w.includes('retaining reference timing')));
    assert.deepEqual(current.remaining, reference.remaining);
    assert.deepEqual(current.skillReport, reference.skillReport);
    assert.deepEqual(current.rng, reference.rng);
  }
  const hero = replayMk2(variants[3], config, {reportedSeed: 42});
  assert.ok(hero.warnings.some(w => w.includes('hero interactions have not been validated')));
  const upperTier = replayMk2({attacker: {troops: {marksman_t11_fc5: 1000}}, defender: {troops: {infantry_t11_fc5: 1000}}}, config, {reportedSeed: 42});
  assert.ok(upperTier.warnings.some(w => w.includes('T11 uses the existing supplied catalogue')));
});


test('default and explicit round caps preserve complete legacy no-damage results', () => {
  const side = {troops: {infantry_t1: 1}, stats: {infantry: {attack: 0, defense: 1e6, lethality: 0, health: 1e6}}, heroes: []};
  for (const maxRounds of [undefined, 1499, 1500, 1501]) for (const trace of [false, true]) {
    const battle = {attacker: side, defender: structuredClone(side), ...(maxRounds === undefined ? {} : {maxRounds})};
    const legacy = runPrepared(prepareBattle(battle, config), undefined, {mode: trace ? 'trace' : 'standard'});
    const result = replayMk2(battle, config, {reportedSeed: 100001, trace});
    const {rng, replayMetadata, warnings, ...actualBattle} = result;
    assert.deepEqual(actualBattle, legacy);
    assert.equal(result.winner, 'draw');
    assert.equal(result.rounds, maxRounds ?? 1500);
    assert.deepEqual(replayMetadata.termination, {reason: 'round-cap', rounds: maxRounds ?? 1500});
    assert.equal(rng.calls, 0);
  }
});
