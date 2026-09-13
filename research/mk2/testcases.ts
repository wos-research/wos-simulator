/** Load wrapped Mk2 requests or historical attacker/defender testcase rows. */
import type {Request} from './backend';
import {DEFAULT_TIMESTAMP, normalizeTimestamp} from './timestamp';

const missingSources=new Set(['default','default_zero','missing-default']);
export function normalizeTestcase(caseValue: unknown): Request {
  if(!caseValue||typeof caseValue!=='object'||Array.isArray(caseValue))throw new Error('testcase must be an object');
  const row=caseValue as any;
  const declared: {timestamp:string,source:string}[]=[];
  for(const [name,item] of [['timestamp',row],['input.timestamp',row.input],['report.timestamp',row.report]] as const){
    if(item&&Object.prototype.hasOwnProperty.call(item,'timestamp')){
      const timestamp=normalizeTimestamp(item.timestamp);
      const source=Object.prototype.hasOwnProperty.call(item,'timestampSource')?item.timestampSource:
        Object.prototype.hasOwnProperty.call(item,'timestamp_source')?item.timestamp_source:name;
      if(typeof source!=='string'||!source)throw new Error('timestamp provenance must be a nonempty string');
      if(missingSources.has(source)&&BigInt(timestamp)===0n)continue;
      declared.push({timestamp,source});
    }
  }
  if(new Set(declared.map(x=>BigInt(x.timestamp).toString())).size>1)throw new Error('conflicting testcase timestamps');
  const chosen=declared[0]??{timestamp:DEFAULT_TIMESTAMP,source:'missing-default'};
  const input=row.input??(row.attacker&&row.defender?{
    attacker:row.attacker,defender:row.defender,
    ...(row.engagement_type===undefined?{}:{engagement_type:row.engagement_type}),
    ...(row.maxRounds===undefined?{}:{maxRounds:row.maxRounds})
  }:undefined);
  if(!input)throw new Error('testcase requires input or attacker/defender');
  const {timestamp:_timestamp,timestampSource:_source,timestamp_source:_oldSource,...battleInput}=input;
  return {input:battleInput,timestamp:chosen.timestamp,timestampSource:chosen.source,
    ...((row.id??row.test_id)!==undefined&&(row.id??row.test_id)!==null?{id:String(row.id??row.test_id)}:{}),
    ...(row.reportSkills?{reportSkills:row.reportSkills}:{}),...(row.mechanics?{mechanics:row.mechanics}:{})};
}
