import { runAskPhiosPipeline, normalizeAnswerDepth } from '../_lib/knowledge-answer-composition.js';

const JSON_HEADERS = Object.freeze({
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store'
});

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function requestInput(url) {
  const q = String(url.searchParams.get('q') || '').trim();
  const locale = String(url.searchParams.get('locale') || 'zh-Hans').trim();
  const depth = normalizeAnswerDepth(url.searchParams.get('depth') || 'STANDARD');
  const source = String(url.searchParams.get('source') || 'hybrid').trim();
  if (!q) throw new Error('KAP_QUESTION_INVALID');
  return { q, locale, depth, source };
}

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const input = requestInput(url);
    const result = await runAskPhiosPipeline({
      input: { question: input.q, locale: input.locale, surfaceContext: { surfaceType: 'ASK_PHIOS' } },
      request: context.request,
      env: context.env || {},
      depth: input.depth,
      retrievalOptions: { source: input.source, mode: 'auto' }
    });
    return json({ ok: true, ...result });
  } catch (error) {
    const code = String(error?.message || 'KAP_ASK_PHIOS_FAILED');
    const status = code === 'KAP_QUESTION_INVALID' || code === 'KAP_LOCALE_UNSUPPORTED' || code === 'KAP_ANSWER_DEPTH_UNSUPPORTED' ? 400 : 500;
    return json({
      ok: false,
      error: { code },
      governance: {
        canonicalAuthorityCreated: false,
        publicationCreated: false,
        realityReadingCreated: false,
        persistentCaseCreated: false
      }
    }, status);
  }
}
