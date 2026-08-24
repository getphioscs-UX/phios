import { onRequestPost as runCkaConsumption } from './ask-phios-consumption.js';
import { runAsk2Consumption } from '../ask2/ask2-consumption-runtime.js';

const headers = Object.freeze({
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer'
});
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });

function ckaCompatFromAsk2(result) {
  const client = result.client;
  const answerId = `ASK2-${Date.now()}`;
  const authorityGroups = (result.plan?.currentReality?.external || []).map((evidence, index) => ({
    authorityClass: 'GOVERNED_EXTERNAL_AUTHORITY',
    sources: [{
      authorityLabel: evidence.publisher || evidence.authorityClass || 'Current Authority',
      description: evidence.claimText || evidence.title || 'Governed current evidence',
      href: evidence.sourceUrl || null,
      volume: '', part: '', sourceId: evidence.sourceId || `CWA-${index + 1}`
    }]
  }));
  return {
    clientAnswer: {
      question: client.question,
      directAnswer: client.directAnswer,
      whyThisMayHappen: client.whyThisMayHappen,
      whatToObserve: client.whatToObserve,
      unknown: client.unknown,
      answerContext: { answerId },
      knowledgeContext: { groundingBundleId: `ASK2-GROUNDING-${answerId}` }
    },
    w5w17: {
      answerState: client.answerState,
      record: {
        unknownState: client.unknown.details.length ? 'UNKNOWN_REMAINS' : 'BOUNDARIES_PRESERVED',
        groundingBundleId: `ASK2-GROUNDING-${answerId}`,
        retrievalContext: { authorityGroups }
      },
      relatedKnowledgeCards: [],
      externalAuthority: {
        required: client.answerState === 'NEEDS_CURRENT_AUTHORITY',
        professionalJudgmentRequested: client.answerState === 'PROFESSIONAL_HANDOFF'
      },
      guidedContext: { classifications: [result.plan?.taxonomy || 'ASK2'] }
    },
    followUp: { followUpDepth: 0 }
  };
}

function healthCompat(question, health, locale) {
  const zh = locale === 'zh-Hans';
  const safety = health.safety?.careState;
  const direct = health.route === 'HRX_SAFETY_FIRST'
    ? (zh ? '这个健康问题需要优先进入安全与现实照护路径。' : 'This health question requires safety-first real-world care routing.')
    : health.route === 'HRX_AUTHORITY_REQUIRED'
      ? (zh ? '这是健康问题。PHI OS 需要受治理的 Health Authority 才能提供健康事实，不会用普通模型知识代替。' : 'This is a health question. Governed Health Authority is required for health facts; general model knowledge will not substitute.')
      : (zh ? '这是健康问题。PHI OS 会先整理当前症状、时间与相关变化，不会直接诊断。' : 'This is a health question. PHI OS will first organize symptoms, timing, and changes without diagnosing.');
  const prompts = [
    zh ? '什么时候开始？' : 'When did it begin?',
    zh ? '有什么痒、痛、肿、扩散或其他变化？' : 'Is there itching, pain, swelling, spreading, or another change?',
    zh ? '最近是否有新的药物、产品、食物或环境暴露？' : 'Any new medicine, product, food, or environmental exposure?'
  ];
  const answerId = `HRX-${Date.now()}`;
  return {
    ok: true,
    mode: 'HEALTH',
    ask2: { schemaVersion: 'PHI-OS-ASK2-PUBLIC-CONSUMPTION-v1.0.0', domain: 'HEALTH', route: health.route, health },
    cka: {
      clientAnswer: { question, directAnswer: direct, whyThisMayHappen: [], whatToObserve: prompts, unknown: { details: [zh ? '原因尚未建立。' : 'The cause has not been established.'] }, answerContext: { answerId }, knowledgeContext: { groundingBundleId: `HRX-GROUNDING-${answerId}` } },
      w5w17: { answerState: health.route === 'HRX_SAFETY_FIRST' ? 'PROFESSIONAL_HANDOFF' : health.route === 'HRX_AUTHORITY_REQUIRED' ? 'NEEDS_CURRENT_AUTHORITY' : 'NEEDS_CONTEXT', record: { unknownState: 'CAUSE_NOT_ESTABLISHED', groundingBundleId: `HRX-GROUNDING-${answerId}`, retrievalContext: { authorityGroups: [] } }, relatedKnowledgeCards: [], externalAuthority: { required: health.route === 'HRX_AUTHORITY_REQUIRED', professionalJudgmentRequested: health.route === 'HRX_SAFETY_FIRST' }, guidedContext: { classifications: ['HEALTH', health.intent || 'HEALTH_REALITY'] } },
      followUp: { followUpDepth: 0 }
    }
  };
}

export async function onRequestPost(context) {
  let body;
  try { body = await context.request.json(); } catch { return json({ ok: false, error: { code: 'ASK2_INVALID_JSON' } }, 400); }
  const question = String(body?.q || body?.question || '').trim();
  if (!question) return json({ ok: false, error: { code: 'ASK2_QUESTION_REQUIRED' } }, 400);
  try {
    const result = await runAsk2Consumption({ body, env: context.env || {}, requestUrl: context.request.url, fetcher: fetch });
    if (result.classification.mode === 'HEALTH') {
      return json(healthCompat(question, result.classification.health, body.locale || 'zh-Hans'));
    }
    if (result.classification.mode === 'CKA') {
      const forwarded = new Request(context.request.url, { method: 'POST', headers: context.request.headers, body: JSON.stringify(body) });
      return runCkaConsumption({ ...context, request: forwarded });
    }
    return json({
      ok: true,
      mode: 'ASK2',
      ask2: {
        schemaVersion: 'PHI-OS-ASK2-PUBLIC-CONSUMPTION-v1.0.0',
        plan: result.plan,
        execution: result.execution,
        composition: result.composition,
        client: result.client
      },
      cka: ckaCompatFromAsk2(result)
    });
  } catch (error) {
    return json({ ok: false, error: { code: error?.code || error?.message || 'ASK2_ORCHESTRATED_CONSUMPTION_FAILED' }, governance: { modelCalculationAllowed: false, rawWebResultAllowed: false } }, error?.status || 422);
  }
}

export async function onRequestGet() { return json({ ok: false, error: { code: 'ASK2_ORCHESTRATED_POST_ONLY' } }, 405); }
