import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadSimulatorConfig} from '../config-node';
import {adaptTestcaseEntry,testcaseReplayOptions} from '../tooling/testcases';
import {prepareBattle} from '../simulator';
import {createMk2Config,normalizeMechanics} from './mechanics';
import {replayMk2} from './replay';
import {scope as avScope,createScopedFourSourceVolley} from './scoped_four_source_volley';
import {exactFC4Scope,createScopedFC4Volley} from './scoped_fc4_volley';
import {exactInf5Scope,createScopedInf5Volley} from './scoped_inf5_volley';

// Existing anonymized reports only; no copied fixtures or private identities.
const selected: {file:string;id:string;policy:string;mixedRole:string}[] = [
  {
    "file": "c2_accounting_followup_20260913.json",
    "id": "mk2-c2-accounting-followup-20260913-001",
    "policy": "inf5Volley",
    "mixedRole": "defender"
  },
  {
    "file": "c2_accounting_followup_20260913.json",
    "id": "mk2-c2-accounting-followup-20260913-002",
    "policy": "inf5Volley",
    "mixedRole": "defender"
  },
  {
    "file": "c2_accounting_followup_20260913.json",
    "id": "mk2-c2-accounting-followup-20260913-003",
    "policy": "inf5Volley",
    "mixedRole": "defender"
  },
  {
    "file": "c2_accounting_followup_20260913.json",
    "id": "mk2-c2-accounting-followup-20260913-004",
    "policy": "inf5Volley",
    "mixedRole": "defender"
  },
  {
    "file": "c2_accounting_followup_20260913.json",
    "id": "mk2-c2-accounting-followup-20260913-005",
    "policy": "inf5Volley",
    "mixedRole": "defender"
  },
  {
    "file": "c2_five_infantry_reverse_20260913.json",
    "id": "mk2-c2-five-infantry-reverse-20260913-001",
    "policy": "inf5Volley",
    "mixedRole": "defender"
  },
  {
    "file": "c2_five_infantry_reverse_20260913.json",
    "id": "mk2-c2-five-infantry-reverse-20260913-002",
    "policy": "inf5Volley",
    "mixedRole": "defender"
  },
  {
    "file": "c2_five_infantry_reverse_20260913.json",
    "id": "mk2-c2-five-infantry-reverse-20260913-003",
    "policy": "inf5Volley",
    "mixedRole": "defender"
  },
  {
    "file": "c2_five_infantry_reverse_20260913.json",
    "id": "mk2-c2-five-infantry-reverse-20260913-004",
    "policy": "inf5Volley",
    "mixedRole": "defender"
  },
  {
    "file": "c2_five_infantry_reverse_20260913.json",
    "id": "mk2-c2-five-infantry-reverse-20260913-005",
    "policy": "inf5Volley",
    "mixedRole": "defender"
  },
  {
    "file": "continuation_20260913.json",
    "id": "mk2-continuation-20260913-006",
    "policy": "inf5Volley",
    "mixedRole": "attacker"
  },
  {
    "file": "continuation_20260913.json",
    "id": "mk2-continuation-20260913-007",
    "policy": "inf5Volley",
    "mixedRole": "attacker"
  },
  {
    "file": "continuation_20260913.json",
    "id": "mk2-continuation-20260913-008",
    "policy": "inf5Volley",
    "mixedRole": "attacker"
  },
  {
    "file": "continuation_20260913.json",
    "id": "mk2-continuation-20260913-009",
    "policy": "inf5Volley",
    "mixedRole": "attacker"
  },
  {
    "file": "continuation_20260913.json",
    "id": "mk2-continuation-20260913-010",
    "policy": "inf5Volley",
    "mixedRole": "attacker"
  },
  {
    "file": "continuation_20260913.json",
    "id": "mk2-continuation-20260913-011",
    "policy": "inf5Volley",
    "mixedRole": "defender"
  },
  {
    "file": "continuation_20260913.json",
    "id": "mk2-continuation-20260913-012",
    "policy": "inf5Volley",
    "mixedRole": "defender"
  },
  {
    "file": "continuation_20260913.json",
    "id": "mk2-continuation-20260913-013",
    "policy": "inf5Volley",
    "mixedRole": "defender"
  },
  {
    "file": "continuation_20260913.json",
    "id": "mk2-continuation-20260913-014",
    "policy": "inf5Volley",
    "mixedRole": "defender"
  },
  {
    "file": "continuation_20260913.json",
    "id": "mk2-continuation-20260913-015",
    "policy": "inf5Volley",
    "mixedRole": "defender"
  },
  {
    "file": "continuation_20260913.json",
    "id": "mk2-continuation-20260913-016",
    "policy": "inf5Volley",
    "mixedRole": "attacker"
  },
  {
    "file": "continuation_20260913.json",
    "id": "mk2-continuation-20260913-017",
    "policy": "inf5Volley",
    "mixedRole": "attacker"
  },
  {
    "file": "continuation_20260913.json",
    "id": "mk2-continuation-20260913-018",
    "policy": "inf5Volley",
    "mixedRole": "attacker"
  },
  {
    "file": "continuation_20260913.json",
    "id": "mk2-continuation-20260913-019",
    "policy": "inf5Volley",
    "mixedRole": "attacker"
  },
  {
    "file": "continuation_20260913.json",
    "id": "mk2-continuation-20260913-020",
    "policy": "inf5Volley",
    "mixedRole": "attacker"
  },
  {
    "file": "four_skill_forward_pending_20260913.json",
    "id": "mk2-four-skill-forward-20260913-001",
    "policy": "fourSourceVolley",
    "mixedRole": "attacker"
  },
  {
    "file": "four_skill_forward_pending_20260913.json",
    "id": "mk2-four-skill-forward-20260913-002",
    "policy": "fourSourceVolley",
    "mixedRole": "attacker"
  },
  {
    "file": "four_skill_forward_pending_20260913.json",
    "id": "mk2-four-skill-forward-20260913-003",
    "policy": "fourSourceVolley",
    "mixedRole": "attacker"
  },
  {
    "file": "four_skill_forward_pending_20260913.json",
    "id": "mk2-four-skill-forward-20260913-004",
    "policy": "fourSourceVolley",
    "mixedRole": "attacker"
  },
  {
    "file": "four_skill_forward_pending_20260913.json",
    "id": "mk2-four-skill-forward-20260913-005",
    "policy": "fourSourceVolley",
    "mixedRole": "attacker"
  },
  {
    "file": "four_skill_reverse_pending_20260913.json",
    "id": "mk2-four-skill-reverse-20260913-001",
    "policy": "fourSourceVolley",
    "mixedRole": "defender"
  },
  {
    "file": "four_skill_reverse_pending_20260913.json",
    "id": "mk2-four-skill-reverse-20260913-002",
    "policy": "fourSourceVolley",
    "mixedRole": "defender"
  },
  {
    "file": "four_skill_reverse_pending_20260913.json",
    "id": "mk2-four-skill-reverse-20260913-003",
    "policy": "fourSourceVolley",
    "mixedRole": "defender"
  },
  {
    "file": "four_skill_reverse_pending_20260913.json",
    "id": "mk2-four-skill-reverse-20260913-004",
    "policy": "fourSourceVolley",
    "mixedRole": "defender"
  },
  {
    "file": "four_skill_reverse_pending_20260913.json",
    "id": "mk2-four-skill-reverse-20260913-005",
    "policy": "fourSourceVolley",
    "mixedRole": "defender"
  },
  {
    "file": "mixed_fc5_pending_20260913.json",
    "id": "mk2-mixed-fc5-pending-20260913-006",
    "policy": "inf5Volley",
    "mixedRole": "attacker"
  },
  {
    "file": "mixed_fc5_pending_20260913.json",
    "id": "mk2-mixed-fc5-pending-20260913-007",
    "policy": "inf5Volley",
    "mixedRole": "attacker"
  },
  {
    "file": "mixed_fc5_pending_20260913.json",
    "id": "mk2-mixed-fc5-pending-20260913-008",
    "policy": "inf5Volley",
    "mixedRole": "attacker"
  },
  {
    "file": "mixed_fc5_pending_20260913.json",
    "id": "mk2-mixed-fc5-pending-20260913-009",
    "policy": "inf5Volley",
    "mixedRole": "attacker"
  },
  {
    "file": "mixed_fc5_pending_20260913.json",
    "id": "mk2-mixed-fc5-pending-20260913-010",
    "policy": "inf5Volley",
    "mixedRole": "attacker"
  },
  {
    "file": "mixed_fc5_pending_20260913.json",
    "id": "mk2-mixed-fc5-pending-20260913-011",
    "policy": "inf5Volley",
    "mixedRole": "defender"
  },
  {
    "file": "mixed_fc5_pending_20260913.json",
    "id": "mk2-mixed-fc5-pending-20260913-012",
    "policy": "inf5Volley",
    "mixedRole": "defender"
  },
  {
    "file": "mixed_fc5_pending_20260913.json",
    "id": "mk2-mixed-fc5-pending-20260913-013",
    "policy": "inf5Volley",
    "mixedRole": "defender"
  },
  {
    "file": "mixed_fc5_pending_20260913.json",
    "id": "mk2-mixed-fc5-pending-20260913-014",
    "policy": "inf5Volley",
    "mixedRole": "defender"
  },
  {
    "file": "mixed_fc5_pending_20260913.json",
    "id": "mk2-mixed-fc5-pending-20260913-015",
    "policy": "inf5Volley",
    "mixedRole": "defender"
  },
  {
    "file": "research_pending_20260913.json",
    "id": "mk2-research-pending-20260913-001",
    "policy": "fc4Volley",
    "mixedRole": "attacker"
  },
  {
    "file": "research_pending_20260913.json",
    "id": "mk2-research-pending-20260913-002",
    "policy": "fc4Volley",
    "mixedRole": "attacker"
  },
  {
    "file": "research_pending_20260913.json",
    "id": "mk2-research-pending-20260913-003",
    "policy": "fc4Volley",
    "mixedRole": "attacker"
  },
  {
    "file": "research_pending_20260913.json",
    "id": "mk2-research-pending-20260913-004",
    "policy": "fc4Volley",
    "mixedRole": "attacker"
  },
  {
    "file": "research_pending_20260913.json",
    "id": "mk2-research-pending-20260913-005",
    "policy": "fc4Volley",
    "mixedRole": "attacker"
  },
  {
    "file": "research_pending_20260913.json",
    "id": "mk2-research-pending-20260913-006",
    "policy": "fc4Volley",
    "mixedRole": "attacker"
  },
  {
    "file": "research_pending_20260913.json",
    "id": "mk2-research-pending-20260913-007",
    "policy": "fc4Volley",
    "mixedRole": "attacker"
  },
  {
    "file": "research_pending_20260913.json",
    "id": "mk2-research-pending-20260913-008",
    "policy": "fc4Volley",
    "mixedRole": "attacker"
  },
  {
    "file": "research_pending_20260913.json",
    "id": "mk2-research-pending-20260913-009",
    "policy": "fc4Volley",
    "mixedRole": "defender"
  },
  {
    "file": "research_pending_20260913.json",
    "id": "mk2-research-pending-20260913-010",
    "policy": "fc4Volley",
    "mixedRole": "defender"
  },
  {
    "file": "research_pending_20260913.json",
    "id": "mk2-research-pending-20260913-011",
    "policy": "fc4Volley",
    "mixedRole": "defender"
  },
  {
    "file": "research_pending_20260913.json",
    "id": "mk2-research-pending-20260913-012",
    "policy": "fc4Volley",
    "mixedRole": "defender"
  },
  {
    "file": "research_pending_20260913.json",
    "id": "mk2-research-pending-20260913-013",
    "policy": "fc4Volley",
    "mixedRole": "defender"
  },
  {
    "file": "unresolved_c2_20260913.json",
    "id": "mk2-unresolved-c2-20260913-001",
    "policy": "fc4Volley",
    "mixedRole": "attacker"
  },
  {
    "file": "unresolved_e1_20260913.json",
    "id": "mk2-unresolved-e1-20260913-001",
    "policy": "fc4Volley",
    "mixedRole": "attacker"
  }
];
const cache=new Map<string,any[]>(),config=loadSimulatorConfig();
function read(name:string):any[]{if(!cache.has(name))cache.set(name,JSON.parse(readFileSync(new URL(`../../../testcases/mk2/${name}`,import.meta.url),'utf8')));return cache.get(name)!;}
const cases=selected.map(s=>{const matches=read(s.file).filter(r=>r.test_id===s.id);assert.equal(matches.length,1,s.id);return{...s,row:matches[0]};});
assert.equal(cases.length,60);assert.equal(new Set(cases.map(c=>c.id)).size,60);
const policies=['fourSourceVolley','fc4Volley','inf5Volley'],guards:any={fourSourceVolley:avScope,fc4Volley:exactFC4Scope,inf5Volley:exactInf5Scope},creators:any={fourSourceVolley:createScopedFourSourceVolley,fc4Volley:createScopedFC4Volley,inf5Volley:createScopedInf5Volley};
const wire:any={'90004':'Ambusher','90008':'CrystalLance','90006':'Volley','90009':'CrystalGunpowder','90007':'CrystalShield'};
function observations(result:any,row:any){const skillProcs:any={attacker:{},defender:{}};for(const side of ['attacker','defender'])for(const id of Object.keys(row.observed.skillProcs[side])){assert(wire[id],id);const matched=result.skillReport[side].filter((s:any)=>s.skillId===wire[id]);assert.equal(matched.length,1,`${row.test_id}: explicit ${id}`);skillProcs[side][id]=matched[0].skillActivations;}return{winner:result.winner,remaining:result.remaining,skillProcs};}
const expected=(row:any)=>({winner:row.observed.winner,remaining:row.observed.remaining,skillProcs:row.observed.skillProcs});
const inputFor=(row:any)=>structuredClone(adaptTestcaseEntry(row));
const compile=(input:any)=>prepareBattle(structuredClone(input),createMk2Config(config,normalizeMechanics()));

