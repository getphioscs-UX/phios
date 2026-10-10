export const PPR_R3_SPECIALIST_RENDERER_SURFACE_CONTRACT='PHI-OS-PPR-R3-SPECIALIST-RENDERER-PORT-v1.0.0';
export const PPR_R3_SPECIALIST_RENDERER_ROOT='/assets/customer-ui/js/specialists/';
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const x of Object.values(value))freeze(x)}return value};
const entries=[
 {rendererId:'PPR_R3_AST_PRODUCT_V1',ownerMethod:'AST',module:'/assets/customer-ui/js/specialists/ast/product-renderer.js',export:'renderAstrologyProduct',supportedProductContract:'ASTROLOGY_PROFESSIONAL_READING',surfaceContract:PPR_R3_SPECIALIST_RENDERER_SURFACE_CONTRACT,version:'1.0.0'},
 {rendererId:'PPR_R3_BAZI_PRODUCT_V1',ownerMethod:'BZR',module:'/assets/customer-ui/js/specialists/bazi/product-renderer.js',export:'renderBaziProduct',supportedProductContract:'BAZI_PROFESSIONAL_READING',surfaceContract:PPR_R3_SPECIALIST_RENDERER_SURFACE_CONTRACT,version:'1.0.0'},
 {rendererId:'PPR_R3_NUM_PRODUCT_V1',ownerMethod:'NUM',module:'/assets/customer-ui/js/specialists/num/product-renderer.js',export:'renderNumerologyProduct',supportedProductContract:'NUMEROLOGY_PROFESSIONAL_READING',surfaceContract:PPR_R3_SPECIALIST_RENDERER_SURFACE_CONTRACT,version:'1.0.0'},
 {rendererId:'PPR_R3_ZIWEI_PRODUCT_V1',ownerMethod:'ZWR',module:'/assets/customer-ui/js/specialists/ziwei/product-renderer.js',export:'renderZiweiProduct',supportedProductContract:'ZIWEI_FULL_PRODUCTION',surfaceContract:PPR_R3_SPECIALIST_RENDERER_SURFACE_CONTRACT,version:'1.0.0'},
 {rendererId:'PPR_R3_ECR_PRODUCT_V1',ownerMethod:'ECR',module:'/assets/customer-ui/js/specialists/ecr/product-renderer.js',export:'renderEcrProduct',supportedProductContract:'PHI_CONFIGURATION_READING',surfaceContract:PPR_R3_SPECIALIST_RENDERER_SURFACE_CONTRACT,version:'1.0.0'}
];
export const PPR_R3_SPECIALIST_RENDERER_REGISTRY=freeze(Object.fromEntries(entries.map(entry=>[entry.rendererId,freeze(entry)])));
export function isApprovedSpecialistModulePath(value){const path=String(value||'');return path.startsWith(PPR_R3_SPECIALIST_RENDERER_ROOT)&&!path.includes('..')&&!path.includes('://')&&!path.startsWith('//')&&/\.js$/.test(path)}
export function resolveSpecialistRendererDescriptor(product){
 const ref=product?.specialistRenderer;if(!ref?.rendererId)return null;
 if(Object.keys(ref).some(key=>/module|export|url|href|src/i.test(key)))return null;
 const entry=PPR_R3_SPECIALIST_RENDERER_REGISTRY[ref.rendererId];if(!entry)return null;
 if(entry.ownerMethod!==product?.methodId||entry.supportedProductContract!==product?.productType)return null;
 if(entry.surfaceContract!==PPR_R3_SPECIALIST_RENDERER_SURFACE_CONTRACT||ref.surfaceContract!==PPR_R3_SPECIALIST_RENDERER_SURFACE_CONTRACT)return null;
 if(!isApprovedSpecialistModulePath(entry.module))return null;
 return entry;
}
export default PPR_R3_SPECIALIST_RENDERER_REGISTRY;
