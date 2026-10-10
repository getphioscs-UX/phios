import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const ROOT='content/embodied-configuration';
const CONFIG_PATH=`${ROOT}/ecr-environment-first-configuration-v1.json`;
const RUNTIME_PATH='functions/embodied-configuration/ecr-specific-ontology-runtime.js';
const CORE_PATH=`${ROOT}/ecr-book-core-theory-projection-v1.json`;
const CORE_RUNTIME_PATH='functions/embodied-configuration/ecr-book-core-theory-runtime.js';
const SOURCES={
  context:`${ROOT}/ecr-cosmological-context-registry-v1.json`,
  motion:`${ROOT}/ecr-motion-registry-v1.json`,
  activation:`${ROOT}/ecr-activation-registry-v1.json`,
  trigram:'content/professional/core-method-runtime/iching-trigram-registry-v1.json',
  hexagram:'content/professional/core-method-runtime/iching-hexagram-registry-v1.json'
};
const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha256=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const stableJson=value=>`${JSON.stringify(value,null,2)}\n`;

const core=readJson(CORE_PATH);
const context=readJson(SOURCES.context);
const motion=readJson(SOURCES.motion);
const activation=readJson(SOURCES.activation);
const trigrams=readJson(SOURCES.trigram);
const hexagrams=readJson(SOURCES.hexagram);
assert.equal(core.grammar.length,16);
assert.equal(core.questions.length,16);
assert.equal(core.capabilities.length,9);
assert.equal(core.drivers.length,12);
assert.equal(context.entries.length,12);
assert.equal(motion.entries.length,8);
assert.equal(activation.entries.length,8);
assert.equal(trigrams.entries.length,8);
assert.equal(hexagrams.entries.length,64);

const motionByTrigram=new Map(motion.entries.map(item=>[item.trigramRef,item]));
const hexByPair=new Map(hexagrams.entries.map(item=>[`${item.upperTrigramId}|${item.lowerTrigramId}`,item]));
const configurationEntries=[];
let order=0;
for(const upperMotion of motion.entries){
  for(const lowerMotion of motion.entries){
    const hex=hexByPair.get(`${upperMotion.trigramRef}|${lowerMotion.trigramRef}`);
    assert.ok(hex,`Missing canonical hexagram for ${upperMotion.trigramRef}/${lowerMotion.trigramRef}`);
    order+=1;
    configurationEntries.push({
      configurationId:`ECR-H${String(order).padStart(2,'0')}`,
      environmentOrder:order,
      hexagramRef:hex.hexagramId,
      kingWenNumber:hex.number,
      canonicalName:hex.canonicalName,
      chineseNameZhHans:hex.chineseNameZhHans,
      upperTrigramRef:hex.upperTrigramId,
      lowerTrigramRef:hex.lowerTrigramId,
      environmentPriorityMotionId:upperMotion.motionId,
      environmentPriorityTrigram:upperMotion.trigramCode,
      embodiedResponseMotionId:lowerMotion.motionId,
      embodiedResponseTrigram:lowerMotion.trigramCode,
      rule:'UPPER_TRIGRAM_ENVIRONMENT_PRIORITY_V1',
      meaningAuthorityCreated:false
    });
  }
}
assert.equal(new Set(configurationEntries.map(item=>item.hexagramRef)).size,64);
assert.equal(new Set(configurationEntries.map(item=>item.kingWenNumber)).size,64);
const configuration={
  schemaVersion:'PHI-OS-ECR-ENVIRONMENT-FIRST-CONFIGURATION-v1.0.0',
  work:'CX-R12R4B-R3R1-W29R',
  status:'DERIVED_CANONICAL_STRUCTURE',
  authorityClass:'PHIOS_FIRST_PARTY_DERIVED_FROM_CANONICAL_ICHING_STRUCTURE',
  ordering:'UPPER_MOTION_M1_TO_M8_THEN_LOWER_MOTION_M1_TO_M8',
  convention:{
    code:'UPPER_TRIGRAM_ENVIRONMENT_PRIORITY_V1',
    upperTrigramRole:'ENVIRONMENT_PRIORITY',
    lowerTrigramRole:'EMBODIED_RESPONSE_POSITION',
    scientificFactClaimed:false,
    interpretiveConvention:true
  },
  sourceAuthorities:{motion:SOURCES.motion,trigram:SOURCES.trigram,hexagram:SOURCES.hexagram},
  entries:configurationEntries
};
const configRendered=stableJson(configuration);

