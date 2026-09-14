import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadSimulatorConfig} from '../config-node';
import {prepareBattle} from '../simulator';
import {createMk2Config,normalizeMechanics} from './mechanics';
import {replayMk2} from './replay';
import {deriveExactScopeInput,samePrepared} from './semantic_scope_bridge';

// Existing anonymized published fixtures; two roles for every installed exact guard.
const selected: {file:string;id:string;policy:string}[]=[
  {
    "file": "research_pending_20260913.json",
    "id": "mk2-research-pending-20260913-001",
    "policy": "fc4Volley"
  },
  {
    "file": "research_pending_20260913.json",
    "id": "mk2-research-pending-20260913-009",
    "policy": "fc4Volley"
  },
  {
    "file": "four_skill_forward_pending_20260913.json",
    "id": "mk2-four-skill-forward-20260913-001",
    "policy": "fourSourceVolley"
  },
  {
    "file": "four_skill_reverse_pending_20260913.json",
    "id": "mk2-four-skill-reverse-20260913-001",
    "policy": "fourSourceVolley"
  },
  {
    "file": "continuation_20260913.json",
    "id": "mk2-continuation-20260913-006",
    "policy": "inf5Volley"
  },
  {
    "file": "c2_accounting_followup_20260913.json",
    "id": "mk2-c2-accounting-followup-20260913-001",
    "policy": "inf5Volley"
  },
  {
    "file": "mixed_fc5_pending_20260913.json",
    "id": "mk2-mixed-fc5-pending-20260913-001",
    "policy": "e1Volley"
  },
  {
    "file": "followup_20260913.json",
    "id": "mk2-followup-20260913-001",
    "policy": "e1Volley"
  },
  {
    "file": "c2_one_infantry_forward_20260913.json",
    "id": "mk2-c2-one-infantry-forward-20260913-001",
    "policy": "c2Volley"
  },
  {
    "file": "c2_one_infantry_reverse_20260913.json",
    "id": "mk2-c2-one-infantry-reverse-20260913-001",
    "policy": "c2Volley"
  },
  {
    "file": "mk2-opposing-t10-lance-forward-20260914-001.json",
    "id": "mk2-opposing-t10-lance-forward-20260914-001",
    "policy": "t10Ambusher"
  },
  {
    "file": "mk2-opposing-t10-lance-reverse-20260914-001.json",
    "id": "mk2-opposing-t10-lance-reverse-20260914-001",
    "policy": "t10Ambusher"
  },
  {
    "file": "mk2-ambusher-next210-forward-20260914-001.json",
    "id": "mk2-ambusher-next210-forward-20260914-001",
    "policy": "globalAmbusher"
  },
  {
    "file": "mk2-ambusher-next210-reverse-20260914-001.json",
    "id": "mk2-ambusher-next210-reverse-20260914-001",
    "policy": "globalAmbusher"
  },
  {
    "file": "mk2-own-infantry-250-forward-20260914-001.json",
    "id": "mk2-own-infantry-250-forward-20260914-001",
    "policy": "ownInfantryAmbusher"
  },
  {
    "file": "mk2-own-infantry-250-reverse-20260914-001.json",
    "id": "mk2-own-infantry-250-reverse-20260914-001",
    "policy": "ownInfantryAmbusher"
  }
];
const config=loadSimulatorConfig(),sides=['attacker','defender'] as const,types=['infantry','lancer','marksman'] as const,axes=['attack','defense','lethality','health'] as const;
const short={infantry:'inf',lancer:'lanc',marksman:'mark'};
const cases=selected.map(item=>{const parsed=JSON.parse(readFileSync(new URL('../../../testcases/mk2/'+item.file,import.meta.url),'utf8'));const row=(Array.isArray(parsed)?parsed:[parsed]).find((row:any)=>row.test_id===item.id);assert(row,item.id);return {...item,row}});
const original=(row:any)=>structuredClone({engagement_type:row.engagement_type,attacker:row.attacker,defender:row.defender});
function requestFor(row:any):any {
 const request:any={simulation_mode:'mk2',mk2:structuredClone(row.replay),replicates:500,rally_mode:false,trace_seed:314159};
 for(const side of sides){const f=row[side],out:any={troops:{},troop_types:{},stats:{},heroes:{},joiners:[],gareth:0,stat_profile_name:'preserve-request-label'};
  for(const type of types){const ids=Object.keys(f.troops).filter(id=>f.troops[id]>0&&config.troopStats[id].type===type);assert(ids.length<=1,'Dashboard represents one profile per type');const id=ids[0]??type+'_t10_fc5';out.troops[type]=f.troops[id]??0;out.troop_types[type]=id;out.stats[short[type]]=axes.map(axis=>f.stats?.[type]?.[axis]??0);out.heroes[type]={name:null,skills:[0,0,0,0]};}request[side]=out;
 }return request;
}
async function dashboardInput(request:any){
 // Import the actual adapter without dragging Next-only type aliases into simulator tsc.
 const url=new URL('../../../dashboard/web/lib/simulator/adapters.ts',import.meta.url);
 const {toBattleInput}=await import(url.href);
 const input=toBattleInput(request,'');delete input.seed;return input;
}
const compiled=(input:any,options:any,cfg=config)=>prepareBattle(input,createMk2Config(cfg,normalizeMechanics(options.mechanics)));
const metadata=(result:any,policy:string)=>result.replayMetadata[policy];

