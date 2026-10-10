/*
 * PHI OS Runtime Grammar Registry
 * Version: 1.0.0
 *
 * Purpose
 * -------
 * This file is the canonical registry for Figure 0A:
 * Reality Formation Grammar (G1–G16).
 *
 * It does not perform AI inference by itself.
 * It defines the stable runtime grammar that other modules use for:
 *
 * - Reality Entry
 * - Reality Reconstruction
 * - Reality Reading
 * - Navigation
 * - Review
 * - Continuity
 *
 * Design principles
 * -----------------
 * 1. Evidence before interpretation.
 * 2. Grammar describes how Reality is operating, not who a person is.
 * 3. A grammar may be active, emerging, provisional, stable, revised,
 *    contradicted, or not established.
 * 4. Multiple grammars may operate at the same time.
 * 5. Grammar confidence is confidence in the current classification,
 *    not certainty about Reality itself.
 * 6. Unknown Reality must be preserved.
 */

/* =========================================================
   VERSION
========================================================= */

export const RUNTIME_GRAMMAR_VERSION = '1.1.0';

export const RUNTIME_GRAMMAR_SCHEMA = 'phi-os.runtime-grammar.v1';


/* =========================================================
   ENUMS
========================================================= */

export const GRAMMAR_STATUS = Object.freeze({
  NOT_ESTABLISHED: 'not_established',
  EMERGING: 'emerging',
  PROVISIONAL: 'provisional',
  ACTIVE: 'active',
  STABLE: 'stable',
  REVISED: 'revised',
  CONTRADICTED: 'contradicted',
  INACTIVE: 'inactive'
});

export const EVIDENCE_CLASS = Object.freeze({
  OBSERVED: 'observed_evidence',
  REPORTED: 'reported_experience',
  DOCUMENTARY: 'documentary_evidence',
  BIOLOGICAL: 'biological_evidence',
  TRANSACTIONAL: 'transactional_evidence',
  SENSOR: 'sensor_evidence',
  THIRD_PARTY: 'third_party_evidence',
  INTERPRETIVE: 'interpretive_material',
  PROFESSIONAL: 'professional_assessment',
  UNKNOWN: 'unknown_reality'
});

export const GRAMMAR_ARC = Object.freeze({
  FORMATION: 'formation',
  ACTIVATION: 'activation',
  INTERNALIZATION: 'internalization',
  REORGANIZATION: 'reorganization',
  CONTINUITY: 'continuity'
});

export const READING_LAYER = Object.freeze({
  FORMATION: 'formation_grammar',
  RECONSTRUCTION: 'runtime_reconstruction',
  INITIALIZATION: 'initialization_coordinate',
  CARRIER: 'carrier_signature',
  REGION: 'runtime_region',
  CONFIGURATION: 'configuration',
  CONSCIOUS: 'conscious_runtime',
  READING: 'integrated_reading',
  NAVIGATION: 'navigation',
  CONTINUITY: 'continuity'
});


/* =========================================================
   ARC DEFINITIONS
========================================================= */

export const FORMATION_ARCS = Object.freeze({
  [GRAMMAR_ARC.FORMATION]: {
    id: GRAMMAR_ARC.FORMATION,
    label: 'Formation Arc',
    chineseLabel: '现实形成弧',
    question: 'Reality 如何从差异开始，逐渐形成结构与场域？',
    description:
      'Reality begins from a detectable difference, encounters constraints, forms structure, and becomes organized within a field.',
    grammars: ['G1', 'G2', 'G3', 'G4'],
    outputObject: 'formation_state'
  },

  [GRAMMAR_ARC.ACTIVATION]: {
    id: GRAMMAR_ARC.ACTIVATION,
    label: 'Activation Arc',
    chineseLabel: '现实激活弧',
    question: 'Reality 如何获得进入时间与载体的条件，并开始运行？',
    description:
      'A formed Reality becomes active when an activation condition opens, a carrier receives it, and a runtime begins.',
    grammars: ['G5', 'G6', 'G7'],
    outputObject: 'activation_state'
  },

  [GRAMMAR_ARC.INTERNALIZATION]: {
    id: GRAMMAR_ARC.INTERNALIZATION,
    label: 'Internalization Arc',
    chineseLabel: '现实内化弧',
    question: 'Reality 如何成为体验、意义、行动与反馈？',
    description:
      'Runtime enters experience, becomes compressed into meaning, produces action, and receives feedback.',
    grammars: ['G8', 'G9', 'G10', 'G11', 'G12'],
    outputObject: 'internalization_state'
  },

  [GRAMMAR_ARC.REORGANIZATION]: {
    id: GRAMMAR_ARC.REORGANIZATION,
    label: 'Reorganization Arc',
    chineseLabel: '现实重组弧',
    question: 'Reality 如何沉淀、重新配置，并形成新的结构？',
    description:
      'Repeated action and feedback settle into an existing state, reorganize prior structure, and allow new organization to emerge.',
    grammars: ['G13', 'G14', 'G15'],
    outputObject: 'reorganization_state'
  },

  [GRAMMAR_ARC.CONTINUITY]: {
    id: GRAMMAR_ARC.CONTINUITY,
    label: 'Continuity Arc',
    chineseLabel: '现实持续弧',
    question: 'Reality 如何跨时间、载体、关系与系统继续？',
    description:
      'Runtime continues beyond a single event, action, identity, or carrier and becomes part of a longer continuous cycle.',
    grammars: ['G16'],
    outputObject: 'continuity_state'
  }
});


/* =========================================================
   SHARED QUESTION TEMPLATES
========================================================= */

