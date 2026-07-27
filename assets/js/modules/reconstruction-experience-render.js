/*
 * M3C-W14 Reconstruction Experience renderer.
 * All three views consume the same server-authored experience contract.
 */
import {
  SESSION, cleanText, escapeHTML, getSession, postJSON, qs, safeJSON, setSession
} from '../shared.js';
import { getLocale, t, withLanguageContract } from '../i18n.js';

const list = value => Array.isArray(value) ? value : [];
const text = value => typeof value === 'string' ? cleanText(value) : '';
const itemText = value => text(
  typeof value === 'string'
    ? value
    : value?.canonical_text || value?.label || value?.description ||
      value?.reported_time || value?.raw_text || value?.explanation
);
const listHTML = (values, fallbackKey = 'reconstruction.w14.none') => {
  const items = list(values).map(itemText).filter(Boolean);
  return items.length
    ? items.map(item => `<li>${escapeHTML(item)}</li>`).join('')
    : `<li>${escapeHTML(t(fallbackKey))}</li>`;
};

function experienceOf(result) {
  return result?.reconstruction?.reconstructionExperience ||
    result?.reconstruction?.reconstruction_experience ||
    null;
}

function localizedQuestion(question, conflict) {
  if (question?.unknown_type === 'temporal_conflict' && conflict) {
    return t('reconstruction.w14.temporalQuestion', {
      first: conflict.values?.[0] || '',
      second: conflict.values?.[1] || ''
    });
  }
  return t(question?.question_key || 'reconstruction.w14.unknownQuestion');
}

function gateHTML(gate) {
  const statusKey = {
    ready: 'readingReady',
    ready_with_warnings: 'readingReadyWarnings',
    blocked: 'readingBlocked',
    stale_dependency: 'staleDependency'
  }[gate?.status] || 'readingBlocked';
  return `
    <section class="w14-gate w14-gate--${escapeHTML(gate?.status || 'blocked')}">
      <h4>${escapeHTML(t(`reconstruction.w14.${statusKey}`))}</h4>
      <p>${escapeHTML(t(`reconstruction.w14.${statusKey}Detail`))}</p>
    </section>
  `;
}

function correctionOptions(question, conflict) {
  const values = conflict?.values || [];
  return [
    { value: values[0] || '', label: values[0] || '' },
    { value: values[1] || '', label: values[1] || '' },
    { value: 'progressive_onset', label: t('reconstruction.w14.progressiveOnset') },
    { value: 'custom', label: t('reconstruction.w14.customCorrection') }
  ].filter(option => option.value);
}

function selectCorrectionForm({
  targetType,
  targetId,
  field,
  previousValue,
  options,
  labelKey = 'reconstruction.w14.correct'
}) {
  return `
    <details class="w14-inline-editor">
      <summary>${escapeHTML(t(labelKey))}</summary>
      <form
        data-inline-correction
        data-target-type="${escapeHTML(targetType)}"
        data-target-id="${escapeHTML(targetId)}"
        data-field="${escapeHTML(field)}"
        data-previous-value="${escapeHTML(previousValue || '')}"
      >
        <label>
          <span>${escapeHTML(t('reconstruction.w14.newValue'))}</span>
          <select name="correction" required>
            <option value="">${escapeHTML(t('reconstruction.w14.choose'))}</option>
            ${options.map(option => `
              <option value="${escapeHTML(option.value)}">${escapeHTML(option.label)}</option>
            `).join('')}
          </select>
        </label>
        <label data-custom-correction hidden>
          <span>${escapeHTML(t('reconstruction.w14.customCorrection'))}</span>
          <input type="text" name="customCorrection">
        </label>
        <label>
          <span>${escapeHTML(t('reconstruction.w14.correctionReason'))}</span>
          <input type="text" name="reason">
        </label>
        <div>
          <button class="btn primary" type="submit">${escapeHTML(t('reconstruction.w14.saveCorrection'))}</button>
          <button class="btn" type="reset">${escapeHTML(t('reconstruction.w14.cancel'))}</button>
        </div>
        <p data-correction-status aria-live="polite"></p>
      </form>
    </details>
  `;
}

