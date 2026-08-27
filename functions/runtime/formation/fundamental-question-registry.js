/*
 * PHI OS Sixteen Fundamental Questions
 * Canonical Book I / Figure 3A authority.
 *
 * These are Reality-runtime questions, not user prompts and not personality labels.
 * ECR references this core registry; ECR must not create a second Q1-Q16 ontology.
 */

export const FUNDAMENTAL_QUESTION_VERSION = '1.0.0';
export const FUNDAMENTAL_QUESTION_SCHEMA = 'phi-os.fundamental-question-registry.v1';

const DOMAIN = Object.freeze({
  RECOGNITION: 'DOMAIN_I_RECOGNITION',
  ESTABLISHMENT: 'DOMAIN_II_ESTABLISHMENT',
  PARTICIPATION: 'DOMAIN_III_PARTICIPATION',
  CONTINUATION: 'DOMAIN_IV_CONTINUATION'
});

const entries = [
  ['Q1', DOMAIN.RECOGNITION, 'What is actually happening?', '究竟发生了什么？'],
  ['Q2', DOMAIN.RECOGNITION, 'What is worth believing?', '什么值得相信？'],
  ['Q3', DOMAIN.RECOGNITION, 'What is real?', '什么是真实？'],
  ['Q4', DOMAIN.RECOGNITION, 'Has Reality entered a new stage?', '是否进入新的阶段？'],

  ['Q5', DOMAIN.ESTABLISHMENT, 'Should this begin now?', '现在是否应该开始？'],
  ['Q6', DOMAIN.ESTABLISHMENT, 'Are the resources sufficient?', '资源是否足够？'],
  ['Q7', DOMAIN.ESTABLISHMENT, 'How can the Runtime continue?', '如何持续运行？'],
  ['Q8', DOMAIN.ESTABLISHMENT, 'Does the current order still support the future?', '秩序继续支持未来吗？'],

  ['Q9', DOMAIN.PARTICIPATION, 'How should other Realities be answered?', '如何回应其他现实？'],
  ['Q10', DOMAIN.PARTICIPATION, 'How should differences be organized?', '如何组织差异？'],
  ['Q11', DOMAIN.PARTICIPATION, 'What is worth carrying together?', '什么值得共同承载？'],
  ['Q12', DOMAIN.PARTICIPATION, 'How can shared stability be maintained?', '如何维持共同稳定？'],

  ['Q13', DOMAIN.CONTINUATION, 'Does the old organization still support the future?', '旧组织还支持未来吗？'],
  ['Q14', DOMAIN.CONTINUATION, 'Who carries the change?', '谁承载改变？'],
  ['Q15', DOMAIN.CONTINUATION, 'How can the new organization become stable?', '新的组织如何稳定？'],
  ['Q16', DOMAIN.CONTINUATION, 'How can existence continue?', '如何继续存在？']
];

export const FUNDAMENTAL_QUESTION_CODES = Object.freeze(entries.map(([id]) => id));
export const FUNDAMENTAL_QUESTION_REGISTRY = Object.freeze(Object.fromEntries(entries.map(([id, domain, question, questionZhHans], index) => [id, Object.freeze({
  id,
  order: index + 1,
  domain,
  question,
  questionZhHans,
  role: 'RUNTIME_DEMAND_QUESTION',
  sourceAuthority: 'BOOK_1_FIGURE_3A'
})])));

export function getFundamentalQuestion(id) {
  return FUNDAMENTAL_QUESTION_REGISTRY[String(id || '').toUpperCase()] || null;
}

export function validateFundamentalQuestionRegistry() {
  const ids = Object.keys(FUNDAMENTAL_QUESTION_REGISTRY);
  const expected = Array.from({ length: 16 }, (_, index) => `Q${index + 1}`);
  const valid = ids.length === 16 && expected.every((id, index) => ids[index] === id && FUNDAMENTAL_QUESTION_REGISTRY[id].order === index + 1);
  return Object.freeze({ valid, count: ids.length, schemaVersion: FUNDAMENTAL_QUESTION_SCHEMA, version: FUNDAMENTAL_QUESTION_VERSION });
}

export default FUNDAMENTAL_QUESTION_REGISTRY;
