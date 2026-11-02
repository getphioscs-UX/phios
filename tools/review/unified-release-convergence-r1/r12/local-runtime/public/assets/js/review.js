import { initializeI18n, onLocaleChange, t } from './i18n.js';
import { initializeRuntimeWorkspace } from './modules/runtime-workspace.js';
import {
  MEMORY_KEY,
  REVIEW_KEY
} from './modules/runtime-workspace-state.js';
import {
  renderReviewVisualAlignment
} from './modules/review-visual-alignment.js';
import {
  SESSION,
  cleanText,
  escapeHTML,
  getSession,
  safeJSON,
  setSession
} from './shared.js';

const $ = id => document.getElementById(id);
const listText = value => cleanText(value)
  .split(/\n+/)
  .map(cleanText)
  .filter(Boolean);
const asArray = value => Array.isArray(value) ? value : [];
const navigation = () => safeJSON(getSession(SESSION.navigation), null);
const prepared = value => Boolean(
  value?.navigationState?.reviewGate?.preparedAt &&
  value?.navigation?.selectedPath?.id
);

function uniqueText(values, maximum = Infinity) {
  const output = [];
  const seen = new Set();
  for (const value of asArray(values)) {
    const text = cleanText(value?.statement || value?.summary || value);
    const key = text.toLocaleLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    output.push(text);
    if (output.length >= maximum) break;
  }
  return output;
}

function emptyReview(nav) {
  const path = nav.navigation.selectedPath;
  const professional = nav.navigationState?.professionalConsent || {};
  return {
    schemaVersion: 'phi-os.review.v1',
    createdAt: new Date().toISOString(),
    reviewId: `review_${crypto.randomUUID().slice(0, 8)}`,
    runtimeEntityId: cleanText(nav.runtimeEntityId),
    runtimeEntryId: cleanText(nav.runtimeEntryId),
    status: 'awaiting_customer_report',
    sourceNavigation: {
      schemaVersion: cleanText(nav.navigation?.schemaVersion),
      navigationInputCreatedAt: cleanText(nav.navigationInput?.createdAt),
      navigationStateVersion: cleanText(nav.navigationState?.schemaVersion),
      navigationPreparedAt: cleanText(nav.navigationState?.reviewGate?.preparedAt),
      selectedPathId: cleanText(path.id),
      selectedAt: cleanText(path.selectedAt),
      selectionSource: cleanText(path.selectionSource) || 'user_choice'
    },
    selectedPath: { ...path },
    professionalBoundary: {
      required: path.pathType === 'professional_review' ||
        path.requiresProfessionalReview === true,
      domainId: cleanText(path.professionalDomain || path.professionalBoundary?.domainId),
      domainName: cleanText(path.professionalBoundary?.domainName),
      consentRequired: path.pathType === 'professional_review',
      consentAccepted: professional.accepted === true,
      consentAcceptedAt: cleanText(professional.acceptedAt),
      sensitiveDataCollection: false,
      uploadEnabled: false,
      conclusionsProvided: false,
      unknownReality: uniqueText(path.professionalBoundary?.unknownReality, 12),
      excludedServices: uniqueText(path.professionalBoundary?.excludedServices, 12)
    },
    reviewScope: {
      observationWindow: cleanText(path.observationWindow),
      evidenceWatch: uniqueText(path.evidenceWatch || path.evidenceBasis, 12),
      completionSignals: uniqueText(path.completionSignals, 8),
      stopConditions: uniqueText(path.stopConditions, 8),
      reviewConditions: uniqueText(path.reviewConditions, 8),
      inheritedUnknownReality: uniqueText([
        ...asArray(path.unknownReality),
        ...asArray(nav.navigation?.unknownReality)
      ], 16)
    },
    customerReport: {
      pathStatus: 'not_started',
      startedAt: '',
      reviewedAt: '',
      observedChanges: [],
      noObservedChange: [],
      unexpectedReality: [],
      difficulties: [],
      customerNotes: '',
      evidenceClass: 'reported_experience'
    },
    runtimeDrift: {
      status: 'not_assessed',
      observations: [],
      interpretation: null,
      automaticDetection: false
    },
    reviewOutcome: {
      status: 'not_assessed',
      nextRuntimeState: null,
      reasons: [],
      userChoiceRequired: true,
      userSelected: false,
      automaticSelection:false
    },
    memoryHandoff: {
      ready: false,
      blockers: ['customer_report_required', 'review_outcome_required'],
      contractVersion: 'phi-os.review-memory-handoff.v1'
    },
    source: 'review_customer_workspace',
    guardrails: {
      rereadingAllowed: false,
      historicalEvidenceReinterpretationAllowed: false,
      readingOverwriteAllowed:false,
      navigationOverwriteAllowed: false,
      automaticOutcomeAllowed: false,
      customerReportAsFactAllowed: false,
      unknownRealityPreserved: true,
      unexpectedRealityPreserved: true,
      userChoiceRequired: true,
      professionalConsentPreserved: true
    }
  };
}

