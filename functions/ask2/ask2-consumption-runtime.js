import { buildAsk2OrchestrationPlan, composeAsk2BoundedState } from './ask2-orchestrator.js';
import { executeAsk2RuntimeRequests } from './ask2-execution-adapters.js';
import { buildAsk2ClientProjection } from './ask2-public-composer.js';
import { planAskHealthBridge } from '../health/ask-health-bridge.js';
import { routeHealthSafety } from '../health/health-reality-runtime.js';

const PERSONAL_ACTION_SIGNAL = /(?:我|我的|我们|自己).*(?:应该|怎么办|调整|选择|决定|关系|伴侣|工作|现金流|节奏)|(?:what should i|how should i|my (?:relationship|partner|work|career|cash flow|rhythm|decision))/i;
const PERSONAL_RELATIONSHIP_SIGNAL = /(?:我(?:的)?(?:丈夫|老公|妻子|老婆|伴侣)|my (?:husband|wife|spouse|partner)).*(?:脾气|发脾气|生气|争吵|bad[- ]tempered|angry|temper|argument)/i;
const CURRENT_SIGNAL = /(current|today|latest|recent|now|opr|interest rate|market|economy|policy|news|weather|outbreak|cases|今天|目前|现在|最新|利率|市场|经济|政策|新闻|天气|病例|疫情)/i;
const EVERGREEN_KNOWLEDGE = /^(what is|what are|define|explain|什么是|何谓|解释一下)/i;
const GENERAL_KNOWLEDGE_SIGNAL=/(文明|历史|知识|机制|概念|理论|atlas|civilization|history|knowledge|mechanism|concept|theory)/i;
const HEALTH_K1_SIGNAL = /(rash|redness|itch|itching|hives|swelling|blister|eczema|allerg|numbness|nausea|vomit|diarrhea|constipation|headache|cough|palpitation|skin sensitivity|sensitive skin|skin irritation|skin reaction|皮肤敏感|敏感肌|皮肤刺激|皮肤反应|泛红|干燥|脱皮|皮疹|红疹|红斑|红点|瘙痒|痒|荨麻疹|红肿|肿胀|水泡|湿疹|过敏|麻木|恶心|呕吐|腹泻|便秘|头痛|咳嗽)/i;

export function classifyAsk2Consumption({ question, body = {}, env = {} } = {}) {
  const q = String(question || '').trim();
  let health = planAskHealthBridge({ question: q }, env);
  if (!health.healthIntent && HEALTH_K1_SIGNAL.test(q)) {
    const safety = routeHealthSafety({ question: q });
    health = {
      schemaVersion: 'PHI-OS-ASK2-HEALTH-K1-DOMAIN-BRIDGE-v1.0.0',
      route: safety.careState === 'EMERGENCY' || safety.careState === 'URGENT_EVALUATION' ? 'HRX_SAFETY_FIRST' : 'HRX_GUIDED_CONTEXT',
      healthIntent: true,
      intent: 'HEALTH_REALITY',
      safety,
      authority: { liveHealthAuthorityConnected: env.PHIOS_HEALTH_AUTHORITY_ENABLED === '1', generalModelMaySubstituteForHealthAuthority: false },
      governance: { methodExecutionAllowed: false, diagnosisAllowed: false, treatmentPrescriptionAllowed: false, healthK1ConceptSignalUsed: true }
    };
  }
  if (health.healthIntent) return Object.freeze({ mode: 'HEALTH', reasonCode:'HEALTH_SAFETY_PRECEDENCE',health });
  const explicitRuntime=Boolean(body?.taxonomyHint||Object.keys(body?.runtimeInputs||{}).length||Object.keys(body?.runtimeResults||{}).length||body?.currentContextSnapshot);
  const atlasScope=body?.entryContext?.retrievalScope?.scopeType==='CIVILIZATION_ATLAS'||body?.entryContext?.bookCode==='BOOK-5';
  if(atlasScope)return Object.freeze({mode:'CKA',reasonCode:'STRUCTURED_ATLAS_KNOWLEDGE_SCOPE'});
  if(explicitRuntime)return Object.freeze({mode:'ASK2',reasonCode:'EXPLICIT_RUNTIME_INPUT'});
  if(EVERGREEN_KNOWLEDGE.test(q)||GENERAL_KNOWLEDGE_SIGNAL.test(q))return Object.freeze({mode:'CKA',reasonCode:'GENERAL_KNOWLEDGE_INTENT'});
  if(PERSONAL_ACTION_SIGNAL.test(q)||PERSONAL_RELATIONSHIP_SIGNAL.test(q))return Object.freeze({mode:'ASK2',reasonCode:'PERSONAL_CURRENT_ACTION_INTENT'});
  if(CURRENT_SIGNAL.test(q)&&Array.isArray(body?.currentExternalEvidence)&&body.currentExternalEvidence.length)return Object.freeze({mode:'ASK2',reasonCode:'CURRENT_AUTHORITY_EVIDENCE_PRESENT'});
  return Object.freeze({ mode: 'CKA',reasonCode:'DEFAULT_KNOWLEDGE_ROUTE' });
}