for(const item of cases){
 test(item.id+': actual dashboard conversion retains '+item.policy+' with full trace/native parity',async()=>{
  const request=requestFor(item.row),before=structuredClone(request),input=await dashboardInput(request),inputBefore=structuredClone(input);
  assert.equal(input.seed,undefined);assert.equal(input.engagement_type,undefined);assert.equal(input.maxRounds,1500);
  const cp=compiled(input,item.row.replay),beforeProducts=structuredClone({fighters:cp.fighters,preBattleEffects:cp.preBattleEffects,staticProfile:cp.staticProfile,runtimeSkills:cp.runtimeSkills,resolved:cp.resolved}),refs={...cp},bridge=deriveExactScopeInput(cp);
  assert(bridge.accepted);assert(bridge.engagementCertificate?.shadowPreparationEqual);assert.equal(bridge.input.engagement_type,'always');
  for(const key of Object.keys(refs))assert.equal((cp as any)[key],(refs as any)[key]);
  assert.deepEqual({fighters:cp.fighters,preBattleEffects:cp.preBattleEffects,staticProfile:cp.staticProfile,runtimeSkills:cp.runtimeSkills,resolved:cp.resolved},beforeProducts);
  for(const trace of [false,true]){const options={...item.row.replay,trace},expected=replayMk2(original(item.row),config,options),actual=replayMk2(input,config,options);assert(metadata(expected,item.policy));assert(metadata(actual,item.policy));assert.deepEqual(actual,expected);}
  assert.deepEqual(input,inputBefore);assert.deepEqual(request,before);
 });
 test(item.id+': changed armies/modifiers and inactive stats remain outside '+item.policy,async()=>{
  for(const side of sides)for(const change of ['count','modifier','inactive-stat','passive']){
   const request=requestFor(item.row),active=types.find(type=>request[side].troops[type]>0)!,inactive=types.find(type=>request[side].troops[type]===0)!;assert(inactive);
   if(change==='count')request[side].troops[active]++;
   if(change==='modifier')request[side].stats[short[active]][3]+=0.01;
   if(change==='inactive-stat')request[side].stats[short[inactive]][0]+=0.01;
   if(change==='passive')request[side].stat_modifiers={attack:1,defense:0,lethality:0,health:0,enemy_attack:0,enemy_defense:0};
   const before=structuredClone(request),input=await dashboardInput(request),inputBefore=structuredClone(input),bridge=deriveExactScopeInput(compiled(input,item.row.replay));
   if(change==='inactive-stat'){assert(bridge.accepted);assert.deepEqual(bridge.input[side].stats?.[inactive],input[side].stats[inactive]);}
   if(change==='passive')assert(!bridge.accepted);
   const options={...item.row.replay,trace:true},actual=replayMk2(input,config,options),reference=replayMk2(input,config,{...options,[item.policy]:'reference'});assert.equal(metadata(actual,item.policy),undefined);assert.deepEqual(actual,reference);assert.deepEqual(input,inputBefore);assert.deepEqual(request,before);
  }
 });
 test(item.id+': every supplied nondefault engagement is preserved',async()=>{
  const request=requestFor(item.row);request.rally_mode=true;const before=structuredClone(request),base=await dashboardInput(request);assert.equal(base.engagement_type,'rally');
  for(const engagement of ['rally','garrison','unknown','ALWAYS',' always ','']){const input={...base,engagement_type:engagement},inputBefore=structuredClone(input),bridge=deriveExactScopeInput(compiled(input,item.row.replay));assert(bridge.accepted);assert.equal(bridge.input.engagement_type,engagement);const options={...item.row.replay,trace:true},actual=replayMk2(input,config,options);assert.equal(metadata(actual,item.policy),undefined);assert.deepEqual(actual,replayMk2(input,config,{...options,[item.policy]:'reference'}));assert.deepEqual(input,inputBefore);}assert.deepEqual(request,before);
 });
}

