import { canonicalClone } from './canonical-json.js';
import { sha256Hex } from './digest.js';
import { resolveClauses, DAR_CLAUSE_RESOLVER_VERSION } from './clause-resolver.js';
import { evaluateWillEscalation } from '../legal/will/escalation-gate.js';

export const DAR_ASSEMBLY_VERSION = '1.0.0';

function validateFdrLineage(sourceReality) {
  if (sourceReality == null) return { ok: true, value: null };
  const allowed = ['fdrRealityId', 'fdrVersion', 'fdrDigest', 'consentScope'];
  const keys = Object.keys(sourceReality).sort();
  if (keys.some((key) => !allowed.includes(key))) return { ok: false, code: 'FDR_SOURCE_REALITY_MAY_CONTAIN_LINEAGE_ONLY' };
  for (const key of ['fdrRealityId', 'fdrVersion', 'fdrDigest']) {
    if (typeof sourceReality[key] !== 'string' || sourceReality[key].length === 0) return { ok: false, code: `FDR_LINEAGE_MISSING:${key}` };
  }
  if (sourceReality.consentScope !== 'WILL_ASSEMBLY') return { ok: false, code: 'FDR_CONSENT_SCOPE_REQUIRED:WILL_ASSEMBLY' };
  return { ok: true, value: canonicalClone(sourceReality) };
}

export function assembleDocument({ input = {}, template = {}, clauseRegistry = {}, selectionRules = {}, jurisdictionRegistry = {}, sourceReality = null } = {}) {
  const inputDigest = sha256Hex(input);
  const templateDigest = sha256Hex(template);
  const clauseRegistryDigest = sha256Hex(clauseRegistry);
  const selectionRulesDigest = sha256Hex(selectionRules);
  const templateVersion = String(template.templateVersion ?? 'UNVERSIONED');
  const clauseRegistryVersion = String(clauseRegistry.registryVersion ?? 'UNVERSIONED');
  const selectionRulesVersion = String(selectionRules.registryVersion ?? 'UNVERSIONED');
  const determinismBasis = Object.freeze({ inputDigest, templateVersion, templateDigest, clauseRegistryVersion, clauseRegistryDigest, selectionRulesVersion, selectionRulesDigest, resolverVersion: DAR_CLAUSE_RESOLVER_VERSION, assemblyVersion: DAR_ASSEMBLY_VERSION });
  const determinismKey = sha256Hex(determinismBasis);
  const lineage = validateFdrLineage(sourceReality);
  const escalation = evaluateWillEscalation(input, jurisdictionRegistry);
  const resolver = resolveClauses({ input, template, clauseRegistry, selectionRules });

  const warnings = [];
  const templateProductionEnabled = template.productionEnabled === true;
  if (!templateProductionEnabled) warnings.push(Object.freeze({ code: 'TEMPLATE_NOT_PRODUCTION_ENABLED' }));
  if (!lineage.ok) warnings.push(Object.freeze({ code: lineage.code }));
  warnings.push(...escalation.signals.map((entry) => Object.freeze({ code: entry.code, source: entry.source })));
  warnings.push(...resolver.issues.map((entry) => canonicalClone(entry)));

  let assemblyStatus = 'DOCUMENT_CANDIDATE';
  if (!templateProductionEnabled || !lineage.ok || escalation.automaticAssemblyBlocked || resolver.automaticAssemblyBlocked) assemblyStatus = 'AUTOMATIC_ASSEMBLY_BLOCKED';

  const core = {
    schemaVersion: 'PHI-OS-DAR-ASSEMBLY-IR-v1',
    assemblyId: `dar_${determinismKey.slice(0, 24)}`,
    documentType: String(template.documentType ?? 'UNKNOWN'),
    assemblyVersion: DAR_ASSEMBLY_VERSION,
    assemblyStatus,
    jurisdiction: typeof input.jurisdiction === 'string' ? input.jurisdiction : null,
    language: typeof input.language === 'string' ? input.language : null,
    inputDigest,
    templateVersion,
    templateDigest,
    clauseRegistryVersion,
    clauseRegistryDigest,
    selectionRulesVersion,
    selectionRulesDigest,
    resolverVersion: DAR_CLAUSE_RESOLVER_VERSION,
    determinismKey,
    sourceReality: lineage.ok ? lineage.value : null,
    sections: assemblyStatus === 'DOCUMENT_CANDIDATE' ? resolver.sections.map((section) => canonicalClone(section)) : [],
    gates: {
      templateProductionEnabled,
      jurisdictionProductionApproved: escalation.signals.every((entry) => entry.code !== 'UNSUPPORTED_JURISDICTION'),
      legalEscalationClear: escalation.status === 'CLEAR',
      clauseResolutionReady: resolver.status === 'RESOLVED',
      assemblyEligibleForHumanReview: assemblyStatus === 'DOCUMENT_CANDIDATE',
      exportEligible: false,
      legalReviewRequired: escalation.nextState === 'LEGAL_REVIEW_REQUIRED' || resolver.status === 'LEGAL_REVIEW_REQUIRED',
      requiredNextState: escalation.nextState === 'LEGAL_REVIEW_REQUIRED' || resolver.status === 'LEGAL_REVIEW_REQUIRED' ? 'LEGAL_REVIEW_REQUIRED' : null
    },
    warnings
  };
  const assemblyDigest = sha256Hex(core);
  return Object.freeze({ ...canonicalClone(core), assemblyDigest });
}

export default Object.freeze({ assembleDocument, DAR_ASSEMBLY_VERSION });
