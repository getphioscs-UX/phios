import {deepFreeze,sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
import {buildZiweiReportEvidence} from './ziwei-publication-adapter.js';
import {buildZiweiR5AuthoringPack} from './ziwei-r5-authoring-pack.js';

export const ZWR_PRO_W10_QA_VERSION='ZWR-PRO-W10-CONTROLLED-MULTICHART-QA-v1';

function clone(v){return structuredClone(v);}
function requestForLocale(input,locale){
 const executionRequest=clone(input.executionRequest);
 executionRequest.canonicalInput.locale=locale;
 return executionRequest;
}
function structuralTokens(structured){
 return [
  ...structured.palaces.map(p=>`P:${p.palaceCode}:${p.branch}:${p.isLifePalace?'L':''}${p.isBodyPalace?'B':''}`),
  ...structured.placements.map(p=>`S:${p.palaceCode}:${p.starCode}:${p.state||'UNKNOWN'}`),
  ...structured.transformations.map(t=>`T:${t.layer}:${t.palaceCode}:${t.targetStarCode}:${t.transformationCode}`),
  ...structured.patterns.map(p=>`G:${p.patternCode}:${[...p.palaceCodes].sort().join('+')}`),
  ...structured.timing.map(t=>`M:${t.layer}:${t.focus?.natalDomainCode||''}`)
 ].sort();
}
function jaccardDistance(a,b){
 const A=new Set(a),B=new Set(b);let hit=0;
 for(const x of A)if(B.has(x))hit++;
 const union=A.size+B.size-hit;
 return union?1-hit/union:0;
}
function normalizedPackStructure(pack){
 return {
  subjectId:pack.subjectBinding.subjectId,
  inputFingerprint:pack.subjectBinding.inputFingerprint,
  palaces:pack.wholeChartTechnicalSnapshot.palaces.map(p=>({
   palaceCode:p.palaceCode,branch:p.branch,isLifePalace:p.isLifePalace,isBodyPalace:p.isBodyPalace,
   stars:p.stars.map(s=>({starCode:s.starCode,stateCode:s.stateCode,stateKnown:s.stateKnown}))
  })),
  transformations:pack.wholeChartTechnicalSnapshot.transformations.map(t=>({layer:t.layer,palaceCode:t.palaceCode,targetStarCode:t.targetStarCode,transformationCode:t.transformationCode})),
  patterns:pack.wholeChartTechnicalSnapshot.qualifiedPatterns.map(p=>({patternCode:p.patternCode,palaceCodes:[...p.palaceCodes]})),
  timing:pack.wholeChartTechnicalSnapshot.timing.map(t=>({layer:t.layer,role:t.role,focus:t.focus}))
 };
}
export async function buildZwrProW10DeterministicCase({fixtureId,input}={}){
 if(!fixtureId||!input?.executionRequest)throw Error('ZWR_PRO_W10_FIXTURE_INPUT_REQUIRED');
 const subjectId=`ZPA-CONTROLLED-${fixtureId}`;
 const targetContext=input.targetContext;
 const enEvidence=await buildZiweiReportEvidence({subjectId,executionRequest:requestForLocale(input,'en'),targetContext,locale:'en'});
 const zhEvidence=await buildZiweiReportEvidence({subjectId,executionRequest:requestForLocale(input,'zh-Hans'),targetContext,locale:'zh-Hans'});
 const enPack=await buildZiweiR5AuthoringPack({evidence:enEvidence,locale:'en'});
 const zhPack=await buildZiweiR5AuthoringPack({evidence:zhEvidence,locale:'zh-Hans'});
 const enStructure=normalizedPackStructure(enPack),zhStructure=normalizedPackStructure(zhPack);
 const enDigest=await sha256Stable(enStructure),zhDigest=await sha256Stable(zhStructure);
 if(enDigest!==zhDigest)throw Error('ZWR_PRO_W10_BILINGUAL_AUTHORITY_DRIFT:'+fixtureId);
 if(enPack.subjectBinding.inputFingerprint!==zhPack.subjectBinding.inputFingerprint)throw Error('ZWR_PRO_W10_INPUT_FINGERPRINT_DRIFT:'+fixtureId);
 const sourceUnknownCount=enEvidence.structured.unknowns.length,unknownCount=enPack.wholeChartTechnicalSnapshot.unknowns.length,zhUnknownCount=zhPack.wholeChartTechnicalSnapshot.unknowns.length;
 if(unknownCount!==sourceUnknownCount||zhUnknownCount!==sourceUnknownCount)throw Error('ZWR_PRO_W10_UNKNOWN_PRESERVATION_DRIFT:'+fixtureId);
 const timingLayers=[...new Set(enPack.wholeChartTechnicalSnapshot.timing.map(t=>t.layer))].sort();
 const tokens=structuralTokens(enEvidence.structured);
 return deepFreeze({
  fixtureId,subjectId,inputFingerprint:enPack.subjectBinding.inputFingerprint,
  authorityDigest:enDigest,structuralTokens:tokens,
  structuralSignature:await sha256Stable(tokens),
  sourceUnknownCount,unknownCount,zhUnknownCount,timingLayers,
  sectionCountEn:enPack.sections.length,sectionCountZhHans:zhPack.sections.length,
  evidence:enEvidence
 });
}
export function selectZwrProW10Sentinels(cases,{count=4,exclude=['01']}={}){
 const pool=cases.filter(c=>!exclude.includes(c.fixtureId)).sort((a,b)=>a.fixtureId.localeCompare(b.fixtureId));
 if(pool.length<count)throw Error('ZWR_PRO_W10_SENTINEL_POOL_TOO_SMALL');
 const selected=[pool[0]];
 while(selected.length<count){
  let best=null,bestScore=-1;
  for(const candidate of pool){
   if(selected.includes(candidate))continue;
   const score=Math.min(...selected.map(s=>jaccardDistance(candidate.structuralTokens,s.structuralTokens)));
   if(score>bestScore||(score===bestScore&&candidate.fixtureId<(best?.fixtureId||'ZZ'))){best=candidate;bestScore=score;}
  }
  selected.push(best);
 }
 return deepFreeze(selected.map(c=>({fixtureId:c.fixtureId,subjectId:c.subjectId,inputFingerprint:c.inputFingerprint,authorityDigest:c.authorityDigest,structuralSignature:c.structuralSignature})));
}
export async function summarizeZwrProW10Campaign(cases){
 const uniqueInputs=new Set(cases.map(c=>c.inputFingerprint)).size;
 const uniqueAuthority=new Set(cases.map(c=>c.authorityDigest)).size;
 const uniqueStructural=new Set(cases.map(c=>c.structuralSignature)).size;
 const sentinels=selectZwrProW10Sentinels(cases,{count:4,exclude:['01']});
 const seed={
  schemaVersion:ZWR_PRO_W10_QA_VERSION,
  subjectCount:cases.length,
  uniqueInputFingerprints:uniqueInputs,
  uniqueAuthorityDigests:uniqueAuthority,
  uniqueStructuralSignatures:uniqueStructural,
  allTenSections:cases.every(c=>c.sectionCountEn===10&&c.sectionCountZhHans===10),
  timingLayersBounded:cases.every(c=>c.timingLayers.every(x=>['NATAL','DA_XIAN','LIU_NIAN'].includes(x))),
  unknownsPreserved:cases.every(c=>c.unknownCount===c.sourceUnknownCount&&c.zhUnknownCount===c.sourceUnknownCount),
  sentinels,
  providerCalls:0,
  liveCompositionExecuted:false,
  productionAdmissionGranted:false
 };
 return deepFreeze({...seed,campaignDigest:await sha256Stable(seed)});
}
export default Object.freeze({buildZwrProW10DeterministicCase,selectZwrProW10Sentinels,summarizeZwrProW10Campaign,ZWR_PRO_W10_QA_VERSION});