test('missing engagement scans definitions excluded from the compiled active set',async()=>{
 const item=cases.find(c=>c.policy==='t10Ambusher')!,input=await dashboardInput(requestFor(item.row));
 for(const variant of ['existing','additional-filtered']){
  const cfg=structuredClone(config),id=variant==='existing'?'Charge':'FilteredOutCharge';
  if(variant==='additional-filtered')cfg.troopSkills.skills[id]=structuredClone(cfg.troopSkills.skills.Charge);
  cfg.troopSkills.skills[id].requirements!.push({level:1,type:'engagement_type',value:'always'});
  const omitted=compiled(input,item.row.replay,cfg),explicit=compiled({...input,engagement_type:'always'},item.row.replay,cfg),before=structuredClone(input);
  assert(!omitted.fighters.attacker.troopSkills.some(s=>s.id===id));assert(explicit.fighters.attacker.troopSkills.some(s=>s.id===id));
  const bridge=deriveExactScopeInput(omitted);assert(!bridge.accepted);assert.match(bridge.reason,/engagement/);assert.deepEqual(input,before);
 }
});

test('unknown fields and nonzero passive effects never receive a comparison certificate',async()=>{
 const item=cases[0],input=await dashboardInput(requestFor(item.row));
 for(const mutate of [(x:any)=>x.unknown=0,(x:any)=>x.attacker.stats.lancer.unknown=0,(x:any)=>x.attacker.passive={attack:{up:1}},(x:any)=>x.attacker.troops.unknown=0,(x:any)=>x.engagement_type=null]){
  const x=structuredClone(input);mutate(x);const cp=compiled(input,item.row.replay);cp.input=x;assert(!deriveExactScopeInput(cp).accepted);
 }
});

test('prepared graph certificate rejects merged and split aliases, including shared identity subgraphs',()=>{
 const source={a:{v:1},b:{v:1}},value={v:1},target={a:value,b:value};
 assert.equal(samePrepared(source,target),false);assert.equal(samePrepared(target,source),false);
 const shared={nested:value};assert.equal(samePrepared({a:shared,b:{v:1}},{a:shared,b:value}),false);
 const copy={v:1};assert.equal(samePrepared(target,{a:copy,b:copy}),true);
 const seen=new Map<object,object>(),reverse=new Map<object,object>();
 assert.equal(samePrepared(source.a,value,seen,reverse),true);
 assert.equal(samePrepared(source.b,value,seen,reverse),false,'shared maps must span distinct compiler products');
 const a:any={};a.self=a;const b:any={};b.self=b;assert.equal(samePrepared(a,b),true);
});
