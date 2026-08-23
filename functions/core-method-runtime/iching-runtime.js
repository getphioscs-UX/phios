/** PHI OS ICH-W1–W7 source-neutral I Ching structural calculation runtime. */
import {
  createSharedCalculationRuntime,
  SHARED_CALCULATION_RUNTIME_CODE,
  sha256
} from '../method-runtime/shared-calculation-runtime.js';

export const ICHING_RUNTIME_CODE = 'ICHING_TRANSFORMATION_RUNTIME';
export const ICHING_RUNTIME_VERSION = '1.0.0';
export const ICHING_ALGORITHM_CODE = 'ICHING_HEXAGRAM_TRANSFORMATION';
export const ICHING_ALGORITHM_VERSION = '1.0.0';
export const ICHING_METHOD_CODE = 'I_CHING';
export const ICHING_PLUGIN_CODE = 'ICH';
export const ICHING_LINE_ORDER = 'BOTTOM_TO_TOP';

const SUPPORTED_INPUT_MODES = new Set(['MANUAL_LINES','COIN_CAST','SYSTEM_RANDOM']);
const LINE_VALUES = new Set([6,7,8,9]);
const KING_WEN_NUMBER_BY_BINARY = Object.freeze({"000000":2,"000001":23,"000010":8,"000011":20,"000100":16,"000101":35,"000110":45,"000111":12,"001000":15,"001001":52,"001010":39,"001011":53,"001100":62,"001101":56,"001110":31,"001111":33,"010000":7,"010001":4,"010010":29,"010011":59,"010100":40,"010101":64,"010110":47,"010111":6,"011000":46,"011001":18,"011010":48,"011011":57,"011100":32,"011101":50,"011110":28,"011111":44,"100000":24,"100001":27,"100010":3,"100011":42,"100100":51,"100101":21,"100110":17,"100111":25,"101000":36,"101001":22,"101010":63,"101011":37,"101100":55,"101101":30,"101110":49,"101111":13,"110000":19,"110001":41,"110010":60,"110011":61,"110100":54,"110101":38,"110110":58,"110111":10,"111000":11,"111001":26,"111010":5,"111011":9,"111100":34,"111101":14,"111110":43,"111111":1});
const TRIGRAM_ID_BY_BINARY = Object.freeze({"000":"TRIGRAM-KUN","001":"TRIGRAM-GEN","010":"TRIGRAM-KAN","011":"TRIGRAM-XUN","100":"TRIGRAM-ZHEN","101":"TRIGRAM-LI","110":"TRIGRAM-DUI","111":"TRIGRAM-QIAN"});
const LINE_MODEL = Object.freeze({
  6:Object.freeze({lineState:'CHANGING_YIN',primaryBit:0,relatingBit:1,changing:true}),
  7:Object.freeze({lineState:'STABLE_YANG',primaryBit:1,relatingBit:1,changing:false}),
  8:Object.freeze({lineState:'STABLE_YIN',primaryBit:0,relatingBit:0,changing:false}),
  9:Object.freeze({lineState:'CHANGING_YANG',primaryBit:1,relatingBit:0,changing:true})
});

function plainObject(value, message) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(message);
}
function semver(value) { return /^\d+\.\d+\.\d+$/.test(value || ''); }
function exactOrder(value) {
  return Array.isArray(value) && value.length === 6 && value.every((x,i) => x === i + 1);
}
function assertSix(values) {
  if (!Array.isArray(values) || values.length !== 6) throw new TypeError('ICHING_REQUIRES_EXACTLY_SIX_LINES');
}
function assertLineValue(value) {
  if (!Number.isInteger(value) || !LINE_VALUES.has(value)) throw new TypeError('INVALID_ICHING_LINE_VALUE');
}
function parseManualSymbol(symbol) {
  if (typeof symbol !== 'string' || !/^[6789]$/.test(symbol)) throw new TypeError('INVALID_ICHING_LINE_VALUE');
  return Number(symbol);
}
function parseCoinSymbol(symbol) {
  if (typeof symbol !== 'string' || !/^[23],[23],[23]$/.test(symbol)) throw new TypeError('INVALID_ICHING_COIN_EVIDENCE');
  const values=symbol.split(',').map(Number);
  const line=values.reduce((sum,value)=>sum+value,0);
  assertLineValue(line);
  return line;
}

