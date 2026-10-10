import {PERSONAL_READING_REPORT_IR_V2_SCHEMA} from './personal-reading-composer-v2.js';
import {createVisualPage} from '../canonical-presentation-runtime/visual-report-page-runtime.js';
import {VISUAL_REPORT_PRODUCTS} from '../canonical-presentation-runtime/visual-report-registry.js';
// A child projection references the existing semantic IR; no second report
// owner and no mutation of the parent's semantic digest are introduced.
export function bindVisualPagesToReportIRv2({personalReadingReport,visualReport,sourceSemanticDigest}) {
 if(personalReadingReport?.schemaVersion!==PERSONAL_READING_REPORT_IR_V2_SCHEMA||!personalReadingReport.reportId||!personalReadingReport.semanticDigest)throw Error('VRPT_PERSONAL_REPORT_IR_REQUIRED');
 if(personalReadingReport.locale!==visualReport.locale)throw Error('VRPT_PARENT_LOCALE_MISMATCH');
 const method=personalReadingReport.methodReadingRefs.find(x=>x.methodId===visualReport.methodId);
 const cross=visualReport.methodId==='CROSS'&&personalReadingReport.crossPerspective?.readingDigest===sourceSemanticDigest;
 const profile=visualReport.methodId==='PROFILE'&&visualReport.identity?.signalRefs?.length&&visualReport.sourceReportRef===sourceSemanticDigest&&visualReport.identity.signalRefs.every(r=>personalReadingReport.profileSignalRefs.includes(r));
 if(!sourceSemanticDigest||(!cross&&!profile&&method?.semanticDigest!==sourceSemanticDigest))throw Error('VRPT_PARENT_METHOD_DIGEST_MISMATCH');
 const pages=[...visualReport.pages];
 if(visualReport.depth==='PAID'&&visualReport.methodId!=='ECR'){
  const product=VISUAL_REPORT_PRODUCTS.find(p=>p.productId===visualReport.productId&&p.methodId===visualReport.methodId);if(!product)throw Error('VRPT_PRODUCT_BINDING_REQUIRED');
  const names={BZR:['Ba Zi','八字'],ZWR:['Zi Wei','紫微斗数'],AST:['Astrology','占星'],NUM:['Numerology','数字学'],PROFILE:['Profile','Profile'],HD:['Human Design','人类图'],CROSS:['Cross Perspective','跨方法视角']},zh=visualReport.locale==='zh-Hans',name=names[product.methodId][zh?1:0],title=zh?`${name} · 完整报告`:`${name} · Full report`,question=zh?'如何从已知结构，读到关系与观察问题？':'How can known structures lead into relationships and observation?';
  const dataRefs=[visualReport.sourceReportRef,`VISUAL_REPORT_PRODUCTS#${product.productId}`];
  pages.unshift(createVisualPage({pageId:`VRPT-${product.methodId}-COVER`,methodId:product.methodId,productId:product.productId,sourceReportRef:visualReport.sourceReportRef,locale:visualReport.locale,title,question,templateId:'RPT-T00',visual:{type:'STRUCTURAL_DIAGRAM',nodes:[{id:product.productId,label:title,sourceRefs:dataRefs}],edges:[],dataRefs,a11ySummary:title,coverAssetUrl:`/assets/reports/PHIOS-${product.assetId}-v1.svg`},insights:[],evidenceRefs:dataRefs,claimUniverseRefs:[],informationUnitRefs:[],freePaid:'PAID'}));
 }
 return {...visualReport,parent:{schemaVersion:personalReadingReport.schemaVersion,reportId:personalReadingReport.reportId,semanticDigest:personalReadingReport.semanticDigest,methodSemanticDigest:sourceSemanticDigest},pages:pages.map(p=>({...p,parentReportRef:personalReadingReport.reportId})),governance:{presentationOnly:true,parentSemanticIrMutated:false,freeReportConvertedToPaidNarrative:false,newMeaningAuthorityCreated:false}};
}
