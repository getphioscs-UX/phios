/*
 * M3C-W13 Reading Experience renderer.
 * Purely projects the server contract; it never mutates Runtime state.
 */
import { escapeHTML, cleanText } from '../shared.js';
import { t } from '../i18n.js';

function list(value) {
  return Array.isArray(value) ? value : [];
}

function json(value) {
  return escapeHTML(JSON.stringify(value, null, 2));
}

function setHTML(selector, html) {
  const element = document.querySelector(selector);
  if (element) element.innerHTML = html;
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = cleanText(value);
}

function label(key) {
  return t(`reading.experience.summary.${key}`, {}, key.replaceAll('_', ' '));
}

function renderSummary(experience) {
  const summary = experience.summary || {};
  setText(
    '[data-reading-experience-field="one_sentence_reading"]',
    summary.one_sentence_reading
  );
  const keys = [
    'what_changed',
    'operating_pattern',
    'protective_function',
    'current_cost',
    'current_tension'
  ];
  setHTML('[data-reading-summary]', keys.map(key => `
    <article>
      <span>${escapeHTML(label(key))}</span>
      <p>${escapeHTML(cleanText(summary[key]))}</p>
    </article>
  `).join(''));
}

function renderChain(experience) {
  setHTML('[data-reading-runtime-chain]', list(experience.runtime_chain).map(item => `
    <li>
      <span>${String(item.order).padStart(2, '0')}</span>
      <div>
        <strong>${escapeHTML(cleanText(item.label))}</strong>
        <p>${escapeHTML(cleanText(item.statement))}</p>
      </div>
    </li>
  `).join(''));
}

function renderPriority(experience) {
  const items = list(experience.priority_evidence);
  setHTML('[data-reading-priority-customer]', items.map(item => `
    <li>
      <strong>${escapeHTML(cleanText(item.canonical_text))}</strong>
      <p>${escapeHTML(cleanText(item.reason_selected))}</p>
      <small>${escapeHTML(t(
        `reading.experience.classification.${item.classification}`,
        {},
        cleanText(item.classification)
      ))}</small>
    </li>
  `).join(''));

  setHTML('[data-reading-priority-evidence]', items.map(item => `
    <article class="reading-evidence-card">
      <header>
        <span>${escapeHTML(t('reading.experience.priorityNumber', { count: item.priority }))}</span>
        <strong>${escapeHTML(t(
          `reading.experience.classification.${item.classification}`,
          {},
          cleanText(item.classification)
        ))}</strong>
      </header>
      <p>${escapeHTML(cleanText(item.canonical_text))}</p>
      <dl>
        <div><dt>${escapeHTML(t('reading.experience.confirmation'))}</dt><dd>${escapeHTML(cleanText(item.confirmation_status))}</dd></div>
        <div><dt>${escapeHTML(t('reading.experience.sourceSummary'))}</dt><dd>${escapeHTML(t('reading.experience.sourceCount', { count: item.source_count }))}</dd></div>
        <div><dt>${escapeHTML(t('reading.experience.supports'))}</dt><dd>${escapeHTML(list(item.supports).map(label).join(' · '))}</dd></div>
      </dl>
      <details>
        <summary>${escapeHTML(t('reading.experience.viewLineage'))}</summary>
        <pre>${json({ source_ids: item.source_ids, lineage: item.lineage })}</pre>
      </details>
    </article>
  `).join(''));
}

function percent(value) {
  const normalized = Math.max(0, Math.min(1, Number(value) || 0));
  return `${Math.round(normalized * 100)}%`;
}

function renderConfidenceComponents(experience) {
  const components = experience.confidence?.components || {};
  const values = [
    components.evidence_coverage,
    components.pattern_consistency,
    1 - (Number(components.interpretation_ratio) || 0),
    components.unknown_penalty
  ];
  const rows = document.querySelectorAll(
    '[data-reading-confidence-components] dd'
  );
  rows.forEach((row, index) => {
    row.textContent = percent(values[index]);
  });
}

function renderCustomerUnknowns(experience) {
  const priority = list(experience.priority_evidence);
  const unconfirmed = priority.filter(item =>
    !['confirmed', 'verified'].includes(cleanText(item.confirmation_status))
  );
  const observeNext = list(experience.alternative_reading?.evidence_needed);
  const mayChange = priority.filter(item => item.counter_evidence === true);
  const render = (selector, values, text) => {
    setHTML(selector, values.length
      ? values.map(item => `<li>${escapeHTML(cleanText(text(item)))}</li>`).join('')
      : `<li>${escapeHTML(t('reading.dynamic.notEstablished'))}</li>`);
  };
  render('[data-reading-unconfirmed]', unconfirmed, item => item.canonical_text);
  render('[data-reading-observe-next]', observeNext, item => item);
  render('[data-reading-may-change]', mayChange, item => item.canonical_text);
}

