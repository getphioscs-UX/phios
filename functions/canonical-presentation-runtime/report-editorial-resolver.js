import {PublicAssetResolutionError,isAssetVerificationRenderable,resolvePublicAsset} from '../../assets/js/runtime/web-production/asset-resolver.js';
import {reportVisualArchitecture} from './report-visual-architecture.js';
import visualManifest from '../../content/reports/shared/report-visual-assets-r2.json';
const fixedVisualError=message=>Object.assign(new Error(message),{code:message.split(':')[0],status:409});

export function reportContentLocale(locale){if(locale==='zh'||locale==='ZH')return 'zh-Hans';if(locale==='EN')return 'en';if(locale==='BILINGUAL')return 'bilingual';if(!['zh-Hans','en','bilingual'].includes(locale))throw fixedVisualError('REPORT_CONTENT_LANGUAGE_INVALID');return locale;}
export function resolveFixedReportPage({methodId,pageId,contentLanguage,manifest=visualManifest}={}){
 const policy=reportVisualArchitecture(methodId),locale=reportContentLocale(contentLanguage);
 if(policy.publicationReadiness==='PENDING')throw fixedVisualError('REPORT_FIXED_SECTIONS_PENDING_APPROVAL');
 const language=policy.fixedAssetLanguagePolicy==='BILINGUAL_SHARED'?'bilingual':locale;
 const rows=manifest.assets.filter(a=>a.methodId===methodId&&a.pageId===pageId&&a.language===language);
 if(rows.length!==1)throw fixedVisualError('REPORT_FIXED_ASSET_MISSING:'+methodId+':'+pageId+':'+language);
 const a=rows[0];
 if(!['COVER','FIXED_PRELIMINARY_PAGE','FIXED_MASTER_SECTION'].includes(a.kind))throw fixedVisualError('REPORT_FIXED_PAGE_ROLE_INVALID');
 if(a.kind==='FIXED_MASTER_SECTION'&&policy.masterSectionMode!=='FIXED')throw fixedVisualError('REPORT_DYNAMIC_MASTER_MUST_USE_NATIVE_OWNER');
 if(a.active!==true||a.customerSpecific!==false||a.approval!=='OWNER_APPROVED_R2_20261026'||a.verification!=='PUBLIC_BYTES_DECODED_AND_VISUALLY_REVIEWED'||!/^images\/reports\//.test(a.objectKey)||!/^https:\/\/pub-1967bc5812ee4164b19a806fb1427021\.r2\.dev\//.test(a.url)||!a.url.includes('/'+a.objectKey+'?v='+a.sha256)||!/^[a-f0-9]{64}$/.test(a.sha256)||!(a.width>0&&a.height>0))throw fixedVisualError('REPORT_FIXED_ASSET_NOT_VERIFIED');
 return Object.freeze({...a,contentLanguage:locale,fixedAssetLanguage:language,masterSectionMode:policy.masterSectionMode});
}
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
 if(a.kind!=='OTHER_APPROVED_REPORT_PAGE'||a.active!==true||a.verification!=='PUBLIC_BYTES_DECODED_AND_VISUALLY_REVIEWED'||a.approval!=='OWNER_APPROVED_R2_20261026'||!a.objectKey.endsWith('-BODY.webp')||!a.objectKey.startsWith('images/reports/')||!a.url.startsWith('https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/')||!a.url.includes('/'+a.objectKey+'?v='+a.sha256)||!/^[a-f0-9]{64}$/.test(a.sha256)||!(a.width>0&&a.height>0))throw fixedVisualError('REPORT_BODY_ASSET_UNAVAILABLE:'+methodId);
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
