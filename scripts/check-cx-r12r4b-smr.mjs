import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveSingleMethodReadingEligibility} from '../functions/single-method-reading/single-method-reading-eligibility.js';
import {resolveInterpretationPriorities} from '../functions/single-method-reading/single-method-priority-resolver.js';
import {clusterSingleMethodThemes} from '../functions/single-method-reading/single-method-theme-clusterer.js';
import {inspectSingleMethodReadingQuality} from '../functions/single-method-reading/single-method-reading-quality.js';
import {SMR_METHOD_PRIORITY_REGISTRY,SMR_SECTION_REGISTRY,SMR_VERSIONS} from '../functions/single-method-reading/smr-registry-v1.js';
import {SMR_PRODUCTION_ADMISSION} from '../functions/single-method-reading/single-method-reading-production.js';
import {onRequestPost as customerPersonalReality} from '../functions/api/customer-personal-reality.js';

const ROOT='content/customer-experience-rebuild/r12r4b/smr';
const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const text=path=>fs.readFileSync(path,'utf8');
const list=value=>Array.isArray(value)?value:[];
const requested=process.argv[2]||'all';
const gates=new Map();
const gate=(name,fn)=>gates.set(name,fn);
const reports=()=>read(`${ROOT}/review/smr-human-review-cases-v1.json`).cases.map(item=>item.report);

gate('authority',()=>{
  const baseline=read(`${ROOT}/smr-baseline-v1.json`),authority=read(`${ROOT}/smr-authority-map-v1.json`),decision=read(`${ROOT}/smr-no-duplicate-decision-v1.json`),contract=read(`${ROOT}/single-method-reading-contract-v1.json`),production=read(`${ROOT}/admission/smr-production-admission-v1.json`);
  assert.equal(baseline.baselineCommit,'c3f6acf106cd84507d2861b550e41ecbb6662028');assert.deepEqual(baseline.supportedMethods,['AST','BZR','NUM','ZWR']);assert.equal(authority.authorityBoundary.acceptedInterpretationUnitsOnly,true);assert.equal(authority.authorityBoundary.rawProjectionToCustomerConclusion,false);assert.equal(contract.schemaVersion,SMR_VERSIONS.contract);assert.equal(decision.decision,'REUSE_CURRENT_ACCEPTED_INTERPRETATION_AUTHORITY');
  for(const file of decision.forbiddenArtifacts.filter(item=>item.endsWith('.json')))assert.equal(fs.existsSync(`${ROOT}/${file}`),false);
  const blocked=resolveSingleMethodReadingEligibility({methodResult:{methodId:'NUM',state:'STRUCTURE_ONLY',technical:{acceptanceBasis:null}},acceptedInterpretationResult:{interpretationUnits:[]}});assert.equal(blocked.eligible,false);assert.equal(blocked.state,'SINGLE_METHOD_READING_NOT_READY');
  assert.equal(production.productionAllowed,false);assert.equal(SMR_PRODUCTION_ADMISSION.productionAllowed,false);assert.equal(production.blocker,SMR_PRODUCTION_ADMISSION.blocker);
});

gate('priority',()=>{
  assert.equal(SMR_METHOD_PRIORITY_REGISTRY.boundary.randomSort,false);const report=reports()[0],units=report.technicalAppendix.interpretationUnits.map(unit=>({...unit,title:unit.unitId,semanticTags:unit.domainTags,priority:'PRIMARY',relationType:'SUPPORT'}));const first=resolveInterpretationPriorities({methodId:report.methodId,interpretationUnits:units,customerIntent:{intentId:'WORK',prompt:'work and resources'}}),second=resolveInterpretationPriorities({methodId:report.methodId,interpretationUnits:units,customerIntent:{intentId:'WORK',prompt:'work and resources'}});assert.deepEqual(first.units.map(unit=>[unit.unitId,unit.priorityScore,unit.priorityReasons]),second.units.map(unit=>[unit.unitId,unit.priorityScore,unit.priorityReasons]));
});

gate('theme-clustering',()=>{
  const machine=read(`${ROOT}/machine/smr-machine-campaign-v1.json`);assert.equal(machine.caseCount,64);assert.deepEqual(machine.methodCounts,{AST:16,BZR:16,NUM:16,ZWR:16});assert.deepEqual(machine.actualTotals,machine.requiredTotals);assert(machine.cases.every(item=>item.themeIds.length>=3&&item.themeIds.length<=7));
  const sample=reports()[0],units=sample.technicalAppendix.interpretationUnits.map((unit,index)=>({...unit,title:unit.unitId,semanticTags:unit.domainTags,priorityScore:100-index,relationType:'SUPPORT',realityComparisonQuestions:[],alternativeInterpretations:[]}));const first=clusterSingleMethodThemes({methodId:sample.methodId,prioritizedUnits:units}),second=clusterSingleMethodThemes({methodId:sample.methodId,prioritizedUnits:units});assert.deepEqual(first.themes.map(theme=>[theme.themeId,theme.interpretationUnitRefs]),second.themes.map(theme=>[theme.themeId,theme.interpretationUnitRefs]));
});

