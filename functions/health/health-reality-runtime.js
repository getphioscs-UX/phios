const CARE_RANK = Object.freeze({
  INFORMATIONAL: 0,
  ROUTINE_REVIEW: 1,
  PROMPT_MEDICAL_REVIEW: 2,
  URGENT_EVALUATION: 3,
  EMERGENCY: 4
});

const text = value => String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ');
const list = value => Array.isArray(value) ? value : [];

const EMERGENCY_PATTERNS = [
  /(?:sudden|severe).*chest pain.*(?:struggl|difficulty|can't|cannot).*breath/i,
  /(?:胸痛|胸口.*痛).*(?:呼吸困难|喘不过气|无法呼吸)/,
  /(?:face droop|arm weakness|speech difficulty)/i,
  /(?:脸歪|单侧无力|说话不清)/,
  /(?:severe bleeding|bleeding.*won't stop)/i,
  /(?:大量出血|止不住血)/
];

const URGENT_PATTERNS = [
  /(?:fainting|passed out|loss of consciousness)/i,
  /(?:昏厥|失去意识)/,
  /(?:new confusion|sudden confusion)/i,
  /(?:突然意识混乱|突然神志不清)/
];

const PROMPT_PATTERNS = [
  /(?:persistent|ongoing|for several (?:weeks|months)|getting worse)/i,
  /(?:持续|好几周|好几个月|越来越严重)/
];

export function classifyHealthIntent(input = {}) {
  const q = text(typeof input === 'string' ? input : input.question);
  const healthTerms = /\b(health|symptom|pain|tired|fatigue|sleep|heart|blood|lab|doctor|medication|medicine|diagnos|breath|dizzy|dizziness|fever|hba1c|a1c|glucose|cholesterol|ldl|hdl|triglyceride|hemoglobin|haemoglobin|creatinine|egfr|blood pressure|heart rate)\b|健康|症状|疼|痛|疲劳|累|睡眠|心跳|血压|血糖|糖化血红蛋白|胆固醇|化验|检查|医生|药|呼吸|头晕|发烧/i;
  if (!healthTerms.test(q)) return 'NON_HEALTH';
  if (/what does|what is|mean|reference range|是什么意思|什么是|参考范围/i.test(q)) return 'HEALTH_INFORMATION';
  if (/report|lab|test result|scan|报告|化验|检验|影像/i.test(q)) return 'HEALTH_DOCUMENT_UNDERSTANDING';
  if (/timeline|history|when it started|时间线|病程|什么时候开始/i.test(q)) return 'HEALTH_TIMELINE';
  if (EMERGENCY_PATTERNS.some(p => p.test(q)) || URGENT_PATTERNS.some(p => p.test(q)) || /what should i do|怎么办|要不要去急诊/i.test(q)) return 'HEALTH_CARE_NAVIGATION';
  return 'HEALTH_REALITY';
}

export function routeHealthSafety(input = {}) {
  const q = text(typeof input === 'string' ? input : input.question);
  let careState = 'INFORMATIONAL';
  const matchedSignals = [];
  const promote = (state, signal) => {
    if (CARE_RANK[state] > CARE_RANK[careState]) careState = state;
    if (signal) matchedSignals.push(signal);
  };
  if (EMERGENCY_PATTERNS.some(p => p.test(q))) promote('EMERGENCY', 'HIGH_RISK_EMERGENCY_PATTERN');
  else if (URGENT_PATTERNS.some(p => p.test(q))) promote('URGENT_EVALUATION', 'URGENT_PATTERN');
  else if (PROMPT_PATTERNS.some(p => p.test(q))) promote('PROMPT_MEDICAL_REVIEW', 'PERSISTENT_OR_WORSENING_PATTERN');
  else if (classifyHealthIntent({ question: q }) !== 'NON_HEALTH') promote('ROUTINE_REVIEW', 'HEALTH_CONCERN_PRESENT');
  return {
    schemaVersion: 'PHI-OS-HRX-SAFETY-ROUTING-v1.0.0',
    careState,
    matchedSignals,
    safetyRoutingOnly: true,
    diagnosisEstablished: false,
    diseaseRuledOut: false,
    exhaustiveTriageClaimed: false
  };
}

export function normalizeHealthEvidence(record = {}, index = 0) {
  const sourceClass = text(record.sourceClass || 'USER_REPORTED').toUpperCase();
  const allowed = new Set(['USER_REPORTED','HOME_MEASURED','DEVICE_MEASURED','LAB_MEASURED','CLINICIAN_REPORTED','DOCUMENT_EXTRACTED','INFERRED']);
  if (!allowed.has(sourceClass)) throw new Error('HRX_EVIDENCE_SOURCE_CLASS_INVALID');
  return {
    evidenceId: text(record.evidenceId || `HRX-EVIDENCE-${String(index + 1).padStart(3, '0')}`),
    sourceClass,
    observedAt: record.observedAt || null,
    value: record.value ?? record.text ?? null,
    unit: record.unit || null,
    provenance: record.provenance || (sourceClass === 'USER_REPORTED' ? 'USER_INPUT' : null),
    establishesCausality: false,
    establishesDiagnosis: sourceClass === 'CLINICIAN_REPORTED' && record.confirmedDiagnosis === true
  };
}

export function buildHealthReality(input = {}) {
  const caseRef = text(input.caseRef);
  if (!caseRef) throw new Error('HRX_CASE_REF_REQUIRED');
  const question = text(input.question);
  const safety = routeHealthSafety({ question });
  const evidence = [
    ...list(input.evidence),
    ...list(input.observations).map(item => ({ ...item, sourceClass: item.sourceClass || 'USER_REPORTED' })),
    ...list(input.measurements).map(item => ({ ...item, sourceClass: item.sourceClass || 'HOME_MEASURED' }))
  ].map(normalizeHealthEvidence);
  return {
    schemaVersion: 'PHI-OS-HEALTH-REALITY-v1.0.0',
    caseRef,
    intent: classifyHealthIntent({ question }),
    concerns: list(input.concerns).map(text).filter(Boolean),
    symptoms: list(input.symptoms),
    observations: list(input.observations),
    measurements: list(input.measurements),
    timeline: list(input.timeline),
    knownDiagnoses: list(input.knownDiagnoses),
    medications: list(input.medications),
    allergies: list(input.allergies),
    investigations: list(input.investigations),
    clinicianFindings: list(input.clinicianFindings),
    lifestyleContext: list(input.lifestyleContext),
    recentChanges: list(input.recentChanges),
    evidence,
    warningSignals: safety.matchedSignals.map(code => ({ code, source: 'SAFETY_ROUTER' })),
    unknowns: list(input.unknowns).map(text).filter(Boolean),
    contradictions: list(input.contradictions).map(text).filter(Boolean),
    careState: safety.careState,
    nextReview: input.nextReview || null,
    governance: {
      diagnosisEstablished: false,
      treatmentPrescribed: false,
      symbolicMethodUsedAsHealthAuthority: false,
      liveHealthAuthorityConnected: false,
      productionExecutionAllowed: false
    }
  };
}

export function assertSymbolicHealthFirewall({ methodCode, requestedUse }) {
  const blockedMethods = new Set(['AST','BZR','NUM','HDR','ICH','TAR','ZWR']);
  const blockedUses = new Set(['DIAGNOSIS','DISEASE_RISK_ESTIMATION','ILLNESS_PREDICTION','FERTILITY_DETERMINATION','LIFESPAN_ESTIMATION','MEDICATION_DECISION','EMERGENCY_TRIAGE_OVERRIDE']);
  if (blockedMethods.has(text(methodCode).toUpperCase()) && blockedUses.has(text(requestedUse).toUpperCase())) {
    throw new Error('HRX_SYMBOLIC_HEALTH_AUTHORITY_FORBIDDEN');
  }
  return { allowed: true, healthEvidenceCreated: false, healthAuthorityCreated: false };
}

export function composeHealthProfessionalHandoff(reality = {}) {
  if (reality?.schemaVersion !== 'PHI-OS-HEALTH-REALITY-v1.0.0') throw new Error('HRX_REALITY_REQUIRED');
  return {
    schemaVersion: 'PHI-OS-HRX-PROFESSIONAL-HANDOFF-v1.0.0',
    caseRef: reality.caseRef,
    primaryConcerns: reality.concerns || [],
    timeline: reality.timeline || [],
    symptoms: reality.symptoms || [],
    measurements: reality.measurements || [],
    medications: reality.medications || [],
    investigations: reality.investigations || [],
    recentChanges: reality.recentChanges || [],
    warningSignals: reality.warningSignals || [],
    unknowns: reality.unknowns || [],
    questionsForClinician: (reality.unknowns || []).map(value => `Clarify: ${value}`),
    governance: {
      createsDiagnosis: false,
      createsTreatmentPlan: false,
      createsProfessionalJudgment: false,
      preservesEvidenceSource: true
    }
  };
}
