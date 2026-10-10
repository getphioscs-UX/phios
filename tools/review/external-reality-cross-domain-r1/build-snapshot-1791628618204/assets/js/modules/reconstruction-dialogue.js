/*
 * PHI OS Reconstruction Inquiry
 * Collects target-bound reported experience before Reality Reading.
 */

import {
  requestRuntimeReconstruction,
  readReconstructionInquirySession,
  storeReconstructionResult
} from './reconstruction-loader.js';

import {
  SESSION,
  cleanText,
  escapeHTML,
  qs,
  setSession
} from '../shared.js';

import { t } from '../i18n.js';

const state = {
  initialized: false,
  submitting: false,
  result: null,
  getRuntimeEntry: null,
  getConversation: null,
  onResult: null
};

const TARGETS = Object.freeze([
  'carrier_coordinates',
  'runtime_conditions',
  'experience_style',
  'expression_style',
  'agency_style',
  'identity_style'
]);

function elements() {
  return {
    panel: qs('#reconstructionInquiry'),
    progress: qs('#inquiryProgress'),
    steps: qs('#inquirySteps'),
    target: qs('#inquiryTarget'),
    question: qs('#inquiryQuestion'),
    history: qs('#inquiryHistory'),
    form: qs('#inquiryForm'),
    input: qs('#inquiryAnswer'),
    submit: qs('#submitInquiryAnswer'),
    status: qs('#inquiryStatus')
  };
}

function renderSteps(container, inquiry, answers) {
  if (!container) return;

  const answeredTargets = new Set(
    answers.map(answer => cleanText(answer.target))
  );

  container.innerHTML = TARGETS.map((target, index) => {
    const complete = answeredTargets.has(target);
    const current = !inquiry.complete && inquiry.currentTarget === target;
    const stateClass = complete
      ? 'is-complete'
      : current
        ? 'is-current'
        : '';

    return `
      <span class="inquiry-step ${stateClass}">
        <b>${complete ? '✓' : String(index + 1).padStart(2, '0')}</b>
        <small>${escapeHTML(targetLabel(target))}</small>
      </span>
    `;
  }).join('');
}

function targetLabel(target) {
  return t(
    `reconstruction.inquiryTargets.${cleanText(target)}`,
    {},
    cleanText(target).replaceAll('_', ' ')
  );
}

function renderHistory(container, answers) {
  if (!container) return;

  if (!answers.length) {
    container.innerHTML = `
      <p class="inquiry-empty">
        ${escapeHTML(t('reconstruction.inquiryNoAnswers'))}
      </p>
    `;
    return;
  }

  container.innerHTML = answers.map((answer, index) => `
    <article class="inquiry-answer">
      <span>${escapeHTML(String(index + 1).padStart(2, '0'))}</span>
      <div>
        <strong>${escapeHTML(targetLabel(answer.target))}</strong>
        <p>${escapeHTML(cleanText(answer.statement || answer.content))}</p>
      </div>
    </article>
  `).join('');
}

export function renderReconstructionDialogue(result = state.result) {
  state.result = result;

  const els = elements();
  const inquiry = result?.reconstruction?.inquiry;

  if (!els.panel || !inquiry) return false;

  if (inquiry.collectedInEntry === true) {
    els.panel.classList.add('hidden');
    return true;
  }

  els.panel.classList.remove('hidden');

  const answers = Array.isArray(inquiry.answers)
    ? inquiry.answers
    : readReconstructionInquirySession();

  renderHistory(els.history, answers);
  renderSteps(els.steps, inquiry, answers);

  if (els.progress) {
    els.progress.textContent = t(
      'reconstruction.inquiryProgress',
      {
        answered: inquiry.answeredCount || 0,
        total: inquiry.totalTargets || 6
      }
    );
  }

  if (inquiry.complete) {
    if (els.target) {
      els.target.textContent = t('reconstruction.inquiryCompleteLabel');
    }
    if (els.question) {
      els.question.textContent = t('reconstruction.inquiryCompleteDetail');
    }
    els.form?.classList.add('hidden');
    if (els.status) {
      els.status.textContent = t('reconstruction.inquiryCompleteStatus');
    }
    return true;
  }

  if (els.target) {
    els.target.textContent = inquiry.currentLabel || targetLabel(inquiry.currentTarget);
  }
  if (els.question) {
    els.question.textContent = t(
      `reconstruction.inquiryQuestions.${inquiry.currentTarget}`,
      {},
      inquiry.currentQuestion || t('reconstruction.inquiryFallbackQuestion')
    );
  }
  els.form?.classList.remove('hidden');
  if (els.input) {
    els.input.disabled = state.submitting;
    els.input.placeholder = t('reconstruction.inquiryPlaceholder');
  }
  if (els.submit) {
    els.submit.disabled = state.submitting;
    els.submit.textContent = state.submitting
      ? t('reconstruction.inquirySubmitting')
      : t('reconstruction.inquirySubmit');
  }

  return true;
}

async function submitAnswer(event) {
  event.preventDefault();
  if (state.submitting) return;

  const els = elements();
  const inquiry = state.result?.reconstruction?.inquiry;
  const statement = cleanText(els.input?.value);

  if (!inquiry || inquiry.complete || !cleanText(inquiry.currentTarget)) return;

  if (!statement) {
    if (els.status) {
      els.status.textContent = t('reconstruction.inquiryAnswerRequired');
    }
    return;
  }

  const previousAnswers = readReconstructionInquirySession();
  const answers = [
    ...previousAnswers.filter(answer => answer.target !== inquiry.currentTarget),
    {
      target: inquiry.currentTarget,
      statement,
      answeredAt: new Date().toISOString()
    }
  ];

  state.submitting = true;
  if (els.status) {
    els.status.textContent = t('reconstruction.inquirySubmitting');
  }
  renderReconstructionDialogue();

  try {
    const runtimeEntry =
      state.result?.runtimeEntry ||
      state.getRuntimeEntry?.();

    const result = await requestRuntimeReconstruction({
      runtimeEntry,
      conversation: state.getConversation?.() || [],
      reconstructionAnswers: answers
    });

    setSession(SESSION.reconstructionInquiry, answers);
    storeReconstructionResult(result);
    state.result = result;

    if (els.input) els.input.value = '';

    if (typeof state.onResult === 'function') {
      state.onResult(result, answers);
    }

    if (els.status) {
      els.status.textContent = t('reconstruction.inquiryAnswerRecorded');
    }
  } catch (error) {
    if (els.status) {
      els.status.textContent = cleanText(error?.message) || t('reconstruction.generationFailed');
    }
  } finally {
    state.submitting = false;
    renderReconstructionDialogue();
  }
}

export function initializeReconstructionDialogue(options = {}) {
  state.getRuntimeEntry = options.getRuntimeEntry;
  state.getConversation = options.getConversation;
  state.onResult = options.onResult;

  if (!state.initialized) {
    elements().form?.addEventListener('submit', submitAnswer);
    state.initialized = true;
  }

  if (options.result) {
    renderReconstructionDialogue(options.result);
  }

  return { initialized: state.initialized };
}

export function getReconstructionDialogueStatus() {
  const inquiry = state.result?.reconstruction?.inquiry;
  return {
    initialized: state.initialized,
    submitting: state.submitting,
    answeredCount: inquiry?.answeredCount || 0,
    totalTargets: inquiry?.totalTargets || 6,
    complete: inquiry?.complete === true
  };
}
