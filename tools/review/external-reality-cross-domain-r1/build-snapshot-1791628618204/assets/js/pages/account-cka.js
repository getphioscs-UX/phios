import { getLocale, onLocaleChange } from '../i18n.js';

const root = document.querySelector('[data-cka-account]');
const sectionsRoot = document.querySelector('[data-cka-account-sections]');
const status = document.querySelector('[data-cka-account-status]');
let payload = null;

const escapeHtml = value => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
const safeHref = value => String(value || '').startsWith('/') ? String(value) : null;

function copy() {
  return getLocale() === 'zh-Hans' ? {
    title: '你的 Ask continuity', recentQuestions: '最近问题', savedAnswers: '已保存回答', savedKnowledge: '已保存知识',
    continueContext: '继续上下文', empty: '目前没有可显示的项目。', status: '只显示由已验证 account provider 提供、且符合 retention policy 的资料。'
  } : {
    title: 'Your Ask continuity', recentQuestions: 'Recent Questions', savedAnswers: 'Saved Answers', savedKnowledge: 'Saved Knowledge',
    continueContext: 'Continue Context', empty: 'Nothing is available here yet.', status: 'Only data supplied by the verified account provider and allowed by retention policy is shown.'
  };
}

function render() {
  if (!root || !payload?.available) return;
  root.hidden = false;
  root.querySelector('[data-cka-account-title]').textContent = copy().title;
  status.textContent = copy().status;
  const keys = ['recentQuestions', 'savedAnswers', 'savedKnowledge', 'continueContext'];
  sectionsRoot.innerHTML = keys.map(key => {
    const records = Array.isArray(payload.sections?.[key]) ? payload.sections[key] : [];
    const rows = records.length ? `<ul>${records.map(item => {
      const href = safeHref(item.href);
      return `<li>${href ? `<a href="${escapeHtml(href)}">${escapeHtml(item.label)}</a>` : escapeHtml(item.label)}</li>`;
    }).join('')}</ul>` : `<p>${escapeHtml(copy().empty)}</p>`;
    return `<article class="account-card"><h3>${escapeHtml(copy()[key])}</h3>${rows}</article>`;
  }).join('');
}

async function load() {
  if (!root) return;
  try {
    const response = await fetch('/api/cka-account', { headers: { Accept: 'application/json' }, cache: 'no-store' });
    payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok || !payload.available) {
      root.hidden = true;
      return;
    }
    render();
  } catch {
    root.hidden = true;
  }
}

onLocaleChange(render);
load();
