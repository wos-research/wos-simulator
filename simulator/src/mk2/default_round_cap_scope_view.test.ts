import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadSimulatorConfig} from '../config-node';
import {replayMk2} from './replay';
import {defaultRoundCapScopeView} from './default_round_cap_scope_view';
import {prepareBattle} from '../simulator';
const config=loadSimulatorConfig();
const cohorts=['mk2-opposing-t10-lance-forward','mk2-opposing-t10-lance-reverse','mk2-ambusher-source-death-forward','mk2-ambusher-source-death-reverse','mk2-ambusher-next210-forward','mk2-ambusher-next210-reverse','mk2-own-infantry-250-forward','mk2-own-infantry-250-reverse'];
const cases=cohorts.flatMap(c=>Array.from({length:5},(_,i)=>JSON.parse(readFileSync(new URL('../../../testcases/mk2/'+c+'-20260914-'+String(i+1).padStart(3,'0')+'.json',import.meta.url),'utf8'))));
const input=(c:any)=>structuredClone({engagement_type:c.engagement_type,attacker:c.attacker,defender:c.defender});
const policy=(c:any)=>c.test_id.includes('own-infantry')?'ownInfantryAmbusher':c.test_id.includes('opposing-t10')?'t10Ambusher':'globalAmbusher';
test('forty captured replays preserve full output and RNG for explicit versus omitted default round limit',()=>{
 assert.equal(cases.length,40);
 for(const c of cases)for(const trace of [true,false]){
  const x={...input(c),maxRounds:1500},before=JSON.stringify(x),options={...c.replay,trace};
  const omitted=replayMk2(input(c),config,options),explicit=replayMk2(x,config,options);
  assert.ok(omitted.replayMetadata[policy(c)],c.test_id);assert.deepEqual(explicit,omitted,c.test_id);assert.equal(JSON.stringify(x),before);
 }
});
test('explicit default limit does not admit changed armies, modifiers or engagement',()=>{
 for(const c of cases.filter((_,i)=>i%5===0))for(const side of ['attacker','defender'] as const)for(const kind of ['count','modifier','engagement','unknown-field']){
  const x:any={...input(c),maxRounds:1500};
  if(kind==='count')x[side].troops[Object.keys(x[side].troops)[0]]++;
  if(kind==='modifier')x[side].stats[Object.keys(x[side].stats)[0]].health+=0.01;
  if(kind==='engagement')x.engagement_type='rally';
  if(kind==='unknown-field')x.unrecognizedScopeField=true;
  const options={...c.replay,trace:true},actual=replayMk2(x,config,options),reference=replayMk2(x,config,{...options,[policy(c)]:'reference'});
  assert.equal(actual.replayMetadata[policy(c)],undefined);assert.deepEqual(actual,reference,c.test_id+side+kind);
 }
});
test('round-limit view preserves original numerical objects and nondefault limits',()=>{
 const original=prepareBattle({...input(cases[0]),maxRounds:1500},config),view=defaultRoundCapScopeView(original);
 assert.notEqual(view,original);assert.notEqual(view.input,original.input);assert.equal(original.input.maxRounds,1500);assert.equal(view.input.maxRounds,undefined);
 for(const key of Object.keys(original).filter(k=>k!=='input'))assert.equal((view as any)[key],(original as any)[key]);
 for(const cap of [1,1499,1501,0,-1,10001,1.5]){const x=prepareBattle({...input(cases[0]),maxRounds:cap},config);assert.equal(defaultRoundCapScopeView(x),x);}
});
