import {
  initializeI18n,
  onLocaleChange,
  t
} from '../i18n.js';
import {
  SESSION,
  escapeHTML
} from '../shared.js';
import {
  CONTINUITY_KEY,
  MEMORY_KEY,
  REVIEW_KEY,
  WORKSPACE_STATE_KEY
} from '../modules/runtime-workspace-state.js';
import { RuntimeKernel } from '../runtime/index.js';
import { buildJourneyDashboardProjection } from '../modules/journey-dashboard-projection.js';

const $ = id => document.getElementById(id);

const ACTIVE_JOURNEY_KEYS = Object.freeze([
  SESSION.initial,
  SESSION.entryState,
  SESSION.runtimeEntity,
  SESSION.entry,
  SESSION.reconstruction,
  SESSION.reconstructionInquiry,
  SESSION.readingInput,
  SESSION.reading,
  SESSION.navigationInput,
  SESSION.navigation,
  REVIEW_KEY,
  MEMORY_KEY,
  CONTINUITY_KEY,
  WORKSPACE_STATE_KEY
]);

function hasActiveJourney() {
  return ACTIVE_JOURNEY_KEYS.some(key => RuntimeKernel.contracts.has(key));
}

function formatDate(value) {
  if (!value) return t('journeyDashboard.timeline.unknownDate');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t('journeyDashboard.timeline.unknownDate');
  return new Intl.DateTimeFormat(document.documentElement.lang || 'en', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function stageName(stageId) {
  return t(`journeyPublic.stages.${stageId}.name`, {}, stageId);
}

function eventName(event) {
  return t(
    event.titleKey || `lineage.event.${event.type}`,
    {},
    event.type || t('journeyDashboard.timeline.update')
  );
}

function eventDetails(event) {
  const details = [];
  if (event.revision) {
    details.push(t('journeyDashboard.timeline.revision', { number: event.revision }));
  }
  if (event.pathTitle) {
    details.push(`${t('journeyDashboard.timeline.path')}: ${event.pathTitle}`);
  }
  if (event.outcome) {
    details.push(`${t('journeyDashboard.timeline.outcome')}: ${event.outcome}`);
  }
  if (event.summary) details.push(event.summary);
  return details;
}

function renderStages(projection) {
  const target = $('dashboardStages');
  target.innerHTML = projection.stages.map(stage => `
    <li class="journey-dashboard-stage is-${stage.status}">
      <span class="journey-dashboard-stage__number">${stage.number}</span>
      <span class="journey-dashboard-stage__copy">
        <strong>${escapeHTML(stageName(stage.id))}</strong>
        <small>${escapeHTML(t(`journeyDashboard.stageStatus.${stage.status}`))}</small>
      </span>
      <span class="journey-dashboard-stage__mark" aria-hidden="true">${
        stage.status === 'completed' ? '✓' : stage.status === 'current' ? '●' : '○'
      }</span>
    </li>
  `).join('');
}

function renderTimeline(projection) {
  const target = $('journeyTimeline');
  const empty = $('timelineEmpty');
  empty.classList.toggle('hidden', projection.timeline.length > 0);
  target.classList.toggle('hidden', projection.timeline.length === 0);
  target.innerHTML = projection.timeline.map(event => {
    const details = eventDetails(event);
    return `
      <li class="journey-dashboard-event">
        <span class="journey-dashboard-event__dot" aria-hidden="true"></span>
        <div>
          <div class="journey-dashboard-event__head">
            <strong>${escapeHTML(eventName(event))}</strong>
            <time datetime="${escapeHTML(event.occurredAt || '')}">
              ${escapeHTML(formatDate(event.occurredAt))}
            </time>
          </div>
          <p class="journey-dashboard-event__runtime">
            ${escapeHTML(t('journeyDashboard.timeline.runtime'))}
            · ${escapeHTML(event.runtimeId || t('journeyDashboard.summary.notEstablished'))}
          </p>
          ${details.map(detail => `<p>${escapeHTML(detail)}</p>`).join('')}
        </div>
      </li>
    `;
  }).join('');
}

function setAction(anchor, href, disabled = false) {
  if (!anchor) return;
  if (disabled || !href) {
    anchor.removeAttribute('href');
    anchor.setAttribute('aria-disabled', 'true');
    anchor.classList.add('is-disabled');
    return;
  }
  anchor.href = href;
  anchor.removeAttribute('aria-disabled');
  anchor.classList.remove('is-disabled');
}

function collectProjection() {
  const snapshot = RuntimeKernel.persistence.loadSnapshot();
  const persistedWorkspace = RuntimeKernel.contracts.get(WORKSPACE_STATE_KEY, {});
  const snapshotValidation = snapshot
    ? RuntimeKernel.persistence.validateSnapshot(snapshot)
    : { valid: false, reason: 'snapshot_missing' };

  return buildJourneyDashboardProjection({
    workspace: RuntimeKernel.workspace.inspect(persistedWorkspace.currentStage || ''),
    lineage: RuntimeKernel.lineage.timeline(),
    snapshot,
    snapshotValidation,
    recoveryState: RuntimeKernel.persistence.recoveryState(),
    hasActiveJourney: hasActiveJourney()
  });
}

function render() {
  try {
    const projection = collectProjection();
    $('dashboardLoading').classList.add('hidden');
    $('dashboardError').classList.add('hidden');
    $('dashboardEmpty').classList.toggle('hidden', projection.hasActiveJourney);
    $('dashboardWorkspace').classList.toggle('hidden', !projection.hasActiveJourney);

    if (!projection.hasActiveJourney) return;

    $('currentStage').textContent = stageName(projection.currentStage);
    $('currentStageNumber').textContent = projection.currentStageNumber;
    $('completedStages').textContent = t('journeyDashboard.summary.completedValue', {
      completed: projection.completedCount,
      total: projection.stages.length
    });
    $('nextStep').textContent = t(`journeyDashboard.next.${projection.nextStepStage}`);
    $('latestUpdate').textContent = formatDate(projection.latestUpdate);
    $('recoveryStatus').textContent = t(`journeyDashboard.recovery.${projection.recoveryCode}`);
    $('runtimeId').textContent = projection.runtimeId
      || t('journeyDashboard.summary.notEstablished');

    setAction($('resumeJourney'), projection.resumeRoute);
    setAction($('resumeBoundaryAction'), projection.resumeRoute);
    setAction($('reviseBoundaryAction'), projection.revisionRoute);
    setAction($('newJourneyBoundaryAction'), projection.newJourneyRoute);

    renderStages(projection);
    renderTimeline(projection);
  } catch (error) {
    console.error('Journey Dashboard projection failed.', error);
    $('dashboardLoading').classList.add('hidden');
    $('dashboardEmpty').classList.add('hidden');
    $('dashboardWorkspace').classList.add('hidden');
    $('dashboardError').classList.remove('hidden');
  }
}

function boot() {
  initializeI18n();
  render();
  onLocaleChange(render);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
