import {PublicAssetResolutionError,isAssetVerificationRenderable,resolvePublicAsset} from '../../assets/js/runtime/web-production/asset-resolver.js';
import {reportVisualArchitecture,fixedReportAssetLanguage} from './report-visual-architecture.js';
import visualManifest from '../../content/reports/shared/report-visual-assets-r2.json' with {type:'json'};

// R6.11 pure presentation boundary. The server caller checks the existing
// purchase owner first and supplies its language plus existing registry rows.
// This function never grants access or enables production publication.
export function resolveHdFrontMatterForLocalReview({purchasedPresentation,registeredPages,bindings,localReview=false}={}){
 if(!localReview)throw fixedVisualError('HD_FRONT_MATTER_LOCAL_REVIEW_ONLY');
 if(!purchasedPresentation||!['zh-Hans','en','bilingual'].includes(purchasedPresentation.reportLocale)||!['SINGLE','BILINGUAL'].includes(purchasedPresentation.reportLanguageMode))throw fixedVisualError('HD_FRONT_MATTER_PERSISTED_LANGUAGE_REQUIRED');
 const locale=purchasedPresentation.reportLocale;
 const pages=[];
 for(let n=1;n<=5;n++){
  const registered=registeredPages?.[n-1],rows=bindings?.rows?.filter(r=>r.language===locale&&r.pageId==='P0'+n)||[];
  if(!registered||rows.length!==1)throw fixedVisualError('HD_FRONT_MATTER_EXACT_ASSET_MISSING:'+locale+':P0'+n);
  const a=rows[0];
  if(a.registryAssetId!==registered.asset_code||a.objectKey!==registered.object_key||a.mime!=='image/webp'||!Number.isInteger(a.width)||!Number.isInteger(a.height)||a.width<=0||a.height<=0||!/^[a-f0-9]{64}$/.test(a.sha256)||a.verification!=='LOCAL_BYTES_DECODED_EXACT_HASH'||a.approval!=='OWNER_SELECTED_EXACT_PATH_R611_LOCAL_CANDIDATE')throw fixedVisualError('HD_FRONT_MATTER_ASSET_BINDING_INVALID:'+locale+':P0'+n);
  pages.push(Object.freeze({...a,contentLanguage:locale,physicalRole:'FIXED_EDITORIAL',productionAdmitted:false}));
 }
 return Object.freeze({methodId:'HD',contentLanguage:locale,languageAuthority:'PERSISTED_ORDER_REPORT_PRESENTATION',pages:Object.freeze(pages),localReview:true,customerPublishable:false});
}
const fixedVisualError=message=>Object.assign(new Error(message),{code:message.split(':')[0],status:409});

