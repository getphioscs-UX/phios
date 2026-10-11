import {loadCanonicalPersonSubject} from '../account/canonical-person-store.js';
import {buildCanonicalBaziChartIR} from '../bzr-full-production/bazi-chart-runtime.js';
import {analyzeBaziStrengthSeasonal} from '../bzr-full-production/bazi-strength-seasonal-runtime.js';
import {analyzeBaziRelationships} from '../bzr-full-production/bazi-relationship-runtime.js';
import {analyzeBaziTenGods} from '../bzr-full-production/bazi-ten-god-runtime.js';
import {analyzeBaziPatternCandidates} from '../bzr-full-production/bazi-pattern-runtime.js';
import {analyzeBaziFinalStructuralVerdictR2} from '../bzr-full-production/bazi-final-structural-verdict-r2.js';
import {projectBaziDeepManuscriptAuthority} from '../personal-reading/deep-manuscript/bazi-deep-manuscript-authority-pack.js';
import {reportBirthInputFingerprint} from '../canonical-presentation-runtime/report-cover-subject.js';
import {digest} from '../personal-reading/deep-manuscript/bazi-deep-manuscript-contract.js';
const NATIVE_PILLAR_POSITIONS=['YEAR','MONTH','DAY','HOUR'];
function incompleteNativeAuthority(detail){
 const error=new Error('BAZI_NATIVE_AUTHORITY_PROJECTION_INCOMPLETE');
 error.code='BAZI_NATIVE_AUTHORITY_PROJECTION_INCOMPLETE';
 error.responsibilityOwner='PHIOS_SYSTEM';error.detail=detail;return error;
}
// Assert source preservation, not chart validity or metaphysical interpretation.
export function assertBaziNativeAuthorityComplete({chart,tenGods,relationships,projection}){
 if(!Array.isArray(chart?.pillars)||chart.pillars.length!==4||!NATIVE_PILLAR_POSITIONS.every(p=>chart.pillars.filter(x=>x.position===p).length===1)||!Array.isArray(tenGods?.hiddenStems)||!Array.isArray(tenGods?.visibleStems)||!Array.isArray(relationships?.relations))throw incompleteNativeAuthority('CANONICAL_SOURCE_SHAPE');
 if(tenGods.sourceChartDigest!==chart.chartDigest||relationships.sourceChartDigest!==chart.chartDigest)throw incompleteNativeAuthority('CANONICAL_SOURCE_IDENTITY');
 for(const position of NATIVE_PILLAR_POSITIONS){
  const pillar=chart.pillars.find(p=>p.position===position),hidden=tenGods.hiddenStems.filter(t=>t.pillar===position),visible=tenGods.visibleStems.filter(t=>t.pillar===position);
  if(!pillar.stem?.zh||!pillar.branch?.zh||!Array.isArray(pillar.hiddenStems)||!pillar.hiddenStems.length||hidden.length!==pillar.hiddenStems.length||visible.length!==1)throw incompleteNativeAuthority(position+'_SOURCE_INCOMPLETE');
  if(pillar.hiddenStems.some(h=>hidden.filter(t=>t.order===h.order&&t.hiddenStemCode===h.code&&t.hiddenStemZh===h.zh&&t.branchCode===pillar.branch.code&&t.branchZh===pillar.branch.zh&&t.location===position+'_BRANCH_HIDDEN_'+h.order&&t.tenGodZh).length!==1))throw incompleteNativeAuthority(position+'_HIDDEN_SOURCE_MISMATCH');
  const projected=projection?.tenGodFacts?.filter(t=>t.position===position+'_BRANCH_HIDDEN');
  if(projection?.pillars?.[position.toLowerCase()]!==pillar.stem.zh+pillar.branch.zh||projected?.length!==hidden.length||hidden.some(t=>projected.filter(f=>f.token===t.hiddenStemZh&&f.tenGod===t.tenGodZh&&JSON.stringify(f.canonicalRecord)===JSON.stringify(t)&&f.sourceRef===`canonicalTenGods:${tenGods.tenGodDigest}:${t.location}`).length!==1))throw incompleteNativeAuthority(position+'_PROJECTION_LOSS');
 }
 if(JSON.stringify(projection.relationships)!==JSON.stringify(relationships.relations))throw incompleteNativeAuthority('RELATIONSHIP_PROJECTION_LOSS');
 return {state:'COMPLETE',responsibilityOwner:'PHIOS_SYSTEM'};
}
export function projectBaziNativeChartFacts({chart,tenGods,relationships}){
 if(!Array.isArray(chart?.pillars)||!Array.isArray(tenGods?.visibleStems)||!Array.isArray(tenGods?.hiddenStems)||!Array.isArray(relationships?.relations))throw incompleteNativeAuthority('CANONICAL_SOURCE_SHAPE');
 const projection={pillars:Object.fromEntries(chart.pillars.map(p=>[p.position.toLowerCase(),p.stem.zh+p.branch.zh])),tenGodFacts:[
  ...tenGods.visibleStems.map(t=>({position:t.pillar+'_STEM',token:t.stemZh,tenGod:t.tenGodZh,sourceRef:`canonicalTenGods:${tenGods.tenGodDigest}:${t.location}`,canonicalRecord:structuredClone(t)})),
  ...tenGods.hiddenStems.map(t=>({position:t.pillar+'_BRANCH_HIDDEN',token:t.hiddenStemZh,tenGod:t.tenGodZh,sourceRef:`canonicalTenGods:${tenGods.tenGodDigest}:${t.location}`,canonicalRecord:structuredClone(t)}))
 ],relationships:structuredClone(relationships.relations)};
 assertBaziNativeAuthorityComplete({chart,tenGods,relationships,projection});return projection;
}
// Server-side projection from the current subject calculation. No reference
// chart, accepted reference prose, provider or browser-supplied authority enters.
export async function buildCustomerNativeBaziInputs(context,prepared){
 const subject=await loadCanonicalPersonSubject(context.env,prepared.customerId,prepared.personId);
 if(subject.personVersion!==prepared.personVersion||await reportBirthInputFingerprint(subject.canonicalBirthInput)!==prepared.canonicalBirthInputFingerprint)throw Error('BAZI_SUBJECT_CHANGED_DURING_PREPARATION');
 const chart=await buildCanonicalBaziChartIR({canonicalProjection:prepared.execution.canonicalProjection});
 const strengthSeasonal=await analyzeBaziStrengthSeasonal({chart}),relationships=await analyzeBaziRelationships({chart}),tenGods=await analyzeBaziTenGods({chart}),patterns=await analyzeBaziPatternCandidates({chart,tenGods,relationships});
 const verdict=await analyzeBaziFinalStructuralVerdictR2({chart,relationships,strengthSeasonal,patterns});
 const nativeFacts=projectBaziNativeChartFacts({chart,tenGods,relationships}),pillars=nativeFacts.pillars;
 const authority={chart:{...nativeFacts,dayMaster:chart.dayMaster.zh,monthBranch:chart.monthCommand.branch.zh,finalStructuralVerdictR2:verdict,unresolvedAuthority:{sourceState:chart.authorityState,unknowns:prepared.execution.canonicalProjection.unknown}},editorialAuthority:{unknownRemainsUnknown:true}};
 const timing={identityState:'NATAL_ONLY_CURRENT_TIMING_UNKNOWN',natal:pillars,cycles:prepared.execution.canonicalProjection.calculation.cycles,relations:[],targetContext:null};
 const pack=await projectBaziDeepManuscriptAuthority({authority,timing,subject:{subjectId:prepared.personId,displayName:subject.person.displayName,birthDate:subject.canonicalBirthInput.birthDate,birthTime:subject.canonicalBirthInput.birthTime,timeAccuracy:subject.canonicalBirthInput.timeAccuracy},sourceLineage:{authority:{owner:'EXISTING_BZR_NATIVE_RUNTIME',digest:await digest(authority)},timing:{owner:'EXISTING_MCD5_CALCULATION',digest:await digest(timing)},methodVersion:verdict.schemaVersion,reality:'NOT_SUPPLIED'}});
 return {pack,inputSnapshot:subject.canonicalBirthInput,calculationSnapshot:prepared.execution.canonicalProjection,personVersion:subject.personVersion,calculationDigest:prepared.calculationDigest,canonicalBirthInputFingerprint:prepared.canonicalBirthInputFingerprint};
}
