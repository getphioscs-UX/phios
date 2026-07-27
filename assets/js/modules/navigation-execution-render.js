import { cleanText, escapeHTML } from '../shared.js';
import { t } from '../i18n.js';
import {
  activeNavigationAction,
  saveNavigationConfiguration,
  startNavigationAction,
  addNavigationEvidenceLog,
  triggerNavigationReview,
  saveFinancialReviewIntent
} from './navigation-execution.js';

const list = value => Array.isArray(value) ? value : [];

function label(key, fallback) {
  return t(`navigation.execution.${key}`, {}, fallback);
}

function stateLabel(state) {
  return label(`state.${state}`, state);
}

function setText(selector, value) {
  const node = document.querySelector(selector);
  if (node) node.textContent = value || '—';
}

function renderCustomerStatus(response, action) {
  const state = action?.execution?.state || 'available';
  const progressValue = action?.progress || {};
  const hasRecords = Number(progressValue.log_count) > 0;
  const reviewNeeded = action?.review_gate?.review_payload_ready === true;
  const hasSavedAction = Boolean(action);
  const saveKey = reviewNeeded
    ? 'saveStatus.review'
    : state === 'active'
      ? 'saveStatus.recording'
      : hasSavedAction
        ? 'saveStatus.saved'
        : 'saveStatus.notStarted';
  setText(
    '#navigationCustomerPath',
    cleanText(response?.navigation?.selectedPath?.label || action?.path?.path_id) ||
      label('notStarted', 'Not started')
  );
  setText('#navigationCustomerExecution', stateLabel(state));
  setText(
    '#navigationCustomerProgress',
    hasRecords
      ? label('recordCount', '{count} records').replace('{count}', progressValue.log_count)
      : label('noRecords', 'No records yet')
  );
  setText(
    '#navigationCustomerNext',
    cleanText(progressValue.next_record_at) || label('notScheduled', 'Not scheduled')
  );
  setText(
    '#navigationCustomerReview',
    label(reviewNeeded ? 'reviewNeeded' : 'reviewNotNeeded', reviewNeeded ? 'Yes' : 'Not yet')
  );
  setText('#navigationCustomerSave', label(saveKey, 'Not started'));
  const notice = document.querySelector('#navigationDeviceStorageNotice');
  if (notice) {
    notice.hidden = !hasSavedAction;
    notice.textContent = hasSavedAction
      ? label(
          'deviceStorage',
          'Your current records are stored on this device. Cross-device recovery is not yet available.'
        )
      : '';
  }
}

