/*
 * PHI OS Reality Navigation Renderer
 * File: assets/js/modules/navigation-render.js
 * Version: 1.0.0
 *
 * Renders the canonical Navigation Contract without changing Evidence,
 * selecting a path, calling an API, or writing session state.
 */

import {
  qs,
  cleanText,
  escapeHTML
} from '../shared.js';

import { t } from '../i18n.js';

function isObject(value) {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value);
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function fallback(key = 'navigation.notEstablished') {
  return t(key, {}, 'Not established');
}

function setText(
  selector,
  value,
  fallbackKey = 'navigation.notEstablished'
) {
  const element = qs(selector);

  if (!element) return;

  element.textContent = cleanText(value) || fallback(fallbackKey);
}

function renderList(
  selector,
  values,
  fallbackKey = 'navigation.emptyList'
) {
  const element = qs(selector);

  if (!element) return;

  const items = list(values)
    .map(cleanText)
    .filter(Boolean);

  element.innerHTML = items.length > 0
    ? items
        .map(item => `<li>${escapeHTML(item)}</li>`)
        .join('')
    : `<li>${escapeHTML(fallback(fallbackKey))}</li>`;
}

function primaryRegionText(region) {
  if (!isObject(region)) return '';

  const id = cleanText(region.id || region.code);
  const label = cleanText(region.label || region.name);

  return [id, label].filter(Boolean).join(' ');
}

function priorityValues(navigation, currentPosition, legacy) {
  const candidate =
    currentPosition.priority ||
    navigation.priority ||
    legacy.priority;

  if (isObject(candidate)) {
    return {
      focus: cleanText(candidate.focus),
      reason: cleanText(candidate.reason),
      level: cleanText(candidate.priorityLevel)
    };
  }

  return {
    focus: cleanText(candidate),
    reason: '',
    level: ''
  };
}

function availablePaths(navigation) {
  return list(
    navigation.availablePaths ||
    navigation.boundedNavigationPaths ||
    navigation.boundedPath
  );
}

