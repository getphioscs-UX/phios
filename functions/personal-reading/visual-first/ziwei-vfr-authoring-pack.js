import {deepFreeze,sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
import {buildZiweiR5AuthoringPack} from '../narrative/ziwei-r5-authoring-pack.js';

export const ZWR_VFR_COMPACT_AUTHORING_PACK_VERSION='ZWR-VFR-R1-COMPACT-AUTHORING-PACK-v1';
const IDS=['S02','S03','S04','S05','S06','S07','S08','S09','S10','S11'];

function byCode(rows,key){return new Map((rows||[]).map(x=>[x[key],x]));}
function txt(v){return String(v??'').trim();}
function compactStar(zh,en){
 return {
  starCode:zh?.starCode||en?.starCode,
  labelZh:txt(zh?.label),
  labelEn:txt(en?.label),
  stateCode:zh?.stateCode??en?.stateCode??null,
  stateKnown:zh?.stateKnown===true||en?.stateKnown===true
 };
}
function compactPalace(zh,en){
 const zStars=byCode(zh?.stars,'starCode'),eStars=byCode(en?.stars,'starCode');
 const starCodes=[...new Set([...zStars.keys(),...eStars.keys()])].sort();
 return {
  palaceCode:zh?.palaceCode||en?.palaceCode,
  labelZh:txt(zh?.label),
  labelEn:txt(en?.label),
  branch:zh?.branch||en?.branch||null,
  isLifePalace:Boolean(zh?.isLifePalace||en?.isLifePalace),
  isBodyPalace:Boolean(zh?.isBodyPalace||en?.isBodyPalace),
  stars:starCodes.map(code=>compactStar(zStars.get(code),eStars.get(code)))
 };
}
function compactTransformation(zh,en){
 return {
  layer:zh?.layer||en?.layer,
  palaceCode:zh?.palaceCode||en?.palaceCode,
  targetStarCode:zh?.targetStarCode||en?.targetStarCode,
  transformationCode:zh?.transformationCode||en?.transformationCode,
  targetStarLabelZh:txt(zh?.targetStarLabel),
  targetStarLabelEn:txt(en?.targetStarLabel),
  labelZh:txt(zh?.label),
  labelEn:txt(en?.label)
 };
}
function sectionCompact(zh,en){
 const zPal=byCode(zh?.technicalEvidence?.palaces,'palaceCode'),ePal=byCode(en?.technicalEvidence?.palaces,'palaceCode');
 const palaceCodes=[...new Set([...zPal.keys(),...ePal.keys()])];
 const txKey=x=>[x.layer,x.palaceCode,x.targetStarCode,x.transformationCode].join(':');
 const zTx=new Map((zh?.technicalEvidence?.transformations||[]).map(x=>[txKey(x),x]));
 const eTx=new Map((en?.technicalEvidence?.transformations||[]).map(x=>[txKey(x),x]));
 const txKeys=[...new Set([...zTx.keys(),...eTx.keys()])];
 const claims=(zh?.claims||[]).map(c=>({
  claimId:c.claimId,
  role:c.role,
  claimType:c.claimType,
  certainty:c.certainty,
  textZh:txt(c.text),
  conditions:c.conditions||[],
  counterweights:c.counterweights||[]
 }));
 return {
  sectionId:zh.sectionId,
  titleZh:txt(zh.title),
  titleEn:txt(en?.title),
  purposeZh:txt(zh.authoringContract?.customerQuestion||zh.keyInsights?.[0]),
  purposeEn:txt(en?.authoringContract?.customerQuestion||en?.keyInsights?.[0]),
  primaryPalaces:zh.primaryPalaces||[],
  contextPalaces:zh.contextPalaces||[],
  palaces:palaceCodes.map(code=>compactPalace(zPal.get(code),ePal.get(code))),
  transformations:txKeys.map(key=>compactTransformation(zTx.get(key),eTx.get(key))),
  claims,
  output:{
   headlineMaxCharsZh:20,
   subheadlineMaxCharsZh:35,
   keyInsightsMin:3,
   keyInsightsMax:5,
   interpretationParagraphsMin:2,
   interpretationParagraphsMax:3,
   diagramCaptionsMax:2
  }
 };
}
export async function buildZwrVfrCompactAuthoringPack({evidence,realityContext=null}={}){
 const zh=await buildZiweiR5AuthoringPack({evidence,locale:'zh-Hans'});
 const en=await buildZiweiR5AuthoringPack({evidence,locale:'en'});
 if(zh.subjectBinding?.inputFingerprint!==en.subjectBinding?.inputFingerprint)throw Error('ZWR_VFR_BILINGUAL_AUTHORITY_BINDING_DRIFT');
 const sections=IDS.map(id=>{
  const z=zh.sections.find(s=>s.sectionId===id),e=en.sections.find(s=>s.sectionId===id);
  if(!z||!e)throw Error('ZWR_VFR_SECTION_AUTHORITY_MISSING:'+id);
  return sectionCompact(z,e);
 });
 const seed={
  schemaVersion:ZWR_VFR_COMPACT_AUTHORING_PACK_VERSION,
  methodId:'ZWR',
  localeMode:'BILINGUAL_SINGLE_CALL',
  subjectBinding:zh.subjectBinding,
  sourceAuthorityVersion:zh.sourceVersion,
  reportRules:{
   visualFirst:true,
   providerRole:'INTERPRETATION_ONLY',
   calculateChart:false,
   createTechnicalFacts:false,
   guaranteedEventPrediction:false,
   medicalDiagnosis:false,
   financialTransactionAdvice:false,
   noStarDictionary:true,
   professionalZiweiTermsVisible:true,
   technicalFirstThenLivedMeaning:true,
   maxPhysicalPages:50
  },
  sections,
  realityContext:realityContext?{
   question:txt(realityContext.question),
   context:txt(realityContext.context)
  }:null
 };
 return deepFreeze({...seed,authorityDigest:await sha256Stable(seed)});
}
export default Object.freeze({buildZwrVfrCompactAuthoringPack,ZWR_VFR_COMPACT_AUTHORING_PACK_VERSION});
