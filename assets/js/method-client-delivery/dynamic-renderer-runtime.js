import {assertCanonicalRendererInput,blockedRenderResult,evaluateRendererAuthority,getPublicMethodCode} from './renderers/renderer-core.js';
import {renderAstrologyCanonicalProjection} from './renderers/astrology-renderer.js';
import {renderBaziCanonicalProjection} from './renderers/bazi-renderer.js';
import {renderNumerologyCanonicalProjection} from './renderers/numerology-renderer.js';
import {renderHdrValidationProjection} from './renderers/hdr-validation-renderer.js';
import {renderCrossMethodCanonicalComposition} from './renderers/cross-method-renderer.js';
export function renderCanonicalMethodProjection(canonical,{locale='en',mode='PRODUCTION',validationFixture=false,lineage=[]}={}){
 assertCanonicalRendererInput(canonical);const authority=evaluateRendererAuthority(canonical,mode,{validationFixture});if(!authority.allowed)return blockedRenderResult(canonical,authority,{locale,lineage});const code=getPublicMethodCode(canonical);if(code==='ASTROLOGY_PROJECTION')return renderAstrologyCanonicalProjection(canonical,{locale,lineage});if(code==='BAZI_PROJECTION')return renderBaziCanonicalProjection(canonical,{locale,lineage});if(code==='NUMEROLOGY_PROJECTION')return renderNumerologyCanonicalProjection(canonical,{locale,lineage});if(code==='PERSONAL_RUNTIME_PROJECTION')return renderHdrValidationProjection(canonical,{locale,lineage,validationFixture});return blockedRenderResult(canonical,{mode:'BLOCKED',reasonCode:'MCD6_RENDERER_NOT_REGISTERED'},{locale,lineage});
}
export {renderCrossMethodCanonicalComposition};
