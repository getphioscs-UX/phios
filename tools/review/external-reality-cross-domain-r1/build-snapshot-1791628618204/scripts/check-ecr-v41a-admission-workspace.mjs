import fs from 'node:fs';import assert from 'node:assert/strict';
import {sha256Stable,stableStringify} from '../functions/interpretation-runtime/mir7-utils.js';
import {resolveEcrSemanticComposition,isEcrHumanAdmitted} from '../functions/embodied-configuration/ecr-semantic-composition-r2.js';
import {selectEcrRuntimeSlotCards} from '../functions/ecr-phi-card/ecr-human-runtime-cards-v4-1.js';
import {evaluateEcrV41ProductionBlockers} from '../functions/embodied-configuration/ecr-v41-production-blockers-r2.js';
import {buildEcrHumanRuntime} from '../functions/embodied-configuration/ecr-canonical-projection-runtime-v2.js';
import {buildEcrHumanRuntimeReport} from '../functions/ecr-full-report/ecr-human-runtime-report-v4-1.js';
import {projectEcrTopicSuccessorSelection} from '../functions/embodied-configuration/ecr-topic-successor-projection.js';
const read=p=>JSON.parse(fs.readFileSync(p)),root='content/embodied-configuration/v4-1/semantic-admission-r2/',admission='content/embodied-configuration/v4-1/admission/';
const pkg=read('docs/ecr-human-runtime-v4-1/semantic-review-pairs.json'),canonical=read('content/embodied-configuration/v4-1/review/human-review-cases-v1.json');
assert.equal(pkg.pairs.length,14);assert.equal(pkg.localeCount,28);assert.equal(canonical.reviewPairs.length,14);assert.equal(canonical.candidates,undefined);
for(const p of pkg.pairs){assert.equal(p.decision,'PENDING');assert.equal(p.en.sectionId,p.zhHans.sectionId);assert.equal(await sha256Stable(p.en),p.contentDigests.en);assert.equal(await sha256Stable(p.zhHans),p.contentDigests['zh-Hans']);assert.equal(await sha256Stable(p.contentDigests),p.pairDigest);assert.equal(canonical.reviewPairs.find(c=>c.sectionId===p.sectionId).pairDigest,p.pairDigest);}
const policy=read(root+'composition-policy.json');
assert.deepEqual(['gateBases','lineModifiers','planetaryDriverRoles','layerRoles'].map(k=>policy[k].length),[64,6,12,2]);assert.equal(policy.runtimeOwnerRules.length,0);
assert.equal(resolveEcrSemanticComposition({gate:41,line:1,driverId:'D01',layer:'PERSONALITY'},policy,[]).status,'UNKNOWN');
// Synthetic in-memory reviews exercise admission guards; never persist these as human evidence.
const admit=content=>{const {humanReview,...rest}=content,c={...rest,status:'ACCEPTED'};return {...c,humanReview:{decision:'ACCEPT',reviewer:'SYNTHETIC_TEST_ONLY',reviewedAt:'TEST',evidenceRef:'TEST_ONLY',acceptedContent:stableStringify(c)}};};
const groups=['gateBases','lineModifiers','planetaryDriverRoles','layerRoles'],keys=[41,1,'D01','PERSONALITY'];
const fixture=Object.fromEntries(groups.map((g,i)=>[g,[admit({factorId:g,key:keys[i],meaningRef:'TEST',sourceRefs:['TEST'],semanticTags:['TEST_'+g]})]]));
fixture.tagRules=[admit({requiredTags:groups.map(g=>'TEST_'+g),outputTags:['TEST_TAG']})];fixture.runtimeOwnerRules=[admit({requiredTags:['TEST_TAG'],primaryOwner:'TEST_OWNER',customerMeaningRef:'TEST_MEANING'})];
const input={gate:41,line:1,driverId:'D01',layer:'PERSONALITY'};
assert.equal(resolveEcrSemanticComposition(input,fixture,['TEST_OWNER']).status,'ADMITTED_COMPOSITION');
for(const delta of [{gate:19},{line:2},{driverId:'D02'},{layer:'DESIGN'}])assert.equal(resolveEcrSemanticComposition({...input,...delta},fixture,['TEST_OWNER']).status,'UNKNOWN');
assert.equal(resolveEcrSemanticComposition(input,fixture,['OTHER_OWNER']).status,'UNKNOWN');
const reusable=structuredClone(fixture);reusable.gateBases.push(admit({factorId:'OTHER_BASE',key:19,meaningRef:'TEST',sourceRefs:['TEST'],semanticTags:['TEST_gateBases']}));
assert.equal(resolveEcrSemanticComposition({...input,gate:19},reusable,['TEST_OWNER']).status,'ADMITTED_COMPOSITION');
const changed=structuredClone(fixture);changed.gateBases[0].meaningRef='CHANGED';assert(!isEcrHumanAdmitted(changed.gateBases[0]));assert.equal(resolveEcrSemanticComposition(input,changed,['TEST_OWNER']).status,'UNKNOWN');
const deck=read('content/ecr-phi-card/ecr-phi-card-deck-registry-v2.json'),cards=read(root+'card-eligibility.json');
assert.equal(cards.runtimeSlotEligibility.length,48);assert.deepEqual(deck.groups.map(g=>g.groupId),['CORE','DRIVER','GIFT','TENSION','FIELD','PHASE']);assert(cards.runtimeSlotEligibility.every(r=>!r.runtimeSlots.length&&!isEcrHumanAdmitted(r)));
const row=admit({...cards.runtimeSlotEligibility[0],runtimeSlots:['CARRIER','IDENTITY'],requiredSemanticTags:['TEST_TAG'],priority:1}),semantic=[{customerSurfaceAllowed:true,semanticTags:['TEST_TAG']}];
const selected=selectEcrRuntimeSlotCards(semantic,{runtimeSlotEligibility:[row]},deck);assert.equal(selected[0].cardId,row.cardId);assert.equal(selected[4].cardId,row.cardId);assert.deepEqual(selected[0].meaning,deck.cards.find(c=>c.cardId===row.cardId).canonicalCustomerMeaning);
assert(selectEcrRuntimeSlotCards([{...semantic[0],customerSurfaceAllowed:false}],{runtimeSlotEligibility:[row]},deck).every(c=>c.status==='UNKNOWN'));
const tie=admit({...cards.runtimeSlotEligibility[1],runtimeSlots:['CARRIER'],requiredSemanticTags:['TEST_TAG'],priority:1});assert.equal(selectEcrRuntimeSlotCards(semantic,{runtimeSlotEligibility:[row,tie]},deck)[0].unknownReason,'ADMITTED_ELIGIBILITY_PRIORITY_CONFLICT');
const proof=read(root+'topic-identity-proof.json');assert.equal(proof.identityProof.length,134);assert(proof.identityProof.every(x=>x.predecessorDigest===x.successorDigest&&!x.humanReviewRequired));
const topic=read(admission+'ecr-topic-geometry-migration-v1.json');assert.equal(topic.mappings.length,222);assert.equal(topic.humanReviewQueue.length,3);
const ir=await buildEcrHumanRuntime({canonicalInput:read('content/embodied-configuration/v4-1/acceptance/birth-fixtures-v1.json').cases[0].canonicalInput});
const selection=projectEcrTopicSuccessorSelection(ir.driverField,ir.semanticDepth);
assert(selection.topics.every(t=>t.GQRPersonalSelection==='UNKNOWN'&&!t.customerNarrativeAllowed));
const seen=new Set();
for(const t of selection.topics)for(const e of t.structuralEvidence){
 const d=ir.driverField.drivers.find(d=>[...d.personalityActivation,...d.designActivation].some(a=>a.bodyCode===e.bodyCode&&a.layer===e.layer&&a.status==='CALCULATED'));
 assert(d);const a=[...d.personalityActivation,...d.designActivation].find(a=>a.bodyCode===e.bodyCode&&a.layer===e.layer);
 const expected={'V4.1_BODY_BINDING':d.driverId,'V4.1_P64_UPPER_TRIGRAM':a.environment.environmentPriorityMotionId,'V4.1_INDEPENDENT_A8':a.p64.activationStage};
 assert.equal(e.coordinate,expected[e.source]);seen.add(e.source);
}
assert.equal(seen.size,3);

