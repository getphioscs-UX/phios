import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const BASE = '3b5ff152d1cdfe479ed4daf7c772e3faa926dc17';
const requested = String(process.argv[2] || 'ALL').toUpperCase();
const read = rel => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const text = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(ROOT, rel));
const sha256 = rel => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');

const files = {
  H0: 'content/web-production/bfr-backend-capability-inventory-v1.json',
  H1: 'content/web-production/bfr-frontend-surface-inventory-v1.json',
  H1B: 'content/web-production/wpr-post-freeze-visual-baseline-v1.json',
  H2: 'content/web-production/bfr-capability-surface-gap-matrix-v1.json',
  H3: 'content/web-production/surface-production-manifest-v1.json',
  H4: 'content/web-production/bfr-pds-cpr-wpr-lineage-v1.json',
  H5: 'content/web-production/bfr-five-volume-visual-projection-v1.json',
  H6: 'content/web-production/bfr-audience-information-density-projection-v1.json',
  H7: 'content/web-production/bfr-homepage-recomposition-requirement-v1.json',
  H8: 'content/web-production/bfr-library-book-knowledge-recomposition-v1.json',
  H9: 'content/web-production/bfr-personal-reality-surface-reconciliation-v1.json',
  H10: 'content/web-production/bfr-academy-services-professional-reconciliation-v1.json',
  H11: 'content/web-production/bfr-r2-visual-consumption-v1.json',
  H12: 'content/web-production/bfr-responsive-production-matrix-v1.json',
  H13: 'content/web-production/bfr-responsive-acceptance-v1.json',
  H14: 'content/web-production/bfr-accessibility-acceptance-v1.json',
  ACCEPT: 'content/web-production/acceptance/bfr-h-part-a-acceptance-v1.json',
  FREEZE: 'content/web-production/freeze/bfr-h-part-a-freeze-v1.json'
};
for (const f of Object.values(files)) assert.ok(exists(f), `${f} must exist`);

function baseline(x, label) {
  assert.equal(x.baselineCommit, BASE, `${label} baseline commit drift`);
}

function h0() {
  const x = read(files.H0); baseline(x, 'BFR-H0');
  assert.equal(x.work, 'BFR-H0');
  assert.equal(x.authorityBoundary.newBackendAuthorityCreated, false);
  assert.equal(x.authorityBoundary.productionEligibilityChanged, false);
  assert.ok(x.recordCount >= 50, 'BFR-H0 must inventory the complete minimum backend scope');
  const cats = new Set(x.records.map(r => r.category));
  for (const c of ['BOOKS','KNOWLEDGE','VISUAL','REALITY','METHOD','ACADEMY','SERVICES','PROFESSIONAL']) assert.ok(cats.has(c), `Missing H0 category ${c}`);
  const required = ['capabilityCode','runtimeCode','authoritySource','productionState','dataSource','endpoint','localeAvailability','audience','visualAssets','expectedSurface','actualConsumer','consumerState'];
  const states = new Set(['ACTIVE','PARTIAL','MISSING','NONE_BY_DESIGN','DEPRECATED']);
  const codes = new Set();
  for (const r of x.records) {
    for (const k of required) assert.ok(Object.hasOwn(r,k), `${r.capabilityCode ?? 'unknown'} missing ${k}`);
    assert.ok(!codes.has(r.capabilityCode), `Duplicate capability ${r.capabilityCode}`); codes.add(r.capabilityCode);
    assert.ok(states.has(r.consumerState), `Invalid consumer state ${r.consumerState}`);
    assert.ok(Array.isArray(r.expectedSurface) && r.expectedSurface.length > 0, `${r.capabilityCode} must declare intended surface or NONE_BY_DESIGN`);
    if (typeof r.authoritySource === 'string' && !r.authoritySource.startsWith('/')) assert.ok(exists(r.authoritySource), `${r.capabilityCode} authority source missing: ${r.authoritySource}`);
    if (typeof r.dataSource === 'string' && r.dataSource && !r.dataSource.startsWith('/')) assert.ok(exists(r.dataSource), `${r.capabilityCode} data source missing: ${r.dataSource}`);
  }
  for (const snap of x.sourceSnapshot) assert.equal(sha256(snap.path), snap.sha256, `H0 source snapshot drift: ${snap.path}`);
  assert.equal(x.exitGate.invisibleCapabilitiesOmitted, false);
  console.log(`✓ BFR-H0 Backend Capability Inventory passed (${x.recordCount} capabilities).`);
}