const QUESTION_LIBRARY = Object.freeze({
  difference: [
    'What is different now compared with before?',
    'What can you observe now that was not happening previously?',
    'Which part of Reality changed first?'
  ],

  constraint: [
    'What currently limits, blocks, pressures, or narrows this Reality?',
    'Which condition makes the current situation difficult to change?',
    'What competing force keeps the current pattern in place?'
  ],

  structure: [
    'Which people, roles, resources, or repeated conditions form the current structure?',
    'What parts appear to depend on each other?',
    'What arrangement existed before the change began?'
  ],

  field: [
    'What wider environment or context is this Reality occurring within?',
    'Which connected domains are affected?',
    'What external conditions make this change more likely or more difficult?'
  ],

  activation: [
    'When did this change first become noticeable?',
    'What happened shortly before the change began?',
    'Was there a clear event, period, or threshold that activated it?'
  ],

  carrier: [
    'Where is this change being carried most clearly: body, relationship, role, organization, system, or environment?',
    'What part of the current carrier is under the greatest pressure?',
    'Is the current carrier still able to support this Runtime?'
  ],

  runtime: [
    'How has this change continued since it began?',
    'What repeated pattern or sequence has become visible?',
    'Which part now appears to be operating continuously rather than as a single event?'
  ],

  experience: [
    'How is this Reality being experienced by you?',
    'What feelings, bodily responses, or changes in perception appeared?',
    'Which part feels most immediate or difficult to ignore?'
  ],

  compression: [
    'What explanation or meaning have you formed about this change?',
    'What do you currently believe this situation means?',
    'Which part of the story may be an interpretation rather than an observed fact?'
  ],

  action: [
    'What did you begin doing, stop doing, avoid, repeat, or change?',
    'Which action followed the experience or interpretation?',
    'What choice or behavior became different?'
  ],

  feedback: [
    'What happened after that action?',
    'What response came back from Reality?',
    'Did the result strengthen, weaken, or complicate your current understanding?'
  ],

  settlement: [
    'Which part has now become normal, repeated, or difficult to notice?',
    'What pattern appears to have settled into the current Reality?',
    'What has remained in place even when circumstances changed?'
  ],

  reconfiguration: [
    'What former structure is no longer operating in the same way?',
    'Which roles, priorities, boundaries, or relationships are being reorganized?',
    'What has ended, loosened, or changed position?'
  ],

  emergence: [
    'What new structure, direction, role, or possibility is beginning to appear?',
    'What is forming but not yet stable?',
    'Which next state appears possible but not yet established?'
  ],

  continuity: [
    'What continues across time, roles, relationships, or carriers?',
    'Which pattern persists even when the original event is over?',
    'What should be reviewed again in the next Runtime cycle?'
  ]
});


/* =========================================================
   GRAMMAR REGISTRY
========================================================= */

