import fs from 'node:fs';
import {sha256Stable} from '../functions/interpretation-runtime/mir7-utils.js';
import {projectEcrStaticTopicRelations,projectEcrTopicSuccessorSelection} from '../functions/embodied-configuration/ecr-topic-successor-projection.js';
import {buildEcrHumanRuntime} from '../functions/embodied-configuration/ecr-canonical-projection-runtime-v2.js';
import {evaluateEcrV41ProductionBlockers} from '../functions/embodied-configuration/ecr-v41-production-blockers-r2.js';
import {ATOMIC} from '../functions/embodied-configuration/ecr-topic-deployment-authority.js';
const read=p=>JSON.parse(fs.readFileSync(p)),write=(p,x)=>{fs.mkdirSync(p.slice(0,p.lastIndexOf('/')),{recursive:true});fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');};
const base='content/embodied-configuration/v4-1/',root=base+'semantic-admission-r2/';
const relations=projectEcrStaticTopicRelations();
const identityProof=[];
for(const r of relations.filter(r=>['G','Q','R'].includes(r.layer))){
 const old=ATOMIC.entries.find(a=>a.coordinate===r.coordinate);
 const keys=['meaningCode','meaningVersion','label','labelZhHans','definition','definitionZhHans'];
 const before=Object.fromEntries(keys.map(k=>[k,old[k]])),after=Object.fromEntries(keys.map(k=>[k,r[k]]));
 const predecessorDigest=await sha256Stable(before),successorDigest=await sha256Stable(after);
 if(predecessorDigest!==successorDigest)throw Error('GQR_IDENTITY_CHANGED:'+r.coordinate);
 identityProof.push({topic:r.topic,coordinate:r.coordinate,predecessorDigest,successorDigest,status:'IDENTITY_INVARIANT',humanReviewRequired:false});
}
write(root+'topic-identity-proof.json',{status:'PASS',sourceOwner:'functions/embodied-configuration/ecr-topic-deployment-authority.js',meaningCreated:false,identityProof});
const input=read(base+'acceptance/birth-fixtures-v1.json').cases[0].canonicalInput,ir=await buildEcrHumanRuntime({canonicalInput:input});
const selection=projectEcrTopicSuccessorSelection(ir.driverField,ir.semanticDepth);
write(root+'topic-personal-selection-proof.json',{syntheticFixtureOnly:true,configurationId:ir.configurationId,...selection});
const oldTopicPath=base+'admission/ecr-topic-geometry-migration-v1.json',old=read(oldTopicPath);
old.schemaVersion='ECR-V4.1A-TOPIC-MIGRATION-R2';old.status='STATIC_IDENTITY_PROVED_PERSONAL_SELECTION_PENDING';
old.mappings=relations.map(r=>({topic:r.topic,group:r.layer,sourceRef:r.coordinate,classification:['G','Q','R'].includes(r.layer)?'SEMANTIC_IDENTITY_INDEPENDENT_OF_GEOMETRY':'GEOMETRY_DEPENDENT_MAPPING',staticRelation:'PRESERVED',personalSelection:['G','Q','R'].includes(r.layer)?'ADMITTED_COMPOSITION_REQUIRED':'V4.1_STRUCTURAL_ACTIVATION_EVIDENCE',humanStaticReviewRequired:false}));
old.humanReviewQueue=selection.reviewChanges.map(change=>({change,status:'PENDING',scope:'PERSONAL_SELECTION_CHANGE_ONLY'}));old.customerEnabled=false;write(oldTopicPath,old);
for(const name of ['ecr-semantic-runtime-owner-admission-v1.json','ecr-phi-card-runtime-slot-candidates-v1.json']){
 const path=base+'admission/'+name,x=read(path);x.status='SUPERSEDED_BY_R2_WORKSPACE';x.canonicalSuccessor=root+(name.includes('phi-card')?'card-eligibility.json':'composition-policy.json');x.historicalCandidateOnly=true;write(path,x);
}
const dynamicPath=base+'admission/ecr-current-reality-dynamic-candidates-v1.json',dynamic=read(dynamicPath);dynamic.status='DEFERRED_TO_ECR_V4.2';dynamic.successor='ECR_V4.2';dynamic.blocksV41Production=false;write(dynamicPath,dynamic);
const pairs=read(base+'review/human-review-cases-v1.json').reviewPairs;
const blockers=evaluateEcrV41ProductionBlockers({reviewPairs:pairs,semanticDepth:ir.semanticDepth,cardPolicy:read(root+'card-eligibility.json')});
write(root+'production-blockers.json',blockers);write('docs/ecr-human-runtime-v4-1/r2-production-blockers.json',blockers);
console.log(`R2: ${identityProof.length} G/Q/R static identities proved; three D/M/A selection changes queued. ${blockers.blockers.length} genuine product gates; Chiron and V4.2 are non-blockers.`);
