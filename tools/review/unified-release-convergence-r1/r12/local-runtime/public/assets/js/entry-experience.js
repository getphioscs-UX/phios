import { onLocaleChange, t } from './i18n.js';

const form = document.querySelector('#chatForm');
const input = document.querySelector('#messageInput');
const send = document.querySelector('#sendButton');
const loading = document.querySelector('#loadingText');
const status = document.querySelector('#entryExperienceStatus');
const returnButton = document.querySelector('#entryReturnToInput');
const liveSections = document.querySelector('#liveEntrySections');

function composerState() {
  if (loading?.dataset.tone === 'error') return 'failed';
  if (input?.disabled && send?.disabled) return 'submitting';
  if (document.activeElement === input && input?.value.trim()) return 'inputting';
  return 'idle';
}

function renderComposerState() {
  if (!form || !status) return;
  const state = composerState();
  form.dataset.entryComposerState = state;
  status.textContent = t(`entry.experience.${state}`);
  returnButton?.classList.toggle('hidden', state !== 'failed');
}

function renderClarity() {
  liveSections?.querySelectorAll('.live-entry-block').forEach(block => {
    const clarity = block.classList.contains('is-empty') ? 'pending' : 'clear';
    block.dataset.clarity = clarity;
    block.dataset.clarityLabel = t(`entry.experience.${clarity}`);
    block.setAttribute(
      'aria-label',
      `${t(`entry.experience.${clarity}`)}: ${block.querySelector('h3')?.textContent?.trim() || ''}`
    );
  });
}

returnButton?.addEventListener('click', () => {
  input?.focus();
});

input?.addEventListener('focus', renderComposerState);
input?.addEventListener('blur', renderComposerState);
input?.addEventListener('input', renderComposerState);
form?.addEventListener('submit', () => queueMicrotask(renderComposerState));

const observer = new MutationObserver(() => {
  renderComposerState();
  renderClarity();
});

if (form) {
  observer.observe(form, {
    attributes: true,
    subtree: true,
    childList: true,
    attributeFilter: ['class', 'disabled', 'data-tone']
  });
}
if (liveSections) {
  observer.observe(liveSections, {
    attributes: true,
    subtree: true,
    childList: true,
    attributeFilter: ['class']
  });
}

onLocaleChange(() => {
  renderComposerState();
  renderClarity();
});

renderComposerState();
renderClarity();