function currentReview(nav) {
  const stored = safeJSON(getSession(REVIEW_KEY), null);
  return stored?.runtimeEntryId === nav.runtimeEntryId
    ? stored
    : emptyReview(nav);
}

function fill(review) {
  $('reviewPathStatus').value = review.customerReport?.pathStatus || 'not_started';
  $('reviewObserved').value = asArray(review.customerReport?.observedChanges).join('\n');
  $('reviewNoChange').value = asArray(review.customerReport?.noObservedChange).join('\n');
  $('reviewUnexpected').value = asArray(review.customerReport?.unexpectedReality).join('\n');
  $('reviewDifficulties').value = asArray(review.customerReport?.difficulties).join('\n');
  $('reviewNotes').value = review.customerReport?.customerNotes || '';
  $('reviewOutcome').value = review.reviewOutcome?.nextRuntimeState || '';
  $('reviewOutcomeReason').value = asArray(review.reviewOutcome?.reasons).join('\n');
}

function renderList(id, values, fallbackKey) {
  const items = uniqueText(values);
  $(id).innerHTML = (items.length ? items : [t(fallbackKey)])
    .map(value => `<li>${escapeHTML(value)}</li>`)
    .join('');
}

function renderSummary(review) {
  const path = review.selectedPath || {};
  $('selectedPathTitle').textContent =
    path.title || path.label || t('review.notEstablished');
  $('selectedPathDirection').textContent =
    path.direction || path.description || t('review.notEstablished');
  $('selectedPathFirstStep').textContent =
    path.firstStep || path.nextStep || t('review.notEstablished');
  renderList('reviewEvidence', review.reviewScope?.evidenceWatch, 'review.notEstablished');
  renderList('reviewUnknown', review.reviewScope?.inheritedUnknownReality, 'review.noneRecorded');
  $('reviewStatus').textContent = t(
    `review.contractStatus.${review.status}`,
    {},
    review.status
  );
  renderMemoryStatus(review);
  renderReviewVisualAlignment(review);
}

function collect(review, { stamp = true } = {}) {
  const outcome = $('reviewOutcome').value;
  const observedChanges = listText($('reviewObserved').value);
  const noObservedChange = listText($('reviewNoChange').value);
  const unexpectedReality = listText($('reviewUnexpected').value);
  const difficulties = listText($('reviewDifficulties').value);
  const customerNotes = cleanText($('reviewNotes').value);
  const hasReport = [
    ...observedChanges,
    ...noObservedChange,
    ...unexpectedReality,
    ...difficulties,
    customerNotes
  ].some(Boolean);
  const existingStartedAt = cleanText(review.customerReport?.startedAt);
  const pathStatus = $('reviewPathStatus').value;
  const now = new Date().toISOString();

  const next = {
    ...review,
    status: hasReport ? 'customer_reported' : 'awaiting_customer_report',
    customerReport: {
      ...review.customerReport,
      pathStatus,
      startedAt:
        pathStatus !== 'not_started'
          ? existingStartedAt || (stamp ? now : '')
          : existingStartedAt,
      reviewedAt:
        hasReport
          ? stamp
            ? now
            : cleanText(review.customerReport?.reviewedAt)
          : '',
      observedChanges,
      noObservedChange,
      unexpectedReality,
      difficulties,
      customerNotes,
      evidenceClass: 'reported_experience'
    },
    reviewOutcome: {
      status: outcome ? 'assessed' : 'not_assessed',
      nextRuntimeState: outcome || null,
      reasons: listText($('reviewOutcomeReason').value),
      userChoiceRequired: true,
      userSelected: Boolean(outcome),
      automaticSelection:false
    }
  };

  next.memoryHandoff = {
    ready: Boolean(hasReport && outcome),
    blockers: [
      ...(!hasReport ? ['customer_report_required'] : []),
      ...(!outcome ? ['review_outcome_required'] : [])
    ],
    contractVersion: 'phi-os.review-memory-handoff.v1'
  };
  if (next.memoryHandoff.ready) next.status = 'ready_for_memory';
  return next;
}

