/*
 * PHI OS M3C-W6 Navigation Visual Alignment
 * Renders the six customer views without changing Navigation state.
 */

import {
  buildNavigationCustomerProjection
} from './navigation-customer-projection.js';

import {
  cleanText,
  escapeHTML,
  qs
} from '../shared.js';

import { t } from '../i18n.js';

function setText(id, value) {
  const element = qs(`#${id}`);
  if (element) element.textContent = cleanText(value);
}

function renderList(id, values, fallbackKey) {
  const element = qs(`#${id}`);
  if (!element) return;

  element.innerHTML = values.length
    ? values.map(value => `<li>${escapeHTML(value)}</li>`).join('')
    : `<li>${escapeHTML(t(fallbackKey))}</li>`;
}

export function renderNavigationVisualAlignment(response) {
  const projection = buildNavigationCustomerProjection(response);

  setText(
    'navigationDirectionStatus',
    t('navigation.visual.pathCount', {
      count: projection.availableDirection.pathCount
    })
  );
  setText(
    'navigationChoiceBoundary',
    projection.availableDirection.selectedPathId
      ? t('navigation.visual.userSelected')
      : t('navigation.visual.userChoiceRequired')
  );

  setText(
    'navigationReason',
    projection.reason.text || t('navigation.notEstablished')
  );
  setText(
    'navigationReasonSource',
    projection.reason.sourceCode === 'selectedPath'
      ? t('navigation.visual.selectedPathSource')
      : t('navigation.visual.currentReadingSource')
  );

  setText(
    'navigationFirstAction',
    projection.firstAction.established
      ? projection.firstAction.text
      : t('navigation.visual.selectBeforeAction')
  );
  setText(
    'navigationFirstActionStatus',
    projection.firstAction.established
      ? t('navigation.visual.actionEstablished')
      : t('navigation.visual.actionPending')
  );

  renderList(
    'navigationReviewConditions',
    projection.reviewPoint.items,
    'navigation.visual.noReviewPoint'
  );

  document.documentElement.dataset.navigationCustomerSelection =
    projection.firstAction.established ? 'selected' : 'awaiting-choice';

  return projection;
}
