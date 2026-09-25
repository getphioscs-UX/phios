/* PHI OS Book VI Reconfiguration Atlas translations. Keep keys aligned with zh-Hans. */
const book6Atlas = Object.freeze({
  book6Atlas: {
    ui: {
      eyebrow: 'Civilization Reconfiguration Atlas',
      title: 'Explore how existing civilizations reconfigure.',
      lead: 'Cases, windows, world snapshots, contemporary runtime and lived reality share one evidence-bound Atlas.',
      overview: 'Overview', search: 'Search', cases: 'Cases', timeline: 'Timeline', windows: 'Windows',
      snapshots: 'World Snapshots', dossiers: 'Contemporary Runtime', lived: 'Lived Reality',
      compare: 'Compare Cases', compareRuntime: 'Compare Runtime', unknown: 'Unknown', missing: 'MISSING',
      unverified: 'UNVERIFIED', ask: 'Ask PHI OS about this',
      noRank: 'Profiles, not rankings. Projection ≠ Prediction.',
      open: 'Open', previous: 'Previous', next: 'Next', filters: 'Filters', clear: 'Clear filters',
      results: 'results', version: 'Version', previousVersion: 'Previous version', dataState: 'Data state',
      freshness: 'Freshness', layer: 'Layer', textAlternative: 'Text alternative',
      selectDossier: 'Choose a runtime dossier', selectSnapshot: 'Choose a world snapshot',
      selectDimension: 'Choose a lived-reality dimension', pagination: 'Pagination',
      imageBaseNote: 'One static base visual; switching layers does not replace the image.',
      resolverMissing: 'The configured visual could not be resolved for public delivery.',
      relatedCases: 'Related cases', state: 'State', all: 'All', allTime: 'All time',
      allRegions: 'All regions', allTypes: 'All types', timeWindow: 'Time window', region: 'Region',
      caseType: 'Case type', trigger: 'Trigger', pressureField: 'Pressure field',
      structuralChange: 'Structural change', reconfigurationWindow: 'Reconfiguration window',
      linkedCases: 'linked cases', dimension: 'Dimension', evidenceDate: 'Evidence date',
      historicalVersionNote: 'This historical version is preserved. Neither it nor the active structural version is admitted as live current data, so differences remain Unknown until later evidence admission.',
      selectCasesFirst: 'Select 2–4 cases in Cases first.',
      selectDossiersFirst: 'Select 2–4 dossiers in Contemporary Runtime first.',
      noUniversalScore: 'No universal score',
      livedProfile: 'Lived Reality Profile',
      visuals: 'Visual Atlas',
      visualLibrary: 'Civilization Atlas Visual Library',
      visualLibraryLead: 'Browse the 392 accepted Civilization Atlas visuals without loading them all at once.',
      visualFamily: 'Visual family',
      visualSubject: 'Visual subject',
      visualCount: 'accepted visuals',
      contextFigures: 'Related Book VI figures',
      currentDataNotAdmitted: 'Current data has not been admitted for this dossier.',
      currentDataBoundary: 'The current-data contract is ready, but no evidence-qualified current values are published yet.',
      historicalEvidence: 'Historical evidence',
      searchPlaceholder: 'Search case, region, period, trigger, successor, window, snapshot, dossier, section or lived reality'
    },
    resultType: {
      CASE: 'Case', WINDOW: 'Window', SNAPSHOT: 'World Snapshot', DOSSIER: 'Runtime Dossier',
      BOOK_SECTION: 'Book Section', LIVED_REALITY: 'Lived Reality'
    },
    knowledgeState: {
      CANONICAL_HISTORY: 'Historical', HISTORICAL_RECONSTRUCTION: 'Historical Reconstruction',
      CURRENT_DATA: 'Current', DERIVED_RUNTIME_READOUT: 'Derived Runtime Readout',
      CONDITIONAL_PROJECTION: 'Projection', UNKNOWN: 'Unknown'
    },
    caseType: {
      REFORM: 'Reform', REVOLUTION: 'Revolution', WAR: 'War', COLLAPSE: 'Collapse',
      SUCCESSION: 'Succession', DECOLONIZATION: 'Decolonization', STATE_FORMATION: 'State Formation',
      SYSTEM_REORDERING: 'System Reordering', ECONOMIC_RECONFIGURATION: 'Economic Reconfiguration',
      TECHNOLOGICAL_RECONFIGURATION: 'Technological Reconfiguration', NETWORK_RECONFIGURATION: 'Network Reconfiguration',
      SOCIAL_RECONFIGURATION: 'Social Reconfiguration', HYBRID: 'Hybrid'
    },
    entityType: {
      STATE: 'State', REGION: 'Region', MULTI_STATE_SYSTEM: 'Multi-state System', GLOBAL_RUNTIME: 'Global Runtime'
    },
    region: {
      AFRICA: 'Africa', ASIA: 'Asia', CHINA: 'China', EAST_ASIA: 'East Asia', EURASIA: 'Eurasia',
      EUROPE: 'Europe', GERMANY: 'Germany', GLOBAL: 'Global', GLOBAL_SOUTH: 'Global South', INDIA: 'India',
      INDONESIA: 'Indonesia', JAPAN: 'Japan', KOREA: 'Korea', LATIN_AMERICA: 'Latin America',
      MIDDLE_EAST: 'Middle East', NORTH_AMERICA: 'North America', RUSSIA: 'Russia',
      SOUTHEAST_ASIA: 'Southeast Asia', SOUTH_ASIA: 'South Asia'
    },
    field: {
      priorRuntime: 'Prior Runtime', trigger: 'Trigger', pressure: 'Pressure', successorRuntime: 'Successor Runtime',
      transitionDuration: 'Transition Duration', unknown: 'Unknown', reconfiguration: 'Reconfiguration',
      successorState: 'Successor State', threshold: 'Threshold', removed: 'Removed', preserved: 'Preserved',
      added: 'Added', carrierChange: 'Carrier Change', capacityGain: 'Capacity Gain', loadTransfer: 'Load Transfer',
      dependencyCreated: 'Dependency Created', legacy: 'Legacy', stage: 'Stage', scale: 'Scale', density: 'Density',
      capacity: 'Capacity', load: 'Load', alignment: 'Alignment', resilience: 'Resilience', adaptability: 'Adaptability',
      expansionCapacity: 'Expansion Capacity', futureCapacity: 'Future Capacity', externalDependency: 'External Dependency',
      direction: 'Direction', transitionSignals: 'Transition Signals', personalFutureCapacity: 'Personal Future Capacity',
      evidenceDate: 'Evidence Date', livedReality: 'Lived Reality'
    },
    layer: {
      political: 'Political', population: 'Population', industry: 'Industry', energy: 'Energy', finance: 'Finance',
      trade: 'Trade', military: 'Military', technology: 'Technology', information: 'Information',
      colonialPostcolonial: 'Colonial / Postcolonial'
    },
    change: {
      carrier: 'Carrier Change', boundary: 'Boundary Change', institutional: 'Institutional Change',
      economic: 'Economic Change'
    },
    phrase: {
      PRIOR_REFORM: 'Existing institutional configuration before reform',
      PRIOR_SYSTEM: 'Prior system configuration',
      PRIOR_REVOLUTION: 'Pre-revolutionary political and institutional configuration',
      PRIOR_WAR: 'Pre-war political and institutional configuration',
      PRIOR_COLLAPSE: 'Pre-collapse system configuration',
      PRIOR_ECONOMIC: 'Prior economic and coordination configuration',
      PRIOR_TECH: 'Prior technical and network configuration',
      PRIOR_COLONIAL: 'Colonial political and administrative configuration',
      TRIGGER_REFORM: 'Governed reform and policy reconfiguration',
      TRIGGER_SYSTEM: 'System reconfiguration pressure',
      TRIGGER_REVOLUTION: 'Revolutionary rupture',
      TRIGGER_WAR: 'Armed conflict / wartime mobilization',
      TRIGGER_COLLAPSE: 'System breakdown / loss of coordinating continuity',
      TRIGGER_ECONOMIC: 'Economic-system pressure or institutional change',
      TRIGGER_TECH: 'Technology adoption / infrastructure transition',
      TRIGGER_DECOLONIZATION: 'Decolonization / sovereignty transfer',
      SUCCESSOR_REFORM: 'Revised institutional and economic configuration',
      SUCCESSOR_SYSTEM: 'Successor system configuration',
      SUCCESSOR_POLITICAL: 'Successor political and institutional configuration',
      SUCCESSOR_CONFLICT: 'Post-conflict institutional and system configuration',
      SUCCESSOR_STATES: 'Successor states or institutions',
      SUCCESSOR_ECONOMIC: 'Reconfigured economic and network arrangement',
      SUCCESSOR_TECH: 'Reconfigured technical and coordination layer',
      SUCCESSOR_POSTCOLONIAL: 'Post-colonial state or regional configuration',
      CASE_PRESSURE_BOUNDARY: 'See manuscript-grounded case scope; granular causal weighting is not asserted in B6-WEB-C.',
      CASE_UNKNOWN_BOUNDARY: 'Granular causal attribution, quantitative effects and contested interpretations are not filled by inference.',
      WINDOW_PRESSURE_BOUNDARY: 'Window pressure is represented by the governed set of overlapping cases; no synthetic ranking is created.',
      WINDOW_SUCCESSOR_BOUNDARY: 'Successor configurations remain case-scoped; this window does not assert one deterministic outcome.',
      WINDOW_UNKNOWN_BOUNDARY: 'Window-level causal weighting remains UNKNOWN; linked cases retain their own evidence boundaries.',
      DOSSIER_CURRENT_NOT_ADMITTED: 'Current-data evidence has not been admitted. UNKNOWN is the governed output.'
    },
    value: {
      UNKNOWN: 'Unknown', UNVERIFIED: 'Unverified', NOT_APPLICABLE: 'Not applicable',
      NOT_CURRENT_DATA: 'Not current data', CURRENT_DATA_NOT_ADMITTED: 'Current data not admitted',
      CONTRACT_READY_CURRENT_DATA_NOT_ADMITTED: 'Contract ready; current data not admitted',
      ACTIVE: 'Active', SUPERSEDED: 'Superseded'
    }
  }
});
export default book6Atlas;
