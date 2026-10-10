import {ALTERNATIVE_PHASES,freezeDeep} from './num-expansion-rules.js';
import {buildNumEnergyHologram,buildNumEnergyFlowYear} from './num-energy-hologram-runtime.js';
export const NUM_ALT_TIMING_SCHEMA='PHI-OS-NUM-R15-ALTERNATIVE-TIMING-v2.0.0';
function date(value){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));if(!m)throw new TypeError('NUM_R15_TARGET_DATE_REQUIRED');return {year:Number(m[1]),month:Number(m[2]),day:Number(m[3])}}
function phasePattern(triangle,phaseCode){
  if(phaseCode==='FEB_MAY')return {displayPattern:triangle.canonicalCodes.QPR,canonicalCombo:'QPR',positionMeaning:'TOP_EXTERIOR'};
  if(phaseCode==='JUN_SEP')return {displayPattern:triangle.canonicalCodes.VUT,canonicalCombo:'VUT',positionMeaning:'RIGHT_EXTERIOR'};
  return {displayPattern:triangle.physicalExterior.leftDisplayCode,canonicalPattern:triangle.canonicalCodes.XWS,canonicalCombo:'XWS',displayOrder:'WXS',positionMeaning:'LEFT_EXTERIOR'};
}
export function resolveAlternativeTimingPhase({birthDate,targetDate}={}){
 const d=date(targetDate);const phase=ALTERNATIVE_PHASES.find(x=>x.months.includes(d.month));
 const anchorYear=phase.phaseCode==='OCT_JAN'&&d.month===1?d.year-1:d.year;
 const base={schemaVersion:NUM_ALT_TIMING_SCHEMA,workCode:'NUM-R15',targetDate,phaseCode:phase.phaseCode,phaseAnchorYear:anchorYear,phaseMonths:phase.months,phaseBoundaryRecovered:true,fortunePredictionCreated:false};
 if(!birthDate)return freezeDeep({...base,calculationAuthorityGranted:false,runtimeUseAllowed:false,phasePattern:null,flowYear:null,state:'BIRTH_DATE_REQUIRED_FOR_NUMERIC_TIMING'});
 const natal=buildNumEnergyHologram({birthDate});const flowYear=buildNumEnergyFlowYear({birthDate,targetYear:d.year});
 return freezeDeep({...base,birthDate,phasePattern:phasePattern(natal,phase.phaseCode),flowYear:{targetYear:d.year,code:flowYear.flowYearCode,number:flowYear.flowYearNumber,yearPairCode:flowYear.yearPairCode},
  calculationAuthorityGranted:true,runtimeUseAllowed:true,customerPublishable:true,numericFormulaState:'RECOVERED_AND_PUBLICLY_CORROBORATED',
  schoolSeparation:'ALTERNATIVE_ENERGY_TIMING_NOT_MERGED_WITH_R8_PERSONAL_YEAR_MONTH_DAY',state:'CALCULATION_AUTHORITY_ACTIVE'});
}
export {buildNumEnergyFlowYear};
export default Object.freeze({resolveAlternativeTimingPhase,buildNumEnergyFlowYear});
