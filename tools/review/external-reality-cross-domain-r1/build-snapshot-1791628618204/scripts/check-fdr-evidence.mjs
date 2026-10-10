import assert from 'node:assert/strict';
import {base, readJson, getFixtures, walkFacts} from './fdr-check-lib.mjs';
const c=readJson(`${base}/contracts/financial-fact-evidence-contract-v1.json`); const docs=readJson(`${base}/contracts/financial-document-evidence-contract-v1.json`); const adapter=readJson(`${base}/contracts/financial-intake-adapter-contract-v1.json`);
assert.equal(c.rules.eachFinancialFactCarriesEvidenceState,true); assert.equal(c.rules.aiExtractionIsNotVerificationByItself,true); assert.equal(c.rules.evidenceTravelsWithEachAtomicFact,true);
assert.equal(docs.rules.extractionMayCreateAuthority,false); assert.equal(docs.rules.willDocumentDoesNotGrantWillValidity,true); assert.equal(adapter.rules.documentExtractionEqualsVerification,false);
let facts=0, extractedFixture=false;
for(const {data} of getFixtures()){
 if(data.sourceAdapter==='DOCUMENT_EXTRACTION') extractedFixture=true;
 for(const s of data.snapshots) walkFacts(s.snapshotPayload,(f)=>{facts++; for(const k of c.requiredFields) assert.ok(Object.hasOwn(f.evidence,k),`Fact ${f.factId} missing evidence ${k}`); if(f.disclosureState==='DOCUMENT_VERIFIED') assert.ok(['DOCUMENT','EXTERNAL_REFERENCE'].includes(f.evidence.evidenceType));});
}
assert.ok(facts>0); assert.equal(extractedFixture,true);
console.log(`✓ FDR evidence passed: ${facts} fixture atomic facts carry evidence; extraction never self-promotes to verification or legal validity.`);
