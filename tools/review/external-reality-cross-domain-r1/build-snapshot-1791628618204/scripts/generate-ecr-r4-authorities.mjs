import fs from 'node:fs';
import crypto from 'node:crypto';

const check=process.argv.includes('--check');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const stable=v=>v===null||typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?`[${v.map(stable).join(',')}]`:`{${Object.keys(v).sort().map(k=>`${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`;
const sha=v=>crypto.createHash('sha256').update(typeof v==='string'?v:stable(v)).digest('hex');
const same=(p,text)=>fs.existsSync(p)&&fs.readFileSync(p,'utf8')===text;
const emit=(p,text)=>{if(check){if(!same(p,text))throw new Error(`GENERATED_FILE_DRIFT:${p}`)}else{fs.mkdirSync(p.split('/').slice(0,-1).join('/'),{recursive:true});fs.writeFileSync(p,text)}};

const specPath='content/embodied-configuration/ecr-calculation-spec-v1.json';
const sourcePath='content/embodied-configuration/meaning/ecr-atomic-meaning-source-v1.json';
const configPath='content/embodied-configuration/ecr-environment-first-configuration-v1.json';
const motionPath='content/embodied-configuration/ecr-motion-registry-v1.json';
const spec=read(specPath),source=read(sourcePath),config=read(configPath),motion=read(motionPath);

const runtimeSpec=`/* GENERATED FILE. Do not edit by hand.\n * Source: ${specPath}\n */\nexport const ECR_CALCULATION_SPEC_RUNTIME = Object.freeze(${JSON.stringify(spec,null,2)});\nexport default ECR_CALCULATION_SPEC_RUNTIME;\n`;
emit('functions/embodied-configuration/ecr-calculation-spec-runtime.js',runtimeSpec);

const motionById=new Map(motion.entries.map(x=>[x.motionId,x]));
const hEntries=config.entries.map(item=>{
  const upper=motionById.get(item.environmentPriorityMotionId),lower=motionById.get(item.embodiedResponseMotionId);
  if(!upper||!lower)throw new Error(`ECR_H64_MOTION_MISSING:${item.configurationId}`);
  return {
    meaningCode:`ECR-H-${item.configurationId}`,
    meaningVersion:'1.0.0',layer:'H',coordinate:item.configurationId,
    label:`${upper.label} environment / ${lower.label} response`,
    labelZhHans:`${upper.labelZhHans}环境｜${lower.labelZhHans}回应`,
    definition:`The environment-priority configuration emphasizes ${upper.label.toLowerCase()} in the surrounding field while the embodied response position emphasizes ${lower.label.toLowerCase()}. This is an ECR structural convention, not an I Ching fortune claim.`,
    definitionZhHans:`环境优先配置以${upper.labelZhHans}作为外部场域重点，同时以${lower.labelZhHans}作为载体回应位置。这是 ECR 的结构约定，不是易经吉凶判断。`,
    status:'PRODUCTION',authorityClass:'PHIOS_FIRST_PARTY_DERIVED',
    selector:{operator:'structure_item_code_match',groupCode:'ECR_CONFIGURATION',code:item.configurationId},
    lineage:{configurationRef:item.configurationId,upperMotionRef:upper.motionId,lowerMotionRef:lower.motionId,hexagramRef:item.hexagramRef,ichingCustomerMeaningImported:false}
  };
});
const registry={schemaVersion:'PHI-OS-ECR-ATOMIC-MEANING-REGISTRY-v1.0.0',work:'CX-R12R4B-R4-W32R',status:'PRODUCTION_ATOMIC_MEANING_AUTHORITY',authorityClass:'PHIOS_FIRST_PARTY',source:{sourcePath,sourceSha256:sha(fs.readFileSync(sourcePath,'utf8')),configurationPath:configPath,configurationSha256:sha(fs.readFileSync(configPath,'utf8')),motionPath,motionSha256:sha(fs.readFileSync(motionPath,'utf8'))},entries:[...source.entries,...hEntries],rules:{atomicMeaningIsNotCustomerInterpretation:true,rendererCreatesMeaning:false,aiCreatesMeaning:false,ichingCustomerMeaningImported:false,humanDesignMeaningImported:false}};
const registryText=JSON.stringify(registry,null,2)+'\n';
emit('content/embodied-configuration/meaning/ecr-atomic-meaning-registry-v1.json',registryText);
const runtimeMeaning=`/* GENERATED FILE. Do not edit by hand.\n * Source: content/embodied-configuration/meaning/ecr-atomic-meaning-registry-v1.json\n */\nexport const ECR_ATOMIC_MEANING_REGISTRY_RUNTIME = Object.freeze(${JSON.stringify(registry,null,2)});\nexport default ECR_ATOMIC_MEANING_REGISTRY_RUNTIME;\n`;
emit('functions/embodied-configuration/ecr-meaning-registry-runtime.js',runtimeMeaning);

console.log(check?'✓ ECR R4 generated authorities are current.':'✓ ECR R4 generated authorities written.');
console.log(`  Atomic meanings: ${registry.entries.length} (81 source + ${hEntries.length} derived H64).`);
