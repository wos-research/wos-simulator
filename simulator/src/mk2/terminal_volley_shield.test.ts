import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {loadSimulatorConfig} from '../config-node';
import {buildSimulatorConfig} from '../config';
import {prepareBattle, runPrepared} from '../simulator';
import type {BattleInput, SideId, SkillFile, SimulationOptions} from '../types';
import type {Rng} from '../effects';
import {createMk2Config, normalizeMechanics, type Mk2Mechanics} from './mechanics';
import {replayMk2} from './replay';
import {orderCrystalShield, crystalShieldExtraHits} from './crystal_shield';
import {gunpowderTiming} from './gunpowder_timing';
import {terminalVolleyShield} from './terminal_volley_shield';

const config = loadSimulatorConfig();
const campaign = JSON.parse(readFileSync(new URL('../../../testcases/mk2/campaign_20260913.json', import.meta.url), 'utf8'));
const witnessCase = campaign.find((row: {test_id: string}) => row.test_id === 'mk2-campaign-20260913-093');
assert.equal(witnessCase?.cohort, 'terminal_volley_shield_f1_forward');
const witness: BattleInput = {engagement_type: witnessCase.engagement_type,
  attacker: structuredClone(witnessCase.attacker), defender: structuredClone(witnessCase.defender)};
const count = (result: ReturnType<typeof runPrepared>, side: SideId, id: string) =>
  result.skillReport[side].find(skill => skill.skillId === id)?.skillActivations ?? 0;
function compiledFor(input: BattleInput, options: Mk2Mechanics = {}) {
  const mechanics = normalizeMechanics(options);
  const compiled = prepareBattle(input, createMk2Config(config, mechanics));
  orderCrystalShield(compiled, mechanics);
  return {compiled, mechanics};
}

test('fresh terminal Volley witness records Shield 24 instead of 23 without adding damage', () => {
  const before = structuredClone(witness), seed = witnessCase.replay.reportedSeed;
  const current = replayMk2(witness, config, {reportedSeed: seed, trace: true});
  const prior = replayMk2(witness, config, {reportedSeed: seed, trace: true, mechanics: {terminalVolleyShield: 'skip'}});
  assert.equal(current.winner, 'attacker');
  assert.deepEqual(current.remaining, {attacker: {infantry: 0, lancer: 0, marksman: 306}, defender: {infantry: 0, lancer: 0, marksman: 0}});
  assert.deepEqual(current.remaining, prior.remaining);
  assert.equal(current.rounds, 57);
  assert.equal(count(current, 'attacker', 'Volley'), 10);
  assert.equal(count(current, 'attacker', 'CrystalGunpowder'), 8);
  assert.equal(count(prior, 'defender', 'CrystalShield'), 23);
  assert.equal(count(current, 'defender', 'CrystalShield'), 24);
  assert.deepEqual(current.attacks, prior.attacks, 'the extra Shield attempt must not create or modify damage');
  assert.ok(current.rng.events!.some(event => event.round === 57 && event.phase === 'extra_attack' && event.skillId === 'CrystalShield' && event.passed));
  assert.equal(current.attacks.some(job => job.round === 57 && job.sourceEffectId === 'Volley/1'), false);
  assert.equal(current.replayMetadata.mechanics.terminalVolleyShield, 'roll');
  assert.equal(prior.replayMetadata.mechanics.terminalVolleyShield, 'skip');
  assert.deepEqual(witness, before);
});

