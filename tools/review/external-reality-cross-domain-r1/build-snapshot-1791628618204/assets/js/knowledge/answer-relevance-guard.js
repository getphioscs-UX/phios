/*
 * PUXR-W4 — client relevance guard for Ask PHI OS.
 *
 * This is a fail-closed presentation guard only. It does not create a second
 * retrieval or answer authority. When an upstream ANSWERED/PARTIALLY_ANSWERED
 * projection has no meaningful lexical overlap with the user's question, the
 * public client suppresses the unrelated answer and exposes an insufficient-
 * relevance boundary instead.
 */

const RELEVANCE_STOPWORDS = new Set([
  'what','why','how','when','where','which','who','whose','can','could','would','should','does','do','did','is','are','was','were',
  'the','this','that','these','those','my','your','our','their','about','with','from','into','please',
  '什么','为什么','为什','如何','怎么','怎样','是否','可以','我的','我们','你们','这个','那个','请问','会不会'
]);

const CJK_NOISE = ['为什么','什么','如何','怎么','怎样','是否','可以','我的','我们','你们','这个','那个','请问','会不会'];

export function questionContentTerms(value) {
  const normalized = String(value || '').normalize('NFKC').toLocaleLowerCase();
  const latin = (normalized.match(/[a-z0-9][a-z0-9-]{2,}/g) || [])
    .filter(term => !RELEVANCE_STOPWORDS.has(term));
  const cjkRuns = normalized.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]+/gu) || [];
  const cjk = [];

  for (let run of cjkRuns) {
    for (const noise of CJK_NOISE) run = run.split(noise).join('');
    if (run.length === 2) cjk.push(run);
    if (run.length > 2) {
      const maximum = Math.min(run.length - 1, 16);
      for (let index = 0; index < maximum; index += 1) cjk.push(run.slice(index, index + 2));
    }
  }

  return [...new Set([...latin, ...cjk]
    .filter(term => term.length >= 2 && !RELEVANCE_STOPWORDS.has(term)))]
    .slice(0, 24);
}

export function isAnswerQuestionRelevant(answer, envelope) {
  if (!['ANSWERED', 'PARTIALLY_ANSWERED'].includes(envelope?.answerState)) return true;

  const terms = questionContentTerms(answer?.question);
  if (!terms.length) return true;

  const candidate = [
    answer?.directAnswer,
    ...(answer?.whyThisMayHappen || []),
    ...(answer?.whatToObserve || [])
  ].join(' ').normalize('NFKC').toLocaleLowerCase();

  const matches = terms.filter(term => candidate.includes(term));
  const required = terms.length >= 3 ? 2 : 1;
  return matches.length >= required;
}
