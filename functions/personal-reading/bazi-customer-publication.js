import {ownedReportPresentation} from '../commerce/book-commerce-store.js';
import {normalizeVerifiedSymbolicAccountIdentity} from '../symbolic-method-persistence/symbolic-account-identity-v1.js';
import {requirePurchasedReportPresentation,resolveReportProduct} from '../pws/commercial/report-successor-contract.js';
import {projectBaziSectionPublication} from './bazi-section-publication.js';
import {assemblePublicationSnapshot} from '../canonical-presentation-runtime/visual-report-page-runtime.js';
import {SECTION_LAYOUT} from '../canonical-presentation-runtime/report-section-contract.js';
import {visualModules} from '../canonical-presentation-runtime/report-section-config.generated.js';
import {REPORT_EDITORIAL_ASSETS} from '../canonical-presentation-runtime/report-editorial-registry.js';
import {resolveReportEditorialAsset} from '../canonical-presentation-runtime/report-editorial-resolver.js';
import {renderFrozenBaziIntro} from '../../assets/customer-ui/js/personal-products/publication-report-pages.js';

const PUBLIC_BASE='https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev';
export async function buildBaziCustomerPublication({reading,locale,temporalSnapshot,full=false}){
 if(reading?.publicationDecision?.customerPublishable!==true)throw Error('BZR_PUBLICATION_NOT_ADMITTED');
 const projection=await projectBaziSectionPublication({reading,locale,temporalContext:temporalSnapshot,composition:{}});
 const permitted=new Set(visualModules.modules.filter(m=>m.freeVisibility==='PREVIEW').map(m=>m.id));
 const pages=full?projection.pages:projection.pages.filter(p=>permitted.has(p.primaryVisualRef)||p.definitionKey==='S01_P3').map((p,i)=>({...p,pageNumber:i+7}));
 const total=pages.length+6;
 const intro=[1,2,3,4,5].map(page=>({pageNumber:page,kind:'STATIC',src:resolveReportEditorialAsset({registry:{bucket:'phios-public-assets',assets:REPORT_EDITORIAL_ASSETS},methodId:'BZR',page,locale:page===1?'bilingual':locale,publicBaseUrl:PUBLIC_BASE}).src,alt:`BaZi ${page===1?'bilingual cover':locale+' P'+page}`}));
 intro.push({pageNumber:6,kind:'FROZEN_TEMPLATE',html:renderFrozenBaziIntro(projection.legacy.reports.find(r=>r.pages.some(p=>p.pageNumber===6)),total)});
 if(full)return assemblePublicationSnapshot({methodId:'BZR',locale,pages,intro,temporalSnapshot,generatedAt:temporalSnapshot.generatedAt,internalPages:projection.internalSections,layout:SECTION_LAYOUT}).customer;
 // Free subset retains the same report renderer; no separate report runtime.
 return {schemaVersion:'GUIDED_REPORT_SUCCESSOR_R2',methodId:'BZR',locale,totalPages:total,intro,pages,customerPublishable:false,successorBaselineActivated:false,accessState:'FREE_REPORT_PREVIEW'};
}
export function readingPublicationTime(reading,generatedAt=new Date().toISOString()){
 const target=reading.temporalContext?.targetContext;
 return {mode:target?'CUSTOM':'UNAVAILABLE',localDate:target?.targetDate||null,localTime:target?.targetTime||null,timezone:target?.targetTimezone?.iana||null,utcOffset:target?.targetTimezone?.utcOffsetAtTarget||null,generatedAt};
}
// The caller supplies trusted middleware identity, never browser entitlement
// assertions. Reuse the existing purchase/entitlement storage authority.
export async function attachBaziPublicationAccess(view,context,{loadEntitlement=ownedReportPresentation}={}){
 const native=view.methodNativeReading?.BZR;if(!native)return view;
 const locale=view.productRoute?.products?.find(p=>p.methodId==='BZR')?.locale||'en';
 const identity=normalizeVerifiedSymbolicAccountIdentity(context.data?.symbolicAccountIdentity);
 let owned=null,accessReason=null;
 if(identity){try{owned=await loadEntitlement(context.env,identity.userId,'COM-REPORT-BAZI-FULL');if(owned){const selection=requirePurchasedReportPresentation(owned);if(selection.reportLocale!==locale&&selection.reportLocale!=='bilingual'){owned=null;accessReason='PURCHASED_LANGUAGE_MISMATCH';}}}catch{owned=null;accessReason='ENTITLEMENT_UNAVAILABLE';}}
 let full=Boolean(owned)&&['qa','preview'].includes(context.env?.PHIOS_ENVIRONMENT);
 if(owned&&!full)accessReason='FULL_REPORT_RELEASE_PENDING';
 let report=null;
 try{report=await buildBaziCustomerPublication({reading:native,locale,temporalSnapshot:readingPublicationTime(native),full});}
 catch{full=false;accessReason='PUBLICATION_UNAVAILABLE';}
 const price=resolveReportProduct('BAZI_FULL_REPORT');
 const replace=p=>{if(p?.methodId!=='BZR')return p;return {schemaVersion:p.schemaVersion,methodId:p.methodId,productType:p.productType,locale:p.locale,state:p.state,publication:p.publication,specialistRenderer:p.specialistRenderer,hero:{eyebrow:'BaZi',title:locale==='en'?'Your BaZi Report':'你的八字报告',highlights:[]},navigation:[],sections:[],visuals:[],publicationReport:report,reportAccess:{state:full?'FULL_REPORT':'FREE_REPORT_PREVIEW',fullState:full?'OPEN':'PAID_LOCKED',entitlementKey:price.entitlementKey,verifiedPurchase:full,reason:accessReason,offer:{productId:'COM-REPORT-BAZI-FULL',contractProductId:price.productId,amountMinor:price.amountMinor,currency:price.currency,href:'/account/?product=COM-REPORT-BAZI-FULL#commerce'}},...(full?{sourceProduct:native}:{}),boundaries:{publicationCreatesMeaning:false,paymentSuccessIsAuthority:false}};};
 const products=(view.productRoute.products||[]).map(replace),productRoute={...view.productRoute,products,...(view.productRoute.primaryProduct?{primaryProduct:replace(view.productRoute.primaryProduct)}:{})};
 // Exclude alternate copies of the full BaZi workspace from the free response.
 // Other methods and the separately governed Cross owner retain their payloads.
 const next={...view,productRoute};
 if(!full){next.methodNativeReading={...view.methodNativeReading};delete next.methodNativeReading.BZR;
  next.singleMethodReading=view.productRoute.mode==='SINGLE_METHOD'?null:view.singleMethodReading;
  if(view.reading)next.reading={...view.reading,methods:(view.reading.methods||[]).filter(m=>m.methodId!=='BZR')};
  if(Array.isArray(view.methods))next.methods=view.methods.filter(m=>m.methodId!=='BZR'&&m.methodCode!=='BAZI');
  const isBazi=m=>['BZR','BAZI'].includes(String(m?.methodId||m?.methodCode||m?.publicMethodCode||'').toUpperCase());
  const baziProjectionIds=new Set([...(view.structure?.methods||[]),...(view.overview?.perspectivesUsed||[])].filter(isBazi).map(m=>m.projectionId).filter(Boolean));
  const belongs=m=>isBazi(m)||baziProjectionIds.has(m?.projectionId);
  for(const [parent,key] of [['structure','methods'],['interpretation','methods'],['patterns','items'],['currentContext','items']])if(Array.isArray(view[parent]?.[key]))next[parent]={...view[parent],[key]:view[parent][key].filter(m=>!belongs(m))};
 }
 return next;
}

