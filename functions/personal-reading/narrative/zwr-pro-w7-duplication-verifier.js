import {deepFreeze,sha256Stable} from '../../interpretation-runtime/mir7-utils.js';

export const ZWR_PRO_W7_DUPLICATION_VERIFIER_VERSION='ZWR-PRO-W7-CROSS-SECTION-DUPLICATION-VERIFIER-v1';
const IDS=['S02','S03','S04','S05','S06','S07','S08','S09','S10','S11'];
function normalize(v){return String(v||'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').replace(/[“”"'‘’。，、；：!?！？;:()（）]/g,'').trim();}
function sentences(v){return String(v||'').split(/(?<=[.!?。！？])\s*/u).map(normalize).filter(x=>x.length>=18);}
function grams(s,n=3){const x=normalize(s);const out=new Set();for(let i=0;i<=x.length-n;i++)out.add(x.slice(i,i+n));return out;}
function jaccard(a,b){const A=grams(a),B=grams(b);if(!A.size||!B.size)return 0;let hit=0;for(const x of A)if(B.has(x))hit++;return hit/(A.size+B.size-hit);}
export async function verifyZwrProCrossSectionDuplicationW7({candidates,locale}={}){
 const rows=Array.isArray(candidates)?candidates:[],reasons=[],pairs=[];
 if(rows.length!==10)reasons.push('TEN_SECTIONS_REQUIRED');
 const byId=new Map(rows.map(r=>[r.sectionId,r]));
 for(const id of IDS)if(!byId.has(id))reasons.push('SECTION_MISSING:'+id);
 if(new Set(rows.map(r=>r.locale)).size!==1||rows.some(r=>r.locale!==locale))reasons.push('LOCALE_SET_MISMATCH');
 const exactSeen=new Map();
 for(const c of rows){
  const ss=(c.paragraphs||[]).flatMap(p=>sentences(p.text));
  for(const s of ss){
   if(exactSeen.has(s)&&exactSeen.get(s)!==c.sectionId)reasons.push('EXACT_SENTENCE_REUSE:'+exactSeen.get(s)+':'+c.sectionId);
   else exactSeen.set(s,c.sectionId);
  }
 }
 for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){
  const a=rows[i],b=rows[j],aBody=(a.paragraphs||[]).map(p=>p.text).join('\n'),bBody=(b.paragraphs||[]).map(p=>p.text).join('\n');
  const firstA=a.paragraphs?.[0]?.text||'',firstB=b.paragraphs?.[0]?.text||'';
  const thesisOverlap=jaccard(firstA,firstB),bodyOverlap=jaccard(aBody,bBody);
  pairs.push({a:a.sectionId,b:b.sectionId,thesisOverlap:Number(thesisOverlap.toFixed(3)),bodyOverlap:Number(bodyOverlap.toFixed(3))});
  if(thesisOverlap>.72)reasons.push('THESIS_OVERLAP_HIGH:'+a.sectionId+':'+b.sectionId);
  if(bodyOverlap>.58)reasons.push('SECTION_BODY_OVERLAP_HIGH:'+a.sectionId+':'+b.sectionId);
 }
 const repeatedOpeners=new Map();
 for(const c of rows){
  const first=normalize(c.paragraphs?.[0]?.text||'').slice(0,34);
  if(first&&repeatedOpeners.has(first))reasons.push('REPEATED_SECTION_OPENING:'+repeatedOpeners.get(first)+':'+c.sectionId);
  else if(first)repeatedOpeners.set(first,c.sectionId);
 }
 const seed={schemaVersion:'ZWR-PRO-W7-CROSS-SECTION-DUPLICATION-VERIFICATION-v1',verifierVersion:ZWR_PRO_W7_DUPLICATION_VERIFIER_VERSION,locale,accepted:reasons.length===0,sectionIds:rows.map(r=>r.sectionId),pairs,reasons};
 return deepFreeze({...seed,verificationDigest:await sha256Stable(seed)});
}
export default Object.freeze({verifyZwrProCrossSectionDuplicationW7,ZWR_PRO_W7_DUPLICATION_VERIFIER_VERSION});
