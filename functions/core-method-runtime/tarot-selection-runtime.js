/** PHI OS TAR-W6/W7/W8 Tarot selection runtime: governed draw evidence, no AI card authority. */
import { stableSerialize } from '../method-runtime/shared-calculation-runtime.js';

export const TAROT_SELECTION_RUNTIME_CODE = 'TAROT_SELECTION_RUNTIME';
export const TAROT_RUNTIME_VERSION = '1.0.0';
export const TAROT_METHOD_CODE = 'TAROT';
export const TAROT_PLUGIN_CODE = 'TAR';
export const TAROT_DECK_ID = 'RWS_1909_STRUCTURAL_FAMILY';
export const TAROT_DECK_VERSION = '1.0.0';
export const TAROT_ORIENTATION_POLICY_ID = 'TAROT_ORIENTATION_UPRIGHT_ONLY';
export const TAROT_ORIENTATION_POLICY_VERSION = '1.0.0';

const INPUT_MODES = new Set(['MANUAL_SELECTION','SYSTEM_RANDOM']);
const HEX64 = /^[a-f0-9]{64}$/;

function object(value, message) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(message);
}
function string(value, message) {
  if (typeof value !== 'string' || !value) throw new TypeError(message);
}
function semver(value) {
  return typeof value === 'string' && /^\d+\.\d+\.\d+$/.test(value);
}
function clone(value) { return structuredClone(value); }
function unique(values) { return new Set(values).size === values.length; }
function exactArray(a,b) { return Array.isArray(a) && stableSerialize(a) === stableSerialize(b); }

function authorities({deckContract,cardRegistry,spreadRegistry,orientationPolicy}) {
  object(deckContract,'TAROT_DECK_CONTRACT_REQUIRED');
  object(cardRegistry,'TAROT_CARD_REGISTRY_REQUIRED');
  object(spreadRegistry,'TAROT_SPREAD_REGISTRY_REQUIRED');
  object(orientationPolicy,'TAROT_ORIENTATION_POLICY_REQUIRED');
  const deck=deckContract.canonicalDeckFamily;
  if (!deck || deck.deckId !== TAROT_DECK_ID || deck.deckVersion !== TAROT_DECK_VERSION || deck.cardCount !== 78) throw new TypeError('TAROT_CANONICAL_DECK_CONTRACT_INVALID');
  if (cardRegistry.deckId !== deck.deckId || cardRegistry.deckVersion !== deck.deckVersion || cardRegistry.entries?.length !== 78) throw new TypeError('TAROT_78_CARD_REGISTRY_REQUIRED');
  if (new Set(cardRegistry.entries.map(x=>x.cardId)).size !== 78 || new Set(cardRegistry.entries.map(x=>x.cardIdentity)).size !== 78) throw new TypeError('TAROT_CARD_IDENTITY_DUPLICATE');
  if (orientationPolicy.policyId !== TAROT_ORIENTATION_POLICY_ID || orientationPolicy.policyVersion !== TAROT_ORIENTATION_POLICY_VERSION || orientationPolicy.reversedEnabled !== false || !exactArray(orientationPolicy.allowedOrientations,['UPRIGHT'])) throw new TypeError('TAROT_UPRIGHT_ONLY_POLICY_REQUIRED');
  const spreads=new Map((spreadRegistry.entries||[]).map(x=>[x.spreadId,x]));
  if (spreads.size !== 2 || !spreads.has('ONE_CARD') || !spreads.has('THREE_CARD')) throw new TypeError('TAROT_V1_SPREAD_REGISTRY_INVALID');
  const cards=new Map(cardRegistry.entries.map(x=>[x.cardId,x]));
  return Object.freeze({deck:Object.freeze(clone(deck)),cards,eligibleCards:Object.freeze(cardRegistry.entries.map(x=>x.cardId)),spreads,orientationPolicy:Object.freeze(clone(orientationPolicy))});
}

