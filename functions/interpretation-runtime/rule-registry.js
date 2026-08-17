import { loadInterpretationRegistry } from './registry-loader.js';
export function ruleLifecycle(){ return [...loadInterpretationRegistry('ruleLifecycle').lifecycle]; }
export function hypothesisLifecycle(){ return [...loadInterpretationRegistry('hypothesisLifecycle').states]; }
export function mayPromoteToCanonical({humanReviewed=false}={}){ return humanReviewed===true; }
