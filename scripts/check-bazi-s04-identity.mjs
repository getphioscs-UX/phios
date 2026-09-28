import fs from 'node:fs';
import assert from 'node:assert/strict';
import {prepareBaZiS04T2} from '../functions/personal-reading/narrative/bazi-s04-t2-runtime.js';
import {checkCareerIdentityStructure,compareCareerIdentities,evaluateCareerIdentity,CAREER_IDENTITY_DIMENSIONS} from '../functions/personal-reading/narrative/bazi-s04-identity-quality.js';
import {containsEditorialQuote,editorialSentences} from '../functions/personal-reading/narrative/report-editorial-quality-r4.js';
import {compressCareerCandidate} from '../functions/personal-reading/narrative/bazi-s04-career-compression.js';
import {extendCareerIdentityBrief} from '../functions/personal-reading/narrative/bazi-s04-career-identity.js';
import {buildInputs,generateCampaignCases} from './lib/bazi-fp-w17-campaign.mjs';
import {buildBaziFullReading} from '../functions/api/bazi-full-reading.js';
import {buildBaziProfessionalSurfaceModules} from '../functions/personal-professional-reading/bazi-professional-surface-projection.js';
import {sha256Stable} from '../functions/interpretation-runtime/mir7-utils.js';
import {verifyReportSectionComposition} from '../functions/personal-reading/narrative/report-section-semantic-verifier.js';
import {naturalizeCareerLabels} from '../functions/personal-reading/narrative/bazi-s04-career-compression.js';
const checks=['career-identity','value-creation','multi-mechanism','advantage-specificity','role-function-differentiation','scenario-diversity-v2','scenario-semantic-similarity','timing-contrast-v3','decision-priority','generic-work-advice','v3-editorial'];
assert(['all',...checks].includes(process.argv[2]||'all'));
// Aliases deliberately execute the complete small contract suite: no partial
// green result can authorize spending while another identity contract is broken.
const source=JSON.parse(fs.readFileSync('docs/guided-report-successor-r2/bazi-source.json'));
const {brief}=await prepareBaZiS04T2({...source,locale:'en',successor:'v3'}),ir=brief.careerNarrativeIR;
const zh=(await prepareBaZiS04T2({...source,locale:'zh-Hans',successor:'v3'})).brief;
assert(checkCareerIdentityStructure(ir).accepted);assert(ir.eligibility.eligible);
assert.deepEqual(ir.nodes.map(n=>n.id),zh.careerNarrativeIR.nodes.map(n=>n.id));
const {briefSemanticDigest,...seed}=brief;assert.equal(await sha256Stable(seed),briefSemanticDigest);
assert.deepEqual(ir.activeMechanisms.map(m=>m.mechanismClass),['RESPONSIBILITY_MECHANISM','SUPPORT_EXPERTISE_MECHANISM','RESOURCE_COMMERCIAL_MECHANISM','OUTPUT_MECHANISM']);
assert.equal(ir.autonomyPattern.length,0,'Do not infer active peer identity merely from a relational interface');
for(const n of ir.nodes){assert(n.sourceClaimIds.length&&n.sourceRefs.length);assert(n.sourceClaimIds.every(id=>brief.authorityClaims.some(c=>c.claimId===id)));}
const time=ir.nodes.find(n=>n.kind==='TIMING');assert.equal(time.daYunAmplifiedMechanism.primaryGroup,'OUTPUT');assert.equal(time.annualAmplifiedMechanism.primaryGroup,'WEALTH');assert.equal(time.natalCareerBaseline.dominant,'CSD:V3:OFFICER');
const mutate=fn=>{const x=structuredClone(ir);fn(x);assert(!checkCareerIdentityStructure(x).accepted);};
mutate(x=>x.careerOperatingStyle=null);mutate(x=>x.distinctCareerAdvantages=[]);mutate(x=>x.roleSpectrum=[]);mutate(x=>x.careerIdentityEvidence=[]);mutate(x=>x.careerDecisionPriorities=[]);
mutate(x=>x.nodes.filter(n=>n.kind==='SCENARIO').forEach(n=>n.conclusionClass='RESPONSIBILITY_WITHOUT_RESOURCES'));
mutate(x=>x.nodes.filter(n=>n.kind==='SCENARIO').forEach(n=>n.mechanismClass='RESPONSIBILITY_MECHANISM'));
mutate(x=>delete x.nodes.find(n=>n.kind==='TIMING').annualAmplifiedMechanism);
mutate(x=>x.mechanismInteractions[0].from='INVENTED');mutate(x=>x.nodes.find(n=>n.kind==='CAUSAL_CHAIN').sourceFacts=[]);
const v2=(await prepareBaZiS04T2({...source,locale:'en',successor:true})).brief;
const missing=structuredClone(v2);for(const k of Object.keys(missing.authorityFacts))if(k.endsWith('/relevantGroups'))missing.authorityFacts[k]=[];
const sparse=await extendCareerIdentityBrief(missing);assert(!sparse.careerNarrativeIR.eligibility.eligible,'Missing mechanisms cannot be filled with generic advice');
const generic='Get enough authority. Get enough support. Define scope. Avoid overload.';
const fake={blocks:[{text:generic}]},review={meaningfullyUsedClaimRefs:brief.claims.map(c=>c.claimId),editorialAssessments:CAREER_IDENTITY_DIMENSIONS.map(dimension=>({dimension,passed:true,evidence:'Get enough authority.'})),careerSentenceLabels:editorialSentences(generic).map((_,sentenceIndex)=>({sentenceIndex,category:'GENERIC_WORK_ADVICE'}))};
const gate=r=>evaluateCareerIdentity({brief,candidate:fake,review:r,containsQuote:containsEditorialQuote,sentences:editorialSentences});
assert(gate(review).reasons.includes('GENERIC_WORK_ADVICE_DOMINATES'));assert(!gate({...review,careerSentenceLabels:[]}).accepted);assert(!gate({...review,meaningfullyUsedClaimRefs:[]}).accepted);
const compressed=await compressCareerCandidate({blocks:[{text:'A useful result can build value. A useful result can build value. Depth can make that result repeatable.',claimRefs:['x']}]});assert.equal(compressed.audit.exactRepeatedSentencesRemoved,1);assert(compressed.candidate.blocks[0].text.includes('Depth'));assert.deepEqual(compressed.candidate.blocks[0].claimRefs,['x']);
const lexicalFixture={sourceBriefDigest:brief.briefSemanticDigest,blocks:brief.requiredClaimRoles.map(role=>({role,function:'MECHANISM',text:'If a role uses expertise, value can form through diagnosis, explanation, or method. 不证明实际能力，不表示某个事件必然发生，不等于输出机制必然主导。 These are examples, not predictions of what will happen.',claimRefs:brief.claims.map(c=>c.claimId),supportRefs:[...new Set(brief.claims.flatMap(c=>c.sourceRefs))]}))};
let reviewerReached=false;await verifyReportSectionComposition({brief,candidate:lexicalFixture,semanticReview:async()=>{reviewerReached=true;return {};}});assert(reviewerReached,'Scoped negative and work-analysis phrases must reach full semantic review');
for(const forbidden of ['You will get promoted.','你一定会成功。','你必然获得收入。','A diagnosis of depression is shown in your chart.']){const bad=structuredClone(lexicalFixture);bad.blocks[0].text+=' '+forbidden;let reached=false;const result=await verifyReportSectionComposition({brief,candidate:bad,semanticReview:async()=>{reached=true;return {};}});assert(!reached);assert(result.reasons.some(x=>/CERTAINTY|GUARANTEED|DIAGNOSIS/.test(x)));}
const naturalized=await naturalizeCareerLabels({blocks:[{text:'self-position and carrying picture; delivery proves judgment.',claimRefs:['source']}]},'en');assert.equal(naturalized.audit.changes.length,3);assert.deepEqual(naturalized.candidate.blocks[0].claimRefs,['source']);assert.equal(naturalized.audit.additionalComposerCalls,0);assert.notEqual(naturalized.audit.beforeDigest,naturalized.audit.afterDigest);
const rows=[{id:'BASELINE_NOW',ir}];
for(const spec of generateCampaignCases().slice(0,24)){
 const full=await buildBaziFullReading({schemaVersion:'PHI-OS-BAZI-FULL-READING-REQUEST-v1.0.0',...buildInputs(spec),locale:'en'});
 const reading={professionalModules:buildBaziProfessionalSurfaceModules({readingIR:full.readingIR,report:full.report,temporalState:'EXPLICIT'})};
 const p=await prepareBaZiS04T2({reading,locale:'en',successor:'v3'});rows.push({id:spec.caseId,ir:p.brief.careerNarrativeIR});
}
const comparison=compareCareerIdentities(rows);assert(comparison.accepted,JSON.stringify(comparison.diversity));assert(!compareCareerIdentities([{id:'a',ir},{id:'b',ir},{id:'c',ir}]).accepted);
if(process.env.RNT2_IDENTITY_TEST_OUTPUT)fs.writeFileSync(process.env.RNT2_IDENTITY_TEST_OUTPUT,JSON.stringify({suite:'S04 V3 contracts',passed:true,checks,crossSubject:comparison,liveGenerationCalls:0},null,2)+'\n');
console.log(JSON.stringify({passed:true,checks:checks.length,syntheticCharts:24,diversity:comparison.diversity,scope:comparison.scope,paidRequests:0},null,2));
