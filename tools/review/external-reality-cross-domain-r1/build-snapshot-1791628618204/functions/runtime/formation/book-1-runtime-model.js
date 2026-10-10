import { getGrammar } from './grammar-registry.js';

const clean = value => typeof value === 'string'
  ? value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  : '';
const list = value => Array.isArray(value) ? value : [];
const itemText = value => clean(value?.statement || value?.summary || value?.sourceText || value);

export const RUNTIME_COORDINATES = Object.freeze([
  { id: 'temporal', label: 'Temporal', zh: '时间' },
  { id: 'condition', label: 'Condition', zh: '条件' },
  { id: 'directional', label: 'Directional', zh: '方向' },
  { id: 'carrier', label: 'Carrier', zh: '载体' },
  { id: 'relational', label: 'Relational', zh: '关系' }
]);

export const CARRIER_ORGANIZATION_LAYERS = Object.freeze([
  { id: 'structure', label: 'Structure Layer', zh: '结构层' },
  { id: 'processing', label: 'Processing Layer', zh: '处理层' },
  { id: 'temporal', label: 'Temporal Layer', zh: '时间层' },
  { id: 'regulation', label: 'Regulation Layer', zh: '调节层' },
  { id: 'physical', label: 'Physical Layer', zh: '物理层' },
  { id: 'interface', label: 'Interface Layer', zh: '界面层' }
]);

export const CARRIER_CONFIGURATION_LAYERS = Object.freeze([
  { id: 'reality_intake', label: 'Reality Intake', zh: '现实输入' },
  { id: 'environment_runtime', label: 'Environment Runtime', zh: '环境运行' },
  { id: 'perceptual_interface', label: 'Perceptual Interface', zh: '感知接口' },
  { id: 'cognition_connectivity', label: 'Cognition / Connectivity', zh: '认知／连接' },
  { id: 'biological_runtime', label: 'Biological Runtime', zh: '生物运行' },
  { id: 'runtime_regulation', label: 'Runtime Regulation', zh: '运行调节' }
]);

export const RUNTIME_CAPABILITIES = Object.freeze([
  { id: 'R1', label: 'Direction', zh: '方向' },
  { id: 'R2', label: 'Understanding', zh: '理解' },
  { id: 'R3', label: 'Expression', zh: '表达' },
  { id: 'R4', label: 'Position', zh: '位置' },
  { id: 'R5', label: 'Resources', zh: '资源' },
  { id: 'R6', label: 'Execution', zh: '执行' },
  { id: 'R7', label: 'Relational', zh: '关系' },
  { id: 'R8', label: 'Survival', zh: '生存' },
  { id: 'R9', label: 'Drive', zh: '驱动' }
]);

export const RUNTIME_DRIVERS = Object.freeze([
  ['D1', 'Solar'], ['D2', 'Lunar'], ['D3', 'Mercurial'], ['D4', 'Venusian'],
  ['D5', 'Martial'], ['D6', 'Jovian'], ['D7', 'Saturnian'], ['D8', 'Uranian'],
  ['D9', 'Neptunian'], ['D10', 'Plutonian'], ['D11', 'Chiron'], ['D12', 'Nodal']
].map(([id, label]) => Object.freeze({ id, label })));

function evidenceFor(runtimeEntry, target) {
  return list(runtimeEntry?.reconstructionEvidence)
    .filter(item => clean(item?.target) === target)
    .map(itemText).filter(Boolean).at(-1) || '';
}

function state(definition, evidence, language) {
  return {
    id: definition.id,
    label: language === 'zh-Hans' ? definition.zh : definition.label,
    canonicalLabel: definition.label,
    status: clean(evidence) ? 'provisional' : 'not_established',
    evidence: clean(evidence),
    evidenceClass: clean(evidence) ? 'reported_experience' : 'unknown_reality'
  };
}