test('60 existing reports match winner, all six survivors and every explicit counter through the normal adapter',()=>{const counts:any={fourSourceVolley:0,fc4Volley:0,inf5Volley:0};for(const c of cases){const before=structuredClone(c.row),input=inputFor(c.row),opts=testcaseReplayOptions(c.row);assert(Object.hasOwn(input,'seed')&&input.seed===undefined);const compiled=compile(input);assert.deepEqual(policies.filter(p=>guards[p](compiled)),[c.policy],c.id+' disjoint guards');for(const trace of [false,true]){const result=replayMk2(input,config,{...opts,trace}),meta:any=result.replayMetadata[c.policy as keyof typeof result.replayMetadata];assert.deepEqual(observations(result,c.row),expected(c.row),c.id);assert.equal(meta.accounting.selected,'inherited-trigger-only-U0');assert.equal(meta.accounting.unusedSuccessRuleValidated,false);}counts[c.policy]++;assert.deepEqual(c.row,before);}assert.deepEqual(counts,{fourSourceVolley:10,fc4Volley:15,inf5Volley:35});});

test('reference options map at replay top level, disable only their disjoint rule, and reject invalid or misplaced policies',()=>{for(const c of cases){const entry={...c.row,replay:{...c.row.replay,[c.policy]:'reference'}},options=testcaseReplayOptions(entry);assert.equal((options as any)[c.policy],'reference');const input=inputFor(entry),one=replayMk2(input,config,{...options,trace:true}),all=replayMk2(input,config,{...options,trace:true,fourSourceVolley:'reference',fc4Volley:'reference',inf5Volley:'reference'});assert.deepEqual(one,all,c.id);assert.equal(one.replayMetadata[c.policy as keyof typeof one.replayMetadata],undefined);}for(const p of policies){const c=cases.find(c=>c.policy===p)!,input=inputFor(c.row),opts=testcaseReplayOptions(c.row);for(const value of [null,'U1',1,''])assert.throws(()=>replayMk2(input,config,{...opts,[p]:value} as any),/Unknown/);assert.throws(()=>replayMk2(input,config,{...opts,mechanics:{...opts?.mechanics,[p]:'reference'}} as any),/Unknown/);}});

