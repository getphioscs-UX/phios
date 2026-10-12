import fs from 'node:fs';
import crypto from 'node:crypto';
const successor=fs.existsSync('content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v10.json')?'content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v10.json':'content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v9.json';
const candidateOverride=process.env.PHIOS_MANUSCRIPT_BUILD_REGISTRY;
if(candidateOverride&&!/^content\/knowledge\/source-access\/registries\/manuscript-knowledge-source-registry-v\d+-candidate\.json$/.test(candidateOverride))throw Error('INVALID_LOCAL_CANDIDATE_REGISTRY');
const registry=candidateOverride||(fs.existsSync(successor)&&JSON.parse(fs.readFileSync(successor)).productionActivated===true?successor:'content/knowledge/source-access/registries/manuscript-knowledge-source-registry-v7.json');
const records=JSON.parse(fs.readFileSync(registry)).records;
const reviewedRegistry='content/knowledge/source-access/registries/manuscript-reviewed-corpus-registry-v1.json';
const reviewed=JSON.parse(fs.readFileSync(reviewedRegistry));
const admissionOwner='tools/review/free-ask-manuscript-r1/whole-chapter-batch-r1/CHAPTER-CURRENT-CLOSURE.json';
const paths=[...new Set([registry,reviewedRegistry,reviewed.humanReviewResolution,admissionOwner,...records.flatMap(r=>[r.sourceAcceptancePath,r.acceptancePath,r.scopeAdmissionPath,r.sourceIdentityPath]).filter(Boolean)])];
const raw=Object.fromEntries(paths.map(p=>[p,fs.readFileSync(p,'utf8')]));
raw.ACTIVE_MANUSCRIPT_SOURCE_REGISTRY=registry;
// Only bounded registry/acceptance metadata is bundled; no manuscript body.
for(const p of paths)if(!/^content\/knowledge\/(?:source-access\/registries|manuscripts\/review)\//.test(p)&&p!==reviewed.humanReviewResolution&&p!==admissionOwner)throw Error('NON_METADATA_BUNDLE_INPUT');
fs.writeFileSync('functions/knowledge-runtime/current-manuscript-server-metadata.js','// Generated bounded source identity metadata. Private corpus remains in MANUSCRIPTS R2.\nexport const manuscriptMetadataRaw = '+JSON.stringify(raw)+';\n');
fs.writeFileSync('tools/review/free-ask-manuscript-r1/CURRENT-IV-VI-SERVER-METADATA-IDENTITY.json',JSON.stringify({storage:'WORKER_BUNDLED_METADATA_PRIVATE_R2_CORPUS',inputs:paths.map(path=>({path,sha256:crypto.createHash('sha256').update(raw[path]).digest('hex')})),privateProseBundled:false,providerCalls:0},null,2)+'\n');