export const GRAMMAR_REGISTRY = Object.freeze({
  G1: {
    code: 'G1',
    slug: 'difference',
    label: 'Difference',
    chineseLabel: '差异',
    arc: GRAMMAR_ARC.FORMATION,
    order: 1,

    coreQuestion: 'What is different now from before?',

    definition:
      'Difference is the first detectable deviation between a previous Reality state and a current or emerging state.',

    does:
      'Identifies that a change has occurred and establishes the minimum contrast required for Reality Entry.',

    doesNot:
      'Does not explain the cause, judge the change, or determine whether the difference is beneficial or harmful.',

    acceptedInputs: [
      'observable change',
      'reported change',
      'event difference',
      'state comparison',
      'before-versus-now statement'
    ],

    expectedOutputs: [
      'previous_state',
      'current_state',
      'observed_difference',
      'difference_scope',
      'difference_confidence'
    ],

    preferredEvidence: [
      EVIDENCE_CLASS.OBSERVED,
      EVIDENCE_CLASS.REPORTED,
      EVIDENCE_CLASS.DOCUMENTARY,
      EVIDENCE_CLASS.TRANSACTIONAL
    ],

    weakEvidence: [
      EVIDENCE_CLASS.INTERPRETIVE
    ],

    questions: QUESTION_LIBRARY.difference,

    completionConditions: [
      'A specific difference between before and now can be stated.',
      'The affected Reality domain is at least partially identified.',
      'The difference is not only a general dissatisfaction without observable change.'
    ],

    unknownsToPreserve: [
      'cause of the difference',
      'whether the change is temporary or stable',
      'whether multiple changes are being conflated'
    ],

    previous: [],
    next: ['G2', 'G3', 'G5', 'G8'],

    readingLayers: [
      READING_LAYER.FORMATION,
      READING_LAYER.RECONSTRUCTION
    ],

    navigationUse:
      'Defines the change that the current navigation cycle must track.'
  },

  G2: {
    code: 'G2',
    slug: 'constraint',
    label: 'Constraint',
    chineseLabel: '约束',
    arc: GRAMMAR_ARC.FORMATION,
    order: 2,

    coreQuestion: 'What limits the range of possible Reality states?',

    definition:
      'Constraint is any condition that limits, shapes, delays, pressures, or redirects how Reality can form or change.',

    does:
      'Identifies limiting conditions, competing forces, boundaries, dependencies, and bottlenecks.',

    doesNot:
      'Does not automatically label a constraint as negative, pathological, or removable.',

    acceptedInputs: [
      'resource limitation',
      'time limitation',
      'relationship pressure',
      'role obligation',
      'environmental condition',
      'institutional rule',
      'biological limitation',
      'psychological tension'
    ],

    expectedOutputs: [
      'primary_constraint',
      'secondary_constraints',
      'constraint_source',
      'constraint_scope',
      'constraint_status'
    ],

    preferredEvidence: [
      EVIDENCE_CLASS.OBSERVED,
      EVIDENCE_CLASS.DOCUMENTARY,
      EVIDENCE_CLASS.TRANSACTIONAL,
      EVIDENCE_CLASS.BIOLOGICAL,
      EVIDENCE_CLASS.REPORTED
    ],

    weakEvidence: [
      EVIDENCE_CLASS.INTERPRETIVE
    ],

    questions: QUESTION_LIBRARY.constraint,

    completionConditions: [
      'At least one limiting or shaping condition is identified.',
      'The constraint is linked to a specific Runtime effect.',
      'The distinction between reported pressure and verified limitation is preserved.'
    ],

    unknownsToPreserve: [
      'whether the constraint is primary or secondary',
      'whether the constraint is external, internal, or relational',
      'whether the constraint can change within the current carrier'
    ],

    previous: ['G1'],
    next: ['G3', 'G4', 'G10', 'G12', 'G13'],

    readingLayers: [
      READING_LAYER.FORMATION,
      READING_LAYER.RECONSTRUCTION,
      READING_LAYER.CONFIGURATION,
      READING_LAYER.NAVIGATION
    ],

    navigationUse:
      'Defines what cannot be ignored when selecting a transition.'
  },

  G3: {
    code: 'G3',
    slug: 'structure',
    label: 'Structure',
    chineseLabel: '结构',
    arc: GRAMMAR_ARC.FORMATION,
    order: 3,

    coreQuestion: 'What parts are organized together, and how?',

    definition:
      'Structure is the relatively stable arrangement of parts, roles, boundaries, resources, and dependencies that organizes Reality.',

    does:
      'Reconstructs the arrangement through which a Runtime becomes coherent and repeatable.',

    doesNot:
      'Does not assume that a visible structure is permanent, optimal, or consciously designed.',

    acceptedInputs: [
      'roles',
      'relationships',
      'resource arrangement',
      'organizational hierarchy',
      'behavioral sequence',
      'system boundary',
      'repeated dependency'
    ],

    expectedOutputs: [
      'structural_parts',
      'roles',
      'boundaries',
      'dependencies',
      'structural_stability',
      'structural_gaps'
    ],

    preferredEvidence: [
      EVIDENCE_CLASS.OBSERVED,
      EVIDENCE_CLASS.DOCUMENTARY,
      EVIDENCE_CLASS.TRANSACTIONAL,
      EVIDENCE_CLASS.THIRD_PARTY
    ],

    weakEvidence: [
      EVIDENCE_CLASS.INTERPRETIVE
    ],

    questions: QUESTION_LIBRARY.structure,

    completionConditions: [
      'The main parts and roles can be named.',
      'At least one dependency or boundary is visible.',
      'The structure can be distinguished from the user’s interpretation of it.'
    ],

    unknownsToPreserve: [
      'hidden dependencies',
      'informal roles',
      'whether the structure existed before the reported change'
    ],

    previous: ['G1', 'G2'],
    next: ['G4', 'G6', 'G7', 'G13'],

    readingLayers: [
      READING_LAYER.FORMATION,
      READING_LAYER.RECONSTRUCTION,
      READING_LAYER.CARRIER,
      READING_LAYER.CONFIGURATION
    ],

    navigationUse:
      'Determines which part of the current arrangement must remain, loosen, or be reorganized.'
  },

  G4: {
    code: 'G4',
    slug: 'field',
    label: 'Field',
    chineseLabel: '场域',
    arc: GRAMMAR_ARC.FORMATION,
    order: 4,

    coreQuestion: 'Within what wider conditions is this Reality operating?',

    definition:
      'Field is the wider relational, environmental, cultural, institutional, or systemic context in which a structure exists and receives pressure or support.',

    does:
      'Places a Runtime inside its connected environment instead of treating it as an isolated event.',

    doesNot:
      'Does not treat every surrounding condition as a direct cause.',

    acceptedInputs: [
      'family context',
      'relationship context',
      'work environment',
      'market environment',
      'social conditions',
      'cultural expectations',
      'organizational climate',
      'physical environment'
    ],

    expectedOutputs: [
      'primary_field',
      'connected_fields',
      'field_pressures',
      'field_supports',
      'field_boundary'
    ],

    preferredEvidence: [
      EVIDENCE_CLASS.OBSERVED,
      EVIDENCE_CLASS.REPORTED,
      EVIDENCE_CLASS.DOCUMENTARY,
      EVIDENCE_CLASS.THIRD_PARTY
    ],

    weakEvidence: [
      EVIDENCE_CLASS.INTERPRETIVE
    ],

    questions: QUESTION_LIBRARY.field,

    completionConditions: [
      'The Runtime is placed within at least one wider context.',
      'Primary and connected domains are distinguished.',
      'Context is not presented as proof of causation.'
    ],

    unknownsToPreserve: [
      'which field has the greatest influence',
      'whether the field is changing or only the carrier is changing',
      'unobserved systemic conditions'
    ],

    previous: ['G1', 'G2', 'G3'],
    next: ['G5', 'G6', 'G7', 'G13', 'G15'],

    readingLayers: [
      READING_LAYER.FORMATION,
      READING_LAYER.RECONSTRUCTION,
      READING_LAYER.CONFIGURATION,
      READING_LAYER.CONTINUITY
    ],

    navigationUse:
      'Prevents navigation from focusing only on the person when the Runtime is field-dependent.'
  },

  G5: {
    code: 'G5',
    slug: 'activation',
    label: 'Activation',
    chineseLabel: '激活',
    arc: GRAMMAR_ARC.ACTIVATION,
    order: 5,

    coreQuestion: 'What opened the Runtime and allowed it to begin?',

    definition:
      'Activation is the event, threshold, timing window, condition, or accumulation that allows a formed possibility to become active Runtime.',

    does:
      'Locates the beginning, trigger, threshold, or activation window of the current change.',

    doesNot:
      'Does not equate temporal proximity with causation.',

    acceptedInputs: [
      'trigger event',
      'date',
      'period',
      'threshold',
      'accumulated pressure',
      'new condition',
      'role change',
      'environmental shift'
    ],

    expectedOutputs: [
      'activation_event',
      'activation_window',
      'activation_conditions',
      'timing_precision',
      'causal_status'
    ],

    preferredEvidence: [
      EVIDENCE_CLASS.OBSERVED,
      EVIDENCE_CLASS.DOCUMENTARY,
      EVIDENCE_CLASS.TRANSACTIONAL,
      EVIDENCE_CLASS.REPORTED
    ],

    weakEvidence: [
      EVIDENCE_CLASS.INTERPRETIVE
    ],

    questions: QUESTION_LIBRARY.activation,

    completionConditions: [
      'A beginning point or activation period is identified.',
      'Timing precision is recorded.',
      'Trigger and cause remain separated unless evidence supports causation.'
    ],

    unknownsToPreserve: [
      'whether the activation was singular or cumulative',
      'whether an earlier unnoticed activation existed',
      'whether the trigger only revealed an existing Runtime'
    ],

    previous: ['G1', 'G2', 'G4'],
    next: ['G6', 'G7', 'G8'],

    readingLayers: [
      READING_LAYER.FORMATION,
      READING_LAYER.RECONSTRUCTION,
      READING_LAYER.INITIALIZATION
    ],

    navigationUse:
      'Defines what future evidence should be watched for reactivation or deactivation.'
  },

  G6: {
    code: 'G6',
    slug: 'carrier',
    label: 'Carrier',
    chineseLabel: '载体',
    arc: GRAMMAR_ARC.ACTIVATION,
    order: 6,

    coreQuestion: 'What is carrying this Runtime?',

    definition:
      'Carrier is the body, person, relationship, role, organization, system, technology, or environment through which Runtime is expressed and sustained.',

    does:
      'Identifies where the Runtime is embodied, organized, or transmitted.',

    doesNot:
      'Does not assume that the carrier is identical to the Runtime or that the current carrier will remain appropriate.',

    acceptedInputs: [
      'human body',
      'identity',
      'relationship',
      'family',
      'job role',
      'organization',
      'software system',
      'institution',
      'shared social structure'
    ],

    expectedOutputs: [
      'carrier_type',
      'carrier_identity',
      'carrier_capacity',
      'carrier_pressure',
      'carrier_fit',
      'carrier_status'
    ],

    preferredEvidence: [
      EVIDENCE_CLASS.OBSERVED,
      EVIDENCE_CLASS.BIOLOGICAL,
      EVIDENCE_CLASS.DOCUMENTARY,
      EVIDENCE_CLASS.REPORTED
    ],

    weakEvidence: [
      EVIDENCE_CLASS.INTERPRETIVE
    ],

    questions: QUESTION_LIBRARY.carrier,

    completionConditions: [
      'The main carrier is identified.',
      'Carrier and Runtime are not treated as the same object.',
      'Any claim about carrier capacity is labeled according to evidence strength.'
    ],

    unknownsToPreserve: [
      'whether another carrier is also active',
      'whether the current carrier is drifting or failing',
      'whether transfer to a new carrier is beginning'
    ],

    previous: ['G3', 'G4', 'G5'],
    next: ['G7', 'G8', 'G12', 'G15'],

    readingLayers: [
      READING_LAYER.INITIALIZATION,
      READING_LAYER.CARRIER,
      READING_LAYER.CONFIGURATION,
      READING_LAYER.CONTINUITY
    ],

    navigationUse:
      'Determines whether navigation should stabilize, adapt, or transition the carrier.'
  },

  G7: {
    code: 'G7',
    slug: 'runtime',
    label: 'Runtime',
    chineseLabel: '运行',
    arc: GRAMMAR_ARC.ACTIVATION,
    order: 7,

    coreQuestion: 'What is now operating continuously?',

    definition:
      'Runtime is the active, repeatable, time-bound operation through which Reality continues to produce states, actions, and effects.',

    does:
      'Distinguishes an ongoing operating pattern from a one-time event.',

    doesNot:
      'Does not assume that repetition alone proves stability or inevitability.',

    acceptedInputs: [
      'repeated sequence',
      'ongoing state',
      'recurring behavior',
      'persistent interaction',
      'continuous system operation'
    ],

    expectedOutputs: [
      'runtime_sequence',
      'runtime_frequency',
      'runtime_duration',
      'runtime_state',
      'runtime_variability'
    ],

    preferredEvidence: [
      EVIDENCE_CLASS.OBSERVED,
      EVIDENCE_CLASS.TRANSACTIONAL,
      EVIDENCE_CLASS.SENSOR,
      EVIDENCE_CLASS.DOCUMENTARY,
      EVIDENCE_CLASS.REPORTED
    ],

    weakEvidence: [
      EVIDENCE_CLASS.INTERPRETIVE
    ],

    questions: QUESTION_LIBRARY.runtime,

    completionConditions: [
      'A repeated or continuous sequence is visible.',
      'Frequency or duration is at least partially established.',
      'Single events are not misclassified as stable Runtime.'
    ],

    unknownsToPreserve: [
      'how long the Runtime will continue',
      'which condition maintains it',
      'whether the Runtime changes across contexts'
    ],

    previous: ['G5', 'G6'],
    next: ['G8', 'G10', 'G11', 'G12'],

    readingLayers: [
      READING_LAYER.FORMATION,
      READING_LAYER.RECONSTRUCTION,
      READING_LAYER.REGION,
      READING_LAYER.READING
    ],

    navigationUse:
      'Defines the current operating pattern that navigation seeks to change or stabilize.'
  },

  G8: {
    code: 'G8',
    slug: 'experience',
    label: 'Experience',
    chineseLabel: '体验',
    arc: GRAMMAR_ARC.INTERNALIZATION,
    order: 8,

    coreQuestion: 'How is this Runtime being experienced?',

    definition:
      'Experience is the lived, felt, perceived, emotional, sensory, or subjective form through which Runtime becomes personal Reality.',

    does:
      'Records feelings, bodily responses, perception, attention, and subjective experience without treating them as objective proof.',

    doesNot:
      'Does not diagnose or convert subjective experience into verified causation.',

    acceptedInputs: [
      'emotion',
      'bodily sensation',
      'subjective perception',
      'attention shift',
      'felt meaning',
      'reported discomfort',
      'reported relief'
    ],

    expectedOutputs: [
      'reported_experience',
      'emotional_weight',
      'perceptual_effect',
      'bodily_response',
      'experience_intensity'
    ],

    preferredEvidence: [
      EVIDENCE_CLASS.REPORTED,
      EVIDENCE_CLASS.BIOLOGICAL,
      EVIDENCE_CLASS.SENSOR
    ],

    weakEvidence: [
      EVIDENCE_CLASS.INTERPRETIVE
    ],

    questions: QUESTION_LIBRARY.experience,

    completionConditions: [
      'The user’s subjective experience is recorded separately from observed evidence.',
      'The strongest felt or perceptual effect is identified.',
      'No diagnostic label is introduced without appropriate evidence.'
    ],

    unknownsToPreserve: [
      'whether the experience is caused by the reported event',
      'whether the experience existed earlier',
      'whether bodily and emotional effects share one cause'
    ],

    previous: ['G5', 'G6', 'G7'],
    next: ['G9', 'G10', 'G11'],

    readingLayers: [
      READING_LAYER.CONSCIOUS,
      READING_LAYER.RECONSTRUCTION,
      READING_LAYER.READING
    ],

    navigationUse:
      'Defines which experience signals should be monitored during transition and review.'
  },

  G9: {
    code: 'G9',
    slug: 'expression',
    label: 'Expression',
    chineseLabel: '表达',
    arc: GRAMMAR_ARC.INTERNALIZATION,
    order: 9,

    coreQuestion: 'How has experience been compressed into meaning, story, or identity?',

    definition:
      'Compression is the process through which complex Runtime experience becomes simplified into meaning, interpretation, memory, rule, label, narrative, or identity.',

    does:
      'Separates current interpretation from observed evidence and identifies the meaning structure organizing experience.',

    doesNot:
      'Does not assume the compressed interpretation is false; it only classifies it as interpretation until supported.',

    acceptedInputs: [
      'belief',
      'story',
      'meaning',
      'self-description',
      'generalization',
      'memory summary',
      'identity statement',
      'causal explanation'
    ],

    expectedOutputs: [
      'interpretive_summary',
      'meaning_frame',
      'compression_rule',
      'identity_link',
      'distortion_risk'
    ],

    preferredEvidence: [
      EVIDENCE_CLASS.REPORTED,
      EVIDENCE_CLASS.INTERPRETIVE
    ],

    weakEvidence: [
      EVIDENCE_CLASS.UNKNOWN
    ],

    questions: QUESTION_LIBRARY.compression,

    completionConditions: [
      'The current meaning or explanation is identified.',
      'Interpretation is explicitly separated from observed evidence.',
      'Possible overgeneralization or compression loss is preserved as uncertainty.'
    ],

    unknownsToPreserve: [
      'whether the interpretation is accurate',
      'what evidence would distinguish alternative meanings',
      'how stable the compressed narrative has become'
    ],

    previous: ['G8'],
    next: ['G10', 'G11', 'G12', 'G13'],

    readingLayers: [
      READING_LAYER.CONSCIOUS,
      READING_LAYER.READING,
      READING_LAYER.NAVIGATION
    ],

    navigationUse:
      'Reveals which meaning frame may support or obstruct transition.'
  },

  G10: {
    code: 'G10',
    slug: 'agency',
    label: 'Agency',
    chineseLabel: '行动主体',
    arc: GRAMMAR_ARC.INTERNALIZATION,
    order: 10,

    coreQuestion: 'What action, avoidance, choice, or behavior followed?',

    definition:
      'Action is the observable movement through which Runtime changes position, resource, relationship, structure, or environment.',

    does:
      'Records what was done, avoided, repeated, delayed, stopped, or changed.',

    doesNot:
      'Does not judge action quality without considering constraints, position, evidence, and outcome.',

    acceptedInputs: [
      'behavior',
      'choice',
      'avoidance',
      'decision',
      'communication',
      'resource use',
      'movement',
      'execution'
    ],

    expectedOutputs: [
      'action',
      'action_type',
      'action_timing',
      'action_target',
      'execution_status',
      'avoidance_pattern'
    ],

    preferredEvidence: [
      EVIDENCE_CLASS.OBSERVED,
      EVIDENCE_CLASS.TRANSACTIONAL,
      EVIDENCE_CLASS.DOCUMENTARY,
      EVIDENCE_CLASS.REPORTED
    ],

    weakEvidence: [
      EVIDENCE_CLASS.INTERPRETIVE
    ],

    questions: QUESTION_LIBRARY.action,

    completionConditions: [
      'At least one action or avoidance behavior is identified.',
      'Action is linked to timing and context.',
      'Intention and outcome remain separate.'
    ],

    unknownsToPreserve: [
      'whether the action caused the result',
      'whether alternatives were available',
      'whether the action reflected choice, pressure, or limited capacity'
    ],

    previous: ['G7', 'G8', 'G9'],
    next: ['G11', 'G12', 'G13'],

    readingLayers: [
      READING_LAYER.RECONSTRUCTION,
      READING_LAYER.CONSCIOUS,
      READING_LAYER.NAVIGATION
    ],

    navigationUse:
      'Provides the behavioral transition point and the basis for future evidence review.'
  },

  G11: {
    code: 'G11',
    slug: 'identity',
    label: 'Identity',
    chineseLabel: '身份',
    arc: GRAMMAR_ARC.INTERNALIZATION,
    order: 11,

    coreQuestion: 'What response returned from Reality after action?',

    definition:
      'Feedback is the response, outcome, signal, consequence, reinforcement, contradiction, or new evidence produced after Runtime action.',

    does:
      'Links action to subsequent evidence while preserving uncertainty about causation.',

    doesNot:
      'Does not treat a single result as proof of a permanent rule.',

    acceptedInputs: [
      'result',
      'outcome',
      'response',
      'consequence',
      'reinforcement',
      'counter-evidence',
      'unexpected effect'
    ],

    expectedOutputs: [
      'feedback_event',
      'feedback_direction',
      'reinforcement_status',
      'counter_evidence',
      'unexpected_outcome'
    ],

    preferredEvidence: [
      EVIDENCE_CLASS.OBSERVED,
      EVIDENCE_CLASS.TRANSACTIONAL,
      EVIDENCE_CLASS.DOCUMENTARY,
      EVIDENCE_CLASS.THIRD_PARTY,
      EVIDENCE_CLASS.REPORTED
    ],

    weakEvidence: [
      EVIDENCE_CLASS.INTERPRETIVE
    ],

    questions: QUESTION_LIBRARY.feedback,

    completionConditions: [
      'A post-action response or outcome is identified.',
      'Supporting and counter-evidence are both considered.',
      'Temporal sequence is not automatically treated as causation.'
    ],

    unknownsToPreserve: [
      'whether the outcome would have occurred without the action',
      'whether feedback was delayed',
      'whether other variables changed simultaneously'
    ],

    previous: ['G8', 'G9', 'G10'],
    next: ['G12', 'G13', 'G14'],

    readingLayers: [
      READING_LAYER.RECONSTRUCTION,
      READING_LAYER.READING,
      READING_LAYER.NAVIGATION,
      READING_LAYER.CONTINUITY
    ],

    navigationUse:
      'Determines whether current navigation should continue, adjust, pause, or reverse.'
  },

  G12: {
    code: 'G12',
    slug: 'feedback',
    label: 'Feedback',
    chineseLabel: '反馈',
    arc: GRAMMAR_ARC.INTERNALIZATION,
    order: 12,

    coreQuestion: 'What has become settled, repeated, normalized, or structurally retained?',

    definition:
      'Settlement is the process through which repeated Runtime becomes relatively stable, normalized, embodied, institutionalized, or difficult to notice.',

    does:
      'Identifies what has become the current baseline or established operating state.',

    doesNot:
      'Does not equate stability with health, correctness, permanence, or desirability.',

    acceptedInputs: [
      'habit',
      'baseline',
      'stable pattern',
      'normalized tension',
      'institutional practice',
      'role expectation',
      'persistent configuration'
    ],

    expectedOutputs: [
      'settled_pattern',
      'baseline_state',
      'settlement_duration',
      'settlement_strength',
      'normalization_risk'
    ],

    preferredEvidence: [
      EVIDENCE_CLASS.OBSERVED,
      EVIDENCE_CLASS.DOCUMENTARY,
      EVIDENCE_CLASS.TRANSACTIONAL,
      EVIDENCE_CLASS.SENSOR,
      EVIDENCE_CLASS.REPORTED
    ],

    weakEvidence: [
      EVIDENCE_CLASS.INTERPRETIVE
    ],

    questions: QUESTION_LIBRARY.settlement,

    completionConditions: [
      'A repeated or normalized pattern is identified.',
      'Its duration or recurrence is at least partially established.',
      'Stability is distinguished from positive functioning.'
    ],

    unknownsToPreserve: [
      'how deeply the pattern is embedded',
      'whether the baseline differs across contexts',
      'whether settlement is reversible within the current carrier'
    ],

    previous: ['G7', 'G9', 'G10', 'G11'],
    next: ['G13', 'G14', 'G15'],

    readingLayers: [
      READING_LAYER.READING,
      READING_LAYER.CARRIER,
      READING_LAYER.CONSCIOUS,
      READING_LAYER.CONTINUITY
    ],

    navigationUse:
      'Defines the baseline from which a transition must begin.'
  },

  G13: {
    code: 'G13',
    slug: 'settlement',
    label: 'Settlement',
    chineseLabel: '沉降',
    arc: GRAMMAR_ARC.REORGANIZATION,
    order: 13,

    coreQuestion: 'What existing arrangement is being reorganized?',

    definition:
      'Reconfiguration is the redistribution of roles, boundaries, resources, position, meaning, relationships, or carrier functions within an existing Runtime.',

    does:
      'Identifies how an established structure is changing before a new stable form has emerged.',

    doesNot:
      'Does not assume that reconfiguration is complete or that the new arrangement is better.',

    acceptedInputs: [
      'role change',
      'boundary change',
      'resource redistribution',
      'relationship reorganization',
      'identity shift',
      'system redesign',
      'priority change'
    ],

    expectedOutputs: [
      'ended_structure',
      'changing_structure',
      'reconfigured_parts',
      'position_shift',
      'transition_status'
    ],

    preferredEvidence: [
      EVIDENCE_CLASS.OBSERVED,
      EVIDENCE_CLASS.DOCUMENTARY,
      EVIDENCE_CLASS.TRANSACTIONAL,
      EVIDENCE_CLASS.REPORTED
    ],

    weakEvidence: [
      EVIDENCE_CLASS.INTERPRETIVE
    ],

    questions: QUESTION_LIBRARY.reconfiguration,

    completionConditions: [
      'The former structure and changing structure are distinguished.',
      'At least one role, boundary, resource, or position shift is visible.',
      'The system does not claim a completed transition prematurely.'
    ],

    unknownsToPreserve: [
      'whether the new configuration will stabilize',
      'which part will resist change',
      'whether carrier capacity is sufficient'
    ],

    previous: ['G2', 'G3', 'G9', 'G10', 'G11', 'G12'],
    next: ['G14', 'G15'],

    readingLayers: [
      READING_LAYER.RECONSTRUCTION,
      READING_LAYER.CONFIGURATION,
      READING_LAYER.NAVIGATION,
      READING_LAYER.CONTINUITY
    ],

    navigationUse:
      'Defines the active transition and which structural changes require monitoring.'
  },

  G14: {
    code: 'G14',
    slug: 'reconfiguration',
    label: 'Reconfiguration',
    chineseLabel: '重组',
    arc: GRAMMAR_ARC.REORGANIZATION,
    order: 14,

    coreQuestion: 'What new Reality is beginning to form?',

    definition:
      'Emergence is the appearance of a new structure, pattern, capacity, relationship, identity, field, or Runtime state that cannot be reduced to a single prior part.',

    does:
      'Identifies what is forming but not yet stable or fully represented.',

    doesNot:
      'Does not treat possibility as certainty or prediction.',

    acceptedInputs: [
      'new role',
      'new pattern',
      'new identity',
      'new structure',
      'new relationship',
      'new capability',
      'new field condition'
    ],

    expectedOutputs: [
      'emerging_structure',
      'emerging_capacity',
      'emergence_conditions',
      'emergence_confidence',
      'stability_requirements'
    ],

    preferredEvidence: [
      EVIDENCE_CLASS.OBSERVED,
      EVIDENCE_CLASS.REPORTED,
      EVIDENCE_CLASS.DOCUMENTARY,
      EVIDENCE_CLASS.TRANSACTIONAL
    ],

    weakEvidence: [
      EVIDENCE_CLASS.INTERPRETIVE
    ],

    questions: QUESTION_LIBRARY.emergence,

    completionConditions: [
      'A possible new structure or capacity is named.',
      'Evidence supporting emergence is distinguished from hope or prediction.',
      'Conditions required for stabilization are identified.'
    ],

    unknownsToPreserve: [
      'whether emergence will stabilize',
      'whether the new structure can coexist with the old one',
      'whether a different new state may emerge'
    ],

    previous: ['G11', 'G12', 'G13'],
    next: ['G15'],

    readingLayers: [
      READING_LAYER.READING,
      READING_LAYER.NAVIGATION,
      READING_LAYER.CONTINUITY
    ],

    navigationUse:
      'Defines the possible next Runtime state without treating it as guaranteed.'
  },

  G15: {
    code: 'G15',
    slug: 'emergence',
    label: 'Emergence',
    chineseLabel: '涌现',
    arc: GRAMMAR_ARC.REORGANIZATION,
    order: 15,

    coreQuestion: 'What continues beyond this event, state, or carrier?',

    definition:
      'Continuity is the persistence, transfer, repetition, inheritance, memory, versioning, or reappearance of Runtime across time, contexts, relationships, identities, systems, or carriers.',

    does:
      'Tracks what continues, transfers, drifts, fails, closes, or reappears across Runtime cycles.',

    doesNot:
      'Does not claim metaphysical continuity, biological inheritance, or cross-carrier transfer without appropriate evidence and explicit interpretive boundaries.',

    acceptedInputs: [
      'repeated pattern across time',
      'generational transfer',
      'organizational memory',
      'identity continuity',
      'relationship continuity',
      'system migration',
      'carrier transition',
      'runtime review history'
    ],

    expectedOutputs: [
      'continuity_pattern',
      'continuity_scope',
      'carrier_status',
      'version_history',
      'transfer_status',
      'next_review_condition'
    ],

    preferredEvidence: [
      EVIDENCE_CLASS.OBSERVED,
      EVIDENCE_CLASS.DOCUMENTARY,
      EVIDENCE_CLASS.TRANSACTIONAL,
      EVIDENCE_CLASS.BIOLOGICAL,
      EVIDENCE_CLASS.SENSOR,
      EVIDENCE_CLASS.REPORTED
    ],

    weakEvidence: [
      EVIDENCE_CLASS.INTERPRETIVE
    ],

    questions: QUESTION_LIBRARY.continuity,

    completionConditions: [
      'A pattern of persistence, transfer, drift, or recurrence is identified.',
      'The carrier and the Runtime are distinguished.',
      'A review condition or next Runtime checkpoint is defined.'
    ],

    unknownsToPreserve: [
      'whether continuity is structural, behavioral, biological, symbolic, or systemic',
      'whether the current carrier will continue',
      'whether closure, transfer, or new emergence is occurring'
    ],

    previous: ['G4', 'G6', 'G11', 'G12', 'G13', 'G14'],
    next: ['G16'],

    readingLayers: [
      READING_LAYER.CONTINUITY,
      READING_LAYER.NAVIGATION,
      READING_LAYER.READING
    ],

    navigationUse:
      'Defines review, persistence, carrier transition, and the opening of the next Runtime cycle.'
  },

  G16: {
    code: 'G16',
    slug: 'continuity',
    label: 'Continuity',
    chineseLabel: '持续',
    arc: GRAMMAR_ARC.CONTINUITY,
    order: 16,
    coreQuestion: 'What continues beyond this event, state, or carrier?',
    definition: 'Continuity is the persistence, transfer, repetition, memory, versioning, or reappearance of Runtime across time, contexts, systems, and carriers.',
    does: 'Tracks what continues, transfers, drifts, closes, or reappears across Runtime cycles.',
    doesNot: 'Does not claim continuity or transfer without evidence and explicit boundaries.',
    acceptedInputs: ['repeated pattern across time', 'runtime memory', 'system migration', 'carrier transition', 'review history'],
    expectedOutputs: ['continuity_pattern', 'continuity_scope', 'version_history', 'transfer_status', 'next_review_condition'],
    preferredEvidence: [EVIDENCE_CLASS.OBSERVED, EVIDENCE_CLASS.DOCUMENTARY, EVIDENCE_CLASS.TRANSACTIONAL, EVIDENCE_CLASS.REPORTED],
    weakEvidence: [EVIDENCE_CLASS.INTERPRETIVE],
    questions: QUESTION_LIBRARY.continuity,
    completionConditions: ['A persistence, transfer, drift, or recurrence pattern is identified.', 'Carrier and Runtime remain distinct.', 'A review condition is defined.'],
    unknownsToPreserve: ['whether the current carrier will continue', 'whether closure, transfer, or new emergence is occurring'],
    previous: ['G4', 'G6', 'G12', 'G13', 'G14', 'G15'],
    next: ['G1'],
    readingLayers: [READING_LAYER.CONTINUITY, READING_LAYER.NAVIGATION, READING_LAYER.READING],
    navigationUse: 'Defines review, persistence, carrier transition, and the next Runtime cycle.'
  }
});


