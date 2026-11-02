import { getLocale, onLocaleChange } from '../i18n.js';

const root = document.querySelector('[data-cka-reality-dashboard]');
const status = document.querySelector('[data-cka-reality-status]');
const disclosure = document.querySelector('[data-cka-reality-disclosure]');
const items = document.querySelector('[data-cka-reality-items]');
const action = document.querySelector('[data-cka-reality-action]');
let payload = null;

const escapeHtml = value => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

function copy() {
  return getLocale() === 'zh-Hans' ? {
    eyebrow: 'Ask PHI OS · Reality Dashboard', title: '针对当前 Reality 提问',
    active: 'Using current Reality context', inactive: '当前 Reality context 未被使用。',
    inactiveCopy: '只有在 account、permission、privacy、entitlement 与 existing case 都通过授权后，CKA 才能读取当前 Reality context。现在不会静默读取浏览器里的私人 Journey 内容。',
    drawer: '查看会使用哪些上下文', noItems: '没有已授权、可披露的上下文项目。', askActive: '使用当前 Reality context 提问', askPublic: '不使用私人 Reality context 提问'
  } : {
    eyebrow: 'Ask PHI OS · Reality Dashboard', title: 'Ask about this Reality',
    active: 'Using current Reality context', inactive: 'Current Reality context is not being used.',
    inactiveCopy: 'CKA can read current Reality context only after account, permission, privacy, entitlement and an existing case are all authorized. It does not silently read private browser Journey content.',
    drawer: 'See what context would be used', noItems: 'No authorized disclosure items are available.', askActive: 'Ask using current Reality context', askPublic: 'Ask without private Reality context'
  };
}

function applyStatic() {
  if (!root) return;
  root.querySelector('[data-cka-reality-eyebrow]').textContent = copy().eyebrow;
  root.querySelector('[data-cka-reality-title]').textContent = copy().title;
  disclosure.querySelector('summary').textContent = copy().drawer;
}

function render() {
  if (!root || !payload) return;
  root.hidden = false;
  applyStatic();
  if (payload.available && payload.disclosure?.usingCurrentRealityContext) {
    status.innerHTML = `<strong>${escapeHtml(copy().active)}</strong>`;
    const records = Array.isArray(payload.disclosure.contextItems) ? payload.disclosure.contextItems : [];
    items.innerHTML = records.length
      ? `<dl>${records.map(item => `<div><dt>${escapeHtml(item.label)}</dt><dd>${escapeHtml(item.value)}</dd></div>`).join('')}</dl>`
      : `<p>${escapeHtml(copy().noItems)}</p>`;
    action.href = payload.askHref;
    action.textContent = copy().askActive;
    disclosure.hidden = false;
    return;
  }
  status.innerHTML = `<strong>${escapeHtml(copy().inactive)}</strong><p>${escapeHtml(copy().inactiveCopy)}</p>`;
  items.innerHTML = `<p>${escapeHtml(copy().noItems)}</p>`;
  disclosure.hidden = false;
  action.href = payload.publicAskHref || '/knowledge-search?entrySurface=REALITY_DASHBOARD&mode=GLOBAL';
  action.textContent = copy().askPublic;
}

async function load() {
  if (!root) return;
  try {
    const response = await fetch('/api/cka-reality-context', { headers: { Accept: 'application/json' }, cache: 'no-store' });
    payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok) throw new Error('CKA_REALITY_CONTEXT_DISCLOSURE_FAILED');
    render();
  } catch {
    payload = { ok: true, available: false, publicAskHref: '/knowledge-search?entrySurface=REALITY_DASHBOARD&mode=GLOBAL' };
    render();
  }
}

onLocaleChange(render);
load();
