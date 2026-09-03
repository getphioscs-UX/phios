export const CX_NAVIGATION = Object.freeze({
  primary: Object.freeze([
    Object.freeze({ id: 'EXPLORE', href: '/explore/', en: 'Explore', zh: '探索' }),
    Object.freeze({ id: 'MY_REALITY', href: '/reality/', en: 'My Reality', zh: '我的现实' }),
    Object.freeze({ id: 'PERSPECTIVES', href: '/perspectives/', en: 'Perspectives', zh: '视角' }),
    Object.freeze({ id: 'KNOWLEDGE', href: '/knowledge/', en: 'Knowledge', zh: '知识' }),
    Object.freeze({ id: 'PROFESSIONAL', href: '/professional/', en: 'Professional', zh: '专业' })
  ]),
  utilities: Object.freeze([
    Object.freeze({ id: 'SEARCH', mode: 'dialog', dialogId: 'cx-shell-search', en: 'Search', zh: '搜索' }),
    Object.freeze({ id: 'ASK', mode: 'dialog', dialogId: 'cx-shell-ask', en: 'Ask PHI OS', zh: 'Ask PHI OS' }),
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