function methodGate(methodId,requiredCoverage){const items=reports().filter(report=>report.methodId===methodId);assert.equal(items.length,12);for(const report of items){assert.equal(report.schemaVersion,SMR_VERSIONS.ir);assert.equal(report.coreThemes.length>=3,true);for(const key of requiredCoverage)assert.equal(report.technicalAppendix.formulaCoverage[key],true,`${methodId} missing ${key}`);assert.equal(report.governance.crossMethodComposition,false)}}
gate('ast',()=>methodGate('AST',['planetFunction','actualHouse','aspects','wholeChartPriority']));
gate('bzr',()=>methodGate('BZR',['pillarRole','dayReference','monthCommand','relations']));
gate('zwr',()=>methodGate('ZWR',['palaceDomain','stars','transformations','lifeBody','palaceNetwork']));
gate('num',()=>methodGate('NUM',['numberRole','canonicalMeaning','reductionPath']));

gate('lineage',()=>{for(const report of reports()){for(const section of report.sections)for(const paragraph of section.paragraphs)assert(paragraph.interpretationUnitRefs.length||paragraph.compositionRef);for(const why of report.whyThisReading){assert(why.interpretationUnitRefs.length);assert(why.projectionRefs.length);assert(why.meaningRefs.length);assert(why.derivationRefs.length)}assert(report.lineage.reportDigest);assert.equal(report.quality.metrics.paragraphCount,report.quality.metrics.lineageBoundParagraphCount)}});
gate('no-generic-filler',()=>{for(const report of reports()){const result=inspectSingleMethodReadingQuality(report);assert.equal(result.failures.some(item=>item==='SMR_GENERIC_FILLER'),false);assert.equal(result.failures.some(item=>item==='SMR_ABSOLUTE_CLAIM'),false);assert.equal(result.metrics.boundaryRepetitionCount<=1,true)}});
gate('no-unsupported-timing',()=>{for(const report of reports()){assert.equal(report.timing.status,'NOT_ESTABLISHED');assert.equal(report.sections.find(item=>item.sectionId==='TIMING').state,'NOT_APPLICABLE');assert.equal(inspectSingleMethodReadingQuality(report).failures.includes('SMR_UNSUPPORTED_TIMING'),false)}});
gate('customer-language',()=>{const forbidden=/\b(?:CUSTOMER_PUBLISHABLE|COMPOSITION_SUPPORTED|MEANING_AVAILABLE|SOURCE_ADMITTED|projectionDigest|semanticDigest)\b/;for(const report of reports()){const primary={executiveReading:report.executiveReading,coreThemes:report.coreThemes,sections:report.sections,observableSignals:report.observableSignals,realityQuestions:report.realityQuestions,whyThisReading:report.whyThisReading};assert.doesNotMatch(JSON.stringify(primary),forbidden)}const renderer=text('assets/customer-ui/js/surfaces/single-method-reading.js');assert(renderer.includes("tr('Why this reading?','为什么这样读？')"));assert.doesNotMatch(renderer,/projectionDigest|semanticDigest|CUSTOMER_PUBLISHABLE/)});

gate('e2e',async()=>{
  const machine=read(`${ROOT}/machine/smr-machine-campaign-v1.json`),review=read(`${ROOT}/review/smr-human-review-cases-v1.json`),results=read(`${ROOT}/review/smr-human-review-results-v1.json`),human=read(`${ROOT}/admission/smr-human-acceptance-v1.json`),production=read(`${ROOT}/admission/smr-production-admission-v1.json`);
  assert.equal(machine.status,'64_OF_64_MACHINE_ACCEPTED');assert.equal(review.caseCount,48);assert.equal(results.results.length,48);assert.equal(results.status,'PENDING_HUMAN_REVIEW');assert.deepEqual({accepted:human.accepted,pending:human.pending},{accepted:0,pending:48});assert.equal(production.customerCutoverAllowed,false);
  const response=await customerPersonalReality({request:new Request('https://phios.local/api/customer-personal-reality',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({birthDate:'1990-01-15',birthTimeUnknown:true,methods:['numeric'],consent:true,locale:'en',intent:'Understand direction.'})}),env:{}});const payload=await response.json();assert.equal(response.status,200);assert.equal(payload.view.reading.methods[0].state,'READY_TO_READ');assert.equal(Object.hasOwn(payload.view,'singleMethodReading'),true);assert.equal(payload.view.singleMethodReading?.schemaVersion,'PHI-OS-SINGLE-METHOD-READING-R2-PRODUCTION-v1.0.0');assert.equal(payload.view.singleMethodReading?.state,'PRODUCTION');assert.equal(Object.hasOwn(payload.view.reading.methods[0],'singleMethodReading'),false);assert.deepEqual(payload.view.reading.combinedReading,{state:'NOT_STARTED',crossMethodCompositionPerformed:false});
  const page=text('perspectives/personal/index.html');assert(page.includes('data-cx-tab="my-reading"'));assert(page.includes('data-cx-single-method-reading'));assert(page.includes('/assets/customer-ui/surfaces/single-method-reading.css'));
});

async function run(name){const fn=gates.get(name);assert(fn,`unknown SMR gate ${name}`);await fn();console.log(`✓ CX-R12R4B-SMR ${name} passed.`)}
if(requested==='all'){for(const name of gates.keys())await run(name);console.log('  Legacy SMR v1 remains frozen historical evidence (64/64 machine; 48 human pending); customer single-select production is now served by admitted SMR-R2.')}else await run(requested);
