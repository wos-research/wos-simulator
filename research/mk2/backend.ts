/** V2 extensions around a byte-pinned upstream engine; no V1 combat math. */
import { readFileSync } from 'node:fs';
import { buildSimulatorConfig } from './upstream/src/config';
import { loadSimulatorConfig } from './upstream/src/config-node';
import { createTroopStatsRecord, fireCrystalMultiplier, generateTroopStats } from './upstream/src/troopStats';
import { prepareBattle, runPrepared } from './upstream/src/simulator';
import type { BattleInput, SkillFile, SimulatorConfig, UnitType } from './upstream/src/types';

import {createBattleRng} from './battle_rng';
import {orderCrystalShield, crystalShieldExtraHits, type ShieldInteractionMode} from './crystal_shield';
import {normalizeTimestamp, type Timestamp} from './timestamp';
import {volleyAfterDeath, type VolleyAfterDeath} from './volley_persistence';
import {gunpowderTiming, type GunpowderTiming} from './gunpowder_timing';

export const extension = JSON.parse(readFileSync(new URL('./extensions.json',import.meta.url),'utf8'));
export type Request = {input:BattleInput; timestamp?:Timestamp; timestampSource?:string; reportSkills?:Record<string,SkillFile>; id?:string; mechanics?:{rng?:'lua54'|'legacy-lcg';channels?:'literal-extra'|'reported-modifiers';mixedStacks?:'upstream'|'reject';fcRounding?:'nearest'|'floor';gunpowderShield?:ShieldInteractionMode;lanceShield?:ShieldInteractionMode;volleyShield?:ShieldInteractionMode;attackScheduling?:'side-local'|'reference';volleyAfterDeath?:VolleyAfterDeath;gunpowderTiming?:GunpowderTiming}};
const upstream=loadSimulatorConfig();

export function makeConfig(extra:Record<string,SkillFile>={}, mechanics:Request['mechanics']={}):SimulatorConfig {
  for(const name of Object.keys(extra)){
    if(upstream.heroDefinitions[name]||extension.heroDefinitions[name]||extension.nonCombatDefinitions[name])throw new Error(`Report effects cannot replace hero definition ${name}`);
  }
  if(mechanics.channels&&!['literal-extra','reported-modifiers'].includes(mechanics.channels))throw new Error('Unknown channel model');
  if(mechanics.fcRounding!==undefined&&!['nearest','floor'].includes(mechanics.fcRounding))throw new Error('Unknown FC stat rounding');
  const newer=structuredClone(extension.heroDefinitions);
  if(mechanics.channels==='reported-modifiers'){
    // Controlled reports classify Toxic Tip as an effect (zero credited kills),
    // and have no separate direct-hit credits for Dominic/Flora's boosts.
    // Preserve every coefficient; test modifier jobs instead of extra hits.
    for(const [hero,sid] of [['Ligeia','500496'],['Dominic','500545'],['Flora','500515']]){
      const id=sid+'/'+(hero==='Flora'?'2':'1');const e=newer[hero].skills[sid].effects[id];
      e.type='active.hero.damage.up';delete e.trigger_damage_jobs;
      if(hero!=='Flora'){
        e.duration={attacks:{count:1}};e.units.applies_vs='trigger.target';
      }
    }
  }
  if(mechanics.volleyShield!==undefined&&!['per-hit','reference'].includes(mechanics.volleyShield))throw new Error('Unknown Volley/Shield interaction');
  const troopSkills=structuredClone(upstream.troopSkills);
  // Explicit opt-in here preserves makeConfig's pinned reference default.
  if(mechanics.volleyShield==='per-hit'){
    const effect=troopSkills.skills.Volley.effects['Volley/1'];
    effect.type='extra_skill_attack';
    effect.trigger_damage_jobs=[{source:'use.source',target:'effect.applies_vs',damage_kind:'skill'}];
    delete effect.duration;
  }
  const config=buildSimulatorConfig({heroDefinitions:{...upstream.heroDefinitions,...extension.nonCombatDefinitions,...newer,...extra},
    heroGenerationStats:upstream.heroGenerationStats,troopSkills});
  config.troopStats={...config.troopStats};
  // Captured T5 FC3 Marksmen / FC1 Infantry replays distinguish floor from
  // nearest-integer FC coefficients. Preserve the pinned reference catalogue;
  // T11 calibration and T12 extrapolation are separate, unvalidated models.
  if(mechanics.fcRounding==='floor'){
    for(const [id,troop] of Object.entries(config.troopStats)){
      if(troop.fc===0||troop.tier>10)continue;
      const base=generateTroopStats(troop.type,troop.tier,0).stats;
      const factor=fireCrystalMultiplier(troop.fc);
      config.troopStats[id]=createTroopStatsRecord({...troop,stats:{...troop.stats,
        attack:Math.floor(base.attack*factor),health:Math.floor(base.health*factor)}});
    }
  }
  for(const [id,raw] of Object.entries(extension.t12) as [string,any][]){
    const base=generateTroopStats(raw.type,11,raw.fc);
    const stats={...base.stats};
    for(const axis of ['attack','defense','lethality','health'] as const)stats[axis]*=raw.axisRatios[axis];
    config.troopStats[id]=createTroopStatsRecord({id,type:raw.type,tier:12,fc:raw.fc,stats});
  }
  if(config.diagnostics.unsupportedEffects.length)throw new Error(JSON.stringify(config.diagnostics.unsupportedEffects));
  return config;
}

