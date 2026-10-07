import {deepFreeze} from '../../interpretation-runtime/mir7-utils.js';

function splitParagraphs(text){
 return String(text||'').trim().split(/\n\s*\n/u).map(x=>x.trim()).filter(Boolean);
}
function completeZh(text){
 const t=String(text||'').trim();
 return ['。','！','？','》','）','」','』','】'].some(x=>t.endsWith(x));
}
function completeEn(text){
 const t=String(text||'').trim();
 return ['.','!','?'].includes(t.at(-1)) || ['."','!"','?"',".'","!'","?'"].some(x=>t.endsWith(x));
}

export function buildZwrVfrProductionCompletenessManifest(result){
 const defects=[],observations=[];
 let zhChars=0,enWords=0;
 for(const row of result?.rawManuscriptSections||[]){
  const zh=String(row.zhHansManuscript||'').trim();
  const en=String(row.enManuscript||'').trim();
  const zhParagraphs=splitParagraphs(zh),enParagraphs=splitParagraphs(en);

  if(zh.length<650)defects.push({sectionId:row.sectionId,locale:'zhHans',code:'MANUSCRIPT_TOO_SHORT',actual:zh.length});
  if(en.length<1200)defects.push({sectionId:row.sectionId,locale:'en',code:'MANUSCRIPT_TOO_SHORT',actual:en.length});
  if(zhParagraphs.length<5)defects.push({sectionId:row.sectionId,locale:'zhHans',code:'TOO_FEW_PARAGRAPHS',actual:zhParagraphs.length});
  if(enParagraphs.length<5)defects.push({sectionId:row.sectionId,locale:'en',code:'TOO_FEW_PARAGRAPHS',actual:enParagraphs.length});
  if(/^\s*[-*•]/mu.test(zh))defects.push({sectionId:row.sectionId,locale:'zhHans',code:'BULLET_LED'});
  if(/^\s*[-*•]/mu.test(en))defects.push({sectionId:row.sectionId,locale:'en',code:'BULLET_LED'});
  if(!completeZh(zh))defects.push({sectionId:row.sectionId,locale:'zhHans',code:'ENDS_MID_SENTENCE'});
  if(!completeEn(en))defects.push({sectionId:row.sectionId,locale:'en',code:'ENDS_MID_SENTENCE'});
  zhParagraphs.forEach((p,index)=>{if(!completeZh(p))defects.push({sectionId:row.sectionId,locale:'zhHans',code:'TRUNCATED_PARAGRAPH',paragraph:index+1});});
  enParagraphs.forEach((p,index)=>{if(!completeEn(p))defects.push({sectionId:row.sectionId,locale:'en',code:'TRUNCATED_PARAGRAPH',paragraph:index+1});});
  if(zh.length>1400)observations.push({sectionId:row.sectionId,locale:'zhHans',code:'LENGTH_ADVISORY',actual:zh.length,targetMax:1400});
  if(en.length>2800)observations.push({sectionId:row.sectionId,locale:'en',code:'LENGTH_ADVISORY',actual:en.length,targetMax:2800});
  zhChars+=zh.length;
  enWords+=en.split(/\s+/).filter(Boolean).length;
 }
 if(zhChars<=7500)defects.push({sectionId:'ALL',locale:'zhHans',code:'TOTAL_DEPTH_TOO_LOW',actual:zhChars});
 if(enWords<=1500)defects.push({sectionId:'ALL',locale:'en',code:'TOTAL_DEPTH_TOO_LOW',actual:enWords});
 return deepFreeze({
  schemaVersion:'ZWR-VFR-R1-PRODUCTION-COMPLETENESS-MANIFEST-v1',
  status:defects.length?'REJECT':'PASS',
  defectCount:defects.length,
  affectedSections:[...new Set(defects.filter(d=>d.sectionId!=='ALL').map(d=>d.sectionId))],
  defects,
  observations
 });
}
export default Object.freeze({buildZwrVfrProductionCompletenessManifest});