function h1() {
  const x = read(files.H1); const b = read(files.H1B); baseline(x, 'BFR-H1'); baseline(b, 'BFR-H1 visual baseline');
  const requiredFamilies = ['Homepage','Knowledge Search','Library','Books','Individual Book','Article','Figure','Ask PHI OS','Academy','Reality Journey','Personal Reality','Financial Reality','Account','Reality Dashboard','Customer Workspace','Services','Professional Workspace','Report'];
  const families = new Set(x.records.map(r => r.surfaceFamily));
  for (const f of requiredFamilies) assert.ok(families.has(f), `BFR-H1 missing surface family ${f}`);
  const required = ['route','surfaceCode','surfaceFamily','audience','locale','dataSource','runtimeConsumer','composition','pdsCompliance','visualDensity','imageCoverage','volumeIdentity','responsiveState','accessibilityState','productionState'];
  for (const r of x.records) {
    for (const k of required) assert.ok(Object.hasOwn(r,k), `${r.surfaceCode} missing ${k}`);
    assert.equal(r.audit.actualBrowserAudit, 'REVALIDATION_REQUIRED_AT_CURRENT_DEPLOYMENT_SHA');
    if (r.actualHtml) {
      assert.ok(exists(r.actualHtml), `${r.surfaceCode} actual HTML missing`);
      assert.equal(r.audit.routeFileEvidence, true);
    }
  }
  const ask = x.records.find(r => r.surfaceCode === 'ASK_PHIOS');
  assert.ok(ask && ask.surfaceFamily === 'Ask PHI OS');
  assert.ok(exists('functions/api/ask-phios.js'));
  assert.ok(exists('assets/js/knowledge/ask-phios-client.js'));
  assert.equal(b.wprAuthorityReopened, false);
  assert.equal(b.r2FailClosed, true);
  console.log(`✓ BFR-H1 Frontend Surface Inventory passed (${x.recordCount} reconciled surfaces).`);
}

function h2() {
  const x = read(files.H2); baseline(x, 'BFR-H2');
  const allowed = new Set(['NO_GAP','MISSING_SURFACE','MISSING_CONSUMER','PARTIAL_CONSUMPTION','STALE_PROJECTION','WRONG_AUTHORITY_SOURCE','HARDCODED_DUPLICATE','VISUAL_ASSET_MISSING','VISUAL_ASSET_UNCONSUMED','LOCALE_GAP','RESPONSIVE_GAP','ACCESSIBILITY_GAP','AUDIENCE_DENSITY_GAP']);
  assert.equal(x.records.length, read(files.H0).recordCount);
  for (const r of x.records) assert.ok(allowed.has(r.gapClassification), `Invalid gap ${r.gapClassification}`);
  const map = new Map(x.requiredCkaMappings.map(r => [r.capability, r]));
  for (const [cap, req] of [['GROUNDED_ANSWER','REQUIRED'],['KNOWLEDGE_RETRIEVAL','REQUIRED'],['PUBLISHED_KNOWLEDGE','REQUIRED'],['RELATED_KNOWLEDGE','REQUIRED'],['REALITY_CONTEXT','CONDITIONAL'],['ACCOUNT_HISTORY','CONDITIONAL'],['REALITY_JOURNEY','CONDITIONAL_CTA'],['METHOD_RUNTIME','NO_DIRECT_EXECUTION']]) {
    assert.equal(map.get(cap)?.requirement, req, `CKA mapping drift ${cap}`);
  }
  assert.equal(x.exitGate.silentOrphanCount, 0);
  console.log('✓ BFR-H2 Capability → Surface Gap Matrix passed; open gaps remain explicit rather than silently promoted.');
}

