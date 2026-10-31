/*
 * PHI OS M3C-W5 Reading Visual Alignment
 * Renders customer-facing status metadata from the frozen Reading result.
 */

import {
  buildReadingCustomerProjection
} from './reading-customer-projection.js';

import {
  cleanText,
  qs
} from '../shared.js';

import { t } from '../i18n.js';

function setText(id, value) {
  const element = qs(`#${id}`);
  if (element) element.textContent = cleanText(value);
}

function percent(value) {
  const normalized = Math.max(0, Math.min(1, Number(value) || 0));
  return `${Math.round(normalized * 100)}%`;
}

function sourceLabel(code) {
  return t(`reading.visual.sources.${code}`, {}, cleanText(code));
}

export function renderReadingVisualAlignment(response) {
  const projection = buildReadingCustomerProjection(response);

  setText(
    'readingObservedStatus',
    t('reading.visual.itemCount', {
      count: projection.observedReality.itemCount
    })
  );
  setText(
    'readingObservedSource',
    sourceLabel(projection.observedReality.sourceCode)
  );

  setText(
    'readingPatternStatus',
    projection.runtimePattern.established
      ? t('reading.visual.patternEstablished')
      : t('reading.visual.patternProvisional')
  );
  setText(
    'readingPatternConfidence',
    t('reading.visual.structuralConfidence', {
      confidence: percent(projection.runtimePattern.confidence)
    })
  );

  setText(
    'readingEvidenceStatus',
    t('reading.visual.evidenceCount', {
      count: projection.evidence.trailCount
    })
  );
  setText(
    'readingEvidenceSource',
    sourceLabel(projection.evidence.sourceCode)
  );

  setText(
    'readingInterpretationStatus',
    projection.interpretation.alternativeAvailable
      ? t('reading.visual.alternativeVisible')
      : t('reading.visual.noAlternative')
  );
  setText(
    'readingInterpretationSource',
    sourceLabel(projection.interpretation.sourceCode)
  );

  setText(
    'readingBoundaryStatus',
    t('reading.visual.boundaryCount', {
      count: projection.boundary.unknownCount +
        projection.boundary.limitationCount
    })
  );
  setText(
    'readingBoundaryDecision',
    projection.boundary.navigationReady
      ? t('reading.visual.navigationReady')
      : t('reading.visual.navigationBlocked')
  );

  document.documentElement.dataset.readingNavigationReady =
    projection.boundary.navigationReady ? 'true' : 'false';

  return projection;
}
