import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepare, replay, sample, makeConfig, type Request} from './backend';
import {prepareBattle, runPrepared} from './upstream/src/simulator';
import type {SkillFile} from './upstream/src/types';
import {Lua54Random} from './lua54_rng';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/volley_gunpowder_shield_reported_seeds.json', import.meta.url), 'utf8'));
const first = fixture.cases[0];
const procs = (result: ReturnType<typeof replay>, side: 'attacker'|'defender', id: string) =>
  result.skillReport[side].filter(skill => skill.skillId === id).reduce((n, skill) => n + skill.skillActivations, 0);

// Captured observations stay outside the predictive request, including for repeated combat inputs.
test('delayed Gunpowder matches every captured Volley/Gunpowder/Shield fight at its reported seed', () => {
  for (const c of fixture.cases) {
    const frozen = JSON.stringify(c.request), result = replay(c.request, true);
    assert.equal(result.winner, c.observed.winner, c.request.id);
    assert.deepEqual(result.remaining, c.observed.remaining, c.request.id);
    for (const source of c.chanceSources)
      assert.equal(procs(result, source.side, source.skillId), c.observed.skillProcs[source.side][source.reportSkillId], c.request.id);
    assert.equal(result.rng.seed, String(c.reportedSeed));
    assert.deepEqual(result.warnings, []);
    assert.equal(JSON.stringify(c.request), frozen);
  }
});

test('reference mode preserves the recorded first mismatch and rejects invalid timing modes', () => {
  const reference = replay({...first.request, mechanics: {...first.request.mechanics, gunpowderTiming: 'reference'}}, true);
  assert.equal(reference.remaining.defender.infantry, 5240);
  assert.deepEqual([procs(reference, 'attacker', 'Volley'), procs(reference, 'attacker', 'CrystalGunpowder'), procs(reference, 'defender', 'CrystalShield')], [5, 18, 33]);
  assert.equal(replay(first.request).remaining.defender.infantry, 5227);
  assert.equal(sample(first.request).mechanics.gunpowderTiming, 'after-volley');
  assert.throws(() => prepare({...first.request, mechanics: {gunpowderTiming: 'invalid'}}), /Gunpowder timing/);
});

test('round nine assigns roll 29 to Volley extra protection before roll 30 to Gunpowder', () => {
  const current = replay(first.request, true), events = current.rng.events!;
  const reference = replay({...first.request, mechanics: {...first.request.mechanics, gunpowderTiming: 'reference'}}, true);
  assert.deepEqual(events.filter(event => event.round === 9).map(event => [event.call, event.skillId, event.phase, event.roll]), [
    [27, 'Volley', 'attack_declared', 639], [28, 'CrystalShield', 'attack_declared', 5848],
    [29, 'CrystalShield', 'extra_attack', 6856], [30, 'CrystalGunpowder', 'attack_declared', 4704]
  ]);
  assert.equal(reference.rng.events![28].skillId, 'CrystalGunpowder');
  assert.equal(reference.rng.events![29].skillId, 'CrystalShield');
  const native = new Lua54Random(BigInt(first.reportedSeed));
  for (const event of events) {
    assert.equal(event.firstRawDraw, native.rawDraws + 1);
    assert.equal(event.roll, native.random(0, 9999));
    assert.equal(event.lastRawDraw, native.rawDraws);
  }
  assert.equal(current.rng.draws, native.rawDraws);
});

test('each measured attack cluster checks Volley, normal Shield, Volley extra Shield, then Gunpowder and its Shield', () => {
  for (const c of fixture.cases) {
    const result = replay(c.request, true), events = result.rng.events!;
    let cursor = 0;
    for (let round = 1; round <= result.rounds; round++) {
      const volley = events[cursor++];
      assert.deepEqual([volley.round, volley.skillId], [round, 'Volley']);
      const normalShield = events[cursor++];
      assert.deepEqual([normalShield.round, normalShield.skillId, normalShield.phase], [round, 'CrystalShield', 'attack_declared']);
      if (volley.passed) {
        const extra = events[cursor++];
        assert.deepEqual([extra.round, extra.skillId, extra.phase], [round, 'CrystalShield', 'extra_attack']);
      }
      const gp = events[cursor++];
      assert.deepEqual([gp.round, gp.skillId], [round, 'CrystalGunpowder']);
      if (gp.passed) {
        const extra = events[cursor++];
        assert.deepEqual([extra.round, extra.skillId, extra.phase], [round, 'CrystalShield', 'extra_attack']);
      }
      const hits = result.attacks.filter(hit => hit.round === round && hit.dealerUnit === 'marksman');
      assert.deepEqual(hits.map(hit => hit.sourceEffectId ?? 'normal'), [
        'normal', ...(volley.passed ? ['Volley/1'] : []), ...(gp.passed ? ['CrystalGunpowder/1'] : [])
      ]);
    }
    assert.equal(cursor, events.length);
  }
});

