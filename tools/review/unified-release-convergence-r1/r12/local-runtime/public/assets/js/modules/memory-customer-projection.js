/*
 * PHI OS M3C-W8 Memory Customer Projection
 * Pure, read-only description of what the Runtime Memory contains.
 */

const asArray = value => Array.isArray(value) ? value : [];
const asText = value => typeof value === 'string' ? value.trim() : '';

function itemText(value) {
  if (typeof value === 'string') return asText(value);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '';
  return asText(value.statement || value.summary || value.text || '');
}

function items(values) {
  return asArray(values).map(itemText).filter(Boolean);
}

export function buildMemoryCustomerProjection(memory = {}) {
  const reported = memory.reportedMemory || {};
  const evidence = memory.evidenceMemory || {};
  const interpretation = memory.interpretationMemory || {};
  const unresolved = memory.unresolvedMemory || {};
  const outcome = memory.outcomeMemory || {};

  const savedGroups = {
    observedChanges: items(reported.observedChanges),
    unchangedConditions: items(reported.noObservedChange),
    unexpectedReality: items(reported.unexpectedReality),
    difficulties: items(reported.difficulties),
    observedEvidence: items(evidence.observedEvidence),
    verifiedRecords: items(evidence.verifiedRecords),
    professionalRecords: items(evidence.professionalRecords),
    interpretation: [
      ...items(interpretation.observations),
      asText(interpretation.interpretation)
    ].filter(Boolean),
    unresolvedReality: [
      ...items(unresolved.inheritedUnknownReality),
      ...items(unresolved.unexpectedRealityPendingReview)
    ]
  };

  const savedItemCount = Object.values(savedGroups)
    .reduce((total, group) => total + group.length, 0) +
    (asText(reported.customerNotes) ? 1 : 0);

  return {
    summary: {
      memoryId: asText(memory.memoryId),
      runtimeEntryId: asText(memory.runtimeEntryId),
      selectedPath: asText(memory.selectedPath?.label || memory.selectedPath?.title),
      nextRuntimeState: asText(outcome.nextRuntimeState),
      createdAt: asText(memory.createdAt),
      savedItemCount
    },
    savedGroups,
    savedNotes: asText(reported.customerNotes),
    classifications: {
      reportedExperienceVerified: false,
      unresolvedRealityVerified: false,
      observedEvidenceVerified: false,
      verifiedRecordsVerified: true,
      professionalRecordsVerified: true
    },
    actions: {
      browserExportAvailable: Boolean(asText(memory.memoryId)),
      browserDeletionAvailable: Boolean(asText(memory.memoryId)),
      remoteDeletionAvailable: false,
      explicitUserActionRequired: true
    },
    guardrails: {
      readOnlyProjection: true,
      memoryMutationAllowed: false,
      evidenceReclassificationAllowed: false,
      historicalOverwriteAllowed: false,
      remoteDeletionClaimAllowed: false
    }
  };
}

