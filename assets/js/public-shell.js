import {
  initializeI18n,
  onLocaleChange,
  t,
  translatePage
} from './i18n.js';

const NAVIGATION = Object.freeze([
  { id: 'discover', href: '/', key: 'publicShell.nav.discover' },
  { id: 'knowledge', href: '/explore', key: 'publicShell.nav.knowledge' },
  { id: 'reality', href: '/reality-demo', key: 'publicShell.nav.realityJourney' },
  { id: 'professional', href: '/services', key: 'publicShell.nav.professional' },
  { id: 'about', href: '/about', key: 'publicShell.nav.about' }
]);

const FOOTER_LINKS = Object.freeze([
  { href: '/thesis', key: 'publicShell.footer.thesis' },
  { href: '/explore#books', key: 'publicShell.footer.books' },
  { href: '/explore', key: 'publicShell.footer.atlas' },
  { href: '/reality-demo', key: 'publicShell.footer.realityJourney' },
  { href: '/services', key: 'publicShell.footer.services' },
  { href: '/privacy', key: 'publicShell.footer.privacy' },
  { href: '/terms', key: 'publicShell.footer.terms' },
  { href: '/contact', key: 'publicShell.footer.contact' }
]);

function navigationMarkup(activeSection) {
  return NAVIGATION.map(item => {
    const current = item.id === activeSection
      ? ' aria-current="page"'
      : '';

    return `
      <a class="public-nav__link" href="${item.href}"${current}>
        <span data-i18n="${item.key}"></span>
      </a>
    `;
  }).join('');
}

function languageMarkup() {
  return `
    <div
      class="public-language"
      role="group"
      data-i18n-aria-label="accessibility.languageSelector"
      aria-label="Select interface language"
    >
      <span class="public-language__label" data-i18n="publicShell.nav.language"></span>
      <button
        type="button"
        data-locale="en"
        data-i18n-aria-label="language.switchToEnglish"
        aria-label="Switch to English"
      >EN</button>
      <span aria-hidden="true">·</span>
      <button
        type="button"
        data-locale="zh-Hans"
        data-i18n-aria-label="language.switchToChinese"
        aria-label="切换至中文"
      >中文</button>
    </div>
  `;
}

function headerMarkup(activeSection) {
  return `
    <header class="public-header" data-public-header>
      <div class="public-header__inner">
        <a
          class="public-brand"
          href="/"
          data-i18n-aria-label="home.brandHomeLabel"
          aria-label="PHI OS home"
        >
          <span class="public-brand__mark" aria-hidden="true">Φ</span>
          <span>PHI OS</span>
        </a>
        <button
          class="public-menu-toggle"
          type="button"
          aria-expanded="false"
          aria-controls="public-navigation"
          data-i18n-aria-label="publicShell.nav.openMenu"
          aria-label="Open navigation"
        >
          <span class="public-menu-toggle__lines" aria-hidden="true"></span>
        </button>
        <nav
          id="public-navigation"
          class="public-nav"
          data-open="false"
          data-i18n-aria-label="publicShell.nav.label"
          aria-label="Primary navigation"
        >
          ${navigationMarkup(activeSection)}
          ${languageMarkup()}
        </nav>
      </div>
    </header>
  `;
}

function footerMarkup() {
  const links = FOOTER_LINKS.map(item => `
    <a href="${item.href}" data-i18n="${item.key}"></a>
  `).join('');

  return `
    <footer class="public-footer" data-public-footer>
      <div class="public-footer__inner">
        <div>
          <a class="public-brand" href="/">
            <span class="public-brand__mark" aria-hidden="true">Φ</span>
            <span>PHI OS</span>
          </a>
          <p class="public-footer__statement" data-i18n="publicShell.footer.statement"></p>
        </div>
        <nav
          class="public-footer__nav"
          data-i18n-aria-label="publicShell.footer.label"
          aria-label="Footer navigation"
        >
          ${links}
        </nav>
        <div class="public-footer__meta">
          <span data-i18n="publicShell.footer.copyright"></span>
          <span>
            <a href="/ai-disclosure" data-i18n="publicShell.footer.aiDisclosure"></a>
            <span aria-hidden="true"> · </span>
            <a href="/professional-boundary" data-i18n="publicShell.footer.professionalBoundary"></a>
          </span>
          <span data-i18n="publicShell.footer.boundary"></span>
        </div>
      </div>
    </footer>
  `;
}

function replaceOrInsert(selector, markup, position) {
  const template = document.createElement('template');
  template.innerHTML = markup.trim();
  const element = template.content.firstElementChild;
  const target = document.querySelector(selector);

  if (target) {
    target.replaceWith(element);
  } else {
    document.body.insertAdjacentElement(position, element);
  }

  return element;
}

function activeSectionFromPage() {
  const declared = document.body.dataset.publicSection;

  if (declared) {
    return declared;
  }

  const path = window.location.pathname.replace(/\.html$/, '');

  if (path === '' || path === '/') return 'discover';
  if (path === '/explore' || path === '/thesis' || path === '/academy') return 'knowledge';
  if (path.startsWith('/reality-demo')) return 'reality';
  if (path === '/services' || path === '/professional-boundary') return 'professional';
  if (path === '/about') return 'about';

  return '';
}

function bindMobileNavigation(header) {
  const toggle = header.querySelector('.public-menu-toggle');
  const navigation = header.querySelector('.public-nav');

  function setOpen(open) {
    toggle?.setAttribute('aria-expanded', String(open));
    toggle?.setAttribute(
      'aria-label',
      t(open ? 'publicShell.nav.closeMenu' : 'publicShell.nav.openMenu')
    );
    navigation?.setAttribute('data-open', String(open));
    document.body.classList.toggle('public-menu-open', open);
  }

  toggle?.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  navigation?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1000) {
      setOpen(false);
    }
  });

  onLocaleChange(() => {
    setOpen(toggle?.getAttribute('aria-expanded') === 'true');
  });
}

export function initializePublicShell() {
  const header = replaceOrInsert(
    'header, [data-public-header-placeholder]',
    headerMarkup(activeSectionFromPage()),
    'afterbegin'
  );

  replaceOrInsert(
    'footer, [data-public-footer-placeholder]',
    footerMarkup(),
    'beforeend'
  );

  bindMobileNavigation(header);
  initializeI18n();
  translatePage();
}

initializePublicShell();
