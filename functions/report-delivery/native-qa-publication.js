import {sha256Stable} from '../interpretation-runtime/mir7-utils.js';
export const NATIVE_QA_VERSION='NATIVE-DELIVERY-R3-SYNTHETIC-1';
export const NATIVE_QA_SCOPE='LOCAL_NATIVE_COMPOSER_FIXTURE_NOT_CUSTOMER_PUBLICATION';
export const NATIVE_QA_METHODS=Object.freeze({BZR:{product:'COM-REPORT-BAZI-FULL',count:10},AST:{product:'COM-REPORT-ASTROLOGY-FULL',count:10},HD:{product:'COM-REPORT-HD-FULL',count:17},ECR:{product:'COM-REPORT-ECR-FULL',count:10}});
const fail=c=>{throw Object.assign(Error(c),{code:c,status:409});};
export function requireNativeQa(c){if(c.env?.PHIOS_ENVIRONMENT!=='local'||c.env.STRIPE_ENVIRONMENT!=='QA'||c.env.PHIOS_LOCAL_NATIVE_DELIVERY_QA!=='true')fail('NATIVE_QA_LOCAL_EXPLICIT_OPT_IN_REQUIRED');}
export const escapeNativeQa=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// This fixture composer never claims personal interpretation, editorial or rights
// approval. All facts come from the current native owner, never another person.
export async function composeNativeQaPublication({job,native}){
 const contract=NATIVE_QA_METHODS[job.methodCode];if(!contract||job.productId!==contract.product)fail('NATIVE_QA_METHOD_REQUIRED');
 const sourceDigest=await sha256Stable(native);
 const sections=Array.from({length:contract.count},(_,i)=>({sectionId:'SEC-'+String(i+1).padStart(2,'0'),title:{en:`${job.methodCode} synthetic chapter ${i+1}`, 'zh-Hans':`${job.methodCode} 合成技术章节 ${i+1}`},sourceRefs:[`${job.methodCode}:native:${sourceDigest}`],
  body:{en:`SYNTHETIC COMPOSER FIXTURE — NOT A CUSTOMER REPORT. This chapter verifies publication and delivery for the current Subject. It does not assert that AI interpretation, publication, chart rights or commercial admission has been accepted. Native source identity: ${sourceDigest}. Order: ${job.orderId}. Subject: ${job.personId}. Chapter ${i+1} of ${contract.count}.`,
   'zh-Hans':`合成 Composer 技术样本，不是正式客户报告。本章验证当前主体的出版和交付路径，不代表真实 AI 正文、正式出版、图表权利或商业准入已接受。原生来源：${sourceDigest}。订单：${job.orderId}。主体：${job.personId}。第 ${i+1} / ${contract.count} 章。`},
  nativeExcerpt:native.excerpts?.[i]||null}));
 const body={version:NATIVE_QA_VERSION,scope:NATIVE_QA_SCOPE,methodCode:job.methodCode,productId:job.productId,personId:job.personId,personVersion:job.personVersion,ownerAccountId:job.ownerAccountId,orderId:job.orderId,purchaseId:job.purchaseId,jobId:job.jobId,reportId:job.reportId,inputDigest:job.inputDigest,authorityDigest:job.authorityDigest,locale:job.presentation.reportLocale,sourceDigest,sections,diagrams:native.diagrams||[],customerPublishable:false,composerFixture:true};
 return {...body,digest:await sha256Stable(body)};
}
export async function verifyNativeQaPublication(p,j){
 const {digest,...body}=p||{};if(digest!==await sha256Stable(body)||p.version!==NATIVE_QA_VERSION||p.scope!==NATIVE_QA_SCOPE||p.customerPublishable!==false||p.composerFixture!==true)fail('NATIVE_QA_PUBLICATION_INTEGRITY');
 for(const k of ['methodCode','productId','personId','personVersion','ownerAccountId','orderId','purchaseId','jobId','reportId','inputDigest','authorityDigest'])if(p[k]!==j[k])fail('NATIVE_QA_PUBLICATION_BINDING');
 if(p.locale!==j.presentation.reportLocale||p.sections?.length!==NATIVE_QA_METHODS[j.methodCode]?.count||new Set(p.sections.map(s=>s.sectionId)).size!==p.sections.length)fail('NATIVE_QA_CHAPTER_CONTRACT');
 for(const s of p.sections)if(!s.body?.en||!s.body?.['zh-Hans']||!s.sourceRefs.includes(`${j.methodCode}:native:${p.sourceDigest}`))fail('NATIVE_QA_CHAPTER_SOURCE');return p;
}
export function renderNativeQaHtml(p){const e=escapeNativeQa;
 return `<!doctype html><html lang="en"><meta charset="utf-8"><title>${e(p.methodCode)} synthetic native delivery</title><style>@page{size:A4;margin:20mm 17mm}body{font:11pt/1.6 Arial,"Microsoft YaHei",sans-serif;color:#173849}h1{font-size:24pt}h2{font-size:18pt}section{break-before:page}h2,h3{break-after:avoid}nav p{margin:2mm 0;font-size:9pt;line-height:1.2}p{overflow-wrap:anywhere}.notice{padding:12px;border:2px solid #a45438;background:#fff3e8}svg{width:100%;max-height:220mm}pre{white-space:pre-wrap;font:9pt/1.5 monospace;overflow-wrap:anywhere}</style><main><h1>${e(p.methodCode)} · SYNTHETIC QA</h1><p class="notice">NOT CUSTOMER PUBLICATION / 合成技术样本，未正式发行</p><p>Version ${e(p.version)}<br>Order ${e(p.orderId)}<br>Subject ${e(p.personId)}<br>Job ${e(p.jobId)}<br>Source ${e(p.sourceDigest)}</p><h2>Contents / 目录</h2><nav>${p.sections.map(s=>`<p><a href="#${s.sectionId}">${e(s.title.en)} / ${e(s.title['zh-Hans'])}</a></p>`).join('')}</nav>${p.sections.map(s=>`<section id="${s.sectionId}"><h2>${e(s.title.en)}<br>${e(s.title['zh-Hans'])}</h2><p class="notice">SYNTHETIC COMPOSER · 未准入客户全文</p><p lang="en">${e(s.body.en)}</p><p lang="zh-Hans">${e(s.body['zh-Hans'])}</p>${s.nativeExcerpt?`<h3>Current native source / 当前原生资料</h3><pre>${e(JSON.stringify(s.nativeExcerpt,null,2))}</pre>`:''}</section>`).join('')}${p.diagrams.map(d=>`<section><h2>${e(d.id)} — current native diagram</h2>${d.svg}</section>`).join('')}</main></html>`;
}
