import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadSimulatorConfig} from '../config-node';
import {replayMk2} from './replay';
const config=loadSimulatorConfig();
const d1=JSON.parse(readFileSync(new URL('../../../testcases/mk2/unresolved_d1_20260913.json',import.meta.url),'utf8'));
const campaign=JSON.parse(readFileSync(new URL('../../../testcases/mk2/campaign_20260913.json',import.meta.url),'utf8'));
function checked(row:any){
 const input={engagement_type:row.engagement_type,attacker:row.attacker,defender:row.defender};
 const before=JSON.stringify(row),r=replayMk2(input,config,row.replay);
 assert.equal(r.winner,row.observed.winner,row.test_id);assert.deepEqual(r.remaining,row.observed.remaining,row.test_id);
 const mm=row.attacker.troops.marksman_t10_fc3?'attacker':row.defender.troops.marksman_t10_fc3?'defender':null;
 const lc=row.attacker.troops.lancer_t10_fc1?'attacker':'defender';
 const required=mm?[[mm,'90006','Volley'],[mm,'90009','CrystalGunpowder'],[mm==='attacker'?'defender':'attacker','90007','CrystalShield']]:[[lc,'90004','Ambusher']];
 for(const[side,id,name]of required){assert(Object.hasOwn(row.observed.skillProcs[side],id),'Missing explicit '+id);const expected=row.observed.skillProcs[side][id];assert(Number.isSafeInteger(expected)&&expected>=0);assert.equal(r.skillReport[side as 'attacker'|'defender'].find(x=>x.skillId===name)?.skillActivations,expected,row.test_id);}
 assert.equal(r.replayMetadata.effectiveSeed,String(row.replay.reportedSeed));assert.equal(JSON.stringify(row),before);return r;
}
test('existing D1 identities pass in place; no duplicate campaign export',()=>{
 assert.equal(d1.length,5);assert.deepEqual(d1.map((r:any)=>r.test_id),Array.from({length:5},(_,i)=>'mk2-unresolved-d1-20260913-'+String(i+1).padStart(3,'0')));
 const ids=new Set(campaign.map((r:any)=>r.test_id));
 for(const row of d1){assert(!ids.has(row.test_id));checked(row);}
});
test('new G1/G2/D2 confirmations pass with exact raw observations in both roles',()=>{
 // These cohorts must be appended only after independent reverse confirmation.
 for(const[cohort,profile]of [['t10_fc1_lancer_health_g1','lancer_t10_fc1'],['t10_fc1_lancer_attack_g2','lancer_t10_fc1'],['t10_fc3_marksman_catalogue_d2','marksman_t10_fc3']]){
  const rows=campaign.filter((r:any)=>r.cohort===cohort);assert.equal(rows.length,10,cohort);let attacker=0,defender=0;
  for(const row of rows){checked(row);if(row.attacker.troops[profile])attacker++;else{assert(row.defender.troops[profile]);defender++;}}
  assert.equal(attacker,5,cohort);assert.equal(defender,5,cohort);
 }
});
