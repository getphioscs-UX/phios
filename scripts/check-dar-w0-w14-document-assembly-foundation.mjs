import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { evaluateWillShareIntegrity } from '../functions/legal/will/share-integrity.js';

const ROOT = process.cwd();
const BASELINE = '812d7c820318be5bc4376888f15447a5cf05fb88';
const rel = (...parts) => path.join(ROOT, ...parts);
const exists = p => fs.existsSync(rel(p));
const readJson = p => JSON.parse(fs.readFileSync(rel(p), 'utf8'));
const text = p => fs.readFileSync(rel(p), 'utf8');

const paths = {
  w0:'content/document-assembly/authority/dar-authority-baseline-v1.json',
  w1:'content/document-assembly/registries/document-type-registry-v1.json',
  w2:'content/document-assembly/contracts/document-lifecycle-contract-v1.json',
  w3:'content/document-assembly/contracts/dar-field-contract-v1.json',
  person:'content/document-assembly/contracts/person-role-contract-v1.json',
  willSchema:'content/legal/will/schemas/will-intake-v1.schema.json',
  assets:'content/legal/will/registries/will-asset-type-registry-v1.json',
  distribution:'content/legal/will/contracts/will-distribution-contract-v1.json',
  shareContract:'content/legal/will/contracts/will-share-integrity-contract-v1.json',
  clauses:'content/legal/will/registries/will-clause-registry-v1.json',
  reference:'content/legal/will/templates/full-will-reference-decomposition-v1.json',
  selection:'content/legal/will/registries/will-clause-selection-rules-v1.json',
  jurisdictions:'content/legal/will/registries/will-jurisdiction-registry-v1.json',
  jurisdictionEligibility:'content/legal/will/contracts/will-jurisdiction-eligibility-contract-v1.json',
  legalReview:'content/legal/will/contracts/will-legal-review-admission-contract-v1.json',
  execution:'content/legal/will/registries/will-execution-requirement-registry-v1.json',
  sensitivity:'content/legal/will/contracts/will-sensitive-data-classification-v1.json',
  retention:'content/legal/will/contracts/will-data-retention-contract-v1.json',
  downloadPrivacy:'content/legal/will/contracts/will-download-privacy-contract-v1.json',
  acceptance:'content/document-assembly/acceptance/dar-w0-w14-foundation-acceptance-v1.json'
};
for (const [k,p] of Object.entries(paths)) assert.ok(exists(p), `DAR_${k.toUpperCase()}_MISSING:${p}`);

const w0 = readJson(paths.w0);
assert.equal(w0.baselineCommit, BASELINE, 'DAR_W0_BASELINE_DRIFT');
assert.equal(w0.canonicalDefinition.DAR, 'APPROVED_STRUCTURED_INPUTS + APPROVED_CLAUSE_AUTHORITY + DETERMINISTIC_ASSEMBLY + DOCUMENT_LIFECYCLE');
assert.deepEqual(w0.exitGate, { duplicateAuthorityCount:0, rendererLegalAuthorityCount:0, aiClauseAuthorityCount:0 });
for (const item of w0.reconciledAuthorities) assert.ok(exists(item.path), `DAR_W0_REFERENCE_MISSING:${item.code}:${item.path}`);
for (const forbidden of ['invent legal clause','change legal effect','guess beneficiary','guess executor','silently rebalance shares','infer jurisdiction','silently replace missing data']) assert.ok(w0.mayNot.includes(forbidden), `DAR_W0_FORBIDDEN_MISSING:${forbidden}`);

const w1 = readJson(paths.w1);
const initial = w1.documentTypes.filter(x=>x.phase==='INITIAL').map(x=>x.documentType);
assert.deepEqual(initial, ['WILL','WILL_DECLARATION','DIGITAL_ASSET_MEMORANDUM']);
assert.deepEqual(w1.documentTypes.filter(x=>x.phase==='FUTURE').map(x=>x.documentType), ['CONSENT_DOCUMENT','CLIENT_DECLARATION','ESTATE_INSTRUCTION','FINANCIAL_PLAN','PROFESSIONAL_REPORT']);
assert.ok(w1.documentTypes.every(x=>x.productionEnabled===false), 'DAR_W1_PREMATURE_PRODUCTION_ENABLEMENT');

