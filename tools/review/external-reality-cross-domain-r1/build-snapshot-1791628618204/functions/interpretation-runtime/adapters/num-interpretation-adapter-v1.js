import {adaptCanonicalMethodProjection} from './method-adapter-base-v1.js';
export function adaptNumProjection(projection){return adaptCanonicalMethodProjection(projection,{expectedPublicMethodCode:'NUMEROLOGY_PROJECTION',adapterCode:'NUM_INTERPRETATION_ADAPTER'});}