function conditionListHTML(values) {
  const items = list(values);
  if (!items.length) return listHTML([]);
  return items.map(item => `
    <li>
      <span>${escapeHTML(item.label)}</span>
      ${selectCorrectionForm({
        targetType: 'condition',
        targetId: item.condition_id,
        field: 'condition_type',
        previousValue: item.condition_type,
        options: [
          { value: 'enhancing_condition', label: t('reconstruction.w14.enhancingCondition') },
          { value: 'counter_condition', label: t('reconstruction.w14.counterCondition') },
          { value: 'protective_condition', label: t('reconstruction.w14.protectiveCondition') }
        ]
      })}
    </li>
  `).join('');
}

function influenceListHTML(values) {
  const items = list(values);
  if (!items.length) return listHTML([]);
  return items.map(item => `
    <li>
      <span>${escapeHTML(item.explanation)}</span>
      ${selectCorrectionForm({
        targetType: 'influence_relation',
        targetId: item.relation_id,
        field: 'relation_type',
        previousValue: item.relation_type,
        options: ['amplifies', 'reduces', 'maintains', 'constrains', 'spreads_to', 'correlates_with']
          .map(value => ({ value, label: t(`reconstruction.w14.relations.${value}`) }))
      })}
    </li>
  `).join('');
}

function questionForm(question, conflict) {
  if (question.unknown_type === 'temporal_conflict') {
    return selectCorrectionForm({
      targetType: 'timeline_event',
      targetId: conflict?.conflict_id || question.question_id,
      field: 'reported_time',
      previousValue: (conflict?.values || []).join(' | '),
      options: correctionOptions(question, conflict)
    });
  }
  const options = list(question.options).length
    ? list(question.options).map(value => ({
        value,
        label: t(`reconstruction.w14.answers.${value}`, {}, value)
      }))
    : [{ value: 'custom', label: t('reconstruction.w14.enterAnswer') }];
  return selectCorrectionForm({
    targetType: 'unknown_question',
    targetId: question.question_id,
    field: 'answer',
    previousValue: '',
    options
  });
}

