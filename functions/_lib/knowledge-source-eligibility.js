import {manuscriptMetadataRaw} from '../knowledge-runtime/current-manuscript-server-metadata.js';
import {CURRENT_CHAPTER_ADMISSION_OWNER,admittedManuscriptScopes} from './manuscript-current-admission.js';

const denyStates=new Set(['NOT_ACTIVATED','WITHHELD','DENIED','UNKNOWN','REJECTED','STALE']);
const kinds=/^(?:PUBLISHED_CANONICAL_ARTICLE|COMPLETED_MANUSCRIPT|REGISTERED_FIGURE_SEMANTICS|REGISTERED_CONCEPT|PUBLIC_CONTEXT|EXTERNAL_AUTHORITY|CURRENT_AUTHORITY|STRUCTURED_KNOWLEDGE_OBJECT|BOOK6_ACCEPTED_CURRENT_DOSSIER|BOOK6_VALIDATED_ADMITTED_PROVIDER_EVIDENCE|CIVILIZATION_ATLAS_[A-Z_]+)$/;
const clean=value=>typeof value==='string'?value.normalize('NFKC').trim().replace(/\s+/g,' '):'';
const privateText=/(?:[a-z]:[\\/]|\/home\/|\/Users\/|(?:^|\s)(?:tmp|functions|scripts|tools|docs|content|node_modules|\.git)\/|NOT_ACTIVATED|WITHHELD|(?:registry|runtime|ledger|verifier)|PUBLISHED_CANONICAL_|GOVERNED_|REVIEWED_MANUSCRIPT_|STRUCTURED_ATLAS_|Canonical binding|受治理|已准入)/i;
export function publicSourceUrl(value){const s=clean(value);if(!s)return null;try{const u=new URL(s,'https://phios.invalid');if(u.protocol!=='https:'||/^\/(?:api|tmp|tools|docs|functions|scripts|content|node_modules|\.git)(?:\/|$)/i.test(u.pathname))return null;return u.origin==='https://phios.invalid'?u.pathname+u.search+u.hash:u.toString();}catch{return null;}}
export function customerText(value){const s=clean(value);return privateText.test(s)?'':s;}
export function customerSourceLabel(type,locale='en'){const zh=locale==='zh-Hans';const key=/FIGURE/.test(type)?'Figure':/CONCEPT/.test(type)?'Concept':/EXTERNAL|CURRENT_AUTHORITY/.test(type)?'External source':/ATLAS|PUBLIC_CONTEXT/.test(type)?'World context':/MANUSCRIPT/.test(type)?'Manuscript':/ARTICLE/.test(type)?'Article':'Book';return zh?({'Figure':'图示','Concept':'概念','External source':'外部来源','World context':'世界参考','Manuscript':'参考手稿','Article':'文章','Book':'书籍'})[key]:key;}
function authorityRows(){try{return JSON.parse(manuscriptMetadataRaw[CURRENT_CHAPTER_ADMISSION_OWNER]).chapters||[];}catch{return[];}}
export function stateAllowsSource(source){
 if(!source||typeof source!=='object'||Array.isArray(source))return false;
 if(source.eligible!==undefined&&source.eligible!==true)return false;
 if(source.denied===true||source.stale===true||source.invalidated===true)return false;
 for(const key of ['currentAdmission','admissionStatus','eligibilityState'])if(source[key]!==undefined&&(typeof source[key]!=='string'||denyStates.has(source[key])||!['ACTIVATED','ADMITTED','ELIGIBLE','AVAILABLE'].includes(source[key])))return false;
 if(/unknown|stale|^v0(?:-|$)/i.test(clean(source.sourceVersion)))return false;
 return true;
}
export function manuscriptSourceAllowed(source){
 if(!stateAllowsSource(source))return false;
 const rows=authorityRows().filter(r=>r.bookCode===source.bookCode&&r.sectionCode===source.sectionCode);
 const digest=source.sourceSha256||source.sourceBinaryDigest;
 const sectionDigest=source.sectionSha256||source.sourceDigest||source.supportRange?.sectionSha256;
 const whole=source.wholeChapterCandidate===true||rows.length>0;
 if(!whole)return true;
 if(rows.length!==1)return false;
 const r=rows[0];return r.currentWholeChapterQualified===true&&r.currentAdmission==='ACTIVATED'&&digest===r.sourceSha256&&sectionDigest===r.sectionSha256;
}
export function corpusSourceAllowed(source){
 if(!stateAllowsSource(source)||!clean(source.bookCode)||!clean(source.sourceSha256))return false;
 if(source.wholeChapterCandidate===true||source.sectionCode)return manuscriptSourceAllowed(source);
 if(!source.scopeAdmissionPath)return false;
 try{const scope=JSON.parse(manuscriptMetadataRaw[source.scopeAdmissionPath]);const records=(scope.records||[]).filter(r=>r.bookCode===source.bookCode&&r.sourceSha256===source.sourceSha256&&r.locale===source.locale);return admittedManuscriptScopes(records,source,manuscriptMetadataRaw,{textScopeEnabled:true}).length>0;}catch{return false;}
}
export function safeSources(input){
 if(!Array.isArray(input))return[];
 const valid=[];
 for(const source of input){
  if(!stateAllowsSource(source)||!kinds.test(clean(source.sourceType)))continue;
  const body=clean(source.text||source.excerpt||source.questionScopedExcerpt||source.claimText||source.description);
  if(body.length<6||!customerText(body))continue;
  const identity=clean(source.sourceId)||clean(source.sectionCode)||clean(source.nodeCode&&source.fragmentCode?source.nodeCode+':'+source.fragmentCode:'')||clean(source.href||source.sourceUrl);
  if(!identity||/[a-z]:[\\/]|\/home\/|^(?:tmp|functions|scripts|content)\//i.test(identity))continue;
  if(source.sourceType==='COMPLETED_MANUSCRIPT'&&!manuscriptSourceAllowed(source))continue;
  if(/EXTERNAL|CURRENT_AUTHORITY/.test(source.sourceType)&&source.eligible!==true)continue;
  const key=source.sectionCode?source.sourceType+'|'+source.bookCode+'|'+source.sectionCode:source.sourceType+'|'+(clean(source.href||source.sourceUrl)||identity);
  valid.push({...source,sourceId:source.sourceId||identity,text:body,_sourceKey:key});
 }
 valid.sort((a,b)=>a._sourceKey.localeCompare(b._sourceKey)||a.text.localeCompare(b.text));
 const seen=new Set();return valid.filter(s=>{if(seen.has(s._sourceKey))return false;seen.add(s._sourceKey);return true;}).map(({_sourceKey,...s})=>s);
}
export function safeGroundingBundle(bundle){
 const b=bundle&&typeof bundle==='object'&&!Array.isArray(bundle)?bundle:{};
 return {...b,bundleId:typeof b.bundleId==='string'?b.bundleId:'NO-SUPPORT',question:b.question&&typeof b.question==='object'?b.question:{text:'',locale:'en'},sources:safeSources(b.sources)};
}
export const NO_SUPPORT_COPY=Object.freeze({en:'There is not enough source material to answer this question.','zh-Hans':'目前没有足够的来源资料来回答这个问题。'});
