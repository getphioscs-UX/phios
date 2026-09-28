import {renderPhiMandalaVisual,installPhiMandalaInteractions} from './mandala-renderer.js';
import {renderCalculationStoryVisual} from './calculation-story-renderer.js';
import {renderCoordinateStoryVisual} from './coordinate-story-renderer.js';
import {renderDriverProfileVisual} from './driver-profile-renderer.js';
import {renderMotionConfigurationVisual} from './motion-renderer.js';
import {renderActivationTimelineVisual} from './activation-renderer.js';
import {renderTechnicalDisclosure} from './technical-disclosure-renderer.js';
import {renderEcrNavigation,renderEcrReadingReport} from './reading-report-renderer.js';
import {renderEcrHumanRuntimeReport,renderEcrFullReportSections,renderEcrFullReportNavigation} from './full-report-sections-renderer.js';
import {renderVisualReportPages} from '../../personal-products/visual-report-pages.js';

const arr=value=>Array.isArray(value)?value:[];

const ecrAssetUrl=key=>key?`https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/${String(key).replace(/^\\/+/, '')}`:'';
const ecrLocal=(value,locale)=>value&&typeof value==='object'?(locale==='zh-Hans'?(value['zh-Hans']??value.en):(value.en??value['zh-Hans'])):(value??'');
const renderV41PhiCards=(payload,locale)=>{
 const cards=arr(payload?.cards);
 if(!cards.length)return '';
 return `<section class="cx-ecr-v41-cards" data-ecr-v41-cards><p class="cx-eyebrow">${locale==='zh-Hans'?'确定性视觉摘要 · 非随机抽牌':'Deterministic visual summary · not a random draw'}</p><h2>${locale==='zh-Hans'?'六张 PHI Cards':'Six PHI Cards'}</h2><div class="cx-ecr-spread__grid">${cards.map(card=>`<article data-ecr-card-id="${String(card.cardId||'')}">${card.asset?.objectKey?`<img src="${ecrAssetUrl(card.asset.objectKey)}" alt="${String(ecrLocal(card.title,locale)||card.cardId||'')}" loading="lazy" width="240" height="320">`:''}<div><small>${String(card.slot||'')}</small><h3>${String(ecrLocal(card.title,locale)||card.cardId||'UNKNOWN')}</h3><p>${String(ecrLocal(card.oneLineInsight,locale)||ecrLocal(card.meaning,locale)||'')}</p>${card.status!=='ADMITTED_SELECTION'? `<p>${locale==='zh-Hans'?'此槽位证据不足，保持未知。':'Evidence is insufficient for this slot; it remains unknown.'}</p>`:''}</div></article>`).join('')}</div></section>`;
};

// Presentation orchestration only. All semantic selections arrive through the
// governed ECR product envelope / Mandala projection; this module performs no
// calculation, longitude mapping, meaning lookup or AI interpretation.
export function renderEcrProduct({product,visualReport=null}={}){
  if(product?.methodId!=='ECR'||product?.productType!=='PHI_CONFIGURATION_READING')return Object.freeze({status:'NOT_HANDLED',reason:'ECR_PRODUCT_REQUIRED'});
  const mandala=arr(product.visuals).find(item=>item.type==='ECR_PHI_MANDALA_V1');
  const cards=arr(product.visuals).find(item=>item.type==='ECR_SIX_CARD_SPREAD');
  const full=product.sourceProduct?.fullReport;
  if(visualReport){
    if(full?.publicationState!=='INTERNAL_REVIEW'||visualReport.sourceReportRef!==full.reportId||visualReport.depth!==full.depth||visualReport.locale!==full.locale)throw Error('VRPT_ECR_REVIEW_BINDING_REQUIRED');
    return Object.freeze({status:'RENDERED',navigationHtml:'',visualHtml:'',readingHtml:renderVisualReportPages(visualReport,{primaryVisuals:mandala?{'VRPT-ECR-OVERVIEW':renderPhiMandalaVisual(mandala,{experienceState:product.publication.mandalaExperienceState,svgOnly:true})}:{}}),technicalHtml:'',afterMount:()=>0});
  }
  if(full?.edition==='ECR_HUMAN_RUNTIME_V4_1')return Object.freeze({status:'RENDERED',navigationHtml:'',visualHtml:mandala?renderPhiMandalaVisual(mandala):'',readingHtml:renderEcrHumanRuntimeReport(full)+renderV41PhiCards(cards?.payload,product.locale),technicalHtml:'',afterMount:mount=>installPhiMandalaInteractions(mount?.visual)});
  if(full?.edition==='ECR_FULL_R1')return Object.freeze({status:'RENDERED',navigationHtml:renderEcrFullReportNavigation(full),visualHtml:'',readingHtml:renderEcrFullReportSections(full)+(mandala?renderPhiMandalaVisual(mandala,{experienceState:product.publication.mandalaExperienceState}):''),technicalHtml:'',afterMount:mount=>mandala?installPhiMandalaInteractions(mount?.reading):0});
  const visualHtml=mandala?[renderPhiMandalaVisual(mandala,{experienceState:product?.publication?.mandalaExperienceState||'FREE_SNAPSHOT',topicProjection:product?.publication?.mandalaTopicProjection||null}),renderCalculationStoryVisual(mandala),renderCoordinateStoryVisual(mandala),renderDriverProfileVisual(mandala),renderMotionConfigurationVisual(mandala),renderActivationTimelineVisual(mandala)].join(''):'';
  return Object.freeze({
    status:'RENDERED',
    navigationHtml:mandala?renderEcrNavigation(product):'',
    visualHtml,
    readingHtml:renderEcrReadingReport(product,cards),
    technicalHtml:mandala?renderTechnicalDisclosure(product):'',
    afterMount:mount=>mandala?installPhiMandalaInteractions(mount?.visual):0
  });
}
export default Object.freeze({renderEcrProduct});