async function digestBytes(text) {
  const bytes=new TextEncoder().encode(text);
  return new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',bytes));
}
function u64(bytes) {
  let n=0n;
  for (let i=0;i<8;i++) n=(n<<8n)|BigInt(bytes[i]);
  return n;
}
async function boundedIndex(seed, entropyDigest, counter, bound) {
  if (!Number.isInteger(bound) || bound < 1) throw new TypeError('TAROT_RANDOM_BOUND_INVALID');
  const B=BigInt(bound), SPACE=1n<<64n, LIMIT=SPACE-(SPACE%B);
  let attempt=0;
  while (true) {
    const n=u64(await digestBytes(`${seed}|${entropyDigest}|${counter}|${attempt}`));
    if (n < LIMIT) return Number(n%B);
    attempt++;
  }
}

export async function deriveTarotSystemRandomDraw({eligibleCards,cardCount,seed,entropyDigest}) {
  if (!Array.isArray(eligibleCards) || eligibleCards.length !== 78 || !unique(eligibleCards)) throw new TypeError('TAROT_ELIGIBLE_CARD_SET_INVALID');
  string(seed,'TAROT_SYSTEM_RANDOM_SEED_REQUIRED');
  if (typeof entropyDigest !== 'string' || !HEX64.test(entropyDigest)) throw new TypeError('TAROT_SYSTEM_RANDOM_ENTROPY_DIGEST_INVALID');
  if (![1,3].includes(cardCount)) throw new TypeError('TAROT_SPREAD_CARD_COUNT_INVALID');
  const remaining=[...eligibleCards], out=[];
  for (let drawIndex=1;drawIndex<=cardCount;drawIndex++) {
    const idx=await boundedIndex(seed,entropyDigest,drawIndex,remaining.length);
    out.push(remaining.splice(idx,1)[0]);
  }
  return Object.freeze(out);
}

function spreadPositionSnapshot(spread) {
  return Object.freeze(spread.positions.map(p=>Object.freeze({positionId:p.positionId,order:p.order,label:p.label})));
}

