/** PHI OS TPA-M production Tarot runtime. No model chooses cards or meanings. */
import crypto from 'node:crypto';
import {createTarotSelectionRuntime,TAROT_DECK_ID,TAROT_DECK_VERSION,TAROT_ORIENTATION_POLICY_ID,TAROT_ORIENTATION_POLICY_VERSION} from '../core-method-runtime/tarot-selection-runtime.js';
import {createTarotRuntime,TAROT_RUNTIME_CODE} from '../core-method-runtime/tarot-runtime.js';
import {createTarotCardProjector} from '../core-method-runtime/tarot-card-projection-mapper.js';
import {createTarotReadingIR} from '../interpretation-runtime/tarot-reading-ir-v2.js';
import {createTarotProductPublicViewModel} from '../symbolic-method-public-ux/tarot-product-view-model-v2.js';

export const TAROT_PRODUCTION_RUNTIME_VERSION='1.0.0';
export const TAROT_CORPUS_FREEZE_SHA256='6c8ee89154491f762bf44b0f1e8b645feb6705d466c1379d40d5ecefe6aa9d46';
export const TAROT_PRODUCT_INTERPRETATION_FREEZE_SHA256='cddd6ac2b81252f8677248ded9d9f651a46f9dcf9bc57c0cae0e22713122dfda';

const clean=v=>String(v??'').trim();
const hex=b=>[...b].map(x=>x.toString(16).padStart(2,'0')).join('');
const sha256=v=>crypto.createHash('sha256').update(v).digest('hex');
const now=()=>new Date().toISOString();
function object(v,msg){if(!v||typeof v!=='object'||Array.isArray(v))throw new TypeError(msg);}
function authorities(a){
  object(a,'TAROT_PRODUCTION_AUTHORITIES_REQUIRED');
  const structural={deckContract:a.deckContract,cardRegistry:a.cardRegistry,spreadRegistry:a.spreadRegistry,orientationPolicy:a.orientationPolicy};
  const interpretation={cardRegistry:a.cardRegistry,visualCorpus:a.visualCorpus,visualLocator:a.visualLocator,sourceRegistry:a.sourceRegistry,perspectiveRegistry:a.perspectiveRegistry,waiteCorpus:a.waiteCorpus,editorialCorpus:a.editorialCorpus,cardReflectiveCorpus:a.cardReflectiveCorpus,productCompositionCorpus:a.productCompositionCorpus,noSourceBlendingContract:a.noSourceBlendingContract,corpusFreeze:a.corpusFreeze,productInterpretationFreeze:a.productInterpretationFreeze};
  return {structural,interpretation};
}
function randomEvidence(){
  const bytes=new Uint8Array(32);globalThis.crypto.getRandomValues(bytes);
  const seed=hex(bytes);const digest=sha256(Buffer.from(bytes));
  return {seed,entropyEvidence:{source:'WEB_CRYPTO_GET_RANDOM_VALUES',digest},replayToken:`TAR-REPLAY-${crypto.randomUUID()}`};
}
function normalizeSpread(value){return clean(value||'ONE_CARD').toUpperCase()==='THREE_CARD'?'THREE_CARD':'ONE_CARD';}
function normalizeRealityEvidence(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input))return {};
  return {supportingEvidence:input.supportingEvidence,contradictoryEvidence:input.contradictoryEvidence,unknown:input.unknown,observation:input.observation,notSupportedByReality:input.notSupportedByReality===true,sourceDisagreement:input.sourceDisagreement===true};
}
export async function executeTarotProductRuntime(request={},allAuthorities={}){
  const question=clean(request.question);if(!question)throw new TypeError('TAROT_READING_QUESTION_REQUIRED');
  const {structural,interpretation}=authorities(allAuthorities);const spreadId=normalizeSpread(request.spread||request.spreadId);
  const inputMode=Array.isArray(request.selectedCardIds)&&request.selectedCardIds.length?'MANUAL_SELECTION':'SYSTEM_RANDOM';
  const timestamp=now();const sessionId=`TAR-PROD-${crypto.randomUUID()}`;
  const common={inputMode,sessionId,timestamp,deckId:TAROT_DECK_ID,deckVersion:TAROT_DECK_VERSION,orientationPolicyId:TAROT_ORIENTATION_POLICY_ID,orientationPolicyVersion:TAROT_ORIENTATION_POLICY_VERSION,spreadId,spreadVersion:'1.0.0',projectionVersion:'1.0.0'};
  const selectionRequest=inputMode==='MANUAL_SELECTION'?{...common,selectedCardIds:[...request.selectedCardIds]}:{...common,...randomEvidence()};
  const selection=await createTarotSelectionRuntime(structural).select(selectionRequest);
  const calculations=await createTarotRuntime(structural).calculateSpread({runtimeCode:TAROT_RUNTIME_CODE,calculationIdPrefix:`${sessionId}-CALC`,evidence:selection});
  const projections=await createTarotCardProjector().projectSpread({calculationResults:calculations,projectionVersion:'1.0.0'});
  const readingIr=createTarotReadingIR({
    question,
    contextDisclosure:{currentRealityContextUsed:request.useCurrentRealityContext===true,currentRealityContextLabel:request.currentRealityContextLabel||null,contextUseWasExplicit:request.useCurrentRealityContext===true},
    projections,authorities:interpretation,realityEvidence:normalizeRealityEvidence(request.realityEvidence),
    compositionEvidence:{generatedAt:timestamp,authorityDigests:{corpusFreezeSha256:TAROT_CORPUS_FREEZE_SHA256,productInterpretationFreezeSha256:TAROT_PRODUCT_INTERPRETATION_FREEZE_SHA256},boundaryContractVersions:{rcc:'1.0.0',agency:'1.0.0',uncertainty:'1.0.0',compositionEvidence:'1.0.0'}}
  });
  const baseView=createTarotProductPublicViewModel(readingIr);const publicView=structuredClone(baseView);
  publicView.production={...publicView.production,state:'LIMITED_PRODUCTION',runAllowed:true,productionCapabilityPromoted:true};
  return Object.freeze({
    ok:true,method:'TAROT',runtimeVersion:TAROT_PRODUCTION_RUNTIME_VERSION,
    selectionEvidence:selection,readingIr,publicView:Object.freeze(publicView),
    production:Object.freeze({state:'LIMITED_PRODUCTION',runAllowed:true,limitedProductionActivated:true,providerUsed:false,aiCardSelection:false,aiInterpretation:false}),
    boundaries:Object.freeze({fortuneTellingAuthority:false,predictionAuthority:false,diagnosticAuthority:false,hiddenStateAuthority:false,professionalDirectiveAuthority:false,decisionAuthority:'USER'})
  });
}
