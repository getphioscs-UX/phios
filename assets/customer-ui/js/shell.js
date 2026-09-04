import { CX_NAVIGATION, installNavigationToggle } from './navigation.js';
import { installLocaleControls } from './locale.js';
import { hydrateCustomerAssets } from './assets.js';
import { installCustomerDialogs } from './dialog.js';
import { installExpandableFigures } from './figure-viewer.js';

const ACCOUNT_PRESENTATION = Object.freeze({
  GUEST: Object.freeze({ en: 'Guest', zh: '访客' }),
  AUTHENTICATED: Object.freeze({ en: 'Authenticated', zh: '已登录' }),
  PROFESSIONAL: Object.freeze({ en: 'Professional', zh: '专业账户' })
});

const t = (en, zh) => `data-cx-en="${en}" data-cx-zh="${zh}"`;
const aria = (en, zh) => `data-cx-en-aria-label="${en}" data-cx-zh-aria-label="${zh}" aria-label="${en}"`;

export function presentedAccountState(scope = document) {
  const declared = scope?.body?.dataset?.cxAccountState || globalThis.__PHIOS_CUSTOMER_SHELL_CONTEXT__?.accountState || 'GUEST';
  return Object.hasOwn(ACCOUNT_PRESENTATION, declared) ? declared : 'GUEST';
}

function navLinks(active, extraClass = '') {
  return CX_NAVIGATION.primary.map(item => `<a class="cx-nav-link ${extraClass}" href="${item.href}" data-cx-nav-link ${item.id === active ? 'aria-current="page"' : ''} ${t(item.en, item.zh)}>${item.en}</a>`).join('');
}

function accountStateBadge(state) {
  const label = ACCOUNT_PRESENTATION[state] || ACCOUNT_PRESENTATION.GUEST;
  return `<span class="cx-account-state" data-cx-account-state="${state}" ${t(label.en, label.zh)}>${label.en}</span>`;
}

function utilityControl(item, state, mobile = false) {
  const cls = mobile ? 'cx-drawer-link' : 'cx-utility-link';
  if (item.id === 'ACCOUNT') {
    return `<a class="${cls} cx-account-link" href="${item.href}" data-cx-nav-link><span ${t(item.en, item.zh)}>${item.en}</span>${accountStateBadge(state)}</a>`;
  }
  return `<button class="${cls}" type="button" data-cx-dialog-open="${item.dialogId}" ${aria(item.en, item.zh)}><span ${t(item.en, item.zh)}>${item.en}</span></button>`;
}

function utilityControls(state, mobile = false) {
  return CX_NAVIGATION.utilities.map(item => utilityControl(item, state, mobile)).join('');
}

function localeControl(compact = false) {
  return `<div class="cx-locale${compact ? ' cx-locale--drawer' : ''}" ${aria('Language', '语言')}><button type="button" data-cx-locale="en">EN</button><button type="button" data-cx-locale="zh-Hans">中文</button></div>`;
}

function headerMarkup(active, state) {
  return `<header class="cx-shell-header" data-open="false" data-cx-shell-region="header">
    <div class="cx-container cx-shell-header__inner">
      <a class="cx-brand" href="/" aria-label="PHI OS home"><img data-cx-asset="LOGO-003" alt="PHI OS"><span class="cx-visually-hidden" data-cx-asset-fallback>PHI OS</span></a>
      <nav class="cx-primary-nav" aria-label="Primary">${navLinks(active)}</nav>
      <div class="cx-utilities">${utilityControls(state)}${localeControl()}</div>
      <button class="cx-menu-button" type="button" data-cx-menu data-cx-dialog-open="cx-shell-navigation" aria-controls="cx-shell-navigation" aria-expanded="false" ${aria('Open menu', '打开菜单')}><span ${t('Menu', '菜单')}>Menu</span></button>
    </div>
  </header>`;
}

