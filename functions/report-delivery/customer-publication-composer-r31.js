import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
import {buildAstCustomerWorkspaceCandidate} from '../ast-full-production/ast-customer-reading-production.js';
import {compileBaziDeepPublication} from '../personal-reading/deep-manuscript/bazi-deep-manuscript-publication.js';
import {digest as baziDigest} from '../personal-reading/deep-manuscript/bazi-deep-manuscript-contract.js';
import {buildBaziMethodNativeReading} from '../personal-professional-reading/bazi-method-native-reading-adapter.js';
export const CUSTOMER_COMPOSER_R31='CUSTOMER-PUBLICATION-COMPOSER-R31-1';
const fail=code=>{throw Object.assign(Error(code),{code,status:409});};
const pair=(en,zh)=>({en,'zh-Hans':zh});
const pick=(v,l)=>typeof v==='string'?v:v?.[l]??(l==='zh-Hans'?v?.zhHans:undefined);
const section=(id,title)=>({sectionId:id,title,paragraphs:[],sourceRefs:[]});
function add(s,body,ref){if(!body.en?.trim()||!body['zh-Hans']?.trim())return;const key=body.en+'\0'+body['zh-Hans'];if(s.paragraphs.some(p=>p.key===key))return;s.paragraphs.push({key,body});s.sourceRefs.push(ref);}
const forbidden=/SYNTHETIC|COMPOSER_FIXTURE|schemaVersion|Job ID|jobId|authorityDigest|sourceDigest|EDITORIAL-HD-|AST-R4A-|ASPECT_\d+|\bSEC-\d+\b|未准入|工程诊断|模拟章节/i;
export function customerReadingProjection(publication){return {title:publication.title,sections:publication.sections.filter(s=>s.paragraphs.length).map(s=>({title:s.title,paragraphs:s.paragraphs.map(p=>p.body)}))};}
export function assertCustomerReadableProjection(value){
 const text=JSON.stringify(value);if(forbidden.test(text)||/"(?:schema|sourceRefs|jobId|digest|nativeExcerpt)"\s*:/.test(text))fail('CUSTOMER_PUBLICATION_ENGINEERING_CONTENT_FORBIDDEN');
 for(const s of value.sections)for(const p of s.paragraphs)for(const l of ['en','zh-Hans'])if(typeof p[l]!=='string'||!p[l].trim())fail('CUSTOMER_PUBLICATION_BILINGUAL_BODY_REQUIRED');return value;
}
async function finish(method,native,sections,required,missing){
 const sourceDigest=await sha256Stable(native),coverage=sections.filter(s=>s.paragraphs.length).map(s=>s.sectionId);
 const p={version:CUSTOMER_COMPOSER_R31,method,sourceDigest,title:method==='AST'?pair('Your astrological reading','你的占星解读'):method==='BZR'?pair('Your BaZi reading','你的八字解读'):pair('Your Human Design reading','你的人类图解读'),sections,coverage,requiredSections:required,missingSections:missing,fullCustomerManuscriptReady:missing.length===0,publicationAccepted:false,customerPublishable:false,scope:'EXISTING_NATIVE_CUSTOMER_PROSE_REVIEW_ONLY_NOT_NEW_AI'};
 assertCustomerReadableProjection(customerReadingProjection(p));return {...p,digest:await sha256Stable(p)};
}
// Calculation is reused, not rerun. Existing locale-specific native reading is
// the only interpretation owner; no new claims, intent or timing are generated.
export async function composeAstCustomerPublicationR31(native){
 if(native.method!=='AST'||native.calculation?.calculation?.status!=='COMPLETE')fail('AST_CURRENT_NATIVE_CALCULATION_REQUIRED');
 const zh=await buildAstCustomerWorkspaceCandidate({canonicalProjection:native.calculation,locale:'zh-Hans'});
 const ids=['OVERVIEW','CORE_THEMES','SUPPORT_TENSION'],titles=[pair('The chart as a whole','整张命盘'),pair('Your central patterns','核心模式'),pair('Support and tension','支持与张力')],sections=[];
 for(let index=0;index<ids.length;index++){
  const id=ids[index],s=section(id,titles[index]),a=native.reading.sections.find(s=>s.sectionId===id),b=zh.reading.sections.find(s=>s.sectionId===id);
  for(const [i,item] of (a?.items||[]).entries()){
   if(item.meaningCreated!==false||!item.sourceRefs?.length)continue;
   const other=b?.items?.[i];if(!other||JSON.stringify(item.sourceRefs)!==JSON.stringify(other.sourceRefs))fail('AST_BILINGUAL_SOURCE_BINDING_MISMATCH');
   add(s,pair(item.text||item.readerText,other.text||other.readerText),`AST_NATIVE_READING:${id}:${i}`);
  }sections.push(s);
 }
 // Workspace prose is real, but cannot be relabelled as the ten-section paid
 // manuscript or forged PASS_3_CALL/HUMAN_ACCEPTED by the publisher.
 return finish('AST',native,sections,['SEC-01','SEC-02','SEC-03','SEC-04','SEC-05','SEC-06','SEC-07','SEC-08','SEC-09','SEC-10'],['FULL_PAID_TEN_SECTION_MANUSCRIPT_SOURCE']);
}
export async function composeHdCustomerPublicationR31(native){
 if(native.method!=='HD'||native.sourceScope!=='EXPLICIT_SYNTHETIC_CONFIRMED_EXTERNAL_CHART_R3_NOT_GENERAL_FULL17')fail('HD_BOUND_EXTERNAL_SOURCE_REQUIRED');
 const source=native.reading.customerReading.customerSections,sections=[],used=new Set();
 for(const original of source){
  const s=section(original.sectionId,pair(pick(original.title,'en'),pick(original.title,'zh-Hans')));
  if(original.customerNote)add(s,pair(pick(original.customerNote,'en'),pick(original.customerNote,'zh-Hans')),'HD_R3:SOURCE_BOUNDARY');
  for(const c of original.customerCards||[]){if(used.has(c.cardId))continue;used.add(c.cardId);for(const field of ['headline','body','why','observe','counterpoint'])if(c[field])add(s,pair(pick(c[field],'en'),pick(c[field],'zh-Hans')),`HD_R3:${c.cardId}:${field}`);}
  if(original.sectionId.endsWith('-ADVANCED'))add(s,pair('The supplied chart does not establish the advanced Environment, Variable and PHS details needed for an individual reading. Those details remain unknown; they are not inferred from Type, Profile or Authority.','现有图表未提供足以进行个人解读的高级环境、Variable 与 PHS 资料。这些细节保持未知，不从类型、人生角色或权威推断。'),'HD_R31:EXPLICIT_MISSING_FIELD_BOUNDARY');
  for(const q of original.customerQuestions||[])if(q.question)add(s,pair(pick(q.question,'en'),pick(q.question,'zh-Hans')),`HD_R3:OBSERVATION:${q.findingId}`);
  sections.push(s);
 }
 return finish('HD',native,sections,Array.from({length:17},(_,i)=>'SEC'+String(i+1).padStart(2,'0')),['GENERAL_FULL17_SECTION_BINDING','EXTERNAL_CHART_PRECISION_AND_COMMERCIAL_RIGHTS']);
}
export async function composeBaziNativeCustomerReadingR31(native){
 if(native.method!=='BZR'||native.pack?.subject?.subjectId==null)fail('BZR_CURRENT_NATIVE_SUBJECT_REQUIRED');
 const reading=await buildBaziMethodNativeReading({canonicalProjection:native.calculation,locale:'en'}),n=reading.professionalModules.customerNarrative,sections=[];
 const opening=section('NATIVE_OVERVIEW',pair(pick(n.opening.headline,'en'),pick(n.opening.headline,'zh-Hans')));
 for(const [i,p] of n.opening.paragraphs.entries())add(opening,pair(pick(p,'en'),pick(p,'zh-Hans')),`BZR_NATIVE_CUSTOMER_NARRATIVE:OPENING:${i}`);sections.push(opening);
 for(const unit of n.priorityChapters){const s=section(unit.chapterId,pair(pick(unit.title,'en'),pick(unit.title,'zh-Hans')));for(const k of ['thesis','development','condition'])add(s,pair(pick(unit[k],'en'),pick(unit[k],'zh-Hans')),`BZR_NATIVE_CUSTOMER_NARRATIVE:${unit.chapterId}:${k}`);sections.push(s);}
 for(const unit of n.topicNarratives){const s=section('NATIVE_'+unit.topicCode,pair(pick(unit.headline,'en'),pick(unit.headline,'zh-Hans')));for(const k of ['lead','development','condition'])add(s,pair(pick(unit[k],'en'),pick(unit[k],'zh-Hans')),`BZR_NATIVE_CUSTOMER_NARRATIVE:${unit.topicCode}:${k}`);sections.push(s);}
 // No observation time is inferred. The accepted short native narrative does
 // not become a complete deep 48-page manuscript by changing its title/version.
 return finish('BZR',native,sections,['S02','S03','S04','S05','S06','S07','S08','S09','S10'],['DEEP_48_PAGE_MANUSCRIPT_SOURCE','EXPLICIT_TIMING_OBSERVATION_CONTEXT']);
}
// Concrete bridge into the existing 48-page compiler. It accepts a real
// owner-supplied snapshot only after same Subject/Authority/order validation.
export async function compileBaziCustomerPublicationR31({snapshot,pack,job,compilerOptions={}}){
 if(!snapshot||snapshot.fixture!==false||/SYNTHETIC|FIXTURE/i.test(snapshot.model||''))fail('BZR_CUSTOMER_MANUSCRIPT_SOURCE_REQUIRED');
 if(!pack?.subject?.birthDate||!pack.subject.birthTime||snapshot.subjectId!==job.personId||pack.subject.subjectId!==job.personId||snapshot.orderId!==job.orderId)fail('BZR_CUSTOMER_SUBJECT_ORDER_BINDING_REQUIRED');
 if(snapshot.authorityDigest!==pack.authorityDigest||snapshot.timingDigest!==pack.timingDigest||snapshot.realityDigest!==pack.realityDigest||pack.digest!==job.authorityDigest)fail('BZR_CUSTOMER_AUTHORITY_BINDING_REQUIRED');
 const {digest,...body}=snapshot;if(await baziDigest(body)!==digest)fail('BZR_CUSTOMER_MANUSCRIPT_DIGEST_MISMATCH');
 return compileBaziDeepPublication({...compilerOptions,snapshot,pack,fixture:false,productionFrozen:false,presentationMode:'BILINGUAL'});
}
// Fail closed before a shared paid job can claim a full customer publication.
// This is also callable as the compile checkpoint by the existing pending owner.
export function requireCustomerManuscriptReadyR31(p){if(!p?.fullCustomerManuscriptReady||p.missingSections?.length)fail('CUSTOMER_FULL_MANUSCRIPT_SOURCE_INCOMPLETE');return p;}
export function renderCustomerReadingR31(p){const value=assertCustomerReadableProjection(customerReadingProjection(p)),e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 return `<!doctype html><html lang="en"><meta charset="utf-8"><title>${e(value.title.en)}</title><style>@page{size:A4;margin:20mm 18mm}body{font:11pt/1.65 Arial,"Microsoft YaHei",sans-serif;color:#193a46}h1{font-size:26pt}h2{font-size:19pt;break-after:avoid}p{orphans:3;widows:3}section{break-before:page}.zh{color:#35535c}header{font-size:10pt;letter-spacing:1px;color:#687b81}</style><header>PHI OS · Review edition / 审阅稿</header><h1>${e(value.title['zh-Hans'])}<br>${e(value.title.en)}</h1>${value.sections.map(s=>`<section><h2>${e(s.title['zh-Hans'])}<br>${e(s.title.en)}</h2>${s.paragraphs.map(t=>`<p lang="zh-Hans" class="zh">${e(t['zh-Hans'])}</p><p lang="en">${e(t.en)}</p>`).join('')}</section>`).join('')}</html>`;
}