test('meaningful count/modifier/hero/extra-profile changes stay outside new gates; FC4 Shield reverse remains excluded',()=>{for(const policy of policies){const c=cases.find(c=>c.policy===policy)!,role=c.mixedRole;for(const[label,change]of [['count',(x:any)=>{const id=Object.keys(x[role].troops).find(k=>k.startsWith('marksman'))!;x[role].troops[id]--;}],['modifier',(x:any)=>x[role].stats.lancer.health+=0.01],['unknown zero',(x:any)=>x[role].troops.unknown_profile=0],['defined seed',(x:any)=>x.seed='1']]as const){const input=inputFor(c.row);change(input);assert.equal(guards[policy](compile(input)),null,label);const opts=testcaseReplayOptions(c.row);assert.deepEqual(replayMk2(input,config,{...opts,trace:true}),replayMk2(input,config,{...opts,trace:true,fourSourceVolley:'reference',fc4Volley:'reference',inf5Volley:'reference'}),label);}for(const field of ['heroes','joiner_heroes']){const x=compile(inputFor(c.row));(x.input as any)[role][field]=[{name:'Sergey',levels:{}}];assert.equal(guards[policy](x),null,field);}const x=compile(inputFor(c.row)),id=Object.keys(c.row[role].troops).find(k=>k.startsWith('lancer'))!,old=x.config.troopStats[id];x.config={...x.config,troopStats:{...x.config.troopStats,[id]:{...old,stats:{...old.stats,health:old.stats.health+1}}}};assert.equal(guards[policy](x),null,'custom stat');}
const c=cases.find(c=>c.policy==='fc4Volley'&&c.row.defender.troops.infantry_t5_fc5===1000)!;assert(c);const input=inputFor(c.row),reverse={...input,attacker:input.defender,defender:input.attacker};assert.equal(exactFC4Scope(compile(reverse)),null);const opts=testcaseReplayOptions(c.row);assert.deepEqual(replayMk2(reverse,config,opts),replayMk2(reverse,config,{...opts,fc4Volley:'reference'}));});

