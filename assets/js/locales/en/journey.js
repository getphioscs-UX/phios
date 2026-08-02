/* PHI OS M3C public Journey translations. Keep keys aligned with zh-Hans/journey.js. */
const journeyPublic = Object.freeze({
  journeyPublic: {
    metaTitle: 'Reality Journey — PHI OS',
    skip: 'Skip to Reality Journey',
    hero: {
      eyebrow: 'Reality Journey',
      title: 'Understand a changing situation, then choose a direction you can review.',
      lead: 'The Reality Journey guides you from describing one change to understanding how it formed, choosing what to try next and returning to see what actually changed.',
      start: 'Start a new Reality Journey',
      resume: 'Already started? Check your current status',
      demo: 'Not ready to enter information? Try the no-save Demo',
      secondaryLabel: 'Other Journey actions',
      stages: '6 customer stages',
      choice: 'You choose whether to continue',
      recovery: 'Saved recovery is shown before it is opened',
      mapLabel: 'Six-stage customer journey',
      factsLabel: 'Journey facts'
    },
    overview: {
      eyebrow: 'One customer journey',
      title: 'Six tasks, each with one clear purpose.',
      lead: 'Internal processing may use more detailed states, but they do not create a second journey for you to learn.',
      stageLabel: 'Stage',
      purposeLabel: 'Purpose',
      actionLabel: 'What happens',
      resultLabel: 'What you leave with',
      preserveLabel: 'What remains protected',
      stagesLabel: 'Reality Journey stages'
    },
    customerStages: {
      enter: { name: 'Enter', task: 'Decide whether PHI OS can help with the change you are facing.', result: 'A clear choice to start, view the Demo or leave without entering personal information.' },
      describe: { name: 'Describe', task: 'Say what changed, when it became noticeable and what it affects.', result: 'A description you can review and correct before moving on.' },
      discover: { name: 'Discover', task: 'Confirm how the situation developed, what influenced it and what is still unknown.', result: 'A corrected account of how the current situation formed.' },
      understand: { name: 'Understand', task: 'See what is happening now, why it matters and where confidence is limited.', result: 'A reality map that keeps evidence, interpretation and unknowns separate.' },
      choose: { name: 'Choose', task: 'Choose one bounded direction and decide what you will observe.', result: 'A next step and a review point, not a command or guaranteed result.' },
      continue: { name: 'Continue', task: 'Compare what you expected with what changed, then decide whether to continue, revise or close.', result: 'A reviewable history that changes only through your explicit choice.' }
    },
    before: {
      eyebrow: 'Before you start',
      title: 'Bring one change you can describe. You do not need a complete explanation.',
      inputTitle: 'What to enter',
      inputCopy: 'Describe one recent change and avoid emergency information, passwords or identity numbers.',
      saveTitle: 'How saving works',
      saveCopy: 'Entry may keep a protected recovery copy in this browser. Existing content stays hidden until you explicitly choose Resume.',
      statusTitle: 'Your current status',
      statusCopy: 'Starting creates a new description. If you already started, check the dashboard before choosing whether to resume or begin again.'
    },
    difference: {
      eyebrow: 'Demo and Journey are different',
      title: 'Try the idea without starting personal continuity.',
      demoTitle: 'Demo',
      demoCopy: 'Uses a fixed teaching case and an optional local input. It creates no personal reading and saves nothing.',
      journeyTitle: 'Reality Journey',
      journeyCopy: 'Uses your description across the six customer stages and may provide browser recovery when clearly disclosed.',
      professionalTitle: 'Professional service',
      professionalCopy: 'Is separate from the Journey and requires its own service, consent, price, scope and human responsibility.'
    },
    stages: {
      entry: {
        name: 'Entry',
        purpose: 'Name the change that made this Reality worth examining.',
        action: 'You report what changed, when it became noticeable, what it affects and what remains unclear.',
        preserve: 'Your words remain reported experience. Missing evidence stays visible.'
      },
      reconstruction: {
        name: 'Reconstruction',
        purpose: 'Rebuild how the current situation formed before interpreting it.',
        action: 'Conditions, timing, relationships, resources, constraints and evidence gaps are organized into one bounded structure.',
        preserve: 'Reconstruction does not diagnose, predict or invent missing facts.'
      },
      reading: {
        name: 'Reading',
        purpose: 'Interpret the current Runtime without promoting inference into fact.',
        action: 'Observed evidence, reported experience, interpretation and Unknown Reality are shown separately.',
        preserve: 'Every conclusion stays traceable to its supporting evidence and confidence boundary.'
      },
      navigation: {
        name: 'Navigation',
        purpose: 'Turn the Reading into bounded directions that can be reviewed.',
        action: 'Available directions, reasons, constraints, first actions and review conditions become explicit.',
        preserve: 'PHI OS presents directions—not commands, guarantees or professional prescriptions.'
      },
      review: {
        name: 'Review',
        purpose: 'Compare what was expected with what actually changed.',
        action: 'You record results, non-changes, surprises, constraints and the next Runtime state.',
        preserve: 'New reports append to history; they do not rewrite the earlier Reading.'
      },
      memory: {
        name: 'Memory',
        purpose: 'Preserve the outcome, unresolved Reality and selected next state.',
        action: 'Authorized Runtime Memory connects the Review to a recoverable timeline and lineage.',
        preserve: 'Only the disclosed information is retained, under the applicable access and privacy controls.'
      },
      continuity: {
        name: 'Continuity',
        purpose: 'Choose how this Reality should continue.',
        action: 'Continue, revise, remain open or start a new Journey without erasing the source Runtime.',
        preserve: 'Transitions require an explicit user choice and preserve parent–child lineage.'
      }
    },
    boundary: {
      eyebrow: 'Privacy & AI boundary',
      title: 'Assistance stays bounded. Human responsibility remains.',
      lead: 'The Journey is designed to support orientation and continuity, not to replace evidence, consent or accountable human judgment.',
      privacyTitle: 'Purpose-limited information',
      privacyCopy: 'The public overview stores nothing. A formal Journey uses information only for the disclosed Runtime and recovery purpose.',
      aiTitle: 'AI-assisted, not AI-authoritative',
      aiCopy: 'AI may help organize or interpret material. Provider output cannot become observed evidence simply because a model produced it.',
      evidenceTitle: 'Uncertainty remains visible',
      evidenceCopy: 'Unknown Reality and missing evidence are preserved instead of being completed by confident language.',
      professionalTitle: 'Not professional or emergency advice',
      professionalCopy: 'PHI OS is not medical diagnosis, legal advice, financial recommendation or an emergency response service.',
      privacyAction: 'Read Privacy Policy',
      aiAction: 'Read AI Disclosure',
      professionalAction: 'Read Professional Boundary'
    },
    start: {
      eyebrow: 'Begin when you are ready',
      title: 'Start with one change you can describe.',
      lead: 'You do not need to understand the whole situation first. Entry begins with what recently became different and keeps uncertainty open.',
      action: 'Start Reality Journey',
      demo: 'Use the no-save Demo first',
      note: 'You can stop before submitting. Avoid entering emergency information or highly sensitive identifiers.'
    }
  },
  journeyDashboard: {
    metaTitle: 'Journey Dashboard — PHI OS',
    skip: 'Skip to Journey Dashboard',
    hero: {
      eyebrow: 'M3C · Journey Dashboard',
      title: 'Continue from the Reality you already established.',
      lead: 'See the current stage, recovery state and historical timeline before deciding whether to resume, revise or begin a separate Journey.',
      overview: 'View Journey Overview',
      readOnly: 'Opening this dashboard does not change your Runtime.'
    },
    loading: 'Reading the recoverable Journey state…',
    error: {
      eyebrow: 'State unavailable',
      title: 'The dashboard could not safely read this Journey.',
      copy: 'No Runtime was changed. Return to the last Journey page or try again after browser storage becomes available.',
      action: 'Return to Journey Overview'
    },
    empty: {
      eyebrow: 'No active Journey',
      title: 'Start when one change is ready to be examined.',
      copy: 'No recoverable Runtime is available in this browser. Entry begins a new Journey without inventing earlier history.',
      start: 'Start Reality Journey',
      overview: 'Understand the seven stages'
    },
    summary: {
      eyebrow: 'Recoverable Runtime',
      title: 'Your Journey at a glance.',
      runtime: 'Runtime',
      currentStage: 'Current Stage',
      completedStages: 'Completed Stages',
      completedValue: '{completed} of {total}',
      nextStep: 'Next Step',
      latestUpdate: 'Latest Update',
      recoveryStatus: 'Recovery Status',
      notEstablished: 'Not established'
    },
    resume: {
      title: 'Continue the current stage',
      copy: 'Resume uses the existing Runtime and does not create a new revision.',
      action: 'Resume Journey'
    },
    progress: {
      eyebrow: 'Journey Progress',
      title: 'Seven stages. One explicit next step.',
      lead: 'Completed stages remain visible. Available does not mean automatically selected or completed.',
      label: 'Journey stage progress'
    },
    stageStatus: {
      current: 'Current',
      completed: 'Completed',
      available: 'Available',
      upcoming: 'Upcoming'
    },
    next: {
      entry: 'Continue Entry',
      reconstruction: 'Continue Reconstruction',
      reading: 'Continue Reading',
      navigation: 'Continue Navigation',
      review: 'Continue Review',
      memory: 'Review Runtime Memory',
      continuity: 'Confirm Continuity'
    },
    recovery: {
      restored: 'Restored in this browser',
      protected: 'Saved for browser recovery',
      sessionOnly: 'Available in this session',
      recoverable: 'Saved Journey available',
      attention: 'Saved state needs attention',
      empty: 'No saved Journey'
    },
    decisions: {
      eyebrow: 'Action Boundary',
      title: 'Resume, revise and start new are different actions.',
      lead: 'The dashboard never treats these choices as interchangeable and never erases the source Runtime.',
      resume: {
        title: 'Resume',
        copy: 'Continue the current stage using the same Runtime and existing evidence.',
        action: 'Resume current Journey'
      },
      revise: {
        title: 'Revise',
        copy: 'Return through Continuity to create an append-only revision linked to the source Reading.',
        action: 'Review revision choice'
      },
      newJourney: {
        title: 'Start New Journey',
        copy: 'Confirm a new Entry through Continuity so the earlier Runtime remains in lineage.',
        action: 'Review new Journey choice'
      },
      boundary: 'Revision and new Runtime creation require explicit Continuity confirmation. This dashboard does not execute either transition.'
    },
    timeline: {
      eyebrow: 'Journey Timeline',
      title: 'Latest Runtime updates.',
      lead: 'Events are read from the existing append-only lineage. They are shown as historical references, not verified evidence.',
      empty: 'No stage event has been recorded yet. Your in-progress Entry can still be resumed.',
      boundary: 'Opening the timeline does not rewrite, promote or delete earlier records.',
      runtime: 'Runtime',
      update: 'Runtime update',
      unknownDate: 'Date unavailable',
      revision: 'Revision {number}',
      path: 'Path',
      outcome: 'Outcome'
    }
  }
});

export default journeyPublic;