export function buildRuntimeCoordinate(runtimeEntry = {}, language = 'en') {
  const domains = list(runtimeEntry.affectedDomains || runtimeEntry.affectedRealities)
    .map(item => clean(item?.domain || item)).join(' · ');
  const conditions = evidenceFor(runtimeEntry, 'runtime_conditions') ||
    clean(runtimeEntry?.initialContext?.summary) ||
    list(runtimeEntry?.initialContext?.relevantConditions).map(itemText).join(' · ');
  const values = {
    temporal: clean(runtimeEntry?.timing?.statedTiming || runtimeEntry?.timing?.normalizedTiming),
    condition: conditions,
    directional: clean(runtimeEntry?.desiredTransition?.summary || runtimeEntry?.desiredTransition),
    carrier: evidenceFor(runtimeEntry, 'carrier_coordinates'),
    relational: domains.toLowerCase().includes('relationship') || domains.includes('关系')
      ? domains
      : list(runtimeEntry.dependencies).map(itemText).join(' · ')
  };
  return RUNTIME_COORDINATES.map(definition => state(definition, values[definition.id], language));
}

export function buildCarrierOrganization(runtimeEntry = {}, language = 'en') {
  const observed = list(runtimeEntry?.evidenceBoundary?.observedEvidence).map(itemText).join(' · ');
  const values = {
    structure: list(runtimeEntry.affectedDomains).map(item => clean(item?.domain || item)).join(' · '),
    processing: evidenceFor(runtimeEntry, 'experience_style'),
    temporal: clean(runtimeEntry?.timing?.statedTiming || runtimeEntry?.timing?.normalizedTiming),
    regulation: evidenceFor(runtimeEntry, 'agency_style'),
    physical: evidenceFor(runtimeEntry, 'carrier_coordinates'),
    interface: evidenceFor(runtimeEntry, 'expression_style') || observed
  };
  return CARRIER_ORGANIZATION_LAYERS.map(definition => state(definition, values[definition.id], language));
}

export function buildCarrierConfiguration(runtimeEntry = {}, language = 'en') {
  const values = {
    reality_intake: clean(runtimeEntry?.realityChange?.rawStatement || runtimeEntry?.observedChange),
    environment_runtime: evidenceFor(runtimeEntry, 'runtime_conditions') || clean(runtimeEntry?.initialContext?.summary),
    perceptual_interface: evidenceFor(runtimeEntry, 'carrier_coordinates'),
    cognition_connectivity: evidenceFor(runtimeEntry, 'identity_style'),
    biological_runtime: evidenceFor(runtimeEntry, 'carrier_coordinates'),
    runtime_regulation: evidenceFor(runtimeEntry, 'agency_style')
  };
  return CARRIER_CONFIGURATION_LAYERS.map(definition => state(definition, values[definition.id], language));
}

export function buildDecisionContext({ strongestGrammar, primaryCapability, language = 'en' } = {}) {
  const grammar = strongestGrammar?.code ? getGrammar(strongestGrammar.code) : null;
  const capabilityId = clean(primaryCapability?.id || primaryCapability);
  const capability = RUNTIME_CAPABILITIES.find(item => item.id === capabilityId) || null;
  return {
    schemaVersion: 'phi-os.runtime-decision-context.v1',
    activeQuestion: grammar ? {
      id: `Q${Number(grammar.code.slice(1))}`,
      grammar: grammar.code,
      question: clean(grammar.coreQuestion),
      status: 'active'
    } : null,
    primaryCapability: capability ? {
      id: capability.id,
      label: language === 'zh' || language === 'zh-Hans' ? capability.zh : capability.label,
      canonicalLabel: capability.label,
      status: 'available'
    } : null,
    drivers: RUNTIME_DRIVERS.map(driver => ({ ...driver, status: 'not_established' })),
    driverPriority: [],
    guardrails: {
      driversRequireExplicitReaderEvidence: true,
      automaticDriverInferenceAllowed: false,
      driverPriorityRequiredForNavigation: false
    }
  };
}

export default {
  RUNTIME_COORDINATES,
  CARRIER_ORGANIZATION_LAYERS,
  CARRIER_CONFIGURATION_LAYERS,
  RUNTIME_CAPABILITIES,
  RUNTIME_DRIVERS,
  buildRuntimeCoordinate,
  buildCarrierOrganization,
  buildCarrierConfiguration,
  buildDecisionContext
};