function validate(input:BattleInput, config:SimulatorConfig, mechanics:Request['mechanics']={}){
  if(mechanics.mixedStacks&&!['upstream','reject'].includes(mechanics.mixedStacks))throw new Error('Unknown mixed-stack model');
  const warnings:string[]=[];
  if(input.maxRounds!==undefined&&(!Number.isInteger(input.maxRounds)||input.maxRounds<1||input.maxRounds>10000))throw new Error('Invalid maxRounds');
  for(const side of ['attacker','defender'] as const){
    const f=input[side];
    if(!f?.troops)throw new Error(`${side}: missing troops`);
    const typeIds=new Map<UnitType,string[]>();let total=0;
    for(const [id,n] of Object.entries(f.troops)){
      if(!Number.isInteger(n)||n<0)throw new Error(`${side}: invalid troop count ${id}`);
      if(!n)continue;
      const t=config.troopStats[id];if(!t)throw new Error(`${side}: unsupported troop ${id}`);
      const ids=typeIds.get(t.type)??[];ids.push(id);typeIds.set(t.type,ids);total+=n;
    }
    if(!total)throw new Error(`${side}: empty army`);
    for(const [type,ids] of typeIds)if(ids.length>1){
      if(mechanics.mixedStacks==='reject')throw new Error(`${side}: mixed tier/FC rejected by strict option`);
      warnings.push(`${side}: ${type} uses native upstream weighted-average stats and max tier/FC skill eligibility`);
    }
    for(const [unit,stats] of Object.entries(f.stats??{})){
      if(!['infantry','lancer','marksman','inf','lanc','mark','lan'].includes(unit.toLowerCase()))throw new Error(`Unknown stat troop type ${unit}`);
      for(const [axis,value] of Object.entries(stats)){
        if(!['attack','defense','lethality','health'].includes(axis.toLowerCase())||typeof value!=='number'||!Number.isFinite(value)||value<=-100)throw new Error(`Invalid stat ${unit}.${axis}`);
      }
    }
    for(const [role,collection] of [['main',f.heroes],['joiner',f.joiner_heroes]] as const){
      const entries=Array.isArray(collection)?collection:Object.entries(collection??{}).map(([name,levels])=>({name,levels}));
      if(role==='joiner'&&entries.length>4)throw new Error('More than four selected joiners');
      for(const entry of entries){
        const canonical=config.heroAliasIndex?.[entry.name.toLowerCase().replace(/[^a-z0-9]/g,'')]??entry.name;
        const def=config.heroDefinitions[canonical];if(!def)throw new Error(`${side}: unknown hero ${entry.name}`);
        const keys=Object.keys(def.skills);
        for(const [key,n] of Object.entries(entry.levels??{})){
          if(!Number.isInteger(n)||n<0||n>5)throw new Error(`${entry.name}: invalid skill level`);
          if(!keys.includes(key)&&!/^skill_[1-4]$/.test(key))throw new Error(`${entry.name}: unknown skill ${key}`);
          if(key.startsWith('skill_')&&Number(key.slice(6))>keys.length)throw new Error(`${entry.name}: missing skill index ${key}`);
          if(role==='joiner'&&n&&key!==keys[0]&&key!=='skill_1')throw new Error('Joiners must carry only first expedition skill');
        }
      }
    }
  }
  return warnings;
}

