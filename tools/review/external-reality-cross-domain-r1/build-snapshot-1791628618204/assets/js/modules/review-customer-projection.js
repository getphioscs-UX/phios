/*
 * PHI OS M3C-W7 Review Customer Projection
 * Pure presentation model for the completed Navigation path and the
 * customer's report. It does not write storage or select a Review outcome.
 */

const asArray = value => Array.isArray(value) ? value : [];
const asText = value => typeof value === 'string' ? value.trim() : '';

function textList(values) {
  return asArray(values).map(value => {
    if (typeof value === 'string') return asText(value);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return '';
    return asText(value.statement || value.summary || value.label || '');
  }).filter(Boolean);
}

function decisionGroup(nextRuntimeState) {
  if (['continue_observation', 'continue_selected_path'].includes(nextRuntimeState)) {
    return 'continue';
  }
  if ([
    'return_to_reading',
    'choose_another_path',
    'start_new_entry',
    'professional_review'
  ].includes(nextRuntimeState)) {
    return 'revise';
  }
  if (nextRuntimeState === 'remain_open') return 'close';
  return 'pending';
}

export function buildReviewCustomerProjection(review = {}) {
  const report = review.customerReport || {};
  const outcome = review.reviewOutcome || {};
  const path = review.selectedPath || {};
  const observed = textList(report.observedChanges);
  const unchanged = textList(report.noObservedChange);
  const unexpected = textList(report.unexpectedReality);
  const difficulties = textList(report.difficulties);
  const nextRuntimeState = asText(outcome.nextRuntimeState);

  return {
    summary: {
      pathLabel: asText(path.label || path.title),
      pathStatus: asText(report.pathStatus) || 'not_started',
      reviewStatus: asText(review.status) || 'awaiting_customer_report',
      reportReady: Boolean(asText(report.reviewedAt)),
      memoryReady: review.memoryHandoff?.ready === true
    },
    changeSinceReading: {
      observed,
      unchanged,
      unexpected,
      observedCount: observed.length,
      unchangedCount: unchanged.length,
      unexpectedCount: unexpected.length
    },
    actionResult: {
      pathStatus: asText(report.pathStatus) || 'not_started',
      difficulties,
      difficultyCount: difficulties.length,
      notesRecorded: Boolean(asText(report.customerNotes))
    },
    decision: {
      nextRuntimeState,
      group: decisionGroup(nextRuntimeState),
      reasonCount: textList(outcome.reasons).length,
      selectedByUser: outcome.userSelected === true,
      automaticSelection: false
    },
    guardrails: {
      readOnlyProjection: true,
      reviewMutationAllowed: false,
      outcomeSelectionAllowed: false,
      readingOverwriteAllowed: false,
      navigationOverwriteAllowed: false,
      customerReportAsFactAllowed: false
    }
  };
}

