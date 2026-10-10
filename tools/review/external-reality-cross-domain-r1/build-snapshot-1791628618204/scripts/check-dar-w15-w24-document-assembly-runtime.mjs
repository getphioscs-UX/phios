import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assembleDocument } from '../functions/document-assembly/document-assembler.js';
import { resolveClauses } from '../functions/document-assembly/clause-resolver.js';
import { validateDocument } from '../functions/document-assembly/document-validator.js';
import { evaluateHumanReview, DAR_REQUIRED_CONFIRMATIONS } from '../functions/document-assembly/human-review-gate.js';
import { evaluateWillEscalation } from '../functions/legal/will/escalation-gate.js';
import { renderDarHtml } from '../functions/document-assembly/renderers/dar-html-renderer.js';
import { renderDarPdf } from '../functions/document-assembly/renderers/dar-pdf-renderer.js';
import { renderDarDocx } from '../functions/document-assembly/renderers/dar-docx-renderer.js';
import { createDocumentExportVersion } from '../functions/document-assembly/document-version.js';
import { issuePrivateDownloadGrant, authorizePrivateDownload } from '../functions/document-assembly/download-runtime.js';
import { evaluateWillShareIntegrity } from '../functions/legal/will/share-integrity.js';
import { sha256Hex } from '../functions/document-assembly/digest.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const exists = (rel) => fs.existsSync(path.join(root, rel));
const text = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const clone = (v) => JSON.parse(JSON.stringify(v));

const requiredFiles = [
  'content/document-assembly/contracts/document-assembly-ir-contract-v1.json',
  'content/document-assembly/contracts/deterministic-clause-resolver-contract-v1.json',
  'content/document-assembly/contracts/document-validation-contract-v1.json',
  'content/document-assembly/contracts/human-review-surface-contract-v1.json',
  'content/document-assembly/contracts/dar-fdr-consumption-binding-v1.json',
  'content/legal/will/contracts/will-professional-legal-escalation-contract-v1.json',
  'content/document-assembly/contracts/dar-renderer-contract-v1.json',
  'content/document-assembly/contracts/document-version-digest-contract-v1.json',
  'content/document-assembly/contracts/dar-download-runtime-contract-v1.json',
  'content/document-assembly/templates/will-assembly-template-v1.json',
  'content/document-assembly/acceptance/dar-production-acceptance-v1.json',
  'content/document-assembly/freeze/dar-production-freeze-v1.json',
  'content/document-assembly/authority/dar-w15-w24-runtime-manifest-v1.json',
  'content/legal/will/acceptance/will-dar-production-acceptance-v1.json',
  'content/legal/will/freeze/will-dar-production-freeze-v1.json',
  'content/legal/will/clauses/malaysia/README.md',
  'content/document-assembly/fixtures/README.md',
  'docs/DAR-W15-W24-DOCUMENT-ASSEMBLY-RUNTIME.md',
  'functions/document-assembly/canonical-json.js',
  'functions/document-assembly/digest.js',
  'functions/document-assembly/clause-resolver.js',
  'functions/document-assembly/document-assembler.js',
  'functions/document-assembly/document-validator.js',
  'functions/document-assembly/human-review-gate.js',
  'functions/legal/will/escalation-gate.js',
  'functions/document-assembly/renderers/dar-html-renderer.js',
  'functions/document-assembly/renderers/dar-pdf-renderer.js',
  'functions/document-assembly/renderers/dar-docx-renderer.js',
  'functions/document-assembly/document-version.js',
  'functions/document-assembly/download-runtime.js'
];
for (const rel of requiredFiles) assert.ok(exists(rel), `DAR_W15_W24_FILE_MISSING:${rel}`);

const irContract = readJson('content/document-assembly/contracts/document-assembly-ir-contract-v1.json');
assert.equal(irContract.status, 'ACTIVE_CANONICAL_INTERMEDIATE_REPRESENTATION');
assert.equal(irContract.invariants.jsonToWordStringReplaceForbidden, true);
assert.equal(irContract.invariants.rendererClauseSelectionForbidden, true);
assert.deepEqual(irContract.fdrBinding.requiredLineageWhenFdrFactsConsumed, ['fdrRealityId','fdrVersion','fdrDigest']);
assert.equal(irContract.fdrBinding.consentScope, 'WILL_ASSEMBLY');
const fdrBinding = readJson('content/document-assembly/contracts/dar-fdr-consumption-binding-v1.json');
assert.equal(fdrBinding.status, 'ACTIVE_EXPLICIT_VERSIONED_BINDING');
assert.equal(fdrBinding.rules.darMayMutateFdrFact, false);
assert.ok(exists(fdrBinding.upstreamContract), 'DAR_W15_FDR_UPSTREAM_CONTRACT_MISSING');