function renderMemoryStatus(review) {
  const ready = review.memoryHandoff?.ready === true;
  $('memoryStatus').textContent = ready
    ? t('review.memoryReady')
    : t('review.memoryBlocked', {
        count: review.memoryHandoff?.blockers?.length || 0
      });
  $('prepareMemory').disabled = !ready;
  const memory = safeJSON(getSession(MEMORY_KEY), null);
  $('openMemory').classList.toggle(
    'hidden',
    memory?.reviewId !== review.reviewId
  );
}

function save(review) {
  setSession(REVIEW_KEY, review);
  renderSummary(review);
  return review;
}

function memoryItems(values, evidenceClass, source) {
  return uniqueText(values, 20).map(statement => ({
    statement,
    evidenceClass,
    source,
    verified:
      evidenceClass === 'verified_record' ||
      evidenceClass === 'professional_record'
  }));
}

function buildMemory(review) {
  const report = review.customerReport;
  const outcome = review.reviewOutcome;
  return {
    schemaVersion: 'phi-os.runtime-memory.v1',
    memoryId: `memory_${review.runtimeEntryId}_${review.reviewId}`
      .replace(/[^a-zA-Z0-9_-]+/g, '-'),
    createdAt: new Date().toISOString(),
    runtimeEntityId: review.runtimeEntityId,
    runtimeEntryId: review.runtimeEntryId,
    reviewId: review.reviewId,
    lineage: {
      previousRuntimeId: '',
      currentRuntimeId: review.runtimeEntryId,
      nextRuntimeId: null,
      sequence: null,
      continuityPrepared: false
    },
    sourceReview: {
      schemaVersion: review.schemaVersion,
      createdAt: review.createdAt,
      reviewedAt: report.reviewedAt,
      status: review.status,
      selectedPathId: review.selectedPath?.id || '',
      reviewOutcome: outcome.nextRuntimeState
    },
    selectedPath: {
      id: cleanText(review.selectedPath?.id),
      pathType: cleanText(review.selectedPath?.pathType),
      label: cleanText(review.selectedPath?.label || review.selectedPath?.title),
      direction: cleanText(review.selectedPath?.direction),
      boundary: cleanText(review.selectedPath?.boundary),
      firstStep: cleanText(review.selectedPath?.firstStep),
      observationWindow: cleanText(review.selectedPath?.observationWindow),
      requiresProfessionalReview:
        review.selectedPath?.requiresProfessionalReview === true
    },
    reportedMemory: {
      evidenceClass: 'reported_experience',
      pathStatus: report.pathStatus,
      startedAt: report.startedAt,
      reviewedAt: report.reviewedAt,
      observedChanges: memoryItems(
        report.observedChanges,
        'reported_experience',
        'review_customer_report'
      ),
      noObservedChange: memoryItems(
        report.noObservedChange,
        'reported_experience',
        'review_customer_report'
      ),
      unexpectedReality: memoryItems(
        report.unexpectedReality,
        'reported_experience',
        'review_customer_report'
      ),
      difficulties: memoryItems(
        report.difficulties,
        'reported_experience',
        'review_customer_report'
      ),
      customerNotes: report.customerNotes
    },
    evidenceMemory: {
      observedEvidence: memoryItems(
        review.observedEvidence,
        'observed_evidence',
        'review_evidence'
      ),
      verifiedRecords: memoryItems(
        review.verifiedRecords,
        'verified_record',
        'verified_record'
      ),
      professionalRecords: memoryItems(
        review.professionalRecords,
        'professional_record',
        'professional_record'
      )
    },
    interpretationMemory: {
      runtimeDriftStatus: cleanText(review.runtimeDrift?.status),
      observations: memoryItems(
        review.runtimeDrift?.observations,
        'system_interpretation',
        'review_runtime_drift'
      ),
      interpretation: cleanText(review.runtimeDrift?.interpretation),
      automaticDetection: review.runtimeDrift?.automaticDetection === true
    },
    unresolvedMemory: {
      evidenceClass: 'unknown_reality',
      inheritedUnknownReality: memoryItems(
        review.reviewScope?.inheritedUnknownReality,
        'unknown_reality',
        'review_inherited_unknown'
      ),
      unexpectedRealityPendingReview: memoryItems(
        report.unexpectedReality,
        'unknown_reality',
        'review_customer_report'
      )
    },
    outcomeMemory: {
      status: outcome.status,
      nextRuntimeState: outcome.nextRuntimeState,
      reasons: uniqueText(outcome.reasons, 12),
      selectedByUser: true,
      automaticSelection:false
    },
    professionalBoundary: {
      required: review.professionalBoundary?.required === true,
      domainId: cleanText(review.professionalBoundary?.domainId),
      consentAccepted: review.professionalBoundary?.consentAccepted === true,
      consentAcceptedAt: cleanText(review.professionalBoundary?.consentAcceptedAt),
      sensitiveDataCollection: false,
      conclusionsProvided: false,
      excludedServices: uniqueText(
        review.professionalBoundary?.excludedServices,
        12
      )
    },
    continuityHandoff: {
      ready: false,
      blockers: ['continuity_choice_required'],
      allowedNextRuntimeStates: [
        'continue_observation',
        'continue_selected_path',
        'return_to_reading',
        'choose_another_path',
        'start_new_entry',
        'professional_review',
        'remain_open'
      ],
      selectedNextRuntimeState: null,
      userChoiceRequired: true,
      automaticSelection:false,
      contractVersion: 'phi-os.memory-continuity-handoff.v1'
    },
    source: 'runtime_memory_customer_workspace',
    guardrails: {
      customerReportAsFactAllowed: false,
      unknownRealityAsFactAllowed: false,
      historicalContractOverwriteAllowed: false,
      automaticContinuityAllowed: false,
      automaticNextRuntimeCreationAllowed: false,
      professionalConclusionInferenceAllowed: false,
      sensitiveDataCollectionAllowed: false,
      userChoiceRequiredForNextRuntime: true,
      appendOnly: true
    }
  };
}

