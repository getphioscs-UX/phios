import {
  getLocale,
  initializeI18n,
  onLocaleChange,
  t
} from '../i18n.js';
import {
  CONTINUITY_KEY,
  MEMORY_KEY
} from '../modules/runtime-workspace-state.js';
import {
  buildContinuityCustomerProjection
} from '../modules/continuity-customer-projection.js';
import {
  buildMemoryCustomerProjection
} from '../modules/memory-customer-projection.js';
import { cleanText, escapeHTML } from '../shared.js';
import { RuntimeKernel } from '../runtime/index.js';

const $ = id => document.getElementById(id);
const asArray = value => Array.isArray(value) ? value : [];

function readMemory() {
  return RuntimeKernel.contracts.get(MEMORY_KEY, null);
}

function readContinuity() {
  return RuntimeKernel.contracts.get(CONTINUITY_KEY, null);
}

function formatDate(value) {
  if (!value) return t('lineage.dateUnknown');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t('lineage.dateUnknown');
  return new Intl.DateTimeFormat(
    document.documentElement.lang || 'en',
    { dateStyle: 'medium', timeStyle: 'short' }
  ).format(date);
}

function formatDateOnly(value) {
  if (!value) return t('memory.notEstablished');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t('memory.notEstablished');
  return new Intl.DateTimeFormat(
    document.documentElement.lang || 'en',
    { dateStyle: 'long' }
  ).format(date);
}

function renderList(id, items, emptyKey = 'memory.none') {
  $(id).innerHTML = (asArray(items).length ? items : [t(emptyKey)])
    .map(item => `<li>${escapeHTML(
      typeof item === 'string' ? item : item?.statement || ''
    )}</li>`)
    .join('');
}

function eventDetail(event) {
  const details = [];
  if (event.revision) {
    details.push(t('lineage.revision', { number: event.revision }));
  }
  if (event.pathTitle) {
    details.push(`${t('lineage.path')}: ${event.pathTitle}`);
  }
  if (event.outcome) {
    details.push(
      `${t('lineage.outcome')}: ${t(
        `memory.outcome.${event.outcome}`,
        {},
        event.outcome
      )}`
    );
  }
  if (event.summary) details.push(event.summary);
  return details;
}

function renderRuntimeTimeline() {
  const target = $('runtimeTimeline');
  const empty = $('timelineEmpty');
  if (!target || !empty) return;

  const lineage = RuntimeKernel.lineage.timeline();
  $('lineageEntityId').textContent =
    lineage.runtimeEntityId || t('lineage.notEstablished');
  $('lineageRuntimeCount').textContent = String(lineage.runtimeCount || 0);
  empty.classList.toggle('hidden', lineage.runtimes.length > 0);
  target.innerHTML = lineage.runtimes.map((runtime, index) => {
    const events = runtime.events.length
      ? runtime.events.map(event => {
          const details = eventDetail(event);
          return `
            <li class="runtime-timeline-event runtime-event-${escapeHTML(event.type)}">
              <span class="runtime-timeline-dot" aria-hidden="true"></span>
              <div>
                <div class="runtime-timeline-event-head">
                  <strong>${escapeHTML(t(
                    event.titleKey || `lineage.event.${event.type}`,
                    {},
                    event.type
                  ))}</strong>
                  <time>${escapeHTML(formatDate(event.occurredAt))}</time>
                </div>
                ${details.map(detail => `<p>${escapeHTML(detail)}</p>`).join('')}
              </div>
            </li>`;
        }).join('')
      : `<li class="runtime-timeline-empty">${escapeHTML(t('lineage.noEvents'))}</li>`;
    const statusKey = runtime.status === 'active'
      ? 'lineage.active'
      : 'lineage.archived';
    return `
      <article class="runtime-lineage-card ${runtime.status === 'active' ? 'is-active' : ''}">
        <header>
          <div>
            <p class="eyebrow">${escapeHTML(t('lineage.runtimeNumber', { number: index + 1 }))}</p>
            <h3>${escapeHTML(runtime.runtimeId || t('lineage.notEstablished'))}</h3>
          </div>
          <span class="runtime-lineage-status">${escapeHTML(t(statusKey))}</span>
        </header>
        <div class="runtime-lineage-meta">
          <span>${escapeHTML(t('lineage.entryId'))}: ${escapeHTML(runtime.runtimeEntryId || t('lineage.notEstablished'))}</span>
          <span>${escapeHTML(t('lineage.started'))}: ${escapeHTML(formatDate(runtime.startedAt))}</span>
          ${runtime.endedAt ? `<span>${escapeHTML(t('lineage.ended'))}: ${escapeHTML(formatDate(runtime.endedAt))}</span>` : ''}
        </div>
        <ol class="runtime-timeline">${events}</ol>
      </article>`;
  }).join('');
}

