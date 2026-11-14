export const CX_NAVIGATION = Object.freeze({
  primary: Object.freeze([
    Object.freeze({id:'SUBJECTS',href:'/#six-perspectives',en:'Six Perspectives',zh:'六主体'}),
    Object.freeze({id:'KNOWLEDGE',href:'/knowledge/',en:'Knowledge',zh:'知识'}),
    Object.freeze({id:'ASK',href:'/knowledge/ask/',en:'Ask',zh:'提问'}),
    Object.freeze({id:'MY_REALITY',href:'/reality/',en:'My Reality',zh:'我的现实'})
  ]),
  utilities: Object.freeze([
    Object.freeze({ id: 'SEARCH', mode: 'dialog', dialogId: 'cx-shell-search', en: 'Search', zh: '搜索' }),
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

  scope.querySelectorAll('.cx-subject-menu').forEach(menu => menu.addEventListener('keydown', event => {
    if(event.key === 'Escape' && menu.open){event.preventDefault();menu.open=false;menu.querySelector('summary')?.focus();}
  }));
  button.addEventListener('click', () => set(true));
  drawer.addEventListener('close', () => set(false));
  drawer.querySelectorAll('[data-cx-nav-link]').forEach(link => link.addEventListener('click', () => drawer.close('navigate')));
}