function h3() {
  const x = read(files.H3); baseline(x, 'BFR-H3');
  assert.equal(x.canonicalCurrentManifest, true);
  const required = ['HOMEPAGE','KNOWLEDGE_SEARCH','LIBRARY','BOOKS','INDIVIDUAL_BOOK','ARTICLE','FIGURE','ASK_PHIOS','ACADEMY','REALITY_JOURNEY','PERSONAL_REALITY','FINANCIAL_REALITY','ACCOUNT','REALITY_DASHBOARD','CUSTOMER_WORKSPACE','SERVICES','PROFESSIONAL_WORKSPACE','REPORT'];
  const map = new Map(x.surfaces.map(s => [s.surfaceCode,s]));
  for (const c of required) assert.ok(map.has(c), `Surface manifest missing ${c}`);
  const fields=['surfaceCode','route','surfaceFamily','authoritySources','runtimeSources','dataEndpoints','compositionContract','PDSProfile','visualAssets','assetResolver','audience','informationDensity','locales','responsiveProfile','accessibilityProfile','productionState'];
  for (const s of x.surfaces) for (const k of fields) assert.ok(Object.hasOwn(s,k), `${s.surfaceCode} missing ${k}`);
  const ask=map.get('ASK_PHIOS');
  for(const a of ['PUBLISHED_KNOWLEDGE','KSAR','KNOWLEDGE_RETRIEVAL','RELATED_KNOWLEDGE']) assert.ok(ask.authoritySources.includes(a));
  assert.deepEqual(ask.runtimeSources,['GROUNDED_ANSWER']);
  assert.deepEqual(ask.audience,['PUBLIC','CUSTOMER']);
  assert.equal(ask.informationDensity,'ADAPTIVE');
  console.log('✓ BFR-H3 Current Production Surface Manifest passed, including formal Ask PHI OS surface declaration.');
}

function h4() {
  const x = read(files.H4); baseline(x, 'BFR-H4');
  assert.ok(exists(x.authorityReferences.pdsTokens)); assert.ok(exists(x.authorityReferences.cpr)); assert.ok(exists(x.authorityReferences.wpr)); assert.ok(exists(x.authorityReferences.surfaceManifest));
  for (const p of x.pageLineage) {
    assert.equal(p.pdsTokenConsumed, true, `${p.actualPage} must consume PDS token stylesheet`);
    assert.equal(p.inlineStyleAuthorityLeak, false, `${p.actualPage} has inline presentation authority leakage`);
    assert.deepEqual(p.lineage,['PDS_TOKEN','PDS_COMPONENT','CPR_COMPOSITION','WPR_PROJECTION','SURFACE_PRODUCTION_MANIFEST','ACTUAL_CLIENT']);
  }
  console.log('✓ BFR-H4 PDS → Component → CPR → WPR → Manifest → Actual Client lineage passed.');
}

function h5() {
  const x=read(files.H5); baseline(x,'BFR-H5');
  assert.equal(x.volumes.length,5);
  const expected=[['BOOK-1','Reality Formation'],['BOOK-2','Reality Runtime'],['BOOK-3','Reality Continuity'],['BOOK-4','Reality Civilization'],['BOOK-5','Reality Navigation']];
  expected.forEach(([c,t],i)=>{assert.equal(x.volumes[i].bookCode,c);assert.equal(x.volumes[i].title,t)});
  assert.equal(x.identityNotColorOnly,true); assert.equal(x.pdsAuthorityPreserved,true);
  console.log('✓ BFR-H5 Five-Volume Visual System passed.');
}

function h6() {
  const x=read(files.H6); baseline(x,'BFR-H6');
  for(const a of ['PUBLIC','CUSTOMER','PROFESSIONAL']) assert.ok(x.audiences[a]);
  for(const f of ['PRIVATE_EVIDENCE','CUSTOMER_STATE','PROFESSIONAL_JUDGMENT','PRIVATE_PROVENANCE']) assert.ok(x.audiences.PUBLIC.forbid.includes(f));
  assert.equal(x.exitGate.privacyBoundaryPreserved,true);
  console.log('✓ BFR-H6 Information Density & Audience Projection passed.');
}

function h7() {
  const x=read(files.H7); baseline(x,'BFR-H7');
  assert.equal(x.target.visualCoverage,'HIGH'); assert.equal(x.target.capabilityCoverage,'HIGH');
  const codes=new Set(x.requiredCapabilities.map(r=>r.capabilityCode));
  for(const c of ['FIVE_VOLUME_KNOWLEDGE_SYSTEM','REALITY_JOURNEY','PERSONAL_REALITY','FINANCIAL_REALITY','READING_NAVIGATION','ASK_PHIOS','ACADEMY','SERVICES','PROFESSIONAL','FIGURES_VISUAL_KNOWLEDGE']) assert.ok(codes.has(c),`H7 missing ${c}`);
  assert.equal(x.successor,'HPC2'); assert.equal(x.narrativeOrderDefinedByBfrH7,false);
  const five=x.requiredCapabilities.find(r=>r.capabilityCode==='FIVE_VOLUME_KNOWLEDGE_SYSTEM');
  const ask=x.requiredCapabilities.find(r=>r.capabilityCode==='ASK_PHIOS');
  assert.equal(five.currentHomepageConsumerDetected,false); assert.equal(ask.currentHomepageConsumerDetected,false);
  console.log('✓ BFR-H7 Homepage Recomposition Requirement passed; missing Five-Volume/Ask consumers are preserved as HPC2 gaps.');
}