function customerHTML(experience) {
  const customer = experience.views?.customer || {};
  const questions = list(experience.unknown_questions);
  const conflicts = list(experience.conflicts);
  return `
    <header class="customer-reconstruction-heading">
      <p class="section-label">${escapeHTML(t('reconstruction.w14.customerView'))}</p>
      <h3>${escapeHTML(t('reconstruction.w14.currentReconstruction'))}</h3>
      <p>${escapeHTML(t('reconstruction.w14.version', {
        version: experience.reconstruction_version
      }))}</p>
    </header>
    <nav class="w14-view-tabs" aria-label="${escapeHTML(t('reconstruction.w14.viewSelector'))}">
      <button type="button" data-reconstruction-view="customer" aria-pressed="true">${escapeHTML(t('reconstruction.w14.customerView'))}</button>
      <button type="button" data-reconstruction-view="evidence" aria-pressed="false">${escapeHTML(t('reconstruction.w14.evidenceView'))}</button>
      <button type="button" data-reconstruction-view="technical" aria-pressed="false">${escapeHTML(t('reconstruction.w14.technicalView'))}</button>
    </nav>
    <div data-w14-view="customer">
      <div class="w14-customer-grid">
        <article><h4>${escapeHTML(t('reconstruction.w14.currentChange'))}</h4><p>${escapeHTML(customer.primary_change || t('reconstruction.w14.none'))}</p></article>
        <article><h4>${escapeHTML(t('reconstruction.w14.timeline'))}</h4><ol>${listHTML(customer.timeline)}</ol></article>
        <article><h4>${escapeHTML(t('reconstruction.w14.enhancingConditions'))}</h4><ul>${conditionListHTML(customer.enhancing_conditions)}</ul></article>
        <article><h4>${escapeHTML(t('reconstruction.w14.reducingConditions'))}</h4><ul>${conditionListHTML(customer.reducing_conditions)}</ul></article>
        <article><h4>${escapeHTML(t('reconstruction.w14.influenceSpread'))}</h4><ul>${influenceListHTML(customer.influence_spread)}</ul></article>
        <article><h4>${escapeHTML(t('reconstruction.w14.confirmed'))}</h4><ul>${listHTML(customer.confirmed)}</ul></article>
        <article><h4>${escapeHTML(t('reconstruction.w14.tentative'))}</h4><ul>${listHTML(customer.tentative)}</ul></article>
        <article><h4>${escapeHTML(t('reconstruction.w14.unknown'))}</h4><ul>${listHTML(customer.unknown.map(question => ({ label: localizedQuestion(question, conflicts.find(conflict => question.related_conflict_ids?.includes(conflict.conflict_id))) })))}</ul></article>
      </div>
      ${gateHTML(experience.reading_gate)}
      <section class="w14-confirmation" ${questions.length ? '' : 'hidden'}>
        <h4>${escapeHTML(t('reconstruction.w14.needsConfirmation'))}</h4>
        ${questions.map(question => {
          const conflict = conflicts.find(item => question.related_conflict_ids?.includes(item.conflict_id));
          return `
            <div data-question-id="${escapeHTML(question.question_id)}">
              <p>${escapeHTML(localizedQuestion(question, conflict))}</p>
              ${questionForm(question, conflict)}
            </div>
          `;
        }).join('')}
      </section>
    </div>
    <div data-w14-view="evidence" hidden>
      <h4>${escapeHTML(t('reconstruction.w14.evidenceView'))}</h4>
      <div class="w14-evidence-list">
        ${list(experience.views?.evidence?.items).map(item => `
          <article>
            <p>${escapeHTML(item.raw_text)}</p>
            <dl>
              <div><dt>${escapeHTML(t('reconstruction.w14.classification'))}</dt><dd>${escapeHTML(t(`reconstruction.w14.classifications.${item.classification}`))}</dd></div>
              <div><dt>${escapeHTML(t('reconstruction.w14.source'))}</dt><dd>${escapeHTML(item.source_field)}</dd></div>
              <div><dt>${escapeHTML(t('reconstruction.w14.maturity'))}</dt><dd>${escapeHTML(t(`reconstruction.w14.maturityStates.${item.maturity}`))}</dd></div>
            </dl>
            ${selectCorrectionForm({
              targetType: 'evidence',
              targetId: item.evidence_id,
              field: 'confirmation_status',
              previousValue: item.confirmation_status,
              options: [
                { value: 'confirmed', label: t('reconstruction.w14.confirmed') },
                { value: 'tentative', label: t('reconstruction.w14.tentative') },
                { value: 'contradicted', label: t('reconstruction.w14.contradicted') }
              ]
            })}
          </article>
        `).join('')}
      </div>
    </div>
    <div data-w14-view="technical" hidden>
      <h4>${escapeHTML(t('reconstruction.w14.technicalView'))}</h4>
      <p>${escapeHTML(t('reconstruction.w14.technicalDetail'))}</p>
      <dl>
        <div><dt>${escapeHTML(t('reconstruction.w14.schema'))}</dt><dd>${escapeHTML(experience.schema_version)}</dd></div>
        <div><dt>${escapeHTML(t('reconstruction.w14.confidence'))}</dt><dd>${escapeHTML(`${experience.confidence?.level || 'low'} · ${experience.confidence?.score ?? 0}`)}</dd></div>
        <div><dt>${escapeHTML(t('reconstruction.w14.conflicts'))}</dt><dd>${escapeHTML(String(experience.conflicts?.length || 0))}</dd></div>
      </dl>
    </div>
  `;
}

