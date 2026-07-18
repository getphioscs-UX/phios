/**
 * PHI OS Runtime Locale Resolver.
 *
 * Server-side Runtime copy resolver.
 * Frontend UI copy remains under assets/js/locales.
 */

import NAVIGATION_RUNTIME_EN from
  './en/navigation.js';

import NAVIGATION_RUNTIME_ZH_HANS from
  './zh-Hans/navigation.js';

export const RUNTIME_SUPPORTED_LOCALES = Object.freeze([
  'en',
  'zh-Hans'
]);

export const RUNTIME_SUPPORTED_OUTPUT_LANGUAGES = Object.freeze([
  'en',
  'zh'
]);

function cleanText(value) {
  return typeof value === 'string'
    ? value.trim()
    : '';
}

export function normalizeRuntimeOutputLanguage(value) {
  const language = cleanText(value)
    .toLowerCase()
    .replaceAll('_', '-');

  if (
    language === 'zh' ||
    language.startsWith('zh-') ||
    language === 'cn' ||
    language === 'chinese'
  ) {
    return 'zh';
  }

  return 'en';
}

export function normalizeRuntimeLocale(value) {
  const locale = cleanText(value)
    .toLowerCase()
    .replaceAll('_', '-');

  if (
    locale === 'zh' ||
    locale.startsWith('zh-') ||
    locale === 'cn' ||
    locale === 'chinese'
  ) {
    return 'zh-Hans';
  }

  return 'en';
}

export function resolveRuntimeLanguageContract(
  source = {},
  options = {}
) {
  const sourceContract =
    source?.languageContract &&
    typeof source.languageContract === 'object'
      ? source.languageContract
      : {};

  const outputLanguage =
    normalizeRuntimeOutputLanguage(
      options.outputLanguage ||
      options.language ||
      options.locale ||
      sourceContract.outputLanguage ||
      source.outputLanguage ||
      source.locale
    );

  return {
    locale:
      outputLanguage === 'zh'
        ? 'zh-Hans'
        : 'en',

    outputLanguage
  };
}

export function resolveNavigationRuntimeCopy(
  source = {},
  options = {}
) {
  const languageContract =
    resolveRuntimeLanguageContract(
      source,
      options
    );

  return languageContract.outputLanguage === 'zh'
    ? NAVIGATION_RUNTIME_ZH_HANS
    : NAVIGATION_RUNTIME_EN;
}

export default {
  supportedLocales:
    RUNTIME_SUPPORTED_LOCALES,

  supportedOutputLanguages:
    RUNTIME_SUPPORTED_OUTPUT_LANGUAGES,

  normalizeLocale:
    normalizeRuntimeLocale,

  normalizeOutputLanguage:
    normalizeRuntimeOutputLanguage,

  resolveLanguageContract:
    resolveRuntimeLanguageContract,

  resolveNavigationCopy:
    resolveNavigationRuntimeCopy
};
