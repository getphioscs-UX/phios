import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'content/civilization-atlas/reconfiguration/moomoo-first-data-package-requests-v1.json'),'utf8'));
const out=process.argv[2];
if(!out){
  console.error('Usage: node scripts/prepare-moomoo-first-data-package.mjs <output-json-path>');
  process.exit(2);
}
const skeleton={
  schemaVersion:'PHI-OS-MOOMOO-FIRST-DATA-PACKAGE-COLLECTION-v1.0.0',
  version:'1.0.0',
  status:'AWAITING_AUTHORIZED_RETRIEVAL',
  providerId:manifest.providerId,
  requestManifestVersion:manifest.version,
  generatedAt:new Date().toISOString(),
  requests:manifest.requests.map(r=>({
    requestId:r.requestId,
    capability:r.capability,
    instruments:r.instruments,
    parameters:r.parameters,
    gapTargets:r.gapTargets,
    retrievalState:'NOT_RUN',
    payloadFiles:[]
  })),
  boundaries:{containsSecrets:false,containsAccountData:false,isEvidence:false}
};
fs.writeFileSync(path.resolve(root,out),JSON.stringify(skeleton,null,2)+'\n');
console.log('Prepared Moomoo first data package collection plan at '+out+'. No live provider call was made.');
