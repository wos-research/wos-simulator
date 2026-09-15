import type {BattleInput, FighterInput, StatBlock, UnitType} from '../types';
import {prepareBattle, type CompiledBattle} from '../prepare';
import {normalizeUnitType} from '../normalize';
import {defaultRoundCapScopeView} from './default_round_cap_scope_view';

export type ScopeBridgeResult = {accepted:true;input:BattleInput;transformations:string[];engagementCertificate?:{relevantDefinitions:string[];shadowPreparationEqual:true}} | {accepted:false;reason:string};
const sides=['attacker','defender'] as const, types=['infantry','lancer','marksman'] as const, axes=['attack','defense','lethality','health'] as const;
class Refusal extends Error {}
const refuse=(reason:string):never=>{throw new Refusal(reason)};
function record(value:unknown,label:string,allowed?:readonly string[]): Record<string,unknown> {
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype)refuse(label+': plain record required');
 for(const key of Reflect.ownKeys(value as object)){
  if(typeof key!=='string')throw new Refusal(label+': symbol key');
  const d=Object.getOwnPropertyDescriptor(value,key)!;
  if(!('value' in d)||!d.enumerable)refuse(label+': accessor or non-enumerable property');
  if(allowed&&!allowed.includes(key))refuse(label+': unknown field '+key);
 }
 return value as Record<string,unknown>;
}
function emptyHeroes(value:unknown,label:string):void {
 if(value===undefined)return;
 if(Array.isArray(value)){
  if(value.length!==0||Reflect.ownKeys(value).some(k=>k!=='length'))refuse(label+': nonempty or decorated hero collection');
  return;
 }
 if(Object.keys(record(value,label)).length)refuse(label+': nonempty heroes');
}
function zeroPassive(value:unknown,label:string):void {
 if(value===undefined)return;
 const obj=record(value,label,axes);
 for(const [axis,raw] of Object.entries(obj)){
  const d=record(raw,label+'.'+axis,['up','down']);
  for(const v of Object.values(d))if(typeof v!=='number'||!Number.isFinite(v)||v!==0)refuse(label+': only explicit finite numeric zero effects');
 }
}
/** Graph comparison retains undefined, key order, cycles and function identity.
 * Unlike JSON canonicalization it never drops callable or unsupported structures.
 * This is an additional compiler-product check, not a replacement for safe-transform obligations.
 */
export function samePrepared(a:unknown,b:unknown,seen=new Map<object,object>(),reverse=new Map<object,object>()):boolean {
 if(a===null||b===null||typeof a!=='object'||typeof b!=='object')return Object.is(a,b);
 if(seen.has(a))return seen.get(a)===b;
 if(reverse.has(b))return false;
 seen.set(a,b);reverse.set(b,a);
 if(Object.getPrototypeOf(a)!==Object.getPrototypeOf(b))return false;
 if(ArrayBuffer.isView(a)){
  if(!(a instanceof Float64Array||a instanceof Int32Array)||!(b instanceof Float64Array||b instanceof Int32Array))return false;
  if(a.length!==b.length||a.some((value,index)=>!Object.is(value,b[index])))return false;
 }
 if(a instanceof Map||a instanceof Set)return false;
 const ka=Reflect.ownKeys(a),kb=Reflect.ownKeys(b);if(ka.length!==kb.length||ka.some((k,i)=>k!==kb[i]))return false;
 return ka.every(k=>{const x=Object.getOwnPropertyDescriptor(a,k)!,y=Object.getOwnPropertyDescriptor(b,k)!;return 'value'in x&&'value'in y&&samePrepared(x.value,y.value,seen,reverse)});
}
function noRelevantEngagementGate(compiled:CompiledBattle):string[]{
 const present=new Set(types.filter(t=>sides.some(s=>compiled.fighters[s].initialTroops[t]>0))), definitions:string[]=[];
 for(const [id,raw] of Object.entries(compiled.config.troopSkills.skills)){
  let type:UnitType;try{type=normalizeUnitType(String(raw.troop_type))}catch{refuse('config: unrecognized troop skill type '+id)}
  if(!present.has(type!))continue;
  definitions.push(id);
  if(!Array.isArray(raw.requirements))throw new Refusal('config: missing or malformed requirements '+id);
  for(const req of raw.requirements){
   record(req,'requirement '+id,['level','type','value']);
   if(req.type==='engagement_type')refuse('engagement: relevant definition contains requirement '+id);
   if(!['tier','fc'].includes(req.type)||!Number.isFinite(req.level)||typeof req.value!=='number'||!Number.isFinite(req.value))refuse('config: unrecognized requirement '+id);
  }
 }
 return definitions;
}
/** Called before post-prepare ordering hooks. Returned input is used only by exact guards.
 * Stage A disables engagement bridging; Stage B adds conservative config-bound proof.
 * No stats/army tables, probability changes, seed logic or runtime substitution.
 */