function renderEvidenceSummary(response) {
  const boundary = response?.reading?.evidenceBoundary || {};
  const values = [
    list(boundary.observedEvidence).length,
    list(boundary.reportedExperience).length,
    list(boundary.interpretation).length,
    list(boundary.unknownReality).length
  ];
  document.querySelectorAll('[data-reading-evidence-summary] dd')
    .forEach((row, index) => {
      row.textContent = String(values[index]);
    });
}

function renderInterpretation(experience) {
  const alternative = experience.alternative_reading || {};
  setHTML('[data-reading-alternative]', `
    <strong>${escapeHTML(cleanText(alternative.summary))}</strong>
    <p>${escapeHTML(t(`reading.experience.alternativeStatus.${alternative.status}`, {}, alternative.status))}</p>
    ${list(alternative.evidence_needed).length ? `
      <ul>${list(alternative.evidence_needed).map(item => `<li>${escapeHTML(cleanText(item))}</li>`).join('')}</ul>
    ` : ''}
  `);
  const confidence = experience.confidence || {};
  setHTML('[data-reading-confidence-explanation]', `
    <strong>${escapeHTML(t(
      `reading.experience.confidenceLevel.${confidence.customer_level}`,
      {},
      cleanText(confidence.customer_level)
    ))}</strong>
    <p>${escapeHTML(cleanText(confidence.customer_explanation))}</p>
  `);
}

function renderQuestions(experience) {
  setHTML('[data-reading-unknown-questions]', list(experience.unknown_questions).map(item => `
    <li>
      <strong>${escapeHTML(cleanText(item.question))}</strong>
      <small>${escapeHTML(t(
        `reading.experience.materiality.${item.materiality}`,
        {},
        cleanText(item.materiality)
      ))}</small>
    </li>
  `).join('') || `<li>${escapeHTML(t('reading.experience.noOpenQuestions'))}</li>`);
}

function renderNavigation(experience) {
  const value = experience.navigation_rationale || {};
  setHTML('[data-reading-navigation-rationale]', `
    <span>${escapeHTML(t('reading.experience.navigationTitle'))}</span>
    <strong>${escapeHTML(t(
      value.ready
        ? 'reading.experience.navigationReady'
        : 'reading.experience.navigationBlocked'
    ))}</strong>
    <p>${escapeHTML(cleanText(value.rationale))}</p>
  `);
}

function renderTechnical(response, experience) {
  const reading = response.reading || {};
  const inference = response.inference || {};
  const blocks = [
    ['Reading Contract', {
      reading: reading.schemaVersion,
      experience: experience.schema_version,
      source_versions: experience.source_versions,
      boundary: experience.boundary
    }],
    ['Runtime Metadata', {
      runtime_entity_id: reading.runtimeEntityId,
      runtime_entry_id: reading.runtimeEntryId,
      reading_method: reading.readingMethod,
      provider: inference.provider,
      paid_inference_used: inference.paidInferenceUsed,
      storage: response.persistence
    }],
    ['Evidence Model', {
      priority_evidence: experience.priority_evidence,
      unknown_questions: experience.unknown_questions
    }],
    ['Confidence Components', experience.confidence?.components],
    ['Revision History', experience.revision],
    ['Navigation Handoff', {
      rationale: experience.navigation_rationale,
      frozen_contract: reading.navigationHandoff
    }]
  ];
  setHTML('[data-reading-technical-grid]', blocks.map(([title, value]) => `
    <article>
      <h5>${escapeHTML(title)}</h5>
      <pre>${json(value || {})}</pre>
    </article>
  `).join(''));
}

function bindTabs(root) {
  if (root.dataset.tabsBound === 'true') return;
  root.dataset.tabsBound = 'true';
  root.querySelectorAll('[data-reading-experience-tab]').forEach(button => {
    button.addEventListener('click', () => {
      const selected = button.dataset.readingExperienceTab;
      root.querySelectorAll('[data-reading-experience-tab]').forEach(item => {
        item.setAttribute('aria-selected', item === button ? 'true' : 'false');
      });
      root.querySelectorAll('[data-reading-experience-panel]').forEach(panel => {
        const active = panel.dataset.readingExperiencePanel === selected;
        panel.hidden = !active;
        panel.classList.toggle('is-active', active);
      });
    });
  });
}

export function renderReadingExperience(response) {
  const experience = response?.reading?.readingExperience;
  const root = document.querySelector('[data-reading-experience]');
  const legacy = document.querySelector('.reading-customer-views');
  if (!root || !experience) return { rendered: false, reason: 'experience_missing' };
  root.hidden = false;
  if (legacy) legacy.hidden = true;
  renderSummary(experience);
  renderChain(experience);
  renderPriority(experience);
  renderConfidenceComponents(experience);
  renderCustomerUnknowns(experience);
  renderEvidenceSummary(response);
  renderInterpretation(experience);
  renderQuestions(experience);
  renderNavigation(experience);
  renderTechnical(response, experience);
  bindTabs(root);
  return {
    rendered: true,
    schemaVersion: experience.schema_version,
    priorityEvidenceCount: list(experience.priority_evidence).length
  };
}

export default renderReadingExperience;