const w2 = readJson(paths.w2);
assert.deepEqual(w2.states, ['DRAFT_INPUT','INPUT_VALIDATED','ASSEMBLY_ELIGIBLE','DOCUMENT_CANDIDATE','CUSTOMER_REVIEW','PROFESSIONAL_REVIEW_REQUIRED','NOT_REQUIRED','APPROVED_FOR_EXPORT','EXPORTED','SIGNED_EXTERNALLY','EXECUTION_RECORDED','SUPERSEDED']);
assert.equal(w2.invariants.exportedIsNotLegallyExecuted, true, 'DAR_W2_EXPORT_EXECUTION_CONFUSION');

const w3 = readJson(paths.w3);
for (const field of ['testator','jurisdiction','domicile','executors','substituteExecutors','guardians','substituteGuardians','beneficiaries','properties','businessInterests','bankAssets','investments','insurance','epf','prs','vehicles','jewellery','digitalAssets','otherAssets','specificGifts','residuaryDistribution','trustInstructions','digitalAssetInstructions','language','translatorRequired']) assert.ok(w3.requiredWillDomains.includes(field), `DAR_W3_FIELD_MISSING:${field}`);
for (const code of ['A1','A2','C1','C2']) assert.equal(w3.legacyPresentationCodes.codes.includes(code), true);
const schema = readJson(paths.willSchema);
for (const code of ['A1','A2','C1','C2']) assert.equal(Object.prototype.hasOwnProperty.call(schema.properties, code), false, `DAR_W3_LEGACY_DOMAIN_CODE_PRESENT:${code}`);
assert.equal(schema.additionalProperties, false);
assert.ok(schema.required.includes('persons'));
assert.equal(schema['x-phi-os'].missingDataMayNotBeSilentlyReplaced, true);

const person = readJson(paths.person);
assert.deepEqual(person.properties.roles.items.enum, ['TESTATOR','EXECUTOR','GUARDIAN','BENEFICIARY','WITNESS','DIGITAL_FACILITATOR','TRANSLATOR']);
assert.equal(person['x-phi-os'].roleIsNotAppointmentAuthority, true);

const assets = readJson(paths.assets);
assert.deepEqual(assets.assetTypes.map(x=>x.assetType), ['IMMOVABLE_PROPERTY','BANK_ACCOUNT','UNIT_TRUST','LISTED_SECURITY','PRIVATE_COMPANY','PARTNERSHIP','SOLE_PROPRIETORSHIP','EPF','INSURANCE','PRS','VEHICLE','JEWELLERY','SAFE_DEPOSIT','DIGITAL_ASSET','INTELLECTUAL_PROPERTY','DOMAIN_NAME','ONLINE_ACCOUNT','CRYPTO_ASSET','OTHER']);
assert.ok(assets.assetTypes.every(x=>x.legalTreatment==='UNDETERMINED_BY_TAXONOMY'));

const dist = readJson(paths.distribution);
assert.deepEqual(dist.distributionModels, ['SPECIFIC_GIFT','PERCENTAGE_GIFT','EQUAL_SHARE_GIFT','RESIDUE_SHARE','SUBSTITUTE_BENEFICIARY','PER_ASSET_DISTRIBUTION','CLASS_DISTRIBUTION','SURVIVORSHIP_CONDITION','AGE_CONDITION','TRUST_CONDITION']);
assert.equal(dist.rules.noAutomaticRebalancing, true);