function renderPaths(paths, recommendedPathId = '', selectedPathId = '') {
  const container = qs('#navigationPath');

  if (!container) return;

  const normalized = list(paths);

  if (normalized.length === 0) {
    container.innerHTML = `<p class="navigation-path-empty">${escapeHTML(
      t('navigation.noNavigation')
    )}</p>`;
    return;
  }

  container.innerHTML = normalized
    .map((path, index) => {
      const id = cleanText(path?.id);
      const title = cleanText(path?.title || path?.label) ||
        t('navigation.pathFallback');
      const direction = cleanText(path?.direction);
      const boundary = cleanText(path?.boundary);
      const description = cleanText(path?.description || path?.rationale);
      const suitableWhen = list(path?.suitableWhen).map(cleanText).filter(Boolean);
      const reviewConditions = list(path?.reviewConditions).map(cleanText).filter(Boolean);
      const firstStep = cleanText(path?.firstStep || path?.nextStep);
      const evidenceWatch = list(path?.evidenceWatch || path?.evidenceBasis)
        .map(cleanText).filter(Boolean);
      const requiresProfessionalReview =
        path?.requiresProfessionalReview === true ||
        cleanText(path?.pathType) === 'professional_review';
      const actionSteps = list(path?.actionSteps).map(cleanText).filter(Boolean);
      const observationWindow = cleanText(path?.observationWindow);
      const stopConditions = list(path?.stopConditions).map(cleanText).filter(Boolean);
      const completionSignals = list(path?.completionSignals).map(cleanText).filter(Boolean);
      const recommended = id === cleanText(recommendedPathId);
      const selected = id === cleanText(selectedPathId);

      const detailBlocks = [
        evidenceWatch.length > 0 ? `
          <div>
            <span>${escapeHTML(t('navigation.evidenceWatch'))}</span>
            <ul>${evidenceWatch.map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul>
          </div>` : '',
        actionSteps.length > 0 ? `
          <div>
            <span>${escapeHTML(t('navigation.actionSteps'))}</span>
            <ol>${actionSteps.map(step => `<li>${escapeHTML(step)}</li>`).join('')}</ol>
          </div>` : '',
        observationWindow ? `
          <div>
            <span>${escapeHTML(t('navigation.observationWindow'))}</span>
            <p>${escapeHTML(observationWindow)}</p>
          </div>` : '',
        completionSignals.length > 0 ? `
          <div>
            <span>${escapeHTML(t('navigation.completionSignals'))}</span>
            <ul>${completionSignals.map(signal => `<li>${escapeHTML(signal)}</li>`).join('')}</ul>
          </div>` : '',
        stopConditions.length > 0 ? `
          <div>
            <span>${escapeHTML(t('navigation.stopConditions'))}</span>
            <ul>${stopConditions.map(condition => `<li>${escapeHTML(condition)}</li>`).join('')}</ul>
          </div>` : '',
        reviewConditions.length > 0 ? `
          <div>
            <span>${escapeHTML(t('navigation.reviewSignals'))}</span>
            <ul>${reviewConditions.map(condition => `<li>${escapeHTML(condition)}</li>`).join('')}</ul>
          </div>` : ''
      ].filter(Boolean).join('');

      return `
        <article
          class="navigation-path-item${recommended ? ' is-recommended' : ''}${selected ? ' is-selected' : ''}"
          data-path-id="${escapeHTML(id)}"
          data-path-type="${escapeHTML(cleanText(path?.pathType))}"
        >
          <header class="navigation-path-header">
            <span class="navigation-path-number">${String(index + 1).padStart(2, '0')}</span>
            <div>
              ${recommended ? `<mark>${escapeHTML(t('navigation.shownFirst'))}</mark>` : ''}
              <h3>${escapeHTML(title)}</h3>
            </div>
          </header>

          ${direction ? `<p class="navigation-path-purpose">${escapeHTML(direction)}</p>` : ''}
          ${description ? `<p class="navigation-path-rationale">${escapeHTML(description)}</p>` : ''}

          <div class="navigation-path-customer-grid">
            <section>
              <span>${escapeHTML(t('navigation.suitableWhen'))}</span>
              ${suitableWhen.length > 0
                ? `<ul>${suitableWhen.map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul>`
                : `<p>${escapeHTML(t('navigation.notEstablished'))}</p>`}
            </section>

            <section>
              <span>${escapeHTML(t('navigation.firstStep'))}</span>
              <p>${escapeHTML(firstStep || t('navigation.notEstablished'))}</p>
            </section>

            <section>
              <span>${escapeHTML(t('navigation.pathBoundary'))}</span>
              <p>${escapeHTML(boundary || t('navigation.boundaryFallback'))}</p>
            </section>
          </div>

          ${requiresProfessionalReview ? `
            <p class="navigation-path-professional">
              ${escapeHTML(t('navigation.requiresProfessionalReview'))}
            </p>` : ''}

          ${detailBlocks ? `
            <details class="navigation-path-details">
              <summary>${escapeHTML(t('navigation.viewPathDetails'))}</summary>
              <div class="navigation-path-detail-grid">${detailBlocks}</div>
            </details>` : ''}

          <div class="navigation-path-choice">
            <button
              class="btn navigation-path-select"
              type="button"
              data-select-path="${escapeHTML(id)}"
              ${selected ? 'disabled aria-pressed="true"' : 'aria-pressed="false"'}
            >
              ${escapeHTML(selected ? t('navigation.pathSelected') : t('navigation.chooseThisPath'))}
            </button>
          </div>
        </article>
      `;
    })
    .join('');
}

function renderSelectedPath(selectedPath) {
  const panel = qs('#navigationSelectedPathPanel');
  const actions = qs('#navigationSelectedPathActions');

  if (!panel) return;

  const selected = isObject(selectedPath) ? selectedPath : null;

  panel.dataset.selectionState = selected ? 'selected' : 'empty';
  panel.dataset.stateNotice = selected ? t('navigation.selectionSavedNotice') : '';

  if (!selected) {
    setText('#navigationSelectedPathTitle', '');
    setText(
      '#navigationSelectedPathSummary',
      t('navigation.pathSequence')
    );
    if (actions) actions.replaceChildren();
    return;
  }

  setText(
    '#navigationSelectedPathTitle',
    selected.label || selected.direction
  );
  setText(
    '#navigationSelectedPathSummary',
    selected.selectionNote ||
    selected.description ||
    selected.rationale ||
    selected.direction
  );
  if (actions) {
    const prepared = document.documentElement.dataset.navigationReviewPrepared === 'true';
    actions.innerHTML = `
      <button class="btn navigation-change-path" type="button" data-change-path>${escapeHTML(t('navigation.changePath'))}</button>
      <button class="btn navigation-review-ready" type="button" data-prepare-review ${prepared ? 'disabled aria-pressed="true"' : 'aria-pressed="false"'}>${escapeHTML(prepared ? t('navigation.reviewPrepared') : t('navigation.continueToReview'))}</button>
    `;
  }
}

export function renderRealityNavigation(response) {
  const navigation = isObject(response?.navigation)
    ? response.navigation
    : {};
  const currentPosition = isObject(navigation.currentPosition)
    ? navigation.currentPosition
    : {};
  const currentTransition = isObject(navigation.currentTransition)
    ? navigation.currentTransition
    : {};
  const legacy = isObject(navigation.legacy)
    ? navigation.legacy
    : {};
  const transitionLabel = typeof navigation.currentTransition === 'string'
    ? navigation.currentTransition
    : cleanText(currentTransition.label);
  const priority = priorityValues(
    navigation,
    currentPosition,
    legacy
  );
  const recommendedDirection = isObject(navigation.recommendedDirection)
    ? navigation.recommendedDirection
    : isObject(legacy.recommendedDirection)
      ? legacy.recommendedDirection
      : {};
  const actionGuidance = isObject(navigation.actionGuidance)
    ? navigation.actionGuidance
    : isObject(legacy.actionGuidance)
      ? legacy.actionGuidance
      : {};
  const professionalReview = isObject(navigation.professionalReview)
    ? navigation.professionalReview
    : {};
  const selectedPath = isObject(navigation.selectedPath)
    ? navigation.selectedPath
    : null;
  const paths = availablePaths(navigation);

  setText('#navigationRuntimeEntityId', response.runtimeEntityId);
  setText('#navigationRuntimeEntryId', response.runtimeEntryId);
  setText(
    '#navigationCurrentRuntime',
    currentPosition.runtime ||
    navigation.currentRuntime ||
    legacy.currentRuntime
  );
  setText(
    '#navigationCurrentTransition',
    transitionLabel ||
    navigation.currentTransitionLabel ||
    legacy.currentTransition
  );
  setText(
    '#navigationCurrentPosition',
    currentPosition.situation ||
    navigation.currentSituation ||
    legacy.currentSituation ||
    currentPosition.runtime
  );
  setText(
    '#navigationDesiredDirection',
    navigation.desiredDirection ||
    legacy.desiredDirection ||
    transitionLabel
  );

  renderList('#navigationConstraints', navigation.constraints);

  const primaryRegion =
    currentPosition.primaryRuntimeRegion ||
    navigation.primaryRuntimeRegion ||
    legacy.primaryRuntimeRegion;

  setText('#navigationRegion', primaryRegionText(primaryRegion));
  setText(
    '#navigationProfessionalReview',
    professionalReview.recommended
      ? t('navigation.recommended')
      : t('navigation.notRequired')
  );
  renderList(
    '#navigationEvidenceWatch',
    navigation.evidenceWatch || navigation.evidenceToWatch
  );
  renderList('#navigationUnknownReality', navigation.unknownReality);
  renderList('#navigationReviewConditions', navigation.reviewConditions);
  renderPaths(
    paths,
    recommendedDirection.pathId,
    selectedPath?.id
  );
  document.documentElement.dataset.navigationReviewPrepared = cleanText(response?.navigationState?.reviewGate?.preparedAt) ? 'true' : 'false';
  renderSelectedPath(selectedPath);
  setText('#navigationReviewReason', professionalReview.reason);

  return {
    rendered: true,
    availablePathCount: paths.length,
    selectedPathId: cleanText(selectedPath?.id),
    professionalReviewRecommended:
      professionalReview.recommended === true
  };
}

export default renderRealityNavigation;
