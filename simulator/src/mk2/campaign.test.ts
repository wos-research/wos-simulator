import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadSimulatorConfig} from '../config-node';
import {replayMk2} from './replay';
const config=loadSimulatorConfig();
const cases=JSON.parse(readFileSync(new URL('../../../testcases/mk2/campaign_20260913.json',import.meta.url),'utf8'));
test('new controlled campaign fights replay exact outcomes and explicit procs without changing captured inputs',()=>{
 assert.ok(cases.length>0);
 assert.equal(new Set(cases.map((c:any)=>c.test_id)).size,cases.length);
 for(const c of cases){
  const before=JSON.stringify(c);
  const result=replayMk2({attacker:c.attacker,defender:c.defender,engagement_type:c.engagement_type},config,c.replay);
  assert.equal(result.winner,c.observed.winner,c.test_id);
  assert.deepEqual(result.remaining,c.observed.remaining,c.test_id);
  for(const side of ['attacker','defender'] as const){
   for(const [reportId,expected] of Object.entries(c.observed.skillProcs[side])){
    const ids=new Set(c.chanceSources.filter((s:any)=>s.side===side&&s.reportSkillId===reportId).map((s:any)=>s.skillId));
    assert.ok(ids.size>0,`${c.test_id}: unmapped observed proc ${side}:${reportId}`);
    const reports=result.skillReport[side].filter(s=>ids.has(s.skillId));
    assert.ok(reports.length>0,`${c.test_id}: missing skill ${reportId}`);
    assert.equal(reports.reduce((n,s)=>n+s.skillActivations,0),expected,`${c.test_id}:${side}:${reportId}`);
   }
  }
  assert.equal(result.replayMetadata.seedSource,'recorded-seed');
  assert.equal(result.replayMetadata.effectiveSeed,String(c.replay.reportedSeed));
  assert.equal(JSON.stringify(c),before);
 }
});
