import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sourcePath='content/embodied-configuration/meaning/ecr-atomic-meaning-source-v1.json';
const configPath='content/embodied-configuration/ecr-environment-first-configuration-v1.json';
const motionPath='content/embodied-configuration/ecr-motion-registry-v1.json';
const registryPath='content/embodied-configuration/meaning/ecr-atomic-meaning-registry-v1.json';
const runtimePath='functions/embodied-configuration/ecr-meaning-registry-runtime.js';

const source=readJson(sourcePath),config=readJson(configPath),motion=readJson(motionPath),registry=readJson(registryPath);
const motionById=new Map(motion.entries.map(x=>[x.motionId,x]));
const hEntries=config.entries.map(item=>{
  const upper=motionById.get(item.environmentPriorityMotionId),lower=motionById.get(item.embodiedResponseMotionId);
  if(!upper||!lower)throw Error('ECR_H64_MOTION_MISSING:'+item.configurationId);
  return {
    meaningCode:`ECR-H-${item.configurationId}`,meaningVersion:'1.0.0',layer:'H',coordinate:item.configurationId,
    label:`${upper.label} environment / ${lower.label} response`,
    labelZhHans:`${upper.labelZhHans}环境｜${lower.labelZhHans}回应`,
    definition:`The environment-priority configuration emphasizes ${upper.label.toLowerCase()} in the surrounding field while the embodied response position emphasizes ${lower.label.toLowerCase()}. This is an ECR structural convention, not an I Ching fortune claim.`,
    definitionZhHans:`环境优先配置以${upper.labelZhHans}作为外部场域重点，同时以${lower.labelZhHans}作为载体回应位置。这是 ECR 的结构约定，不是易经吉凶判断。`,
    status:'PRODUCTION',authorityClass:'PHIOS_FIRST_PARTY_DERIVED',
    selector:{operator:'structure_item_code_match',groupCode:'ECR_CONFIGURATION',code:item.configurationId},
    lineage:{configurationRef:item.configurationId,upperMotionRef:upper.motionId,lowerMotionRef:lower.motionId,hexagramRef:item.hexagramRef,ichingCustomerMeaningImported:false}
  };
});
const expectedEntries=[...source.entries,...hEntries];
const stable=x=>JSON.stringify(x);
if(registry.entries.length!==expectedEntries.length)throw Error(`ECR_ATOMIC_REGISTRY_LENGTH_DRIFT:actual=${registry.entries.length}:expected=${expectedEntries.length}`);
for(let i=0;i<expectedEntries.length;i++){
  if(stable(registry.entries[i])!==stable(expectedEntries[i])){
    const a=registry.entries[i],e=expectedEntries[i];
    const keys=[...new Set([...Object.keys(a||{}),...Object.keys(e||{})])];
    const field=keys.find(k=>stable(a?.[k])!==stable(e?.[k]))||'UNKNOWN';
    throw Error(`ECR_ATOMIC_REGISTRY_DRIFT:index=${i}:coordinate=${a?.coordinate||e?.coordinate||'UNKNOWN'}:field=${field}:actual=${stable(a?.[field])}:expected=${stable(e?.[field])}`);
  }
}

const runtimeText=fs.readFileSync(runtimePath,'utf8');
const match=runtimeText.match(/Object\.freeze\(([\s\S]*)\);\nexport default/);
if(!match)throw Error('ECR_RUNTIME_REGISTRY_PARSE_FAILED');
const runtime=JSON.parse(match[1]);
if(stable(runtime)!==stable(registry)){
  if(runtime.entries?.length!==registry.entries?.length)throw Error(`ECR_RUNTIME_REGISTRY_LENGTH_DRIFT:runtime=${runtime.entries?.length}:registry=${registry.entries?.length}`);
  const topKeys=[...new Set([...Object.keys(runtime||{}),...Object.keys(registry||{})])].filter(k=>k!=='entries');
  const topField=topKeys.find(k=>stable(runtime?.[k])!==stable(registry?.[k]));
  if(topField)throw Error(`ECR_RUNTIME_REGISTRY_DRIFT:field=${topField}:runtime=${stable(runtime?.[topField])}:registry=${stable(registry?.[topField])}`);
  for(let i=0;i<registry.entries.length;i++){
    if(stable(runtime.entries[i])!==stable(registry.entries[i])){
      const a=runtime.entries[i],e=registry.entries[i];
      const keys=[...new Set([...Object.keys(a||{}),...Object.keys(e||{})])];
      const field=keys.find(k=>stable(a?.[k])!==stable(e?.[k]))||'UNKNOWN';
      throw Error(`ECR_RUNTIME_REGISTRY_DRIFT:index=${i}:coordinate=${a?.coordinate||e?.coordinate||'UNKNOWN'}:field=${field}:runtime=${stable(a?.[field])}:registry=${stable(e?.[field])}`);
    }
  }
  throw Error('ECR_RUNTIME_REGISTRY_DRIFT:UNKNOWN');
}

const bad='positionemphasizes';
const roots=['content','functions','scripts','config','docs'];
const hits=[];
const walk=dir=>{
  if(!fs.existsSync(dir))return;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,entry.name);
    if(entry.isDirectory()){if(!['node_modules','.git','output','.tmp'].includes(entry.name))walk(p);continue;}
    if(!/\.(?:js|mjs|json|md|html|txt)$/i.test(entry.name))continue;
    const normalized=p.replaceAll('\\','/');
    if(normalized==='scripts/check-ecr-r4-authority-drift.mjs')continue;
    let text='';try{text=fs.readFileSync(p,'utf8')}catch{continue}
    if(text.includes(bad))hits.push(normalized);
  }
};
for(const root of roots)walk(root);
if(hits.length)throw Object.assign(new Error('ECR_STALE_POSITIONEMPHASIZES_FOUND:'+hits.join(',')),{hits});

for(const code of ['ECR-H17','ECR-H18','ECR-H19']){
  const row=registry.entries.find(x=>x.coordinate===code);
  assert(row&&row.definition.includes('response position emphasizes '),`ECR_H64_DEFINITION_INVALID:${code}`);
}
console.log(JSON.stringify({pass:true,sourceEntries:source.entries.length,derivedH64:hEntries.length,registryEntries:registry.entries.length,runtimeEntries:runtime.entries.length,d11:registry.entries.find(x=>x.coordinate==='D11')?.label,h17:registry.entries.find(x=>x.coordinate==='ECR-H17')?.definition,staleTokenHits:hits.length},null,2));
console.log('PASS ECR R4 authority drift: source → registry → runtime aligned; no stale positionemphasizes artifact found.');