test('actual dashboard default representation activates only the same guarded AV armies',async()=>{const {toBattleInput}=await import(new URL('../../../dashboard/web/lib/simulator/adapters.ts',import.meta.url).href);for(const role of ['attacker','defender']){const c=cases.find(c=>c.policy==='fourSourceVolley'&&c.mixedRole===role)!,payload:any={simulation_mode:'mk2'};for(const side of ['attacker','defender']){const f=c.row[side];payload[side]={troop_types:{infantry:'infantry_t5_fc1',lancer:'lancer_t10_fc5',marksman:'marksman_t7_fc3'},troops:{infantry:f.troops.infantry_t5_fc1??0,lancer:f.troops.lancer_t10_fc5??0,marksman:f.troops.marksman_t7_fc3??0},stats:Object.fromEntries([['infantry','inf'],['lancer','lanc'],['marksman','mark']].map(([type,key])=>{const s=f.stats[type]??{attack:0,defense:0,lethality:0,health:0};return[key,[s.attack,s.defense,s.lethality,s.health]];})),heroes:{infantry:{name:''},lancer:{name:''},marksman:{name:''}},joiners:[],gareth:0};}const ui=toBattleInput(payload,''),canonical=inputFor(c.row);delete ui.seed;delete canonical.attacker.name;delete canonical.defender.name;const before=structuredClone(ui),opts=testcaseReplayOptions(c.row);for(const trace of[false,true])assert.deepEqual(replayMk2(ui,config,{...opts,trace}),replayMk2(canonical,config,{...opts,trace}));assert.deepEqual(ui,before);}});

