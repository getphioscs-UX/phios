export const VFR_BILINGUAL_SINGLE_CALL_V1=Object.freeze({version:'VFR_BILINGUAL_SINGLE_CALL_V1',providerCallsPlanned:1,semanticReviewCallsPlanned:0,fullBilingualInputDuplication:false,EnglishOutputRequired:true,ChineseOutputRequired:true,sourceBilingualEvidenceMayRemain:true,maxOutputTokens:8000});
export function assertTriLayerSections(sections,diagrams){
 for(const s of sections){
  if(!s.technicalAnchors?.length||!s.professionalDiagramIds?.length||!s.applicationDiagramIds?.length||!s.livedInterpretationSource||!s.compactInterpretation)throw Error('TRI_LAYER_BINDING_REQUIRED');
  for(const id of [...s.professionalDiagramIds,...s.applicationDiagramIds]){const d=diagrams.find(d=>d.id===id);if(!d||!d.sourceTechnicalAnchors?.length)throw Error('DIAGRAM_TECHNICAL_ANCHOR_REQUIRED');}
  for(const key of ['headline','subheadline','technicalCaption','applicationCaption'])if(!s[key+'Zh']||!s[key+'En'])throw Error('BILINGUAL_FIELD_REQUIRED');
  if(s.interpretationZh?.length!==s.interpretationEn?.length||!s.interpretationZh?.length||s.takeaways?.length!==3||s.takeaways.some(t=>!t.textZh||!t.textEn))throw Error('BILINGUAL_STRUCTURE_REQUIRED');
 }
 return true;
}
export function bilingualSectionSchema(ids){
 const str={type:'string'},arr={type:'array',items:str,minItems:2,maxItems:4};
 const properties={sectionId:{type:'string',enum:ids},...Object.fromEntries(['headline','subheadline','technicalCaption','applicationCaption'].flatMap(k=>['Zh','En'].map(l=>[k+l,str]))),interpretationZh:arr,interpretationEn:arr,takeaways:{type:'array',minItems:3,maxItems:3,items:{type:'object',additionalProperties:false,properties:{labelZh:str,labelEn:str,textZh:str,textEn:str},required:['labelZh','labelEn','textZh','textEn']}}};
 return {type:'object',additionalProperties:false,properties:{sections:{type:'array',minItems:ids.length,maxItems:ids.length,items:{type:'object',additionalProperties:false,properties,required:Object.keys(properties)}}},required:['sections']};
}
