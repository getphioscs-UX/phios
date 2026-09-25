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
    value: {
      UNKNOWN: 'Unknown', UNVERIFIED: 'Unverified', NOT_APPLICABLE: 'Not applicable',
      NOT_CURRENT_DATA: 'Not current data', CURRENT_DATA_NOT_ADMITTED: 'Current data not admitted',
      CONTRACT_READY_CURRENT_DATA_NOT_ADMITTED: 'Contract ready; current data not admitted',
      ACTIVE: 'Active', SUPERSEDED: 'Superseded'
    }
  }
});
export default book6Atlas;
