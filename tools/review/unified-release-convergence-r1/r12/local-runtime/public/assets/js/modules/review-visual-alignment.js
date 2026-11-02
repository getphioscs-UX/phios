/*
 * PHI OS M3C-W7 Review Visual Alignment
 * Renders customer-facing Review status from the current Review object.
 */

import { buildReviewCustomerProjection } from './review-customer-projection.js';
import { cleanText, qs } from '../shared.js';
import { t } from '../i18n.js';

function setText(id, value) {
  const element = qs(`#${id}`);
  if (element) element.textContent = cleanText(value);
}

export function renderReviewVisualAlignment(review) {
  const projection = buildReviewCustomerProjection(review);

  setText(
    'reviewSummaryPath',
    projection.summary.pathLabel || t('review.notEstablished')
  );
  setText(
    'reviewSummaryStatus',
    t(
      `review.pathStatus.${projection.summary.pathStatus}`,
      {},
      projection.summary.pathStatus
    )
  );
  setText(
    'reviewChangeCount',
    t('review.visual.changeCount', {
      count: projection.changeSinceReading.observedCount
    })
  );
  setText(
    'reviewUnexpectedCount',
    t('review.visual.unexpectedCount', {
      count: projection.changeSinceReading.unexpectedCount
    })
  );
  setText(
    'reviewActionStatus',
    t(
      `review.pathStatus.${projection.actionResult.pathStatus}`,
      {},
      projection.actionResult.pathStatus
    )
  );
  setText(
    'reviewDecisionStatus',
    projection.decision.nextRuntimeState
      ? t(
          `memory.outcome.${projection.decision.nextRuntimeState}`,
          {},
          projection.decision.nextRuntimeState
        )
      : t('review.outcomePending')
  );

  document.querySelectorAll('[data-review-decision-group]').forEach(button => {
    const selected = button.dataset.reviewDecisionGroup === projection.decision.group;
    button.setAttribute('aria-pressed', selected ? 'true' : 'false');
  });

  document.documentElement.dataset.reviewDecision =
    projection.decision.group;

  return projection;
}

