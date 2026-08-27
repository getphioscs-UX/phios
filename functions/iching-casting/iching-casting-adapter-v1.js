/**
 * ICHING-1.0.1 customer casting surface completion.
 *
 * This adapter produces a governed SYSTEM_RANDOM evidence package before the
 * existing I Ching product runtime executes. It does not interpret the
 * question, select a favorable result, mutate the admitted corpus, or reroll
 * inside calculation.
 */
export const ICHING_CAST_SCHEMA='PHI-OS-ICHING-GOVERNED-CAST-v1.0.0';
export const ICHING_CAST_ALGORITHM='ICHING_SERVER_THREE_COIN_CSPRNG';
export const ICHING_CAST_ALGORITHM_VERSION='1.0.0';
export const ICHING_CAST_RANDOM_SOURCE='SERVER_WEB_CRYPTO_GET_RANDOM_VALUES';
export const ICHING_CAST_ENTROPY_SOURCE='SERVER_CSPRNG_THREE_COIN_OUTCOME';
export const ICHING_CAST_LINE_ORDER='BOTTOM_TO_TOP';

const enc=new TextEncoder();
const text=value=>String(value??'').normalize('NFKC').trim();
const HEX64=/^[a-f0-9]{64}$/;

function bytesToHex(bytes){return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function sha256Hex(value,cryptoImpl=globalThis.crypto){
  if(!cryptoImpl?.subtle)throw new TypeError('ICHING_CAST_WEB_CRYPTO_REQUIRED');
  return bytesToHex(await cryptoImpl.subtle.digest('SHA-256',enc.encode(String(value))));
}
function canonicalCoinEvidence(coinGroups){return coinGroups.map(group=>group.join('')).join('|');}
function canonicalReplayEnvelope({createdAt,questionDigest,selectedSymbols,coinGroups,entropyDigest,seed}){
  return JSON.stringify({
    schemaVersion:ICHING_CAST_SCHEMA,
    algorithm:ICHING_CAST_ALGORITHM,
    algorithmVersion:ICHING_CAST_ALGORITHM_VERSION,
    createdAt,
    questionDigest,
    selectedSymbols,
    coinGroups,
    entropyDigest,
    seed
  });
}
function assertQuestion(question){
  const q=text(question);
  if(!q)throw new TypeError('ICHING_CAST_QUESTION_REQUIRED');
  if(q.length>800)throw new TypeError('ICHING_CAST_QUESTION_TOO_LONG');
  return q;
}
function normalizeRandomBytes(randomBytes,cryptoImpl){
  let bytes;
  if(randomBytes!==undefined){
    bytes=randomBytes instanceof Uint8Array?new Uint8Array(randomBytes):Uint8Array.from(randomBytes||[]);
  }else{
    if(!cryptoImpl?.getRandomValues)throw new TypeError('ICHING_CAST_CSPRNG_REQUIRED');
    bytes=cryptoImpl.getRandomValues(new Uint8Array(18));
  }
  if(bytes.length!==18)throw new TypeError('ICHING_CAST_REQUIRES_18_RANDOM_BYTES');
  return bytes;
}
function coinGroupsFromBytes(bytes){
  const coins=[...bytes].map(byte=>(byte&1)===0?2:3);
  return Object.freeze(Array.from({length:6},(_,line)=>Object.freeze(coins.slice(line*3,line*3+3))));
}
function linesFromCoinGroups(groups){
  if(!Array.isArray(groups)||groups.length!==6||groups.some(group=>!Array.isArray(group)||group.length!==3||group.some(value=>value!==2&&value!==3)))throw new TypeError('ICHING_CAST_COIN_EVIDENCE_INVALID');
  return groups.map(group=>group.reduce((sum,value)=>sum+value,0));
}
function iso(value){
  const date=value instanceof Date?value:new Date(value);
  if(Number.isNaN(date.getTime()))throw new TypeError('ICHING_CAST_TIMESTAMP_INVALID');
  return date.toISOString();
}

export async function createIChingGovernedCast({
  question,
  cryptoImpl=globalThis.crypto,
  randomBytes,
  now=()=>new Date()
}={}){
  const normalizedQuestion=assertQuestion(question);
  const createdAt=iso(now());
  const bytes=normalizeRandomBytes(randomBytes,cryptoImpl);
  const coinGroups=coinGroupsFromBytes(bytes);
  const lines=linesFromCoinGroups(coinGroups);
  const selectedSymbols=Object.freeze(lines.map(String));
  const questionDigest=await sha256Hex(normalizedQuestion,cryptoImpl);
  const entropyDigest=await sha256Hex(canonicalCoinEvidence(coinGroups),cryptoImpl);
  const seed=`ICHING-CSPRNG-${entropyDigest.slice(0,24)}`;
  const envelope=canonicalReplayEnvelope({createdAt,questionDigest,selectedSymbols:[...selectedSymbols],coinGroups:coinGroups.map(x=>[...x]),entropyDigest,seed});
  const replayDigest=await sha256Hex(envelope,cryptoImpl);
  const replayToken=`ICH-CAST-${replayDigest}`;
  const castId=`ICH-CAST-${replayDigest.slice(0,24).toUpperCase()}`;

  return Object.freeze({
    schemaVersion:ICHING_CAST_SCHEMA,
    method:'I_CHING',
    castId,
    createdAt,
    questionBinding:Object.freeze({
      digest:questionDigest,
      algorithm:'SHA-256',
      rawQuestionStoredByCastingAdapter:false
    }),
    algorithm:Object.freeze({
      code:ICHING_CAST_ALGORITHM,
      version:ICHING_CAST_ALGORITHM_VERSION,
      randomSource:ICHING_CAST_RANDOM_SOURCE,
      samplingModel:'THREE_COIN',
      coinValues:Object.freeze([2,3]),
      lineOrder:ICHING_CAST_LINE_ORDER
    }),
    selection:Object.freeze({
      inputMode:'SYSTEM_RANDOM',
      selectionMode:'SYSTEM_RANDOM',
      aiSelected:false,
      favorableOutcomeSelection:false,
      rerolledInsideCalculation:false,
      selectedSymbols,
      coinGroups
    }),
    randomSelectionEvidence:Object.freeze({
      selectedSymbols,
      seed,
      entropyEvidence:Object.freeze({
        source:ICHING_CAST_ENTROPY_SOURCE,
        digest:entropyDigest
      }),
      replayToken
    }),
    evidenceBoundary:Object.freeze({
      symbolicSamplingEvidenceOnly:true,
      realityEvidence:false,
      fateEvidence:false,
      predictionAuthority:false,
      diagnosticAuthority:false,
      professionalDirectiveAuthority:false,
      decisionAuthority:'USER'
    })
  });
}

export async function verifyIChingGovernedCast(cast,question,{cryptoImpl=globalThis.crypto}={}){
  try{
    if(!cast||cast.schemaVersion!==ICHING_CAST_SCHEMA||cast.method!=='I_CHING')return false;
    if(cast.algorithm?.code!==ICHING_CAST_ALGORITHM||cast.algorithm?.version!==ICHING_CAST_ALGORITHM_VERSION)return false;
    if(cast.selection?.inputMode!=='SYSTEM_RANDOM'||cast.selection?.selectionMode!=='SYSTEM_RANDOM'||cast.selection?.aiSelected!==false||cast.selection?.rerolledInsideCalculation!==false)return false;
    const groups=cast.selection.coinGroups?.map(group=>[...group]);
    const lines=linesFromCoinGroups(groups);
    const selected=lines.map(String);
    if(JSON.stringify(selected)!==JSON.stringify(cast.selection.selectedSymbols))return false;
    if(JSON.stringify(selected)!==JSON.stringify(cast.randomSelectionEvidence?.selectedSymbols))return false;
    const qDigest=await sha256Hex(assertQuestion(question),cryptoImpl);
    if(qDigest!==cast.questionBinding?.digest)return false;
    const entropyDigest=await sha256Hex(canonicalCoinEvidence(groups),cryptoImpl);
    if(!HEX64.test(entropyDigest)||entropyDigest!==cast.randomSelectionEvidence?.entropyEvidence?.digest)return false;
    if(cast.randomSelectionEvidence?.entropyEvidence?.source!==ICHING_CAST_ENTROPY_SOURCE)return false;
    const seed=`ICHING-CSPRNG-${entropyDigest.slice(0,24)}`;
    if(seed!==cast.randomSelectionEvidence?.seed)return false;
    const envelope=canonicalReplayEnvelope({
      createdAt:cast.createdAt,
      questionDigest:qDigest,
      selectedSymbols:selected,
      coinGroups:groups,
      entropyDigest,
      seed
    });
    const replayDigest=await sha256Hex(envelope,cryptoImpl);
    if(cast.randomSelectionEvidence?.replayToken!==`ICH-CAST-${replayDigest}`)return false;
    if(cast.castId!==`ICH-CAST-${replayDigest.slice(0,24).toUpperCase()}`)return false;
    return true;
  }catch{return false;}
}
