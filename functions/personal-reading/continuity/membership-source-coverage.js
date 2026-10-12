// Version/text-bound argument annotations, not question-to-answer rules.
// Only exact previously verified spans may carry these scope descriptions.
const argumentsByText={
 '5bd6e6732ecfa1d37a6c8510d066922343496225e6e6a97b86afe7824380c3d9':{supports:['MAINTENANCE_BEFORE_OBVIOUS_DAMAGE','REPAIR_USUALLY_AFTER_OBVIOUS_DAMAGE'],notEstablished:['REPAIR_EQUALS_RECOVERY','GENERAL_POST_DAMAGE_RECOVERY_DEFINITION']},
 'aa09e34ab6994697730871889e494380a1e19f990b37d3974da4808592aad11a':{supports:['GENERAL_ADAPTIVE_CONTINUITY','REORGANIZATION_DURING_CHANGE'],notEstablished:['GENERAL_POST_DAMAGE_RECOVERY_DEFINITION','COMPONENT_CHANGE_ALWAYS_CAUSES_MAINTENANCE']}
};
export function verifiedArgumentCoverage(binding){return {fragments:binding.bindings.map(f=>({id:f.shortId,sourceVersion:f.sourceVersion,textSha256:f.textSha256,scope:argumentsByText[f.textSha256]||{supports:[],notEstablished:[],state:'NO_REVIEWED_SCOPE_ANNOTATION'}})),basis:'EXACT_VERIFIED_ARGUMENT_TEXT_IDENTITY_NOT_QUERY_KEYWORDS',semanticGuarantee:false};}
export function inspectShortAnswerRisks(answer,binding){
 const coverage=verifiedArgumentCoverage(binding),flags=[];
 for(const row of answer.supportMap||[]){if(row.relation==='INFERENCE')flags.push({kind:'INFERENCE_REQUIRES_ENTAILMENT_REVIEW',statement:row.statement});if(row.relation==='DIRECT_SUPPORT'&&row.sourceIds?.some(id=>coverage.fragments.find(f=>f.id===id)?.scope.notEstablished.length))flags.push({kind:'SCOPED_SOURCE_NOT_UNIVERSAL_SUPPORT',statement:row.statement});}
 return {coverage,flags,implementedChecks:['exact fragment identity and immutable pack','explicit inference relation risk','reviewed span scope annotations'],knownMisses:['Faithful-looking paraphrase can still change qualifiers','DIRECT_SUPPORT is a model label, not entailment','Unannotated fragments lack argument scope review','Multilingual causation and recovery equivalence are not proven by this detector'],semanticPass:false,automaticSemanticDeliveryGate:'NOT_IMPLEMENTED',perAnswerHumanAcceptRequired:false};
}