function triggerLabel(code) {
  return t(`memory.trigger.${code}`, {}, cleanText(code));
}

function branchLabel(code) {
  return t(`memory.branch.${code}`, {}, cleanText(code));
}

function renderMemory(memory) {
  const projection = buildMemoryCustomerProjection(memory);
  $('memoryId').textContent =
    projection.summary.memoryId || t('memory.notEstablished');
  $('runtimeEntryId').textContent =
    projection.summary.runtimeEntryId || t('memory.notEstablished');
  $('memorySavedCount').textContent = t('memory.savedCount', {
    count: projection.summary.savedItemCount
  });
  $('memoryPath').textContent =
    projection.summary.selectedPath || t('memory.notEstablished');
  $('memoryOutcome').textContent = t(
    `memory.outcome.${projection.summary.nextRuntimeState}`,
    {},
    projection.summary.nextRuntimeState || t('memory.notEstablished')
  );
  renderList('memoryObserved', projection.savedGroups.observedChanges);
  renderList('memoryNoChange', projection.savedGroups.unchangedConditions);
  renderList('memoryUnexpected', projection.savedGroups.unexpectedReality);
  renderList('memoryDifficulties', projection.savedGroups.difficulties);
  renderList('memoryEvidence', [
    ...projection.savedGroups.observedEvidence,
    ...projection.savedGroups.verifiedRecords,
    ...projection.savedGroups.professionalRecords
  ]);
  renderList('memoryInterpretation', projection.savedGroups.interpretation);
  renderList('memoryUnknown', projection.savedGroups.unresolvedReality);
  renderList('memoryReasons', memory.outcomeMemory?.reasons);
  $('memoryNotes').textContent =
    projection.savedNotes || t('memory.none');
  return projection;
}

function renderContinuity(memory) {
  const existing = readContinuity();
  const projection = buildContinuityCustomerProjection(memory, existing);
  const expected = cleanText(memory.outcomeMemory?.nextRuntimeState);

  $('continuityTrigger').textContent = triggerLabel(projection.trigger.code);
  $('continuityNextReview').textContent =
    formatDateOnly(projection.reviewTiming.nextReviewAt);
  $('continuityBranch').textContent = branchLabel(projection.branch.type);
  $('continuityBranchTitle').textContent = branchLabel(projection.branch.type);
  $('continuityBranchText').textContent = t(
    `memory.branchText.${projection.branch.type}`,
    {},
    t('memory.branchText.pending')
  );

  $('continuityTriggerInput').value = [
    ...$('continuityTriggerInput').options
  ].some(option => option.value === projection.trigger.code)
    ? projection.trigger.code
    : 'customer_requested';
  $('continuityNextReviewInput').value =
    projection.reviewTiming.nextReviewAt.slice(0, 10);
  $('continuityNewChange').value =
    projection.checkIn.newChangeText || '';
  document.querySelectorAll('[name="newChangeStatus"]').forEach(input => {
    input.checked = input.value === projection.checkIn.newChangeStatus;
  });
  document.querySelectorAll('[name="continuityChoice"]').forEach(input => {
    input.checked = input.value === expected;
    input.disabled = input.value !== expected;
  });

  const execution = RuntimeKernel.transition.current();
  $('continuityStatus').textContent =
    execution?.continuityId === existing?.continuityId
      ? t('memory.transitionExecuted')
      : existing?.userChoice?.confirmed
        ? t('memory.continuityConfirmed')
        : t('memory.continuityWaiting');
  $('executeTransition').classList.toggle(
    'hidden',
    !existing?.userChoice?.confirmed ||
      execution?.continuityId === existing?.continuityId
  );
  return projection;
}

