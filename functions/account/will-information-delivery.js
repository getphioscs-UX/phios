import {draftApi} from './financial-will-draft-store.js';
import {requireSameOrigin} from './oidc-auth.js';
import {onRequestPost as prepareEstateInformation} from '../api/customer-estate-planning.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json=(body,status)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store'}});
function section(view,lang){
 return `<section lang="${lang}"><h1>${esc(view.title)}</h1><p>${esc(view.date)} · ${esc(view.currency)}</p><p>${esc(view.boundary)}</p><ul>${(view.reviewQuestions||[]).map(q=>`<li>${esc(q)}</li>`).join('')}</ul>${view.sections.map(s=>`<section><h2>${esc(s.title)}</h2><p>${esc(s.message||'')}</p><ul>${s.items.map(i=>`<li><strong>${esc(i.label)}</strong>${i.role?' · '+esc(i.role):''}${i.value!==null&&i.value!==undefined?' · '+esc(i.currency||view.currency)+' '+esc(i.value):''}${i.percentage!==null&&i.percentage!==undefined?' · '+esc(i.percentage)+'%':''}<p>${esc(i.instruction||'')}</p>${(i.details||[]).map(d=>`<p>${esc(d.label)}: ${esc(d.value)}</p>`).join('')}<p>${esc(i.documentLocation||'')}</p></li>`).join('')}</ul></section>`).join('')}</section>`;
}
export async function willInformationDelivery(context){
 try{
  if(context.request.method!=='POST')return json({ok:false,code:'METHOD_NOT_ALLOWED'},405);
  requireSameOrigin(context.request);
  const raw=await context.request.text();if(raw.length>3000)return json({ok:false,code:'REQUEST_TOO_LARGE'},413);
  const body=JSON.parse(raw);if(body.reviewConsent!==true||typeof body.draftId!=='string')return json({ok:false,code:'WILL_REVIEW_CONSENT_REQUIRED'},403);
  const url=new URL('/api/account-financial-will-drafts',context.request.url);url.searchParams.set('id',body.draftId);
  const response=await draftApi({...context,request:new Request(url)});
  if(!response.ok)return response;
  const saved=await response.json();if(saved.draftType!=='WILL')return json({ok:false,code:'WILL_DRAFT_REQUIRED'},400);
  if(saved.version!==body.expectedVersion)return json({ok:false,code:'DRAFT_VERSION_CONFLICT'},409);
  const views=[];
  for(const locale of ['zh-Hans','en']){
   const report=await prepareEstateInformation({request:new Request(new URL('/api/customer-estate-planning',context.request.url),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...saved.payload,locale,consent:true,confirmedForReview:true})})});
   if(!report.ok)return report;views.push((await report.json()).view);
  }
  const html=`<!doctype html><html lang="zh-Hans"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Estate information draft / 遗嘱资料整理稿</title><style>body{font:16px/1.7 system-ui;max-width:1000px;margin:24px auto;padding:20px;overflow-wrap:anywhere}section{margin:24px 0}h1{font-size:26px}h2{font-size:20px}@media print{section[lang=en]{break-before:page}}</style><main><p>DRAFT INFORMATION · NOT AN EXECUTED WILL / 资料整理稿 · 非已签署生效遗嘱</p><p>${esc(saved.draftId)} · Version / 版本 ${saved.version} · ${esc(saved.digest)}</p><p>Jurisdiction / 司法管辖区: ${esc(saved.payload.jurisdiction)} · Retention expiry / 保留截止: ${esc(saved.expiresAt)}</p>${section(views[0],'zh-Hans')}${section(views[1],'en')}<p>HTML delivery. PDF file, signature and professional legal review are not supplied by this download. / 此下载交付 HTML 文件，不包含 PDF 文件、签署或专业法律审核。</p></main></html>`;
  return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Content-Disposition':`attachment; filename="will-information-v${saved.version}.html"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'",'X-PHIOS-Draft-Version':String(saved.version),'X-PHIOS-Draft-Digest':saved.digest}});
 }catch(error){return json({ok:false,code:error.code||'WILL_INFORMATION_DELIVERY_INVALID'},error.status||400);}
}
