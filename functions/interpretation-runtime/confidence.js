import { loadInterpretationRegistry } from './registry-loader.js';
export function isInterpretationConfidence(value){ return loadInterpretationRegistry('confidence').classes.includes(value); }
export function confidenceVocabulary(){ return [...loadInterpretationRegistry('confidence').classes]; }