function deriveEphemeralCurrentContextSnapshot(body = {}) {
  if (body.currentContextSnapshot) return body.currentContextSnapshot;
  const fields = body.guidedContext && typeof body.guidedContext === 'object' ? body.guidedContext : {};
  const entries = Object.entries(fields).filter(([, value]) => String(value || '').trim());
  if (!entries.length) return null;
  return Object.freeze({
    schemaVersion: 'PHI-OS-CURRENT-CONTEXT-SNAPSHOT-v1.0.0',
    snapshotId: `ASK2-EPHEMERAL-${Date.now()}`,
    sourceType: 'ASK_GUIDED_CONTEXT_EPHEMERAL',
    canonicalReality: false,
    persisted: false,
    observedAt: new Date().toISOString(),
    fields: Object.freeze(Object.fromEntries(entries)),
    boundaries: Object.freeze({ userProvided: true, inferenceAllowed: false, silentPersistenceAllowed: false })
  });
}

export async function runAsk2Consumption({ body, env = {}, requestUrl, fetcher = fetch } = {}) {
  const question = String(body?.q || body?.question || '').trim();
  const classification = classifyAsk2Consumption({ question, body, env });
  if (classification.mode !== 'ASK2') return Object.freeze({ classification });
  const plan = buildAsk2OrchestrationPlan({
    question,
    taxonomyHint: body?.taxonomyHint || null,
    domain: body?.domain || 'GENERAL_CURRENT',
    publicRequest: body?.publicRequest !== false,
    internalAccessClass: body?.internalAccessClass || null,
    currentContextSnapshot: deriveEphemeralCurrentContextSnapshot(body),
    currentExternalEvidence: body?.currentExternalEvidence || [],
    externalCurrentRequired: body?.externalCurrentRequired ?? null
  });
  if (plan.orchestrationState !== 'READY_FOR_RUNTIME_EXECUTION') {
    return Object.freeze({ classification, plan, execution: null, composition: null, client: buildAsk2ClientProjection({ plan, locale: body?.locale }) });
  }
  const execution = await executeAsk2RuntimeRequests(plan, {
    runtimeInputs: body?.runtimeInputs || {},
    runtimeResults: body?.runtimeResults || {},
    requestUrl,
    fetcher
  });
  let composition = null;
  if (execution.executionState === 'EXECUTION_COMPLETE') {
    composition = composeAsk2BoundedState({ plan, runtimeResults: execution.governedResults.map(item => ({ ...item, requestId: item.requestId })) });
  }
  const client = buildAsk2ClientProjection({ plan, composition, execution, locale: body?.locale });
  return Object.freeze({ classification, plan, execution, composition, client });
}