function render() {
  const memory = readMemory();
  renderRuntimeTimeline();
  RuntimeKernel.workspace.mount({
    currentStage: location.hash === '#continuity' ? 'continuity' : 'memory'
  });
  $('memoryEmpty').classList.toggle('hidden', Boolean(memory));
  $('memoryWorkspace').classList.toggle('hidden', !memory);
  if (!memory) return;
  renderMemory(memory);
  renderContinuity(memory);
}

function transitionRouteType(choice) {
  return {
    continue_observation: 'continue_current_runtime',
    continue_selected_path: 'continue_current_runtime',
    return_to_reading: 'return_to_reading',
    choose_another_path: 'return_to_navigation',
    start_new_entry: 'start_new_runtime',
    professional_review: 'professional_boundary',
    remain_open: 'remain_open'
  }[choice] || null;
}

function transitionRequirements(choice, memory) {
  const requirements = [];
  if (choice === 'continue_observation') requirements.push('preserve_observation_scope');
  if (choice === 'continue_selected_path') requirements.push('preserve_selected_path');
  if (choice === 'return_to_reading') requirements.push('create_new_reading_revision');
  if (choice === 'choose_another_path') {
    requirements.push('clear_path_selection', 'preserve_navigation_history');
  }
  if (choice === 'start_new_entry') requirements.push('explicit_new_entry_creation');
  if (choice === 'professional_review') requirements.push('accepted_professional_boundary');
  if (choice === 'remain_open') requirements.push('no_runtime_transition');
  if (memory.professionalBoundary?.required === true) {
    requirements.push('preserve_professional_boundary');
  }
  return [...new Set(requirements)];
}

function destination(choice) {
  return {
    continue_observation: 'review_continuation',
    continue_selected_path: 'review_continuation',
    return_to_reading: 'reading',
    choose_another_path: 'navigation',
    start_new_entry: 'entry',
    professional_review: 'professional_boundary',
    remain_open: 'open'
  }[choice] || null;
}

function sourceUnresolved(memory) {
  return [
    ...asArray(memory.unresolvedMemory?.inheritedUnknownReality),
    ...asArray(memory.unresolvedMemory?.unexpectedRealityPendingReview)
  ].map(item => cleanText(item?.statement || item)).filter(Boolean);
}

function readCheckIn() {
  return {
    trigger: $('continuityTriggerInput').value,
    nextReviewAt: $('continuityNextReviewInput').value
      ? new Date(`${$('continuityNextReviewInput').value}T00:00:00.000Z`).toISOString()
      : '',
    newChangeStatus:
      document.querySelector('[name="newChangeStatus"]:checked')?.value || '',
    newChangeText: cleanText($('continuityNewChange').value),
    evidenceClass: 'reported_experience',
    automaticDetection: false,
    recordedAt: new Date().toISOString()
  };
}

