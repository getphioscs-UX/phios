export const CX_NAVIGATION = Object.freeze({
  primary: Object.freeze([
    Object.freeze({ id: 'WORLD', href: '/world', en: 'World', zh: '世界' }),
    Object.freeze({ id: 'MY_REALITY', href: '/reality/', en: 'My Reality', zh: '我的现实' }),
    Object.freeze({ id: 'PERSPECTIVES', href: '/perspectives/', en: 'Personal', zh: '个人' }),
    Object.freeze({ id: 'KNOWLEDGE', href: '/knowledge/', en: 'Knowledge', zh: '知识' }),
    Object.freeze({ id: 'PROFESSIONAL', href: '/professional/', en: 'Services', zh: '服务' }),
    Object.freeze({ id: 'ABOUT', href: '/about/founder/', en: 'About PHI OS', zh: '关于 PHI OS' })
  ]),
  utilities: Object.freeze([
    Object.freeze({ id: 'SEARCH', mode: 'dialog', dialogId: 'cx-shell-search', en: 'Search', zh: '搜索' }),
    Object.freeze({ id: 'ASK', mode: 'dialog', dialogId: 'cx-shell-ask', en: 'Ask PHI OS', zh: '向 PHI OS 提问' }),
    Object.freeze({ id: 'ACCOUNT', mode: 'link', href: '/account/', en: 'Account', zh: '账户' })
  ])
});

export function installNavigationToggle(header, scope = document) {
  const button = header?.querySelector('[data-cx-menu]');
  const drawerId = button?.getAttribute('aria-controls');
  const drawer = drawerId ? scope.getElementById(drawerId) : null;
  if (!button || !(drawer instanceof HTMLDialogElement)) return;

  const set = open => {
    header.dataset.open = String(open);
    button.setAttribute('aria-expanded', String(open));
  };

  button.addEventListener('click', () => set(true));
  drawer.addEventListener('close', () => set(false));
  drawer.querySelectorAll('[data-cx-nav-link]').forEach(link => link.addEventListener('click', () => drawer.close('navigate')));
}
