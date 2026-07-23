/* PHI OS M3C-W2
 * Pure, read-only projection for the Journey Dashboard.
 * Runtime contracts remain owned by the frozen Runtime modules.
 */

export const JOURNEY_DASHBOARD_STAGES = Object.freeze([
  { id: 'entry', number: '01', route: '/reality-entry.html' },
  { id: 'reconstruction', number: '02', route: '/reality-reconstruction.html' },
  { id: 'reading', number: '03', route: '/reality-reading.html' },
  { id: 'navigation', number: '04', route: '/reality-navigation.html' },
  { id: 'review', number: '05', route: '/reality-review.html' },
  { id: 'memory', number: '06', route: '/my-reality.html#memory' },
  { id: 'continuity', number: '07', route: '/my-reality.html#continuity' }
]);

const validDate = value => {
  const time = Date.parse(value || '');
  return Number.isFinite(time) ? time : null;
};

function flattenTimeline(lineage = {}) {
  const records = [];
  const runtimes = Array.isArray(lineage.runtimes) ? lineage.runtimes : [];

  runtimes.forEach((runtime, runtimeIndex) => {
    const events = Array.isArray(runtime.events) ? runtime.events : [];
    events.forEach((event, eventIndex) => {
      records.push({
        ...event,
        runtimeId: runtime.runtimeId || '',
        runtimeStatus: runtime.status || '',
        runtimeIndex,
        eventIndex
      });
    });
  });

  return records.sort((left, right) => {
    const leftTime = validDate(left.occurredAt);
    const rightTime = validDate(right.occurredAt);
    if (leftTime !== null && rightTime !== null) return rightTime - leftTime;
    if (leftTime !== null) return -1;
    if (rightTime !== null) return 1;
    if (left.runtimeIndex !== right.runtimeIndex) return right.runtimeIndex - left.runtimeIndex;
    return right.eventIndex - left.eventIndex;
  });
}

function recoveryCode({
  hasActiveJourney,
  snapshot,
  snapshotValidation,
  recoveryState
}) {
  if (snapshot && snapshotValidation?.valid === false) return 'attention';
  if (recoveryState?.status === 'restored') return 'restored';
  if (hasActiveJourney && snapshotValidation?.valid === true) return 'protected';
  if (hasActiveJourney) return 'sessionOnly';
  if (snapshotValidation?.valid === true) return 'recoverable';
  return 'empty';
}

export function buildJourneyDashboardProjection({
  workspace = {},
  lineage = {},
  snapshot = null,
  snapshotValidation = { valid: false, reason: 'snapshot_missing' },
  recoveryState = null,
  hasActiveJourney = false
} = {}) {
  const completed = new Set(
    Array.isArray(workspace.completedStages) ? workspace.completedStages : []
  );
  const available = new Set(
    Array.isArray(workspace.availableStages) ? workspace.availableStages : ['entry']
  );
  const declaredStage = JOURNEY_DASHBOARD_STAGES.some(
    stage => stage.id === workspace.currentStage
  )
    ? workspace.currentStage
    : 'entry';
  const currentStage = hasActiveJourney ? declaredStage : 'entry';
  const current = JOURNEY_DASHBOARD_STAGES.find(stage => stage.id === currentStage);
  const activeRuntime = (Array.isArray(lineage.runtimes) ? lineage.runtimes : [])
    .find(runtime => runtime.status === 'active');
  const timeline = flattenTimeline(lineage);
  const latestEvent = timeline[0] || null;
  const latestUpdate = latestEvent?.occurredAt
    || recoveryState?.restoredAt
    || recoveryState?.savedAt
    || snapshot?.updatedAt
    || snapshot?.savedAt
    || '';

  return {
    hasActiveJourney,
    currentStage,
    currentStageNumber: current.number,
    resumeRoute: hasActiveJourney ? current.route : '/reality-entry.html',
    completedCount: JOURNEY_DASHBOARD_STAGES.filter(stage => completed.has(stage.id)).length,
    completedStages: JOURNEY_DASHBOARD_STAGES.filter(stage => completed.has(stage.id)).map(stage => stage.id),
    nextStepStage: currentStage,
    latestUpdate,
    recoveryCode: recoveryCode({
      hasActiveJourney,
      snapshot,
      snapshotValidation,
      recoveryState
    }),
    runtimeId: activeRuntime?.runtimeId || lineage.activeRuntimeId || snapshot?.runtimeId || '',
    runtimeEntityId: activeRuntime?.runtimeEntityId || lineage.runtimeEntityId || snapshot?.runtimeEntityId || '',
    stages: JOURNEY_DASHBOARD_STAGES.map(stage => ({
      ...stage,
      status: !hasActiveJourney
        ? (stage.id === 'entry' ? 'available' : 'upcoming')
        : stage.id === currentStage
          ? 'current'
          : completed.has(stage.id)
            ? 'completed'
            : available.has(stage.id)
              ? 'available'
              : 'upcoming'
    })),
    timeline: timeline.slice(0, 12),
    revisionRoute: hasActiveJourney ? '/my-reality.html#continuity' : '',
    newJourneyRoute: hasActiveJourney
      ? '/my-reality.html#continuity'
      : '/reality-entry.html',
    guardrails: {
      readOnlyProjection: true,
      automaticRuntimeCreation: false,
      historicalOverwriteAllowed: false,
      explicitContinuityChoiceRequired: hasActiveJourney
    }
  };
}
