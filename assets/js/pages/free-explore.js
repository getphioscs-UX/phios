import {
  getLocale,
  initializeI18n,
  onLocaleChange,
  t
} from '../i18n.js';
import {
  evaluateQuestionRoute
} from '../modules/pws-i9-rule-engine-core.js';
import {
  FREE_EXPLORE_OPTIONS,
  clearAllFreeExploreSessions,
  clearFreeExploreSession,
  createFreeExploreSession,
  loadFreeExploreSessions,
  saveFreeExploreSession
} from '../modules/free-explore-local.js';

const workspace = document.querySelector('[data-free-explore-workspace]');

if (workspace) {
  initializeI18n();

  const form = workspace.querySelector('[data-free-explore-form]');
  const stages = [...workspace.querySelectorAll('[data-free-stage]')];
  const stageMarkers = [
    ...workspace.querySelectorAll('[data-stage-marker]')
  ];
  const backButton = workspace.querySelector('[data-free-back]');
  const nextButton = workspace.querySelector('[data-free-next]');
  const validation = workspace.querySelector('[data-free-validation]');
  const stageStatus = workspace.querySelector('[data-free-stage-status]');
  const saveStatus = workspace.querySelector('[data-free-save-status]');
  const themeSelect = workspace.querySelector('[name="theme"]');
  const ruleState = workspace.querySelector('[data-free-rule-state]');
  const conceptResult = workspace.querySelector('[data-free-concept-result]');
  const detectedThemes = workspace.querySelector(
    '[data-free-detected-themes]'
  );
  const matchedConcepts = workspace.querySelector(
    '[data-free-matched-concepts]'
  );
  const complexity = workspace.querySelector('[data-free-complexity]');
  const routingBoundary = workspace.querySelector(
    '[data-free-routing-boundary]'
  );
  const observationPrompts = workspace.querySelector(
    '[data-free-observation-prompts]'
  );
  const contextLine = workspace.querySelector('[data-free-context-line]');
  const matchedResources = workspace.querySelector(
    '[data-free-matched-resources]'
  );
  const savedList = workspace.querySelector('[data-free-saved-list]');
  const clearAllButton = workspace.querySelector('[data-free-clear-all]');

  const registryPaths = Object.freeze({
    concepts: '/content/registry/concepts.json',
    themes: '/content/knowledge/registry/themes.json',
    nodes: '/content/knowledge/registry/nodes.json',
    localizedContent:
      '/content/knowledge/registry/localized-content.json',
    assets: '/content/knowledge/registry/assets.json',
    supportingQuestions:
      '/content/knowledge/registry/supporting-questions.json',
    searchAliases:
      '/content/knowledge/registry/search-aliases.json',
    blueprintRegistry:
      '/content/knowledge/blueprints/blueprint-registry.json'
  });

  const questionKeys = Object.freeze({
    phi_os_needed: 'freeExplore.question.options.phi_os_needed',
    explanation_reality:
      'freeExplore.question.options.explanation_reality',
    navigation_position:
      'freeExplore.question.options.navigation_position',
    computation_direction:
      'freeExplore.question.options.computation_direction',
    personal_decision_boundary:
      'freeExplore.question.options.personal_decision_boundary'
  });

  const stageKeys = Object.freeze([
    'question',
    'context',
    'concept',
    'example',
    'reflection',
    'navigation'
  ]);

  let currentStage = 0;
  let registries = null;
  let registryState = 'loading';
  let routeResult = null;

  function selectedValue(name) {
    return form.elements[name]?.value?.trim() || '';
  }

  function currentSelection() {
    return {
      question: selectedValue('question'),
      theme: selectedValue('theme'),
      context: selectedValue('context'),
      contentPreference: selectedValue('contentPreference'),
      depth: selectedValue('depth'),
      reflection: selectedValue('reflection')
    };
  }

  function setSelectedValue(name, value) {
    const control = form.elements[name];
    if (!control) return;

    if (control instanceof RadioNodeList) {
      control.value = value || '';
      return;
    }

    control.value = value || '';
  }

  function stageIsValid(stage) {
    const selection = currentSelection();

    if (stage === 0) return Boolean(selection.question);
    if (stage === 1) {
      return Boolean(
        selection.theme &&
        selection.context &&
        selection.contentPreference &&
        selection.depth
      );
    }
    if (stage === 4) return Boolean(selection.reflection);
    return true;
  }

  function earliestValidStage(requestedStage) {
    if (!stageIsValid(0)) return 0;
    if (requestedStage > 1 && !stageIsValid(1)) return 1;
    if (requestedStage > 4 && !stageIsValid(4)) return 4;
    return Math.max(0, Math.min(5, requestedStage));
  }

  function themeRecords() {
    return Array.isArray(registries?.themes?.themes)
      ? registries.themes.themes
      : [];
  }

  function conceptRecords() {
    return Array.isArray(registries?.concepts?.concepts)
      ? registries.concepts.concepts
      : [];
  }

  function themeLabel(themeCode) {
    const theme = themeRecords()
      .find(record => record.themeCode === themeCode);
    return (
      theme?.titles?.[getLocale()] ||
      theme?.titles?.en ||
      t(`freeExplore.context.themes.${themeCode}`)
    );
  }

  function conceptLabel(conceptId) {
    const concept = conceptRecords()
      .find(record => record.id === conceptId);
    return concept?.[getLocale()] || concept?.en || conceptId;
  }

  function populateThemes() {
    const selected = selectedValue('theme');
    const placeholder = themeSelect.options[0];
    themeSelect.replaceChildren(placeholder);

    for (const themeCode of FREE_EXPLORE_OPTIONS.theme) {
      const option = document.createElement('option');
      option.value = themeCode;
      option.textContent = themeLabel(themeCode);
      themeSelect.append(option);
    }

    themeSelect.value = selected;
  }

  function routeSummary() {
    if (!routeResult) return null;

    return {
      routingBoundary: routeResult.routingBoundary,
      detectedThemes: [...routeResult.detectedThemes],
      matchedConcepts: [...routeResult.matchedConcepts],
      matchedResourceNodeCodes: routeResult.matchedResources
        .map(resource => resource.nodeCode)
    };
  }

  function evaluateSelection() {
    const selection = currentSelection();

    if (!selection.question || !registries) {
      routeResult = null;
      return;
    }

    routeResult = evaluateQuestionRoute({
      questionId: `pja-w2-${selection.question}`,
      question: t(questionKeys[selection.question]),
      locale: getLocale()
    }, registries);
  }

  function tags(container, values, labelFor) {
    const labels = values.map(labelFor);

    if (!labels.length) {
      const empty = document.createElement('span');
      empty.textContent = t('freeExplore.concept.noMatch');
      container.replaceChildren(empty);
      return;
    }

    container.replaceChildren(...labels.map(label => {
      const tag = document.createElement('span');
      tag.textContent = label;
      return tag;
    }));
  }

  function renderRuleState() {
    const message = ruleState.querySelector('span:last-child');
    ruleState.classList.toggle(
      'is-unavailable',
      registryState === 'unavailable'
    );
    message.textContent = t(`freeExplore.state.${registryState}`);

    if (!routeResult) {
      conceptResult.hidden = true;
      return;
    }

    conceptResult.hidden = false;
    tags(
      detectedThemes,
      routeResult.detectedThemes,
      themeLabel
    );
    tags(
      matchedConcepts,
      routeResult.matchedConcepts,
      conceptLabel
    );
    complexity.textContent = t(
      `freeExplore.concept.levels.${routeResult.complexityLevel}`
    );
    routingBoundary.textContent = t(
      `freeExplore.concept.boundaries.${routeResult.routingBoundary}`
    );
  }

  function renderPrompts() {
    const prompts = routeResult?.observationPrompts || [
      t('freeExplore.concept.noMatch')
    ];

    observationPrompts.replaceChildren(...prompts.map(prompt => {
      const item = document.createElement('li');
      item.textContent = prompt;
      return item;
    }));

    const selectedContext = selectedValue('context');
    const context = selectedContext
      ? t(`freeExplore.context.contexts.${selectedContext}`)
      : '—';
    contextLine.textContent = t(
      'freeExplore.example.context',
      { context }
    );
  }

  function routeOrder(preference) {
    const orders = {
      article: [
        'articles',
        'figures',
        'books',
        'atlas',
        'free-observation',
        'reality-journey-pass-information',
        'professional-service-information'
      ],
      visual: [
        'figures',
        'atlas',
        'articles',
        'books',
        'free-observation',
        'reality-journey-pass-information',
        'professional-service-information'
      ],
      book: [
        'books',
        'articles',
        'figures',
        'atlas',
        'free-observation',
        'reality-journey-pass-information',
        'professional-service-information'
      ],
      mixed: [
        'articles',
        'figures',
        'books',
        'atlas',
        'free-observation',
        'reality-journey-pass-information',
        'professional-service-information'
      ]
    };

    return orders[preference] || orders.mixed;
  }

  function arrangeGeneralRoutes() {
    const container = workspace.querySelector(
      '.free-explore__general .free-explore__routes'
    );
    const byType = new Map(
      [...container.querySelectorAll('[data-route-type]')]
        .map(route => [route.dataset.routeType, route])
    );

    for (const type of routeOrder(selectedValue('contentPreference'))) {
      const route = byType.get(type);
      if (route) container.append(route);
    }
  }

  function renderResources() {
    const depthLimits = {
      orientation: 1,
      working: 2,
      extended: 5
    };
    const limit = depthLimits[selectedValue('depth')] || 2;
    const resources = (routeResult?.matchedResources || []).slice(0, limit);

    const knowledgeQuestion = selectedValue('question')
      ? t(questionKeys[selectedValue('question')])
      : '';
    const askKnowledge = document.createElement('a');
    askKnowledge.className = 'free-explore__route is-matched';
    askKnowledge.dataset.routeType = 'knowledge-access';
    askKnowledge.href = `/knowledge-search${knowledgeQuestion ? `?q=${encodeURIComponent(knowledgeQuestion)}` : ''}`;
    const askMarker = document.createElement('span');
    askMarker.setAttribute('aria-hidden', 'true');
    askMarker.textContent = 'Q';
    const askTitle = document.createElement('strong');
    askTitle.textContent = getLocale() === 'zh-Hans' ? '询问 PHI OS Knowledge' : 'Ask PHI OS Knowledge';
    const askBody = document.createElement('p');
    askBody.textContent = getLocale() === 'zh-Hans'
      ? '同时检索 Published Knowledge 与已完成书稿，不需要等待 Article publication。'
      : 'Search Published Knowledge and completed manuscripts without waiting for Article publication.';
    askKnowledge.append(askMarker, askTitle, askBody);

    if (!resources.length) {
      matchedResources.replaceChildren(askKnowledge);
      arrangeGeneralRoutes();
      return;
    }

    matchedResources.replaceChildren(askKnowledge, ...resources.map(resource => {
      const route = document.createElement('a');
      route.className = 'free-explore__route is-matched';
      route.href = resource.href;
      route.dataset.routeType = 'matched-article';

      const marker = document.createElement('span');
      marker.setAttribute('aria-hidden', 'true');
      marker.textContent = 'Aa';

      const title = document.createElement('strong');
      title.textContent = resource.title;

      const body = document.createElement('p');
      body.textContent = t('freeExplore.navigation.articles.body');

      route.append(marker, title, body);
      return route;
    }));

    arrangeGeneralRoutes();
  }

  function renderStage() {
    stages.forEach((stage, index) => {
      const active = index === currentStage;
      stage.hidden = !active;
      stage.classList.toggle('is-active', active);
    });

    stageMarkers.forEach((marker, index) => {
      marker.classList.toggle('is-current', index === currentStage);
      marker.classList.toggle('is-complete', index < currentStage);
      if (index === currentStage) {
        marker.setAttribute('aria-current', 'step');
      } else {
        marker.removeAttribute('aria-current');
      }
    });

    backButton.disabled = currentStage === 0;
    nextButton.hidden = currentStage === 5;
    validation.textContent = '';

    const stageLabel = t(
      `freeExplore.progress.${stageKeys[currentStage]}`
    );
    stageStatus.textContent = t(
      'freeExplore.progress.current',
      { stage: stageLabel }
    );

    if (currentStage === 2) renderRuleState();
    if (currentStage === 3) renderPrompts();
    if (currentStage === 5) renderResources();
  }

  function goToStage(stage) {
    currentStage = Math.max(0, Math.min(5, stage));
    renderStage();
  }

  function renderSavedSessions() {
    let sessions = [];

    try {
      sessions = loadFreeExploreSessions();
    } catch {
      saveStatus.textContent = t(
        'freeExplore.controls.storageUnavailable'
      );
    }

    clearAllButton.hidden = sessions.length === 0;

    if (!sessions.length) {
      const empty = document.createElement('p');
      empty.textContent = t('freeExplore.saved.empty');
      savedList.replaceChildren(empty);
      return;
    }

    savedList.replaceChildren(...sessions.map(session => {
      const item = document.createElement('article');
      item.className = 'free-explore__saved-item';
      item.dataset.sessionId = session.sessionId;

      const copy = document.createElement('div');
      const question = document.createElement('p');
      question.textContent = session.selection.question
        ? t(questionKeys[session.selection.question])
        : t('freeExplore.saved.title');
      const expiry = document.createElement('small');
      expiry.textContent = t('freeExplore.saved.expires', {
        date: new Intl.DateTimeFormat(getLocale(), {
          dateStyle: 'medium'
        }).format(new Date(session.expiresAt))
      });
      copy.append(question, expiry);

      const actions = document.createElement('div');
      actions.className = 'free-explore__saved-actions';

      const restore = document.createElement('button');
      restore.className = 'free-explore__text-button';
      restore.type = 'button';
      restore.dataset.restoreSession = session.sessionId;
      restore.textContent = t('freeExplore.saved.restore');

      const remove = document.createElement('button');
      remove.className = 'free-explore__text-button';
      remove.type = 'button';
      remove.dataset.deleteSession = session.sessionId;
      remove.textContent = t('freeExplore.saved.delete');

      actions.append(restore, remove);
      item.append(copy, actions);
      return item;
    }));
  }

  function saveForLater() {
    try {
      const session = createFreeExploreSession(
        currentSelection(),
        routeSummary(),
        { currentStage }
      );
      saveFreeExploreSession(session);
      saveStatus.textContent = t('freeExplore.controls.saved');
      renderSavedSessions();
    } catch {
      saveStatus.textContent = t(
        'freeExplore.controls.storageUnavailable'
      );
    }
  }

  function restoreSession(sessionId) {
    let session;

    try {
      session = loadFreeExploreSessions()
        .find(record => record.sessionId === sessionId);
    } catch {
      session = null;
    }

    if (!session) return;

    for (const [name, value] of Object.entries(session.selection)) {
      setSelectedValue(name, value);
    }

    evaluateSelection();
    currentStage = earliestValidStage(session.currentStage);
    renderStage();
    saveStatus.textContent = t('freeExplore.saved.restored');
    workspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function loadRegistries() {
    try {
      const entries = await Promise.all(
        Object.entries(registryPaths).map(async ([key, url]) => {
          const response = await fetch(url, {
            credentials: 'same-origin',
            headers: { accept: 'application/json' }
          });

          if (!response.ok) {
            throw new Error(`registry_unavailable_${key}`);
          }

          return [key, await response.json()];
        })
      );

      registries = Object.fromEntries(entries);
      const blueprintEntries = Array.isArray(registries.blueprintRegistry?.books)
        ? registries.blueprintRegistry.books
        : [];
      const blueprints = await Promise.all(blueprintEntries.map(async entry => {
        const response = await fetch(`/${entry.blueprintPath}`, {
          credentials: 'same-origin',
          headers: { accept: 'application/json' }
        });
        if (!response.ok) throw new Error(`blueprint_unavailable_${entry.bookCode}`);
        return response.json();
      }));
      registries.blueprint = {
        books: blueprints,
        parts: blueprints.flatMap(blueprint => blueprint.parts || []),
        nodes: blueprints.flatMap(blueprint => blueprint.nodes || [])
      };
      registryState = 'ready';
      populateThemes();
      evaluateSelection();
      renderStage();
    } catch {
      registries = null;
      registryState = 'unavailable';
      routeResult = null;
      renderStage();
    }
  }

  nextButton.addEventListener('click', () => {
    if (!stageIsValid(currentStage)) {
      validation.textContent = t('freeExplore.controls.required');
      return;
    }

    if (currentStage === 1) evaluateSelection();
    goToStage(currentStage + 1);
  });

  backButton.addEventListener('click', () => {
    goToStage(currentStage - 1);
  });

  form.addEventListener('change', event => {
    validation.textContent = '';
    saveStatus.textContent = '';

    if (event.target?.name === 'question') {
      routeResult = null;
    }
  });

  workspace.querySelector('[data-free-restart]')
    .addEventListener('click', () => {
      form.reset();
      routeResult = null;
      goToStage(0);
      saveStatus.textContent = '';
      workspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

  workspace.querySelector('[data-free-save]')
    .addEventListener('click', saveForLater);

  savedList.addEventListener('click', event => {
    const restore = event.target.closest('[data-restore-session]');
    const remove = event.target.closest('[data-delete-session]');

    if (restore) {
      restoreSession(restore.dataset.restoreSession);
      return;
    }

    if (remove) {
      try {
        clearFreeExploreSession(remove.dataset.deleteSession);
        renderSavedSessions();
      } catch {
        saveStatus.textContent = t(
          'freeExplore.controls.storageUnavailable'
        );
      }
    }
  });

  clearAllButton.addEventListener('click', () => {
    try {
      clearAllFreeExploreSessions();
      saveStatus.textContent = t('freeExplore.saved.cleared');
      renderSavedSessions();
    } catch {
      saveStatus.textContent = t(
        'freeExplore.controls.storageUnavailable'
      );
    }
  });

  onLocaleChange(() => {
    populateThemes();
    evaluateSelection();
    renderStage();
    renderSavedSessions();
  });

  renderStage();
  renderSavedSessions();
  populateThemes();
  loadRegistries();
}
