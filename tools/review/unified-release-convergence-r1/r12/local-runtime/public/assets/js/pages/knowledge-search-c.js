import { getLocale, onLocaleChange } from '../i18n.js';

const root = document.querySelector('[data-cka-root]');
if (root) {
  const form = root.querySelector('[data-cka-composer]');
  const input = root.querySelector('[data-cka-question]');
  const submit = form?.querySelector('button[type="submit"]');
  const status = root.querySelector('[data-cka-status]');
  const answer = root.querySelector('[data-cka-answer]');
  const followForm = root.querySelector('[data-cka-follow-up-form]');
  const followInput = root.querySelector('[data-cka-follow-up-question]');
  const followSubmit = followForm?.querySelector('button[type="submit"]');
  const followBoundary = root.querySelector('[data-cka-follow-up-boundary]');
  const guidedOpen = root.querySelector('[data-cka-guided-open]');
  const guidedForm = root.querySelector('[data-cka-guided-form]');
  let followUpPending = false;

  function copy() {
    return getLocale() === 'zh-Hans' ? {
      heroTitle: '你想理解什么？', heroLead: '从一个问题开始。PHI OS 会保持回答有依据、有边界，并明确保留仍未知的部分。',
      question: '问题', ask: '询问 PHI OS', yourQuestion: '你的问题', direct: '直接回答', why: '为什么可能会这样', observe: '可以观察什么',
      unknown: 'PHI OS 目前仍不知道什么', related: '相关知识', grounding: '来源与依据', followHeading: '进行一次追问', followLabel: '追问问题', followAction: '提交追问',
      guidedOpen: '帮助 PHI OS 理解你的情况', guidedEyebrow: 'Guided Context · 临时，不是完整 ICR', guidedLabels: ['正在发生什么？','持续多久了？','涉及谁或什么？','什么发生了变化？','你尝试过什么？','现在最重要的是什么？'], guidedUse: '使用这个临时上下文',
      journeyEyebrow: '现实复杂度边界', journeyHeading: '当一个回答已经不够', journeyPrepare: '把它作为 Reality Journey 探索', journeyConsent: '我明确同意为下游 ICR intake 准备一个临时 Reality entry seed。', journeyHandoff: '明确同意并继续',
      searchMore: '搜索更多知识', entryBoundaryTitle: 'Guest 与 Ask PHI OS 边界', entryBoundaryCopy: 'Guest 可以提问、进行一次有限追问、查看 Related Knowledge，并使用临时上下文。历史、保存、持久化与 Journey continuity 需要 account。Ask 即使看见出生资料，也不会执行 Method，也不会把问题上下文变成 Canonical Reality。',
      volume: '册别', part: '部分', contentType: '内容类型', answerBoundary: '回答边界', journeyEligible: 'KAP W24 确认这个持续且相互依赖的结构需要 Reality Model。这是路由判断，不是诊断。'
    } : {
      heroTitle: 'What would you like to understand?', heroLead: 'Begin with one question. PHI OS keeps the answer grounded, bounded and explicit about what remains unknown.',
      question: 'Question', ask: 'Ask PHI OS', yourQuestion: 'Your question', direct: 'Direct answer', why: 'Why this may happen', observe: 'What to observe',
      unknown: 'What PHI OS does not yet know', related: 'Related knowledge', grounding: 'Sources and grounding', followHeading: 'Ask one follow-up', followLabel: 'Follow-up question', followAction: 'Ask follow-up',
      guidedOpen: 'Help PHI OS understand your situation', guidedEyebrow: 'Guided Context · temporary, not a full ICR', guidedLabels: ['What is happening?','How long?','Who or what is involved?','What changed?','What have you tried?','What matters most now?'], guidedUse: 'Use this temporary context',
      journeyEyebrow: 'Reality complexity boundary', journeyHeading: 'When one answer is not enough', journeyPrepare: 'Explore this as a Reality Journey', journeyConsent: 'I explicitly consent to prepare a temporary Reality entry seed for downstream ICR intake.', journeyHandoff: 'Continue with explicit consent',
      searchMore: 'Search more knowledge', entryBoundaryTitle: 'Guest and Ask PHI OS boundary', entryBoundaryCopy: 'Guests can Ask, receive one limited follow-up, view Related Knowledge and use temporary context. An account is required for history, saved results, persistence and Journey continuity. Ask—including an Ask that sees birth data—does not execute a Method or turn question context into Canonical Reality.',
      volume: 'Volume', part: 'Part', contentType: 'Content type', answerBoundary: 'Answer boundary', journeyEligible: 'KAP W24 confirms that persistent, interdependent structure requires a Reality Model. This is a routing decision, not a diagnosis.'
    };
  }

  const setText = (selector, value) => {
    const node = root.querySelector(selector);
    if (node && value) node.textContent = value;
  };

  function localizeDynamic() {
    const c = copy();
    root.querySelectorAll('.cka-card dl').forEach(dl => {
      const labels = [c.volume, c.part, c.contentType];
      dl.querySelectorAll('dt').forEach((dt, index) => { if (labels[index] && dt.textContent !== labels[index]) dt.textContent = labels[index]; });
    });
    const boundaryTitle = root.querySelector('[data-cka-answer-boundary] strong');
    if (boundaryTitle && boundaryTitle.textContent !== c.answerBoundary) boundaryTitle.textContent = c.answerBoundary;
    const journeyReason = root.querySelector('[data-cka-journey-reason]');
    if (journeyReason && /KAP W24 confirms that persistent, interdependent structure requires a Reality Model/i.test(journeyReason.textContent || '')) {
      journeyReason.textContent = c.journeyEligible;
    }
  }

  function applyLocale() {
    const c = copy();
    document.documentElement.lang = getLocale() === 'zh-Hans' ? 'zh-Hans' : 'en';
    setText('.cka-introduction h1', c.heroTitle);
    setText('.cka-introduction .knowledge-hero__lead', c.heroLead);
    if (form) {
      const label = form.querySelector('label'); if (label) label.textContent = c.question;
      if (submit) submit.textContent = c.ask;
    }
    setText('.cka-answer__question .knowledge-eyebrow', c.yourQuestion);
    const sectionHeadings = root.querySelectorAll('.cka-answer > section > h2');
    [c.direct, c.why, c.observe, c.unknown, c.related].forEach((value, index) => { if (sectionHeadings[index]) sectionHeadings[index].textContent = value; });
    const groundingSummary = root.querySelector('[data-cka-grounding] summary'); if (groundingSummary) groundingSummary.textContent = c.grounding;
    setText('.cka-follow-up > h2', c.followHeading);
    const followLabel = followForm?.querySelector('label'); if (followLabel) followLabel.textContent = c.followLabel;
    if (followSubmit) followSubmit.textContent = c.followAction;
    if (guidedOpen) guidedOpen.textContent = c.guidedOpen;
    setText('.cka-guided__form .knowledge-eyebrow', c.guidedEyebrow);
    root.querySelectorAll('.cka-guided__grid label').forEach((label, index) => {
      const textarea = label.querySelector('textarea');
      if (!textarea || !c.guidedLabels[index]) return;
      for (const node of [...label.childNodes]) if (node.nodeType === Node.TEXT_NODE) node.textContent = '';
      let span = label.querySelector('[data-cka-c-label]');
      if (!span) { span = document.createElement('span'); span.dataset.ckaCLabel = ''; label.prepend(span); }
      span.textContent = c.guidedLabels[index];
    });
    const guidedSubmit = guidedForm?.querySelector('button[type="submit"]'); if (guidedSubmit) guidedSubmit.textContent = c.guidedUse;
    setText('.cka-journey .knowledge-eyebrow', c.journeyEyebrow);
    setText('.cka-journey > h2', c.journeyHeading);
    setText('[data-cka-journey-prepare]', c.journeyPrepare);
    const consentLabel = root.querySelector('[data-cka-journey-consent] label');
    if (consentLabel) {
      const checkbox = consentLabel.querySelector('input');
      [...consentLabel.childNodes].forEach(node => { if (node !== checkbox) node.remove(); });
      consentLabel.append(document.createTextNode(` ${c.journeyConsent}`));
    }
    setText('[data-cka-journey-handoff]', c.journeyHandoff);
    setText('[data-cka-search-more]', c.searchMore);
    const entryBoundary = root.querySelector('.cka-entry-boundary');
    if (entryBoundary) {
      const strong = entryBoundary.querySelector('strong'); if (strong) strong.textContent = c.entryBoundaryTitle;
      const p = entryBoundary.querySelector('p'); if (p) p.textContent = c.entryBoundaryCopy;
    }
    localizeDynamic();
  }

  function autoGrow(textarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 280)}px`;
  }

  function installAccessibility() {
    if (status) { status.id ||= 'cka-status'; status.setAttribute('aria-atomic', 'true'); status.tabIndex = -1; }
    if (input && status) input.setAttribute('aria-describedby', status.id);
    if (followBoundary) { followBoundary.id ||= 'cka-follow-up-boundary'; followBoundary.setAttribute('role', 'status'); followBoundary.setAttribute('aria-live', 'polite'); }
    if (followInput && followBoundary) followInput.setAttribute('aria-describedby', followBoundary.id);
    const directHeading = root.querySelector('[data-cka-section="DIRECT_ANSWER"] h2'); if (directHeading) directHeading.tabIndex = -1;
    const unknownSection = root.querySelector('[data-cka-section="WHAT_PHIOS_DOES_NOT_YET_KNOW"]'); if (unknownSection) unknownSection.setAttribute('aria-label', 'Unknown and boundaries');
    const relatedSection = root.querySelector('[data-cka-section="RELATED_KNOWLEDGE"]'); if (relatedSection) relatedSection.setAttribute('aria-label', 'Related knowledge');
    if (guidedOpen && guidedForm) {
      guidedForm.id ||= 'cka-guided-form'; guidedOpen.setAttribute('aria-controls', guidedForm.id); guidedOpen.setAttribute('aria-expanded', String(!guidedForm.hidden));
    }
    [input, followInput, ...root.querySelectorAll('.cka-guided__grid textarea')].filter(Boolean).forEach(textarea => {
      textarea.addEventListener('input', () => autoGrow(textarea));
    });
  }

  function syncBusy() {
    const loading = status?.dataset.state === 'loading';
    root.setAttribute('aria-busy', String(Boolean(loading)));
    if (submit) submit.disabled = Boolean(loading);
    if (followSubmit) followSubmit.disabled = Boolean(loading);
    if (status?.dataset.state === 'error') status.focus();
    if (followUpPending && status?.dataset.state === 'complete') {
      followUpPending = false;
      root.querySelector('[data-cka-section="DIRECT_ANSWER"] h2')?.focus();
    }
  }

  guidedOpen?.addEventListener('click', () => queueMicrotask(() => guidedOpen.setAttribute('aria-expanded', String(!guidedForm?.hidden))));
  followForm?.addEventListener('submit', () => { followUpPending = true; });

  const observer = new MutationObserver(() => {
    syncBusy();
    localizeDynamic();
  });
  observer.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['data-state', 'hidden'] });

  installAccessibility();
  applyLocale();
  syncBusy();
  onLocaleChange(applyLocale);
}