export function prepare(request:Request){
  normalizeTimestamp(request.timestamp);
  if(request.mechanics?.rng&&!['lua54','legacy-lcg'].includes(request.mechanics.rng))throw new Error('Unknown RNG model');
  // Active Mk2 replays use the prospectively verified FC floor profile.
  // makeConfig itself retains nearest rounding for pinned-reference studies.
  const mechanics=request.mechanics??{};
  if(mechanics.attackScheduling!==undefined&&!['side-local','reference'].includes(mechanics.attackScheduling))throw new Error('Unknown attack scheduling');
  if(mechanics.volleyAfterDeath!==undefined&&!['roll','skip'].includes(mechanics.volleyAfterDeath))throw new Error('Unknown Volley after-death policy');
  if(mechanics.gunpowderTiming!==undefined&&!['after-volley','reference'].includes(mechanics.gunpowderTiming))throw new Error('Unknown Gunpowder timing');
  for(const [key,label] of [['gunpowderShield','Gunpowder/Shield'],['lanceShield','Lance/Shield'],['volleyShield','Volley/Shield']] as const)
    if(mechanics[key]!==undefined&&!['per-hit','reference'].includes(mechanics[key]))throw new Error(`Unknown ${label} interaction`);
  const config=makeConfig(request.reportSkills,{...mechanics,
    fcRounding:mechanics.fcRounding===undefined?'floor':mechanics.fcRounding,
    volleyShield:mechanics.volleyShield??'per-hit'});
  const v2Warnings=validate(request.input,config,request.mechanics);
  const compiled=prepareBattle(request.input,config);
  orderCrystalShield(compiled,mechanics);
  for(const side of ['attacker','defender'] as const)
    if(compiled.resolved[side].diagnostics.length)throw new Error(compiled.resolved[side].diagnostics.join('; '));
  const timing=gunpowderTiming(compiled,mechanics);
  v2Warnings.push(...timing.warnings);
  return Object.assign(compiled,{v2Warnings,v2DeferAttackSkill:timing.deferAttackSkill});
}

/** One exact-seed candidate replay; observed outcomes are never simulation inputs. */
export function replay(request:Request,trace=false){
  const compiled=prepare(request);
  const stream=createBattleRng(request.timestamp,trace);
  const result=runPrepared(compiled,undefined,{mode:trace?'trace':'standard',rng:stream.rng,
    beforeExtraAttack:crystalShieldExtraHits(request.mechanics??{}),
    attackScheduling:request.mechanics?.attackScheduling??'side-local',
    onEmptyUnit:volleyAfterDeath(compiled,request.mechanics?.volleyAfterDeath??'roll'),
    deferAttackSkill:compiled.v2DeferAttackSkill});
  const a=Object.values(result.remaining.attacker).reduce((x,y)=>x+y,0);
  const d=Object.values(result.remaining.defender).reduce((x,y)=>x+y,0);
  if(result.winner==='draw'&&a>0&&d>0)throw new Error(`Unresolved round cap with both sides alive after ${result.rounds} rounds`);
  return {...result,rng:stream.metadata(),timestampSource:request.timestampSource??(request.timestamp===undefined?'missing-default':'request.timestamp'),warnings:compiled.v2Warnings};
}

