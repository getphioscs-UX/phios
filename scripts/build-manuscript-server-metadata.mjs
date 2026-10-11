import fs from 'node:fs';
import crypto from 'node:crypto';
const registry='content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v7.json';
const records=JSON.parse(fs.readFileSync(registry)).records;
const reviewedRegistry='content/knowledge/source-access/registries/manuscript-reviewed-corpus-registry-v1.json';
const reviewed=JSON.parse(fs.readFileSync(reviewedRegistry));
const paths=[...new Set([registry,reviewedRegistry,reviewed.humanReviewResolution,...records.flatMap(r=>[r.sourceAcceptancePath,r.acceptancePath,r.scopeAdmissionPath]).filter(Boolean)])];
const raw=Object.fromEntries(paths.map(p=>[p,fs.readFileSync(p,'utf8')]));
raw.ACTIVE_MANUSCRIPT_SOURCE_REGISTRY=registry;
// Only bounded registry/acceptance metadata is bundled; no manuscript body.
for(const p of paths)if(!/^content\/knowledge\/(?:source-access\/registries|manuscripts\/review)\//.test(p)&&p!==reviewed.humanReviewResolution)throw Error('NON_METADATA_BUNDLE_INPUT');
fs.writeFileSync('functions/knowledge-runtime/current-manuscript-server-metadata.js','// Generated bounded source identity metadata. Private corpus remains in MANUSCRIPTS R2.\nexport const manuscriptMetadataRaw = '+JSON.stringify(raw)+';\n');
fs.writeFileSync('tools/review/free-ask-manuscript-r1/CURRENT-IV-VI-SERVER-METADATA-IDENTITY.json',JSON.stringify({storage:'WORKER_BUNDLED_METADATA_PRIVATE_R2_CORPUS',inputs:paths.map(path=>({path,sha256:crypto.createHash('sha256').update(raw[path]).digest('hex')})),privateProseBundled:false,providerCalls:0},null,2)+'\n');
