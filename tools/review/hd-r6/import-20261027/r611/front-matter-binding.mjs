// Private candidate orchestration, not a new permission or asset registry.
// Actual account delivery calls requireHdQaArtifactEntitlement before this step.
import {editorialAsset} from '../../../../../functions/canonical-presentation-runtime/report-editorial-registry.js';
import {requirePurchasedReportPresentation} from '../../../../../functions/pws/commercial/report-successor-contract.js';
import {resolveHdFrontMatterForLocalReview} from '../../../../../functions/canonical-presentation-runtime/report-editorial-resolver.js';
export function selectHdFrontMatterForLocalReview({entitlement,requested,bindings,localReview=false}={}){
 if(!localReview||entitlement?.product_id!=='COM-REPORT-HD-FULL')throw Error('HD_FRONT_MATTER_LOCAL_REVIEW_ONLY');
 const p=entitlement.reportPresentation;
 if(!p||!['zh-Hans','en','bilingual'].includes(p.reportLocale)||!['SINGLE','BILINGUAL'].includes(p.reportLanguageMode))throw Error('HD_FRONT_MATTER_PERSISTED_LANGUAGE_REQUIRED');
 const purchased=requirePurchasedReportPresentation(entitlement,requested);
 return resolveHdFrontMatterForLocalReview({localReview:true,purchasedPresentation:purchased,registeredPages:Array.from({length:5},(_,i)=>editorialAsset('HD',i+1,purchased.reportLocale)),bindings});
}
