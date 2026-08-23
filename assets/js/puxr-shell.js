const STORAGE_KEY = 'phios-puxr-locale';
const LEGACY_LOCALE_STORAGE_KEY = 'phiOSLocale';
const NAV = [
  { id: 'discover', href: '/', zh: '首页', en: 'Discover' },
  { id: 'library', href: '/library', zh: '五册与知识', en: 'Books & Knowledge' },
  { id: 'ask', href: '/knowledge-search', zh: 'Ask PHI OS', en: 'Ask PHI OS' },
  { id: 'personal', href: '/professional/personal-runtime/', zh: 'Personal Runtime', en: 'Personal Runtime' },
  { id: 'financial', href: '/professional/financial/', zh: 'Financial Runtime', en: 'Financial Runtime' },
  { id: 'professional', href: '/services', zh: '专业服务', en: 'Professional' }
];
const FOOTER = [
  { href: '/books/', zh: '五册系统', en: 'Five volumes' },
  { href: '/articles', zh: '文章', en: 'Articles' },
  { href: '/library', zh: '知识入口', en: 'Knowledge entry' },
  { href: '/knowledge-search', zh: 'Ask PHI OS', en: 'Ask PHI OS' },
  { href: '/services', zh: '专业服务', en: 'Professional services' },
  { href: '/professional-boundary', zh: '专业边界', en: 'Professional boundary' },
  { href: '/about', zh: '关于', en: 'About' },
  { href: '/contact', zh: '联系', en: 'Contact' }
];
function preferredLocale() {
  const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_LOCALE_STORAGE_KEY);
  if (saved === 'zh-Hans' || saved === 'en') return saved;
  return navigator.language && navigator.language.toLowerCase().startsWith('zh') ? 'zh-Hans' : 'en';
}
export function currentLocale() {
  return document.documentElement.dataset.puxrLocale || preferredLocale();
}
export function setLocale(locale) {
  const next = locale === 'zh-Hans' ? 'zh-Hans' : 'en';
  document.documentElement.dataset.puxrLocale = next;
  document.documentElement.lang = next === 'zh-Hans' ? 'zh-Hans' : 'en';
  localStorage.setItem(STORAGE_KEY, next);
  localStorage.setItem(LEGACY_LOCALE_STORAGE_KEY, next);
  document.querySelectorAll('[data-puxr-locale-button]').forEach(button => {
    button.classList.toggle('is-active', button.dataset.puxrLocaleButton === next);
    button.setAttribute('aria-pressed', String(button.dataset.puxrLocaleButton === next));
  });
  window.dispatchEvent(new CustomEvent('puxr:localechange', { detail: { locale: next } }));
  window.dispatchEvent(new CustomEvent('phios:localechange', { detail: { locale: next } }));
}
function navMarkup(active = '') {
  return NAV.map(item => `
    <a class="puxr-nav__link" href="${item.href}"${item.id === active ? ' aria-current="page"' : ''}>
      <span class="puxr-lang-zh">${item.zh}</span>
      <span class="puxr-lang-en">${item.en}</span>
    </a>
  `).join('');
}
function headerMarkup(active = '') {
  return `
    <header class="puxr-nav" data-open="false">
      <div class="puxr-nav__inner">
        <a class="puxr-brand" href="/" aria-label="PHI OS home">
          <span class="puxr-brand__mark" aria-hidden="true">Φ</span>
          <span>PHI OS</span>
        </a>
        <button class="puxr-menu-toggle" type="button" data-puxr-menu-toggle aria-expanded="false">
          <span class="puxr-lang-zh">菜单</span><span class="puxr-lang-en">Menu</span>
        </button>
        <div class="puxr-nav__menu">
          <nav class="puxr-nav__links" aria-label="Primary">
            ${navMarkup(active)}
          </nav>
          <div class="puxr-locale" aria-label="Language selector">
            <button type="button" data-puxr-locale-button="en">EN</button>
            <button type="button" data-puxr-locale-button="zh-Hans">中文</button>
          </div>
        </div>
      </div>
    </header>
  `;
}
function footerMarkup() {
  const links = FOOTER.map(item => `
    <li><a href="${item.href}"><span class="puxr-lang-zh">${item.zh}</span><span class="puxr-lang-en">${item.en}</span></a></li>
  `).join('');
  return `
    <footer class="puxr-footer">
      <div class="puxr-wrap puxr-footer__grid">
        <div>
          <a class="puxr-brand" href="/" aria-label="PHI OS home">
            <span class="puxr-brand__mark" aria-hidden="true">Φ</span>
            <span>PHI OS</span>
          </a>
          <p class="puxr-body" style="margin-top:18px">
            <span class="puxr-lang-block puxr-lang-zh">PHI OS 不是把更多答案堆在一起，而是把知识、现实、边界、行动与回看重新连接。</span>
            <span class="puxr-lang-block puxr-lang-en">PHI OS reconnects knowledge, reality, boundaries, action and review instead of stacking more disconnected answers.</span>
          </p>
        </div>
        <div>
          <div class="puxr-footer__title"><span class="puxr-lang-zh">关键入口</span><span class="puxr-lang-en">Core entry points</span></div>
          <ul>${links}</ul>
        </div>
        <div>
          <div class="puxr-footer__title"><span class="puxr-lang-zh">边界</span><span class="puxr-lang-en">Boundary</span></div>
          <p class="puxr-micro">
            <span class="puxr-lang-block puxr-lang-zh">Ask PHI OS、Published Articles、Reality Navigation 与 Professional Services 是不同层级的 surface，不应该被压成同一种 generic chat 体验。</span>
            <span class="puxr-lang-block puxr-lang-en">Ask PHI OS, published articles, Reality Navigation and professional services are different surfaces and should not collapse into one generic chat experience.</span>
          </p>
        </div>
      </div>
    </footer>
  `;
}
export function initializePuxrShell() {
  if (!document.documentElement.dataset.puxrLocale) setLocale(preferredLocale());
  const active = document.body.dataset.puxrNav || '';
  const headerTarget = document.querySelector('[data-puxr-header]');
  if (headerTarget) headerTarget.outerHTML = headerMarkup(active);
  const footerTarget = document.querySelector('[data-puxr-footer]');
  if (footerTarget) footerTarget.outerHTML = footerMarkup();
  document.querySelectorAll('[data-puxr-locale-button]').forEach(button => {
    button.addEventListener('click', () => setLocale(button.dataset.puxrLocaleButton));
  });
  const menuToggle = document.querySelector('[data-puxr-menu-toggle]');
  const nav = document.querySelector('.puxr-nav');
  menuToggle?.addEventListener('click', () => {
    const open = nav?.getAttribute('data-open') === 'true';
    nav?.setAttribute('data-open', String(!open));
    menuToggle.setAttribute('aria-expanded', String(!open));
  });
}
initializePuxrShell();
