import {
  SESSION_KEYS
} from '../core/session.js';

import { RuntimeKernel } from '../runtime/index.js';

import {
  initializeI18n,
  onLocaleChange,
  t
} from '../i18n.js';

/*
 * Initialize the interface language before registering
 * the landing-page interactions.
 */
initializeI18n();

const form = document.querySelector('#reality-entry-form');
const input = document.querySelector('#homeRealityInput');
const submit = document.querySelector('#entryInput');
const error = document.querySelector('#entry-error');

const switcher = document.querySelector('.journey-switcher');
const panel = document.querySelector('#journey-panel');

/*
 * Open or close the Journey panel.
 */
function setJourneyPanel(opening) {
  if (!panel || !switcher) {
    return;
  }

  panel.hidden = !opening;

  switcher.setAttribute(
    'aria-expanded',
    String(opening)
  );
}

switcher?.addEventListener('click', () => {
  const opening = panel?.hidden !== false;

  setJourneyPanel(opening);
});

/*
 * Allow the Journey panel to be closed with Escape.
 */
document.addEventListener('keydown', event => {
  if (
    event.key === 'Escape' &&
    panel?.hidden === false
  ) {
    setJourneyPanel(false);
    switcher?.focus();
  }
});

/*
 * Insert the selected example into the Reality Entry box.
 *
 * The actual prompt comes from en.js or zh-Hans.js, so the
 * inserted sentence follows the currently selected language.
 */
document
  .querySelectorAll('[data-prompt-key]')
  .forEach(button => {
    button.addEventListener('click', () => {
      if (!input) {
        return;
      }

      const promptKey = button.dataset.promptKey;

      input.value = promptKey
        ? t(promptKey)
        : '';

      input.focus();

      if (error) {
        error.hidden = true;
      }
    });
  });

/*
 * If the user changes language while an empty-input error is
 * visible, translate the error immediately.
 */
onLocaleChange(() => {
  if (
    error &&
    !error.hidden
  ) {
    error.textContent = t('home.emptyInput');
  }
});

/*
 * Store the first observation and begin Reality Entry.
 */
form?.addEventListener('submit', event => {
  event.preventDefault();

  if (!input || !submit || !error) {
    return;
  }

  const message = input.value.trim();

  if (!message) {
    error.textContent = t('home.emptyInput');
    error.hidden = false;

    input.focus();
    return;
  }

  error.hidden = true;
  submit.disabled = true;

  sessionStorage.setItem(
    SESSION_KEYS.initialMessage,
    message
  );

  RuntimeKernel.initializeRuntime({ createEntity: true, userInitiated: true });

  window.location.assign('/reality-entry');
});