export function sample(request:Request,count=256,seed='expedition-v2',trace=false){
  if(!Number.isInteger(count)||count<1||count>100000)throw new Error('samples must be 1..100000');
  if(request.mechanics?.rng!=='legacy-lcg'){
    const r=replay(request,trace);
    const a=Object.values(r.remaining.attacker).reduce((x,y)=>x+y,0),d=Object.values(r.remaining.defender).reduce((x,y)=>x+y,0);
    return {mechanics:{channels:request.mechanics?.channels??'literal-extra',rng:'lua54',fcRounding:request.mechanics?.fcRounding??'floor',gunpowderShield:request.mechanics?.gunpowderShield??'per-hit',lanceShield:request.mechanics?.lanceShield??'per-hit',volleyShield:request.mechanics?.volleyShield??'per-hit',attackScheduling:request.mechanics?.attackScheduling??'side-local',volleyAfterDeath:request.mechanics?.volleyAfterDeath??'roll',gunpowderTiming:request.mechanics?.gunpowderTiming??'after-volley'},mode:'timestamp-replay',n:1,
      deterministic:true,hasChanceSkills:!r.randomness.deterministic,rng:r.rng,timestampSource:r.timestampSource,
      pAttacker:r.winner==='attacker'?1:0,pDefender:r.winner==='defender'?1:0,pDraw:r.winner==='draw'?1:0,
      meanSigned:a-d,sdSigned:0,meanRounds:r.rounds,p05:a-d,p50:a-d,p95:a-d,
      samples:[{winner:r.winner,attacker:a,defender:d,signed:a-d,rounds:r.rounds}],
      remaining:r.remaining,skillReport:r.skillReport,coverage:r.resolved,...(trace?{trace:r}:{}),
      warnings:[...r.warnings,...extension.assumptions,
        'A timestamp replay is one deterministic prediction, not a win-probability estimate.',
        'Lua 5.4 seeding and skill-call scheduling remain server hypotheses until matched to timestamped reports.',
        ...(r.timestampSource==='missing-default'?['Missing battle timestamp: using 000000 (seed 1); exact historical replay is not established.']:[])]};
  }
  const compiled=prepare(request);
  const samples=[];let first:any;
  for(let i=0;i<count;i++){
    const r=runPrepared(compiled,`${seed}:${i}`,{mode:trace&&i===0?'trace':'fast',
      beforeExtraAttack:crystalShieldExtraHits(request.mechanics??{}),
    attackScheduling:request.mechanics?.attackScheduling??'side-local',
    onEmptyUnit:volleyAfterDeath(compiled,request.mechanics?.volleyAfterDeath??'roll'),
    deferAttackSkill:compiled.v2DeferAttackSkill});
    const a=Object.values(r.remaining.attacker).reduce((a,b)=>a+b,0),d=Object.values(r.remaining.defender).reduce((a,b)=>a+b,0);
    if(r.winner==='draw'&&a>0&&d>0)throw new Error(`Unresolved round cap with both sides alive after ${r.rounds} rounds`);
    if(i===0)first=r;
    samples.push({winner:r.winner,attacker:a,defender:d,signed:a-d,rounds:r.rounds});
    if(r.randomness.deterministic)break;
  }
  const scores=samples.map(x=>x.signed).sort((a,b)=>a-b),mean=scores.reduce((a,b)=>a+b,0)/scores.length;
  const quantile=(p:number)=>scores[Math.min(scores.length-1,Math.floor(p*(scores.length-1)))];
  return {mechanics:{channels:request.mechanics?.channels??'literal-extra',rng:'legacy-lcg',fcRounding:request.mechanics?.fcRounding??'floor',gunpowderShield:request.mechanics?.gunpowderShield??'per-hit',lanceShield:request.mechanics?.lanceShield??'per-hit',volleyShield:request.mechanics?.volleyShield??'per-hit',attackScheduling:request.mechanics?.attackScheduling??'side-local',volleyAfterDeath:request.mechanics?.volleyAfterDeath??'roll',gunpowderTiming:request.mechanics?.gunpowderTiming??'after-volley'},mode:'monte-carlo',n:samples.length,deterministic:first.randomness.deterministic,
    pAttacker:samples.filter(x=>x.winner==='attacker').length/samples.length,
    pDefender:samples.filter(x=>x.winner==='defender').length/samples.length,
    pDraw:samples.filter(x=>x.winner==='draw').length/samples.length,
    meanSigned:mean,sdSigned:scores.length>1?Math.sqrt(scores.reduce((n,v)=>n+(v-mean)**2,0)/(scores.length-1)):0,
    meanRounds:samples.reduce((n,x)=>n+x.rounds,0)/samples.length,
    p05:quantile(.05),p50:quantile(.5),p95:quantile(.95),samples,
    coverage:compiled.resolved,...(trace?{trace:first}:{}),
    warnings:[...compiled.v2Warnings,...extension.assumptions,'Simulator seeds are reproducible Monte Carlo draws, not decoded server seeds.']};
}
