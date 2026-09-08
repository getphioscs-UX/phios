const clean=v=>String(v??'').normalize('NFKC').trim();
const yes=v=>['1','true','yes','on','enabled'].includes(clean(v).toLowerCase());

// W16R2B is intentionally fail-closed in this build. Human acceptance of case 084 is still missing.
export const KIR_R2_W16R2B_BUILD_ADMITTED=false;
export const KIR_R2_W16R2B_ADMISSION_SCHEMA='PHI-OS-KIR-R2-W16R2B-PRODUCTION-ADMISSION-v1.0.0';

export function getKirR2W16R2BProductionAdmission(env={}){
  const requested=yes(env.PHIOS_KIR_R2_W16R2B_PRODUCTION_ADMITTED);
  const gatewayRequested=yes(env.PHIOS_KIR_R2_MODEL_GATEWAY_ENABLED);
  const allowed=KIR_R2_W16R2B_BUILD_ADMITTED&&requested&&gatewayRequested;
  return Object.freeze({
    schemaVersion:KIR_R2_W16R2B_ADMISSION_SCHEMA,
    buildAdmitted:KIR_R2_W16R2B_BUILD_ADMITTED,
    requested,
    gatewayRequested,
    allowed,
    status:allowed?'PRODUCTION_ADMITTED':'PRODUCTION_BLOCKED_CASE084_HUMAN_ACCEPTANCE_REQUIRED'
  });
}

export function kirR2W16R2BProductionCutoverEnabled(env={}){
  return getKirR2W16R2BProductionAdmission(env).allowed;
}