function navigationDrawerMarkup(active, state) {
  return `<dialog class="cx-shell-drawer cx-shell-drawer--navigation" id="cx-shell-navigation" aria-labelledby="cx-shell-navigation-title">
    <div class="cx-shell-drawer__body">
      <div class="cx-shell-drawer__bar"><strong id="cx-shell-navigation-title" ${t('Navigate PHI OS', '浏览 PHI OS')}>Navigate PHI OS</strong><button class="cx-button cx-button--icon cx-button--quiet" type="button" data-cx-dialog-close ${aria('Close menu', '关闭菜单')}>×</button></div>
      <nav class="cx-drawer-nav" aria-label="Mobile primary">${navLinks(active, 'cx-drawer-link')}</nav>
      <div class="cx-drawer-utilities">${utilityControls(state, true)}</div>
      ${localeControl(true)}
    </div>
  </dialog>`;
}

function searchDrawerMarkup() {
  return `<dialog class="cx-shell-drawer cx-shell-drawer--utility" id="cx-shell-search" aria-labelledby="cx-shell-search-title">
    <div class="cx-shell-drawer__body">
      <div class="cx-shell-drawer__bar"><div><p class="cx-eyebrow" ${t('SEARCH', '搜索')}>SEARCH</p><h2 class="cx-heading-2" id="cx-shell-search-title" ${t('Find governed PHI OS knowledge.', '查找 PHI OS 已治理知识。')}>Find governed PHI OS knowledge.</h2></div><button class="cx-button cx-button--icon cx-button--quiet" type="button" data-cx-dialog-close ${aria('Close search', '关闭搜索')}>×</button></div>
      <p class="cx-body cx-muted" ${t('Search opens the existing knowledge search surface. The shell does not create a second search engine or knowledge authority.', '搜索会进入现有知识搜索界面。Shell 不会建立第二套搜索引擎或知识权威。')}>Search opens the existing knowledge search surface. The shell does not create a second search engine or knowledge authority.</p>
      <form class="cx-shell-utility-form" action="/search/" method="get" role="search">
        <label class="cx-field"><span ${t('What are you looking for?', '你想查找什么？')}>What are you looking for?</span><input class="cx-input" type="search" name="q" maxlength="300" autocomplete="off" ${aria('Search PHI OS knowledge', '搜索 PHI OS 知识')} data-cx-en-placeholder="Search books, articles and concepts…" data-cx-zh-placeholder="搜索书籍、文章与概念……" placeholder="Search books, articles and concepts…"></label>
        <button class="cx-button cx-button--primary" type="submit" ${t('Search', '搜索')}>Search</button>
      </form>
      <a class="cx-button cx-button--text" href="/search/" data-cx-nav-link ${t('Open full search', '打开完整搜索')}>Open full search</a>
    </div>
  </dialog>`;
}

function askDrawerMarkup() {
  return `<dialog class="cx-shell-drawer cx-shell-drawer--utility" id="cx-shell-ask" aria-labelledby="cx-shell-ask-title">
    <div class="cx-shell-drawer__body">
      <div class="cx-shell-drawer__bar"><div><p class="cx-eyebrow">ASK PHI OS</p><h2 class="cx-heading-2" id="cx-shell-ask-title" ${t('Start with one question.', '从一个问题开始。')}>Start with one question.</h2></div><button class="cx-button cx-button--icon cx-button--quiet" type="button" data-cx-dialog-close ${aria('Close Ask PHI OS', '关闭 Ask PHI OS')}>×</button></div>
      <p class="cx-body cx-muted" ${t('The global entry carries your question to the existing Ask surface. The full answer is still produced by the governed Ask runtime, not by the shell.', '这个全局入口只把问题带到现有 Ask 界面。完整回答仍由受治理的 Ask runtime 产生，而不是由 Shell 产生。')}>The global entry carries your question to the existing Ask surface. The full answer is still produced by the governed Ask runtime, not by the shell.</p>
      <form class="cx-shell-utility-form" action="/knowledge/ask/" method="get">
        <label class="cx-field"><span ${t('What are you trying to understand?', '你正在试图理解什么？')}>What are you trying to understand?</span><textarea class="cx-textarea" name="q" maxlength="500" required data-cx-en-placeholder="What feels uncertain, current, or important?" data-cx-zh-placeholder="现在有什么不确定、正在发生，或对你很重要？" placeholder="What feels uncertain, current, or important?"></textarea></label>
        <button class="cx-button cx-button--primary" type="submit">Ask PHI OS</button>
      </form>
      <a class="cx-button cx-button--text" href="/knowledge/ask/" data-cx-nav-link ${t('Open Ask PHI OS', '打开 Ask PHI OS')}>Open Ask PHI OS</a>
    </div>
  </dialog>`;
}