/* =========================================================
   DERIVED INDEXES
========================================================= */

export const GRAMMAR_CODES = Object.freeze(
  Object.keys(GRAMMAR_REGISTRY)
);

export const GRAMMARS_BY_ARC = Object.freeze(
  Object.values(GRAMMAR_ARC).reduce((index, arc) => {
    index[arc] = GRAMMAR_CODES.filter(
      code => GRAMMAR_REGISTRY[code].arc === arc
    );
    return index;
  }, {})
);

export const GRAMMAR_SLUG_INDEX = Object.freeze(
  GRAMMAR_CODES.reduce((index, code) => {
    index[GRAMMAR_REGISTRY[code].slug] = code;
    return index;
  }, {})
);


/* =========================================================
   PUBLIC HELPERS
========================================================= */

export function getGrammar(codeOrSlug) {
  if (!codeOrSlug) {
    return null;
  }

  const normalized = String(codeOrSlug).trim();

  if (GRAMMAR_REGISTRY[normalized]) {
    return GRAMMAR_REGISTRY[normalized];
  }

  const upper = normalized.toUpperCase();

  if (GRAMMAR_REGISTRY[upper]) {
    return GRAMMAR_REGISTRY[upper];
  }

  const code = GRAMMAR_SLUG_INDEX[normalized.toLowerCase()];

  return code
    ? GRAMMAR_REGISTRY[code]
    : null;
}


