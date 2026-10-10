/**
 * ICHI-DEPTH-W10 current admitted-editorial Runtime successor.
 * v1 remains historical. v2 consumes the v2 admitted corpus created only from
 * 448/448 human-approved candidate-digest bindings.
 */
import {
  createIChingDepthEditorialIndex as createV1Index,
  selectIChingDepthInterpretation as selectV1,
  composeIChingDepthReadingSupplement as composeV1,
  inspectIChingDepthAdmission as inspectV1
} from './iching-depth-editorial-runtime-v1.js';

export const ICHING_DEPTH_EDITORIAL_RUNTIME_VERSION='2.0.0';
const V2='PHI-OS-ICHI-DEPTH-ADMITTED-EDITORIAL-CORPUS-v2.0.0';
const V1='PHI-OS-ICHI-DEPTH-ADMITTED-EDITORIAL-CORPUS-v1.0.0';
const clone=value=>structuredClone(value);

function asV1(corpus){
  if(corpus?.schemaVersion===V1) return corpus;
  if(corpus?.schemaVersion!==V2||!Array.isArray(corpus.entries)) throw new TypeError('ICHI_DEPTH_ADMITTED_CORPUS_V2_REQUIRED');
  if(corpus.humanEditorialComplete!==true||corpus.coverage?.total!=='448/448') throw new TypeError('ICHI_DEPTH_448_HUMAN_APPROVED_CORPUS_REQUIRED');
  return {...clone(corpus),schemaVersion:V1};
}

export function createIChingDepthEditorialIndex(admittedCorpus){return createV1Index(asV1(admittedCorpus));}
export function selectIChingDepthInterpretation(input={}){return selectV1({...input,admittedCorpus:asV1(input.admittedCorpus)});}
export function composeIChingDepthReadingSupplement(input={}){return composeV1(input);}
export function inspectIChingDepthAdmission(admittedCorpus){
  const inspected=inspectV1(asV1(admittedCorpus));
  return Object.freeze({...inspected,humanEditorialComplete:inspected.admitted===448&&inspected.hexagram===64&&inspected.line===384,publicDepthReady:false,productionAuthorityChanged:false});
}
