export const BAZI_FULL_PRODUCTION_GATE=Object.freeze({
 schemaVersion:'PHI-OS-BAZI-FP-W19-PRODUCTION-GATE-RUNTIME-v1.0.0',gateVersion:'1.0.0',status:'FULL_PRODUCTION_FROZEN',productionAllowed:true,customerPublishable:true,defaultCustomerSurfaceAllowed:true,readingIrSchema:'PHI-OS-BAZI-FULL-READING-IR-v1.0.0',readingIrRuntimeVersion:'1.0.0',reportSchema:'PHI-OS-BAZI-CUSTOMER-REPORT-v1.0.0',reportRuntimeVersion:'1.0.0',humanAdmissionRef:'BAZI-FP-W18:HUMAN_ACCEPTED_24_OF_24',machineAdmissionRef:'BAZI-FP-W17:MACHINE_ACCEPTED_96_OF_96'});
function fail(code){const e=new Error(code);e.code=code;e.status=503;throw e}
export function authorizeBaziFullProductionPublication({readingIR,report}={}){
 const g=BAZI_FULL_PRODUCTION_GATE;if(g.status!=='FULL_PRODUCTION_FROZEN'||g.productionAllowed!==true||g.customerPublishable!==true)fail('BAZI_FP_W19_PRODUCTION_GATE_CLOSED');
 if(readingIR?.schemaVersion!==g.readingIrSchema)fail('BAZI_FP_W19_READING_IR_SCHEMA_DRIFT');
 if(readingIR?.runtimeVersion!==g.readingIrRuntimeVersion)fail('BAZI_FP_W19_READING_IR_RUNTIME_DRIFT');
 if(report?.schemaVersion!==g.reportSchema)fail('BAZI_FP_W19_REPORT_SCHEMA_DRIFT');
 if(report?.runtimeVersion!==g.reportRuntimeVersion)fail('BAZI_FP_W19_REPORT_RUNTIME_DRIFT');
 const b=report?.boundaries||{};for(const [k,v] of Object.entries({pillarByPillarRepeatedEssay:false,schoolViewsMerged:false,unknownHidden:false,counterEvidenceHidden:false,primaryPatternInvented:false,strongWeakInvented:false,usefulGodInvented:false,goodBadScoreCreated:false,eventPredictionCreated:false,fortunePredictionCreated:false}))if(b[k]!==v)fail(`BAZI_FP_W19_REPORT_BOUNDARY_DRIFT:${k}`);
 return Object.freeze({schemaVersion:'PHI-OS-BAZI-FP-PUBLICATION-DECISION-v1.0.0',gateVersion:g.gateVersion,status:'CUSTOMER_PUBLISHABLE',productionAllowed:true,customerPublishable:true,defaultCustomerSurfaceAllowed:true,humanAdmissionRef:g.humanAdmissionRef,machineAdmissionRef:g.machineAdmissionRef});
}
export default Object.freeze({BAZI_FULL_PRODUCTION_GATE,authorizeBaziFullProductionPublication});
