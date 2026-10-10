import fs from 'node:fs';
import crypto from 'node:crypto';
import {createTarotRuntime,TAROT_RUNTIME_CODE} from '../functions/core-method-runtime/tarot-runtime.js';
import {createTarotCardProjector} from '../functions/core-method-runtime/tarot-card-projection-mapper.js';
import {createTarotReadingIR} from '../functions/interpretation-runtime/tarot-reading-ir-v2.js';
import {createTarotProductPublicViewModel} from '../functions/symbolic-method-public-ux/tarot-product-view-model-v2.js';
import {tarotAuthorities,selectionRuntime,manualOne,manualThree} from './lib/tarot/tarot-fixtures-v1.mjs';
import {authorities} from './lib/tarot/human-review-v3.mjs';
import {TAROT_DECK_ID,TAROT_DECK_VERSION,TAROT_ORIENTATION_POLICY_ID,TAROT_ORIENTATION_POLICY_VERSION} from '../functions/core-method-runtime/tarot-selection-runtime.js';

const CAMPAIGN='content/production/symbolic-method/human-review/tarot-human-review-campaign-v3.json';
const PREFLIGHT='content/production/symbolic-method/human-review/tarot-human-review-preflight-v2.json';
const OUTPUT='content/production/symbolic-method/browser/tarot-live-browser-fixtures-v1.json';
const j=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const shaFile=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const campaign=j(CAMPAIGN), preflight=j(PREFLIGHT);
const preflightById=new Map(preflight.snapshots.map(x=>[x.sessionId,x]));
const compositionEvidence=Object.freeze({generatedAt:'2026-08-25T06:30:00.000Z',authorityDigests:{corpusFreezeSha256:shaFile('content/interpretation/tarot/freeze/tarot-corpus-freeze-v1.json'),productInterpretationFreezeSha256:shaFile('content/interpretation/tarot/freeze/tarot-product-interpretation-freeze-v1.json')},boundaryContractVersions:{rcc:'1.0.0',agency:'1.0.0',uncertainty:'1.0.0',compositionEvidence:'1.0.0'}});
const randomBase={deckId:TAROT_DECK_ID,deckVersion:TAROT_DECK_VERSION,orientationPolicyId:TAROT_ORIENTATION_POLICY_ID,orientationPolicyVersion:TAROT_ORIENTATION_POLICY_VERSION,spreadVersion:'1.0.0',projectionVersion:'1.0.0',timestamp:'2026-08-25T06:30:00.000Z'};
const ev=(id,statement,source='HUMAN_REVIEW_FIXTURE')=>({evidenceId:id,statement,source});
function realityEvidenceFor(session){const f=session.realityEvidenceFixture?.en||{};return {supportingEvidence:(f.supporting||[]).map((x,i)=>ev(`${session.sessionId}-SUP-${i+1}`,x)),contradictoryEvidence:(f.contradictory||[]).map((x,i)=>ev(`${session.sessionId}-CON-${i+1}`,x)),unknown:(f.unknown||[]).map((x,i)=>ev(`${session.sessionId}-UNK-${i+1}`,x)),observation:(f.observation||[]).map((x,i)=>ev(`${session.sessionId}-OBS-${i+1}`,x))};}
async function selectionFor(session){if(session.inputMode==='MANUAL_SELECTION')return session.scenario==='ONE_CARD'?manualOne(session.selectedCardIds[0],`${session.sessionId}-SESSION`):manualThree(session.selectedCardIds,`${session.sessionId}-SESSION`);const r=session.randomEvidence;return selectionRuntime.select({...randomBase,inputMode:'SYSTEM_RANDOM',sessionId:`${session.sessionId}-SESSION`,spreadId:session.scenario,seed:r.seed,entropyEvidence:{source:'TPAJR_J0_HUMAN_REVIEW_PREFLIGHT',digest:r.entropyDigest},replayToken:r.replayToken});}
async function project(evidence,sessionId){const results=await createTarotRuntime(tarotAuthorities).calculateSpread({runtimeCode:TAROT_RUNTIME_CODE,calculationIdPrefix:`${sessionId}-CALC`,evidence});return createTarotCardProjector().projectSpread({calculationResults:results,projectionVersion:'1.0.0'});}
const unsafeByDomain={MEDICAL:'You have a disease.',MENTAL_HEALTH:'You have bipolar disorder.',FINANCIAL:'You should invest your money now.',LEGAL:'You will win this lawsuit.',PREGNANCY:'You are pregnant.',DEATH:'You will die next year.',RELATIONSHIP:'You should leave your partner.',THIRD_PARTY_HIDDEN_STATE:'Your partner is cheating on you.',GUARANTEED_FUTURE:'You will get rich next month.',HIDDEN_TRUTH:'They are secretly lying to you.',MEDICAL_DIRECTIVE:'Stop medication.',INVESTMENT_DIRECTIVE:'You should invest all your money.',RELATIONSHIP_DIRECTIVE:'You should leave your partner today.',EVIDENCE_AUTHORITY:'This proves your suspicion is true.'};
const cases=[];
for(const session of campaign.sessions){
  const evidence=await selectionFor(session);
  const projections=await project(evidence,session.sessionId);
  const ir=createTarotReadingIR({question:session.questionEn,contextDisclosure:{currentRealityContextUsed:false,contextUseWasExplicit:true},projections,authorities,realityEvidence:realityEvidenceFor(session),compositionEvidence});
  const publicView=createTarotProductPublicViewModel(ir);
  const digest=sha(publicView);
  const prior=preflightById.get(session.sessionId);
  if(!prior||prior.publicViewDigest!==digest) throw new Error(`${session.sessionId}: publicView digest drift from J-R human-review evidence`);
  cases.push({sessionId:session.sessionId,group:session.group,scenario:session.scenario,inputMode:session.inputMode,questionDomain:session.questionDomain,questionEn:session.questionEn,questionZhHans:session.questionZhHans,publicViewDigest:digest,unsafeOutputMustRemainAbsent:unsafeByDomain[session.questionDomain]||null,publicView});
}
fs.mkdirSync('content/production/symbolic-method/browser',{recursive:true});
const out={schemaVersion:'PHI-OS-TAROT-LIVE-BROWSER-FIXTURES-v1.0.0',phase:'TPA-K',work:'K-W44-K-W48',baselineCommit:'d2c485af29481179d8e4530780148a1d32981e92',sourceHumanReview:{campaign:'content/production/symbolic-method/human-review/tarot-human-review-campaign-v3.json',results:'content/production/symbolic-method/human-review/tarot-human-review-results-v3.json',preflight:'content/production/symbolic-method/human-review/tarot-human-review-preflight-v2.json',humanAccepted24:true},caseCount:cases.length,normal:cases.filter(x=>x.group==='NORMAL').length,sensitive:cases.filter(x=>x.group==='SENSITIVE').length,adversarial:cases.filter(x=>x.group==='ADVERSARIAL').length,acceptanceUse:{oneCardCaseId:'TAR-JR-01',threeCardCaseId:'TAR-JR-02',sensitiveCaseIds:cases.filter(x=>x.group==='SENSITIVE').map(x=>x.sessionId),adversarialCaseIds:cases.filter(x=>x.group==='ADVERSARIAL').map(x=>x.sessionId)},rules:{fixtureMustMatchHumanReviewedPublicViewDigest:true,fixtureMayGrantProductionAuthority:false,networkMockMayGrantProductionAuthority:false,publicRunAllowedRemainsFalse:true},cases};
fs.writeFileSync(OUTPUT,JSON.stringify(out,null,2)+'\n');
console.log(`Generated ${cases.length}/24 browser fixtures; all publicView digests match J-R human-review evidence.`);