export function deriveExactScopeInput(compiled:CompiledBattle, options:{engagementBridge?:boolean}={}):ScopeBridgeResult {
 try{
  const raw=record(compiled.input,'input',['attacker','defender','seed','maxRounds','engagement_type']);
  if(raw.engagement_type!==undefined&&typeof raw.engagement_type!=='string')refuse('engagement: supplied non-string');
  const input={...defaultRoundCapScopeView(compiled).input},transformations:string[]=[];
  if(compiled.input.maxRounds===1500)transformations.push('explicit-default-round-cap');
  for(const side of sides){
   const f=record(raw[side],side,['name','troops','stats','passive','heroes','joiner_heroes']);
   if(f.name!==undefined&&typeof f.name!=='string')refuse(side+': non-string name');
   if(compiled.fighters[side].heroes.length||compiled.fighters[side].diagnostics.length)refuse(side+': heroes or diagnostics');
   emptyHeroes(f.heroes,side+'.heroes');emptyHeroes(f.joiner_heroes,side+'.joiner_heroes');zeroPassive(f.passive,side+'.passive');
   const troopObject=record(f.troops,side+'.troops'),troops:Record<string,number>={};
   for(const [id,n] of Object.entries(troopObject)){
    if(!Object.hasOwn(compiled.config.troopStats,id))refuse(side+': unknown troop '+id);
    if(typeof n!=='number'||!Number.isSafeInteger(n)||n<0)throw new Refusal(side+': invalid troop count');
    if(n===0){transformations.push(side+':zero-troop:'+id);continue}troops[id]=n;
   }
   const view:FighterInput={...(f as unknown as FighterInput),troops,heroes:[],joiner_heroes:[]};
   if(!Array.isArray(f.heroes)||!Array.isArray(f.joiner_heroes))transformations.push(side+':empty-hero-collections');
   if(Object.hasOwn(f,'passive')){delete view.passive;transformations.push(side+':zero-passive')}
   if(f.stats!==undefined){
    const stats=record(f.stats,side+'.stats',types),copy:Record<string,Partial<StatBlock>>={};
    for(const [type,block] of Object.entries(stats)){
     const b=record(block,side+'.stats.'+type,axes);
     if(Object.values(b).some(v=>typeof v!=='number'||!Number.isFinite(v)))refuse(side+': non-finite or non-numeric stat');
     if(compiled.fighters[side].initialTroops[type as UnitType]===0&&Object.keys(b).length===4&&Object.values(b).every(v=>v===0)){transformations.push(side+':inactive-zero-stats:'+type);continue}
     copy[type]={...b};
    }
    view.stats=copy;
   }
   input[side]=view;
  }
  let relevantDefinitions:string[]|undefined;
  if(input.engagement_type===undefined&&options.engagementBridge!==false){
   relevantDefinitions=noRelevantEngagementGate(compiled);input.engagement_type='always';transformations.push('missing-engagement:config-certified-troop-only');
  }
  const shadow=prepareBattle(input,compiled.config);
  const seen=new Map<object,object>(),reverse=new Map<object,object>();
  for(const field of ['fighters','preBattleEffects','staticProfile','runtimeSkills','resolved'] as const){
   if(!samePrepared(compiled[field],shadow[field],seen,reverse))refuse('shadow preparation differs: '+field);
  }
  return {accepted:true,input,transformations,...(relevantDefinitions?{engagementCertificate:{relevantDefinitions,shadowPreparationEqual:true as const}}:{})};
 }catch(e){if(e instanceof Refusal)return {accepted:false,reason:e.message};throw e}
}
