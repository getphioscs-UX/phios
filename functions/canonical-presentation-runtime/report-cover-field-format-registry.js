export const REPORT_COVER_FIELD_FORMAT_REGISTRY_VERSION='PHI-OS-REPORT-COVER-FIELD-FORMAT-REGISTRY-v1.0.0';

const entry=(dateFormat,timeFormat='HH : MM')=>Object.freeze({dateFormat,timeFormat});
export const REPORT_COVER_FIELD_FORMAT_REGISTRY=Object.freeze({
 BZR:entry('YYYY / MM / DD'),
 ZWR:entry('YYYY / MM / DD'),
 AST:entry('YYYY / MM / DD'),
 NUM:entry('YYYY / MM / DD'),
 PROFILE:entry('YYYY / MM / DD'),
 ECR:entry('YYYY / MM / DD'),
 HD:entry('DD / MM / YYYY'),
 CROSS:entry('YYYY / MM / DD')
});
export function reportCoverFieldFormat(methodId){
 const v=REPORT_COVER_FIELD_FORMAT_REGISTRY[String(methodId||'').toUpperCase()];
 if(!v)throw Error('REPORT_COVER_FIELD_FORMAT_METHOD_UNREGISTERED');
 return v;
}
export default Object.freeze({REPORT_COVER_FIELD_FORMAT_REGISTRY,reportCoverFieldFormat});