test('synthetic hook lifecycle keeps successful-unused accounting uncredited and cached Volley consumes no second draw',()=>{for(const policy of policies){const c=cases.find(c=>c.policy===policy&&(policy!=='fc4Volley'||c.row.defender.troops.infantry_t5_fc1===1000))!,role=c.mixedRole,other=role==='attacker'?'defender':'attacker';for(const applied of[false,true]){const x=compile(inputFor(c.row));let calls=0;const stream={rng:{chance:()=>{calls++;return true;}},metadata:()=>({calls})},hook=creators[policy](x,stream);assert(hook);const troops:any={[role]:{infantry:0,lancer:100,marksman:100},[other]:{infantry:500,lancer:0,marksman:0}};hook.onEmptyUnit(1,role,'infantry',{troops},{});const context=(id:string,side:string,unit:string,phase='attack_declared')=>({round:1,phase,skill:x.fighters[side as 'attacker'|'defender'].troopSkills.find(s=>s.id===id),intent:{round:1,dealerSide:role,dealerUnit:unit,takerSide:other,takerUnit:'infantry'}});if(policy==='fourSourceVolley')hook.rng.chance(20,context('Ambusher',role,'lancer','before_target'));if(policy==='inf5Volley')hook.rng.chance(37.5,context('CrystalShield',other,'lancer'));hook.rng.chance(policy==='fc4Volley'?10:15,context('CrystalLance',role,'lancer'));const before=calls;if(applied){assert.equal(hook.rng.chance(10,context('Volley',role,'marksman')),true);assert.equal(calls,before,'cached result must not consume another draw');}const result:any={skillReport:{[role]:[{skillId:'Volley',skillActivations:applied?1:0}]}},saved=structuredClone(result),meta=hook.finish(result);assert.deepEqual(result,saved,'finish must not alter damage or activation accounting');assert.equal(calls,before);assert.equal(meta.accounting.unusedSuccessRuleValidated,false);assert.equal(meta.reservations.filter((r:any)=>r.status==='unused'&&r.passed).length,applied?0:1);}}});