function footerLink(href, en, zh) {
  return `<a href="${href}" ${t(en, zh)}>${en}</a>`;
}

function footerMarkup() {
  return `<footer class="cx-shell-footer" data-cx-shell-region="footer"><div class="cx-container cx-shell-footer__grid">
    <div class="cx-stack"><a class="cx-brand" href="/" aria-label="PHI OS home"><img data-cx-asset="LOGO-010" alt="PHI OS"><span class="cx-visually-hidden" data-cx-asset-fallback>PHI OS</span></a><p class="cx-meta" ${t('Reality changes. Your understanding should be able to change with it.', '现实会继续变化，你的理解也应该能够随之更新。')}>Reality changes. Your understanding should be able to change with it.</p></div>
    <div><p class="cx-eyebrow" ${t('Navigate', '浏览')}>Navigate</p><p class="cx-meta">${footerLink('/explore/', 'Explore', '探索')}<br>${footerLink('/reality/', 'My Reality', '我的现实')}<br>${footerLink('/perspectives/', 'Perspectives', '视角')}</p></div>
    <div><p class="cx-eyebrow" ${t('Knowledge', '知识')}>Knowledge</p><p class="cx-meta">${footerLink('/knowledge/', 'Knowledge home', '知识主页')}<br>${footerLink('/search/', 'Search', '搜索')}<br>${footerLink('/knowledge/ask/', 'Ask PHI OS', 'Ask PHI OS')}</p></div>
    <div><p class="cx-eyebrow" ${t('Continue', '继续')}>Continue</p><p class="cx-meta">${footerLink('/professional/', 'Professional', '专业')}<br>${footerLink('/account/', 'Account', '账户')}<br>${footerLink('/terms', 'Terms', '条款')} · ${footerLink('/privacy', 'Privacy', '隐私')}</p></div>
  </div></footer>`;
}

function shellChrome(active, state) {
  return `${headerMarkup(active, state)}${navigationDrawerMarkup(active, state)}${searchDrawerMarkup()}${askDrawerMarkup()}`;
}

export async function initializeCustomerShell(scope = document) {
  const active = document.body.dataset.cxNav || '';
  const state = presentedAccountState(document);
  const head = scope.querySelector('[data-cx-header]');
  if (head) head.outerHTML = shellChrome(active, state);
  const foot = scope.querySelector('[data-cx-footer]');
  if (foot) foot.outerHTML = footerMarkup();

  installCustomerDialogs(scope);
  installNavigationToggle(scope.querySelector('.cx-shell-header'), scope);
  installLocaleControls(scope);
  installExpandableFigures(scope);
  await hydrateCustomerAssets(scope);

  document.documentElement.dataset.cxShell = 'ready';
  document.documentElement.dataset.cxAccountPresentation = state;
}

initializeCustomerShell().then(async () => {
  if (document.body.dataset.cxSurface === 'SYMBOLIC_ICHING') {
    await import('./surfaces/iching-customer-entry.js');
  }
  if(document.body.dataset.cxSurface==='ICHING_FULL_PRODUCTION') {
    await import('./surfaces/iching-run-cutover.js');
    if (document.body.dataset.ichingRunCutover === 'redirecting') return;
    return import('./surfaces/iching-casting.js');
  }
}).catch(error => console.error('CX_SHELL_INITIALIZATION_FAILED', error));