function bindDecisionShortcuts(onChange) {
  document.querySelectorAll('[data-review-outcome-shortcut]').forEach(button => {
    button.addEventListener('click', () => {
      $('reviewOutcome').value = button.dataset.reviewOutcomeShortcut || '';
      onChange();
      $('reviewOutcome').focus();
    });
  });
}

function boot() {
  initializeI18n();
  initializeRuntimeWorkspace({ currentStage: 'review' });
  const nav = navigation();
  if (!nav || !prepared(nav)) {
    $('reviewEmpty').classList.remove('hidden');
    return;
  }

  $('reviewWorkspace').classList.remove('hidden');
  let review = currentReview(nav);
  fill(review);
  renderSummary(review);

  const refreshDraft = () => renderSummary(collect(review, { stamp: false }));
  document.querySelectorAll(
    '#reviewWorkspace textarea, #reviewWorkspace select'
  ).forEach(input => {
    input.addEventListener('input', refreshDraft);
    input.addEventListener('change', refreshDraft);
  });
  bindDecisionShortcuts(refreshDraft);

  $('saveReview').addEventListener('click', () => {
    review = save(collect(review));
  });
  $('prepareMemory').addEventListener('click', () => {
    review = save(collect(review));
    if (!review.memoryHandoff.ready) return;
    setSession(MEMORY_KEY, buildMemory(review));
    $('memoryStatus').textContent = t('review.memoryPrepared');
    $('openMemory').classList.remove('hidden');
  });
  onLocaleChange(() => {
    initializeRuntimeWorkspace({ currentStage: 'review' });
    renderSummary(review);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
