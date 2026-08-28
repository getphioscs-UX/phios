import assert from 'node:assert/strict';
import fs from 'node:fs';
import {composeCustomerThemes} from '../functions/single-method-reading-r2/customer-theme-composer.js';
import {deduplicateClaims} from '../functions/single-method-reading-r2/claim-deduplicator.js';
import {resolveSectionInformationGain} from '../functions/single-method-reading-r2/section-information-gain-resolver.js';
import {preserveContradictions} from '../functions/single-method-reading-r2/contradiction-preservation.js';
import {buildCustomerNarrativeIR} from '../functions/single-method-reading-r2/customer-narrative-ir.js';

const contract=JSON.parse(fs.readFileSync('content/customer-experience-rebuild/r12r4b/smr-r2/contracts/customer-reading-narrative-ir-v1.json','utf8'));
const schema=JSON.parse(fs.readFileSync('content/customer-experience-rebuild/r12r4b/smr-r2/contracts/customer-reading-narrative-ir-v1.schema.json','utf8'));
assert.equal(contract.irSchemaVersion,'PHI-OS-CUSTOMER-READING-NARRATIVE-IR-v1.0.0');
assert.equal(contract.rules.genericIntroAllowed,false);
assert.equal(contract.rules.genericEndingAllowed,false);
assert.equal(contract.rules.repeatedMethodDisclaimerAllowed,false);
assert.equal(contract.rules.suppressedDuplicateMayRender,false);
assert.equal(contract.rules.contextDerivativeTextMustDifferFromPrimaryExplanation,true);

