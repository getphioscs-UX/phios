import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildZiWeiCalculationIR} from '../functions/zi-wei-runtime/zi-wei-calculation-ir-runtime.js';
import {executeAndProjectZwrProduction} from '../functions/method-client-delivery/zwr-canonical-projection-runtime.js';
import {getZwrMpaProductionDecision} from '../functions/method-production-activation/zwr-production-authority-runtime.js';
import {buildZiWeiDynamicProjection} from '../functions/zi-wei-dynamic/dynamic-runtime.js';
import {buildCanonicalZiweiChartIR} from '../functions/zi-wei-full-production/ziwei-chart-runtime.js';
import {calculateZiweiCompleteStarPlacement} from '../functions/zi-wei-full-production/ziwei-complete-star-placement-runtime.js';
import {resolveZiweiStarStates} from '../functions/zi-wei-full-production/ziwei-star-state-runtime.js';
import {buildZiweiFourTransformationMatrix} from '../functions/zi-wei-full-production/ziwei-four-transformation-matrix-runtime.js';
import {buildZiweiPalaceRelationshipEngine} from '../functions/zi-wei-full-production/ziwei-palace-relationship-engine.js';
import {buildZiweiStarCombinationRuntime} from '../functions/zi-wei-full-production/ziwei-star-combination-runtime.js';
import {evaluateAdmittedZiweiPatterns} from '../functions/zi-wei-full-production/ziwei-admitted-pattern-runtime.js';
import {buildZiweiDaXianIntegrationIR} from '../functions/zi-wei-full-production/ziwei-da-xian-integration-runtime.js';
import {buildZiweiLiuNianIntegrationIR} from '../functions/zi-wei-full-production/ziwei-liu-nian-integration-runtime.js';
import {buildZiweiMeaningContext} from '../functions/zi-wei-full-production/ziwei-meaning-registry-runtime.js';
import {buildZiweiStructuralFindingRegistry} from '../functions/zi-wei-full-production/ziwei-structural-finding-runtime.js';
import {buildZiweiInterpretationEvidenceGraph} from '../functions/zi-wei-full-production/ziwei-interpretation-evidence-graph-runtime.js';
import {buildZiweiCrossFindingComposition} from '../functions/zi-wei-full-production/ziwei-cross-finding-composition-runtime.js';
import {resolveZiweiContradictions} from '../functions/zi-wei-full-production/ziwei-contradiction-resolver-runtime.js';
import {buildZiweiSemanticDedupIR} from '../functions/zi-wei-full-production/ziwei-semantic-dedup-runtime.js';
import {buildZiweiReadingIR} from '../functions/zi-wei-full-production/ziwei-reading-ir-runtime.js';
import {composeZiweiCustomerReport} from '../functions/zi-wei-full-production/ziwei-customer-report-runtime.js';
import {buildZiweiInteractiveChartSurface,renderZiweiInteractiveChartSurfaceHtml} from '../functions/zi-wei-full-production/ziwei-interactive-chart-surface-runtime.js';

const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const base='content/professional/zi-wei-full-production';
const baseline='a30a38d45a273fa0de603dcb9da827bf4c4ca307';
const required=[
  `${base}/contracts/ziwei-interactive-chart-surface-contract-v1.json`,
  `${base}/authority/ziwei-fp-w19-interactive-chart-surface-authority-v1.json`,
  `${base}/fixtures/ziwei-fp-w19-interactive-chart-surface-validation-fixture-v1.json`,
  `${base}/acceptance/ziwei-fp-w19-engineering-acceptance-v1.json`,
  `${base}/roadmap/ziwei-full-production-master-work-v9.json`,
  'functions/zi-wei-full-production/ziwei-interactive-chart-surface-runtime.js'
];
for(const p of required)assert.ok(fs.existsSync(p),`missing ${p}`);
const contract=j(required[0]),authority=j(required[1]),fixture=j(required[2]),acceptance=j(required[3]),roadmap=j(required[4]),ex=fixture.expected;
for(const x of [contract,authority,fixture,acceptance,roadmap])assert.equal(x.baselineCommit,baseline);
assert.equal(contract.outputSchema,ex.outputSchema);
assert.equal(contract.layoutRules.layoutType,ex.layoutType);
assert.equal(contract.layoutRules.palaceCellCount,ex.palaceCount);
assert.equal(contract.interactionRules.openBoundaryVisible,true);
assert.equal(contract.interactionRules.tableFallbackRequired,true);
assert.equal(contract.customerCutoverAllowed,false);
assert.equal(authority.authority.ownsInteractiveSurfaceComposition,true);
assert.equal(authority.authority.ownsMeaning,false);
assert.equal(authority.rules.secondEssayForbidden,true);
assert.equal(authority.customerCutoverAllowed,false);
assert.equal(acceptance.gates.TWELVE_PALACE_INTERACTIVE_SURFACE_AVAILABLE,true);
assert.equal(acceptance.gates.HUMAN_ACCEPTED_CUSTOMER_SURFACE,false);
assert.equal(roadmap.works.find(x=>x.work==='ZIWEI-FP-W19').status,'ENGINEERING_COMPLETE_INTERACTIVE_TWELVE_PALACE_SURFACE_AVAILABLE');
assert.equal(roadmap.nextWork,'ZIWEI-FP-W20｜Topic Reading');
assert.equal(roadmap.interactiveChartSurface.implemented,true);
assert.equal(roadmap.interactiveChartSurface.customerCutoverAllowed,false);