for (const reverse of [false, true]) {
  test(`generated terminal Volley rolls Shield, but canceled Gunpowder does not (${reverse ? 'defending' : 'attacking'} Marksmen)`, () => {
    const mm = {troops: {marksman_t7_fc3: 10000}, heroes: []}, inf = {troops: {infantry_t5_fc5: 1}, heroes: []};
    const input: BattleInput = {engagement_type: 'always', attacker: reverse ? inf : mm, defender: reverse ? mm : inf};
    const source: SideId = reverse ? 'defender' : 'attacker', target: SideId = reverse ? 'attacker' : 'defender';
    function run(skip: boolean) {
      const {compiled, mechanics} = compiledFor(input, {terminalVolleyShield: skip ? 'skip' : 'roll'});
      const events: string[] = [], canceled: {id: string | undefined; addedDraws: number}[] = [];
      const rng: Rng = () => 0;
      rng.chance = (_probability, context) => {events.push(context!.skill.id); return true;};
      const terminal = terminalVolleyShield(compiled, mechanics);
      assert.equal(Boolean(terminal.beforeExhaustedExtraAttack), !skip);
      const result = runPrepared(compiled, undefined, {mode: 'trace', rng, attackScheduling: 'side-local',
        beforeExtraAttack: crystalShieldExtraHits(mechanics), deferAttackSkill: gunpowderTiming(compiled, mechanics).deferAttackSkill,
        beforeExhaustedExtraAttack: (job, intent, runtime, recorder) => {
          const before = events.length;
          terminal.beforeExhaustedExtraAttack?.(job, intent, runtime, recorder);
          canceled.push({id: job.sourceEffectId, addedDraws: events.length - before});
        }});
      return {result, canceled};
    }
    const on = run(false), off = run(true);
    assert.deepEqual(on.result.attacks, off.result.attacks);
    assert.deepEqual(on.result.remaining, off.result.remaining);
    assert.equal(on.result.remaining[target].infantry, 0);
    assert.equal(count(on.result, target, 'CrystalShield') - count(off.result, target, 'CrystalShield'), 1);
    assert.equal(count(on.result, source, 'Volley'), 1);
    assert.deepEqual(on.canceled, [{id: 'Volley/1', addedDraws: 1}, {id: 'CrystalGunpowder/1', addedDraws: 0}]);
    assert.ok(off.canceled.length, 'skip must be tested on an actual exhausted-extra boundary');
    assert.ok(off.canceled.every(job => job.addedDraws === 0));
  });
}

test('terminal Shield rejects invalid policy and unmeasured option combinations', () => {
  for (const value of ['', 'reference', 1, null]) assert.throws(() => normalizeMechanics({terminalVolleyShield: value} as unknown as Mk2Mechanics));
  for (const options of [
    {terminalVolleyShield: 'skip'}, {gunpowderTiming: 'reference'}, {volleyShield: 'reference'},
    {gunpowderShield: 'reference'}, {attackScheduling: 'reference'}
  ] as Mk2Mechanics[]) {
    const {compiled, mechanics} = compiledFor(witness, options);
    assert.equal(terminalVolleyShield(compiled, mechanics).beforeExhaustedExtraAttack, undefined);
  }
});

test('main heroes, joiners, mixed troops and absent Gunpowder retain reference terminal behavior', () => {
  const inputs: [string, BattleInput][] = [];
  const main = structuredClone(witness);main.attacker.heroes = {Mia: {skill_1: 1}};inputs.push(['main hero', main]);
  const joiner = structuredClone(witness);joiner.attacker.joiner_heroes = {Mia: {skill_1: 1}};inputs.push(['joiner', joiner]);
  const mixed = structuredClone(witness);mixed.attacker.troops.lancer_t5_fc4 = 1;inputs.push(['mixed', mixed]);
  const noGP = structuredClone(witness);noGP.attacker.troops = {marksman_t7: 500};inputs.push(['no Gunpowder', noGP]);
  for (const [label, input] of inputs) {
    const {compiled, mechanics} = compiledFor(input);
    if (label === 'main hero' || label === 'joiner') assert.ok(compiled.fighters.attacker.heroes.length || compiled.fighters.attacker.heroSkills?.length, 'hero exclusion must not be vacuous');
    assert.equal(terminalVolleyShield(compiled, mechanics).beforeExhaustedExtraAttack, undefined, label);
    const on = replayMk2(input, config, {reportedSeed: 1789295873, trace: true});
    const off = replayMk2(input, config, {reportedSeed: 1789295873, trace: true, mechanics: {terminalVolleyShield: 'skip'}});
    const strip = ({replayMetadata, ...result}: typeof on) => result;
    assert.deepEqual(strip(on), strip(off), label);
  }
});

for (const reverse of [false, true]) {
  test(`canceled Crystal Lance stays outside terminal Volley policy (${reverse ? 'defending' : 'attacking'} Lancers)`, () => {
    const lancer = {troops: {lancer_t5_fc4: 1000000}, heroes: []}, infantry = {troops: {infantry_t5_fc5: 1}, heroes: []};
    const input: BattleInput = {engagement_type: 'always', attacker: reverse ? infantry : lancer, defender: reverse ? lancer : infantry};
    const {compiled, mechanics} = compiledFor(input);
    assert.equal(terminalVolleyShield(compiled, mechanics).beforeExhaustedExtraAttack, undefined);
    const rng: Rng = () => 0; rng.chance = () => true;
    const canceled: string[] = [];
    const result = runPrepared(compiled, undefined, {mode: 'trace', rng, attackScheduling: 'side-local',
      beforeExtraAttack: crystalShieldExtraHits(mechanics),
      beforeExhaustedExtraAttack: job => {canceled.push(job.sourceEffectId!);}});
    assert.deepEqual(canceled, ['CrystalLance/1'], 'must exercise a real canceled Lance hit');
    const source: SideId = reverse ? 'defender' : 'attacker', target: SideId = reverse ? 'attacker' : 'defender';
    assert.equal(count(result, source, 'CrystalLance'), 1);
    assert.equal(count(result, target, 'CrystalShield'), 1, 'normal hit only');
    assert.equal(result.attacks.some(job => job.sourceEffectId === 'CrystalLance/1'), false);
  });
}

