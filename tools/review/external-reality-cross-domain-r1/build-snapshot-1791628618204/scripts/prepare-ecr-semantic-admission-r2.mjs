import fs from 'node:fs';
import {sha256Stable} from '../functions/interpretation-runtime/mir7-utils.js';
const read=p=>JSON.parse(fs.readFileSync(p)),write=(p,x)=>{fs.mkdirSync(p.slice(0,p.lastIndexOf('/')),{recursive:true});fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');};
const root='content/embodied-configuration/v4-1/semantic-admission-r2/';
const prepare=(name,x)=>{if(!fs.existsSync(root+name))write(root+name,x);};
const bridge=read('content/embodied-configuration/ecr-p64-environment-bridge-v1.json');
const drivers=read('content/embodied-configuration/ecr-planetary-driver-binding-v1.json');
const factor=(factorId,key,sourceRefs)=>({factorId,key,sourceRefs,status:'PENDING',meaningRef:null,semanticTags:[],humanReview:null});
prepare('composition-policy.json',{
 schemaVersion:'ECR-COMPOSITIONAL-SEMANTIC-POLICY-R2',owner:'ECR_SEMANTIC_ADMISSION',
 pipeline:['GATE_BASE_MEANING','LINE_MODIFIER','PLANETARY_DRIVER_ROLE','PERSONALITY_DESIGN_ROLE','SEMANTIC_TAGS','ADMITTED_RUNTIME_OWNER'],
 gateBases:bridge.entries.map(b=>factor(`BASE:${b.gate}`,b.gate,[`content/embodied-configuration/ecr-environment-first-configuration-v1.json#${b.ecrConfigurationRef}`,`GATE-${String(b.gate).padStart(2,'0')}-BASE`])),
 lineModifiers:Array.from({length:6},(_,i)=>factor(`LINE:${i+1}`,i+1,['content/interpretation/source/gate-line-source-registry-v1.json'])),
 planetaryDriverRoles:drivers.entries.map(d=>factor(`DRIVER:${d.driverId}`,d.driverId,d.semanticSourceRefs)),
 layerRoles:['PERSONALITY','DESIGN'].map(layer=>factor(`LAYER:${layer}`,layer,['content/embodied-configuration/v4-1/ecr-human-runtime-v4-1-authority-freeze-v1.json'])),
 tagRules:[],runtimeOwnerRules:[],personalCoordinateRules:[],
 directGateLineOwnerMappingsAllowed:false,
 rule:'All four admitted factors and an admitted conjunctive composition rule are required. A Line number is not assumed to supply a universal personal meaning. No tags or Runtime Owners are inferred from labels or keywords.'});
const deck=read('content/ecr-phi-card/ecr-phi-card-deck-registry-v2.json');
prepare('card-eligibility.json',{
 schemaVersion:'ECR-RUNTIME-SLOT-ELIGIBILITY-R2',predecessorDeckRef:deck.deckId,
 taxonomy:deck.groups.map(g=>g.groupId),outputPositions:['CARRIER','EXPERIENCE','EXPRESSION','AGENCY','IDENTITY','FEEDBACK_CONTINUITY'],
 runtimeSlotEligibility:deck.cards.map(c=>({cardId:c.cardId,predecessorGroup:c.groupId,runtimeSlots:[],requiredSemanticTags:[],priority:null,sourceRefs:[`content/ecr-phi-card/ecr-phi-card-deck-registry-v2.json#${c.cardId}`],status:'PENDING',humanReview:null})),
 relation:'MANY_TO_MANY',taxonomyReplaced:false,outputPositionsAreTaxonomy:false,ambiguityPolicy:'UNKNOWN_ON_EQUAL_PRIORITY',selectionPolicy:'Only admitted eligibility matched by admitted semantic tags; explicit priority; no random, ordinal or keyword fallback.'});
prepare('current-reality-scope.json',{
 schemaVersion:'ECR-V4.1-CURRENT-REALITY-SCOPE-R2',status:'OWNER_SCOPE_FROZEN',
 allowed:['OBSERVATION','COMPARISON'],dynamicInference:'UNKNOWN',dynamicOwnerSuccessor:'ECR_V4.2',
 dynamicInferenceBlocksV41:false,currentRealityOwnerChanged:false,
 excludedDynamicConclusions:['currentDriverPriority','runtimeState','bottleneckLayer','flow','strain','recovery','drift','reconfiguration']});
prepare('product-scope.json',{
 schemaVersion:'ECR-V4.1-PRODUCT-SCOPE-R2',status:'OWNER_SCOPE_FROZEN',
 requiredHumanGates:['BILINGUAL_REVIEW_PAIRS','COMPOSITIONAL_SEMANTIC_ADMISSION','CARD_SLOT_ELIGIBILITY','TOPIC_PERSONAL_SELECTION','RENDERED_VISUAL_ACCEPTANCE'],
 requiredDeploymentGates:['DEPLOYED_PREVIEW_E2E'],
 nonBlockers:['CHIRON_PROVIDER','CHIRON_R1_INTERPRETATION','ECR_V4_2_DYNAMIC_INFERENCE'],
 partialDriverCapabilityAllowed:true,unknownDriverDisclosureRequired:true,
 currentRealityScope:['OBSERVATION','COMPARISON'],customerProductionAdmitted:false});
const reviewPath='content/embodied-configuration/v4-1/review/human-review-cases-v1.json',prior=read(reviewPath);
if(prior.candidates){
 prepare('predecessor-locale-review-evidence.json',{historicalEvidenceOnly:true,source:reviewPath,...prior});
 const sections=[...new Set(prior.candidates.map(c=>c.sectionId))];
 const reviewPairs=[];
 for(const sectionId of sections){const records=prior.candidates.filter(c=>c.sectionId===sectionId);if(records.length!==2||records.some(c=>c.decision!=='PENDING'))throw Error('RECONCILE_EXISTING_HUMAN_DECISION_FIRST');
  const contentDigests=Object.fromEntries(records.map(c=>[c.locale,c.contentDigest]));
  reviewPairs.push({reviewId:`ECR-V4.1A-R2:${sectionId}`,sectionId,contentDigests,pairDigest:await sha256Stable(contentDigests),decision:'PENDING',reviewer:null,reviewedAt:null,localeEvidenceRefs:records.map(c=>c.reviewId)});
 }
 write(reviewPath,{version:'ECR-V4.1A-BILINGUAL-REVIEW-R2',reviewUnit:'BILINGUAL_PAIR',decisionVocabulary:['ACCEPT','REVISE','REJECT'],syntheticFixtureOnly:true,reviewPairs,humanAccepted:false,productionAdmitted:false});
}
const bundlePath='content/embodied-configuration/v4-1/runtime-authority-bundle-sources-v1.json',sources=read(bundlePath);
for(const name of ['composition-policy.json','card-eligibility.json','current-reality-scope.json','product-scope.json'])if(!sources.includes(root+name))sources.push(root+name);
write(bundlePath,sources);
console.log('R2 preparation: 14 decision units; 64+6+12+2 factor slots, no direct 384 owner map; existing card taxonomy retained; no semantic acceptance.');