export function createTarotSelectionRuntime(config) {
  const a=authorities(config);
  return Object.freeze({
    runtimeCode:TAROT_SELECTION_RUNTIME_CODE,
    runtimeVersion:TAROT_RUNTIME_VERSION,
    async select(request={}) {
      object(request,'TAROT_SELECTION_REQUEST_REQUIRED');
      const inputMode=request.inputMode;
      if (!INPUT_MODES.has(inputMode)) throw new TypeError('UNSUPPORTED_TAROT_INPUT_MODE');
      string(request.sessionId,'TAROT_SESSION_ID_REQUIRED');
      string(request.timestamp,'TAROT_TIMESTAMP_REQUIRED');
      if (Number.isNaN(Date.parse(request.timestamp))) throw new TypeError('TAROT_TIMESTAMP_INVALID');
      if (!semver(request.projectionVersion)) throw new TypeError('TAROT_PROJECTION_VERSION_REQUIRED');
      if (request.deckId !== TAROT_DECK_ID || request.deckVersion !== TAROT_DECK_VERSION) throw new TypeError('TAROT_DECK_IDENTITY_MISMATCH');
      if (request.orientationPolicyId !== TAROT_ORIENTATION_POLICY_ID || request.orientationPolicyVersion !== TAROT_ORIENTATION_POLICY_VERSION) throw new TypeError('TAROT_ORIENTATION_POLICY_MISMATCH');
      const spread=a.spreads.get(request.spreadId);
      if (!spread || request.spreadVersion !== spread.spreadVersion) throw new TypeError('TAROT_GOVERNED_SPREAD_REQUIRED');
      const positions=spreadPositionSnapshot(spread);
      let drawOrder, selectionAuthority;
      if (inputMode === 'MANUAL_SELECTION') {
        if (!Array.isArray(request.selectedCardIds) || request.selectedCardIds.length !== spread.cardCount) throw new TypeError('TAROT_MANUAL_SELECTION_CARD_COUNT_MISMATCH');
        if (!unique(request.selectedCardIds)) throw new TypeError('TAROT_DUPLICATE_CARD_SELECTION_FORBIDDEN');
        for (const id of request.selectedCardIds) if (!a.cards.has(id)) throw new TypeError(`UNKNOWN_TAROT_CARD_ID:${id}`);
        if (request.seed !== undefined || request.entropyEvidence !== undefined || request.replayToken !== undefined) throw new TypeError('TAROT_MANUAL_SELECTION_RANDOM_FIELDS_FORBIDDEN');
        drawOrder=Object.freeze([...request.selectedCardIds]);
        selectionAuthority='USER_EXPLICIT_MANUAL_SELECTION';
      } else {
        string(request.seed,'TAROT_SYSTEM_RANDOM_SEED_REQUIRED');
        object(request.entropyEvidence,'TAROT_SYSTEM_RANDOM_ENTROPY_EVIDENCE_REQUIRED');
        string(request.entropyEvidence.source,'TAROT_SYSTEM_RANDOM_ENTROPY_SOURCE_REQUIRED');
        if (typeof request.entropyEvidence.digest !== 'string' || !HEX64.test(request.entropyEvidence.digest)) throw new TypeError('TAROT_SYSTEM_RANDOM_ENTROPY_DIGEST_INVALID');
        string(request.replayToken,'TAROT_SYSTEM_RANDOM_REPLAY_TOKEN_REQUIRED');
        if (request.selectedCardIds !== undefined) throw new TypeError('TAROT_SYSTEM_RANDOM_MANUAL_CARD_IDS_FORBIDDEN');
        drawOrder=await deriveTarotSystemRandomDraw({eligibleCards:a.eligibleCards,cardCount:spread.cardCount,seed:request.seed,entropyDigest:request.entropyEvidence.digest});
        selectionAuthority='EXTERNAL_ENTROPY_SEEDED_SYSTEM_RANDOM';
      }
      const orientations=Object.freeze(drawOrder.map(()=> 'UPRIGHT'));
      const draws=Object.freeze(drawOrder.map((cardId,i)=>Object.freeze({drawIndex:i+1,cardId,orientation:'UPRIGHT',position:positions[i]})));
      const selectionEvidence={selectionOrder:Object.freeze(drawOrder.map((_,i)=>i+1)),selectedSymbols:drawOrder,runtimeVersion:TAROT_RUNTIME_VERSION,aiSelected:false};
      if (inputMode === 'SYSTEM_RANDOM') Object.assign(selectionEvidence,{seed:request.seed,entropyEvidence:Object.freeze(clone(request.entropyEvidence)),replayToken:request.replayToken});
      const sharedSymbolicEvidence=Object.freeze({schemaVersion:'PHI-OS-SYMBOLIC-METHOD-EVIDENCE-v1.0.0',methodId:TAROT_METHOD_CODE,sessionId:request.sessionId,inputMode,selectionMode:inputMode,selectionEvidence:Object.freeze(selectionEvidence),timestamp:request.timestamp,runtimeVersion:TAROT_RUNTIME_VERSION,projectionVersion:request.projectionVersion});
      const drawEvidence={schemaVersion:'PHI-OS-TAROT-DRAW-EVIDENCE-v1.0.0',methodId:TAROT_METHOD_CODE,sessionId:request.sessionId,inputMode,selectionMode:inputMode,deckId:TAROT_DECK_ID,deckVersion:TAROT_DECK_VERSION,spreadId:spread.spreadId,spreadVersion:spread.spreadVersion,orientationPolicyId:TAROT_ORIENTATION_POLICY_ID,orientationPolicyVersion:TAROT_ORIENTATION_POLICY_VERSION,eligibleCards:a.eligibleCards,drawOrder,orientationResult:orientations,spreadPositions:positions,draws,aiSelected:false,runtimeVersion:TAROT_RUNTIME_VERSION,projectionVersion:request.projectionVersion,timestamp:request.timestamp};
      if (inputMode === 'SYSTEM_RANDOM') Object.assign(drawEvidence,{seed:request.seed,entropyEvidence:Object.freeze(clone(request.entropyEvidence)),replayToken:request.replayToken});
      return Object.freeze({schemaVersion:'PHI-OS-TAROT-SELECTION-EVIDENCE-BUNDLE-v1.0.0',runtimeCode:TAROT_SELECTION_RUNTIME_CODE,runtimeVersion:TAROT_RUNTIME_VERSION,methodCode:TAROT_METHOD_CODE,pluginCode:TAROT_PLUGIN_CODE,sharedSymbolicEvidence,drawEvidence:Object.freeze(drawEvidence),selectionAuthority,deterministic:true,aiUsed:false,providerUsed:false,interpretationCreated:false,productionEligible:false});
    }
  });
}