function confirmContinuity() {
  const memory = readMemory();
  const selected =
    document.querySelector('[name="continuityChoice"]:checked')?.value || '';
  const expected = cleanText(memory?.outcomeMemory?.nextRuntimeState);
  if (!memory || !selected) return;
  if (selected !== expected) {
    $('continuityStatus').textContent = t('memory.continuityMismatch');
    return;
  }

  const checkIn = readCheckIn();
  if (!checkIn.newChangeStatus) {
    $('continuityStatus').textContent = t('memory.checkInRequired');
    return;
  }
  if (checkIn.newChangeStatus === 'yes' && !checkIn.newChangeText) {
    $('continuityStatus').textContent = t('memory.newChangeDescriptionRequired');
    return;
  }

  const confirmedAt = new Date().toISOString();
  const continuity = {
    schemaVersion: 'phi-os.continuity.v1',
    continuityId: `continuity_${crypto.randomUUID().slice(0, 8)}`,
    createdAt: confirmedAt,
    runtimeEntityId: memory.runtimeEntityId,
    sourceRuntimeId:
      memory.lineage?.currentRuntimeId || memory.runtimeEntryId,
    sourceRuntimeEntryId: memory.runtimeEntryId,
    sourceMemoryId: memory.memoryId,
    sourceMemory: {
      schemaVersion: memory.schemaVersion,
      reviewId: memory.reviewId,
      selectedPathId: memory.selectedPath?.id || '',
      reviewOutcome: expected,
      unresolvedReality: sourceUnresolved(memory)
    },
    customerCheckIn: checkIn,
    userChoice: {
      nextRuntimeState: selected,
      confirmed: true,
      confirmedAt,
      selectionSource: 'user_confirmation',
      automaticSelection:false
    },
    transition: {
      status: 'prepared',
      routeType: transitionRouteType(selected),
      requirements: transitionRequirements(selected, memory),
      requiresNewRuntime: selected === 'start_new_entry',
      requiresProfessionalBoundary: selected === 'professional_review',
      createsNextRuntime:false,
      nextRuntimeId: null,
      preservesSourceRuntime: true,
      appendOnly: true
    },
    destination: {
      stage: destination(selected),
      sourceContractMode:
        selected === 'return_to_reading' ? 'new_revision' : 'reference_only',
      historicalOverwrite: false
    },
    professionalBoundary: {
      required:
        selected === 'professional_review' ||
        memory.professionalBoundary?.required === true,
      domainId: cleanText(memory.professionalBoundary?.domainId),
      consentAccepted:
        memory.professionalBoundary?.consentAccepted === true,
      sensitiveDataCollection: false,
      conclusionsProvided: false
    },
    source: 'reality_continuity_customer_workspace',
    guardrails: {
      automaticSelectionAllowed: false,
      automaticNextRuntimeCreationAllowed: false,
      historicalContractOverwriteAllowed: false,
      readingOverwriteAllowed: false,
      navigationOverwriteAllowed: false,
      memoryOverwriteAllowed: false,
      unknownRealityAsFactAllowed: false,
      customerReportAsFactAllowed: false,
      professionalConclusionInferenceAllowed: false,
      userConfirmationRequired: true,
      appendOnly: true
    }
  };
  RuntimeKernel.contracts.save(CONTINUITY_KEY, continuity);
  location.hash = 'continuity';
  render();
}

function executeTransition() {
  const continuity = readContinuity();
  if (!continuity) return;
  try {
    const result = RuntimeKernel.transition.execute(
      continuity,
      { userInitiated: true }
    );
    if (!result.executed) {
      throw new Error(
        `Runtime transition invalid: ${result.readiness.blockers.join(', ')}`
      );
    }
    const execution = result.execution;
    if (
      execution.route &&
      execution.route !== location.pathname + location.hash
    ) {
      location.assign(execution.route);
    } else {
      render();
    }
  } catch (error) {
    $('continuityStatus').textContent =
      error?.message || t('memory.transitionFailed');
  }
}

function reportSection(title, values) {
  const items = asArray(values);
  return `
    <section>
      <h2>${escapeHTML(title)}</h2>
      ${items.length
        ? `<ul>${items.map(value => `<li>${escapeHTML(value)}</li>`).join('')}</ul>`
        : `<p>${escapeHTML(t('memory.none'))}</p>`}
    </section>`;
}

