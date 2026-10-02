import {composeReportSectionT2,REPORT_SECTION_T2_COMPOSER_VERSION,REPORT_SECTION_T2_PROMPT_VERSION} from './narrative-writer.js';

export const REPORT_SECTION_T3_COMPOSER_VERSION='PHI-OS-REPORT-SECTION-T3-DEEP-COMPOSER-v1.0.0';
export const REPORT_SECTION_T3_PROMPT_VERSION=REPORT_SECTION_T2_PROMPT_VERSION;

export async function composeReportSectionT3(args={}){
 return composeReportSectionT2({...args,aiExecutionClass:'T3_DEEP_COMPOSITION',timeoutMs:Math.max(Number(args.timeoutMs||0),120000)});
}

export default Object.freeze({composeReportSectionT3,REPORT_SECTION_T3_COMPOSER_VERSION,REPORT_SECTION_T2_COMPOSER_VERSION});
