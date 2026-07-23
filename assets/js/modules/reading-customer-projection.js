/*
 * PHI OS M3C-W5 Reading Customer Projection
 * Pure, read-only presentation model. It does not access storage, call an API,
 * mutate Reading data or decide whether Navigation may begin.
 */

const asArray = value => Array.isArray(value) ? value : [];

const asText = value => typeof value === 'string' ? value.trim() : '';

function itemText(value) {
  if (typeof value === 'string') return asText(value);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '';

  return asText(
    value.statement ||
    value.summary ||
    value.label ||
    value.name ||
    ''
  );
}

function clamp(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, number));
}

function countItems(values) {
  return asArray(values).map(itemText).filter(Boolean).length;
}

function countAuditSources(audit = {}) {
  const values = Object.values(audit).filter(value =>
    typeof value === 'number' && Number.isFinite(value)
  );

  return values.reduce((total, value) => total + Math.max(0, value), 0);
}

export function buildReadingCustomerProjection(response = {}) {
  const reading = response.reading || {};
  const boundary = reading.evidenceBoundary || {};
  const integrated = reading.integratedReading || {};
  const pattern = integrated.primaryPattern || {};
  const alternative = integrated.alternativeReading || {};
  const readiness = reading.navigationReadiness || {};
  const evidenceTrail = asArray(integrated.evidenceTrail);
  const unknownCount = countItems(
    integrated.unknownReality || boundary.unknownReality
  );
  const limitationCount = countItems(integrated.risks);
  const auditCount = countAuditSources(reading.evidenceAudit);

  return {
    observedReality: {
      sourceCode: 'observedEvidence',
      itemCount: countItems(
        integrated.observedEvidence || boundary.observedEvidence
      )
    },
    runtimePattern: {
      sourceCode: 'ruleReading',
      established: pattern.established === true,
      confidence: clamp(pattern.confidence),
      classification: asText(pattern.classification)
    },
    evidence: {
      sourceCode: 'evidenceTrail',
      trailCount: evidenceTrail.length,
      auditedItemCount: auditCount
    },
    interpretation: {
      sourceCode: 'boundedInterpretation',
      alternativeAvailable: Boolean(asText(alternative.summary)),
      confidence: clamp(alternative.confidence)
    },
    boundary: {
      sourceCode: 'readingBoundary',
      unknownCount,
      limitationCount,
      evidenceWatchCount: countItems(integrated.evidenceWatch),
      navigationReady: readiness.ready === true,
      blockers: asArray(readiness.blockers).map(asText).filter(Boolean)
    },
    guardrails: {
      readOnlyProjection: true,
      runtimeMutationAllowed: false,
      evidenceReclassificationAllowed: false,
      navigationReadinessOwned: false,
      confidenceRepresentsFactProbability: false
    }
  };
}
