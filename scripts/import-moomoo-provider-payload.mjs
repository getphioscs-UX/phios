import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateMarketProviderPayload} from './lib/civilization-atlas/runtime-position-w8a-p2-market-provider-v1.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=process.argv[2];
if(!source){console.error('Usage: node scripts/import-moomoo-provider-payload.mjs <payload-json>');process.exit(2);}
const abs=path.resolve(root,source);
const incoming=JSON.parse(fs.readFileSync(abs,'utf8'));
const registry=JSON.parse(fs.readFileSync(path.join(root,'content/civilization-atlas/reconfiguration/market-data-provider-registry-v1.json'),'utf8'));
const intakePath=path.join(root,'content/civilization-atlas/reconfiguration/market-provider-intake-v1.json');
const intake=JSON.parse(fs.readFileSync(intakePath,'utf8'));
const payloads=Array.isArray(incoming?.payloads)?incoming.payloads:[incoming];
const ids=new Set((intake.payloads||[]).map(x=>x.payloadId));
for(const payload of payloads){
  if(ids.has(payload?.payloadId))throw new Error('MOOMOO_IMPORT_DUPLICATE_PAYLOAD_ID:'+payload.payloadId);
  const check=validateMarketProviderPayload({payload,registry});
  if(!check.ok)throw new Error('MOOMOO_IMPORT_REJECTED:'+check.reasons.join('|'));
  ids.add(payload.payloadId);
  intake.payloads.push(payload);
}
intake.status=intake.payloads.length?'PROVIDER_PAYLOADS_IMPORTED_NOT_NORMALIZED':'READY_NO_PROVIDER_PAYLOADS';
fs.writeFileSync(intakePath,JSON.stringify(intake,null,2)+'\n');
console.log('Imported '+payloads.length+' governed Moomoo payload(s) into W8A-P2 intake. Run npm run build:runtime-position-48:w8a:p2 next.');