const shareContract = readJson(paths.shareContract);
assert.deepEqual(shareContract.statuses, ['VALID','INVALID','INCOMPLETE','PROFESSIONAL_REVIEW_REQUIRED']);
const validInput = { beneficiaryPersonIds:['P1','P2'], residuaryDistribution:[{beneficiaryPersonId:'P1',percentage:50},{beneficiaryPersonId:'P2',percentage:50}], distributions:[] };
const snapshot = JSON.stringify(validInput);
const valid = evaluateWillShareIntegrity(validInput);
assert.equal(valid.status, 'VALID'); assert.equal(valid.residueTotal,100); assert.equal(valid.repaired,false); assert.equal(JSON.stringify(validInput), snapshot, 'DAR_W7_INPUT_MUTATED');
const invalid = evaluateWillShareIntegrity({ beneficiaryPersonIds:['P1','P2'], residuaryDistribution:[{beneficiaryPersonId:'P1',percentage:60},{beneficiaryPersonId:'P2',percentage:30}], distributions:[] });
assert.equal(invalid.status,'INVALID'); assert.ok(invalid.issues.some(x=>x.code==='RESIDUE_TOTAL_NOT_100')); assert.equal(invalid.repaired,false);
const unresolved = evaluateWillShareIntegrity({ beneficiaryPersonIds:['P1'], residuaryDistribution:[{beneficiaryPersonId:'P2',percentage:100}], distributions:[] });
assert.equal(unresolved.status,'INCOMPLETE');
const review = evaluateWillShareIntegrity({ beneficiaryPersonIds:['P1'], residuaryDistribution:[{beneficiaryPersonId:'P1',percentage:100,ageCondition:'customer-provided condition'}], distributions:[] });
assert.equal(review.status,'PROFESSIONAL_REVIEW_REQUIRED');

const clauses = readJson(paths.clauses);
assert.equal(clauses.status,'REFERENCE_ONLY_NO_APPROVED_LEGAL_TEXT');
assert.equal(new Set(clauses.clauses.map(x=>x.clauseId)).size, clauses.clauses.length, 'DAR_W8_DUPLICATE_CLAUSE_ID');
assert.ok(clauses.clauses.every(x=>x.approvalStatus==='REFERENCE_CLAUSE_CANDIDATE'));
assert.ok(clauses.clauses.every(x=>x.approvedText===null && x.legalReviewer===null && x.approvalDigest===null), 'DAR_W8_UNAPPROVED_TEXT_OR_REVIEW_PRESENT');
assert.equal(clauses.rules.aiGeneratedClauseTextForbidden,true);

const ref = readJson(paths.reference);
assert.equal(ref.sourceArtifact.presentInCurrentBaseline,false);
assert.equal(ref.sourceArtifact.contentAuditedInThisPatch,false);
assert.ok(ref.decomposition.some(x=>x.referenceSection==='Digital Asset Memorandum' && x.documentType==='DIGITAL_ASSET_MEMORANDUM' && x.mustNotBeEmbeddedAsCanonicalWillClause===true));
assert.ok(ref.decomposition.filter(x=>x.disposition==='REFERENCE_CLAUSE_CANDIDATE').every(x=>clauses.clauses.some(c=>c.clauseId===x.clauseId)), 'DAR_W9_CANDIDATE_NOT_IN_CLAUSE_REGISTRY');

const selection = readJson(paths.selection);
for (const id of ['WILL-RULE-MINOR-CHILDREN','WILL-RULE-DIGITAL-ASSETS','WILL-RULE-BUSINESS-INTEREST']) assert.ok(selection.rules.some(x=>x.ruleId===id), `DAR_W10_RULE_MISSING:${id}`);
assert.equal(selection.invariants.candidateIsNotAutomaticallyLegallyAppropriate,true);
assert.ok(selection.rules.some(x=>x.disposition==='AUTOMATIC_ASSEMBLY_BLOCKED'));

const jurisdictions = readJson(paths.jurisdictions);
const my = jurisdictions.jurisdictions.find(x=>x.jurisdiction==='MALAYSIA');
assert.ok(my); assert.equal(my.status,'LEGAL_VALIDATION_REQUIRED_BEFORE_PRODUCTION'); assert.equal(my.willAssemblyProductionEnabled,false); assert.equal(my.exportEnabled,false); assert.equal(my.legalAuthoritySource,null);
assert.equal(jurisdictions.rules.jurisdictionInferenceForbidden,true);
const eligibility = readJson(paths.jurisdictionEligibility);
assert.equal(eligibility.currentResultByJurisdiction.MALAYSIA,'LEGAL_VALIDATION_REQUIRED');
assert.equal(eligibility.rules.legalValidationRequiredBlocksExport,true);

