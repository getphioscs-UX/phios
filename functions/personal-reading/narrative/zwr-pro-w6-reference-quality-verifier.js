import {deepFreeze,sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
import {resolveZiweiR5AcceptedCopy} from './ziwei-r5-accepted-copy.generated.js';

export const ZWR_PRO_W6_REFERENCE_QUALITY_VERIFIER_VERSION='ZWR-PRO-W6-REFERENCE-QUALITY-VERIFIER-v1';

const GENERIC=/\b(?:this section will|this chapter will|methodology|governance|authority pack|candidate|semantic verifier|runtime)\b|(?:本章将|本章会|这一章会|方法论|治理|权威包|候选|语义验证|运行时(?:系统|环境|版本|状态|层))/iu;
const TECH=/命宫|身宫|官禄宫|财帛宫|迁移宫|夫妻宫|福德宫|疾厄宫|父母宫|兄弟宫|仆役宫|子女宫|三方|对宫|四化|大限|流年|Life Palace|Body Palace|Career Palace|Wealth Palace|Travel Palace|Spouse Palace|Wellbeing Palace|Health Palace|Parents Palace|Siblings Palace|Friends Palace|Children Palace|triad|opposite|Da Xian|Liu Nian/iu;
const CUSTOMER=/\b(?:you|your|this chart|the chart)\b|(?:你|你的|这张盘|命盘)/iu;
function units(v,l){const x=String(v||'');return l==='en'?x.trim().split(/\s+/).filter(Boolean).length:[...x.replace(/\s/g,'')].length;}
function sentences(v,l){const x=String(v||'');return l==='en'?(x.match(/[.!?](?:\s|$)/g)||[]).length:(x.match(/[。！？]/g)||[]).length;}
function normalize(v){return String(v||'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').replace(/[“”"'‘’。，、；：!?！？;:]/g,'').trim();}
function starGlossaryHits(body,section,locale){
 const labels=[...new Set((section?.technicalEvidence?.palaces||[]).flatMap(p=>(p.stars||[]).map(st=>st.label)).filter(Boolean))];
 const source=String(body||''),lower=source.toLowerCase();
 let hits=0;
 for(const label of labels){
  const needle=String(label),needleLower=needle.toLowerCase();
  let from=0;
  while(true){
   const pos=lower.indexOf(needleLower,from);if(pos<0)break;
   const tail=source.slice(pos+needle.length,pos+needle.length+(locale==='en'?28:10)).trimStart();
   if(locale==='en'){if(/^(?:means|brings|represents|indicates)\b/i.test(tail))hits++;}
   else if(/^(?:星)?(?:\s|，|、|：|:)*(?:代表|呈现|意味着)/u.test(tail))hits++;
   from=pos+Math.max(1,needle.length);
  }
 }
 return hits;
}
function referenceMetric(section,locale){
 const ps=section.paragraphs||[],paragraphUnits=ps.map(p=>units(p,locale)),total=paragraphUnits.reduce((n,x)=>n+x,0),sentenceCounts=ps.map(p=>sentences(p,locale)),singleSentenceUnits=ps.filter((p,i)=>sentenceCounts[i]<2).map(p=>units(p,locale));
 return {paragraphs:ps.length,total,avg:Math.round(total/Math.max(1,ps.length)),minParagraphUnits:paragraphUnits.length?Math.min(...paragraphUnits):null,singleSentenceParagraphs:singleSentenceUnits.length,minSingleSentenceUnits:singleSentenceUnits.length?Math.min(...singleSentenceUnits):null};
}
function exactReferenceCopy(body,reference){const refSentences=(reference.paragraphs||[]).flatMap(p=>String(p).split(/(?<=[.!?。！？])\s*/u)).map(normalize).filter(x=>x.length>=20);const candidate=String(body).split(/(?<=[.!?。！？])\s*/u).map(normalize).filter(x=>x.length>=20);return candidate.find(x=>refSentences.includes(x))||null;}

export async function verifyZwrProReferenceQualityW6({authorityPack,candidate}={}){
 if(authorityPack?.schemaVersion!=='ZIWEI-R5-AUTHORING-PACK-v2')throw Error('ZWR_PRO_W6_AUTHORITY_PACK_REQUIRED');
 if(candidate?.schemaVersion!=='ZWR-PRO-W4-CANDIDATE-v1')throw Error('ZWR_PRO_W6_CANDIDATE_REQUIRED');
 const reasons=[],locale=candidate.locale,sectionId=candidate.sectionId,rows=candidate.paragraphs||[],body=rows.map(r=>r.text).join('\n');
 const reference=resolveZiweiR5AcceptedCopy(locale).sections.find(s=>s.id===sectionId);
 if(!reference)throw Error('ZWR_PRO_W6_REFERENCE_SECTION_REQUIRED');
 const m=referenceMetric(reference,locale),total=rows.reduce((n,r)=>n+units(r.text,locale),0);
 const nav=sectionId==='S11';
 const minParagraphs=Math.max(5,m.paragraphs-1),maxParagraphs=Math.min(12,m.paragraphs+3);
 if(rows.length<minParagraphs||rows.length>maxParagraphs)reasons.push('REFERENCE_PARAGRAPH_RHYTHM_OUTSIDE_BAND');
 const minTotal=Math.floor(m.total*(nav?0.65:0.68)),maxTotal=Math.ceil(m.total*(nav?1.5:1.45));
 if(total<minTotal)reasons.push('REFERENCE_DEPTH_TOO_THIN');
 if(total>maxTotal)reasons.push('REFERENCE_DEPTH_TOO_DENSE');
 const hardFloor=locale==='en'?24:36;
 const referenceParagraphFloor=Math.max(hardFloor,Math.floor((m.minParagraphUnits??hardFloor)*.9));
 if(rows.some(r=>units(r.text,locale)<referenceParagraphFloor))reasons.push('PARAGRAPH_TOO_THIN');
 const singleRows=rows.filter(r=>sentences(r.text,locale)<2);
 if(singleRows.length>m.singleSentenceParagraphs)reasons.push('PARAGRAPH_FRAGMENTATION_ABOVE_REFERENCE');
 const permittedSingleMin=m.minSingleSentenceUnits??Number.POSITIVE_INFINITY;
 const singleSentenceFloor=Math.max(hardFloor,Number.isFinite(permittedSingleMin)?Math.floor(permittedSingleMin*.9):hardFloor);
 if(singleRows.some(r=>units(r.text,locale)<singleSentenceFloor))reasons.push('SINGLE_SENTENCE_PARAGRAPH_TOO_THIN');
 if(GENERIC.test(body))reasons.push('GOVERNANCE_OR_PROCESS_PROSE');
 const section=authorityPack.sections.find(s=>s.sectionId===sectionId);
 const referenceBody=(reference.paragraphs||[]).join('\n');
 const glossaryHits=starGlossaryHits(body,section,locale);
 const referenceGlossaryHits=starGlossaryHits(referenceBody,section,locale);
 const glossaryCeiling=Math.max(1,referenceGlossaryHits);
 if(glossaryHits>glossaryCeiling)reasons.push('STAR_GLOSSARY_PATTERN');
 if(!nav&&!TECH.test(body))reasons.push('TECHNICAL_GROUNDING_TOO_LOW');
 if(!CUSTOMER.test(body))reasons.push('CUSTOMER_VOICE_MISSING');
 const visiblePalaces=(section?.technicalEvidence?.palaces||[]).filter(p=>body.includes(p.label)).length;
 const visibleStars=(section?.technicalEvidence?.palaces||[]).flatMap(p=>p.stars||[]).filter(st=>body.includes(st.label)).length;
 if(!nav&&visiblePalaces<1)reasons.push('PALACE_VISIBILITY_TOO_LOW');
 if(!nav&&visibleStars<2)reasons.push('STAR_VISIBILITY_TOO_LOW');
 if(['S02','S04','S05','S09','S10'].includes(sectionId)&&!/(四化|化禄|化权|化科|化忌|Da Xian|Liu Nian|Hua Lu|Hua Quan|Hua Ke|Hua Ji|大限|流年)/iu.test(body))reasons.push('TIMING_OR_TRANSFORMATION_VISIBILITY_TOO_LOW');
 if(authorityPack.subjectBinding?.subjectId!=='ZPA-CONTROLLED-01'){
  const copied=exactReferenceCopy(body,reference);if(copied)reasons.push('REFERENCE_SENTENCE_COPY');
 }
 const seed={schemaVersion:'ZWR-PRO-W6-REFERENCE-QUALITY-VERIFICATION-v1',verifierVersion:ZWR_PRO_W6_REFERENCE_QUALITY_VERIFIER_VERSION,subjectBinding:authorityPack.subjectBinding,locale,sectionId,candidateDigest:candidate.candidateDigest,accepted:reasons.length===0,metrics:{paragraphs:rows.length,totalUnits:total,referenceParagraphs:m.paragraphs,referenceTotalUnits:m.total,referenceMinParagraphUnits:m.minParagraphUnits,referenceSingleSentenceParagraphs:m.singleSentenceParagraphs,referenceMinSingleSentenceUnits:m.minSingleSentenceUnits,referenceParagraphFloor,singleSentenceFloor,minTotal,maxTotal,visiblePalaces,visibleStars,glossaryHits,referenceGlossaryHits,glossaryCeiling},reasons};
 return deepFreeze({...seed,verificationDigest:await sha256Stable(seed)});
}
export default Object.freeze({verifyZwrProReferenceQualityW6,ZWR_PRO_W6_REFERENCE_QUALITY_VERIFIER_VERSION});
