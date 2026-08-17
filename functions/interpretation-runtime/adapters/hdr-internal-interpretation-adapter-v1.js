import {adaptCanonicalMethodProjection} from './method-adapter-base-v1.js';
export function adaptHdrInternalProjection(projection,{internal=false}={}){if(!internal)throw new TypeError('HDR_INTERNAL_INTERPRETATION_ONLY');return adaptCanonicalMethodProjection(projection,{expectedPublicMethodCode:'PERSONAL_RUNTIME_PROJECTION',adapterCode:'HDR_INTERNAL_INTERPRETATION_ADAPTER',internal:true});}
