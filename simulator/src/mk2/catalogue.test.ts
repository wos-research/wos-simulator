import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadSimulatorConfig} from '../config-node';
import {createMk2Config, normalizeMechanics} from './mechanics';
import {replayMk2} from './replay';
const config = loadSimulatorConfig();
const campaign = JSON.parse(readFileSync(new URL('../../../testcases/mk2/campaign_20260913.json', import.meta.url), 'utf8'));

test('validated catalogue policy restores four original cells and preserves every other profile and axis', () => {
  const before = JSON.stringify(config);
  const prior = createMk2Config(config, normalizeMechanics({catalogueCorrections: 'none'}));
  const current = createMk2Config(config, normalizeMechanics());
  const changed: string[] = [];
  for (const [id, troop] of Object.entries(prior.troopStats)) {
    for (const axis of ['attack', 'defense', 'lethality', 'health'] as const) {
      if (troop.stats[axis] !== current.troopStats[id].stats[axis]) changed.push(`${id}.${axis}`);
    }
    if (!['lancer_t10_fc4', 'infantry_t10_fc5', 'infantry_t10_fc1'].includes(id)) assert.deepEqual(current.troopStats[id], troop);
  }
  assert.deepEqual(changed.sort(), ['infantry_t10_fc1.attack', 'infantry_t10_fc1.health', 'infantry_t10_fc5.attack', 'lancer_t10_fc4.attack']);
  assert.equal(prior.troopStats.infantry_t10_fc5.stats.attack, 596);
  assert.equal(current.troopStats.infantry_t10_fc5.stats.attack, 597);
  assert.equal(current.troopStats.infantry_t10_fc5.stats.attack, config.troopStats.infantry_t10_fc5.stats.attack);
  assert.equal(current.troopStats.infantry_t10_fc5.stats.health, 1790);
  assert.equal(prior.troopStats.lancer_t10_fc4.stats.attack, 1704);
  assert.equal(current.troopStats.lancer_t10_fc4.stats.attack, 1705);
  assert.equal(current.troopStats.lancer_t10_fc4.stats.attack, config.troopStats.lancer_t10_fc4.stats.attack);
  assert.equal(current.troopStats.lancer_t10_fc4.stats.health, 568);
  assert.deepEqual([prior.troopStats.infantry_t10_fc1.stats.attack, prior.troopStats.infantry_t10_fc1.stats.health], [490, 1472]);
  assert.deepEqual([current.troopStats.infantry_t10_fc1.stats.attack, current.troopStats.infantry_t10_fc1.stats.health], [491, 1473]);
  assert.equal(JSON.stringify(config), before);
  for (const value of ['nearest', '', null, 1]) assert.throws(() => normalizeMechanics({catalogueCorrections: value} as any));
});

test('ten captured T10 battles pass; reversible uncorrected mode reproduces the two one-Lancer discrepancies', () => {
  const rows = campaign.filter((row: any) => row.cohort === 't10_fc4_lancer_stats');
  assert.equal(rows.length, 10);
  const mismatches: string[] = [];
  for (const row of rows) {
    const input = {attacker: row.attacker, defender: row.defender, engagement_type: row.engagement_type};
    const before = JSON.stringify(row);
    const current = replayMk2(input, config, row.replay);
    const prior = replayMk2(input, config, {...row.replay, mechanics: {...row.replay.mechanics, catalogueCorrections: 'none'}});
    assert.deepEqual(current.remaining, row.observed.remaining, row.test_id);
    assert.equal(current.winner, row.observed.winner);
    assert.equal(prior.winner, row.observed.winner);
    assert.equal(current.replayMetadata.mechanics.catalogueCorrections, 'validated');
    assert.equal(prior.replayMetadata.mechanics.catalogueCorrections, 'none');
    assert.equal(current.replayMetadata.effectiveSeed, String(row.replay.reportedSeed));
    assert.equal(prior.replayMetadata.effectiveSeed, current.replayMetadata.effectiveSeed);
    for (const side of ['attacker', 'defender'] as const) {
      for (const [reportId, count] of Object.entries(row.observed.skillProcs[side])) {
        const ids = new Set(row.chanceSources.filter((s: any) => s.side === side && s.reportSkillId === reportId).map((s: any) => s.skillId));
        assert.ok(ids.size);
        for (const result of [current, prior]) assert.equal(result.skillReport[side].filter(s => ids.has(s.skillId)).reduce((sum, s) => sum + s.skillActivations, 0), count);
      }
    }
    if (JSON.stringify(prior.remaining) !== JSON.stringify(row.observed.remaining)) {
      const side = row.attacker.troops.lancer_t10_fc4 ? 'attacker' : 'defender';
      assert.equal(row.observed.remaining[side].lancer, 991);
      assert.equal(prior.remaining[side].lancer, 990);
      mismatches.push(side);
    }
    assert.equal(JSON.stringify(row), before);
  }
  assert.deepEqual(mismatches.sort(), ['attacker', 'defender']);
});


