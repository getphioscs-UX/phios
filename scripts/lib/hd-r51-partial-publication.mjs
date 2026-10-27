// Local editorial review projection; never grants calculation/content publication.
import {createHash} from 'node:crypto';
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const excluded=new Set(['label','terms','origin','sourceTrace','sourceRefs','sourceSensitiveFlags','legacySourceMaterialExcludedFromW4','legacySourceMaterialExcludedFromW5','identity']);
export function hdSourceParagraphs(unit){
 const found=[];
 function visit(value,path){
  if(!value||typeof value!=='object')return;
  if(typeof value.zhHans==='string'&&typeof value.en==='string'){
   found.push({path,zhHans:value.zhHans,en:value.en,textDigest:digest([value.zhHans,value.en])});return;
  }
  for(const [key,v]of Object.entries(value))if(!excluded.has(key))visit(v,path?`${path}.${key}`:key);
 }
 visit(unit,'');return found;
}
export function buildHdPartialReviewSections(plan,resources){
 if(plan?.sections?.length!==17||plan.publicationAllowed!==false||plan.snapshot?.publicationAllowed!==false)throw Error('HD_PARTIAL_REVIEW_BOUND_PLAN_REQUIRED');
 const units=new Map(resources.meaningUnits.map(u=>[u.meaningUnitId,u]));
 return plan.sections.map(section=>{
  const consumed=new Set(),explanations=[];
  for(const candidate of section.interpretationCandidates){
   const unit=units.get(candidate.id);if(!unit)throw Error('HD_SOURCE_UNIT_MISSING');
   // Existing candidate selections carry source IDs, never arbitrary replacement text.
   if(!resources.sourceIdentity.sources.some(s=>s.path===unit.origin.path&&s.sha256===unit.origin.sha256))throw Error('HD_SOURCE_VERSION_MISMATCH');
   for(const paragraph of hdSourceParagraphs(unit)){
    if(consumed.has(paragraph.textDigest))continue;consumed.add(paragraph.textDigest);
    explanations.push({...paragraph,unitId:unit.meaningUnitId,sourceRefs:unit.sourceRefs,origin:unit.origin,
     sourceAdmission:unit.semanticAdmissionStatus,humanAccepted:unit.humanAccepted===true,
     customerPublishable:unit.customerPublishableR3===true,approvedForCalculatedInput:candidate.approvedForCalculatedInput===true});
   }
  }
  return {...section,explanations,sourceTextAvailable:explanations.length>0,
   conditionalRule:{selector:'Existing R5 applicable type/authority/definition/center-state/channel/gate/variable selection',selectedUnitIds:section.interpretationCandidates.map(x=>x.id),inputDigest:plan.snapshot.inputDigest,chartResultDigest:plan.snapshot.chartResultDigest},
   contradictionControls:['Exact current calculation snapshot','No competing type/authority unit','No cognition inference from Tone alone','No invented personal experience','No unadmitted cross-domain synthesis'],
   sourceBoundary:'Source excerpts are preserved, including external-chart wording; this review does not extend them to approved calculated-input narratives.',
   publicationEligible:false,reviewOnly:true,
   missingDataBehavior:explanations.length?'SHOW_APPLICABLE_SOURCE_EXCERPTS_WITH_UNACCEPTED_SCOPE':'SHOW_CALCULATED_FACTS_AND_EXACT_MISSING_INTERPRETATION_NO_FILLER'};
 });
}
export function verifyHdReviewSourceText(sections,resources){
 const units=new Map(resources.meaningUnits.map(u=>[u.meaningUnitId,u]));
 for(const s of sections)for(const p of s.explanations){
  const expected=hdSourceParagraphs(units.get(p.unitId)||{}).find(v=>v.path===p.path);
  if(!expected||expected.textDigest!==p.textDigest||expected.zhHans!==p.zhHans||expected.en!==p.en)throw Error('HD_REVIEW_SOURCE_TEXT_TAMPERED');
 }
 return {pass:true,scope:'Verbatim source correspondence, not interpretation semantic acceptance',paragraphs:sections.reduce((n,s)=>n+s.explanations.length,0)};
}