const legalReview = readJson(paths.legalReview);
assert.deepEqual(legalReview.transition,{from:'REFERENCE_CLAUSE_CANDIDATE',to:'APPROVED_TEMPLATE_COMPONENT',automatic:false});
for (const f of ['reviewer','jurisdiction','reviewDate','legalScope','version','limitations','approvedText','approvalDigest']) assert.ok(legalReview.requiredReviewRecordFields.includes(f), `DAR_W12_REVIEW_FIELD_MISSING:${f}`);
assert.deepEqual(legalReview.currentAdmissions,[]);

const execution = readJson(paths.execution);
assert.equal(execution.status,'REFERENCE_OBSERVATIONS_ONLY_LEGAL_VALIDATION_REQUIRED');
assert.ok(execution.requirements.every(x=>x.productionChecklistEnabled===false && x.canonicalExecutionRequirements.length===0));
assert.equal(execution.rules.darMayNotClaimWillIsValid,true); assert.equal(execution.rules.exportDoesNotEqualExecution,true);

const sensitivity = readJson(paths.sensitivity), retention = readJson(paths.retention), download = readJson(paths.downloadPrivacy);
for (const p of [sensitivity.upstreamAuthority, retention.upstreamAuthority, retention.subjectRightsAuthority, download.webPrivacyAuthority, download.commerceTokenReference]) assert.ok(exists(p), `DAR_W14_UPSTREAM_REFERENCE_MISSING:${p}`);
assert.equal(sensitivity.defaultSensitivity,'HIGHLY_SENSITIVE'); assert.equal(sensitivity.rules.analyticsPayloadLeakageForbidden,true); assert.equal(sensitivity.rules.urlOrQueryPiiForbidden,true);
assert.equal(retention.defaultHandling,'EPHEMERAL_NO_PERSISTENCE_UNLESS_USER_EXPLICITLY_SAVES'); assert.equal(retention.rules.silentIndefiniteRetentionForbidden,true);
assert.equal(download.requirements.privateByDefault,true); assert.equal(download.requirements.noPublicR2ObjectForWill,true); assert.equal(download.requirements.noAnalyticsPayloadLeakage,true); assert.equal(download.requirements.noUrlOrQueryPii,true);

const acceptance = readJson(paths.acceptance);
assert.equal(acceptance.status,'FOUNDATION_COMPLETE_FAIL_CLOSED_PRE_ASSEMBLY');
assert.deepEqual(acceptance.completedWork, Array.from({length:15},(_,i)=>`DAR-W${i}`));
assert.deepEqual(acceptance.proofs,{ duplicateAuthorityCount:0, approvedLegalClauseCount:0, aiGeneratedLegalClauseCount:0, productionJurisdictionCount:0, silentShareRepairCount:0, rendererLegalAuthorityCount:0, exportEqualsExecutionClaimCount:0, publicWillStoragePathCount:0 });
assert.equal(acceptance.sourceLimitation.fullWillReferenceBinaryPresent,false);

const packageJson = readJson('package.json');
const darFinalFreezeExists = exists('content/document-assembly/freeze/dar-production-freeze-v1.json');
if (darFinalFreezeExists) assert.equal(typeof packageJson.scripts?.['check:dar'], 'string', 'DAR_W24_FINAL_PACKAGE_CHECK_MISSING_AFTER_FREEZE');
else assert.equal(Object.prototype.hasOwnProperty.call(packageJson.scripts || {}, 'check:dar'), false, 'DAR_W24_FINAL_PACKAGE_CHECK_REGISTERED_TOO_EARLY');

// No legal clause text may sneak into the foundation registry before W12 admission.
assert.equal(/"approvedText"\s*:\s*"/.test(text(paths.clauses)), false, 'DAR_AI_OR_UNREVIEWED_APPROVED_CLAUSE_TEXT_DETECTED');

console.log('✓ DAR-W0–W14 Document Assembly foundation passed.');
console.log('  0 duplicate authority; 0 approved/legal AI clauses; Malaysia remains LEGAL_VALIDATION_REQUIRED; share integrity is deterministic and never repairs shares.');
console.log('  W9 reference sections are registered as candidates only because Full Set of Will Example.docx is not present in the aligned baseline.');
console.log(darFinalFreezeExists ? '  DAR-W24 successor freeze detected; package.json check:dar is now admitted.' : '  package.json check:dar intentionally remains deferred to DAR-W24.');
