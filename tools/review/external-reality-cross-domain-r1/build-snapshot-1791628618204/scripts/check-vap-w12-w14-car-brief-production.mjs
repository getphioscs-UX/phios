import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildProductionBrief, digest, exportChatGptBrief, normalizeProductionKind, readJson, resolveBriefByCode, validateBriefSchema, validateProductionBrief } from './lib/car-production/car-production-v1.mjs';

const root=process.cwd();
const pilotCode='CAB-KN-PREFACE-001-MECHANISM-ZH-HANS-002';
const a=buildProductionBrief({root,nodeCode:'KN-PREFACE-001',type:'mechanism_diagram',locale:'zh-Hans'});
const b=buildProductionBrief({root,nodeCode:'KN-PREFACE-001',type:'mechanism_diagram',locale:'zh-Hans'});
assert.deepEqual(a.brief,b.brief); assert.equal(a.brief.assetType,'DIAGRAM'); assert.equal(a.kind.chatgptAsset,'MECHANISM_DIAGRAM'); assert.equal(a.meaningMode,'cm_knowledge_production_authority');
validateBriefSchema(root,a.brief); const validation=validateProductionBrief({root,brief:a.brief}); assert.equal(validation.valid,true); assert.deepEqual(Object.values(validation.checks),Array(Object.keys(validation.checks).length).fill(true));
assert.equal(a.brief.briefDigest,b.brief.briefDigest); assert.equal(a.brief.outputContract.candidateOnly,true); assert.equal(a.brief.outputContract.publicationAllowed,false); assert.equal(a.brief.factualBoundary.newClaimsAllowed,false); assert(a.brief.mustEstablish.every(x=>typeof x==='string'&&x.length>0));
assert.throws(()=>buildProductionBrief({root,nodeCode:'KN-PREFACE-001',type:'unknown',locale:'zh-Hans'}),/CAR_PRODUCTION_ASSET_TYPE_ALIAS_UNSUPPORTED/);
assert.throws(()=>buildProductionBrief({root,nodeCode:'KN-NOT-REGISTERED-999',type:'mechanism_diagram',locale:'zh-Hans'}),/CAR_PRODUCTION_NODE_NOT_REGISTERED/);
const hero=buildProductionBrief({root,nodeCode:'KN-PREFACE-001',type:'hero_illustration',locale:'zh-Hans'}); assert.equal(hero.brief.assetType,'FIGURE'); assert.equal(hero.kind.chatgptAsset,'HERO_ILLUSTRATION'); validateProductionBrief({root,brief:hero.brief});
const {brief:stored}=resolveBriefByCode(root,pilotCode); assert.deepEqual(stored,a.brief); const freeze=readJson(root,`content/production/car/freezes/${pilotCode}.freeze.json`); assert.equal(freeze.frozen,true); assert.equal(freeze.briefDigest,stored.briefDigest); assert.equal(freeze.publicationAuthorityCreated,false);
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'phios-car-chatgpt-')); const exported=await exportChatGptBrief({root,briefCode:pilotCode,outputRoot:path.relative(root,tmp)}); const md=fs.readFileSync(path.join(tmp,pilotCode,'chatgpt-figure-brief.md'),'utf8'); const intake=JSON.parse(fs.readFileSync(path.join(tmp,pilotCode,'intake-contract.json'),'utf8'));
for(const text of ['PHI OS Canonical Asset Production','Asset:\nMECHANISM_DIAGRAM','Knowledge Authority:','Meaning Authority:','The visual must establish:','Must include:','Must not include:','Factual boundaries:','Visual contract:','PDS constraints:','Accessibility:','candidate image only','no publication authority','do not invent missing content']) assert(md.includes(text),text);
assert.equal(intake.providerLineage.mode,'external_manual'); assert.equal(intake.providerLineage.providerCode,'OPENAI_CHATGPT'); assert.deepEqual(intake.allowedExtensions,['.webp','.avif','.svg']); assert.equal(intake.briefDigest,stored.briefDigest); assert.equal(exported.intake.chatgptBriefDigest,intake.chatgptBriefDigest);
const candidateRegistry=readJson(root,'content/production/car/registries/asset-candidate-production-registry-v1.json'); const publishedRegistry=readJson(root,'content/production/car/registries/published-asset-production-registry-v1.json');
for (const entry of candidateRegistry.candidates.filter(x=>x.briefCode===pilotCode)) { const candidate=readJson(root,entry.path); assert.equal(candidate.assetBriefDigest,stored.briefDigest); assert.equal(candidate.providerLineage.mode,'external_manual'); assert.equal(candidate.providerLineage.providerCode,'OPENAI_CHATGPT'); }
for (const entry of publishedRegistry.publications) { const published=readJson(root,entry.path); assert.equal(published.publicationState,'published'); assert.equal(published.surface,'WEBSITE'); }
assert.equal(stored.outputContract.candidateOnly,true); assert.equal(stored.outputContract.publicationAllowed,false);
console.log('✓ VAP-W12 CAR Production Brief Builder passed with the existing Canonical Asset Brief schema.');
console.log('✓ VAP-W13 revalidates Meaning, Knowledge, Published Coverage, Locale, registered CAR asset type, PDS, source digests, unsupported-claim boundary and briefDigest freeze.');
console.log('✓ VAP-W14 exports a ChatGPT Production Brief + intake contract without transferring Meaning, Knowledge, Approval or Publication authority.');
console.log(`✓ Pilot ${pilotCode} is deterministic, validated_frozen and ready for external-manual ChatGPT candidate generation.`);
