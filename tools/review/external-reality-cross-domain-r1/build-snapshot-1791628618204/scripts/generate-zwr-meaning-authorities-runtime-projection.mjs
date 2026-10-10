import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const SOURCES=Object.freeze({
  ontology:'content/zi-wei-runtime/meaning/zi-wei-meaning-ontology-v1.json',
  mapping:'content/zi-wei-runtime/meaning/zi-wei-meaning-mapping-v1.json',
  locale:'content/zi-wei-runtime/meaning/zi-wei-meaning-locale-v1.json',
  activation:'content/professional/canonical-meaning-production/successors/canonical-meaning-production-activation-v4.json'
});
const OUTPUT='functions/canonical-meaning-production/zi-wei-meaning-authorities.generated.js';
const bytes=path=>fs.readFileSync(path);
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
const authorities=Object.fromEntries(Object.entries(SOURCES).map(([key,path])=>[key,JSON.parse(bytes(path).toString('utf8'))]));
const digests=Object.fromEntries(Object.entries(SOURCES).map(([key,path])=>[key,{sourceRef:path,sha256:digest(bytes(path))}]));
const rendered=`// Generated runtime projection of governed Zi Wei meaning JSON authorities. Do not edit by hand.\nconst deepFreeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))deepFreeze(item)}return value};\nexport const ZWR_MEANING_AUTHORITY_DIGESTS=deepFreeze(${JSON.stringify(digests)});\nexport const ZWR_MEANING_AUTHORITIES=deepFreeze(${JSON.stringify(authorities)});\nexport default ZWR_MEANING_AUTHORITIES;\n`;

if(process.argv.includes('--check')){
  assert.equal(fs.existsSync(OUTPUT),true,'ZWR_MEANING_RUNTIME_PROJECTION_MISSING');
  assert.equal(fs.readFileSync(OUTPUT,'utf8'),rendered,'ZWR_MEANING_RUNTIME_PROJECTION_DRIFT');
  console.log('✓ Zi Wei meaning runtime projection matches all four governed JSON authorities.');
}else{
  fs.writeFileSync(OUTPUT,rendered);
  console.log(`Generated ${OUTPUT}.`);
}