const resolverContract = readJson('content/document-assembly/contracts/deterministic-clause-resolver-contract-v1.json');
assert.ok(resolverContract.determinismBasis.includes('inputDigest'));
assert.ok(resolverContract.determinismBasis.includes('templateDigest'));
assert.equal(resolverContract.parameterBinding.freeTextGenerationForbidden, true);

const validationContract = readJson('content/document-assembly/contracts/document-validation-contract-v1.json');
for (const check of ['missing field','unresolved placeholder','unknown beneficiary','share mismatch','invalid reference','duplicate clause','illegal clause combination','unsupported jurisdiction']) assert.ok(validationContract.checks.includes(check), `DAR_W17_CHECK_MISSING:${check}`);
assert.equal(validationContract.rules.anyUnresolvedPlaceholderFails, true);

const reviewContract = readJson('content/document-assembly/contracts/human-review-surface-contract-v1.json');
assert.deepEqual(reviewContract.flow, ['FILL','REVIEW_SUMMARY','CLAUSE_PREVIEW','WARNINGS','CONFIRMATION','EXPORT']);
assert.deepEqual(reviewContract.requiredConfirmations.map((x)=>x.confirmationId), DAR_REQUIRED_CONFIRMATIONS);
assert.ok(reviewContract.requiredConfirmations.some((x)=>x.label === 'I understand export ≠ execution'));

const escalationContract = readJson('content/legal/will/contracts/will-professional-legal-escalation-contract-v1.json');
for (const signal of ['UNSUPPORTED_JURISDICTION','CROSS_BORDER_ESTATE','COMPLEX_TRUST','SPECIAL_NEEDS_BENEFICIARY','COMPANY_SUCCESSION','CONFLICTING_OWNERSHIP','LARGE_DIGITAL_ASSET_ARRANGEMENT','CUSTOM_CLAUSE','NON_STANDARD_FAMILY_STRUCTURE']) assert.ok(escalationContract.signals.includes(signal), `DAR_W19_SIGNAL_MISSING:${signal}`);
assert.equal(escalationContract.result.onAnySignal, 'AUTOMATIC_ASSEMBLY_BLOCKED');
assert.equal(escalationContract.result.requiredNextState, 'LEGAL_REVIEW_REQUIRED');

const rendererContract = readJson('content/document-assembly/contracts/dar-renderer-contract-v1.json');
assert.deepEqual(rendererContract.renderers.map((x)=>x.format), ['HTML','PDF','DOCX']);
assert.equal(rendererContract.rules.clauseRegistryAccessForbidden, true);
assert.equal(rendererContract.rules.inputIntakeAccessForbidden, true);
assert.equal(rendererContract.rules.rendererLegalAuthorityForbidden, true);

const versionContract = readJson('content/document-assembly/contracts/document-version-digest-contract-v1.json');
for (const field of ['documentId','assemblyVersion','templateVersion','clauseVersions','inputDigest','outputDigest','createdAt']) assert.ok(versionContract.exportRecordFields.includes(field), `DAR_W21_FIELD_MISSING:${field}`);
assert.equal(versionContract.rules.silentMutationForbidden, true);

const downloadContract = readJson('content/document-assembly/contracts/dar-download-runtime-contract-v1.json');
assert.deepEqual(downloadContract.formats, ['PDF','DOCX']);
assert.equal(downloadContract.defaults.private, true);
assert.equal(downloadContract.defaults.timeLimited, true);
assert.equal(downloadContract.defaults.authenticated, true);
assert.equal(downloadContract.defaults.queryStringTokenForbidden, true);
assert.equal(downloadContract.defaults.publicR2ForbiddenForWill, true);

