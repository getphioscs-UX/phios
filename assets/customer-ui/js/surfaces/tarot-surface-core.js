import {startRitual} from './ritual-sequence.js';
import {renderQuestionConnection} from './symbolic-question-connection-r2.js';
const q = (selector, scope = document) => scope.querySelector(selector);
const qa = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const arr = value => Array.isArray(value) ? value : [];
const esc = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');
const isZh = () => String(document.documentElement.lang || '').toLowerCase().startsWith('zh');
const t = (en, zh) => isZh() ? zh : en;

const METHOD = 'TAROT';
const CARD_REGISTRY_URL = '/content/professional/core-method-runtime/tarot-card-registry-v1.json';
const SPREAD_REGISTRY_URL = '/content/professional/core-method-runtime/tarot-spread-registry-v2.json';
const EXECUTION_TIMEOUT_MS = 25000;

async function loadJson(url, cache = 'force-cache') {
  const response = await fetch(url, { cache });
  if (!response.ok) throw new Error(`ASSET_UNAVAILABLE:${url}`);
  return response.json();
}

function cryptoShuffle(values) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const random = new Uint32Array(1);
    crypto.getRandomValues(random);
    const j = random[0] % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function orbitalPosition(index, total) {
  const normalizedTotal = Math.max(1, Number(total) || 1);
  const useTwoRings = normalizedTotal > 36;
  const outerCount = useTwoRings ? Math.ceil(normalizedTotal * 0.56) : normalizedTotal;
  const innerCount = normalizedTotal - outerCount;
  const isOuter = !useTwoRings || index < outerCount;
  const ringIndex = isOuter ? index : (index - outerCount);
  const ringCount = isOuter ? outerCount : innerCount;
  const startAngle = -90;
  const angle = startAngle + ((360 / ringCount) * ringIndex);
  const radians = angle * Math.PI / 180;
  const radiusX = isOuter ? 43 : 31;
  const radiusY = isOuter ? 36 : 25;
  return {
    angle,
    x: 50 + (Math.cos(radians) * radiusX),
    y: 50 + (Math.sin(radians) * radiusY),
    ring: isOuter ? 'outer' : 'inner'
  };
}

function createState() {
  return {
    contextPayload: null,
    serverAuthorityOk: false,
    spreadRegistry: null,
    questionGuide: null,
    questionIntent: 'UNDERSTAND_SITUATION',
    spreadId: 'THREE_CARD_SITUATION',
    selectedCardIds: [],
    shuffledCardIds: [],
    currentView: null,
    saveTransportAllowed: false,
    savedReadingId: null,
    isExecuting: false
  };
}

function questionIssues(text, questionGuide) {
  const value = String(text || '').trim();
  const issues = [];
  if (!value) return issues;
  const broadTerms = isZh()
    ? ['工作', '事业', '感情', '关系', '家庭', '钱', '财务', '健康', '未来']
    : ['work', 'career', 'relationship', 'family', 'money', 'financial', 'health', 'future'];
  const hits = broadTerms.filter(term => value.toLowerCase().includes(term.toLowerCase()));
  if (hits.length >= 3) issues.push('TOO_MANY_LIFE_AREAS');
  if (value.length > (questionGuide?.rules?.maxQuestionChars || 360)) issues.push('TOO_LONG');
  if (isZh() ? /[、，].*[、，].*[、，]/.test(value) : /(\band\b.*){3,}/i.test(value)) issues.push('TOO_MANY_PARTS');
  return [...new Set(issues)];
}

function disclosureText(payload) {
  if (!payload) return '';
  if (payload.currentRealityAvailable === true || payload.currentRealityContextAvailable === true) {
    return t(
      'Your current Reality context is available if you explicitly choose it.',
      '如果你明确勾选，当前现实上下文 可以一并比较。'
    );
  }
  return t(
    'No current Reality context is active for comparison right now.',
    '目前没有可供比较的当前现实上下文。'
  );
}