function downstreamArtifacts() {
  const reading = safeJSON(getSession(SESSION.reading), null);
  const navigation = safeJSON(getSession(SESSION.navigation), null);
  return [
    reading && {
      artifact_type: 'reading',
      artifact_id: text(reading.readingId || reading.runtimeReadingId || 'stored_reading'),
      status: text(reading.status) || 'current',
      based_on_reconstruction_version: Number(
        reading.basedOnReconstructionVersion || reading.reconstructionVersion || 0
      )
    },
    navigation && {
      artifact_type: 'navigation',
      artifact_id: text(navigation.navigationId || 'stored_navigation'),
      status: text(navigation.status) || 'current',
      based_on_reconstruction_version: Number(
        navigation.basedOnReconstructionVersion || navigation.reconstructionVersion || 0
      )
    }
  ].filter(Boolean);
}

async function submitCorrection(form, result, experience, onUpdated) {
  const status = form.querySelector('[data-correction-status]');
  const selected = text(form.elements.correction?.value);
  const custom = text(form.elements.customCorrection?.value);
  const newValue = selected === 'custom'
    ? custom
    : selected === 'progressive_onset'
      ? t('reconstruction.w14.progressiveOnsetValue')
      : selected;
  if (!newValue) {
    status.textContent = t('reconstruction.w14.correctionRequired');
    return;
  }
  status.textContent = t('reconstruction.w14.savingCorrection');
  const response = await postJSON('/api/reconstruct-runtime', withLanguageContract({
    runtimeEntry: result.runtimeEntry,
    previousReconstruction: experience,
    downstreamArtifacts: downstreamArtifacts(),
    correction: {
      target_type: text(form.dataset.targetType),
      target_id: text(form.dataset.targetId),
      field: text(form.dataset.field),
      previous_value: text(form.dataset.previousValue),
      new_value: newValue,
      reason: text(form.elements.reason?.value),
      source: 'customer_inline_correction'
    },
    outputLanguage: getLocale()
  }, newValue));
  if (!response?.success) throw new Error(response?.error || t('reconstruction.w14.correctionFailed'));
  list(response?.reconstruction?.downstreamStaleness).forEach(record => {
    const key = record.artifact_type === 'reading'
      ? SESSION.reading
      : record.artifact_type === 'navigation'
        ? SESSION.navigation
        : null;
    if (!key) return;
    const artifact = safeJSON(getSession(key), null);
    if (!artifact) return;
    setSession(key, {
      ...artifact,
      status: record.status,
      staleness: record,
      basedOnReconstructionVersion: record.based_on_reconstruction_version,
      currentReconstructionVersion: record.current_reconstruction_version
    });
  });
  setSession(SESSION.reconstruction, response);
  setSession(SESSION.entry, {
    ...(safeJSON(getSession(SESSION.entry), {}) || {}),
    runtimeEntry: response.runtimeEntry
  });
  status.textContent = t('reconstruction.w14.correctionSaved');
  onUpdated?.(response);
}

export function renderReconstructionExperience(result, options = {}) {
  const experience = experienceOf(result);
  const root = qs('#entrySection');
  if (!experience || !root) return { rendered: false, reason: 'experience_unavailable' };
  root.innerHTML = customerHTML(experience);
  root.querySelectorAll('[data-reconstruction-view]').forEach(button => {
    button.addEventListener('click', () => {
      const selected = button.dataset.reconstructionView;
      root.querySelectorAll('[data-reconstruction-view]').forEach(item =>
        item.setAttribute('aria-pressed', String(item === button))
      );
      root.querySelectorAll('[data-w14-view]').forEach(view => {
        view.hidden = view.dataset.w14View !== selected;
      });
    });
  });
  root.querySelectorAll('[name="correction"]').forEach(input => {
    input.addEventListener('change', event => {
      const custom = event.target.form.querySelector('[data-custom-correction]');
      custom.hidden = event.target.value !== 'custom';
    });
  });
  root.querySelectorAll('[data-inline-correction]').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      submitCorrection(form, result, experience, options.onUpdated).catch(error => {
        form.querySelector('[data-correction-status]').textContent =
          error?.message || t('reconstruction.w14.correctionFailed');
      });
    });
  });
  return {
    rendered: true,
    version: experience.reconstruction_version,
    readingGate: experience.reading_gate
  };
}

export default renderReconstructionExperience;
