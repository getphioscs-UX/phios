/*
 * PHI OS Reading Navigation Readiness Boundary
 * File: functions/runtime/reading/navigation-readiness.js
 * Version: 1.1.0
 */

function cleanText(value) {
  return typeof value === 'string'
    ? value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    : '';
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function evidenceUnitCount(value) {
  return list(value).reduce((count, item) => {
    const text = typeof item === 'string'
      ? item
      : item?.statement || item?.summary || item?.sourceText || '';
    const units = String(text).split(/[.!?。！？；;]+/)
      .map(unit => unit.trim()).filter(unit => unit.length >= 8);
    return count + Math.max(1, units.length);
  }, 0);
}

function hasDirection(readingInput) {
  const entry = readingInput?.runtimeEntry || {};
  const direction = entry.desiredTransition || entry.desiredDirection || {};

  return Boolean(cleanText(
    direction.summary ||
    direction.statement ||
    direction.rawStatement ||
    readingInput?.reconstruction?.direction?.summary ||
    readingInput?.reconstruction?.direction?.nextDirection
  ));
}

function hasBoundedFocus(readingInput) {
  return hasDirection(readingInput) || Boolean(cleanText(
    readingInput?.reconstruction?.primaryArc ||
    readingInput?.primaryArc
  ));
}

export function assessNavigationReadiness({
  readingInput,
  boundary,
  patternAssessment,
  primaryRegion,
  confidence,
  language = 'en'
}) {
  const blockers = [];
  const advisories = [];
  const observedCount = evidenceUnitCount(boundary?.observedEvidence);
  const experienceCount = list(boundary?.reportedExperience).length;
  const directionEstablished = hasDirection(readingInput);
  const boundedFocusEstablished = hasBoundedFocus(readingInput);

  if (!patternAssessment?.established) {
    advisories.push('pattern_not_established');
  }

  if (observedCount < 2) {
    blockers.push('insufficient_observed_evidence');
  }

  if (experienceCount < 1) {
    advisories.push('insufficient_reported_experience');
  }

  if (!boundedFocusEstablished) {
    blockers.push('navigation_focus_not_established');
  } else if (!directionEstablished) {
    advisories.push('direction_not_established');
  }

  if (!primaryRegion) {
    advisories.push('runtime_region_not_established');
  }

  const ready = blockers.length === 0;
  const score = Math.max(0, Math.min(1,
    (Number(confidence) || 0) * 0.55 +
    (patternAssessment?.established ? 0.2 : 0) +
    (directionEstablished ? 0.15 : 0) +
    (primaryRegion ? 0.1 : 0)
  ));

  const reason = ready
    ? language === 'zh'
      ? advisories.length
        ? '本次读取已达到最低证据门槛；现实导航可以先采用观察路径，同时保留尚未确认的方向或 Runtime 区域。'
        : '本次读取已达到最低证据门槛，并建立了明确方向；可以进入有边界的现实导航。'
      : advisories.length
        ? 'The Reading meets the minimum evidence threshold. Navigation may begin with an observation-first path while the direction or Runtime Region remains unresolved.'
        : 'The Reading meets the minimum evidence threshold and has an explicit direction, so bounded Navigation may begin.'
    : language === 'zh'
      ? '本次读取尚未达到进入现实导航所需的证据与方向门槛。'
      : 'The Reading does not yet meet the evidence and direction thresholds required for Navigation.';

  return {
    ready,
    score: Number(score.toFixed(2)),
    reason,
    blockers,
    advisories,
    requirements: {
      minimumObservedEvidence: 2,
      minimumReportedExperience: 1,
      patternEstablished: patternAssessment?.established === true,
      patternRequiredForObservation: false,
      reportedExperienceEstablished: experienceCount >= 1,
      reportedExperienceRequiredForObservation: false,
      boundedFocusEstablished,
      directionEstablished,
      directionRequired: false,
      runtimeRegionEstablished: Boolean(primaryRegion),
      runtimeRegionRequired: false
    },
    navigationMode: ready
      ? advisories.length > 0
        ? 'observation_first'
        : 'bounded_transition'
      : 'blocked'
  };
}

export default assessNavigationReadiness;
