import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const j=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),'utf8'));
const src=j('content/health/health-reflective/sources/health-reflective-source-registry-v1.json');
const sym=j('content/health/health-reflective/symptoms/health-reflective-symptom-registry-v1.json');
const body=j('content/health/health-reflective/body-areas/health-reflective-body-area-registry-v1.json');
const acc=j('content/health/health-reflective/acceptance/health-reflective-perspective-acceptance-v1.json');
const clinicalSource=j('content/health/health-knowledge/authority/health-k1-source-registry-v1.json');
const reflectiveIds=new Set(src.sources.map(x=>x.sourceId));
assert.ok([...reflectiveIds].every(id=>!clinicalSource.sources.some(s=>s.sourceId===id)),'HRP_SOURCE_ADMITTED_AS_CLINICAL_SOURCE');
for(const entry of [...sym.entries,...body.entries]){assert.ok(reflectiveIds.has(entry.sourceId));assert.equal(entry.medicalAuthority,false);assert.equal(entry.causalityAllowed,false);if(entry.pastLifeLanguagePresent)assert.equal(entry.pastLifeAttributionRequired,true);}
for(const field of ['diagnosisAllowed','medicalCausalityAllowed','urgencyRoutingAuthority','labInterpretationAllowed','medicationDecisionAllowed','prognosisAllowed'])assert.equal(acc.productionBoundary[field],false,`HRP_FIREWALL_${field}_DRIFT`);
assert.equal(acc.productionBoundary.reflectiveOutputOptional,true);assert.equal(acc.productionBoundary.userOptInRequired,true);
const runtimeFiles=['functions/health/health-reflective-resolver.js','functions/health/health-reflective-question-generator.js','functions/health/health-reflective-composer.js'];
for(const f of runtimeFiles){const t=fs.readFileSync(path.join(ROOT,f),'utf8');assert.equal(/diagnos(e|is)\s*=\s*true/i.test(t),false);assert.equal(/causalityAllowed\s*:\s*true/i.test(t),false);}
console.log('✓ HRP hard firewall passed: reflective source cannot enter clinical authority or control urgency, diagnosis, labs, medication, prognosis or medical causality.');
