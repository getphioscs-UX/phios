import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT=process.cwd();
const OUTPUT='functions/embodied-configuration/ecr-topic-deployment-authority.js';
const SOURCES={
  TOPICS:'content/embodied-configuration/ecr-topic-r1/registries/ecr-topic-registry-v1.json',
  MATRIX:'content/embodied-configuration/ecr-topic-r1/registries/ecr-topic-semantic-owner-matrix-v1.json',
  ACCESS:'content/embodied-configuration/ecr-topic-r1/contracts/ecr-topic-access-contract-v1.json',
  ATOMIC:'content/embodied-configuration/meaning/ecr-atomic-meaning-registry-v1.json'
};
const sha256=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
const loaded=Object.fromEntries(Object.entries(SOURCES).map(([name,relative])=>{
  const bytes=fs.readFileSync(path.join(ROOT,relative));
  return [name,{relative,bytes,value:JSON.parse(bytes.toString('utf8'))}];
}));
const meta={
  schemaVersion:'PHI-OS-ECR-TOPIC-DEPLOYMENT-AUTHORITY-BUNDLE-v1.0.0',
  runtimeTarget:'CLOUDFLARE_PAGES_FUNCTIONS',
  generatedFrom:Object.entries(loaded).map(([exportName,item])=>({exportName,path:item.relative,sha256:sha256(item.bytes)}))
};
const lines=[
  '// GENERATED FILE — do not edit by hand.',
  '// Source authority remains the governed JSON files listed in ECR_TOPIC_DEPLOYMENT_AUTHORITY_META.',
  `export const ECR_TOPIC_DEPLOYMENT_AUTHORITY_META = Object.freeze(${JSON.stringify(meta)});`,
  ...['TOPICS','MATRIX','ACCESS','ATOMIC'].map(name=>`export const ${name} = Object.freeze(${JSON.stringify(loaded[name].value)});`),
  'export default Object.freeze({TOPICS,MATRIX,ACCESS,ATOMIC,ECR_TOPIC_DEPLOYMENT_AUTHORITY_META});',
  ''
];
const expected=lines.join('\n');
const outputPath=path.join(ROOT,OUTPUT);
if(process.argv.includes('--check')){
  const actual=fs.existsSync(outputPath)?fs.readFileSync(outputPath,'utf8'):'';
  if(actual!==expected){
    console.error(`✗ ECR Topic deployment authority bundle is stale: ${OUTPUT}`);
    console.error('  Run: node scripts/build-ecr-topic-deployment-authority.mjs');
    process.exit(1);
  }
  console.log('✓ ECR Topic deployment authority bundle matches governed JSON sources.');
  process.exit(0);
}
fs.mkdirSync(path.dirname(outputPath),{recursive:true});
fs.writeFileSync(outputPath,expected,'utf8');
console.log(`✓ Wrote ${OUTPUT}`);
