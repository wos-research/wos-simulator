import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadSimulatorConfig} from '../config-node';
import {replayMk2} from './replay';
import {projectControlledCasualties, SIDES, TROOP_TYPES, type ConfirmedContext, type Counts} from './controlledCasualties';
const config = loadSimulatorConfig();
const fixture = JSON.parse(readFileSync(new URL('../../../testcases/mk2/controlled_casualties_20260913.json', import.meta.url), 'utf8'));
const campaign = JSON.parse(readFileSync(new URL('../../../testcases/mk2/campaign_20260913.json', import.meta.url), 'utf8'));
const base = () => {
  const initial: Counts = {attacker:{infantry:100,lancer:0,marksman:0},defender:{infantry:100,lancer:0,marksman:0}};
  const remaining: Counts = {attacker:{infantry:57,lancer:0,marksman:0},defender:{infantry:100,lancer:0,marksman:0}};
  const context: ConfirmedContext = {battletype:9,controlledOccupiedTile:true,heroFree:true,oneFormationPerSideConfirmed:true,noHospitalOverflowConfirmed:{attacker:true,defender:true},positiveProfilesPerType:{attacker:{infantry:1,lancer:0,marksman:0},defender:{infantry:1,lancer:0,marksman:0}}};
  return {context, initial, remaining};
};
function deepFreeze(value:any):any {if(value&&typeof value==='object'){Object.values(value).forEach(deepFreeze);Object.freeze(value);}return value;}