function exportRuntimeReport() {
  const memory = readMemory();
  if (!memory) return;
  const continuity = readContinuity();
  const projection = buildMemoryCustomerProjection(memory);
  const continuityProjection = buildContinuityCustomerProjection(memory, continuity);
  const html = `<!doctype html>
<html lang="${escapeHTML(getLocale())}">
<head>
  <meta charset="utf-8">
  <title>${escapeHTML(t('memory.reportTitle'))}</title>
  <style>
    body{font:16px/1.6 system-ui,sans-serif;max-width:840px;margin:48px auto;padding:0 24px;color:#171719}
    h1,h2{font-family:Georgia,serif}header{border-bottom:2px solid #171719;margin-bottom:32px}
    section{margin:28px 0}dt{font-weight:700}dd{margin:0 0 12px}.boundary{padding:16px;background:#f2efe7}
  </style>
</head>
<body>
  <header>
    <p>PHI OS · ${escapeHTML(t('memory.privateClassification'))}</p>
    <h1>${escapeHTML(t('memory.reportTitle'))}</h1>
    <p>${escapeHTML(t('memory.reportGenerated', { date: formatDate(new Date().toISOString()) }))}</p>
  </header>
  <dl>
    <dt>${escapeHTML(t('memory.memoryId'))}</dt><dd>${escapeHTML(projection.summary.memoryId)}</dd>
    <dt>${escapeHTML(t('memory.runtimeId'))}</dt><dd>${escapeHTML(projection.summary.runtimeEntryId)}</dd>
    <dt>${escapeHTML(t('memory.selectedPath'))}</dt><dd>${escapeHTML(projection.summary.selectedPath)}</dd>
    <dt>${escapeHTML(t('memory.selectedOutcome'))}</dt><dd>${escapeHTML(t(`memory.outcome.${projection.summary.nextRuntimeState}`, {}, projection.summary.nextRuntimeState))}</dd>
  </dl>
  ${reportSection(t('memory.observedTitle'), projection.savedGroups.observedChanges)}
  ${reportSection(t('memory.unchangedTitle'), projection.savedGroups.unchangedConditions)}
  ${reportSection(t('memory.unexpectedTitle'), projection.savedGroups.unexpectedReality)}
  ${reportSection(t('memory.unknownTitle'), projection.savedGroups.unresolvedReality)}
  <section>
    <h2>${escapeHTML(t('memory.continuityTitle'))}</h2>
    <p>${escapeHTML(triggerLabel(continuityProjection.trigger.code))}</p>
    <p>${escapeHTML(formatDateOnly(continuityProjection.reviewTiming.nextReviewAt))}</p>
    <p>${escapeHTML(branchLabel(continuityProjection.branch.type))}</p>
  </section>
  <p class="boundary">${escapeHTML(t('memory.reportBoundary'))}</p>
</body>
</html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `PHI-OS-Runtime-Report-${new Date().toISOString().slice(0, 10)}.html`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('memoryActionStatus').textContent = t('memory.exportPrepared');
}

function deleteBrowserRuntime() {
  if (!window.confirm(t('memory.deleteConfirm'))) return;
  RuntimeKernel.contracts.keys.forEach(key => {
    RuntimeKernel.contracts.remove(key, { emit: false });
  });
  RuntimeKernel.persistence.clear();
  location.assign('/reality-journey.html?runtime=deleted');
}

function boot() {
  RuntimeKernel.start();
  initializeI18n();
  render();
  $('confirmContinuity')?.addEventListener('click', confirmContinuity);
  $('executeTransition')?.addEventListener('click', executeTransition);
  $('exportRuntimeReport')?.addEventListener('click', exportRuntimeReport);
  $('deleteBrowserRuntime')?.addEventListener('click', deleteBrowserRuntime);
  onLocaleChange(render);
  window.addEventListener('hashchange', render);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