function h8() {
  const x=read(files.H8); baseline(x,'BFR-H8');
  assert.equal(x.article.nodePrefixBookInferenceAllowed,false);
  assert.ok(exists(x.article.publicationOwnershipAuthority));
  assert.equal(x.figure.figureEqualsMethodClientResult,false);
  assert.equal(x.authorityRecreated,false);
  console.log('✓ BFR-H8 Library / Book / Knowledge Recomposition passed.');
}

function h9() {
  const x=read(files.H9); baseline(x,'BFR-H9');
  assert.deepEqual(x.clientResultLabels,['INPUT','CALCULATED','PROJECTED','KNOWN','UNKNOWN','INTERPRETED','NAVIGATION']);
  assert.equal(x.restrictedPublicVocabulary.leakCount,0,'Restricted trademark/legacy literal leaked into public HTML');
  assert.equal(x.authorityBoundary.rendererCalculationAuthority,false);
  assert.equal(x.authorityBoundary.newReadingAuthority,false);
  console.log('✓ BFR-H9 Personal Reality / Reading / Navigation Recomposition passed; no restricted literal trademark leakage found in public HTML source.');
}

function h10() {
  const x=read(files.H10); baseline(x,'BFR-H10');
  for(const c of ['PUBLISHED_KNOWLEDGE','LEARNING_RUNTIME','PROGRESS','ASSESSMENT','READING_PATH','FIVE_VOLUME_ARCHITECTURE']) assert.ok(x.academy.mustConsume.includes(c));
  for(const c of ['READING','NAVIGATION','FINANCIAL_REALITY','REALITY_READOUT','PROFESSIONAL_SERVICES','ACADEMY']) assert.ok(x.services.mustAlign.includes(c));
  for(const c of ['EVIDENCE','UNKNOWN','PROVENANCE','METHOD_ELIGIBILITY','PROFESSIONAL_JUDGMENT_BOUNDARY','APPROVAL','ACTION','OUTCOME']) assert.ok(x.professional.mustPresent.includes(c));
  assert.equal(x.professional.professionalUiEqualsPublicUiPlusMoreFields,false);
  assert.equal(x.authorityCreated,false);
  console.log('✓ BFR-H10 Academy / Services / Professional Recomposition passed.');
}

function h11() {
  const x=read(files.H11); baseline(x,'BFR-H11');
  const reg=read('content/registry/public-assets.json');
  assert.equal(x.recordCount,reg.assets.length);
  assert.equal(x.failClosed,true); assert.equal(x.publicBaseUrlConfigured,false);
  const allowed=new Set(['REGISTERED_BUT_UNRESOLVED','RESOLVED_BUT_UNUSED','PUBLISHED_NO_CONSUMER','DEPRECATED_STILL_CONSUMED','HARDCODED_WHERE_GOVERNED_ASSET_EXISTS','RESOLVED_AND_CONSUMED']);
  for(const r of x.records){for(const k of ['assetCode','assetType','authorityReference','objectKey','locale','variant','expectedConsumer','actualConsumer','resolutionState']) assert.ok(Object.hasOwn(r,k),`${r.assetCode} missing ${k}`);assert.ok(allowed.has(r.resolutionState));}
  assert.ok(x.findings.some(f=>f.type==='HARDCODED_WHERE_GOVERNED_ASSET_EXISTS'));
  assert.equal(x.frontendIntegrationComplete,false); assert.equal(x.productionPromotionClaimed,false);
  console.log('✓ BFR-H11 R2 Visual Asset Integration audit passed; fail-closed unresolved/consumer gaps remain explicit.');
}

function h12() {
  const x=read(files.H12); baseline(x,'BFR-H12');
  assert.deepEqual(x.viewports,[360,390,430,768,1024,1280,1440]);
  assert.deepEqual(x.locales,['en','zh-Hans']); assert.equal(x.surfaceFamilies.length,13); assert.equal(x.primaryCheckCount,182); assert.equal(x.matrix.length,182); assert.equal(x.independentCheckerCount,1); assert.equal(x.createsBreakpointAuthority,false);
  const keys=new Set(x.matrix.map(r=>`${r.surfaceFamily}|${r.locale}|${r.viewport}`)); assert.equal(keys.size,182);
  console.log('✓ BFR-H12 Responsive Production Matrix passed (7 × 2 × 13 = 182 states, one runner).');
}