function installation(scope = document) {
  const state = createState();

  const spread = () => arr(state.spreadRegistry?.entries).find(entry => entry.spreadId === state.spreadId) || null;
  const requiredCount = () => spread()?.cardCount || 0;
  const intent = () => arr(state.questionGuide?.intents).find(entry => entry.intentId === state.questionIntent) || null;

  function setExecutionStatus(message = '', mode = '') {
    const node = q('[data-execution-status]', scope);
    if (!node) return;
    node.textContent = message;
    node.dataset.state = mode;
  }

  function updateRealityDisclosure() {
    const node = q('[data-reality-context-disclosure]', scope);
    if (!node) return;
    node.textContent = disclosureText(state.contextPayload);
  }

  function positionCopy() {
    const activeSpread = spread();
    const index = state.selectedCardIds.length;
    if (!activeSpread) return '';
    if (index >= activeSpread.cardCount) {
      return t(
        'Your cards are chosen. You can remove one selected card if you want to swap it before opening the reading.',
        '牌已经选好。若想换掉其中一张，可以先点已选牌将它移除，再补选新牌。'
      );
    }
    const position = activeSpread.positions[index];
    return `<strong>${esc(t(`Card ${index + 1} of ${activeSpread.cardCount} · ${position.labelEn}`, `第 ${index + 1} / ${activeSpread.cardCount} 张 · ${position.labelZhHans}`))}</strong><span>${esc(t('Click a selected card again to remove it and choose another one.', '再次点击已选中的牌即可移除，再选另一张。'))}</span>`;
  }

  function renderSelectionSummary() {
    const node = q('[data-selection-summary]', scope);
    if (!node) return;
    const activeSpread = spread();
    if (!activeSpread || !state.selectedCardIds.length) {
      node.hidden = true;
      node.innerHTML = '';
      return;
    }
    const chosenMarkup = state.selectedCardIds.map((cardId, index) => {
      const position = activeSpread.positions[index];
      return `<button type="button" class="cx-tarot-selected-chip" data-remove-card="${esc(cardId)}"><span class="cx-tarot-selected-chip__index">${index + 1}</span><span class="cx-tarot-selected-chip__label">${esc(t(position.labelEn, position.labelZhHans))}</span></button>`;
    }).join('');
    const complete = state.selectedCardIds.length === requiredCount();
    node.hidden = false;
    node.innerHTML = `
      <strong>${esc(complete ? t('Selection complete.', '选牌完成。') : t(`Selected ${state.selectedCardIds.length} of ${requiredCount()} cards.`, `已选 ${state.selectedCardIds.length} / ${requiredCount()} 张。`))}</strong>
      <p>${esc(t('Tap any selected card below to remove only that card and choose another one.', '点下面任一已选牌，只会移除那一张，然后你可以补选新的牌。'))}</p>
      <div class="cx-tarot-selected-chips">${chosenMarkup}</div>
    `;
    qa('[data-remove-card]', node).forEach(button => {
      button.addEventListener('click', () => removeCard(button.dataset.removeCard));
    });
  }

  function renderDeck() {
    const host = q('[data-card-picker]', scope);
    if (!host) return;
    host.classList.add('cx-tarot-deck--orbital', 'cx-tarot-deck--accessible');
    host.innerHTML = state.shuffledCardIds.map((cardId, index) => {
      const selectedIndex = state.selectedCardIds.indexOf(cardId);
      const selected = selectedIndex >= 0;
      const position = orbitalPosition(index, state.shuffledCardIds.length);
      const selectedLabel = selected ? ` <span class="cx-tarot-card-back__number">${selectedIndex + 1}</span>` : '';
      return `
        <button
          type="button"
          class="cx-tarot-card-back${selected ? ' is-selected' : ''}"
          data-card-id="${esc(cardId)}"
          data-orbit-ring="${position.ring}"
          style="--cx-card-x:${position.x}%;--cx-card-y:${position.y}%;--cx-card-angle:${position.angle}deg"
          aria-pressed="${selected ? 'true' : 'false'}"
          aria-label="${esc(selected ? t(`Selected Tarot card ${selectedIndex + 1}. Click to remove it.`, `已选中的第 ${selectedIndex + 1} 张牌。点击可移除。`) : t(`Facedown Tarot card ${index + 1}`, `第 ${index + 1} 张牌背`))}">
          <span class="cx-tarot-card-back__art" aria-hidden="true"></span>
          ${selectedLabel}
        </button>
      `;
    }).join('');
    host.hidden = false;
    const focus = q('[data-position-focus]', scope);
    if (focus) {
      focus.hidden = false;
      focus.innerHTML = positionCopy();
    }
    const reshuffle = q('[data-reshuffle]', scope);
    if (reshuffle) reshuffle.hidden = false;
    qa('[data-card-id]', host).forEach(button => {
      button.addEventListener('click', () => toggleCard(button.dataset.cardId));
    });
    renderSelectionSummary();
  }

  function updateButton() {
    const button = q('[data-symbolic-execute]', scope);
    const question = q('[data-symbolic-question]', scope)?.value?.trim() || '';
    const issues = state.questionGuide ? questionIssues(question, state.questionGuide) : [];
    if (button) button.disabled = !(state.serverAuthorityOk && state.selectedCardIds.length === requiredCount() && question && !issues.length && !state.isExecuting);
  }

  function checkQuestion() {
    const node = q('[data-question-quality]', scope);
    const question = q('[data-symbolic-question]', scope)?.value || '';
    if (!node) {
      updateButton();
      return;
    }
    const issues = questionIssues(question, state.questionGuide);
    node.classList.toggle('is-warning', issues.length > 0);
    if (issues.length) {
      node.textContent = t(
        'This question covers too much at once. Choose one situation, one relationship, one decision, or one repeating problem before drawing.',
        '这个问题一次包含太多内容。请先缩窄到一个局面、一段关系、一个选择，或一个反复出现的问题，再开始抽牌。'
      );
    } else if (question.trim()) {
      const preferred = intent()?.titleEn || spread()?.titleEn || '';
      const preferredZh = spread()?.titleZhHans || '';
      node.textContent = t(`Recommended: ${preferred}`, `推荐牌阵：${preferredZh}`);
    } else {
      node.textContent = t(
        'Choose a focus above if you are not sure how to ask.',
        '如果不知道怎样问，先从上方选择你想理解的类型。'
      );
    }
    updateButton();
  }

  function renderQuestionGuide() {
    const host = q('[data-question-intents]', scope);
    if (!host || !state.questionGuide) return;
    host.innerHTML = arr(state.questionGuide.intents).map(item => `
      <button type="button" class="cx-tarot-intent" data-intent="${esc(item.intentId)}" aria-pressed="${item.intentId === state.questionIntent}">
        ${esc(t(item.labelEn, item.labelZhHans))}
      </button>
    `).join('');
    qa('[data-intent]', host).forEach(button => button.addEventListener('click', () => chooseIntent(button.dataset.intent)));
    chooseIntent(state.questionIntent, false);
  }

  function chooseIntent(id, focus = true) {
    if (!state.questionGuide) return;
    const record = arr(state.questionGuide.intents).find(entry => entry.intentId === id);
    if (!record) return;
    state.questionIntent = id;
    qa('[data-intent]', scope).forEach(button => button.setAttribute('aria-pressed', String(button.dataset.intent === id)));
    const note = q('[data-question-guidance]', scope);
    if (note) {
      note.innerHTML = `<strong>${esc(t('Suggested question', '建议问法'))}</strong><p>${esc(t(record.exampleEn, record.exampleZhHans))}</p><small>${esc(t(record.promptEn, record.promptZhHans))}</small>`;
    }
    chooseSpread(record.recommendedSpreadId);
    const textarea = q('[data-symbolic-question]', scope);
    if (textarea && !textarea.value.trim()) textarea.placeholder = t(record.exampleEn, record.exampleZhHans);
    checkQuestion();
    if (focus) textarea?.focus();
  }

  function renderSpreadSelector() {
    const host = q('[data-spread-options]', scope);
    if (!host || !state.spreadRegistry) return;
    host.innerHTML = arr(state.spreadRegistry.entries).map(item => `
      <button type="button" class="cx-tarot-spread" data-spread="${esc(item.spreadId)}" aria-pressed="${item.spreadId === state.spreadId}">
        <strong>${esc(t(item.titleEn, item.titleZhHans))}</strong>
        <span>${esc(t(item.summaryEn, item.summaryZhHans))}</span>
        <small>${item.cardCount} ${t('cards', '张')}</small>
      </button>
    `).join('');
    qa('[data-spread]', host).forEach(button => button.addEventListener('click', () => chooseSpread(button.dataset.spread)));
  }

  function chooseSpread(id) {
    if (!arr(state.spreadRegistry?.entries).some(entry => entry.spreadId === id)) return;
    state.spreadId = id;
    state.selectedCardIds = [];
    state.shuffledCardIds = [];
    qa('[data-spread]', scope).forEach(button => button.setAttribute('aria-pressed', String(button.dataset.spread === id)));
    const activeSpread = spread();
    const guide = q('[data-draw-guide]', scope);
    if (guide && activeSpread) {
      guide.innerHTML = `<p>${esc(t(activeSpread.summaryEn, activeSpread.summaryZhHans))}</p><ol>${activeSpread.positions.map(position => `<li>${esc(t(position.labelEn, position.labelZhHans))}</li>`).join('')}</ol>`;
    }
    const picker = q('[data-card-picker]', scope);
    const focus = q('[data-position-focus]', scope);
    const summary = q('[data-selection-summary]', scope);
    const reshuffle = q('[data-reshuffle]', scope);
    if (picker) { picker.hidden = true; picker.innerHTML = ''; }
    if (focus) { focus.hidden = true; focus.innerHTML = ''; }
    if (summary) { summary.hidden = true; summary.innerHTML = ''; }
    if (reshuffle) reshuffle.hidden = true;
    setExecutionStatus('');
    updateButton();
  }

  function removeCard(id) {
    const next = state.selectedCardIds.filter(cardId => cardId !== id);
    if (next.length === state.selectedCardIds.length) return;
    state.selectedCardIds = next;
    renderDeck();
    setExecutionStatus('');
    updateButton();
  }

  let lastCardGesture={id:null,at:-Infinity};
  function toggleCard(id) {
    if (!id || shuffling) return;
    if (!state.shuffledCardIds.includes(id)) return;
    const now=performance.now();
    if(lastCardGesture.id===id&&now-lastCardGesture.at<350)return;
    lastCardGesture={id,at:now};
    if (state.selectedCardIds.includes(id)) {
      removeCard(id);
      return;
    }
    if (state.selectedCardIds.length >= requiredCount()) return;
    state.selectedCardIds.push(id);
    renderDeck();
    if (state.selectedCardIds.length === requiredCount()) {
      setExecutionStatus(t('Cards ready. Open the reading when you are ready.', '牌已选好，准备好后即可打开读取。'), 'ready');
    } else {
      setExecutionStatus('', '');
    }
    updateButton();
  }

  async function loadContext() {
    try {
      const use = q('[data-use-reality-context]', scope)?.checked === true;
      const statusResponse=await fetch('/api/tarot-production-status',{cache:'no-store'});
      const statusPayload = await statusResponse.json();
      state.saveTransportAllowed=statusPayload?.service?.persistence?.writeTransportAllowed===true;
      if(use&&statusPayload?.service?.transport?.maintenanceMode==='READ_ONLY'){
        state.serverAuthorityOk=false;state.contextPayload=null;
        setExecutionStatus(t('Private context is unavailable in this Free read-only service. Turn off Current Reality context to use only your question and cards.','此Free只读服务不能使用私人情境。关闭当前现实情境后，可仅使用问题和选牌。'),'error');
        updateRealityDisclosure();updateButton();return;
      }
      const contextResponse=await fetch(`/api/symbolic-method-context?method=TAROT&useCurrentRealityContext=${use?'1':'0'}`,{cache:'no-store'});
      state.contextPayload=await contextResponse.json();
      state.serverAuthorityOk = contextResponse.ok
        && statusResponse.ok
        && state.contextPayload?.production?.runAllowed === true
        && statusPayload?.production?.runAllowed === true;
      if(!state.serverAuthorityOk)setExecutionStatus(t('Reading is not available in this service configuration. This is not caused by your question or card choice.','当前服务配置暂不能解读，并非你的问题或选牌有误。'),'error');
    } catch {
      state.serverAuthorityOk = false;
      state.contextPayload = null;
      setExecutionStatus(t('The reading service could not be reached. Your question and cards remain on this page.','未能连接解读服务。本页问题与选牌保留。'),'error');
    }
    updateRealityDisclosure();
    updateButton();
  }

  let shuffling=false;
  async function startDraw() {
    if(shuffling)return;
    const questionNode = q('[data-symbolic-question]', scope);
    if (!questionNode?.value?.trim()) {
      questionNode?.focus();
      return;
    }
    shuffling=true;

    const host=q('[data-card-picker]',scope);
    const controls=qa('[data-start-draw], [data-reshuffle], [data-spread], [data-symbolic-execute]',scope);
    const disabled=controls.map(b=>b.disabled);controls.forEach(b=>b.disabled=true);
    if(host){host.hidden=false;host.inert=true;host.setAttribute('aria-busy','true');host.style.display='none';}
    const ritual=startRitual(host,{kind:'tarot',zh:document.documentElement.lang.startsWith('zh')});
    setExecutionStatus(t('Shuffling the deck…','正在洗牌…'),'info');
    try {
    const cards = await loadJson(CARD_REGISTRY_URL);
    state.shuffledCardIds = cryptoShuffle(cards.entries.map(entry => entry.cardId));
    state.selectedCardIds = [];
    renderDeck();
    if(!await ritual.done){state.shuffledCardIds=[];state.selectedCardIds=[];renderDeck();setExecutionStatus(t('Shuffle cancelled. Start again when ready.','洗牌已取消，准备好后可重新开始。'),'info');return;}
    } finally {
      shuffling=false;ritual.stop();
      controls.forEach((b,i)=>b.disabled=disabled[i]);
      if(host){host.inert=false;host.removeAttribute('aria-busy');host.style.display='';}
      updateButton();
    }
    setExecutionStatus(t('Cards shuffled. Choose the cards that draw your attention.', '牌已洗好。请选择最吸引你注意的牌。'), 'info');
    renderDeck();
    updateButton();
  }

  function localizedReadingText(text,composition=state.currentView?.spreadComposition){
    let value=String(text??'');
    return isZh()?value.replaceAll('Reality context','现实上下文').replaceAll('Waite','韦特'):value;
  }

  function render(view) {
    state.currentView = view;
    const composition = view.spreadComposition;
    if (!composition) return;
    const results = q('[data-symbolic-results]', scope);
    if (!results) return;
    results.hidden = false;
    const summary = q('[data-reading-summary]', scope);
    if (summary) summary.textContent = localizedReadingText(t(composition.wholeSpreadSynthesis.narrative.en, composition.wholeSpreadSynthesis.narrative.zhHans),composition);
    const drawDisplay = q('[data-draw-display]', scope);
    if (drawDisplay) {
      drawDisplay.innerHTML = `<div class="sp-card-grid sp-card-grid--reading">${arr(view.hierarchy?.find(entry => entry.id === 'PROJECTION')?.data?.cards).map((card,index) => `
        <article class="sp-card">
          <div class="sp-card__art">${card.artwork?.src ? `<img src="${esc(card.artwork.src)}" alt="${esc(card.canonicalTitle)}" loading="lazy">` : ''}</div>
          <div class="sp-card__body"><p>${esc(card.canonicalTitle)}</p></div>
        </article>
      `).join('')}</div>`;
    }
    const interpretationDisplay = q('[data-interpretation-display]', scope);
    if (interpretationDisplay) {
      interpretationDisplay.innerHTML = renderQuestionConnection(view,isZh()?'zh-Hans':'en') + composition.positionReadings.map((item,index) => `
        <article class="sp-reading-card">
          <p class="sp-kicker">${esc(t(item.position.labelEn, item.position.labelZhHans))}</p>
          <h4>${esc(item.canonicalTitle)}</h4>
          <p>${esc(localizedReadingText(t(item.composedReading.en, item.composedReading.zhHans),composition))}</p>
          <div class="sp-reading-question"><strong>${esc(t('Reality question', '现实追问'))}</strong><p>${esc(t(item.positionPrompt.en, item.positionPrompt.zhHans))}</p></div>
        </article>
      `).join('') + `<section class="sp-reading-card"><h4>${esc(t('How the cards relate', '这些牌如何连起来'))}</h4>${composition.relationships.map(relationship => `<p>${esc(localizedReadingText(t(relationship.statement.en, relationship.statement.zhHans),composition))}</p>`).join('')}</section>`;
    }
    const realityDisplay = q('[data-reality-display]', scope);
    if (realityDisplay) realityDisplay.innerHTML = `<p>${esc(localizedReadingText(t(composition.realityComparison.summary.en, composition.realityComparison.summary.zhHans),composition))}</p>`;
    const nextDisplay = q('[data-next-display]', scope);
    if (nextDisplay) nextDisplay.innerHTML = `<p>${esc(localizedReadingText(t(composition.wholeSpreadSynthesis.decisionBoundary.en, composition.wholeSpreadSynthesis.decisionBoundary.zhHans),composition))}</p>`;
    setExecutionStatus(t('Basic reading ready. No LLM interpretation was generated.', '基础读取已生成，未调用 LLM 深入解读。'), 'done');
    const save=q('[data-symbolic-save]',scope);if(save)save.disabled=!(state.saveTransportAllowed&&state.contextPayload?.account?.saveContractAvailable===true&&!state.savedReadingId);
    results.scrollIntoView({ behavior: 'smooth' });
  }

  async function execute() {
    if (state.isExecuting) return;
    const question = q('[data-symbolic-question]', scope)?.value?.trim() || '';
    const executeButton = q('[data-symbolic-execute]', scope);
    state.isExecuting = true;
    updateButton();
    if (executeButton) executeButton.setAttribute('aria-busy', 'true');
    setExecutionStatus(t('PHI OS is checking your cards…', 'PHI OS 正在检查你的牌……'), 'loading');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort('timeout'), EXECUTION_TIMEOUT_MS);

    try {
      const response = await fetch('/api/symbolic-method-execute', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          method: METHOD,
          question,
          spreadId: state.spreadId,
          selectedCardIds: [...state.selectedCardIds],
          useCurrentRealityContext: q('[data-use-reality-context]', scope)?.checked === true
        }),
        signal: controller.signal
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok){const error=new Error(payload?.error?.code||'EXECUTION_FAILED');error.serviceUnavailable=response.status>=500||response.status===423;error.contentReviewPending=response.status===409&&payload?.error?.code==='TAROT_SELECTED_CARD_CONTENT_REVIEW_PENDING';throw error;}
      state.savedReadingId=null;render(payload.publicView);
    } catch (error) {
      const timedOut = error?.name === 'AbortError' || String(error?.message || '').includes('timeout');
      if(error.serviceUnavailable!==false||timedOut)state.serverAuthorityOk=false;
      setExecutionStatus(
        error.contentReviewPending
          ? t('The selected Fool card content is under review, so this reading is unavailable. Your question, cards and their order remain unchanged; no new draw or payment was made.', '已选愚者牌的内容正在审阅，本次解读暂不提供。原问题、已选牌及顺序保持不变，没有重新抽牌或付款。')
          : timedOut
          ? t('The service did not finish. Your question and selected cards remain on this page; no new draw or payment was made.', '服务未能完成。本页问题与已选牌保留，没有重新抽牌或付款。')
          : t('The reading could not be completed. Your question and selected cards remain on this page; this is not a request to draw again.', '本次解读未能完成。本页问题与已选牌保留，无需重新抽牌。'),
        'error'
      );
    } finally {
      clearTimeout(timeoutId);
      state.isExecuting = false;
      if (executeButton) executeButton.removeAttribute('aria-busy');
      updateButton();
    }
  }

  function installNewReadingReset() {
    const button = q('[data-new-reading]', scope);
    if (!button) return;
    button.addEventListener('click', () => {
      state.currentView = null;
      state.savedReadingId=null;
      const save=q('[data-symbolic-save]',scope);if(save)save.disabled=true;
      const saveStatus=q('[data-save-status]',scope);if(saveStatus)saveStatus.textContent='';
      state.selectedCardIds = [];
      state.shuffledCardIds = [];
      const results = q('[data-symbolic-results]', scope);
      if (results) results.hidden = true;
      chooseSpread(state.spreadId);
      setExecutionStatus('');
      q('[data-reading-step="draw"]', scope)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  async function init({ questionGuideUrl = null } = {}) {
    try {
      const requests = [loadJson(SPREAD_REGISTRY_URL)];
      if (questionGuideUrl) requests.push(loadJson(questionGuideUrl));
      const [spreadPayload, questionPayload] = await Promise.all(requests);
      state.spreadRegistry = spreadPayload;
      state.questionGuide = questionPayload || null;
      renderSpreadSelector();
      if (state.questionGuide) renderQuestionGuide();
      else chooseSpread(state.spreadId);
      await loadContext();

      q('[data-start-draw]', scope)?.addEventListener('click', () => startDraw().catch(() => setExecutionStatus(t('Tarot is temporarily unavailable.', '塔罗暂时无法运行。'), 'error')));
      q('[data-reshuffle]', scope)?.addEventListener('click', () => startDraw().catch(() => setExecutionStatus(t('Tarot is temporarily unavailable.', '塔罗暂时无法运行。'), 'error')));
      q('[data-symbolic-execute]', scope)?.addEventListener('click', () => execute());
      q('[data-symbolic-save]',scope)?.addEventListener('click',async()=>{
        if(!state.currentView||state.savedReadingId||!state.saveTransportAllowed)return;
        if(!confirm(t('Save this exact question and draw to your account?','把本次问题和选牌保存到你的账户吗？')))return;
        const button=q('[data-symbolic-save]',scope),note=q('[data-save-status]',scope);button.disabled=true;
        try{const response=await fetch('/api/symbolic-method-save',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({method:'TAROT',reading:state.currentView})}),payload=await response.json();if(!response.ok)throw Error();state.savedReadingId=payload.recordId;if(note)note.textContent=t('Saved to Account. Reopening uses this same draw.','已保存到账户；重开使用同一次选牌。');}
        catch{if(note)note.textContent=t('Save was not confirmed. No new draw or purchase was made.','尚未确认保存；没有重新抽牌或购买。');button.disabled=false;}
      });
      q('[data-symbolic-question]', scope)?.addEventListener('input', state.questionGuide ? checkQuestion : updateButton);
      q('[data-use-reality-context]', scope)?.addEventListener('change', () => loadContext());
      installNewReadingReset();
      window.addEventListener('phios:localechange',()=>{
        renderSpreadSelector();
        qa('[data-intent]',scope).forEach(button=>{const item=arr(state.questionGuide?.intents).find(i=>i.intentId===button.dataset.intent);if(item)button.textContent=t(item.labelEn,item.labelZhHans);});
        const record=intent(),note=q('[data-question-guidance]',scope);
        if(record&&note)note.innerHTML='<strong>'+esc(t('Suggested question','建议问法'))+'</strong><p>'+esc(t(record.exampleEn,record.exampleZhHans))+'</p><small>'+esc(t(record.promptEn,record.promptZhHans))+'</small>';
        renderSelectionSummary();if(state.shuffledCardIds.length)renderDeck();
        if(state.currentView)render(state.currentView);else if(state.questionGuide)checkQuestion();else updateButton();
      });
      if (state.questionGuide) checkQuestion();
      else updateButton();
    } catch {
      setExecutionStatus(t('Tarot is temporarily unavailable.', '塔罗暂时无法运行。'), 'error');
    }
  }

  return { init };
}

export async function initTarotSurface(options = {}) {
  return installation(document).init(options);
}