test('forty independent battles preserve 270 explicitly encoded casualty fields',()=>{
  assert.equal(fixture.cases.length,40);
  assert.equal(new Set(fixture.cases.map((c:any)=>c.test_id)).size,40);
  assert.equal(fixture.cases.reduce((n:number,c:any)=>n+c.observedCasualties.length,0),90);
  assert.equal(fixture.evidence.explicitWireCategoryFields,270);
  for(const c of fixture.cases) for(const observed of c.observedCasualties) for(const key of ['dead','wounded','minorWounded']) assert.ok(Object.hasOwn(observed,key));
});
for(const c of fixture.cases) test(`recorded-seed replay then casualty projection: ${c.test_id}`,()=>{
  const matches=campaign.filter((row:any)=>row.test_id===c.test_id);
  assert.equal(matches.length,1,c.test_id);
  const row=matches[0], initial:Counts={attacker:{infantry:0,lancer:0,marksman:0},defender:{infantry:0,lancer:0,marksman:0}};
  const profiles:Counts=structuredClone(initial);
  for(const side of SIDES){
    assert.deepEqual(row[side].heroes,[]);
    assert.deepEqual(row[side].joiner_heroes,[]);
    for(const [id,count]of Object.entries(row[side].troops)as [string,number][]){
      assert.ok(config.troopStats[id],id);
      const type=config.troopStats[id].type;
      initial[side][type]+=count;profiles[side][type]+=Number(count>0);
    }
  }
  assert.deepEqual(profiles,c.context.positiveProfilesPerType);
  const input={attacker:row.attacker,defender:row.defender,engagement_type:row.engagement_type};
  const before=JSON.stringify({input,context:c.context,initial});
  const replay=replayMk2(input,config,row.replay);
  assert.equal(replay.replayMetadata.seedSource,'recorded-seed');
  assert.equal(replay.replayMetadata.effectiveSeed,String(row.replay.reportedSeed));
  assert.equal(replay.winner,row.observed.winner);
  assert.deepEqual(replay.remaining,row.observed.remaining);
  const replaySnapshot=JSON.stringify(replay);
  const result=projectControlledCasualties(deepFreeze(c.context),deepFreeze(initial),deepFreeze(replay.remaining));
  for(const observed of c.observedCasualties){
    const actual=result.categories[observed.side as keyof Counts][observed.troopType as typeof TROOP_TYPES[number]];
    assert.deepEqual(actual,{dead:observed.dead,wounded:observed.wounded,minorWounded:observed.minorWounded});
  }
  for(const side of SIDES)for(const type of TROOP_TYPES)if(initial[side][type]===0)assert.deepEqual(result.categories[side][type],{dead:0,wounded:0,minorWounded:0});
  assert.equal(result.status,'validated-controlled-context');
  assert.equal(JSON.stringify({input,context:c.context,initial}),before);
  assert.equal(JSON.stringify(replay),replaySnapshot,'projection must not alter combat, skill reports or RNG metadata');
});
test('zero losses, one loss, exact 35 percent, and integer rounding boundary',()=>{
  for(const [losses,wounded,minor]of [[0,0,0],[1,1,0],[20,7,13],[43,16,27]]){
    const b=base();b.remaining.attacker.infantry=100-losses;
    assert.deepEqual(projectControlledCasualties(b.context,b.initial,b.remaining).categories.attacker.infantry,{dead:0,wounded,minorWounded:minor});
  }
});
test('MAX_SAFE_INTEGER arithmetic stays exact without unsafe multiplication',()=>{
  const b=base();b.initial.attacker.infantry=Number.MAX_SAFE_INTEGER;b.remaining.attacker.infantry=0;
  assert.deepEqual(projectControlledCasualties(b.context,b.initial,b.remaining).categories.attacker.infantry,{dead:0,wounded:3152519739159347,minorWounded:5854679515581644});
});
test('round separately per type, never once across the combined army',()=>{
  const b=base();b.initial.attacker={infantry:5000,lancer:0,marksman:500};b.remaining.attacker={infantry:4424,lancer:0,marksman:96};b.context.positiveProfilesPerType.attacker.marksman=1;
  const r=projectControlledCasualties(b.context,b.initial,b.remaining);
  assert.equal(r.categories.attacker.infantry.wounded,202);
  assert.equal(r.categories.attacker.marksman.wounded,142);
  assert.equal(r.categories.attacker.infantry.wounded+r.categories.attacker.marksman.wounded,344);
});
test('reject unsupported battle kind, heroes, formation count, unconfirmed occupied tile',()=>{
  for(const [key,value]of [['battletype',8],['heroFree',false],['oneFormationPerSideConfirmed',false],['controlledOccupiedTile',false]] as const){
    const b=base();(b.context as any)[key]=value;
    assert.throws(()=>projectControlledCasualties(b.context,b.initial,b.remaining),/Unsupported or unconfirmed/);
  }
});
test('both hospital confirmations are required and cannot be guessed from zero deaths',()=>{
  for(const side of SIDES)for(const value of [false,null,undefined,0,'true']){
    const b=base();(b.context.noHospitalOverflowConfirmed as any)[side]=value;
    assert.throws(()=>projectControlledCasualties(b.context,b.initial,b.remaining),/overflow absence/);
  }
});
test('reject multiple, missing, fractional, and inconsistent profile counts',()=>{
  for(const value of [2,0,-1,1.5,NaN]){
    const b=base();b.context.positiveProfilesPerType.attacker.infantry=value;
    assert.throws(()=>projectControlledCasualties(b.context,b.initial,b.remaining));
  }
  const b=base();b.context.positiveProfilesPerType.attacker.marksman=1;
  assert.throws(()=>projectControlledCasualties(b.context,b.initial,b.remaining),/profile count/);
});
test('reject unsafe or invalid starting and surviving counts',()=>{
  for(const field of ['initial','remaining']as const)for(const value of [-1,0.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1,'43',null]){
    const b=base();(b[field].attacker as any).infantry=value;
    assert.throws(()=>projectControlledCasualties(b.context,b.initial,b.remaining),/nonnegative safe integer/);
  }
  const b=base();b.remaining.attacker.infantry=101;
  assert.throws(()=>projectControlledCasualties(b.context,b.initial,b.remaining),/exceeds initial/);
});
test('reject missing or unknown context, side, and troop keys',()=>{
  const changes=[(b:any)=>{delete b.context.heroFree;},(b:any)=>{b.context.guess=true;},(b:any)=>{delete b.initial.defender;},(b:any)=>{b.remaining.attacker.cavalry=0;},(b:any)=>{delete b.initial.attacker.lancer;}];
  for(const change of changes){const b=base();change(b);assert.throws(()=>projectControlledCasualties(b.context,b.initial,b.remaining),/missing or unsupported keys/);}
  for(const value of [null,[],1]){const b=base();assert.throws(()=>projectControlledCasualties(value as any,b.initial,b.remaining),/must be an object/);}
});
test('outputs are independent fresh values, with no mutation or external dependencies',()=>{
  const b=deepFreeze(base());const first=projectControlledCasualties(b.context,b.initial,b.remaining);first.categories.attacker.infantry.wounded=999;
  assert.equal(projectControlledCasualties(b.context,b.initial,b.remaining).categories.attacker.infantry.wounded,16);
});
