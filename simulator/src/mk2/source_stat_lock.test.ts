import test from 'node:test';
import assert from 'node:assert/strict';
import {loadSimulatorConfig} from '../config-node';
import {createMk2Config,normalizeMechanics} from './mechanics';
import {createTroopStatsRecord} from '../troopStats';

test('source stats remain locked across all 180 T1-T10 FC0-FC5 profiles and legacy options',()=>{
 const source=loadSimulatorConfig();
 for(const fcRounding of ['nearest','floor'] as const)for(const catalogueCorrections of ['none','validated'] as const){
  const actual=createMk2Config(source,normalizeMechanics({fcRounding,catalogueCorrections}));let checked=0;
  for(const [id,t] of Object.entries(source.troopStats))if(t.tier>=1&&t.tier<=10&&t.fc>=0&&t.fc<=5){assert.deepEqual(actual.troopStats[id],t,id);if(id!=='bear_infantry')checked++;}
  assert.equal(checked,180);
 }
});
test('protected catalogue preserves caller-supplied records without replacing them with generated constants',()=>{
 const source=loadSimulatorConfig(),t=source.troopStats.marksman_t5_fc3;
 const custom=createTroopStatsRecord({...t,stats:{...t.stats,attack:1234,health:4321}});
 const config={...source,troopStats:{...source.troopStats,[t.id]:custom}};
 const actual=createMk2Config(config,normalizeMechanics());assert.deepEqual(actual.troopStats[t.id],custom);assert.deepEqual(source.troopStats[t.id],t);
});