const claim=(id,{type='CORE_PATTERN',priority='SECONDARY',score=70,domains=['IDENTITY_EXPRESSION'],conditions=[],counter=[],text=`Accepted meaning ${id}`}={})=>({
  schemaVersion:'PHI-OS-CUSTOMER-READING-CLAIM-IR-v1.0.0',claimId:`C-${id}`,methodId:'AST',semanticDimension:`METHOD_NATIVE:AST:${id}`,claimType:type,headline:`Headline ${id}`,structuralMeaning:text,
  findingRefs:[],interpretationUnitRefs:[`U-${id}`],evidenceRefs:[`P-${id}`,`M-${id}`],counterEvidenceRefs:counter,priorityClass:priority,priorityScore:score,priorityReasonRefs:[`PRIORITY-${id}`],noveltyClass:'UNASSESSED',confidenceClass:'ADMITTED_AUTHORITY',conditions,boundaries:[],questionRelevance:{state:'RESOLVED_RELEVANT',intentId:'OPEN',score:0},sectionCandidates:[],customerDomains:domains,
  lineage:{productionAdmissionRef:'ADM',readingAuthorityRef:'READ',interpretationUnitRefs:[`U-${id}`],projectionRefs:[`P-${id}`],meaningRefs:[`M-${id}`],ruleRefs:[`R-${id}`],boundaryRefs:[],semanticDigest:'SEM'}
});
const claims=[
  claim('A',{type:'SUPPORT',priority:'PRIMARY',score:100,domains:['IDENTITY_EXPRESSION'],text:'Accepted support meaning A.'}),
  claim('B',{type:'TENSION',priority:'SECONDARY',score:76,domains:['IDENTITY_EXPRESSION'],text:'Accepted tension meaning B.'}),
  claim('C',{type:'CONDITION',priority:'SECONDARY',score:72,domains:['ENVIRONMENT_DIRECTION'],conditions:['QUESTION:When does this pattern change in reality?'],text:'Accepted conditional meaning C.'}),
  claim('D',{type:'CORE_PATTERN',priority:'SUPPORTING',score:48,domains:['WORK_RESOURCES'],text:'Accepted work meaning D.'}),
  claim('E',{type:'CORE_PATTERN',priority:'SUPPORTING',score:46,domains:['COMMUNICATION_EXCHANGE'],text:'Accepted communication meaning E.'}),
  claim('F',{type:'TRADEOFF',priority:'SUPPORTING',score:44,domains:['RELATIONSHIP_EXCHANGE'],counter:['CE-F'],text:'Accepted counterbalanced meaning F.'})
];
const priorityResolution={schemaVersion:'PHI-OS-CUSTOMER-READING-PRIORITY-RESOLUTION-v1.0.0',methodId:'AST',readingAuthorityRef:'READ',semanticDigest:'SEM',priorityRuleVersion:'TEST',claims,firstScreenClaimRefs:['C-A','C-B','C-C'],boundary:{}};
const themes=composeCustomerThemes({priorityResolution});
const claimDedup=deduplicateClaims({claims});
const info=resolveSectionInformationGain({priorityResolution,themeCollection:themes});
const contradiction=preserveContradictions({priorityResolution,themeCollection:themes,claimDedup});
const first=buildCustomerNarrativeIR({priorityResolution,themeCollection:themes,sectionInformationGain:info,contradictionPreservation:contradiction});
const second=buildCustomerNarrativeIR({priorityResolution,themeCollection:themes,sectionInformationGain:info,contradictionPreservation:contradiction});
assert.deepEqual(first,second);
assert.equal(first.schemaVersion,schema.properties.schemaVersion.const);
for(const key of schema.required)assert.ok(Object.prototype.hasOwnProperty.call(first,key),`Narrative IR missing required field ${key}`);
assert.deepEqual(Object.keys(first).sort(),Object.keys(schema.properties).sort());
assert.equal(first.boundary.admittedClaimTextOnly,true);
assert.equal(first.boundary.newMeaningCreated,false);
assert.equal(first.boundary.genericIntroCreated,false);
assert.equal(first.boundary.genericEndingCreated,false);
assert.equal(first.boundary.repeatedMethodDisclaimer,false);
assert.equal(first.boundary.suppressedDuplicateRenderable,false);
assert.equal(first.boundary.contextDerivativeTextMustDiffer,true);
assert.equal(first.closingText,null);
assert.equal(first.technicalAppendix.defaultCollapsed,true);
assert.ok(first.primaryThemes.length>0);
assert.ok(first.supportTensionSummary.support.length>0);
assert.ok(first.supportTensionSummary.tension.length>0);
assert.ok(first.supportTensionSummary.conditional.length>0);
assert.ok(first.supportTensionSummary.counterbalanced.length>0);
assert.ok(first.observationQuestions.includes('QUESTION:When does this pattern change in reality?'));
assert.ok(first.deeperSections.some(section=>section.sectionId==='CORE_THEMES'));
assert.ok(first.deeperSections.some(section=>section.sectionId==='WORK'));
assert.ok(first.whyThisReading.every(item=>item.priorityReasonRefs.length>0&&item.evidenceRefs.length>0&&item.lineageRefs.length>0));
const admittedTexts=new Set(claims.flatMap(item=>[item.structuralMeaning,...item.conditions.flatMap(condition=>condition&&typeof condition==='object'?[condition.structuralReason,condition.relationContext,condition.constructiveExpression,condition.frictionExpression,...(condition.activationConditions||[]),...(condition.observableSignals||[]),...(condition.alternativeInterpretations||[])]:[])]).filter(Boolean));
const blocks=[];
const visit=value=>{if(!value||typeof value!=='object')return;if(value.narrativeRef)blocks.push(value);for(const nested of Object.values(value))if(nested&&typeof nested==='object')visit(nested)};
visit(first);
for(const block of blocks){
  if(block.renderable){assert.ok(block.text);assert.ok(admittedTexts.has(block.text),`Narrative text was not admitted claim text: ${block.text}`)}
  else assert.equal(block.text,null);
}
const renderableTexts=blocks.filter(block=>block.renderable).map(block=>block.text);
assert.equal(new Set(renderableTexts).size,renderableTexts.length,'Renderable narrative contains exact duplicate text.');
assert.ok(first.narrativeDedup.suppressedDuplicateCount>0);
assert.equal(first.narrativeDedup.contextDerivativeTextMustDiffer,true);
console.log('✓ CX-R12R4B SMR-R2 W8 Customer Narrative IR passed: admitted-text-only narrative, preserved tension/conditions, deterministic dedup, structured why-this-reading and collapsed technical appendix.');