async function buildCase(ci,{consentId,requestId,locale='zh-Hans'}={}){
  const policy=j('content/professional/core-method-runtime/zi-wei-calculation-policy-v1.json');
  const w56=j(`${base}/fixtures/ziwei-fp-w5-w6-validation-fixture-v1.json`);
  const canonicalInput={birthDate:ci.birthDate,birthTime:ci.birthTime,birthPlace:{displayName:'Hong Kong',countryCode:'HK',latitude:null,longitude:null},timezone:{iana:ci.timezone.iana,utcOffsetAtBirth:ci.timezone.utcOffsetAtBirth,source:'HUMAN_DECLARATION',confidence:'MEDIUM'},timeAccuracy:ci.timeAccuracy,locale,consent:{recordId:consentId,granted:true,purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',persistence:'NONE'},inputVersion:'MCD-3-CANONICAL-BIRTH-INPUT-v1.0.0'};
  const sourceIR=buildZiWeiCalculationIR({birthDate:canonicalInput.birthDate,birthTime:canonicalInput.birthTime,timeAccuracy:canonicalInput.timeAccuracy,timezone:canonicalInput.timezone},{policy,executionMode:'INTERNAL_VALIDATION'});
  const decision=getZwrMpaProductionDecision('ZI_WEI_DOU_SHU','1.0.0','CALCULATION');assert.equal(decision.decision,'ELIGIBLE');
  const req={schemaVersion:'PHI-OS-MCD-METHOD-EXECUTION-REQUEST-v1.0.0',methodCode:'ZI_WEI_DOU_SHU',methodVersion:'1.0.0',capability:'CALCULATION',purposeCode:'PERSONAL_RUNTIME_METHOD_PROJECTION',canonicalInput,executionParameters:{},consentRecordId:consentId,requestId};
  const projection=await executeAndProjectZwrProduction(req,decision);
  const dyn=await buildZiWeiDynamicProjection({requestId:`${requestId}-DYN`,consentRecordId:consentId,canonicalInput,natalProjection:projection,targetContext:{targetDate:w56.dynamicInput.targetDate,targetTime:w56.dynamicInput.targetTime,targetTimezone:w56.dynamicInput.targetTimezone},executionParameters:{traditionalCalculationSex:w56.dynamicInput.traditionalCalculationSex}});
  const upstream=[sourceIR,projection,dyn],snapshots=upstream.map(x=>JSON.stringify(x));
  const chart=await buildCanonicalZiweiChartIR({canonicalProjection:projection,sourceCalculationIR:sourceIR,dynamicProjection:dyn});
  const placement=calculateZiweiCompleteStarPlacement({chart});
  const states=resolveZiweiStarStates({placement});
  const matrix=buildZiweiFourTransformationMatrix({chart});
  const relationships=buildZiweiPalaceRelationshipEngine({chart,placement,starStates:states,transformationMatrix:matrix});
  const combinations=buildZiweiStarCombinationRuntime({chart,placement,starStates:states,transformationMatrix:matrix,relationships});
  const patterns=evaluateAdmittedZiweiPatterns({combinations});
  const da=buildZiweiDaXianIntegrationIR({chart,transformationMatrix:matrix,relationships,combinations,admittedPatterns:patterns});
  const ln=buildZiweiLiuNianIntegrationIR({chart,transformationMatrix:matrix,relationships,combinations,admittedPatterns:patterns,daXianIntegration:da});
  const meanings=buildZiweiMeaningContext({chart,starStates:states,relationships,combinations,admittedPatterns:patterns,daXianIntegration:da,liuNianIntegration:ln,locale});
  const findings=await buildZiweiStructuralFindingRegistry({chart,relationships,combinations,admittedPatterns:patterns,daXianIntegration:da,liuNianIntegration:ln,meaningContext:meanings});
  const graph=buildZiweiInterpretationEvidenceGraph({structuralFindings:findings,meaningContext:meanings});
  const composition=await buildZiweiCrossFindingComposition({structuralFindings:findings,evidenceGraph:graph});
  const resolution=resolveZiweiContradictions({composition,structuralFindings:findings,evidenceGraph:graph});
  const dedup=buildZiweiSemanticDedupIR({composition,contradictionResolution:resolution});
  const reading=buildZiweiReadingIR({meaningContext:meanings,structuralFindings:findings,evidenceGraph:graph,composition,contradictionResolution:resolution,dedup,locale});
  const readingSnap=JSON.stringify(reading);
  const report=composeZiweiCustomerReport({readingIR:reading,locale});
  const reportSnap=JSON.stringify(report);
  const surface=buildZiweiInteractiveChartSurface({customerReport:report,locale});
  assert.equal(JSON.stringify(reading),readingSnap,'W19 mutated W17 Reading IR via W18/W19 chain');
  assert.equal(JSON.stringify(report),reportSnap,'W19 mutated W18 customer report');
  for(let i=0;i<upstream.length;i++)assert.equal(JSON.stringify(upstream[i]),snapshots[i],'W19 mutated upstream calculation/projection');
  return {reading,report,surface};
}

function customerStrings(surface){
  const out=[surface.centerPanel.title,surface.centerPanel.subtitle,surface.centerPanel.boundary,surface.centerPanel.instructions,...surface.centerPanel.anchors.flatMap(x=>[x.label,x.value]),...surface.centerPanel.legend.map(x=>x.label),...surface.centerPanel.timingSummary.flatMap(x=>[x.title,x.paragraph]),surface.openBoundaries.title];
  for(const p of surface.palaces)out.push(p.title,p.branchLabel,p.resolutionLabel,p.teaser,p.openBoundary,...p.focusLabels,...p.starNames,...p.transformationNames,...p.inspector.paragraphs,p.inspector.networkSummary,...p.inspector.triadPalaces,p.inspector.oppositePalace,...p.inspector.flankPalaces,...p.inspector.overlayLinks,...p.inspector.stars.map(x=>`${x.label}${x.stateLabel||''}`),...p.inspector.transformations.map(x=>`${x.label}${x.targetStarLabel||''}`));
  for(const row of surface.tableFallbackRows)out.push(row.palace,row.branch,row.focus,row.stars,row.teaser);
  for(const item of surface.openBoundaries.items)out.push(item.starLabel,...item.affectedPalaceLabels,item.customerCopy);
  return out.filter(Boolean);
}
function assertNoInternalCodesInCopy(strings){for(const x of strings){assert(!/\b(?:CM-ZWR-|ZWR-(?:READING|FINDING|EV|AUTH|COMP|RESOLUTION|SEMCLUSTER)|LIFE|SIBLINGS|SPOUSE|CHILDREN|WEALTH|HEALTH|TRAVEL|FRIENDS|CAREER|PROPERTY|WELLBEING|PARENTS)\b/.test(x),`internal or raw palace code leaked into customer copy: ${x}`)}}

const w56=j(`${base}/fixtures/ziwei-fp-w5-w6-validation-fixture-v1.json`);
const zh=await buildCase(w56.canonicalInput,{consentId:'CONSENT-ZIWEI-FP-W19',requestId:'REQ-ZIWEI-FP-W19',locale:'zh-Hans'});
const s=zh.surface;
assert.equal(s.schemaVersion,ex.outputSchema);
assert.equal(s.layout.type,ex.layoutType);
assert.equal(s.layout.rows,ex.layoutRows);
assert.equal(s.layout.cols,ex.layoutCols);
assert.equal(s.summary.palaceCount,ex.palaceCount);
assert.equal(s.defaultSelectedPalaceCode,ex.defaultSelectedPalaceCode);
assert.equal(s.summary.focusTaggedPalaceCount>=ex.minimumFocusTaggedPalaceCount,true);
assert.equal(s.summary.openBoundaryPalaceCount,ex.openBoundaryVisiblePalaceCount);
assert.equal(s.summary.openBoundaryCount,ex.openBoundaryCount);
assert.equal(s.summary.technicalEvidenceDefaultDisplay,ex.technicalEvidenceDefaultDisplay);
assert.equal(s.boundaries.oneInspectorOwnerPerPalace,true);
assert.equal(s.boundaries.secondEssayCreated,false);
assert.equal(s.boundaries.newMeaningCreated,false);
assert.equal(s.boundaries.customerCutoverAllowed,false);
assert.equal(s.palaces.length,12);
assert.equal(new Set(s.palaces.map(x=>x.palaceCode)).size,12);
assert.equal(new Set(s.palaces.map(x=>`${x.row}:${x.col}`)).size,12);
const life=s.palaces.find(x=>x.palaceCode==='LIFE'); assert.ok(life && life.focusTags.includes('LIFE_PALACE'));
const body=s.palaces.find(x=>x.focusTags.includes('BODY_PALACE')); assert.ok(body);
const daFocus=s.palaces.find(x=>x.focusTags.includes('DA_XIAN_FOCUS')); assert.ok(daFocus);
const lyFocus=s.palaces.find(x=>x.focusTags.includes('LIU_NIAN_FOCUS')); assert.ok(lyFocus);
assert.equal(s.palaces.filter(x=>x.hasOpenBoundary).length,6);
assert.equal(s.openBoundaries.items.length,8);
assertNoInternalCodesInCopy(customerStrings(s));
const s2=buildZiweiInteractiveChartSurface({customerReport:zh.report,locale:'zh-Hans'});
assert.equal(s.surfaceDigest,s2.surfaceDigest,'W19 deterministic surface digest drift');
const html=renderZiweiInteractiveChartSurfaceHtml(s);
assert.match(html,/Interactive twelve-palace chart|十二宫互动结构图/);
assert.match(html,/data-palace-button="LIFE"/);
assert.equal((html.match(/data-palace-button=/g)||[]).length,12);
assert.equal((html.match(/data-palace-panel=/g)||[]).length,12);
assert.match(html,/open-boundary-panel/);
assert.match(html,/Table fallback|表格后备读取/);

const en=await buildCase(w56.canonicalInput,{consentId:'CONSENT-ZIWEI-FP-W19-EN',requestId:'REQ-ZIWEI-FP-W19-EN',locale:'en'});
assert.equal(en.surface.locale,'en');
assert.equal(en.surface.summary.palaceCount,12);
assert.equal(en.surface.defaultSelectedPalaceCode,'LIFE');
assert.match(en.surface.centerPanel.title,/Interactive twelve-palace chart/i);
assert.equal(en.surface.openBoundaries.items.length,8);

assert.throws(()=>buildZiweiInteractiveChartSurface({customerReport:{...zh.report,schemaVersion:'OTHER'},locale:'zh-Hans'}),/ZIWEI_FP_W19_REQUIRES_W18_CUSTOMER_REPORT/);
assert.throws(()=>buildZiweiInteractiveChartSurface({customerReport:zh.report,locale:'en'}),/ZIWEI_FP_W19_LOCALE_MUST_MATCH_W18_REPORT/);
console.log('✓ ZIWEI-FP-W19 12-Palace Interactive Chart Surface passed.');
console.log(`  ${s.summary.palaceCount}/12 palaces laid out on ${s.layout.rows}×${s.layout.cols} branch grid; default selection ${s.defaultSelectedPalaceCode}.`);
console.log(`  Focus-tagged palaces ${s.summary.focusTaggedPalaceCount}; open-boundary palaces ${s.summary.openBoundaryPalaceCount}; visible open-boundary items ${s.summary.openBoundaryCount}.`);
console.log('  W19 consumes only the W18 customer report, keeps one inspector owner per palace, preserves open boundaries, and leaves technical evidence collapsed by default.');
console.log('  Human acceptance and customer cutover remain explicitly blocked until later works.');
