import {renderPhiMandalaVisual,installPhiMandalaInteractions} from './mandala-renderer.js';
import {renderCalculationStoryVisual} from './calculation-story-renderer.js';
import {renderCoordinateStoryVisual} from './coordinate-story-renderer.js';
import {renderDriverProfileVisual} from './driver-profile-renderer.js';
import {renderMotionConfigurationVisual} from './motion-renderer.js';
import {renderActivationTimelineVisual} from './activation-renderer.js';
import {renderTechnicalDisclosure} from './technical-disclosure-renderer.js';
import {renderEcrNavigation,renderEcrReadingReport} from './reading-report-renderer.js';

const arr=value=>Array.isArray(value)?value:[];

// Presentation orchestration only. All semantic selections arrive through the
// governed ECR product envelope / Mandala projection; this module performs no
// calculation, longitude mapping, meaning lookup or AI interpretation.
export function renderEcrProduct({product}={}){
  if(product?.methodId!=='ECR'||product?.productType!=='PHI_CONFIGURATION_READING')return Object.freeze({status:'NOT_HANDLED',reason:'ECR_PRODUCT_REQUIRED'});
  const mandala=arr(product.visuals).find(item=>item.type==='ECR_PHI_MANDALA_V1');
  const cards=arr(product.visuals).find(item=>item.type==='ECR_SIX_CARD_SPREAD');
  const visualHtml=mandala?[renderPhiMandalaVisual(mandala),renderCalculationStoryVisual(mandala),renderCoordinateStoryVisual(mandala),renderDriverProfileVisual(mandala),renderMotionConfigurationVisual(mandala),renderActivationTimelineVisual(mandala)].join(''):'';
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