export async function validateTarotEvidenceBundle(bundle, config) {
  const a=authorities(config);
  object(bundle,'TAROT_EVIDENCE_BUNDLE_REQUIRED');
  if (bundle.schemaVersion !== 'PHI-OS-TAROT-SELECTION-EVIDENCE-BUNDLE-v1.0.0' || bundle.runtimeCode !== TAROT_SELECTION_RUNTIME_CODE || bundle.runtimeVersion !== TAROT_RUNTIME_VERSION || bundle.methodCode !== TAROT_METHOD_CODE || bundle.pluginCode !== TAROT_PLUGIN_CODE) throw new TypeError('INVALID_TAROT_EVIDENCE_BUNDLE');
  if (bundle.aiUsed !== false || bundle.providerUsed !== false || bundle.interpretationCreated !== false || bundle.productionEligible !== false) throw new TypeError('TAROT_EVIDENCE_AUTHORITY_BOUNDARY_INVALID');
  const s=bundle.sharedSymbolicEvidence, d=bundle.drawEvidence;
  object(s,'TAROT_SHARED_SYMBOLIC_EVIDENCE_REQUIRED'); object(d,'TAROT_DRAW_EVIDENCE_REQUIRED');
  if (s.schemaVersion !== 'PHI-OS-SYMBOLIC-METHOD-EVIDENCE-v1.0.0' || s.methodId !== TAROT_METHOD_CODE || s.runtimeVersion !== TAROT_RUNTIME_VERSION || s.selectionEvidence?.aiSelected !== false) throw new TypeError('INVALID_TAROT_SHARED_SYMBOLIC_EVIDENCE');
  if (d.schemaVersion !== 'PHI-OS-TAROT-DRAW-EVIDENCE-v1.0.0' || d.methodId !== TAROT_METHOD_CODE || d.aiSelected !== false || d.runtimeVersion !== TAROT_RUNTIME_VERSION) throw new TypeError('INVALID_TAROT_DRAW_EVIDENCE');
  for (const k of ['sessionId','inputMode','selectionMode','timestamp','projectionVersion']) if (s[k] !== d[k]) throw new TypeError(`TAROT_EVIDENCE_MIRROR_MISMATCH:${k}`);
  if (!INPUT_MODES.has(d.inputMode) || d.selectionMode !== d.inputMode) throw new TypeError('TAROT_SELECTION_MODE_INVALID');
  if (d.deckId !== TAROT_DECK_ID || d.deckVersion !== TAROT_DECK_VERSION) throw new TypeError('TAROT_DECK_IDENTITY_MISMATCH');
  if (d.orientationPolicyId !== TAROT_ORIENTATION_POLICY_ID || d.orientationPolicyVersion !== TAROT_ORIENTATION_POLICY_VERSION) throw new TypeError('TAROT_ORIENTATION_POLICY_MISMATCH');
  const spread=a.spreads.get(d.spreadId); if (!spread || d.spreadVersion !== spread.spreadVersion) throw new TypeError('TAROT_GOVERNED_SPREAD_REQUIRED');
  if (!exactArray(d.eligibleCards,a.eligibleCards)) throw new TypeError('TAROT_ELIGIBLE_CARD_SET_DRIFT');
  if (!Array.isArray(d.drawOrder) || d.drawOrder.length !== spread.cardCount || !unique(d.drawOrder)) throw new TypeError('TAROT_DRAW_ORDER_INVALID');
  for (const id of d.drawOrder) if (!a.cards.has(id)) throw new TypeError(`UNKNOWN_TAROT_CARD_ID:${id}`);
  if (!exactArray(s.selectionEvidence.selectionOrder,d.drawOrder.map((_,i)=>i+1)) || !exactArray(s.selectionEvidence.selectedSymbols,d.drawOrder)) throw new TypeError('TAROT_SHARED_SELECTION_EVIDENCE_DRIFT');
  const expectedPositions=spreadPositionSnapshot(spread);
  if (!exactArray(d.spreadPositions,expectedPositions)) throw new TypeError('TAROT_SPREAD_POSITION_EVIDENCE_DRIFT');
  if (!exactArray(d.orientationResult,d.drawOrder.map(()=> 'UPRIGHT'))) throw new TypeError('TAROT_ORIENTATION_EVIDENCE_DRIFT');
  if (!Array.isArray(d.draws) || d.draws.length !== spread.cardCount) throw new TypeError('TAROT_DRAW_EVIDENCE_COUNT_INVALID');
  for (let i=0;i<d.draws.length;i++) {
    const x=d.draws[i];
    if (x.drawIndex !== i+1 || x.cardId !== d.drawOrder[i] || x.orientation !== 'UPRIGHT' || stableSerialize(x.position) !== stableSerialize(expectedPositions[i])) throw new TypeError(`TAROT_DRAW_EVIDENCE_DRIFT:${i+1}`);
  }
  if (d.inputMode === 'SYSTEM_RANDOM') {
    string(d.seed,'TAROT_SYSTEM_RANDOM_SEED_REQUIRED'); object(d.entropyEvidence,'TAROT_SYSTEM_RANDOM_ENTROPY_EVIDENCE_REQUIRED'); string(d.entropyEvidence.source,'TAROT_SYSTEM_RANDOM_ENTROPY_SOURCE_REQUIRED');
    if (typeof d.entropyEvidence.digest !== 'string' || !HEX64.test(d.entropyEvidence.digest)) throw new TypeError('TAROT_SYSTEM_RANDOM_ENTROPY_DIGEST_INVALID');
    string(d.replayToken,'TAROT_SYSTEM_RANDOM_REPLAY_TOKEN_REQUIRED');
    if (s.selectionEvidence.seed !== d.seed || stableSerialize(s.selectionEvidence.entropyEvidence) !== stableSerialize(d.entropyEvidence) || s.selectionEvidence.replayToken !== d.replayToken) throw new TypeError('TAROT_RANDOM_EVIDENCE_MIRROR_DRIFT');
    const derived=await deriveTarotSystemRandomDraw({eligibleCards:a.eligibleCards,cardCount:spread.cardCount,seed:d.seed,entropyDigest:d.entropyEvidence.digest});
    if (!exactArray(derived,d.drawOrder)) throw new TypeError('TAROT_STORED_RANDOM_DRAW_DOES_NOT_MATCH_EVIDENCE');
  } else if (d.seed !== undefined || d.entropyEvidence !== undefined || d.replayToken !== undefined) throw new TypeError('TAROT_MANUAL_DRAW_CONTAINS_RANDOM_EVIDENCE');
  return Object.freeze({deck:a.deck,spread:Object.freeze(clone(spread)),positions:expectedPositions,draws:Object.freeze(d.draws.map(x=>Object.freeze(clone(x)))),eligibleCards:a.eligibleCards,inputMode:d.inputMode,selectionMode:d.selectionMode,projectionVersion:d.projectionVersion,sessionId:d.sessionId,timestamp:d.timestamp});
}
