import { derive as deriveEdge } from './derivation-engine-v2.js';
import { routeInterpretation } from './kernel-router-v1.js';
export function derive(source,targetType,context={}){ return deriveEdge(source,targetType,context); }
export function deriveDomain(route,operation,...args){ return routeInterpretation(route,operation,...args); }
export const INTERPRETATION_KERNEL_AUTHORITY=Object.freeze({calculation:false,projection:false,canonicalMeaningIdentity:false,reading:false,navigation:false,professionalJudgment:false,llmRequired:false,aiCompositionOnly:true});
