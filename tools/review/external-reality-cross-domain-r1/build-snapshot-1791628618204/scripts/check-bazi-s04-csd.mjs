import assert from 'node:assert/strict';
import fs from 'node:fs';
import {prepareBaZiS04T2,buildBaZiS04T2} from '../functions/personal-reading/narrative/bazi-s04-t2-runtime.js';
import {buildCareerNarrativeIR} from '../functions/personal-reading/narrative/bazi-s04-career-ir.js';
import {evaluateCustomerEditorialR4,EDITORIAL_R4_DIMENSIONS,removePersonalIdentifiers,crossSubjectDistinguishability,containsEditorialQuote} from '../functions/personal-reading/narrative/report-editorial-quality-r4.js';
import {verifyReportSectionComposition} from '../functions/personal-reading/narrative/report-section-semantic-verifier.js';
import {buildInputs,generateCampaignCases} from './lib/bazi-fp-w17-campaign.mjs';
import {buildBaziFullReading} from '../functions/api/bazi-full-reading.js';
import {buildBaziProfessionalSurfaceModules} from '../functions/personal-professional-reading/bazi-professional-surface-projection.js';
import {sha256Stable} from '../functions/interpretation-runtime/mir7-utils.js';
import {careerReviewState} from '../functions/personal-reading/narrative/bazi-s04-customer-value.js';
const source=JSON.parse(fs.readFileSync('docs/guided-report-successor-r2/bazi-source.json'));
const checks=['customer-specificity','reality-translation','scenario-density','section-thesis','name-removal','section-substitution','semantic-primitive-exposure','disclaimer-repetition','cross-subject-distinguishability','editorial-r4'];
const requested=process.argv[2]||'all';assert(requested==='all'||checks.includes(requested),'Unknown check');
const run=(name,fn)=>{if(requested==='all'||requested===name)fn();};
const {brief}=await prepareBaZiS04T2({...source,locale:'en',successor:true});
const zh=await prepareBaZiS04T2({...source,locale:'zh-Hans',successor:true});
const ir=brief.careerNarrativeIR;
const mockText='If a project adds deadlines without budget, delivery can require more rework. When a team provides review time, the same deliverable can be checked before the client relies on it.';
const exampleTexts=['If promotion expands accountability without authority, a role can become costly even when its title improves.','When delivery and client demands meet, the role can reward useful work while exposing gaps in support.','If project output increases without review time, delivery can incur rework because unresolved dependencies remain.','If a team offers a clear decision owner, approval delays can be resolved before deadlines conflict.','When a budget covers specialist help, a client project can support quality; without that help, the same fee may cover much more work.','If a client requests extra revisions, a defined scope can protect delivery time. When a promotion adds a team, authority over staffing can make the added accountability usable.','When current delivery and commercial emphases overlap, the natal work priorities can make budget negotiation more salient without implying an event.','If considering a role, first compare delivery scope with decision rights, then check team support and budget, and review missed deadlines after a trial.'];
const candidate={sourceBriefDigest:brief.briefSemanticDigest,blocks:brief.requiredClaimRoles.map((role,i)=>({role,function:role==='CAREER_THESIS'?'THESIS':role==='NAVIGATION'?'NAVIGATION':role==='TIMING_RELEVANCE'?'TIMING':role==='OBSERVABLE_EXPRESSION'?'SCENARIO':'MECHANISM',text:exampleTexts[i],claimRefs:brief.claims.filter(c=>c.role===role).map(c=>c.claimId),supportRefs:[...new Set(brief.claims.filter(c=>c.role===role).flatMap(c=>c.sourceRefs))]}))};
const review={meaningfullyUsedClaimRefs:brief.claims.map(c=>c.claimId),editorialAssessments:EDITORIAL_R4_DIMENSIONS.map(dimension=>({dimension,passed:true,evidence:exampleTexts[0],reason:''}))};
const metrics=c=>evaluateCustomerEditorialR4({brief,candidate:c,verification:{semanticReview:review}});
const good=metrics(candidate); // Control-flow fixture only; not semantic/live quality evidence.
run('customer-specificity',()=>{assert(ir.eligibility.eligible);assert.equal(good.customerSpecificityDensity.causalChains,3);assert(good.customerSpecificityDensity.synthesizedFacts>=2);for(const n of ir.nodes)assert(n.sourceClaimIds.every(id=>brief.authorityClaims.some(c=>c.claimId===id)));});
run('reality-translation',()=>{assert.equal(Object.keys(brief.translationCanon).length,5);assert.deepEqual(ir.nodes.map(n=>n.id),zh.brief.careerNarrativeIR.nodes.map(n=>n.id));assert(ir.nodes.every(n=>n.allowsObservedReality===false));assert.notEqual(brief.briefSemanticDigest,zh.brief.briefSemanticDigest);});
run('scenario-density',()=>{assert(ir.realWorldScenarios.length>=4);assert(new Set(ir.nodes.filter(n=>n.kind==='SCENARIO').map(n=>n.scenarioClass)).size>=4);const missing={...review,meaningfullyUsedClaimRefs:review.meaningfullyUsedClaimRefs.filter(id=>!id.includes(':SCENARIO:'))};assert(evaluateCustomerEditorialR4({brief,candidate,verification:{semanticReview:missing}}).reasons.includes('CUSTOMER_DEPTH_MISSING:scenarios'));});
run('section-thesis',()=>{assert.equal(good.customerSpecificityDensity.thesis,1);assert(metrics({...candidate,blocks:candidate.blocks.filter(b=>b.role!=='CAREER_THESIS')}).reasons.includes('CAREER_THESIS_INVALID'));});
run('name-removal',()=>{assert.equal(removePersonalIdentifiers('Alice 1990-01-01 12:30 46.2% role',['Alice']).trim(),'role');const generic={...candidate,blocks:candidate.blocks.map(b=>({...b,text:'Alice has a special path. You can grow and find balance. 46.2% matters.'}))};assert.equal(metrics(generic).nameRemoval,'FAIL');});
run('section-substitution',()=>{const generic={...candidate,blocks:candidate.blocks.map(b=>({...b,text:'Career can be a journey of balance. Work can bring opportunities and challenges.'}))};assert.equal(metrics(generic).sectionSubstitution,'FAIL');});
run('semantic-primitive-exposure',()=>{const c=structuredClone(candidate);c.blocks[0].text+=' Structural tension and carrying condition repeat structural tension.';assert(metrics(c).reasons.includes('SEMANTIC_PRIMITIVE_EXPOSURE'));});
run('disclaimer-repetition',()=>{const c=structuredClone(candidate);for(const b of c.blocks)b.text+=' This is a symbolic reading, not a prediction.';assert(metrics(c).reasons.includes('DISCLAIMER_REPETITION'));});
run('editorial-r4',()=>{assert(good.accepted,good.reasons.join(','));assert(!evaluateCustomerEditorialR4({brief,candidate,verification:{}}).accepted);const forged={...review,editorialAssessments:review.editorialAssessments.map(a=>({...a,evidence:'not in candidate'}))};assert(!evaluateCustomerEditorialR4({brief,candidate,verification:{semanticReview:forged}}).accepted);});
if(requested==='all'||requested==='cross-subject-distinguishability'){
 const rows=[];
 for(const spec of generateCampaignCases().slice(0,24)){
  const inputs=buildInputs(spec),full=await buildBaziFullReading({schemaVersion:'PHI-OS-BAZI-FULL-READING-REQUEST-v1.0.0',...inputs,locale:'en'});
  const reading={professionalModules:buildBaziProfessionalSurfaceModules({readingIR:full.readingIR,report:full.report,temporalState:'EXPLICIT'})};
  const p=await prepareBaZiS04T2({reading,locale:'en',successor:true});
  const text=p.brief.careerNarrativeIR.nodes.filter(n=>['CAUSAL_CHAIN','SCENARIO','TIMING'].includes(n.kind)).map(n=>n.text).join('\n');
  const signature=p.brief.careerNarrativeIR.nodes.filter(n=>n.kind==='CAUSAL_CHAIN').map(n=>n.ruleId).join('|');
  if(signature&&!rows.some(r=>r.signature===signature))rows.push({id:spec.caseId,signature,ir:p.brief.careerNarrativeIR,text});
 }
 const distinction=crossSubjectDistinguishability(rows);assert(Object.values(distinction.diversity).every(n=>n>=2));
 // The raw reusable canon is deliberately NOT a final customer report. The
 // guard must catch its overlap, even though source-selected mechanisms differ.
 assert.equal(distinction.accepted,false,'Raw canon must not be mislabeled distinct final prose');
 const identical=rows.map(r=>({...r,ir:rows[0].ir,text:rows[0].text}));assert(!crossSubjectDistinguishability(identical).accepted);
 console.log(JSON.stringify({syntheticCharts:24,distinctMechanismProfiles:rows.length,diversity:distinction.diversity,rawCanonRejected:true,finalCustomerProseComparison:'REQUIRES_GENERATED_REVIEW_CANDIDATES'},null,2));
}
if(requested==='all'){
 assert(containsEditorialQuote('A role can improve delivery; the budget remains bounded.','The budget remains bounded.'));
 assert(containsEditorialQuote('A role can improve delivery; the budget remains bounded.','A role can improve delivery.'));
 assert(!containsEditorialQuote('A role can improve delivery; the budget remains bounded.','A role guarantees delivery.'));
 assert.equal(careerReviewState({technicalPass:true,editorialPass:true}).ownerAcceptance,'PENDING');
 assert.equal(careerReviewState({technicalPass:true,editorialPass:true,ownerDecision:'REJECT'}).editorialStatus,'EDITORIAL_REJECT');
 assert.equal(careerReviewState({technicalPass:false,editorialPass:true,ownerDecision:'ACCEPT'}).editorialStatus,'EDITORIAL_NOT_ELIGIBLE');
 assert.equal(careerReviewState({technicalPass:true,editorialPass:true,ownerDecision:'ACCEPT'}).productionActivated,false);
 const predecessor=(await prepareBaZiS04T2({...source,locale:'en'})).brief;
 await assert.rejects(buildCareerNarrativeIR({brief:{...predecessor,sectionKey:'S05_WEALTH'}}),/CSD_S04_ONLY/);
 const missing=structuredClone(source);missing.reading.professionalModules.professionalTopics.topics[0].carryingContext={overallTendency:'UNKNOWN',rootCount:0,supportVisible:0,outwardVisible:0,pressureVisible:0};
 const ineligible=await buildBaZiS04T2({...missing,locale:'en',successor:true,providerAdapters:{OPENAI:()=>{throw Error('must not call')}}});assert.equal(ineligible.status,'NOT_ELIGIBLE');assert.equal(ineligible.internalOnly.providerCalled,false);
 assert.equal((await verifyReportSectionComposition({brief,candidate})).accepted,false);
 for(const [text,forbidden]of [['In a specialist role, agree who will review the deliverable and when it will be released.',false],['高要求的交付不必然有害，若有复核时间，岗位可以更可持续。',false],['You will get promoted next year.',true],['你必然成功。',true]]){
  const c=structuredClone(candidate);c.blocks[0].text=text;const v=await verifyReportSectionComposition({brief,candidate:c});assert.equal(v.reasons.some(x=>x.startsWith('CERTAINTY_STRENGTHENING:')),forbidden);
 }
 const mutated=structuredClone(brief);mutated.careerNarrativeIR.nodes[0].text='tampered';assert((await verifyReportSectionComposition({brief:mutated,candidate})).reasons.includes('SOURCE_LINEAGE_LOSS'));
 const seed={...brief};delete seed.briefSemanticDigest;assert.equal(await sha256Stable(seed),brief.briefSemanticDigest);
}
console.log(`PASS: S04 CSD ${requested}; deterministic and injected review tests, no paid requests.`);