// Same delayed-normal mechanism as simulator.test.ts's carriedNormalDamageConfig,
// but the second-round finisher forces a real exhausted pending-job cancellation.
function snapshotConfig(finish: boolean) {
  const skills: SkillFile['skills'] = {
    Snapshot: {trigger: {type: 'turn', every: 99, first: 1}, effects: {
      carrier: {units: {applies_to: 'self.marksman', applies_vs: 'enemy.any'},
        duration: {turns: {count: 1}, attacks: {count: 1}}, trigger_effects: {
          'Volley/1': {type: 'extra_skill_attack', value: 40,
            units: {applies_to: 'parent.use.source', applies_vs: 'parent.use.target'},
            trigger_damage_jobs: [{source: 'use.source', target: 'use.target', damage_kind: 'normal'}],
            duration: {turns: {delay: 1, count: 1}, attacks: {count: 1}}}
        }}
    }}
  };
  if (finish) skills.Finisher = {trigger: {type: 'turn', every: 99, first: 2}, effects: {
    finish: {type: 'active.hero.attack.up', value: 100000000, units: {applies_to: 'self.marksman', applies_vs: 'enemy.any'}}
  }};
  return buildSimulatorConfig({heroGenerationStats: {}, troopSkills: {name: 'none', skills: {}},
    heroDefinitions: {SnapshotFixture: {name: 'Snapshot fixture', troop_type: 'marksman', skills}}});
}

test('a queued snapshot exhausted before delivery never invokes the generated-extra callback', () => {
  function run(finish: boolean) {
    const input: BattleInput = {maxRounds: 2, engagement_type: 'always',
      attacker: {troops: {marksman_t1: 1000000}, heroes: {SnapshotFixture: {skill_1: 1, ...(finish ? {skill_2: 1} : {})}}},
      defender: {troops: {infantry_t1: 1000000}, heroes: {}}};
    let pendingCount = 0, capturedKills = 0, targetBeforeNormal = 0, callbacks = 0;
    const options: SimulationOptions = {mode: 'trace',
      beforeExhaustedExtraAttack: () => {callbacks++;},
      onEmptyUnit: (round, side, unit, runtime) => {
        if (round !== 2 || side !== 'attacker' || unit !== 'infantry') return;
        const pending = runtime.effectIndex.extraAttacks.flatMap(effect => effect.pendingDamageJobs ?? []);
        pendingCount = pending.length;
        capturedKills = pending.reduce((sum, job) => sum + job.result.kills, 0);
        targetBeforeNormal = runtime.troops.defender.infantry;
        assert.ok(pending.every(job => job.job.round === 1));
      }};
    const result = runPrepared(prepareBattle(input, snapshotConfig(finish)), undefined, options);
    assert.equal(pendingCount, 1, 'must inspect a real queued pending job before cancellation');
    assert.ok(capturedKills > 0);assert.ok(targetBeforeNormal > 0);
    return {result, callbacks, targetBeforeNormal};
  }
  const live = run(false), exhausted = run(true);
  const delivery = live.result.attacks.find(job => job.sourceEffectId === 'Volley/1');
  assert.ok(delivery);assert.equal(delivery.round, 2);assert.equal(delivery.calculationRound, 1);
  assert.equal(exhausted.result.attacks.some(job => job.sourceEffectId === 'Volley/1'), false);
  const finisher = exhausted.result.attacks.find(job => job.round === 2 && job.dealerSide === 'attacker' && job.dealerUnit === 'marksman' && !job.sourceEffectId);
  assert.ok(finisher);assert.equal(finisher.kills, exhausted.targetBeforeNormal);
  assert.equal(exhausted.result.remaining.defender.infantry, 0);
  assert.equal(live.callbacks, 0);assert.equal(exhausted.callbacks, 0);
});