export function normalizeIChingEvidence(evidence) {
  plainObject(evidence,'I Ching evidence is required.');
  if (evidence.schemaVersion !== 'PHI-OS-SYMBOLIC-METHOD-EVIDENCE-v1.0.0') throw new TypeError('INVALID_ICHING_EVIDENCE_SCHEMA');
  if (evidence.methodId !== ICHING_METHOD_CODE) throw new TypeError('INVALID_ICHING_METHOD_ID');
  if (!SUPPORTED_INPUT_MODES.has(evidence.inputMode)) throw new TypeError('UNSUPPORTED_ICHING_INPUT_MODE');
  if (evidence.runtimeVersion !== ICHING_RUNTIME_VERSION) throw new TypeError('INVALID_ICHING_RUNTIME_VERSION');
  if (!semver(evidence.projectionVersion)) throw new TypeError('INVALID_ICHING_PROJECTION_VERSION');
  if (typeof evidence.sessionId !== 'string' || !evidence.sessionId) throw new TypeError('ICHING_SESSION_ID_REQUIRED');
  if (typeof evidence.timestamp !== 'string' || Number.isNaN(Date.parse(evidence.timestamp))) throw new TypeError('ICHING_TIMESTAMP_REQUIRED');
  plainObject(evidence.selectionEvidence,'I Ching selectionEvidence is required.');
  const selection=evidence.selectionEvidence;
  if (!exactOrder(selection.selectionOrder)) throw new TypeError('ICHING_SELECTION_ORDER_MUST_BE_BOTTOM_TO_TOP_1_TO_6');
  assertSix(selection.selectedSymbols);
  if (selection.runtimeVersion !== ICHING_RUNTIME_VERSION) throw new TypeError('INVALID_ICHING_SELECTION_RUNTIME_VERSION');
  if (selection.aiSelected !== false) throw new TypeError('ICHING_AI_SELECTION_FORBIDDEN');

  let lines;
  if (evidence.inputMode === 'MANUAL_LINES') {
    if (evidence.selectionMode !== 'MANUAL_SELECTION') throw new TypeError('ICHING_MANUAL_SELECTION_MODE_REQUIRED');
    lines=selection.selectedSymbols.map(parseManualSymbol);
  } else if (evidence.inputMode === 'COIN_CAST') {
    if (evidence.selectionMode !== 'MANUAL_SELECTION') throw new TypeError('ICHING_COIN_SELECTION_MODE_REQUIRED');
    lines=selection.selectedSymbols.map(parseCoinSymbol);
  } else {
    if (evidence.selectionMode !== 'SYSTEM_RANDOM') throw new TypeError('ICHING_SYSTEM_RANDOM_SELECTION_MODE_REQUIRED');
    if (typeof selection.seed !== 'string' || !selection.seed) throw new TypeError('ICHING_SYSTEM_RANDOM_SEED_REQUIRED');
    plainObject(selection.entropyEvidence,'ICHING_SYSTEM_RANDOM_ENTROPY_EVIDENCE_REQUIRED');
    if (typeof selection.entropyEvidence.source !== 'string' || !selection.entropyEvidence.source ||
        typeof selection.entropyEvidence.digest !== 'string' || !/^[a-f0-9]{64}$/.test(selection.entropyEvidence.digest)) {
      throw new TypeError('ICHING_SYSTEM_RANDOM_ENTROPY_EVIDENCE_INVALID');
    }
    if (typeof selection.replayToken !== 'string' || !selection.replayToken) throw new TypeError('ICHING_SYSTEM_RANDOM_REPLAY_TOKEN_REQUIRED');
    lines=selection.selectedSymbols.map(parseManualSymbol);
  }
  assertSix(lines); lines.forEach(assertLineValue);
  return Object.freeze({
    inputMode:evidence.inputMode,
    selectionMode:evidence.selectionMode,
    lines:Object.freeze(lines),
    normalization:Object.freeze({
      lineOrder:ICHING_LINE_ORDER,
      selectedSymbolCount:6,
      randomSelectionReplayed:evidence.inputMode === 'SYSTEM_RANDOM',
      rerolledInsideCalculation:false
    })
  });
}

function hexagram(binary) {
  const number=KING_WEN_NUMBER_BY_BINARY[binary];
  if (!number) throw new Error(`UNKNOWN_ICHING_BINARY:${binary}`);
  const lowerBinary=binary.slice(0,3), upperBinary=binary.slice(3,6);
  return Object.freeze({
    type:'HEXAGRAM',
    hexagramId:`HEXAGRAM-${String(number).padStart(2,'0')}`,
    number,
    binary,
    lowerTrigramId:TRIGRAM_ID_BY_BINARY[lowerBinary],
    upperTrigramId:TRIGRAM_ID_BY_BINARY[upperBinary]
  });
}

