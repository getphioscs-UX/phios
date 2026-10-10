import {ATOMIC,MATRIX} from './ecr-topic-deployment-authority.js';
// Reuses the accepted topic/atomic authorities. Static meaning is independent of
// how a personal coordinate is selected; neither topic weights nor prose change.
export function projectEcrStaticTopicRelations(){
 return Object.entries(MATRIX.topics).flatMap(([topic,groups])=>Object.entries(groups).flatMap(([layer,ids])=>ids.map(coordinate=>{
  const source=ATOMIC.entries.find(a=>a.coordinate===coordinate);
  if(!source)throw Error('ECR_TOPIC_STATIC_IDENTITY_MISSING:'+coordinate);
  return {topic,layer,coordinate,meaningCode:source.meaningCode,meaningVersion:source.meaningVersion,label:source.label,labelZhHans:source.labelZhHans,definition:source.definition,definitionZhHans:source.definitionZhHans,classification:['G','Q','R'].includes(layer)?'SEMANTIC_IDENTITY_INDEPENDENT_OF_GEOMETRY':'STATIC_IDENTITY_RETAINED_PERSONAL_SELECTOR_CHANGED'};
 })));
}
export function projectEcrTopicSuccessorSelection(driverField,semanticDepth){
 const evidence=driverField.drivers.flatMap(d=>[...d.personalityActivation,...d.designActivation].filter(a=>a.status==='CALCULATED').flatMap(a=>[
  {coordinate:d.driverId,source:'V4.1_BODY_BINDING',layer:a.layer,bodyCode:a.bodyCode,rank:null},
  {coordinate:a.environment.environmentPriorityMotionId,source:'V4.1_P64_UPPER_TRIGRAM',layer:a.layer,bodyCode:a.bodyCode,gate:a.p64.gate},
  {coordinate:a.p64.activationStage,source:'V4.1_INDEPENDENT_A8',layer:a.layer,bodyCode:a.bodyCode,gate:a.p64.gate}
 ]));
 const semanticEvidence=semanticDepth.filter(s=>s.customerSurfaceAllowed).flatMap(s=>(s.semanticCoordinates||[]).filter(c=>/^[GQR]\d+$/.test(c)).map(coordinate=>({coordinate,source:'ADMITTED_COMPOSITION',semanticUnitId:s.semanticUnitId})));
 return {staticRelationOwner:'ECR_TOPIC_R1_ATOMIC_AND_MATRIX',selectionRule:'V4.1_ACTIVATION_EVIDENCE_NOT_LEGACY_RANKING',driverRankingCreated:false,
  topics:Object.keys(MATRIX.topics).map(topic=>{const refs=new Set(Object.values(MATRIX.topics[topic]).flat());return {topic,structuralEvidence:evidence.filter(e=>refs.has(e.coordinate)),admittedSemanticEvidence:semanticEvidence.filter(e=>refs.has(e.coordinate)),GQRPersonalSelection:semanticEvidence.some(e=>refs.has(e.coordinate))?'ADMITTED_COMPOSITION':'UNKNOWN',customerNarrativeAllowed:false};}),
  reviewChanges:['D_LEGACY_AFFINITY_RANK_TO_PHYSICAL_BODY_ACTIVATIONS','M_ZERO_DEGREE_SECTOR_TO_P64_UPPER_TRIGRAM','A_OLD_H64_SECTOR_TO_P64_INDEPENDENT_A8'],humanSelectionAdmission:'PENDING'};
}
