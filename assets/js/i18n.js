import en from './locales/en.js';
import zhHans from './locales/zh-Hans.js';

/*
 * PHI OS front-end internationalisation runtime
 *
 * Responsibilities:
 * - Detect and remember the user's interface language.
 * - Translate static interface text.
 * - Maintain one language across the Runtime Journey.
 * - Build the language contract sent to Runtime APIs.
 *
 * Translation content belongs in:
 * - ./locales/en.js
 * - ./locales/zh-Hans.js
 */

export const DEFAULT_LOCALE = 'en';
export const LOCALE_STORAGE_KEY = 'phiOSLocale';
export const LOCALE_CHANGE_EVENT = 'phios:localechange';

export const SUPPORTED_LOCALES = Object.freeze([
  'en',
  'zh-Hans'
]);

export const SUPPORTED_LANGUAGES = Object.freeze([
  'en',
  'zh'
]);

const dictionaries = Object.freeze({
  en,
  'zh-Hans': zhHans
});

let currentLocale = DEFAULT_LOCALE;
let initialized = false;

function cleanText(value) {
  return typeof value === 'string'
    ? value.trim()
    : '';
}

function matchSupportedLocale(value) {
  const normalized = cleanText(value)
    .toLowerCase()
    .replace(/_/g, '-');

  if (!normalized) {
    return '';
  }

  if (normalized === 'zh' || normalized.startsWith('zh-')) {
    return 'zh-Hans';
  }

  if (normalized === 'en' || normalized.startsWith('en-')) {
    return 'en';
  }

  return '';
}

export function normalizeLocale(value, fallback = DEFAULT_LOCALE) {
  return matchSupportedLocale(value) || fallback;
}

export function localeToLanguage(locale = currentLocale) {
  return normalizeLocale(locale) === 'zh-Hans'
    ? 'zh'
    : 'en';
}

export function detectTextLanguage(
  value,
  fallback = localeToLanguage(currentLocale)
) {
  const text = cleanText(value);

  if (!text) {
    return fallback;
  }

  const containsChinese =
    /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/u.test(text);

  return containsChinese ? 'zh' : 'en';
}

function readStoredLocale() {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    return matchSupportedLocale(
      window.localStorage.getItem(LOCALE_STORAGE_KEY)
    );
  } catch {
    return '';
  }
}

function storeLocale(locale) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      LOCALE_STORAGE_KEY,
      normalizeLocale(locale)
    );
  } catch {
    // Language preference can remain in memory if storage is unavailable.
  }
}

function readQueryLocale() {
  if (
    typeof window === 'undefined' ||
    typeof URLSearchParams === 'undefined'
  ) {
    return '';
  }

  try {
    const parameters = new URLSearchParams(window.location.search);

    return matchSupportedLocale(
      parameters.get('lang') ||
      parameters.get('locale')
    );
  } catch {
    return '';
  }
}

function readBrowserLocale() {
  if (typeof navigator === 'undefined') {
    return '';
  }

  const candidates = Array.isArray(navigator.languages)
    ? navigator.languages
    : [navigator.language];

  for (const candidate of candidates) {
    const locale = matchSupportedLocale(candidate);

    if (locale) {
      return locale;
    }
  }

  return '';
}

function readDocumentLocale() {
  if (typeof document === 'undefined') {
    return '';
  }

  return matchSupportedLocale(
    document.documentElement?.lang
  );
}

export function detectInitialLocale() {
  return (
    readQueryLocale() ||
    readStoredLocale() ||
    readBrowserLocale() ||
    readDocumentLocale() ||
    DEFAULT_LOCALE
  );
}

function getNestedValue(dictionary, key) {
  if (!dictionary || !key) {
    return undefined;
  }

  return key
    .split('.')
    .reduce((current, part) => {
      if (
        current &&
        typeof current === 'object' &&
        Object.prototype.hasOwnProperty.call(current, part)
      ) {
        return current[part];
      }

      return undefined;
    }, dictionary);
}

function interpolate(template, variables = {}) {
  if (typeof template !== 'string') {
    return '';
  }

  return template.replace(
    /\{([a-zA-Z0-9_]+)\}/g,
    (match, variableName) => {
      if (
        Object.prototype.hasOwnProperty.call(
          variables,
          variableName
        )
      ) {
        return String(variables[variableName]);
      }

      return match;
    }
  );
}

export function getLocale() {
  return currentLocale;
}

export function getLanguage() {
  return localeToLanguage(currentLocale);
}

export function isLocale(locale) {
  return currentLocale === normalizeLocale(locale);
}

export function t(key, variables = {}, fallback = '') {
  const selectedDictionary = dictionaries[currentLocale] || {};
  const fallbackDictionary = dictionaries[DEFAULT_LOCALE] || {};

  const selectedValue = getNestedValue(
    selectedDictionary,
    key
  );

  const fallbackValue = getNestedValue(
    fallbackDictionary,
    key
  );

  const resolvedValue =
    typeof selectedValue === 'string'
      ? selectedValue
      : typeof fallbackValue === 'string'
        ? fallbackValue
        : fallback || key;

  return interpolate(resolvedValue, variables);
}

