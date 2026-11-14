import {composeNumR20Pages} from './numerology-publication-adapter.js';
// Existing source-aligned name result/claims only. No number calculation, new
// meaning, school attribution for unlabeled birth results, or release approval.
export function composeNumCurrentEditorialSourcePagesR1(snapshot){
 const pages=structuredClone(composeNumR20Pages(snapshot));
 const keys={EXPRESSION:'expression',SOUL_URGE:'soulUrge',PERSONALITY:'personality'};
 for(const [id,roles]of [['P13',['EXPRESSION']]]){
  const page=pages.find(p=>p.logicalPageId===id);if(!page)throw Error('NUM_CURRENT_NAME_PAGE_REQUIRED');
  for(const locale of ['en','zh-Hans']){
   const depth=snapshot.readings[locale].sections.depth.sections,aligned=depth.secondaryChart?.sourceAlignedCore;
   const meanings=roles.map(role=>depth.nameRoleMeanings.find(m=>m.role===role));
   if(!aligned?.eligible||meanings.some(m=>!m||m.reviewState!=='HUMAN_ADMITTED'||m.runtimeUseAllowed!==true||m.customerPublishable!==true||m.methodAlignment?.eligible!==true||m.value!==aligned[keys[m.role]]?.value))continue;
   const previous=page.languages[locale];
   const facts=meanings.map(m=>({label:m.role,value:String(m.value),sourceRef:'readings.'+locale+'.sections.depth.sections.secondaryChart.sourceAlignedCore.'+keys[m.role],kind:'CALCULATED_FACT'}));
   page.languages[locale]={...previous,units:[...previous.units,...meanings.map(m=>({unitId:id+':aligned-name:'+m.role,text:m.text,sourceClaimId:m.sourceClaimId,sourceRef:'readings.'+locale+'.sections.depth.sections.nameRoleMeanings#'+m.role,school:m.school,kind:'ROLE_VALUE_MEANING',limited:false}))],facts:[...previous.facts,...facts]};
  }
 }
 return pages;
}
