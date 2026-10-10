import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {normalizeMarketProviderPayload} from './lib/civilization-atlas/runtime-position-w8a-p2-market-provider-v1.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const write=(rel,v)=>fs.writeFileSync(path.join(root,rel),JSON.stringify(v,null,2)+'\n');
const registry=read('content/civilization-atlas/reconfiguration/market-data-provider-registry-v1.json');
const intake=read('content/civilization-atlas/reconfiguration/market-provider-intake-v1.json');
const records=[],rejected=[];
for(const payload of intake.payloads||[]){
  const out=normalizeMarketProviderPayload({payload,registry});
  if(out.record)records.push(out.record); else rejected.push(out.rejected);
}
write('content/civilization-atlas/reconfiguration/market-provider-snapshots-v1.json',{schemaVersion:'PHI-OS-MARKET-PROVIDER-SNAPSHOTS-v1.0.0',version:'1.0.0',status:records.length?'PROVIDER_SNAPSHOTS_NORMALIZED':'IDLE_NO_PROVIDER_PAYLOADS',work:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8A-P2',records,rejected});
write('content/civilization-atlas/reconfiguration/runtime-position-w8a-p2-status-v1.json',{schemaVersion:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8A-P2-STATUS-v1.0.0',version:'1.0.0',status:records.length?'PROVIDER_PAYLOADS_NORMALIZED__W8B_HANDOFF_REQUIRED':'PROVIDER_EXPANSION_ACTIVE__MOOMOO_REGISTERED_AUTH_REQUIRED',work:'PHI-OS-48-RUNTIME-POSITION-BACKBONE-R1-W8A-P2',completed:{registeredProviders:(registry.providers||[]).length,moomooRegistered:Boolean((registry.providers||[]).find(x=>x.providerId==='MOOMOO_OPENAPI')),liveProviderInvoked:false,providerPayloads:(intake.payloads||[]).length,normalizedSnapshots:records.length,providerClaimsGenerated:0,cwaEvidenceGenerated:0,w8eBasisPromoted:0},next:records.length?'Create W8B source-bounded claims from normalized snapshots; do not bypass CWA.':'Configure runtime-only Moomoo authorization and import one governed market-data payload.',reviewHtml:'tools/review/PHI-OS-48-RUNTIME-POSITION-W8A-P2-MARKET-DATA-PROVIDER.html'});
console.log('PASS W8A-P2 market provider build: providers='+(registry.providers||[]).length+', payloads='+(intake.payloads||[]).length+', normalized='+records.length+', claims=0, evidence=0, W8E-promotions=0.');
