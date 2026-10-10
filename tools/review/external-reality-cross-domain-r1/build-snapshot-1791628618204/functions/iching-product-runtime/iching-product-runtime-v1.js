/**
 * PHI OS ICH-PROD-W2–W5 — product composition successor for I Ching.
 * The frozen ICH structural runtime is consumed, never rewritten.
 */
import {createIChingRuntime,ICHING_RUNTIME_CODE} from '../core-method-runtime/iching-runtime.js';
import {createIChingHexagramProjector} from '../core-method-runtime/iching-hexagram-projection-mapper.js';
import {adaptIChingProjection} from '../interpretation-runtime/adapters/iching-interpretation-adapter-v1.js';
import {composeIChingRealityLens} from '../interpretation-runtime/iching-reality-composition-v1.js';
import {createIChingReadingIR} from '../interpretation-runtime/iching-reading-ir-v1.js';
import {createIChingProductPublicViewModel} from '../symbolic-method-public-ux/iching-product-view-model-v1.js';
import {assertSymbolicSensitiveDomainBoundary} from '../symbolic-method-public-ux/symbolic-sensitive-domain-guard.js';

export const ICHING_PRODUCT_RUNTIME_CODE='ICHING_SYMBOLIC_REFLECTIVE_PRODUCT_RUNTIME';
export const ICHING_PRODUCT_RUNTIME_VERSION='1.0.0';
const MODES=new Set(['MANUAL_LINES','COIN_CAST','SYSTEM_RANDOM']);
const text=value=>typeof value==='string'?value.normalize('NFKC').trim():'';

function assertAuthorities(a){
  if(a?.hexagramRegistry?.entries?.length!==64) throw new TypeError('ICHING_PRODUCT_64_HEXAGRAM_AUTHORITY_REQUIRED');
  if(!Array.isArray(a?.sourceRegistry?.sources)) throw new TypeError('ICHING_PRODUCT_SOURCE_REGISTRY_REQUIRED');
  if(!Array.isArray(a?.perspectiveRegistry?.perspectives)) throw new TypeError('ICHING_PRODUCT_PERSPECTIVE_REGISTRY_REQUIRED');
  if(!Array.isArray(a?.corpus?.entries)) throw new TypeError('ICHING_PRODUCT_CORPUS_REQUIRED');
}

function buildEvidence(request){
  const inputMode=text(request.inputMode||'MANUAL_LINES').toUpperCase();
  if(!MODES.has(inputMode)) throw new TypeError('UNSUPPORTED_ICHING_INPUT_MODE');
  const sessionId=text(request.sessionId);
  const timestamp=text(request.timestamp);
  if(!sessionId) throw new TypeError('ICHING_PRODUCT_SESSION_ID_REQUIRED');
  if(!timestamp||Number.isNaN(Date.parse(timestamp))) throw new TypeError('ICHING_PRODUCT_TIMESTAMP_REQUIRED');
  let selectedSymbols;
  if(inputMode==='MANUAL_LINES'){
    if(!Array.isArray(request.lines)||request.lines.length!==6) throw new TypeError('ICHING_PRODUCT_SIX_MANUAL_LINES_REQUIRED');
    selectedSymbols=request.lines.map(String);
  }else if(inputMode==='COIN_CAST'){
    if(!Array.isArray(request.coinLines)||request.coinLines.length!==6||request.coinLines.some(x=>!Array.isArray(x)||x.length!==3)) throw new TypeError('ICHING_PRODUCT_SIX_COIN_LINES_REQUIRED');
    selectedSymbols=request.coinLines.map(x=>x.join(','));
  }else{
    const supplied=request.randomSelectionEvidence;
    if(!supplied||!Array.isArray(supplied.selectedSymbols)||supplied.selectedSymbols.length!==6) throw new TypeError('ICHING_PRODUCT_PERSISTED_RANDOM_SELECTION_EVIDENCE_REQUIRED');
    selectedSymbols=supplied.selectedSymbols.map(String);
  }
  const random=inputMode==='SYSTEM_RANDOM';
  return Object.freeze({
    schemaVersion:'PHI-OS-SYMBOLIC-METHOD-EVIDENCE-v1.0.0',
    methodId:'I_CHING',
    sessionId,
    inputMode,
    selectionMode:random?'SYSTEM_RANDOM':'MANUAL_SELECTION',
    selectionEvidence:Object.freeze({
      selectionOrder:Object.freeze([1,2,3,4,5,6]),
      selectedSymbols:Object.freeze(selectedSymbols),
      runtimeVersion:'1.0.0',
      aiSelected:false,
      ...(random?{
        seed:text(request.randomSelectionEvidence.seed),
        entropyEvidence:structuredClone(request.randomSelectionEvidence.entropyEvidence||{}),
        replayToken:text(request.randomSelectionEvidence.replayToken)
      }:{})
    }),
    timestamp,
    runtimeVersion:'1.0.0',
    projectionVersion:text(request.projectionVersion)||'1.0.0'
  });
}

