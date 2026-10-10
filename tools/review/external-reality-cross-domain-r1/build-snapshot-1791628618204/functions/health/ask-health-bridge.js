import { classifyHealthIntent, routeHealthSafety, buildHealthReality } from './health-reality-runtime.js';

export function planAskHealthBridge(input = {}, env = {}) {
  const question = String(input.question || '').trim();
  const intent = classifyHealthIntent({ question });
  if (intent === 'NON_HEALTH') return { route: 'CKA_STANDARD', healthIntent: false };
  const safety = routeHealthSafety({ question });
  const liveHealthAuthorityConnected = env.PHIOS_HEALTH_AUTHORITY_ENABLED === '1';
  const requiresExternalHealthFacts = ['HEALTH_INFORMATION','HEALTH_DOCUMENT_UNDERSTANDING'].includes(intent);
  return {
    schemaVersion: 'PHI-OS-ASK-HRX-BRIDGE-v1.0.0',
    route: safety.careState === 'EMERGENCY' || safety.careState === 'URGENT_EVALUATION'
      ? 'HRX_SAFETY_FIRST'
      : requiresExternalHealthFacts && !liveHealthAuthorityConnected
        ? 'HRX_AUTHORITY_REQUIRED'
        : 'HRX_GUIDED_CONTEXT',
    healthIntent: true,
    intent,
    safety,
    authority: {
      liveHealthAuthorityConnected,
      generalModelMaySubstituteForHealthAuthority: false
    },
    governance: {
      methodExecutionAllowed: false,
      diagnosisAllowed: false,
      treatmentPrescriptionAllowed: false,
      silentPrivateContextConsumptionAllowed: false,
      productionActivation: false
    }
  };
}

export function createAskHealthReality(input = {}) {
  const plan = planAskHealthBridge(input, input.env || {});
  if (!plan.healthIntent) throw new Error('HRX_HEALTH_INTENT_REQUIRED');
  return { plan, reality: buildHealthReality(input) };
}
