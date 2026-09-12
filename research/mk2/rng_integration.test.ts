import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {prepare,replay,sample} from './backend';
import {createBattleRng} from './battle_rng';
import {normalizeTimestamp} from './timestamp';
import {normalizeTestcase} from './testcases';
import {runPrepared} from './upstream/src/simulator';

// Synthetic engine fixture: below T7 avoids Volley; FC3 isolates Crystal Gunpowder.
// This is an RNG integration check, not evidence that this exact army exists in game.
const single=()=>({input:{
  attacker:{troops:{marksman_t5_fc3:1000}},
  defender:{troops:{infantry_t6:1000}}
}});

test('timestamps default to zero and preserve exact large integer seeds',()=>{
  assert.equal(normalizeTimestamp(),'000000');
  assert.equal(normalizeTimestamp('000000'),'000000');
  assert.equal(normalizeTimestamp(0),'0');
  for(const bad of [null,-1,1.5,Number.MAX_SAFE_INTEGER+1,'1e9','',true,'9223372036854775807'])
    assert.throws(()=>normalizeTimestamp(bad));
  assert.equal(createBattleRng('9223372036854775806').metadata().seed,'9223372036854775807');
});

test('loader supports historical testcase rows and rejects conflicting timestamp aliases',()=>{
  const old={test_id:'old-case',...single().input,game_report_result:[{attacker:17,defender:0}]};
  const loaded=normalizeTestcase(old);
  assert.equal(loaded.id,'old-case');
  assert.equal(normalizeTestcase({...old,id:0}).id,'0');
  assert.throws(()=>normalizeTestcase({...single(),timestamp:1,timestampSource:null}),/provenance/);
  assert.equal(loaded.timestamp,'000000');
  assert.equal(loaded.timestampSource,'missing-default');
  assert.deepEqual(loaded.input,single().input);
  assert.equal(normalizeTestcase({input:{...single().input,timestamp:12}}).timestamp,'12');
  assert.throws(()=>normalizeTestcase({...single(),timestamp:12,input:{...single().input,timestamp:13}}),/conflicting/);
  assert.equal(normalizeTestcase({...single(),timestamp:0,timestamp_source:'default_zero'}).timestampSource,'missing-default');
});

test('Crystal Gunpowder uses native Lua integer rolls including rejections',()=>{
  const result=replay(single(),true);
  assert.deepEqual(prepare(single()).runtimeSkills.randomness.chanceSkillIds,{attacker:['CrystalGunpowder'],defender:[]});
  const events=result.rng.events!;
  assert.ok(events.length>12);
  assert.deepEqual(events.slice(0,12).map(e=>e.roll),[3485,1511,2039,4054,4061,2792,1918,638,8778,9476,4722,507]);
  assert.deepEqual(events.slice(0,12).map(e=>e.lastRawDraw),[1,2,4,6,7,8,9,11,15,16,20,21]);
  assert.ok(events.every(e=>e.skillId==='CrystalGunpowder'&&e.side==='attacker'));
  for(const e of events)assert.equal(e.passed,Number(e.roll)<Number(e.probabilityPct)*100);
});

test('replay ignores legacy seed strings and post-battle outcome fields',()=>{
  const a=replay(single(),true);
  const b=replay({...single(),input:{...single().input,seed:'unrelated'},observed:{winner:'defender'},randomseed:999} as any,true);
  assert.deepEqual(a,b);
  assert.deepEqual(a.remaining,replay({...single(),timestamp:'000000'}).remaining);
  const other=replay({...single(),timestamp:42},true);
  assert.notDeepEqual(a.rng.events!.map(e=>e.roll),other.rng.events!.map(e=>e.roll));
});

test('a replay is one fixed result, never many copies presented as Monte Carlo',()=>{
  const a=sample(single(),256,'ignored');
  assert.equal(a.n,1);
  assert.equal(a.mode,'timestamp-replay');
  assert.equal(a.hasChanceSkills,true);
  assert.ok(a.warnings.some(w=>w.includes('Missing battle timestamp')));
  const old=sample({...single(),mechanics:{rng:'legacy-lcg'}},8,'baseline');
  assert.equal(old.n,8);
  assert.equal(old.mode,'monte-carlo');
});

test('two independent sources share one stream in actual event order',()=>{
  const request={input:{attacker:{troops:{marksman_t5_fc3:1000}},defender:{troops:{marksman_t5_fc3:1000}}}};
  const r=replay(request,true),events=r.rng.events!;
  assert.deepEqual(events.slice(0,4).map(e=>[e.round,e.side,e.roll]),[
    [1,'attacker',3485],[1,'defender',1511],[2,'attacker',2039],[2,'defender',4054]]);
  for(let i=1;i<events.length;i++)assert.equal(events[i].firstRawDraw,Number(events[i-1].lastRawDraw)+1);
});

test('trace collection does not alter outcomes; chance-free battles keep baseline output',()=>{
  const traced=replay(single(),true),plain=replay(single());
  assert.deepEqual(traced.remaining,plain.remaining);
  assert.equal(traced.rounds,plain.rounds);
  assert.equal(traced.rng.draws,plain.rng.draws);
  const deterministic={input:{attacker:{troops:{infantry_t6:1000}},defender:{troops:{infantry_t6:1000}}}};
  const baseline=runPrepared(prepare(deterministic),'any',{mode:'standard'});
  const current=replay(deterministic);
  assert.deepEqual(current.remaining,baseline.remaining);
  assert.equal(current.rng.draws,0);
});

test('batch cache includes timestamp and preserves missing timestamp provenance',()=>{
  const raw=execFileSync(process.execPath,[...process.execArgv.filter(x=>x!=='--test'),new URL('./runner.ts',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'),'--samples','1'],{
    input:JSON.stringify([null,{id:'a',...single(),timestamp:1},{id:'b',...single(),timestamp:2},{id:'c',...single()}]),
    encoding:'utf8'});
  const result=JSON.parse(raw);
  assert.equal(result.uniqueInputs,3);
  assert.equal(result.results[0].status,'unsupported');
  assert.deepEqual(result.results.slice(1).map((r:any)=>r.rng.seed),['2','3','1']);
  assert.equal(result.results[3].timestampSource,'missing-default');
});
