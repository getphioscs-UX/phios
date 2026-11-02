/*
 * PHI OS M3C-W6 Navigation Customer Projection
 * Pure, read-only presentation model. It never selects a path, prepares
 * Review, writes session state or changes the frozen Navigation Contract.
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

function availablePaths(navigation = {}) {
  return asArray(
    navigation.availablePaths ||
    navigation.boundedNavigationPaths ||
    navigation.boundedPath
  );
}

function findPath(paths, pathId) {
  const id = asText(pathId);
  return id
    ? paths.find(path => asText(path?.id) === id) || null
    : null;
}

export function buildNavigationCustomerProjection(response = {}) {
  const navigation = response.navigation || response;
  const paths = availablePaths(navigation);
  const selectedPath = navigation.selectedPath &&
    typeof navigation.selectedPath === 'object'
    ? navigation.selectedPath
    : null;
  const recommendedPath = findPath(
    paths,
    navigation?.recommendedDirection?.pathId
  );
  const referencePath = selectedPath || recommendedPath || paths[0] || null;
  const currentPosition = navigation.currentPosition || {};
  const priority = currentPosition.priority || navigation.priority || {};
  const transition = navigation.currentTransition || {};
  const reason = asText(
    selectedPath?.rationale ||
    selectedPath?.description ||
    priority.reason ||
    transition.reason ||
    transition.label ||
    navigation.currentTransitionLabel
  );

  return {
    availableDirection: {
      pathCount: paths.length,
      selectedPathId: asText(selectedPath?.id),
      referencePathId: asText(referencePath?.id),
      automaticSelection: false
    },
    reason: {
      text: reason,
      sourceCode: selectedPath ? 'selectedPath' : 'currentReading'
    },
    evidence: {
      items: textList(
        selectedPath?.evidenceWatch ||
        selectedPath?.evidenceBasis ||
        navigation.evidenceWatch ||
        navigation.evidenceToWatch
      ),
      sourceCode: 'readingEvidence'
    },
    constraint: {
      items: textList(navigation.constraints),
      boundary: asText(referencePath?.boundary),
      unknownItems: textList(navigation.unknownReality)
    },
    firstAction: {
      established: Boolean(selectedPath),
      text: selectedPath
        ? asText(selectedPath.firstStep || selectedPath.nextStep)
        : '',
      pathId: asText(selectedPath?.id)
    },
    reviewPoint: {
      items: textList(
        selectedPath?.reviewConditions || navigation.reviewConditions
      ),
      professionalReviewRecommended:
        navigation?.professionalReview?.recommended === true
    },
    guardrails: {
      readOnlyProjection: true,
      pathSelectionAllowed: false,
      reviewPreparationAllowed: false,
      sessionWriteAllowed: false,
      automaticPathSelectionAllowed: false,
      userChoiceRequired: true
    }
  };
}
