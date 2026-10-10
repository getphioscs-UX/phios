import { normalizeTrustedCkaAccess, resolveCkaEntitlements } from '../_lib/client-knowledge-ask-c.js';

const headers = Object.freeze({
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'referrer-policy': 'no-referrer'
});
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
const clean = value => String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ');
const list = value => Array.isArray(value) ? value : [];

function safeRecords(value, limit = 8) {
  return list(value).slice(0, limit).map(item => Object.freeze({
    label: clean(item?.label || item?.question || item?.title).slice(0, 180),
    href: /^\//.test(clean(item?.href)) ? clean(item.href) : null,
    updatedAt: clean(item?.updatedAt).slice(0, 40) || null
  })).filter(item => item.label);
}

export async function onRequestGet(context) {
  const access = normalizeTrustedCkaAccess(context?.data?.ckaAccess || {});
  if (access.accountState !== 'ACCOUNT') {
    return json({
      ok: true,
      available: false,
      accountState: 'GUEST',
      sections: {},
      governance: { guestHiddenHistoryPersisted: false, localBrowserHistoryRead: false }
    });
  }
  if (!access.retentionPolicyAccepted) {
    return json({ ok: true, available: false, accountState: 'ACCOUNT', sections: {}, governance: { retentionPolicyRequired: true, retentionPolicyRespected: true, guestHiddenHistoryPersisted: false, localBrowserHistoryRead: false } });
  }
  const summary = context?.data?.ckaAccountSummary && typeof context.data.ckaAccountSummary === 'object'
    ? context.data.ckaAccountSummary
    : {};
  return json({
    ok: true,
    available: true,
    accountState: 'ACCOUNT',
    entitlements: resolveCkaEntitlements(access),
    sections: {
      recentQuestions: safeRecords(summary.recentQuestions),
      savedAnswers: safeRecords(summary.savedAnswers),
      savedKnowledge: safeRecords(summary.savedKnowledge),
      continueContext: safeRecords(summary.continueContext, 4)
    },
    governance: {
      accountProviderRequired: true,
      retentionPolicyRespected: access.retentionPolicyAccepted === true,
      guestHiddenHistoryPersisted: false,
      localBrowserHistoryRead: false
    }
  });
}