const clauseRegistry = readJson('content/legal/will/registries/will-clause-registry-v1.json');
const jurisdictionRegistry = readJson('content/legal/will/registries/will-jurisdiction-registry-v1.json');
const productionTemplate = readJson('content/document-assembly/templates/will-assembly-template-v1.json');
const selectionRules = readJson('content/legal/will/registries/will-clause-selection-rules-v1.json');
assert.equal(productionTemplate.productionEnabled, false, 'DAR_W15_REFERENCE_TEMPLATE_PREMATURELY_ENABLED');
assert.equal(clauseRegistry.clauses.filter((x)=>x.approvalStatus === 'APPROVED_TEMPLATE_COMPONENT').length, 0, 'DAR_W24_APPROVED_CLAUSE_COUNT_NOT_ZERO');
assert.equal(jurisdictionRegistry.jurisdictions.filter((x)=>x.status === 'PRODUCTION_APPROVED').length, 0, 'DAR_W24_PRODUCTION_JURISDICTION_COUNT_NOT_ZERO');
assert.equal(/"approvedText"\s*:\s*"/.test(text('content/legal/will/registries/will-clause-registry-v1.json')), false, 'DAR_W24_UNREVIEWED_APPROVED_TEXT_PRESENT');

// Current production authority is deliberately fail-closed: every W23 fixture must remain non-exportable.
const fixtureNames = ['simple-single-beneficiary','married-with-minor-children','multiple-beneficiaries','property','business','residue','digital-assets','missing-executor','invalid-share','unsupported-jurisdiction','custom-clause-required'];
for (const name of fixtureNames) {
  const rel = `content/legal/will/fixtures/${name}.json`;
  assert.ok(exists(rel), `DAR_W23_FIXTURE_MISSING:${name}`);
  const fixture = readJson(rel);
  assert.equal(fixture.testDataOnly, true);
  assert.equal(fixture.containsRealPersonalData, false);
  const share = evaluateWillShareIntegrity({ beneficiaryPersonIds: fixture.input.beneficiaries, residuaryDistribution: fixture.input.residuaryDistribution, distributions: fixture.input.specificGifts });
  assert.equal(share.status, fixture.expected.shareIntegrityStatus, `DAR_W23_SHARE_STATUS:${name}`);
  assert.equal(share.repaired, false, `DAR_W23_SILENT_SHARE_REPAIR:${name}`);
  const escalation = evaluateWillEscalation(fixture.input, jurisdictionRegistry);
  assert.equal(escalation.automaticAssemblyBlocked, true, `DAR_W23_ESCALATION_NOT_BLOCKED:${name}`);
  const ir = assembleDocument({ input: fixture.input, template: productionTemplate, clauseRegistry, selectionRules, jurisdictionRegistry });
  assert.equal(ir.assemblyStatus, 'AUTOMATIC_ASSEMBLY_BLOCKED', `DAR_W23_ASSEMBLY_NOT_BLOCKED:${name}`);
  assert.equal(ir.gates.exportEligible, false, `DAR_W23_EXPORT_ELIGIBLE:${name}`);
  assert.equal(ir.sections.length, 0, `DAR_W23_BLOCKED_IR_HAS_SECTIONS:${name}`);
  const validation = validateDocument({ ir, input: fixture.input, clauseRegistry, jurisdictionRegistry });
  assert.equal(validation.status, 'FAIL', `DAR_W23_VALIDATION_NOT_FAIL:${name}`);
}

// In-memory non-legal test authorities prove deterministic runtime behavior without admitting any production legal clause.
const baseFixture = readJson('content/legal/will/fixtures/simple-single-beneficiary.json').input;
const testInput = clone(baseFixture);
testInput.jurisdiction = 'TEST_JURISDICTION';
testInput.domicile = 'TEST_JURISDICTION';
const testTemplate = { templateVersion:'TEST-TEMPLATE-v1', documentType:'WILL', productionEnabled:true, baseClauseIds:['TEST-CLAUSE-001'], sectionOrder:['TEST-CLAUSE-001'] };
const testRegistry = { registryVersion:'TEST-REGISTRY-v1', clauses:[{ clauseId:'TEST-CLAUSE-001', title:'NON_LEGAL_RUNTIME_TEST_COMPONENT', jurisdiction:'TEST_JURISDICTION', language:'en', version:'1.0.0-test', approvalStatus:'APPROVED_TEMPLATE_COMPONENT', approvedText:'TEST COMPONENT FOR {{field:testator}}', requiredFields:['testator'], incompatibleWith:[], conditions:[], legalReviewer:'TEST_ONLY', approvalDigest:sha256Hex('TEST_ONLY_NON_LEGAL_COMPONENT'), effectiveFrom:'2000-01-01', supersedes:null }] };
const testRules = { registryVersion:'TEST-RULES-v1', rules:[] };
const testJurisdictions = { jurisdictions:[{ jurisdiction:'TEST_JURISDICTION', status:'PRODUCTION_APPROVED' }] };

const resolverA = resolveClauses({ input:testInput, template:testTemplate, clauseRegistry:testRegistry, selectionRules:testRules });
const resolverB = resolveClauses({ input:clone(testInput), template:clone(testTemplate), clauseRegistry:clone(testRegistry), selectionRules:clone(testRules) });
assert.equal(resolverA.status, 'RESOLVED');
assert.deepEqual(resolverA, resolverB, 'DAR_W16_RESOLVER_NON_DETERMINISTIC');
assert.equal(resolverA.sections[0].renderText, `TEST COMPONENT FOR ${testInput.testator}`);

const testEscalation = evaluateWillEscalation(testInput, testJurisdictions);
assert.equal(testEscalation.status, 'CLEAR');
const irA = assembleDocument({ input:testInput, template:testTemplate, clauseRegistry:testRegistry, selectionRules:testRules, jurisdictionRegistry:testJurisdictions });
const irB = assembleDocument({ input:clone(testInput), template:clone(testTemplate), clauseRegistry:clone(testRegistry), selectionRules:clone(testRules), jurisdictionRegistry:clone(testJurisdictions) });
assert.deepEqual(irA, irB, 'DAR_W16_ASSEMBLY_IR_NON_DETERMINISTIC');
assert.equal(irA.assemblyStatus, 'DOCUMENT_CANDIDATE');
assert.equal(irA.sections.length, 1);
assert.ok(!Object.prototype.hasOwnProperty.call(irA, 'createdAt'), 'DAR_W16_TIMESTAMP_IN_DETERMINISTIC_IR');

const fdrLineage = { fdrRealityId:'FDR-TEST', fdrVersion:'v1', fdrDigest:sha256Hex('FDR-TEST'), consentScope:'WILL_ASSEMBLY' };
const irWithLineageA = assembleDocument({ input:testInput, template:testTemplate, clauseRegistry:testRegistry, selectionRules:testRules, jurisdictionRegistry:testJurisdictions, sourceReality:fdrLineage });
const irWithLineageB = assembleDocument({ input:testInput, template:testTemplate, clauseRegistry:testRegistry, selectionRules:testRules, jurisdictionRegistry:testJurisdictions, sourceReality:clone(fdrLineage) });
assert.deepEqual(irWithLineageA, irWithLineageB, 'DAR_W15_FDR_LINEAGE_NON_DETERMINISTIC');
assert.deepEqual(Object.keys(irWithLineageA.sourceReality).sort(), ['consentScope','fdrDigest','fdrRealityId','fdrVersion']);
const badLineage = assembleDocument({ input:testInput, template:testTemplate, clauseRegistry:testRegistry, selectionRules:testRules, jurisdictionRegistry:testJurisdictions, sourceReality:{...fdrLineage, facts:{asset:1}} });
assert.equal(badLineage.assemblyStatus, 'AUTOMATIC_ASSEMBLY_BLOCKED');

const validation = validateDocument({ ir:irA, input:testInput, clauseRegistry:testRegistry, jurisdictionRegistry:testJurisdictions });
assert.equal(validation.status, 'PASS');
assert.equal(validation.repaired, false);
const badPlaceholderIr = clone(irA); badPlaceholderIr.sections[0].renderText = '[Beneficiary]';
assert.ok(validateDocument({ ir:badPlaceholderIr, input:testInput, clauseRegistry:testRegistry, jurisdictionRegistry:testJurisdictions }).issues.some((x)=>x.code === 'UNRESOLVED_PLACEHOLDER'));
assert.throws(()=>renderDarHtml(badPlaceholderIr), /UNRESOLVED_PLACEHOLDER/);
const duplicateIr = clone(irA); duplicateIr.sections.push(clone(duplicateIr.sections[0]));
assert.ok(validateDocument({ ir:duplicateIr, input:testInput, clauseRegistry:testRegistry, jurisdictionRegistry:testJurisdictions }).issues.some((x)=>x.code === 'DUPLICATE_CLAUSE'));
const unknownBeneficiaryInput = clone(testInput); unknownBeneficiaryInput.residuaryDistribution = [{beneficiaryPersonId:'P_UNKNOWN', percentage:100}];
assert.ok(validateDocument({ ir:irA, input:unknownBeneficiaryInput, clauseRegistry:testRegistry, jurisdictionRegistry:testJurisdictions }).issues.some((x)=>x.code.includes('UNRESOLVED_BENEFICIARY')));

const incompleteReview = evaluateHumanReview({ ir:irA, validation, escalation:testEscalation, confirmations:{REVIEWED_NAMES:true} });
assert.equal(incompleteReview.status, 'CUSTOMER_REVIEW_INCOMPLETE');
const allConfirmations = Object.fromEntries(DAR_REQUIRED_CONFIRMATIONS.map((id)=>[id,true]));
const exportAuthorization = evaluateHumanReview({ ir:irA, validation, escalation:testEscalation, confirmations:allConfirmations });
assert.equal(exportAuthorization.status, 'APPROVED_FOR_EXPORT');
assert.equal(exportAuthorization.exportEqualsExecution, false);

const htmlA = renderDarHtml(irA), htmlB = renderDarHtml(clone(irA));
const pdfA = renderDarPdf(irA), pdfB = renderDarPdf(clone(irA));
const docxA = renderDarDocx(irA), docxB = renderDarDocx(clone(irA));
assert.equal(htmlA, htmlB, 'DAR_W20_HTML_NON_DETERMINISTIC');
assert.deepEqual(pdfA, pdfB, 'DAR_W20_PDF_NON_DETERMINISTIC');
assert.deepEqual(docxA, docxB, 'DAR_W20_DOCX_NON_DETERMINISTIC');
assert.equal(pdfA.subarray(0,8).toString('latin1'), '%PDF-1.4');
assert.equal(docxA.subarray(0,4).toString('hex'), '504b0304');
assert.ok(htmlA.includes('data-dar-assembly-digest'));

const first = createDocumentExportVersion({ documentId:'DAR-TEST-DOC', ir:irA, format:'PDF', artifactBytes:pdfA, exportAuthorization, createdAt:'2026-08-22T08:00:00.000Z' });
assert.equal(first.action, 'CREATE_NEW_VERSION');
assert.equal(first.version.versionNumber, 1);
assert.equal(first.version.legallyExecuted, false);
assert.equal(first.version.outputDigest, sha256Hex(pdfA));
const repeat = createDocumentExportVersion({ documentId:'DAR-TEST-DOC', ir:irA, format:'PDF', artifactBytes:pdfA, exportAuthorization, createdAt:'2026-08-22T08:01:00.000Z', previousVersion:first.version });
assert.equal(repeat.action, 'REUSE_EXISTING_VERSION');
assert.deepEqual(repeat.version, first.version, 'DAR_W21_SAME_DIGEST_MUTATED_VERSION');

const changedInput = clone(testInput); changedInput.domicile = 'TEST_JURISDICTION-CHANGED';
const changedIr = assembleDocument({ input:changedInput, template:testTemplate, clauseRegistry:testRegistry, selectionRules:testRules, jurisdictionRegistry:testJurisdictions });
const changedValidation = validateDocument({ ir:changedIr, input:changedInput, clauseRegistry:testRegistry, jurisdictionRegistry:testJurisdictions });
assert.equal(changedValidation.status, 'PASS');
const changedAuth = evaluateHumanReview({ ir:changedIr, validation:changedValidation, escalation:evaluateWillEscalation(changedInput,testJurisdictions), confirmations:allConfirmations });
const changedPdf = renderDarPdf(changedIr);
const second = createDocumentExportVersion({ documentId:'DAR-TEST-DOC', ir:changedIr, format:'PDF', artifactBytes:changedPdf, exportAuthorization:changedAuth, createdAt:'2026-08-22T08:02:00.000Z', previousVersion:first.version });
assert.equal(second.action, 'CREATE_NEW_VERSION');
assert.equal(second.version.versionNumber, 2);
assert.notEqual(second.version.inputDigest, first.version.inputDigest);
assert.equal(second.version.previousVersionId, first.version.versionId);

const secret='DAR-TEST-SECRET-0123456789-ABCDEFG';
const grant=issuePrivateDownloadGrant({exportVersion:first.version,subjectId:'ACCOUNT-SUBJECT-TEST',now:'2026-08-22T08:00:00.000Z',expiresAt:'2026-08-22T08:30:00.000Z',secret});
assert.equal(grant.queryStringAllowed,false);
assert.equal(grant.headers['Cache-Control'],'private, no-store');
const auth=authorizePrivateDownload({token:grant.token,subjectId:'ACCOUNT-SUBJECT-TEST',now:'2026-08-22T08:10:00.000Z',secret});
assert.equal(auth.authorized,true);
assert.equal(authorizePrivateDownload({token:grant.token,subjectId:'WRONG-SUBJECT',now:'2026-08-22T08:10:00.000Z',secret}).authorized,false);
assert.equal(authorizePrivateDownload({token:grant.token,subjectId:'ACCOUNT-SUBJECT-TEST',now:'2026-08-22T08:31:00.000Z',secret}).authorized,false);
const tokenPayload=JSON.parse(Buffer.from(grant.token.split('.')[0],'base64url').toString('utf8'));
assert.deepEqual(Object.keys(tokenPayload).sort(), ['documentId','documentVersion','expiresAt','format','outputDigest','subjectDigest','v']);
assert.equal(JSON.stringify(tokenPayload).includes('Fixture'),false,'DAR_W22_TOKEN_PII_LEAKAGE');

const acceptance=readJson('content/document-assembly/acceptance/dar-production-acceptance-v1.json');
assert.equal(acceptance.status,'DAR_RUNTIME_COMPLETE_FAIL_CLOSED_NO_WILL_PRODUCTION_JURISDICTION_YET');
assert.deepEqual(acceptance.completedWork,Array.from({length:25},(_,i)=>`DAR-W${i}`));
assert.deepEqual(acceptance.proofs,{ aiGeneratedLegalClauseCount:0, unresolvedPlaceholderExportCount:0, silentShareRepairCount:0, unsupportedJurisdictionExportCount:0, exportEqualsExecutionClaimCount:0, rendererAuthorityCount:0, privacyLeakageCount:0, approvedLegalClauseCount:0, productionJurisdictionCount:0 });
const freeze=readJson('content/document-assembly/freeze/dar-production-freeze-v1.json');
assert.equal(freeze.finalChecker,'npm run check:dar');
assert.equal(freeze.mutationPolicy.silentMutationForbidden,true);
const manifest=readJson('content/document-assembly/authority/dar-w15-w24-runtime-manifest-v1.json');
assert.deepEqual(manifest.implementedWork,Array.from({length:10},(_,i)=>`DAR-W${i+15}`));
assert.equal(manifest.productionState.willExportEnabled,false);

const packageJson=readJson('package.json');
assert.equal(packageJson.scripts?.['check:dar-w0-w14'],'node scripts/check-dar-w0-w14-document-assembly-foundation.mjs');
assert.equal(packageJson.scripts?.['check:dar-w15-w24'],'node scripts/check-dar-w15-w24-document-assembly-runtime.mjs');
assert.equal(packageJson.scripts?.['check:dar'],'npm run check:dar-w0-w14 && npm run check:dar-w15-w24');

console.log('✓ DAR-W15–W24 deterministic Document Assembly Runtime passed.');
console.log('  Assembly IR is canonical; clause resolution, validation, human review, escalation, renderers, versioning and private downloads are fail-closed.');
console.log('  11/11 Will fixtures remain non-exportable under current authority; 0 production-approved jurisdictions and 0 approved legal clauses.');
console.log('  HTML/PDF/DOCX renderers consume Assembly IR only; export ≠ execution; no silent share repair or query-string PII token path exists.');