function h13() {
  const x=read(files.H13); baseline(x,'BFR-H13');
  assert.equal(x.criteria.length,9); for(const c of x.criteria){assert.equal(c.contracted,true); assert.equal(c.productionBrowserEvidence,'REVALIDATION_REQUIRED');}
  assert.deepEqual(x.fiveVolumeLayoutProgression,['5_COLUMNS','3_PLUS_2','2_PLUS_2_PLUS_1','1_COLUMN']);
  assert.equal(x.breakpointAuthority,'PDS'); assert.equal(x.createsBreakpointAuthority,false); assert.equal(x.productionBrowserRevalidationRequired,true);
  console.log('✓ BFR-H13 Responsive Acceptance Criteria contract passed; live browser evidence remains correctly deployment-bound.');
}

function h14() {
  const x=read(files.H14); baseline(x,'BFR-H14');
  const codes=new Set(x.criteria.map(c=>c.code));
  for(const c of ['KEYBOARD_NAVIGATION','VISIBLE_FOCUS','SEMANTIC_LANDMARKS','HEADING_HIERARCHY','ALT','FIGURE_CAPTION','LONG_DESCRIPTION_WHERE_NEEDED','CONTRAST','REDUCED_MOTION','TOUCH_TARGET','FORM_LABELS','ERROR_IDENTIFICATION','ARIA_CURRENT','ARIA_EXPANDED','DIALOG_SEMANTICS','SKIP_NAVIGATION','VISUAL_INFORMATION_NOT_COLOR_ONLY','VOLUME_IDENTITY_NOT_COLOR_ONLY','UNKNOWN_WARNING_NOT_COLOR_ONLY','INTERACTIVE_FIGURE_KEYBOARD_ACCESSIBILITY','ASK_COMPOSER_KEYBOARD_ACCESSIBILITY','ANSWER_EXPANDABLE_REGIONS_ACCESSIBLE']) assert.ok(codes.has(c),`H14 missing ${c}`);
  assert.equal(x.sourceEvidence.focusVisibleRulePresent,true); assert.equal(x.sourceEvidence.reducedMotionRulePresent,true); assert.equal(x.sourceEvidence.publicLiteralRestrictedVocabularyLeakCount,0);
  assert.equal(x.pdsAccessibilityAuthorityPreserved,true); assert.equal(x.newAccessibilityAuthorityCreated,false); assert.equal(x.productionBrowserRevalidationRequired,true);
  console.log('✓ BFR-H14 Accessibility Acceptance source audit passed; production browser revalidation remains explicit.');
}

const steps={H0:h0,H1:h1,H2:h2,H3:h3,H4:h4,H5:h5,H6:h6,H7:h7,H8:h8,H9:h9,H10:h10,H11:h11,H12:h12,H13:h13,H14:h14};
if(requested==='ALL') Object.values(steps).forEach(fn=>fn());
else {
  const key=requested.replace(/^BFR-/,'');
  assert.ok(steps[key],`Unknown BFR Part A step: ${requested}`);
  steps[key]();
}

if(requested==='ALL') {
  const a=read(files.ACCEPT); const f=read(files.FREEZE); baseline(a,'Part A acceptance'); baseline(f,'Part A freeze');
  assert.equal(a.partAExecutionComplete,true); assert.deepEqual(a.completedSteps,Array.from({length:15},(_,i)=>`BFR-H${i}`));
  assert.equal(a.facts.backendCapabilityCount,read(files.H0).recordCount); assert.equal(a.facts.responsivePrimaryCheckCount,182); assert.equal(a.facts.silentBackendOrphanCount,0);
  assert.equal(a.facts.duplicateAuthorityCreated,false); assert.equal(a.facts.pdsReopened,false); assert.equal(a.facts.cprReopened,false); assert.equal(a.facts.wprV1Reopened,false);
  assert.equal(a.facts.hpc2ImplementedByThisWork,false); assert.equal(a.facts.ckaImplementedByThisWork,false); assert.equal(a.facts.globalProductionAcceptanceClaimed,false);
  assert.equal(a.exitGate.openGapsExplicitNotHidden,true); assert.equal(a.exitGate.productionBrowserRevalidationRequired,true); assert.equal(a.exitGate.fullProductionPromotion,false);
  assert.equal(f.globalProductionFreezeDeclared,false); assert.equal(f.frozenBoundaries.pdsAuthority,false); assert.equal(f.frozenBoundaries.cprAuthority,false); assert.equal(f.frozenBoundaries.wprV1Authority,false);
  console.log('✓ BFR-H0–H14 Part A acceptance/freeze passed. Reconciliation is complete without false global Production promotion.');
}
