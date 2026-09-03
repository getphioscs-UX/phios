const KEY = 'phios-cx-locale';

function readStorage(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function writeStorage(key, value) {
  try { localStorage.setItem(key, value); } catch { /* Locale still applies for this page. */ }
}

export function preferredCustomerLocale() {
  const stored = readStorage(KEY) || readStorage('phiOSLocale');
  if (stored === 'en' || stored === 'zh-Hans') return stored;
  return navigator.language?.toLowerCase().startsWith('zh') ? 'zh-Hans' : 'en';
}

export function applyCustomerLocale(locale, scope = document) {
  const next = locale === 'zh-Hans' ? 'zh-Hans' : 'en';
  document.documentElement.lang = next;
  document.documentElement.dataset.cxLocale = next;
  writeStorage(KEY, next);
  writeStorage('phiOSLocale', next);

  scope.querySelectorAll('[data-cx-en][data-cx-zh]').forEach(node => {
    node.textContent = next === 'zh-Hans' ? node.dataset.cxZh : node.dataset.cxEn;
  });
  scope.querySelectorAll('[data-cx-en-placeholder][data-cx-zh-placeholder]').forEach(node => {
    node.setAttribute('placeholder', next === 'zh-Hans' ? node.dataset.cxZhPlaceholder : node.dataset.cxEnPlaceholder);
  });
  scope.querySelectorAll('[data-cx-en-aria-label][data-cx-zh-aria-label]').forEach(node => {
    node.setAttribute('aria-label', next === 'zh-Hans' ? node.dataset.cxZhAriaLabel : node.dataset.cxEnAriaLabel);
  });
  scope.querySelectorAll('[data-cx-locale]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.cxLocale === next));
  });

  window.dispatchEvent(new CustomEvent('phios:localechange', { detail: { locale: next } }));
  return next;
}

export function installLocaleControls(scope = document) {
  scope.querySelectorAll('[data-cx-locale]').forEach(button => {
    button.addEventListener('click', () => applyCustomerLocale(button.dataset.cxLocale, document));
  });
  return applyCustomerLocale(preferredCustomerLocale(), document);
}