export function getArc(arcId) {
  if (!arcId) {
    return null;
  }

  return FORMATION_ARCS[
    String(arcId).trim().toLowerCase()
  ] || null;
}


export function getGrammarsForArc(arcId) {
  const arc = getArc(arcId);

  if (!arc) {
    return [];
  }

  return arc.grammars.map(
    code => GRAMMAR_REGISTRY[code]
  );
}


export function getNextGrammars(codeOrSlug) {
  const grammar = getGrammar(codeOrSlug);

  if (!grammar) {
    return [];
  }

  return grammar.next
    .map(code => GRAMMAR_REGISTRY[code])
    .filter(Boolean);
}


export function getPreviousGrammars(codeOrSlug) {
  const grammar = getGrammar(codeOrSlug);

  if (!grammar) {
    return [];
  }

  return grammar.previous
    .map(code => GRAMMAR_REGISTRY[code])
    .filter(Boolean);
}


export function getQuestionsForGrammar(
  codeOrSlug,
  limit = 3
) {
  const grammar = getGrammar(codeOrSlug);

  if (!grammar) {
    return [];
  }

  const safeLimit = Math.max(
    0,
    Math.min(
      Number.isFinite(Number(limit))
        ? Math.floor(Number(limit))
        : 3,
      grammar.questions.length
    )
  );

  return grammar.questions.slice(0, safeLimit);
}


