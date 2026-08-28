import {ALTERNATIVE_PHASES,freezeDeep} from './num-expansion-rules.js';
export const NUM_ALT_TIMING_SCHEMA='PHI-OS-NUM-R15-ALTERNATIVE-TIMING-v1.0.0';
function date(value){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));if(!m)throw new TypeError('NUM_R15_TARGET_DATE_REQUIRED');return {year:Number(m[1]),month:Number(m[2]),day:Number(m[3])}}
export function resolveAlternativeTimingPhase({targetDate}={}){
 const d=date(targetDate);const phase=ALTERNATIVE_PHASES.find(x=>x.months.includes(d.month));
 const anchorYear=phase.phaseCode==='OCT_JAN'&&d.month===1?d.year-1:d.year;
 return freezeDeep({schemaVersion:NUM_ALT_TIMING_SCHEMA,workCode:'NUM-R15',targetDate,phaseCode:phase.phaseCode,phaseAnchorYear:anchorYear,phaseMonths:phase.months,phaseBoundaryRecovered:true,flowYearNumericFormulaState:'UNRESOLVED',flowMonthPatternFormulaState:'UNRESOLVED',numericPattern:null,fortunePredictionCreated:false,state:'PHASE_BOUNDARY_ONLY_NUMERIC_AUTHORITY_WITHHELD'});
}
export default Object.freeze({resolveAlternativeTimingPhase});
