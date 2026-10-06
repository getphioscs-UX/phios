import {FIELD,unitKey} from './bazi-deep-manuscript-contract.js';
// Technical only. No vocabulary/meaning/quality adjudication.
export function recoverClosedSectionObjects(raw){
 if(typeof raw!=='string')return [];
 const marker=/"sections"\s*:\s*\[/.exec(raw);if(!marker)return [];
 const objects=[];let start=-1,depth=0,inString=false,escaped=false;
 for(let i=marker.index+marker[0].length;i<raw.length;i++){
  const c=raw[i];if(inString){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')inString=false;continue;}
  if(c==='"'){inString=true;continue;}if(c==='{' ){if(depth===0)start=i;depth++;}
  if(c==='}'&&depth>0){depth--;if(depth===0){try{objects.push(JSON.parse(raw.slice(start,i+1)));}catch{}start=-1;}}
  if(c===']'&&depth===0)break;
 }
 // A final object may contain a complete Chinese JSON string before English
 // truncates. Salvage only fully closed string values; never invent a quote.
 if(start>=0){const partial={};const tail=raw.slice(start);const field=/"(sectionId|zhHansManuscript|enManuscript)"\s*:\s*("(?:\\.|[^"\\])*")/g;let match;while((match=field.exec(tail))){try{partial[match[1]]=JSON.parse(match[2]);}catch{}}if(partial.sectionId)objects.push(partial);}
 return objects;
}
export function inspectBaziManuscriptResponse(response,units){
 const rootInvalid=response.output&&(typeof response.output!=='object'||Array.isArray(response.output)||Object.keys(response.output).some(k=>k!=='sections')||!Array.isArray(response.output.sections));
 const sections=Array.isArray(response.output?.sections)?response.output.sections:recoverClosedSectionObjects(response.rawText);
 const results=[];const requested=new Set(units.map(u=>unitKey(u.sectionId,u.locale)));
 // Unrequested/duplicated identities cannot become trusted checkpoints.
 const contaminated=new Set();for(const s of sections){if(!s||!units.some(u=>u.sectionId===s.sectionId))continue;for(const [locale,field] of Object.entries(FIELD))if(field in s&&!requested.has(unitKey(s.sectionId,locale)))contaminated.add(s.sectionId);}
 for(const u of units){
  const matches=sections.filter(s=>s?.sectionId===u.sectionId);const s=matches[0];const text=s?.[FIELD[u.locale]];
  let reason=rootInvalid?'INVALID_SCHEMA':null;
  if(reason){}else if(s&&Object.keys(s).some(k=>!['sectionId',...units.filter(x=>x.sectionId===u.sectionId).map(x=>FIELD[x.locale])].includes(k)))reason='UNEXPECTED_FIELD';else if(contaminated.has(u.sectionId))reason='UNREQUESTED_LOCALE';else if(matches.length>1)reason='DUPLICATE_SECTION';else if(!s)reason='MISSING_SECTION';else if(typeof text!=='string')reason='MISSING_LOCALE';else if(!text.trim())reason='EMPTY_MANUSCRIPT';else if(!/[。！？.!?][”’"')）\]]*$/.test(text.trim()))reason='INCOMPLETE_TERMINAL_SENTENCE';else if(/(?:\.\.\.|…|\[truncated\]|<truncated>)\s*$/i.test(text.trim()))reason='OBVIOUS_TRUNCATION';
  results.push({...u,status:reason?'UNRESOLVED':'COMPLETE',reason,manuscript:reason?null:text.trim()});
 }
 return {parsedSections:sections.length,finishReason:response.finishReason||'UNKNOWN',units:results};
}
