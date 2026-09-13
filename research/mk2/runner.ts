/** Batch stdin/stdout interface. Outcome observations never enter sample(). */
import { readFileSync, writeFileSync } from 'node:fs';
import { sample } from './backend';
import {normalizeTestcase} from './testcases';

const args=process.argv.slice(2);
const option=(name:string, fallback:string)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1]};
const input=JSON.parse(readFileSync(option('--input','0')==='0'?0:option('--input','0'),'utf8'));
const requests=Array.isArray(input)?input:input.cases??[input];
const count=Number(option('--samples','256')),seed=option('--seed','expedition-v2');
const cache=new Map<string,any>();
const results=requests.map((request:any,index:number)=>{
  try{
    const normalized=normalizeTestcase(request);
    const key=JSON.stringify({input:normalized.input,timestamp:normalized.timestamp,timestampSource:normalized.timestampSource,reportSkills:normalized.reportSkills??{},mechanics:normalized.mechanics??{}});
    if(!cache.has(key))cache.set(key,sample(normalized,count,seed,args.includes('--trace')));
    return {id:normalized.id??String(index),status:'ok',inputWarnings:request.inputWarnings??[],...cache.get(key)};
  }catch(error){return {id:request?.id??request?.test_id??String(index),status:'unsupported',reason:String(error)}}
});
const output=JSON.stringify({version:'expedition-mk2-lua54-gunpowder-timing-8',seed:results.every((r:any)=>r.mechanics?.rng==='legacy-lcg')?seed:null,legacyMonteCarloSeed:seed,requestedSamples:count,uniqueInputs:cache.size,results},null,2)+'\n';
if(args.includes('--output'))writeFileSync(option('--output',''),output);else process.stdout.write(output);
process.stderr.write(`V2: ${results.filter((r:any)=>r.status==='ok').length}/${results.length} supported; ${cache.size} unique inputs\n`);
