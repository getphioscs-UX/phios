// Version/text-bound argument annotations, not question-to-answer rules.
// Only exact previously verified spans may carry these scope descriptions.
const argumentsByText={
 '5bd6e6732ecfa1d37a6c8510d066922343496225e6e6a97b86afe7824380c3d9':{supports:['MAINTENANCE_BEFORE_OBVIOUS_DAMAGE','REPAIR_USUALLY_AFTER_OBVIOUS_DAMAGE'],notEstablished:['REPAIR_EQUALS_RECOVERY','GENERAL_POST_DAMAGE_RECOVERY_DEFINITION']},
 'aa09e34ab6994697730871889e494380a1e19f990b37d3974da4808592aad11a':{supports:['GENERAL_ADAPTIVE_CONTINUITY','REORGANIZATION_DURING_CHANGE'],notEstablished:['GENERAL_POST_DAMAGE_RECOVERY_DEFINITION','COMPONENT_CHANGE_ALWAYS_CAUSES_MAINTENANCE']}
};
// Scope annotations describe exact verified spans, never question mappings or
// entire chapters. A changed version, text or support position loses annotation.
const currentArguments={
 '7b9fe243a4669c64cfd06d8035cf68f07d8a2cb575622dbdeda0158c7adfb4a3':{
  chapterId:'CM-B3V1-P8-S001',sourceSha256:'efbfdd21fa21c7e482bbe73ab6559eea8d2e9cb0610663b09f3a19df46f521b7',sourceVersion:'owner-final-20261011-efbfdd21fa21',startOffset:266,endOffset:938,
  assertions:[{subject:'maintenance',facet:'definition',statement:'Maintenance first addresses consequences of continuing operation; failure is not its prerequisite.'},{subject:'maintenance',facet:'conditions',statement:'Operation leaves history and changes the conditions of the next round.'}],
  comparisons:[{left:'maintenance',right:'repair',scope:'NOT_EQUIVALENT',statement:'Maintenance first is not repair; this span does not define repair or post-damage recovery.'}],
  notEstablished:['repair definition','post-damage recovery definition or conditions','repair equals recovery']},
 '253c9b4fca388d2c78ae8019684c3e3de3c7593a9ac8a78dd62601e20c912c15':{
  chapterId:'CM-B3V1-P8-S059',sourceSha256:'efbfdd21fa21c7e482bbe73ab6559eea8d2e9cb0610663b09f3a19df46f521b7',sourceVersion:'owner-final-20261011-efbfdd21fa21',startOffset:33,endOffset:398,
  assertions:[{subject:'continuity',facet:'conditions',statement:'Sustainable continuity retains conditions for the next round, including release of load and structural correction.'}],comparisons:[],
  notEstablished:['post-damage recovery definition or conditions','normal maintenance guarantees recovery success']}
};
function currentAnnotation(f){const a=currentArguments[f.textSha256];return a&&a.chapterId===f.chapterId&&a.sourceSha256===f.sourceSha256&&a.sourceVersion===f.sourceVersion&&a.startOffset===f.support?.startOffset&&a.endOffset===f.support?.endOffset?a:null;}
export function verifiedArgumentCoverage(binding){return {fragments:binding.bindings.map(f=>{const a=currentAnnotation(f);return {id:f.shortId,sourceVersion:f.sourceVersion,textSha256:f.textSha256,chapterId:f.chapterId,support:f.support,scope:a?{...a,state:'EXACT_VERSION_POSITION_TEXT_BOUND',supports:a.assertions.map(x=>x.subject+':'+x.facet)}:argumentsByText[f.textSha256]||{supports:[],notEstablished:[],state:'NO_REVIEWED_SCOPE_ANNOTATION'}};}),basis:'EXACT_VERIFIED_ARGUMENT_TEXT_IDENTITY_NOT_QUERY_KEYWORDS',semanticGuarantee:false};}
export function comparisonArgumentCoverage(question,binding){
 const subjects=[['maintenance',/维护|维持|maintenance/iu],['repair',/修理|repair/iu],['recovery',/恢复|recovery|recover/iu],['continuity',/持续|continuity|sustainab/iu],['components',/组成部分|组成要素|部件|元素|components?|elements?/iu]].filter(([,pattern])=>pattern.test(question)).map(([id])=>id);
 const comparison=/区别|差别|差异|不同|比较|相同|differ|distinguish|compare|versus/iu.test(question),annotations=binding.bindings.flatMap(f=>{const a=currentAnnotation(f);return a?[{id:f.shortId,...a}]:[]});
 const sides=subjects.map(subject=>({subject,definition:annotations.filter(a=>a.assertions.some(x=>x.subject===subject&&x.facet==='definition')).map(a=>a.id),conditions:annotations.filter(a=>a.assertions.some(x=>x.subject===subject&&x.facet==='conditions')).map(a=>a.id)}));
 const relations=annotations.flatMap(a=>a.comparisons.filter(x=>subjects.includes(x.left)&&subjects.includes(x.right)).map(x=>({...x,sourceId:a.id})));
 return {comparison,sides,relations,scope:'THIS_ADMITTED_SOURCE_PACK_ONLY',unannotatedSubjectsAre:'NOT_ESTABLISHED_BY_SCOPE_ANNOTATIONS_NOT_PROOF_THE_BOOK_LACKS_KNOWLEDGE',keywordMatchCountsAsSupport:false,semanticGuarantee:false};
}
export function inspectShortAnswerRisks(answer,binding){
 const coverage=verifiedArgumentCoverage(binding),flags=[];
 for(const row of answer.supportMap||[]){if(row.relation==='INFERENCE')flags.push({kind:'INFERENCE_REQUIRES_ENTAILMENT_REVIEW',statement:row.statement});if(row.relation==='DIRECT_SUPPORT'&&row.sourceIds?.some(id=>coverage.fragments.find(f=>f.id===id)?.scope.notEstablished.length))flags.push({kind:'SCOPED_SOURCE_NOT_UNIVERSAL_SUPPORT',statement:row.statement});}
 return {coverage,flags,implementedChecks:['exact fragment identity and immutable pack','explicit inference relation risk','reviewed span scope annotations'],knownMisses:['Faithful-looking paraphrase can still change qualifiers','DIRECT_SUPPORT is a model label, not entailment','Unannotated fragments lack argument scope review','Multilingual causation and recovery equivalence are not proven by this detector'],semanticPass:false,automaticSemanticDeliveryGate:'NOT_IMPLEMENTED',perAnswerHumanAcceptRequired:false};
}