function values(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function commonConfiguration(action) {
  const path = action.path;
  return `
    <div class="navigation-execution-grid">
      <label>${escapeHTML(label('objective', 'Objective'))}
        <textarea name="objective" required>${escapeHTML(path.objective)}</textarea>
      </label>
      <label>${escapeHTML(label('signal', 'Selected signal'))}
        <input name="selected_signal" value="${escapeHTML(list(path.selected_signal).join(', '))}" required>
      </label>
      <label>${escapeHTML(label('baseline', 'Current baseline'))}
        <input name="baseline" value="${escapeHTML(list(path.baseline).join(', '))}" required>
      </label>
      <label>${escapeHTML(label('window', 'Observation window'))}
        <input name="window_value" type="number" min="1" value="${Number(path.observation_window?.value) || 7}" required>
      </label>
      <label>${escapeHTML(label('frequency', 'Frequency'))}
        <select name="frequency_type">
          <option value="daily">${escapeHTML(label('daily', 'Daily'))}</option>
          <option value="weekly">${escapeHTML(label('weekly', 'Weekly'))}</option>
          <option value="event_based">${escapeHTML(label('eventBased', 'When the signal occurs'))}</option>
        </select>
      </label>
      <label>${escapeHTML(label('completionCondition', 'Completion condition'))}
        <input name="completion_condition" value="${escapeHTML(list(path.completion_condition).join(', '))}" required>
      </label>
      <label>${escapeHTML(label('stopCondition', 'Stop condition'))}
        <input name="stop_condition" value="${escapeHTML(list(path.stop_condition).join(', '))}" required>
      </label>
      <label>${escapeHTML(label('reviewCondition', 'Review condition'))}
        <input name="review_condition" value="${escapeHTML(list(path.review_condition).join(', '))}" required>
      </label>
    </div>
  `;
}

function clarifyConfiguration(path) {
  return `
    <fieldset>
      <legend>${escapeHTML(label('clarificationStructure', 'Clarification structure'))}</legend>
      <div class="navigation-execution-grid">
        <label>${escapeHTML(label('known', 'Known'))}<textarea name="known_items">${escapeHTML(list(path.known_items).join('\n'))}</textarea></label>
        <label>${escapeHTML(label('reported', 'Reported experience'))}<textarea name="reported_experience">${escapeHTML(list(path.reported_experience).join('\n'))}</textarea></label>
        <label>${escapeHTML(label('interpretation', 'Current interpretation'))}<textarea name="current_interpretation">${escapeHTML(list(path.current_interpretation).join('\n'))}</textarea></label>
        <label>${escapeHTML(label('unknown', 'Still unknown'))}<textarea name="unknown_items">${escapeHTML(list(path.unknown_items).join('\n'))}</textarea></label>
        <label>${escapeHTML(label('question', 'Answerable question'))}<textarea name="clarification_question" required>${escapeHTML(path.clarification_question || '')}</textarea></label>
        <label>${escapeHTML(label('nextEvidence', 'Next evidence needed'))}<textarea name="next_evidence_needed">${escapeHTML(list(path.next_evidence_needed).join('\n'))}</textarea></label>
      </div>
    </fieldset>
  `;
}

function verificationConfiguration(path) {
  return `
    <fieldset>
      <legend>${escapeHTML(label('verificationStructure', 'Verification structure'))}</legend>
      <div class="navigation-execution-grid">
        <label>${escapeHTML(label('primaryReading', 'Primary Reading'))}<input name="primary_reading_id" value="${escapeHTML(path.primary_reading_id || '')}" required></label>
        <label>${escapeHTML(label('alternativeReading', 'Alternative Reading'))}<input name="alternative_reading_id" value="${escapeHTML(path.alternative_reading_id || '')}" required></label>
        <label>${escapeHTML(label('supportingEvidence', 'Supporting evidence'))}<textarea name="supporting_evidence_ids"></textarea></label>
        <label>${escapeHTML(label('conflictingEvidence', 'Counter-evidence'))}<textarea name="conflicting_evidence_ids"></textarea></label>
        <label>${escapeHTML(label('discriminatingCondition', 'Discriminating condition'))}<textarea name="discriminating_condition" required>${escapeHTML(path.discriminating_condition || '')}</textarea></label>
        <label>${escapeHTML(label('verificationSignal', 'Verification signal'))}<input name="verification_signal" value="${escapeHTML(path.verification_signal || '')}" required></label>
      </div>
    </fieldset>
  `;
}

function configurationForm(action) {
  if (action.path.path_type === 'financial_review') {
    return `
      <section class="navigation-financial-intent">
        <strong>${escapeHTML(label('financialBoundary', 'Financial professional boundary'))}</strong>
        <p>${escapeHTML(label('financialBoundaryText', 'No sensitive financial records, product recommendations, regulated advice, or Financial Intake are collected here.'))}</p>
        <label>${escapeHTML(label('reason', 'Reason for review'))}<textarea name="reason" form="financialIntentForm">${escapeHTML(action.path.objective)}</textarea></label>
        <form id="financialIntentForm" data-financial-intent>
          <button class="btn primary" type="submit">${escapeHTML(label('saveIntent', 'Save review interest'))}</button>
        </form>
      </section>
    `;
  }
  const specific = action.path.path_type === 'clarify'
    ? clarifyConfiguration(action.path)
    : action.path.path_type === 'verify'
      ? verificationConfiguration(action.path)
      : '';
  return `
    <form data-navigation-configuration>
      ${commonConfiguration(action)}
      ${specific}
      <button class="btn primary" type="submit">${escapeHTML(label('saveConfiguration', 'Save configuration'))}</button>
    </form>
  `;
}

function observationRecorder(action) {
  if (action.execution.state !== 'active') return '';
  if (action.path.path_type === 'clarify') {
    return `
      <form class="navigation-recorder" data-navigation-recorder>
        <h3>${escapeHTML(label('recordClarification', 'Record clarification answer'))}</h3>
        <p>${escapeHTML(action.path.clarification_question)}</p>
        <label>${escapeHTML(label('answer', 'Answer'))}<textarea name="answer" required></textarea></label>
        <input type="hidden" name="evidence_class" value="clarification_answer">
        <button class="btn primary" type="submit">${escapeHTML(label('saveAnswer', 'Save answer'))}</button>
      </form>
    `;
  }
  if (action.path.path_type === 'verify') {
    return `
      <form class="navigation-recorder" data-navigation-recorder>
        <h3>${escapeHTML(label('recordVerification', 'Record verification result'))}</h3>
        <p>${escapeHTML(action.path.discriminating_condition)}</p>
        <label>${escapeHTML(label('result', 'Result'))}<textarea name="result" required></textarea></label>
        <label><input name="counter_example" type="checkbox"> ${escapeHTML(label('counterExample', 'Counter-example occurred'))}</label>
        <input type="hidden" name="evidence_class" value="verification_result">
        <button class="btn primary" type="submit">${escapeHTML(label('saveResult', 'Save result'))}</button>
      </form>
    `;
  }
  if (action.path.path_type !== 'observe') return '';
  return `
    <form class="navigation-recorder" data-navigation-recorder>
      <h3>${escapeHTML(label('quickRecord', 'Quick observation record'))}</h3>
      <div class="navigation-execution-grid">
        <label>${escapeHTML(label('date', 'Date'))}<input name="recorded_at" type="date" required></label>
        <label>${escapeHTML(label('count', 'Signal count'))}<input name="value" type="number" min="0" required></label>
        <label>${escapeHTML(label('triggerLabel', 'Trigger context'))}
          <select name="trigger">
            ${['income_change','large_payment','partner_pressure','month_end_review','fixed_bill','child_need','other'].map(value =>
              `<option value="${value}">${escapeHTML(label(`trigger.${value}`, value))}</option>`
            ).join('')}
          </select>
        </label>
        <label>${escapeHTML(label('intensity', 'Tension intensity'))}<input name="intensity" type="range" min="0" max="10" value="5"></label>
        <label><input name="decision_delayed" type="checkbox"> ${escapeHTML(label('decisionDelayed', 'Decision was delayed'))}</label>
        <label><input name="counter_example" type="checkbox"> ${escapeHTML(label('counterExample', 'Counter-example occurred'))}</label>
        <label>${escapeHTML(label('note', 'Note'))}<textarea name="user_note"></textarea></label>
      </div>
      <button class="btn primary" type="submit">${escapeHTML(label('saveLog', 'Save record'))}</button>
    </form>
  `;
}

function progress(action) {
  const value = action.progress || {};
  return `
    <section class="navigation-progress-card">
      <h3>${escapeHTML(label('progress', 'Execution progress'))}</h3>
      <div class="navigation-progress-metrics">
        <strong>${value.elapsed_days || 0} / ${value.total_days || 0} ${escapeHTML(label('days', 'days'))}</strong>
        <span>${value.log_count || 0} ${escapeHTML(label('records', 'records'))}</span>
        <span>${value.counter_example_count || 0} ${escapeHTML(label('counterExamples', 'counter-examples'))}</span>
        <span>${escapeHTML(label('nextRecord', 'Next record'))}: ${escapeHTML(cleanText(value.next_record_at) || '—')}</span>
      </div>
      <p>${escapeHTML(label('progressBoundary', 'Progress measures execution only; it does not claim that Reality has improved.'))}</p>
    </section>
  `;
}

export function renderNavigationExecution(response) {
  const root = document.querySelector('[data-navigation-execution]');
  if (!root) return { rendered: false };
  const action = activeNavigationAction(response);
  renderCustomerStatus(response, action);
  if (!action) {
    root.hidden = true;
    root.replaceChildren();
    return { rendered: false, reason: 'no_action' };
  }
  root.hidden = false;
  const state = action.execution.state;
  const intent = action.professional_handoff_intent;
  root.innerHTML = `
    <header>
      <div>
        <span>${escapeHTML(label('selectedPath', 'Selected path'))}</span>
        <h2>${escapeHTML(cleanText(response?.navigation?.selectedPath?.label || action.path.path_id))}</h2>
      </div>
      <strong class="navigation-execution-state">${escapeHTML(stateLabel(state))}</strong>
    </header>
    ${intent ? `
      <section class="navigation-intent-saved" role="status">
        <strong>${escapeHTML(label('intentSaved', 'Your Financial Reality Review interest has been saved.'))}</strong>
        <p>${escapeHTML(label('intentContinuation', 'When the relevant professional workspace opens, it can continue from this Runtime without repeating Reality Entry.'))}</p>
      </section>
    ` : ''}
    ${state === 'selected' && !intent ? configurationForm(action) : ''}
    ${state === 'configured' ? `
      <section class="navigation-configuration-summary">
        <h3>${escapeHTML(label('configurationSaved', 'Configuration saved'))}</h3>
        <dl>
          <div><dt>${escapeHTML(label('objective', 'Objective'))}</dt><dd>${escapeHTML(action.path.objective)}</dd></div>
          <div><dt>${escapeHTML(label('signal', 'Signal'))}</dt><dd>${escapeHTML(list(action.path.selected_signal).join(', '))}</dd></div>
          <div><dt>${escapeHTML(label('baseline', 'Baseline'))}</dt><dd>${escapeHTML(list(action.path.baseline).join(', '))}</dd></div>
        </dl>
        <button class="btn primary" type="button" data-start-navigation>${escapeHTML(label('start', 'Start'))}</button>
      </section>
    ` : ''}
    ${state === 'active' ? `${progress(action)}${observationRecorder(action)}
      <div class="navigation-execution-actions">
        <button class="btn" type="button" data-complete-navigation>${escapeHTML(label('completionMet', 'Completion condition met'))}</button>
        <button class="btn" type="button" data-stop-navigation>${escapeHTML(label('stopTriggered', 'Stop condition triggered'))}</button>
        <button class="btn" type="button" data-end-navigation>${escapeHTML(label('endForReview', 'End and prepare Review'))}</button>
      </div>` : ''}
    ${['completed', 'review_due'].includes(state) ? `
      ${progress(action)}
      <p class="navigation-review-ready-note">${escapeHTML(label('reviewReady', 'Execution evidence is ready for Review.'))}</p>
    ` : ''}
  `;
  return { rendered: true, state, actionId: action.navigation_action_id };
}

function split(value) {
  return cleanText(value).split(/\n|,/).map(item => item.trim()).filter(Boolean);
}

function configurationFrom(form, action) {
  const data = values(form);
  const result = {
    objective: cleanText(data.objective),
    selected_signal: split(data.selected_signal),
    baseline: split(data.baseline),
    observation_window: {
      ...action.path.observation_window,
      value: Number(data.window_value) || 7,
      unit: 'day'
    },
    frequency: { type: cleanText(data.frequency_type) || 'daily', value: 1 },
    completion_condition: split(data.completion_condition),
    stop_condition: split(data.stop_condition),
    review_condition: split(data.review_condition)
  };
  [
    'known_items', 'reported_experience', 'current_interpretation',
    'unknown_items', 'next_evidence_needed', 'supporting_evidence_ids',
    'conflicting_evidence_ids'
  ].forEach(key => {
    if (data[key] !== undefined) result[key] = split(data[key]);
  });
  [
    'clarification_question', 'primary_reading_id',
    'alternative_reading_id', 'discriminating_condition',
    'verification_signal'
  ].forEach(key => {
    if (data[key] !== undefined) result[key] = cleanText(data[key]);
  });
  return result;
}

export function bindNavigationExecution({ getResponse, onChange } = {}) {
  const submit = event => {
    const response = getResponse();
    const action = activeNavigationAction(response);
    if (event.target.matches('[data-navigation-configuration]')) {
      event.preventDefault();
      onChange(saveNavigationConfiguration(
        response,
        configurationFrom(event.target, action)
      ));
    }
    if (event.target.matches('[data-navigation-recorder]')) {
      event.preventDefault();
      const data = values(event.target);
      const evidenceClass = cleanText(data.evidence_class) ||
        (data.counter_example === 'on'
          ? 'counter_example'
          : 'user_logged_observation');
      onChange(addNavigationEvidenceLog(response, {
        ...data,
        signal: action.path.path_type === 'clarify'
          ? action.path.clarification_question
          : action.path.path_type === 'verify'
            ? action.path.verification_signal
            : list(action.path.selected_signal)[0] || '',
        value: data.answer || data.result || data.value || null,
        unit: 'count',
        intensity: Number(data.intensity),
        decision_delayed: data.decision_delayed === 'on',
        counter_example: data.counter_example === 'on',
        evidence_class: evidenceClass
      }));
    }
    if (event.target.matches('[data-financial-intent]')) {
      event.preventDefault();
      const reason = document.querySelector('[name="reason"][form="financialIntentForm"]')?.value;
      onChange(saveFinancialReviewIntent(response, { reason }));
    }
  };
  const click = event => {
    const response = getResponse();
    if (event.target.closest('[data-start-navigation]')) {
      onChange(startNavigationAction(response));
    }
    if (event.target.closest('[data-end-navigation]')) {
      onChange(triggerNavigationReview(response, 'user_end'));
    }
    if (event.target.closest('[data-complete-navigation]')) {
      onChange(triggerNavigationReview(response, 'completion_condition_met'));
    }
    if (event.target.closest('[data-stop-navigation]')) {
      onChange(triggerNavigationReview(response, 'stop_condition_triggered', {
        high_risk: true
      }));
    }
  };
  document.addEventListener('submit', submit);
  document.addEventListener('click', click);
  return () => {
    document.removeEventListener('submit', submit);
    document.removeEventListener('click', click);
  };
}