function applyDocumentLocale() {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.lang = currentLocale;
  document.documentElement.dir = 'ltr';
}

function translateTextContent(root) {
  root.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');

    if (key) {
      element.textContent = t(key);
    }
  });
}

function translateAttribute(
  root,
  selector,
  dataAttribute,
  targetAttribute
) {
  root.querySelectorAll(selector).forEach(element => {
    const key = element.getAttribute(dataAttribute);

    if (key) {
      element.setAttribute(targetAttribute, t(key));
    }
  });
}

function updateLocaleControls(root) {
  root.querySelectorAll('[data-locale]').forEach(element => {
    const elementLocale = normalizeLocale(
      element.getAttribute('data-locale')
    );

    const isActive = elementLocale === currentLocale;

    element.setAttribute(
      'aria-pressed',
      String(isActive)
    );

    element.classList.toggle(
      'is-active',
      isActive
    );
  });
}

export function translatePage(
  root = typeof document !== 'undefined'
    ? document
    : null
) {
  if (!root || typeof root.querySelectorAll !== 'function') {
    return;
  }

  translateTextContent(root);

  translateAttribute(
    root,
    '[data-i18n-placeholder]',
    'data-i18n-placeholder',
    'placeholder'
  );

  translateAttribute(
    root,
    '[data-i18n-aria-label]',
    'data-i18n-aria-label',
    'aria-label'
  );

  translateAttribute(
    root,
    '[data-i18n-title]',
    'data-i18n-title',
    'title'
  );

  translateAttribute(
    root,
    '[data-i18n-value]',
    'data-i18n-value',
    'value'
  );

  updateLocaleControls(root);
}

function emitLocaleChange(previousLocale) {
  if (
    typeof window === 'undefined' ||
    typeof CustomEvent === 'undefined'
  ) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(LOCALE_CHANGE_EVENT, {
      detail: {
        previousLocale,
        locale: currentLocale,
        language: getLanguage()
      }
    })
  );
}

export function setLocale(
  locale,
  {
    persist = true,
    translate = true,
    emit = true
  } = {}
) {
  const nextLocale = normalizeLocale(locale);
  const previousLocale = currentLocale;

  currentLocale = nextLocale;

  if (persist) {
    storeLocale(currentLocale);
  }

  applyDocumentLocale();

  if (translate) {
    translatePage();
  }

  if (emit && previousLocale !== currentLocale) {
    emitLocaleChange(previousLocale);
  }

  return currentLocale;
}

export function bindLocaleControls(
  root = typeof document !== 'undefined'
    ? document
    : null
) {
  if (!root || typeof root.querySelectorAll !== 'function') {
    return;
  }

  root.querySelectorAll('[data-locale]').forEach(element => {
    if (element.dataset.i18nLocaleBound === 'true') {
      return;
    }

    element.dataset.i18nLocaleBound = 'true';

    element.addEventListener('click', event => {
      event.preventDefault();

      const requestedLocale =
        element.getAttribute('data-locale');

      setLocale(requestedLocale);
    });
  });

  updateLocaleControls(root);
}

export function getLanguageContract(userText = '') {
  const outputLanguage = getLanguage();

  return {
    locale: currentLocale,
    inputLanguage: detectTextLanguage(
      userText,
      outputLanguage
    ),
    outputLanguage
  };
}

export function withLanguageContract(
  payload = {},
  userText = ''
) {
  return {
    ...payload,
    ...getLanguageContract(userText)
  };
}

export function onLocaleChange(listener) {
  if (
    typeof window === 'undefined' ||
    typeof listener !== 'function'
  ) {
    return () => {};
  }

  const handler = event => {
    listener(event.detail);
  };

  window.addEventListener(
    LOCALE_CHANGE_EVENT,
    handler
  );

  return () => {
    window.removeEventListener(
      LOCALE_CHANGE_EVENT,
      handler
    );
  };
}

export function initializeI18n({
  locale,
  root = typeof document !== 'undefined'
    ? document
    : null,
  persist = true
} = {}) {
  currentLocale = normalizeLocale(
    locale || detectInitialLocale()
  );

  if (persist) {
    storeLocale(currentLocale);
  }

  applyDocumentLocale();
  translatePage(root);
  bindLocaleControls(root);

  initialized = true;

  return {
    initialized,
    locale: currentLocale,
    language: getLanguage()
  };
}

export function isI18nInitialized() {
  return initialized;
}

export default {
  initialize: initializeI18n,
  translatePage,
  setLocale,
  getLocale,
  getLanguage,
  getLanguageContract,
  withLanguageContract,
  onLocaleChange,
  t
};
