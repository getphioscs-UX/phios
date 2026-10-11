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
// Server-side projection from the current subject calculation. No reference
// chart, accepted reference prose, provider or browser-supplied authority enters.
export async function buildCustomerNativeBaziInputs(context,prepared){
 const subject=await loadCanonicalPersonSubject(context.env,prepared.customerId,prepared.personId);
 if(subject.personVersion!==prepared.personVersion||await reportBirthInputFingerprint(subject.canonicalBirthInput)!==prepared.canonicalBirthInputFingerprint)throw Error('BAZI_SUBJECT_CHANGED_DURING_PREPARATION');
 const chart=await buildCanonicalBaziChartIR({canonicalProjection:prepared.execution.canonicalProjection});
 const strengthSeasonal=await analyzeBaziStrengthSeasonal({chart}),relationships=await analyzeBaziRelationships({chart}),tenGods=await analyzeBaziTenGods({chart}),patterns=await analyzeBaziPatternCandidates({chart,tenGods,relationships});
 const verdict=await analyzeBaziFinalStructuralVerdictR2({chart,relationships,strengthSeasonal,patterns});
 const pillars=Object.fromEntries(chart.pillars.map(p=>[p.position.toLowerCase(),p.stem.zh+p.branch.zh]));
 const authority={chart:{pillars,dayMaster:chart.dayMaster.zh,monthBranch:chart.monthCommand.branch.zh,tenGodFacts:[...tenGods.visibleStems.map(t=>({position:t.pillar+'_STEM',token:chart.pillars.find(p=>p.position===t.pillar)?.stem.zh||null,tenGod:t.tenGodZh,sourceRef:t.sourceRef||chart.dayMaster.sourceRef})),...tenGods.hiddenStems.map(t=>({position:t.pillar+'_HIDDEN_'+t.order,token:t.hiddenStemZh,tenGod:t.tenGodZh,sourceRef:t.sourceRef||chart.dayMaster.sourceRef}))],relationships:relationships.relationships||relationships.records||[],finalStructuralVerdictR2:verdict,unresolvedAuthority:{sourceState:chart.authorityState,unknowns:prepared.execution.canonicalProjection.unknown}},editorialAuthority:{unknownRemainsUnknown:true}};
 const timing={identityState:'NATAL_ONLY_CURRENT_TIMING_UNKNOWN',natal:pillars,cycles:prepared.execution.canonicalProjection.calculation.cycles,relations:[],targetContext:null};
 const pack=await projectBaziDeepManuscriptAuthority({authority,timing,subject:{subjectId:prepared.personId,displayName:subject.person.displayName,birthDate:subject.canonicalBirthInput.birthDate,birthTime:subject.canonicalBirthInput.birthTime,timeAccuracy:subject.canonicalBirthInput.timeAccuracy},sourceLineage:{authority:{owner:'EXISTING_BZR_NATIVE_RUNTIME',digest:await digest(authority)},timing:{owner:'EXISTING_MCD5_CALCULATION',digest:await digest(timing)},methodVersion:verdict.schemaVersion,reality:'NOT_SUPPLIED'}});
 return {pack,inputSnapshot:subject.canonicalBirthInput,calculationSnapshot:prepared.execution.canonicalProjection,personVersion:subject.personVersion,calculationDigest:prepared.calculationDigest,canonicalBirthInputFingerprint:prepared.canonicalBirthInputFingerprint};
}
