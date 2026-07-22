/*
 * PHI OS Navigation Path Selection
 * File: assets/js/modules/navigation-path-selection.js
 * Version: 1.0.0
 *
 * Records explicit user choice. A recommended path is never selected unless
 * the user activates its Choose This Path control.
 */

import { cleanText } from '../shared.js';
import { persistNavigationState, clearNavigationPath, prepareNavigationForReview, acceptProfessionalBoundary } from './navigation-state.js';

function isObject(value) {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value);
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function availablePaths(response) {
  return list(response?.navigation?.availablePaths);
}

function sameNavigationInput(currentResponse, previousResponse) {
  const currentInput = currentResponse?.navigationInput;
  const previousInput = previousResponse?.navigationInput;

  return Boolean(
    cleanText(currentResponse?.runtimeEntityId) &&
    cleanText(currentResponse?.runtimeEntityId) ===
      cleanText(previousResponse?.runtimeEntityId) &&
    cleanText(currentResponse?.runtimeEntryId) ===
      cleanText(previousResponse?.runtimeEntryId) &&
    cleanText(currentInput?.createdAt) &&
    cleanText(currentInput?.createdAt) ===
      cleanText(previousInput?.createdAt)
  );
}

function selectedPathFrom(path, previousSelection = null) {
  return {
    ...path,
    status: 'selected',
    selectedAt:
      cleanText(previousSelection?.selectedAt) ||
      new Date().toISOString(),
    selectionSource:
      cleanText(previousSelection?.selectionSource) ||
      'user_choice'
  };
}

function responseWithSelection(response, selectedPath) {
  const paths = availablePaths(response).map(path => ({
    ...path,
    status:
      cleanText(path?.id) === cleanText(selectedPath?.id)
        ? 'selected'
        : 'available'
  }));

  return {
    ...response,
    navigation: {
      ...response.navigation,
      availablePaths: paths,
      selectedPath
    },
    pathSummary: {
      ...(isObject(response.pathSummary) ? response.pathSummary : {}),
      selectedPath
    }
  };
}


export function selectNavigationPath(response, pathId) {
  if (!isObject(response?.navigation)) {
    throw new Error('Reality Navigation is unavailable.');
  }

  const id = cleanText(pathId);
  const path = availablePaths(response).find(
    item => cleanText(item?.id) === id
  );

  if (!path) {
    throw new Error('The selected Navigation path is unavailable.');
  }

  return persistNavigationState(
    responseWithSelection(
      response,
      selectedPathFrom(path)
    )
  );
}

export function preserveNavigationPathSelection(
  response,
  previousResponse
) {
  const previousSelection = previousResponse?.navigation?.selectedPath;

  if (
    !isObject(previousSelection) ||
    !sameNavigationInput(response, previousResponse)
  ) {
    return response;
  }

  const path = availablePaths(response).find(
    item => cleanText(item?.id) === cleanText(previousSelection.id)
  );

  if (!path) return response;

  return persistNavigationState(
    responseWithSelection(
      response,
      selectedPathFrom(path, previousSelection)
    )
  );
}

export function bindNavigationPathSelection({
  getResponse,
  onSelectionChange
} = {}) {
  const clickHandler = event => {
    const chooseButton = event.target?.closest?.('[data-select-path]');
    const changeButton = event.target?.closest?.('[data-change-path]');

    if (changeButton) {
      event.preventDefault();
      try {
        const currentResponse = typeof getResponse === 'function' ? getResponse() : getResponse;
        const updatedResponse = clearNavigationPath(currentResponse);
        onSelectionChange?.(updatedResponse);
        requestAnimationFrame(() => {
          document.querySelector('#navigationPath')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          document.querySelector('[data-select-path]:not([disabled])')?.focus({ preventScroll: true });
        });
      } catch (error) { console.error('PHI OS Navigation path change failed:', error); }
      return;
    }

    const consentButton = event.target?.closest?.('[data-accept-professional-boundary]');
    if (consentButton) { event.preventDefault(); try { const currentResponse=typeof getResponse==='function'?getResponse():getResponse; onSelectionChange?.(acceptProfessionalBoundary(currentResponse)); } catch(error){ console.error('PHI OS professional consent failed:',error); } return; }

    const reviewButton = event.target?.closest?.('[data-prepare-review]');
    if (reviewButton) {
      event.preventDefault();
      try {
        const currentResponse = typeof getResponse === 'function' ? getResponse() : getResponse;
        const preparedResponse = prepareNavigationForReview(currentResponse);
        onSelectionChange?.(preparedResponse);
        window.location.assign('/reality-review.html');
      } catch (error) { console.error('PHI OS Navigation review preparation failed:', error); }
      return;
    }

    if (!chooseButton || chooseButton.disabled) return;

    event.preventDefault();

    try {
      const currentResponse = typeof getResponse === 'function'
        ? getResponse()
        : getResponse;
      const updatedResponse = selectNavigationPath(
        currentResponse,
        chooseButton.dataset.selectPath
      );

      onSelectionChange?.(updatedResponse);
    } catch (error) {
      console.error('PHI OS Navigation path selection failed:', error);
    }
  };

  document.addEventListener('click', clickHandler);

  return () => {
    document.removeEventListener('click', clickHandler);
  };
}