test('ten Infantry controls pass; reference preserves the three separating first-direction failures', () => {
  const rows = campaign.filter((row: any) => row.cohort === 't10_fc5_infantry_stats');
  assert.equal(rows.length, 10);
  const mismatches: string[] = [];
  let procOnlyWitnesses = 0;
  for (const row of rows) {
    const input = {attacker: row.attacker, defender: row.defender, engagement_type: row.engagement_type};
    const before = JSON.stringify(row);
    const current = replayMk2(input, config, row.replay);
    const prior = replayMk2(input, config, {...row.replay, mechanics: {...row.replay.mechanics, catalogueCorrections: 'none'}});
    assert.deepEqual(current.remaining, row.observed.remaining, row.test_id);
    assert.equal(current.winner, row.observed.winner);
    assert.equal(prior.winner, row.observed.winner);
    assert.equal(current.replayMetadata.mechanics.catalogueCorrections, 'validated');
    assert.equal(prior.replayMetadata.mechanics.catalogueCorrections, 'none');
    assert.equal(current.replayMetadata.effectiveSeed, String(row.replay.reportedSeed));
    assert.equal(prior.replayMetadata.effectiveSeed, current.replayMetadata.effectiveSeed);
    let priorProcsExact = true;
    for (const side of ['attacker', 'defender'] as const) {
      for (const [reportId, count] of Object.entries(row.observed.skillProcs[side])) {
        const ids = new Set(row.chanceSources.filter((source: any) => source.side === side && source.reportSkillId === reportId).map((source: any) => source.skillId));
        assert.ok(ids.size);
        const total = (result: typeof current) => result.skillReport[side].filter(skill => ids.has(skill.skillId)).reduce((sum, skill) => sum + skill.skillActivations, 0);
        assert.equal(total(current), count, row.test_id);
        if (total(prior) !== count) {
          priorProcsExact = false;
          assert.equal(count, 30);
          assert.equal(total(prior), 31);
        }
      }
    }
    const priorSurvivorsExact = JSON.stringify(prior.remaining) === JSON.stringify(row.observed.remaining);
    if (!priorProcsExact && priorSurvivorsExact) procOnlyWitnesses++;
    if (!priorProcsExact || !priorSurvivorsExact) mismatches.push(row.attacker.troops.infantry_t10_fc5 ? 'attacker' : 'defender');
    assert.equal(JSON.stringify(row), before);
  }
  assert.deepEqual(mismatches, ['attacker', 'attacker', 'attacker']);
  assert.equal(procOnlyWitnesses, 1, 'Survivor equality alone must not certify the wrong Shield count');
});


test('two T10 FC1 Infantry witnesses pass; none preserves both three-Marksman discrepancies', () => {
  const rows = campaign.filter((row: any) => row.cohort === 't10_fc1_infantry_stats');
  assert.equal(rows.length, 2);
  const roles: string[] = [];
  for (const row of rows) {
    const before = JSON.stringify(row);
    const input = {attacker: row.attacker, defender: row.defender, engagement_type: row.engagement_type};
    const current = replayMk2(input, config, row.replay);
    const prior = replayMk2(input, config, {...row.replay, mechanics: {...row.replay.mechanics, catalogueCorrections: 'none'}});
    const infantrySide = row.attacker.troops.infantry_t10_fc1 ? 'attacker' : 'defender';
    const marksmanSide = infantrySide === 'attacker' ? 'defender' : 'attacker';
    roles.push(infantrySide);
    assert.equal(current.winner, row.observed.winner, row.test_id);
    assert.deepEqual(current.remaining, row.observed.remaining, row.test_id);
    assert.equal(row.observed.remaining[marksmanSide].marksman, 1107);
    assert.equal(prior.remaining[marksmanSide].marksman, 1110);
    assert.equal(current.rng.calls, 0); assert.equal(prior.rng.calls, 0);
    assert.equal(current.replayMetadata.effectiveSeed, String(row.replay.reportedSeed));
    assert.equal(prior.replayMetadata.effectiveSeed, current.replayMetadata.effectiveSeed);
    assert.equal(current.replayMetadata.version, 'expedition-mk2-lua54-catalogue-11');
    assert.equal(JSON.stringify(row), before);
  }
  assert.deepEqual(roles.sort(), ['attacker', 'defender']);
});