export function createGrammarState(
  codeOrSlug,
  overrides = {}
) {
  const grammar = getGrammar(codeOrSlug);

  if (!grammar) {
    throw new Error(
      `Unknown PHI OS Runtime Grammar: ${codeOrSlug}`
    );
  }

  const statusValues = Object.values(GRAMMAR_STATUS);

  const requestedStatus =
    statusValues.includes(overrides.status)
      ? overrides.status
      : GRAMMAR_STATUS.NOT_ESTABLISHED;

  const confidenceValue = Number(overrides.confidence);

  const confidence =
    Number.isFinite(confidenceValue)
      ? Math.max(0, Math.min(1, confidenceValue))
      : 0;

  return {
    code: grammar.code,
    slug: grammar.slug,
    label: grammar.label,
    chineseLabel: grammar.chineseLabel,
    arc: grammar.arc,

    status: requestedStatus,
    confidence,

    summary:
      typeof overrides.summary === 'string'
        ? overrides.summary.trim()
        : '',

    evidenceIds:
      Array.isArray(overrides.evidenceIds)
        ? [...new Set(overrides.evidenceIds.filter(Boolean))]
        : [],

    counterEvidenceIds:
      Array.isArray(overrides.counterEvidenceIds)
        ? [...new Set(overrides.counterEvidenceIds.filter(Boolean))]
        : [],

    unknowns:
      Array.isArray(overrides.unknowns)
        ? [...new Set(overrides.unknowns.filter(Boolean))]
        : [],

    updatedAt:
      overrides.updatedAt ||
      new Date().toISOString()
  };
}