export async function executeIChingProductRuntime(request={},authorities={}){
  if(text(request.method||'I_CHING').toUpperCase()!=='I_CHING') throw new TypeError('ICHING_PRODUCT_METHOD_REQUIRED');
  if(!text(request.question)) throw new TypeError('ICHING_READING_QUESTION_REQUIRED');
  assertAuthorities(authorities);
  const evidence=buildEvidence(request);
  const calculationId=text(request.calculationId)||`ICH-PROD-${evidence.sessionId}`;
  const calculationResult=await createIChingRuntime().calculate({runtimeCode:ICHING_RUNTIME_CODE,calculationId,evidence});
  const projection=await createIChingHexagramProjector().project({calculationResult,projectionVersion:evidence.projectionVersion});
  const bundle=adaptIChingProjection(projection,{
    hexagramRegistry:authorities.hexagramRegistry,
    sourceRegistry:authorities.sourceRegistry,
    perspectiveRegistry:authorities.perspectiveRegistry,
    corpus:authorities.corpus,
    selectedSourceIds:request.selectedSourceIds||null,
    selectedPerspectiveIds:request.selectedPerspectiveIds||null
  });
  const composition=composeIChingRealityLens(bundle);
  const sensitiveDomainBoundary=assertSymbolicSensitiveDomainBoundary({question:request.question,generatedOutput:JSON.stringify({questionsForReflection:composition.questionsForReflection,authority:composition.authority}),authorityClass:'SYMBOLIC_REFLECTION'});
  const readingIr=createIChingReadingIR({
    question:request.question,evidence,calculationResult,projection,bundle,composition,
    contextDisclosure:request.contextDisclosure||{},
    realityEvidence:request.realityEvidence||{},
    compositionEvidence:{
      authorityVersions:{
        hexagramRegistryVersion:authorities.hexagramRegistry.registryVersion,
        sourceRegistryVersion:authorities.sourceRegistry.registryVersion,
        perspectiveRegistryVersion:authorities.perspectiveRegistry.registryVersion,
        corpusVersion:authorities.corpus.corpusVersion
      },
      authorityDigests:request.authorityDigests||{},
      generatedAt:evidence.timestamp
    },
    sensitiveDomainBoundary
  });
  const publicView=createIChingProductPublicViewModel(readingIr,authorities);
  return Object.freeze({
    ok:true,
    runtimeCode:ICHING_PRODUCT_RUNTIME_CODE,
    runtimeVersion:ICHING_PRODUCT_RUNTIME_VERSION,
    method:'I_CHING',
    readingIr,
    publicView,
    execution:Object.freeze({deterministicStructure:true,aiSelected:false,rerolledInsideCalculation:false,providerUsed:false,automaticPersistence:false}),
    production:Object.freeze({sourceRuntimeReady:true,runAllowedRequiresTrustedActivationAuthority:true,productionEligible:false,limitedProductionActivated:false})
  });
}

export {buildEvidence as buildIChingProductEvidence};
