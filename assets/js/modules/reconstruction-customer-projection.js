/*
 * PHI OS M3C-W4 Reconstruction Customer Projection
 * Pure, read-only presentation model. It does not access storage, call APIs,
 * mutate Runtime data or decide Reading readiness.
 */

const asArray = value => Array.isArray(value) ? value : [];

const asText = value => typeof value === 'string' ? value.trim() : '';

function itemText(value) {
  if (typeof value === 'string') return asText(value);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '';

  return asText(
    value.statement ||
    value.question ||
    value.summary ||
    value.evidenceNeed ||
    value.sourceText ||
    value.source ||
    value.label ||
    ''
  );
}

function uniqueValues(values) {
  const seen = new Set();

  return values.filter(value => {
    const key = JSON.stringify(value).toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function clamp(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, number));
}

function averageConfidence(states) {
  const values = asArray(states)
    .map(state => Number(state?.confidence))
    .filter(Number.isFinite)
    .map(clamp);

  if (!values.length) return 0;

  return Number(
    (
      values.reduce((sum, value) => sum + value, 0) /
      values.length
    ).toFixed(2)
  );
}

function normalizeBoundary(reconstruction = {}, runtimeEntry = {}) {
  const boundary = reconstruction.evidenceBoundary || {};
  const legacy = reconstruction.evidence || {};

  return {
    observed: asArray(boundary.observedEvidence).length
      ? asArray(boundary.observedEvidence)
      : asArray(legacy.knownReality).length
        ? asArray(legacy.knownReality)
        : asArray(runtimeEntry.knownReality),
    reported: asArray(boundary.reportedExperience).length
      ? asArray(boundary.reportedExperience)
      : asArray(legacy.reportedExperience),
    unknown: asArray(boundary.unknownReality).length
      ? asArray(boundary.unknownReality)
      : asArray(legacy.unknownReality).length
        ? asArray(legacy.unknownReality)
        : asArray(runtimeEntry.unknownReality)
  };
}

function hasAnswer(runtimeEntry, target) {
  return asArray(runtimeEntry?.reconstructionEvidence).some(
    answer =>
      asText(answer?.target) === target &&
      Boolean(itemText(answer))
  );
}

function missingEvidenceItems(reconstruction, boundary) {
  const unknownItems = asArray(boundary.unknown)
    .map(itemText)
    .filter(Boolean)
    .map(text => ({ kind: 'unknown', text }));

  const targetItems = asArray(reconstruction?.inquiry?.remainingTargets)
    .map(asText)
    .filter(target => target && target !== 'none')
    .map(target => ({ kind: 'target', target }));

  return uniqueValues([...unknownItems, ...targetItems]);
}

export function buildReconstructionCustomerProjection(result = {}) {
  const reconstruction = result.reconstruction || {};
  const runtimeEntry = result.runtimeEntry || {};
  const boundary = normalizeBoundary(reconstruction, runtimeEntry);
  const missingEvidence = missingEvidenceItems(reconstruction, boundary);
  const sourceCodes = ['runtimeEntry'];

  if (asArray(runtimeEntry.reconstructionEvidence).length) {
    sourceCodes.push('reconstructionAnswers');
  }
  if (boundary.observed.length) {
    sourceCodes.push('observedEvidence');
  }

  const changeAvailable = Boolean(
    asText(runtimeEntry?.realityChange?.normalizedStatement) ||
    asText(runtimeEntry?.realityChange?.rawStatement)
  );
  const processConfidence = averageConfidence(reconstruction.grammarStates);
  const conditionsReported =
    hasAnswer(runtimeEntry, 'runtime_conditions') ||
    asArray(runtimeEntry?.initialContext?.relevantConditions).length > 0;

  return {
    summary: {
      sourceCodes: uniqueValues(sourceCodes),
      structuralConfidence: clamp(reconstruction.maturityScore),
      missingCount: missingEvidence.length
    },
    cards: {
      change: {
        sourceCode: 'runtimeEntry',
        confidenceCode: changeAvailable ? 'reported' : 'notEstablished'
      },
      process: {
        sourceCode: 'ruleReconstruction',
        confidenceCode: processConfidence > 0 ? 'provisional' : 'notEstablished',
        confidence: processConfidence
      },
      conditions: {
        sourceCode: conditionsReported
          ? 'reconstructionAnswers'
          : 'runtimeEntry',
        confidenceCode: conditionsReported ? 'reported' : 'notEstablished'
      },
      confirmed: {
        sourceCode: 'observedEvidence',
        confidenceCode: boundary.observed.length
          ? 'evidenceSupported'
          : 'notEstablished'
      },
      unclear: {
        sourceCode: 'unknownReality',
        confidenceCode: missingEvidence.length
          ? 'unresolved'
          : 'notEstablished'
      }
    },
    missingEvidence,
    guardrails: {
      readOnlyProjection: true,
      runtimeMutationAllowed: false,
      confidenceRepresentsFactProbability: false,
      historicalOverwriteAllowed: false
    }
  };
}
