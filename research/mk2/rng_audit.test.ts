import {test} from 'node:test';
import assert from 'node:assert/strict';
import {audit, classify, compare} from './rng_audit';
import {replay, type Request} from './backend';

const noChance = ():Request => ({input:{attacker:{troops:{infantry_t5:500}},defender:{troops:{infantry_t5:20}}}});

test('classification preserves side and duplicate hero RNG instances',()=>{
  const r=noChance();
  r.input.attacker.heroes={Natalia:{skill_1:1}};
  r.input.attacker.joiner_heroes=[{name:'Natalia',levels:{skill_1:1}},{name:'Natalia',levels:{skill_1:1}}];
  r.input.defender.heroes={Natalia:{skill_1:1}};
  const c=classify(r);
  assert.equal(c.sourceCount,4);
  assert.equal(new Set(c.sources.map(s=>s.instance)).size,4);
  assert.equal(c.sources.filter(s=>s.side==='attacker').length,3);
});

test('two Crystal Gunpowder instances are two sources',()=>{
  const r=noChance();
  r.input.attacker.troops={marksman_t5_fc3:500};
  r.input.defender.troops={marksman_t5_fc3:20};
  const c=classify(r);
  assert.equal(c.sourceCount,2);
  assert.deepEqual(c.sources.map(s=>s.reportSkillId),['90009','90009']);
});

test('exact survivor comparison does not accept tolerance or a proc mismatch',()=>{
  const r=noChance();
  r.input.attacker.troops={marksman_t5_fc3:500};
  const c=classify(r), result=replay(r);
  const totals={attacker:Object.values(result.remaining.attacker).reduce((a,b)=>a+b,0),defender:0};
  const pass=compare({winner:result.winner,totals},result,c.sources);
  assert.equal(pass.exact,true);
  assert.equal(pass.procChecks.length,0);
  const mismatch=compare({winner:result.winner,totals:{...totals,attacker:totals.attacker+1}},result,c.sources);
  assert.equal(mismatch.exact,false);
  const proc=compare({winner:result.winner,totals,skillProcs:{attacker:{'90009':999}}},result,c.sources);
  assert.equal(proc.exact,false);
  assert.equal(proc.outcomeExact,true);
});

test('default seed coincidence and reported-seed diagnostic retain distinct provenance',()=>{
  const r=noChance();
  r.input.attacker.troops={marksman_t5_fc3:500};
  const result=replay(r);
  const row={id:'example',cohort:'synthetic',request:r,observed:{winner:result.winner,remaining:result.remaining}};
  const defaultAudit=audit([row]).rows[0];
  assert.equal(defaultAudit.comparison.exact,true);
  assert.equal(defaultAudit.validatedExact,false);
  const diagnostic=audit([{...row,timestamp:{provided:false,reportedSeedProvided:true,source:'derived-report-seed-minus-one'}}]).rows[0];
  assert.equal(diagnostic.timestampQualified,false);
  assert.equal(diagnostic.reportedSeedProvided,true);
  assert.equal(diagnostic.validatedExact,true);
});