function transform(normalized) {
  const lines=normalized.lines.map((lineValue,index)=>{
    const model=LINE_MODEL[lineValue];
    return Object.freeze({
      position:index+1,
      lineValue,
      lineState:model.lineState,
      primaryBit:model.primaryBit,
      relatingBit:model.relatingBit,
      changing:model.changing
    });
  });
  const primaryBinary=lines.map(x=>x.primaryBit).join('');
  const relatingBinary=lines.map(x=>x.relatingBit).join('');
  const changeMask=lines.map(x=>x.changing?'1':'0').join('');
  const changingLines=Object.freeze(lines.filter(x=>x.changing).map(x=>x.position));
  const primary=hexagram(primaryBinary), relating=hexagram(relatingBinary);
  return Object.freeze({
    schemaVersion:'PHI-OS-ICHING-CALCULATION-OUTPUT-v1.0.0',
    runtimeCode:ICHING_RUNTIME_CODE,
    runtimeVersion:ICHING_RUNTIME_VERSION,
    methodCode:ICHING_METHOD_CODE,
    pluginCode:ICHING_PLUGIN_CODE,
    inputMode:normalized.inputMode,
    lineOrder:ICHING_LINE_ORDER,
    lines:Object.freeze(lines),
    primary,
    changingLines,
    changeMask,
    relating,
    trace:Object.freeze({
      inputLines:Object.freeze([...normalized.lines]),
      normalization:normalized.normalization,
      primaryBinary,
      primaryId:primary.hexagramId,
      changeMask,
      relatingBinary,
      relatingId:relating.hexagramId
    }),
    deterministic:true,
    sourceNeutral:true,
    projectionCreated:false,
    interpretationCreated:false,
    productionEligible:false
  });
}

export function createIChingRuntime() {
  const algorithm=Object.freeze({
    algorithmCode:ICHING_ALGORITHM_CODE,
    algorithmVersion:ICHING_ALGORITHM_VERSION,
    async calculate(records) {
      const record=records.find(x=>x.recordType === 'SYMBOLIC_METHOD_EVIDENCE');
      if (!record) throw new TypeError('ICHING_SYMBOLIC_METHOD_EVIDENCE_REQUIRED');
      return transform(normalizeIChingEvidence(record.payload));
    }
  });
  const shared=createSharedCalculationRuntime({algorithms:[algorithm]});
  return Object.freeze({
    runtimeCode:ICHING_RUNTIME_CODE,
    runtimeVersion:ICHING_RUNTIME_VERSION,
    async calculate(request) {
      plainObject(request,'I Ching calculation request is required.');
      if (request.runtimeCode !== ICHING_RUNTIME_CODE) throw new TypeError('INVALID_ICHING_RUNTIME_CODE');
      const normalized=normalizeIChingEvidence(request.evidence);
      const evidenceDigest=await sha256(request.evidence);
      const bridgeRecord=Object.freeze({
        recordId:`SDA-ICH-${evidenceDigest.slice(0,24).toUpperCase()}`,
        recordType:'SYMBOLIC_METHOD_EVIDENCE',
        recordVersion:'1.0.0',
        authority:'SHARED_DATA_AUTHORITY',
        status:'draft',
        methodOwner:null,
        pluginOwner:null,
        payload:request.evidence
      });
      const result=await shared.execute({
        calculationId:request.calculationId,
        runtimeCode:SHARED_CALCULATION_RUNTIME_CODE,
        methodCode:ICHING_METHOD_CODE,
        pluginCode:ICHING_PLUGIN_CODE,
        algorithmCode:ICHING_ALGORITHM_CODE,
        algorithmVersion:ICHING_ALGORITHM_VERSION,
        inputRecords:[bridgeRecord],
        referenceVersions:Object.freeze({
          executionMode:'structural_validation',
          ichingRuntimeVersion:ICHING_RUNTIME_VERSION,
          lineModelVersion:'1.0.0',
          trigramRegistryVersion:'1.0.0',
          hexagramRegistryVersion:'1.0.0',
          projectionVersion:request.evidence.projectionVersion,
          symbolicInputMode:normalized.inputMode,
          productionEligible:false
        })
      });
      return result;
    }
  });
}