const coreRuntimePayload={
  schemaVersion:'PHI-OS-ECR-BOOK-CORE-THEORY-RUNTIME-v1.0.0',
  source:{path:CORE_PATH,sha256:sha256(CORE_PATH)},
  grammarCodes:core.grammar.map(x=>x[0]),
  grammars:Object.fromEntries(core.grammar.map(([code,label,chineseLabel])=>[code,{code,label,chineseLabel}])),
  questionCodes:core.questions.map(x=>x[0]),
  questions:Object.fromEntries(core.questions.map(([questionId,question,questionZhHans])=>[questionId,{questionId,question,questionZhHans}])),
  capabilities:core.capabilities.map(([id,label,bookZh])=>({id,label,bookZh,zh:bookZh.replace(/能力$/,'')})),
  drivers:core.drivers.map(([id,label,zh])=>({id,label,zh})),
  boundary:core.rules
};
const coreDigest=crypto.createHash('sha256').update(JSON.stringify(coreRuntimePayload)).digest('hex');
const coreRuntimeRendered=`/* GENERATED FILE. Do not edit by hand.\n * Source: ${CORE_PATH}\n */\nexport const ECR_BOOK_CORE_THEORY_RUNTIME = Object.freeze(${JSON.stringify({...coreRuntimePayload,authorityDigest:coreDigest},null,2)});\nexport default ECR_BOOK_CORE_THEORY_RUNTIME;\n`;

const authorityDigests={
  context:{path:SOURCES.context,sha256:sha256(SOURCES.context)},
  motion:{path:SOURCES.motion,sha256:sha256(SOURCES.motion)},
  activation:{path:SOURCES.activation,sha256:sha256(SOURCES.activation)},
  trigram:{path:SOURCES.trigram,sha256:sha256(SOURCES.trigram)},
  hexagram:{path:SOURCES.hexagram,sha256:sha256(SOURCES.hexagram)}
};
const runtimePayload={
  schemaVersion:'PHI-OS-ECR-SPECIFIC-ONTOLOGY-RUNTIME-v1.0.0',
  generatedFrom:authorityDigests,
  cosmologicalContext:context.entries,
  motions:motion.entries,
  configurations:configurationEntries,
  activations:activation.entries
};
const digest=crypto.createHash('sha256').update(JSON.stringify(runtimePayload)).digest('hex');
const runtimeRendered=`/* GENERATED FILE. Do not edit by hand.\n * Source: scripts/generate-ecr-book-aligned-ontology-projection.mjs\n */\nexport const ECR_SPECIFIC_ONTOLOGY_RUNTIME = Object.freeze(${JSON.stringify({...runtimePayload,authorityDigest:digest},null,2)});\nexport default ECR_SPECIFIC_ONTOLOGY_RUNTIME;\n`;

if(process.argv.includes('--check')){
  assert.ok(fs.existsSync(CONFIG_PATH),'ECR_ENVIRONMENT_FIRST_CONFIGURATION_MISSING');
  assert.equal(fs.readFileSync(CONFIG_PATH,'utf8'),configRendered,'ECR_ENVIRONMENT_FIRST_CONFIGURATION_DRIFT');
  assert.ok(fs.existsSync(CORE_RUNTIME_PATH),'ECR_BOOK_CORE_THEORY_RUNTIME_MISSING');
  assert.equal(fs.readFileSync(CORE_RUNTIME_PATH,'utf8'),coreRuntimeRendered,'ECR_BOOK_CORE_THEORY_RUNTIME_DRIFT');
  assert.ok(fs.existsSync(RUNTIME_PATH),'ECR_SPECIFIC_ONTOLOGY_RUNTIME_MISSING');
  assert.equal(fs.readFileSync(RUNTIME_PATH,'utf8'),runtimeRendered,'ECR_SPECIFIC_ONTOLOGY_RUNTIME_DRIFT');
  console.log('✓ ECR book-aligned core projection + CC12/M8/H64/A8 projections are deterministic and current.');
}else{
  fs.writeFileSync(CONFIG_PATH,configRendered);
  fs.writeFileSync(CORE_RUNTIME_PATH,coreRuntimeRendered);
  fs.writeFileSync(RUNTIME_PATH,runtimeRendered);
  console.log(`Generated ${CONFIG_PATH}, ${CORE_RUNTIME_PATH} and ${RUNTIME_PATH}.`);
}
