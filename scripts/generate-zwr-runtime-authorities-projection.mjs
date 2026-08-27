import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';

const SOURCES=Object.freeze({
  productionActivation:'content/professional/method-production-activation/successors/mpa-zwr-production-activation-successor-v1.json',
  calculationPolicy:'content/professional/core-method-runtime/zi-wei-calculation-policy-v1.json',
  internalCalculationActivation:'content/zi-wei-runtime/successors/zwr-w7-w13-internal-calculation-activation-v1.json'
});
const OUTPUT='functions/zi-wei-runtime/zi-wei-runtime-authorities.generated.js';
const bytes=path=>fs.readFileSync(path);
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
const authorities=Object.fromEntries(Object.entries(SOURCES).map(([key,path])=>[key,JSON.parse(bytes(path).toString('utf8'))]));
const digests=Object.fromEntries(Object.entries(SOURCES).map(([key,path])=>[key,{sourceRef:path,sha256:digest(bytes(path))}]));
const rendered=`// Generated runtime projection of governed Zi Wei calculation and dispatch JSON authorities. Do not edit by hand.\nconst deepFreeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const item of Object.values(value))deepFreeze(item)}return value};\nexport const ZWR_RUNTIME_AUTHORITY_DIGESTS=deepFreeze(${JSON.stringify(digests)});\nexport const ZWR_RUNTIME_AUTHORITIES=deepFreeze(${JSON.stringify(authorities)});\nexport default ZWR_RUNTIME_AUTHORITIES;\n`;

if(process.argv.includes('--check')){
  assert.equal(fs.existsSync(OUTPUT),true,'ZWR_RUNTIME_AUTHORITY_PROJECTION_MISSING');
  assert.equal(fs.readFileSync(OUTPUT,'utf8'),rendered,'ZWR_RUNTIME_AUTHORITY_PROJECTION_DRIFT');
  console.log('✓ Zi Wei runtime projection matches all three governed calculation and dispatch JSON authorities.');
}else{
  fs.writeFileSync(OUTPUT,rendered);
  console.log(`Generated ${OUTPUT}.`);
}
