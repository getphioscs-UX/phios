import {adaptCanonicalMethodProjection} from './method-adapter-base-v1.js';
export function adaptBzrProjection(projection){return adaptCanonicalMethodProjection(projection,{expectedPublicMethodCode:'BAZI_PROJECTION',adapterCode:'BZR_INTERPRETATION_ADAPTER'});}