// R4 owner-decision authorities. These record decisions without bypassing the
// still-pending operational semantic/tag/priority admission.
const r4Pairs=read(admission+'ecr-bilingual-review-owner-decisions-r4.json');
assert.deepEqual(r4Pairs.summary,{ACCEPT:5,REVISE:9,REJECT:0});
const r4Cards=read(admission+'ecr-phi-card-runtime-slot-owner-decisions-r4.json');
assert.deepEqual(r4Cards.summary,{ACCEPT:43,REVISE:5,REJECT:0});assert.equal(r4Cards.cards.length,48);
const r4Topics=read(admission+'ecr-topic-personal-selection-owner-decisions-r4.json');
assert.deepEqual(r4Topics.summary,{ACCEPT:2,REVISE:1,REJECT:0});
assert.deepEqual(r4Topics.rules.map(r=>[r.ruleId,r.ownerDecision]),[
 ['D_LEGACY_AFFINITY_RANK_TO_PHYSICAL_BODY_ACTIVATIONS','REVISE'],
 ['M_ZERO_DEGREE_SECTOR_TO_P64_UPPER_TRIGRAM','ACCEPT'],
 ['A_OLD_H64_SECTOR_TO_P64_INDEPENDENT_A8','ACCEPT']
]);

// The nine revised bilingual copies are live in the report candidate and bound
// to new digests. Five unchanged pairs retain their accepted source digests.
const entitlement={schemaVersion:'PHI-OS-KAP-W45-METHOD-JOURNEY-ENTITLEMENT-v1.0.0',methodCode:'ECR',access:{methodAllowed:true,readingDepthAllowed:true}};
const en=buildEcrHumanRuntimeReport({ir,locale:'en',sharedEntitlement:entitlement,reviewMode:true}),zh=buildEcrHumanRuntimeReport({ir,locale:'zh-Hans',sharedEntitlement:entitlement,reviewMode:true});
for(const decision of r4Pairs.pairs){
 const e=en.sections.find(s=>s.sectionId===decision.sectionId),z=zh.sections.find(s=>s.sectionId===decision.sectionId);
 assert(e&&z);
 const digests={en:await sha256Stable(e),'zh-Hans':await sha256Stable(z)},pairDigest=await sha256Stable(digests);
 if(decision.ownerDecision==='ACCEPT')assert.equal(pairDigest,decision.sourcePairDigest,decision.sectionId);
 else {assert.deepEqual(digests,decision.revisedContentDigests,decision.sectionId);assert.equal(pairDigest,decision.revisedPairDigest,decision.sectionId);}
}

// R4 decisions do not masquerade as operational selection admission.
assert(cards.runtimeSlotEligibility.every(r=>!isEcrHumanAdmitted(r)));
assert.equal(r4Cards.operationalBoundary.selectorMustRemainUnknownWithoutOperationalAdmission,true);
assert.equal(r4Topics.operationalBoundary.customerNarrativeRequiresAdmittedComposition,true);
const blockers=evaluateEcrV41ProductionBlockers({reviewPairs:canonical.reviewPairs,cardPolicy:cards});assert.equal(blockers.blockers.length,6);assert.equal(blockers.customerProductionAdmitted,false);assert.equal(blockers.nonBlockers.length,3);assert(!blockers.blockers.some(x=>/CHIRON|DYNAMIC/.test(x)));
assert.equal(read(admission+'ecr-current-reality-dynamic-candidates-v1.json').blocksV41Production,false);
console.log('PASS R4: owner decisions recorded 5/9 bilingual, 43/5 cards, 2/1 D-M-A; revised copy live; operational admission remains fail-closed.');
