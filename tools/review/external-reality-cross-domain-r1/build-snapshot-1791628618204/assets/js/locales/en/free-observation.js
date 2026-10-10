const freeObservation = Object.freeze({
  freeObservation: {
    metaTitle: 'Free Observation — PHI OS',
    skip: 'Skip to Free Observation',
    hero: {
      eyebrow: 'Free Explore · Privacy by default',
      title: 'Observe a change without starting a formal Journey.',
      lead: 'Choose only from broad, non-sensitive options. Nothing is sent to a server, no identity is requested and no professional queue is created.',
      start: 'Begin a local observation',
      privacy: 'Review the privacy boundary'
    },
    privacy: {
      eyebrow: 'PWS-I8 privacy foundation',
      title: 'Local first. Anonymous. Clearable.',
      lead: 'Free Observation is a non-formal browser tool. It is not a Runtime, Reading, diagnosis, professional intake or evidence record.',
      localTitle: 'Browser-local only',
      localCopy: 'A record is saved only when you choose Save locally. It remains in this browser.',
      anonymousTitle: 'No account or identity',
      anonymousCopy: 'No name, email, account, Journey ID or professional reference is collected.',
      sensitiveTitle: 'No sensitive input',
      sensitiveCopy: 'The form has no free-text or file field. Do not provide health, financial, identity, contact or credential data.',
      clearTitle: 'Clear whenever you choose',
      clearCopy: 'Delete one record or clear every locally saved observation from this browser.',
      separationTitle: 'Outside formal systems',
      separationCopy: 'Saving does not create a Journey, Formal Evidence, Runtime Memory, Assignment or Professional Queue entry.',
      retention: 'Local records expire automatically after {days} days.'
    },
    form: {
      eyebrow: 'Bounded observation',
      title: 'Select three broad signals.',
      lead: 'These presets support orientation without collecting a personal history.',
      focusLegend: 'What would you like to notice?',
      signalLegend: 'What kind of signal is present?',
      horizonLegend: 'What time horizon is useful?',
      action: 'Create local orientation',
      required: 'Choose one option in each section.',
      save: 'Save locally',
      saved: 'Saved only in this browser.',
      reset: 'Start another',
      storageUnavailable: 'Local browser storage is unavailable. Nothing was saved.'
    },
    options: {
      focus: {
        change: 'Change',
        direction: 'Direction',
        constraint: 'Constraint',
        continuity: 'Continuity'
      },
      signal: {
        new_difference: 'A new difference',
        unclear_context: 'Context is unclear',
        competing_priorities: 'Priorities compete',
        repeating_pattern: 'A pattern repeats'
      },
      horizon: {
        today: 'Today',
        this_week: 'This week',
        this_month: 'This month'
      }
    },
    result: {
      eyebrow: 'Local orientation',
      title: 'A bounded place to begin.',
      focus: 'Focus',
      signal: 'Signal',
      horizon: 'Horizon',
      orientation: 'Observation',
      evidence: 'Evidence boundary',
      next: 'Small next step',
      boundary: 'This is general orientation. Causes, meaning and permanence remain unknown.'
    },
    orientation: {
      focus: {
        change: 'Notice what is different from the previous state before deciding what it means.',
        direction: 'Locate the current position before comparing possible directions.',
        constraint: 'Separate the fixed boundary from what can still move.',
        continuity: 'Notice what should be preserved and what may need an update.'
      },
      signal: {
        new_difference: 'One difference is a signal, not proof of cause or permanence.',
        unclear_context: 'Missing context remains unknown and must not be filled by assumption.',
        competing_priorities: 'Competing priorities show a decision boundary, not which priority is correct.',
        repeating_pattern: 'Repetition supports further observation but does not establish a universal rule.'
      },
      next: {
        change: 'Compare one before-and-after observation within the selected time horizon.',
        direction: 'Write down one current condition and one condition that would show movement.',
        constraint: 'Identify one boundary and one reversible action that remains available.',
        continuity: 'Identify one element to preserve and one signal that would require review.'
      }
    },
    saved: {
      eyebrow: 'Saved in this browser',
      title: 'Your local observations.',
      lead: 'These records are not synced, uploaded or available to PHI OS, a professional or another device.',
      count: '{count} local records',
      empty: 'No local observations are saved.',
      expires: 'Expires {date}',
      delete: 'Delete this record',
      deleted: 'Local record deleted.',
      clearAll: 'Clear all local records',
      confirmClearAll: 'Confirm clear all',
      cleared: 'All local Free Observation records cleared.'
    },
    upload: {
      eyebrow: 'Server upload boundary',
      title: 'Server upload is not active in this foundation.',
      lead: 'A future upload cannot be inferred from local saving. It will require a separate affirmative action, stated purpose, exact field scope, retention terms and a PWS-I8 revocation path.',
      purpose: 'Purpose must be stated before consent.',
      scope: 'Only the selected preset fields may be in scope.',
      retention: 'Retention and deletion terms must be visible.',
      action: 'No upload request is made on this page.',
      state: 'Capability unavailable · local-only state preserved'
    },
    exits: {
      eyebrow: 'Continue by choice',
      title: 'Free Observation does not force a service route.',
      articles: 'Read published articles',
      journeyOverview: 'Understand the Reality Journey',
      journey: 'Understand the Reality Journey',
      leave: 'Return to Discover'
    }
  }
});

export default freeObservation;