/* =========================================================
   VALIDATION
========================================================= */

export function validateGrammarRegistry() {
  const errors = [];

  GRAMMAR_CODES.forEach(code => {
    const grammar = GRAMMAR_REGISTRY[code];

    if (grammar.code !== code) {
      errors.push(
        `${code}: grammar.code does not match registry key.`
      );
    }

    if (!FORMATION_ARCS[grammar.arc]) {
      errors.push(
        `${code}: unknown arc "${grammar.arc}".`
      );
    }

    if (!Array.isArray(grammar.questions)) {
      errors.push(
        `${code}: questions must be an array.`
      );
    }

    if (!Array.isArray(grammar.next)) {
      errors.push(
        `${code}: next must be an array.`
      );
    }

    if (!Array.isArray(grammar.previous)) {
      errors.push(
        `${code}: previous must be an array.`
      );
    }

    grammar.next.forEach(nextCode => {
      if (!GRAMMAR_REGISTRY[nextCode]) {
        errors.push(
          `${code}: unknown next grammar "${nextCode}".`
        );
      }
    });

    grammar.previous.forEach(previousCode => {
      if (!GRAMMAR_REGISTRY[previousCode]) {
        errors.push(
          `${code}: unknown previous grammar "${previousCode}".`
        );
      }
    });
  });

  Object.values(FORMATION_ARCS).forEach(arc => {
    arc.grammars.forEach(code => {
      if (!GRAMMAR_REGISTRY[code]) {
        errors.push(
          `${arc.id}: unknown grammar "${code}".`
        );
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
    grammarCount: GRAMMAR_CODES.length,
    arcCount: Object.keys(FORMATION_ARCS).length,
    version: RUNTIME_GRAMMAR_VERSION
  };
}


/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default GRAMMAR_REGISTRY;
