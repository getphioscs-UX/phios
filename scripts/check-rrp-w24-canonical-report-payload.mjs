import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRuntimeReadingReportCandidate, verifyRuntimeReadingReportCandidate, RRPValidationError } from '../functions/runtime-reading/report-candidate-runtime.js';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const B='content/products/runtime-reading';
const candidate=j(`${B}/contracts/runtime-reading-report-candidate-contract-v1.json`);
const section=j(`${B}/contracts/runtime-reading-section-payload-contract-v1.json`);
const statement=j(`${B}/contracts/runtime-reading-statement-contract-v1.json`);
const provenance=j(`${B}/contracts/runtime-reading-report-provenance-contract-v1.json`);
const registry=j(`${B}/registries/runtime-reading-section-registry-v1.json`);
const f01=j(`${B}/fixtures/cases/F01/input.json`);
const f11=j(`${B}/fixtures/cases/F11/input.json`);

for (const d of [candidate,section,statement,provenance]) assert.ok(d.baselineCommit.startsWith('f010b29'));
assert.equal(candidate.canonicalType,'RuntimeReadingReportCandidate');
assert.equal(candidate.productCode,'RRP');
assert.equal(candidate.terminalRrpState,'CANDIDATE');
assert.equal(candidate.downstreamAuthority,'RR');
assert.equal(candidate.localeIntent.renderedLocaleAuthority,'CPR-CUST');
assert.equal(candidate.localeIntent.localeIntentEqualsRenderedLocale,false);
for (const f of ['reportCandidateId','productCode','productVersion','caseReference','customerReference','inputBundleReference','generatedAt','localeIntent','selectedMethods','sections','unknowns','contradictions','limitations','sourceAuthorities','professionalCompletionRequired','professionalCompletionReasons','candidateDigest']) assert.ok(candidate.requiredFields.includes(f),`missing candidate field ${f}`);
for (const f of ['releaseId','customerVisible','workspaceProjection','PDFProjection','pageNumber','pageBreak','fontSize']) assert.ok(candidate.forbiddenFields.includes(f),`missing forbidden field ${f}`);

assert.equal(section.canonicalType,'RuntimeReadingSectionPayload');
assert.equal(section.requiredFields.length,15);
assert.equal(registry.sections.length,25);
for (const f of ['statements','unknowns','contradictions','limitations','sourceReferences','meaningReferences','interpretationReferences','professionalReferences','visualSemanticReferences']) assert.ok(section.requiredFields.includes(f));
for (const f of ['pageNumber','pageBreak','mobileLayout','position','width','height','style']) assert.ok(section.forbiddenFields.includes(f));

assert.equal(statement.canonicalType,'RuntimeReadingStatement');
assert.deepEqual(statement.allowedStatementTypes,['CALCULATED_FACT','USER_REPORTED_FACT','CANONICAL_MEANING','SYSTEM_INTERPRETATION','PROFESSIONAL_JUDGMENT','NAVIGATION_OPTION','UNKNOWN','BOUNDARY']);
assert.equal(statement.typeRules.PROFESSIONAL_JUDGMENT.prAuthorityRequired,true);
assert.equal(statement.typeRules.SYSTEM_INTERPRETATION.meaningReferencesRequired,true);
assert.equal(statement.rules.everyStatementHasSource,true);
assert.equal(statement.rules.llmMayInventSource,false);

assert.deepEqual(provenance.traceChain,['REPORT_STATEMENT','INTERPRETATION','MEANING','PROJECTION','CALCULATION_OR_REALITY_INPUT']);
for (const f of ['sourceRuntime','sourceCapability','sourceVersion','sourceArtifact','sourceDigest','caseReference','evidenceMaturity']) assert.ok(provenance.minimumSourceRecordFields.includes(f));
assert.equal(provenance.rules.evidenceMaturityIsReadFromMRMSNotSelfAssigned,true);
assert.equal(provenance.rules.missingLinkFailsClosed,true);

const c1=await createRuntimeReadingReportCandidate(f01);
assert.equal(c1.productCode,'RRP');
assert.ok(c1.candidateDigest.startsWith('sha256:'));
assert.equal(await verifyRuntimeReadingReportCandidate(c1),true);
assert.ok(c1.unknowns.length>0,'Unknown must remain first-class in candidate payload.');

const c11=await createRuntimeReadingReportCandidate(f11);
const pj=c11.sections.flatMap(s=>s.statements).find(s=>s.statementType==='PROFESSIONAL_JUDGMENT');
assert.ok(pj);
assert.ok(pj.professionalReferences.every(x=>x.startsWith('PR:')));
assert.ok(pj.professionalAuthorship.signatureReference.startsWith('PR:'));

const bad=structuredClone(f01);
bad.candidateDraft.sections[0].statements.push({statementId:'BAD-INT',statementType:'SYSTEM_INTERPRETATION',semanticCode:'BAD',contentCanonical:'bad',sourceType:'INTERPRETATION',sourceReferences:['MIR:BAD'],evidenceLevel:'UNSUPPORTED',confidenceState:'UNKNOWN',unknownState:'NONE',limitationReferences:[],professionalAuthorship:null,interpretationReferences:['MIR:BAD']});
let caught=null; try { await createRuntimeReadingReportCandidate(bad); } catch(e){ caught=e; }
assert.ok(caught instanceof RRPValidationError || caught instanceof TypeError);
assert.equal(caught.code,'MEANING_AUTHORITY_REQUIRED');

const leak=structuredClone(f01); leak.candidateDraft.releaseId='REL-FAKE';
let leakErr=null; try { await createRuntimeReadingReportCandidate(leak); } catch(e){ leakErr=e; }
assert.equal(leakErr?.code,'RELEASE_AUTHORITY_LEAKAGE');

console.log('✓ RRP-W24 canonical report payload passed.');
console.log('  RuntimeReadingReportCandidate is source-traceable, Unknown-preserving, PR-attributed where applicable, and owns neither release nor presentation/layout authority.');
