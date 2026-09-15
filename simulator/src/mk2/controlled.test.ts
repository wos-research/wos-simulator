import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {loadSimulatorConfig} from '../config-node';
import {prepareBattle, runPrepared} from '../simulator';
import type {BattleInput} from '../types';
import {replayMk2, type Mk2ReplayResult} from './replay';
import {Lua54Random} from './lua54_rng';

const config = loadSimulatorConfig();
const cases: any[] = JSON.parse(readFileSync(new URL('../../../testcases/mk2/controlled.json', import.meta.url), 'utf8'));
const natives: any[] = JSON.parse(readFileSync(new URL('./fixtures/native-lua.json', import.meta.url), 'utf8'));
const reference: any[] = JSON.parse(readFileSync(new URL('./fixtures/reference.json', import.meta.url), 'utf8'));
const reportSkillIds: Record<string, string> = {90004: 'Ambusher', 90006: 'Volley', 90007: 'CrystalShield', 90008: 'CrystalLance', 90009: 'CrystalGunpowder'};
const results = new Map<string, Mk2ReplayResult>();
const inputFor = (row: any): BattleInput => ({attacker: row.attacker, defender: row.defender, engagement_type: row.engagement_type});
function resultFor(row: any): Mk2ReplayResult {
  if (!results.has(row.test_id)) results.set(row.test_id, replayMk2(inputFor(row), config, {...row.replay, trace: true}));
  return results.get(row.test_id)!;
}

test('all 160 captured Mk2 reports match winner, six survivors and every explicitly observed proc count', () => {
  assert.equal(cases.length, 160);
  assert.equal(new Set(cases.map(row => row.test_id)).size, 160);
  const sourceCounts: Record<number, number> = {};
  for (const row of cases) {
    const inputSnapshot = JSON.stringify(row), result = resultFor(row);
    assert.equal(result.winner, row.observed.winner, row.test_id);
    assert.deepEqual(result.remaining, row.observed.remaining, row.test_id);
    for (const side of ['attacker', 'defender'] as const) {
      for (const [reportId, expected] of Object.entries(row.observed.skillProcs[side])) {
        assert.ok(reportSkillIds[reportId], reportId);
        const reports = result.skillReport[side].filter(skill => skill.skillId === reportSkillIds[reportId]);
        assert.equal(reports.length, 1, `${row.test_id}:${side}:${reportId}`);
        assert.equal(reports[0].skillActivations, expected, `${row.test_id}:${side}:${reportId}`);
      }
    }
    const sources = Object.values(result.randomness.chanceSkillIds).flat().length;
    sourceCounts[sources] = (sourceCounts[sources] ?? 0) + 1;
    assert.equal(result.replayMetadata.seedSource, 'recorded-seed');
    assert.equal(result.replayMetadata.effectiveSeed, String(row.replay.reportedSeed));
    assert.equal(result.replayMetadata.timestampMatchesRecordedSeed, true);
    assert.equal(JSON.stringify(row), inputSnapshot);
  }
  assert.deepEqual(sourceCounts, {1: 65, 2: 75, 3: 20});
});

test('all 145 stored native Lua vectors agree with both the generator and replay stream prefixes', () => {
  assert.equal(natives.length, 145);
  let valuesChecked = 0, replayCallsChecked = 0;
  for (const native of natives) {
    assert.equal(native.runtime, 'Lua 5.4');
    const row = cases.find(row => row.test_id === native.id);
    assert.ok(row, native.id);
    const generator = new Lua54Random(BigInt(native.seed), BigInt(native.secondSeed));
    assert.deepEqual(native.rolls.map(() => generator.random(0, 9999)), native.rolls, native.id);
    valuesChecked += native.rolls.length;
    const result = resultFor(row), events = result.rng.events!;
    const length = Math.min(events.length, native.rolls.length);
    assert.deepEqual(events.slice(0, length).map(event => event.roll), native.rolls.slice(0, length), native.id);
    replayCallsChecked += length;
    const stream = new Lua54Random(BigInt(native.seed));
    for (const [index, event] of events.entries()) {
      assert.equal(event.call, index + 1);
      assert.equal(event.firstRawDraw, stream.rawDraws + 1);
      assert.equal(event.roll, stream.random(0, 9999));
      assert.equal(event.lastRawDraw, stream.rawDraws);
      assert.equal(event.passed, event.roll < event.probabilityPct * 100);
    }
    assert.equal(result.rng.calls, events.length);
    assert.equal(result.rng.draws, stream.rawDraws);
  }
  assert.equal(valuesChecked, 45440);
  assert.ok(replayCallsChecked > 10000);
});

test('all 301 public reference cases preserve legacy results without Mk2 options', () => {
  assert.equal(reference.length, 301);
  for (const row of reference) {
    const result = runPrepared(prepareBattle(row.input, config), 'cross-repo-nohero-0', {mode: 'fast'});
    assert.deepEqual({winner: result.winner, remaining: result.remaining, rounds: result.rounds}, row.expected, row.id);
  }
});

test('the optional core port reverses exactly to all five original file hashes', () => {
  const manifest = JSON.parse(readFileSync(new URL('./port_manifest.json', import.meta.url), 'utf8'));
  assert.equal(Object.keys(manifest.files).length, 5);
  for (const [name, patch] of Object.entries(manifest.files) as [string, any][]) {
    const checkedOut = readFileSync(new URL(`../../${name}`, import.meta.url), 'utf8');
    // Git may check out LF or CRLF; compare source content using the captured newline convention.
    let text = checkedOut.replaceAll('\r\n', '\n');
    const raw = Buffer.from(text.replaceAll('\n', patch.newline));
    assert.equal(createHash('sha256').update(raw).digest('hex'), patch.sha256, name);
    for (const [before, after] of [...patch.replacements].reverse()) {
      assert.equal(text.split(after).length - 1, 1, `${name}: reversible patch`);
      text = text.replace(after, before);
    }
    const baseline = Buffer.from(text.replaceAll('\n', patch.newline));
    assert.equal(createHash('sha256').update(baseline).digest('hex'), patch.baselineSha256, name);
    for (const [before, after] of patch.replacements) {
      assert.equal(text.split(before).length - 1, 1);
      text = text.replace(before, after);
    }
    assert.deepEqual(Buffer.from(text.replaceAll('\n', patch.newline)), raw, `${name}: rebuilt port`);
  }
});

test('reported outcomes and identities cannot influence the core predictive request', () => {
  const row = cases.find(row => row.cohort === 'volley_gunpowder_shield_reported_seeds');
  assert.ok(row);
  const result = resultFor(row), request = structuredClone(inputFor(row));
  const options = {...row.replay, trace: true, observed: {winner: 'draw', remaining: {attacker: 999999}}, id: 'different'};
  assert.deepEqual(replayMk2({...request, observed: row.observed} as BattleInput, config, options), result);
});
