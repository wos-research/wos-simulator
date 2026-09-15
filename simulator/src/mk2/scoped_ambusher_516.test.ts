import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadSimulatorConfig} from '../config-node';
import {replayMk2} from './replay';
import {adaptTestcaseEntry,testcaseReplayOptions} from '../tooling/testcases';

const config=loadSimulatorConfig();
const cohorts=['mk2-ambusher-next210-forward','mk2-ambusher-next210-reverse','mk2-own-infantry-250-forward','mk2-own-infantry-250-reverse'];
const cases=cohorts.flatMap(c=>Array.from({length:5},(_,i)=>JSON.parse(readFileSync(new URL('../../../testcases/mk2/'+c+'-20260914-'+String(i+1).padStart(3,'0')+'.json',import.meta.url),'utf8'))));
const skills:Record<string,string>={'90004':'Ambusher','90007':'CrystalShield','90008':'CrystalLance','90009':'CrystalGunpowder'};
const input=(c:any)=>({engagement_type:c.engagement_type,attacker:c.attacker,defender:c.defender});
const policy=(c:any)=>c.test_id.includes('own-infantry')?'ownInfantryAmbusher':'globalAmbusher';
const results=new Map(cases.map(c=>[c.test_id,replayMk2(input(c),config,{...c.replay,trace:true})]));

test('twenty distinct captured reports match winner, six survivors and every explicit chance count',()=>{
 assert.equal(cases.length,20);assert.equal(new Set(cases.map(c=>c.test_id)).size,20);
 let survivors=0,counters=0;
 for(const c of cases){const r=results.get(c.test_id)!;assert.equal(r.winner,c.observed.winner,c.test_id);assert.deepEqual(r.remaining,c.observed.remaining,c.test_id);survivors+=6;
  for(const side of ['attacker','defender']as const)for(const[id,want]of Object.entries(c.observed.skillProcs[side])){const report=r.skillReport[side].filter(s=>s.skillId===skills[id]);assert.equal(report.length,1,c.test_id+side+id);assert.equal(report[0].skillActivations,want,c.test_id+side+id);counters++;}
  assert.equal(r.replayMetadata.effectiveSeed,String(c.replay.reportedSeed));assert.equal(r.replayMetadata.timestampSource,c.replay.timestampSource);assert.equal(c.timestampEvidence.timestampWasDerivedFromSeed,false);assert.ok(r.replayMetadata[policy(c)]);
 }
 assert.equal(survivors,120);assert.equal(counters,100);
});

test('new Ambusher corrections retain successes in standard mode and consume each live reservation once',()=>{
 for(const c of cases){const r=results.get(c.test_id)!,off=replayMk2(input(c),config,{...c.replay,trace:false});assert.deepEqual(off.remaining,r.remaining);assert.equal(off.winner,r.winner);assert.equal(off.rng.calls,r.rng.calls);assert.equal(off.rng.draws,r.rng.draws);
  for(const side of ['attacker','defender']as const)assert.deepEqual(off.skillReport[side].map(s=>[s.skillId,s.skillActivations]),r.skillReport[side].map(s=>[s.skillId,s.skillActivations]));
  const m:any=r.replayMetadata[policy(c)];
  if(policy(c)==='ownInfantryAmbusher'){assert.equal(m.reservations.length,r.rounds*2);assert.ok(m.reservations.every((x:any)=>x.status==='consumed-at-original-trigger'));assert.equal(m.physicalServerPhaseProven,false);}
  else{assert.equal(m.reservations.length,r.rounds);assert.equal(m.allLiveCachesConsumedExactlyOnce,true);assert.equal(m.phaseLabelIsNotProof,true);}
 }
});

test('reference switches reproduce recorded historical mismatches without changing troop definitions',()=>{
 const original=JSON.stringify(config);let mismatches=0;
 for(const c of cases){const ref=replayMk2(input(c),config,{...c.replay,[policy(c)]:'reference',trace:true});assert.equal(ref.replayMetadata[policy(c)],undefined);
  const exact=ref.winner===c.observed.winner&&JSON.stringify(ref.remaining)===JSON.stringify(c.observed.remaining)&&(['attacker','defender']as const).every(side=>Object.entries(c.observed.skillProcs[side]).every(([id,n])=>ref.skillReport[side].find(s=>s.skillId===skills[id])?.skillActivations===n));if(!exact)mismatches++;
 }
 assert.equal(mismatches,20);assert.equal(JSON.stringify(config),original);
});

test('changed troop counts or modifiers fall back to reference behavior in both observed roles',()=>{
 for(const cohort of cohorts){const c=cases.find(c=>c.test_id.startsWith(cohort))!;
  for(const side of ['attacker','defender']as const){const firstTroop=Object.keys(c[side].troops)[0],firstType=Object.keys(c[side].stats)[0];
   for(const mutate of [(x:any)=>x[side].troops[firstTroop]++,(x:any)=>x[side].stats[firstType].health+=0.01]){const x=structuredClone(input(c));mutate(x);const a=replayMk2(x,config,{...c.replay,trace:true}),b=replayMk2(x,config,{...c.replay,[policy(c)]:'reference',trace:true});assert.equal(a.replayMetadata[policy(c)],undefined);assert.deepEqual(a,b);}
  }
 }
});

test('own-Infantry policy rejects unknown options',()=>{
 const c=cases.find(c=>c.test_id.includes('own-infantry'))!;assert.throws(()=>replayMk2(input(c),config,{...c.replay,ownInfantryAmbusher:'guess'}as any),/Unknown own-Infantry/);
});

 test('normal testcase adapter retains all20 matches and forwards explicit reference policy',()=>{
 for(const c of cases){const x=adaptTestcaseEntry(c),o=testcaseReplayOptions(c),normal=replayMk2(x,config,{...o,trace:true});assert.deepEqual(normal,results.get(c.test_id));
  const row={...c,replay:{...c.replay,[policy(c)]:'reference'}},ro=testcaseReplayOptions(row);assert.equal(ro?.[policy(c)],'reference');assert.deepEqual(replayMk2(adaptTestcaseEntry(row),config,{...ro,trace:true}),replayMk2(input(c),config,{...c.replay,[policy(c)]:'reference',trace:true}));
 }
});
