const freeExplore = Object.freeze({
  freeExplore: {
    skip: 'Skip to Free Explore',
    hero: {
      eyebrow: 'PJA-W2 · Free Explore',
      title: 'Start with a question. Keep the route yours.',
      lead: 'Choose broad, non-sensitive presets. PHI OS can connect a question to public knowledge or a bounded next step without opening a formal Journey.',
      start: 'Start free exploration',
      atlas: 'Continue to the Reality Atlas'
    },
    boundary: {
      title: 'Free before payment',
      body: 'No life story, formal Evidence, Reconstruction, individual Reading, Provider request or Professional Assignment is created here.',
      local: 'Your choices stay in this browser and are saved only when you choose “Later”.'
    },
    progress: {
      label: 'Free Explore stages',
      current: 'Current stage: {stage}',
      question: 'Question',
      context: 'Context',
      concept: 'Concept',
      example: 'Example',
      reflection: 'Reflection',
      navigation: 'Navigation'
    },
    question: {
      eyebrow: '01 · Question',
      title: 'Which question would you like to explore?',
      lead: 'Select one published or planned knowledge question. No free text or personal history is collected.',
      legend: 'Choose a question',
      options: {
        phi_os_needed: 'Why is PHI OS needed?',
        explanation_reality: 'Why does explanation not equal understanding Reality?',
        navigation_position: 'Why must navigation begin by identifying Reality position?',
        computation_direction: 'Why can computation not automatically create direction?',
        personal_decision_boundary: 'How should I decide what is best for me?'
      }
    },
    context: {
      eyebrow: '02 · Context',
      title: 'Set a light exploration context.',
      lead: 'These choices shape presentation only. They do not classify you, judge a case or create evidence.',
      themeLabel: 'Theme',
      themePlaceholder: 'Choose a knowledge theme',
      contextLegend: 'Situation',
      preferenceLegend: 'Content preference',
      depthLegend: 'Understanding depth',
      contexts: {
        orientation: 'I am orienting',
        learning: 'I am learning a concept',
        change: 'I am noticing change',
        decision_boundary: 'I am locating a decision boundary'
      },
      preferences: {
        article: 'Articles',
        visual: 'Figures and Atlas',
        book: 'Books',
        mixed: 'Mixed formats'
      },
      depths: {
        orientation: 'Quick orientation',
        working: 'Working understanding',
        extended: 'Deeper reading'
      },
      themes: {
        'TH-PREFACE-01': 'Technology Formation and Direction Boundaries',
        'TH-PREFACE-02': 'Knowledge Fragmentation and the Role of PHI OS',
        'TH-PREFACE-03': 'Capability Expansion and System Instability',
        'TH-PREFACE-04': 'Speed Mismatch and Runtime Cost',
        'TH-PREFACE-05': 'Limits of Explanation and the Language of Reality',
        'TH-PREFACE-06': 'Reality Grammar and Navigation Position'
      }
    },
    concept: {
      eyebrow: '03 · Concept',
      title: 'See what the rule engine can connect.',
      lead: 'This is deterministic topic routing from frozen registries, not a diagnosis, recommendation or case judgment.',
      themes: 'Detected themes',
      concepts: 'Matched concepts',
      complexity: 'Routing complexity',
      boundary: 'Boundary',
      noMatch: 'No canonical concept was forced. You can stay in free exploration.',
      levels: {
        1: 'Direct',
        2: 'Connected',
        3: 'Individual boundary',
        4: 'Professional boundary',
        5: 'Urgent professional boundary'
      },
      boundaries: {
        public_knowledge: 'Public knowledge',
        free_observation: 'Free observation',
        individual_analysis_required: 'Individual analysis boundary',
        professional_responsibility_required: 'Professional responsibility boundary',
        unclassified: 'Unclassified'
      }
    },
    example: {
      eyebrow: '04 · Example',
      title: 'Use a general observation prompt.',
      lead: 'Prompts stay general and non-sensitive. They do not interpret causes or generate a personal Reading.',
      label: 'Rule-selected prompts',
      context: 'Selected situation: {context}',
      unknown: 'Unknowns remain unknown until evidence is deliberately established outside Free Explore.'
    },
    reflection: {
      eyebrow: '05 · Reflection',
      title: 'What changed in your understanding?',
      lead: 'Choose a broad reflection. Do not enter names, health, financial, identity or other sensitive information.',
      legend: 'Choose one reflection',
      options: {
        concept_clearer: 'The concept is clearer',
        observe_more: 'I want to observe further',
        uncertainty_remains: 'Important uncertainty remains',
        revisit_later: 'I want to revisit later'
      }
    },
    navigation: {
      eyebrow: '06 · Navigation',
      title: 'Choose a route without losing the free path.',
      lead: 'Knowledge and observation routes come first. Journey and professional routes remain optional information, never a default recommendation.',
      matched: 'Matched public articles',
      noArticle: 'No reviewed and published article currently matches this question.',
      general: 'Other available routes',
      articles: {
        title: 'Articles',
        body: 'Read reviewed and published canonical knowledge.'
      },
      figures: {
        title: 'Figures',
        body: 'Use visual maps to inspect relationships.'
      },
      books: {
        title: 'Books',
        body: 'Follow the longer Book I reading path.'
      },
      atlas: {
        title: 'Atlas',
        body: 'Explore the architecture without entering a formal Journey.'
      },
      observation: {
        title: 'Free Observation',
        body: 'Save a separate, bounded local observation with no free text.'
      },
      journey: {
        title: 'Reality Journey Pass',
        body: 'Read information about the formal Journey before choosing.'
      },
      professional: {
        title: 'Professional Service Information',
        body: 'Review scope and boundaries; no assignment is created.'
      },
      open: 'Open route',
      boundaryNote: 'A route is information, not a determination of what you must do.'
    },
    controls: {
      back: 'Back',
      next: 'Continue',
      required: 'Complete the visible selections to continue.',
      restart: 'Continue free exploration',
      leave: 'Leave',
      later: 'Later',
      saved: 'Saved locally for later.',
      storageUnavailable: 'Local browser storage is unavailable. Nothing was saved.',
      alwaysLabel: 'Always available choices'
    },
    saved: {
      title: 'Saved for later in this browser',
      lead: 'These anonymous preset choices are not synced or uploaded.',
      empty: 'No Free Explore route is saved.',
      expires: 'Expires {date}',
      restore: 'Resume',
      delete: 'Delete',
      clearAll: 'Clear all',
      restored: 'Local route restored.',
      cleared: 'Saved Free Explore routes cleared.'
    },
    state: {
      loading: 'Loading frozen knowledge registries…',
      ready: 'Rule navigation is ready.',
      unavailable: 'Rule navigation is unavailable. No classification was inferred; free exits remain available.'
    }
  }
});

export default freeExplore;