test('unmeasured heroes, mixed armies, additional troop skills and changed probabilities keep reference timing', () => {
  const variants: Request[] = [];
  const change = (fn: (request: any) => void) => {const request = structuredClone(first.request); fn(request); variants.push(request);};
  change(r => r.input.attacker.heroes.push({name: 'Gina', levels: {skill_1: 1}}));
  change(r => r.input.attacker.joiner_heroes.push({name: 'Gina', levels: {skill_1: 1}}));
  change(r => r.input.attacker.troops.infantry_t5 = 1);
  change(r => r.input.attacker.troops.marksman_t8_fc3 = 1);
  change(r => r.input.attacker.passive = {attack: {up: 1}});
  change(r => {r.input.attacker.troops = {marksman_t7_fc5: 5000};});
  change(r => {r.input.defender.troops = {infantry_t7_fc5: 10000};});
  change(r => {r.input.defender.troops = {infantry_t5_fc8: 10000};});
  change(r => {r.input.defender.troops = {infantry_t5_fc10: 10000};});
  change(r => {r.mechanics = {...r.mechanics, volleyShield: 'reference'};});
  change(r => {r.mechanics = {...r.mechanics, gunpowderShield: 'reference'};});
  change(r => {r.mechanics = {...r.mechanics, attackScheduling: 'reference'};});
  for (const request of variants) {
    const compiled = prepare(request);
    assert.equal(compiled.v2DeferAttackSkill, undefined, JSON.stringify(request));
    assert.ok(compiled.v2Warnings.some(warning => warning.includes('retaining reference timing')));
    const result = replay(request, true), reference = replay({...request, mechanics: {...request.mechanics, gunpowderTiming: 'reference'}}, true);
    assert.deepEqual(result.remaining, reference.remaining);
    assert.deepEqual(result.skillReport, reference.skillReport);
    assert.deepEqual(result.rng, reference.rng);
  }
});

test('changing troop counts, player stats and seed within the measured profile does not select timing from outcomes', () => {
  const request = structuredClone(first.request);
  request.timestamp = '000000';
  request.input.attacker.troops.marksman_t7_fc3 = 1234;
  request.input.defender.troops.infantry_t5_fc5 = 4321;
  request.input.attacker.stats.marksman.attack = 101.25;
  assert.equal(typeof prepare(request).v2DeferAttackSkill, 'function');
  const reference = prepare({...request, mechanics: {...request.mechanics, gunpowderTiming: 'reference'}});
  assert.equal(reference.v2DeferAttackSkill, undefined);
});

test('generic deferred dispatch never repeats persistent hero extras or advances their delay twice', () => {
  // A synthetic kernel invariant, not evidence of in-game hero timing. Backend opts out of this context.
  const probe: SkillFile = {name: 'TimingProbe', skills: {probe: {trigger: {type: 'battle_start'}, effects: {
    'probe/persistent': {type: 'extra_skill_attack', value: [10], duration: {attacks: {count: 100}}, units: {applies_to: ['marksman'], applies_vs: 'enemy.all'},
      trigger_damage_jobs: [{source: 'use.source', target: 'use.target'}]},
    'probe/delayed': {type: 'extra_skill_attack', value: [10], units: {applies_to: ['marksman'], applies_vs: 'enemy.all'},
      duration: {attacks: {delay: 1, count: 100}}, trigger_damage_jobs: [{source: 'use.source', target: 'use.target'}]}
  }}}};
  const input = {maxRounds: 3, attacker: {troops: {marksman_t7_fc3: 1000}, heroes: [{name: 'TimingProbe', levels: {probe: 1}}]},
    defender: {troops: {infantry_t5_fc1: 100000}}};
  const prepared = prepareBattle(input, makeConfig({TimingProbe: probe}, {volleyShield: 'per-hit'}));
  const run = (defer: boolean) => runPrepared(prepared, undefined, {mode: 'trace', rng: () => 0,
    deferAttackSkill: defer ? p => p.skill.id === 'CrystalGunpowder' : undefined});
  const current = run(true), reference = run(false);
  assert.equal(current.rounds, 3);
  for (const result of [current, reference]) {
    assert.deepEqual(result.attacks.filter(hit => hit.sourceEffectId === 'probe/persistent').map(hit => hit.round), [1, 2, 3]);
    assert.deepEqual(result.attacks.filter(hit => hit.sourceEffectId === 'probe/delayed').map(hit => hit.round), [2, 3]);
    assert.deepEqual(result.attacks.filter(hit => hit.sourceEffectId === 'CrystalGunpowder/1').map(hit => hit.round), [1, 2, 3]);
    assert.deepEqual(result.attacks.filter(hit => hit.sourceEffectId === 'Volley/1').map(hit => hit.round), [1, 2, 3]);
  }
  assert.deepEqual(current.remaining, reference.remaining);
  assert.deepEqual(current.extraSkillAttackJobsByEffect, reference.extraSkillAttackJobsByEffect);
});