export function reportContentLocale(locale){if(locale==='zh'||locale==='ZH')return 'zh-Hans';if(locale==='EN')return 'en';if(locale==='BILINGUAL')return 'bilingual';if(!['zh-Hans','en','bilingual'].includes(locale))throw fixedVisualError('REPORT_CONTENT_LANGUAGE_INVALID');return locale;}
function resolveFixedReportPageInternal({methodId,pageId,contentLanguage,manifest=visualManifest}={},localReview=false){
 const policy=reportVisualArchitecture(methodId),locale=reportContentLocale(contentLanguage);
 if(policy.publicationReadiness==='PENDING'&&!(localReview&&methodId==='NUM'))throw fixedVisualError('REPORT_FIXED_SECTIONS_PENDING_APPROVAL');
 const role=manifest.assets.find(a=>a.methodId===methodId&&a.pageId===pageId)?.kind;
 const language=fixedReportAssetLanguage({methodId,pageRole:role,contentLanguage:locale});
 const rows=manifest.assets.filter(a=>a.methodId===methodId&&a.pageId===pageId&&a.language===language);
 if(rows.length!==1)throw fixedVisualError('REPORT_FIXED_ASSET_MISSING:'+methodId+':'+pageId+':'+language);
 const a=rows[0];
 if(!['COVER','FIXED_PRELIMINARY_PAGE','FIXED_MASTER_SECTION'].includes(a.kind))throw fixedVisualError('REPORT_FIXED_PAGE_ROLE_INVALID');
 if(a.kind==='FIXED_MASTER_SECTION'&&policy.masterSectionMode!=='FIXED')throw fixedVisualError('REPORT_DYNAMIC_MASTER_MUST_USE_NATIVE_OWNER');
 if(a.active!==true||a.customerSpecific!==false||!(a.approval==='OWNER_APPROVED_R2_20261026'||(methodId==='NUM'&&['OWNER_APPROVED_NUM_R20_20261027','OWNER_NUM_SECTIONS_20261030'].includes(a.approval)))||!(a.verification==='PUBLIC_BYTES_DECODED_AND_VISUALLY_REVIEWED'||(localReview&&methodId==='NUM'&&a.approval==='OWNER_NUM_SECTIONS_20261030'&&a.verification==='PUBLIC_BYTES_DECODED_OWNER_SELECTED'))||!/^images\/reports\//.test(a.objectKey)||!/^https:\/\/pub-1967bc5812ee4164b19a806fb1427021\.r2\.dev\//.test(a.url)||!a.url.includes('/'+a.objectKey+'?v='+a.sha256)||!/^[a-f0-9]{64}$/.test(a.sha256)||!(a.width>0&&a.height>0))throw fixedVisualError('REPORT_FIXED_ASSET_NOT_VERIFIED');
 return Object.freeze({...a,contentLanguage:locale,fixedAssetLanguage:language,masterSectionMode:policy.masterSectionMode});
}
export function resolveFixedReportPage(options){return resolveFixedReportPageInternal(options,false);}
// Local publication QA only. No production handler calls this adapter; normal
// resolveFixedReportPage continues to enforce NUM's PENDING release gate.
export function resolveNumFixedPageForLocalReview(options){if(options?.methodId!=='NUM')throw fixedVisualError('NUM_LOCAL_REVIEW_ONLY');return resolveFixedReportPageInternal(options,true);}
const escapeVisual=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const FIXED_REPORT_PAGE_CSS='.report-fixed-page{display:block;position:relative;aspect-ratio:210/297;width:100%;padding:0!important;margin:0;overflow:hidden;background:white;break-after:page}.report-fixed-page>img{display:block;width:100%;height:100%;object-fit:contain;object-position:center}@media print{.report-fixed-page{width:210mm!important;height:297mm!important;aspect-ratio:auto;break-inside:avoid}}';
export function renderFixedReportPage(options){
 const a=resolveFixedReportPage(options);
 // Complete editorial artwork: deliberately no title, prose, values, chart, footer or cover overlays.
 return `<section class="report-fixed-page" data-page-role="${a.kind==='FIXED_MASTER_SECTION'?'FIXED_MASTER_SECTION':'FIXED_EDITORIAL'}" data-fixed-page="${escapeVisual(a.pageId)}" data-fixed-method="${escapeVisual(a.methodId)}" data-fixed-language="${a.fixedAssetLanguage}" data-content-language="${a.contentLanguage}"><img src="${escapeVisual(a.url)}" alt="${escapeVisual(a.pageId)}" width="${a.width}" height="${a.height}" loading="eager"></section>`;
}
export function resolveReportBodyAsset({methodId,manifest=visualManifest}={}){
 const rows=manifest.assets.filter(a=>a.methodId===methodId&&a.pageId==='BODY');
 if(rows.length!==1)throw fixedVisualError('REPORT_BODY_ASSET_MISSING:'+methodId);
 const a=rows[0];
 if(a.kind!=='OTHER_APPROVED_REPORT_PAGE'||a.active!==true||!(a.verification==='PUBLIC_BYTES_DECODED_AND_VISUALLY_REVIEWED'||(localReview&&methodId==='NUM'&&a.approval==='OWNER_NUM_SECTIONS_20261030'&&a.verification==='PUBLIC_BYTES_DECODED_OWNER_SELECTED'))||!(a.approval==='OWNER_APPROVED_R2_20261026'||(methodId==='NUM'&&['OWNER_APPROVED_NUM_R20_20261027','OWNER_NUM_SECTIONS_20261030'].includes(a.approval)))||!a.objectKey.endsWith('-BODY.webp')||!a.objectKey.startsWith('images/reports/')||!a.url.startsWith('https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/')||!a.url.includes('/'+a.objectKey+'?v='+a.sha256)||!/^[a-f0-9]{64}$/.test(a.sha256)||!(a.width>0&&a.height>0))throw fixedVisualError('REPORT_BODY_ASSET_UNAVAILABLE:'+methodId);
 return Object.freeze({...a,pageRole:'BODY_CONTENT',backgroundOnly:true});
}
export const REPORT_BODY_PAGE_CSS='.report-body-backdrop{display:none}.report-customer-content{position:relative;background-image:var(--report-body-image);background-size:100% 297mm;background-repeat:repeat-y;background-position:center top;box-decoration-break:clone;-webkit-box-decoration-break:clone;min-height:297mm;padding:22mm 18mm;break-after:page;overflow-wrap:anywhere}.report-body-reading-field{padding:5mm;background:rgba(255,253,247,.94);box-decoration-break:clone;-webkit-box-decoration-break:clone}.report-customer-content h1,.report-customer-content h2,.report-customer-content h3,.report-customer-content dt{break-after:avoid}.report-customer-content p,.report-customer-content dd{orphans:3;widows:3}.report-customer-content pre{white-space:pre-wrap;overflow-wrap:anywhere}@media print{.report-body-backdrop{display:block;position:fixed;inset:0;z-index:-1;background-image:var(--report-body-image);background-size:100% 100%;background-position:center;print-color-adjust:exact;-webkit-print-color-adjust:exact}.report-customer-content{background:transparent;min-height:0;box-decoration-break:clone;-webkit-box-decoration-break:clone}}';
// Existing-owner content-only preview. It does not imply complete fixed-section composition.
export function renderReportBodyContentPreview({methodId,contentLanguage,html,sourceOwner,sourceReference,manifest=visualManifest}={}){
 const locale=reportContentLocale(contentLanguage),body=resolveReportBodyAsset({methodId,manifest});
 if(typeof html!=='string'||!html.trim()||!sourceOwner||!sourceReference)throw fixedVisualError('REPORT_CUSTOMER_CONTENT_BINDING_REQUIRED');
 return {html:`<!doctype html><html lang="${locale==='bilingual'?'zh-Hans':locale}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;color:#17333e;font:16px/1.65 system-ui,'Microsoft YaHei',sans-serif;--report-body-image:url('${escapeVisual(body.url)}')}${REPORT_BODY_PAGE_CSS}img{max-width:100%}button{display:none}</style><div class="report-body-backdrop" data-body-key="${escapeVisual(body.objectKey)}" aria-hidden="true"></div><article class="report-customer-content" data-page-role="BODY_CONTENT" data-body-key="${escapeVisual(body.objectKey)}"><div class="report-body-reading-field">${html}</div></article></html>`,bodyAsset:body,contentLanguage:locale,completeReport:false,sourceOwner,sourceReference,providerCalls:0};
}
export function requireFixedReportManifest(methodId,contentLanguage,manifest=visualManifest){
 const p=reportVisualArchitecture(methodId),r=manifest.reports?.[methodId];
 if(p.publicationReadiness==='PENDING')throw fixedVisualError('REPORT_FIXED_SECTIONS_PENDING_APPROVAL');
 if(p.masterSectionMode!=='FIXED')throw fixedVisualError('REPORT_DYNAMIC_MASTER_MUST_USE_NATIVE_OWNER');
 if(!r||r.complete!==true||(p.requiredFrontMatterCount&&r.frontMatter.length!==p.requiredFrontMatterCount)||!r.sections.length||new Set([...r.frontMatter,...r.sections]).size!==r.frontMatter.length+r.sections.length)throw fixedVisualError('REPORT_FIXED_MANIFEST_INCOMPLETE:'+methodId);
 const pages=[...r.frontMatter,...r.sections].map(pageId=>resolveFixedReportPage({methodId,pageId,contentLanguage,manifest}));
 if(new Set(pages.map(p=>p.objectKey)).size!==pages.length)throw fixedVisualError('REPORT_FIXED_OBJECT_REPEATED');
 if(pages.slice(0,r.frontMatter.length).some((p,i)=>i===0?p.kind!=='COVER':p.kind!=='FIXED_PRELIMINARY_PAGE')||pages.slice(r.frontMatter.length).some(p=>p.kind!=='FIXED_MASTER_SECTION'))throw fixedVisualError('REPORT_FIXED_PAGE_ROLE_INVALID');
 return pages;
}

export function resolveReportEditorialAsset({registry,methodId,page,locale,publicBaseUrl}={}){
 const contentLocale=reportContentLocale(locale),assetLocale=reportVisualArchitecture(methodId).fixedAssetLanguagePolicy==='BILINGUAL_SHARED'?'bilingual':contentLocale;
 const asset=registry?.assets?.find(x=>x.reportStaticEditorial===true&&x.methodId===methodId&&x.page===page&&x.locale===assetLocale);
 if(!asset||asset.active!==true||!isAssetVerificationRenderable(asset.verification))throw new PublicAssetResolutionError('STATIC_EDITORIAL_ASSET_MISSING','Required report editorial asset is unavailable.',{methodId,page,locale,objectKey:asset?.object_key||null});
 return resolvePublicAsset({registry,assetCode:asset.asset_code,publicBaseUrl,locale:assetLocale,surface:'REPORT'});
}

// Local R2 composition consumes existing owner-rendered content; it creates no report meaning.
// A complete, verified fixed-page sequence is mandatory. Samples use renderFixedReportPage separately.
export function composeFixedEditorialReport({methodId,contentLanguage,contentPages,manifest,contentCss=''}={}){
 const locale=reportContentLocale(contentLanguage),fixed=requireFixedReportManifest(methodId,locale,manifest);
 if(!Array.isArray(contentPages)||contentPages.some(p=>reportContentLocale(p.locale)!==locale||typeof p.html!=='string'||!p.sourceOwner||!p.sourceReference||!fixed.some(a=>a.pageId===p.afterSectionId&&a.kind==='FIXED_MASTER_SECTION')))throw fixedVisualError('REPORT_CUSTOMER_CONTENT_BINDING_REQUIRED');
 const body=contentPages.length?resolveReportBodyAsset({methodId,manifest}):null;
 if(contentPages.some(p=>!p.html.trim()))throw fixedVisualError('REPORT_EMPTY_CONTENT_PAGE_FORBIDDEN');
 const pages=fixed.map(a=>renderFixedReportPage({methodId,pageId:a.pageId,contentLanguage:locale,manifest})+contentPages.filter(p=>p.afterSectionId===a.pageId).map(p=>`<article class="report-customer-content" data-page-role="BODY_CONTENT" data-body-key="${escapeVisual(body.objectKey)}" lang="${locale==='bilingual'?'zh-Hans':locale}" data-source-owner="${p.sourceOwner.replace(/[^a-zA-Z0-9_-]/g,'')}"><div class="report-body-reading-field">${p.html}</div></article>`).join('')).join('');
 return {html:`<!doctype html><html lang="${locale==='bilingual'?'zh-Hans':locale}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>@page{size:A4;margin:0}body{margin:0;color:#17333e;font:16px/1.65 system-ui,'Microsoft YaHei',sans-serif;${body?`--report-body-image:url('${escapeVisual(body.url)}')`:''}}*{box-sizing:border-box}${FIXED_REPORT_PAGE_CSS}${REPORT_BODY_PAGE_CSS}${contentCss}</style>${body?`<div class="report-body-backdrop" data-body-key="${escapeVisual(body.objectKey)}" aria-hidden="true"></div>`:''}<main>${pages}</main></html>`,contentLanguage:locale,fixedAssetLanguage:fixed[0].fixedAssetLanguage,masterSectionMode:'FIXED',bodyAsset:body?{objectKey:body.objectKey,sha256:body.sha256}:null,providerCalls:0,customerPublishable:false};
}

// Acceptance-fix candidate: one shared bilingual P06, actual native final-layout
// events, and measured number slots. Publication remains with existing owners.
export function planSemiFixedReportContents({methodId,purchasedPresentation,registeredAsset,assetRead,visualReview,sectionContract,finalLayout}={}){
 const fail=code=>{throw fixedVisualError(code);};
 if(!['HD','BZR','ZWR','NUM','AST','ECR'].includes(methodId))fail('P06_METHOD_INVALID');
 const locale=reportContentLocale(purchasedPresentation?.reportLocale);
 if(purchasedPresentation?.reportLanguageMode!==(locale==='bilingual'?'BILINGUAL':'SINGLE'))fail('P06_PURCHASE_LANGUAGE_REQUIRED');
 if(!registeredAsset||registeredAsset.methodId!==methodId||registeredAsset.locale!=='bilingual'||registeredAsset.page!==6||registeredAsset.pageRole!=='SEMIFIXED_CONTENTS'||!registeredAsset.object_key)fail('P06_EXACT_REGISTRY_REQUIRED');
 if(assetRead?.methodId!==methodId||assetRead.objectKey!==registeredAsset.object_key||assetRead.httpStatus!==200||assetRead.verification!=='CURRENT_BYTES_DECODED'||assetRead.mime!=='image/webp'||!Number.isInteger(assetRead.width)||!Number.isInteger(assetRead.height)||Math.min(assetRead.width,assetRead.height)<=0||!/^[a-f0-9]{64}$/.test(assetRead.sha256)||!/^[a-f0-9]{64}$/.test(assetRead.decodedPngSHA256))fail('P06_CURRENT_OBJECT_BYTES_REQUIRED');
 if(registeredAsset.sha256&&registeredAsset.sha256!==assetRead.sha256)fail('P06_REGISTERED_VERSION_DRIFT');
 if(!sectionContract||sectionContract.methodId!==methodId||!sectionContract.version||!Array.isArray(sectionContract.sections)||!sectionContract.sections.length)fail('P06_SECTION_OWNER_REQUIRED');
 const sections=sectionContract.sections,ids=sections.map(s=>s.id);
 if(new Set(ids).size!==ids.length||sections.some(s=>!s.id||!s.zh||!s.en))fail('P06_SECTION_IDENTITY_INVALID');
 if((visualReview?.accepted!==true&&visualReview?.localCandidate!==true)||visualReview.sha256!==assetRead.sha256||visualReview.methodId!==methodId||visualReview.fixedTitlesVerified!==true||visualReview.pageNumbersBlank!==true||!Array.isArray(visualReview.rows)||visualReview.rows.length!==ids.length)fail('P06_VISUAL_ACCEPTANCE_REQUIRED');
 if(finalLayout?.methodId!==methodId||finalLayout.contentLanguage!==locale||!finalLayout.reportId||!finalLayout.version||!Number.isInteger(finalLayout.pageCount)||finalLayout.pageCount<7||!Array.isArray(finalLayout.sectionOpeners)||finalLayout.sectionOpeners.length!==ids.length)fail('P06_FINAL_LAYOUT_REQUIRED');
 let previous=5;
 const rows=sections.map((s,i)=>{
  const events=finalLayout.sectionOpeners.filter(e=>e.sectionId===s.id),slots=visualReview.rows.filter(r=>r.sectionId===s.id);
  if(events.length!==1||slots.length!==1)fail('P06_SECTION_DUPLICATE_OR_MISSING');
  const ev=events[0],slot=slots[0],n=ev.physicalPageIndex0;
  if(slot.zh!==s.zh||slot.en!==s.en)fail('P06_FIXED_TITLES_MISMATCH');
  if(!Number.isInteger(n)||n<=previous||n>=finalLayout.pageCount)fail('P06_SECTION_PAGE_ORDER_INVALID');previous=n;
  if(!Number.isFinite(slot.xRight)||!Number.isFinite(slot.y)||slot.xRight<=0||slot.xRight>=1||slot.y<=0||slot.y>=1||!Array.isArray(slot.rect)||slot.rect.length!==4||slot.rect.some(x=>!Number.isFinite(x)||x<0||x>1)||slot.rect[0]>=slot.rect[2]||slot.rect[1]>=slot.rect[3]||slot.xRight<slot.rect[0]||slot.xRight>slot.rect[2]||slot.y<slot.rect[1]||slot.y>slot.rect[3])fail('P06_NUMBER_SLOT_INVALID');
  return Object.freeze({sectionId:s.id,titleZh:s.zh,titleEn:s.en,physicalPageNumber1:n+1,targetPageIndex0:n,xRight:slot.xRight,y:slot.y,rect:Object.freeze([...slot.rect])});
 });
 return Object.freeze({methodId,contentLanguage:locale,fixedAssetLanguage:'bilingual',objectKey:registeredAsset.object_key,sourceSHA256:assetRead.sha256,decodedPngSHA256:assetRead.decodedPngSHA256,imageWidth:assetRead.width,imageHeight:assetRead.height,tocPageIndex0:5,physicalPageCount:finalLayout.pageCount,reportId:finalLayout.reportId,version:finalLayout.version,visualAcceptance:visualReview.accepted===true?'OWNER_ACCEPTED':'LOCAL_CANDIDATE_PENDING_OWNER',rows:Object.freeze(rows),customerPublishable:false});
}
