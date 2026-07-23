/*
 * PHI OS M3C-W4 Reconstruction Visual Alignment
 * Renders customer-facing source, confidence and missing-evidence metadata.
 */

import {
  buildReconstructionCustomerProjection
} from './reconstruction-customer-projection.js';

import {
  cleanText,
  escapeHTML,
  qs
} from '../shared.js';

import { t } from '../i18n.js';

const CARD_IDS = Object.freeze({
  change: ['customerChangeSource', 'customerChangeConfidence'],
  process: ['customerProcessSource', 'customerProcessConfidence'],
  conditions: ['customerConditionsSource', 'customerConditionsConfidence'],
  confirmed: ['customerConfirmedSource', 'customerConfirmedConfidence'],
  unclear: ['customerUnclearSource', 'customerUnclearConfidence']
});

function setText(id, value) {
  const element = qs(`#${id}`);
  if (element) element.textContent = cleanText(value);
}

function percent(value) {
  const number = Number(value);
  const normalized = Number.isFinite(number)
    ? Math.max(0, Math.min(1, number))
    : 0;
  return `${Math.round(normalized * 100)}%`;
}

function sourceLabel(code) {
  return t(
    `reconstruction.evidenceSources.${code}`,
    {},
    cleanText(code)
  );
}

function confidenceLabel(card) {
  const state = t(
    `reconstruction.confidenceStates.${card.confidenceCode}`,
    {},
    cleanText(card.confidenceCode)
  );

  return Number.isFinite(card.confidence) && card.confidence > 0
    ? `${state} · ${percent(card.confidence)}`
    : state;
}

function renderMissingEvidence(items) {
  const list = qs('#customerMissingEvidence');
  if (!list) return;

  if (!items.length) {
    list.innerHTML = `
      <li class="is-complete">
        ${escapeHTML(t('reconstruction.noMissingEvidence'))}
      </li>
    `;
    return;
  }

  list.innerHTML = items.map(item => {
    const label = item.kind === 'target'
      ? t(
          `reconstruction.inquiryTargets.${item.target}`,
          {},
          cleanText(item.target).replaceAll('_', ' ')
        )
      : cleanText(item.text);

    return `
      <li>
        <span aria-hidden="true">○</span>
        <span>${escapeHTML(label)}</span>
      </li>
    `;
  }).join('');
}

export function renderReconstructionVisualAlignment(result) {
  const projection = buildReconstructionCustomerProjection(result);
  const summary = qs('#reconstructionEvidenceSummary');

  summary?.classList.remove('hidden');
  summary?.setAttribute('aria-busy', 'false');

  setText(
    'reconstructionEvidenceSource',
    projection.summary.sourceCodes.map(sourceLabel).join(' · ')
  );
  setText(
    'reconstructionConfidence',
    percent(projection.summary.structuralConfidence)
  );
  setText(
    'reconstructionMissingCount',
    t('reconstruction.missingCount', {
      count: projection.summary.missingCount
    })
  );
  setText(
    'customerMissingCount',
    t('reconstruction.missingCount', {
      count: projection.summary.missingCount
    })
  );

  Object.entries(CARD_IDS).forEach(([cardName, ids]) => {
    const card = projection.cards[cardName];
    setText(ids[0], sourceLabel(card.sourceCode));
    setText(ids[1], confidenceLabel(card));
  });

  renderMissingEvidence(projection.missingEvidence);

  return projection;
}
