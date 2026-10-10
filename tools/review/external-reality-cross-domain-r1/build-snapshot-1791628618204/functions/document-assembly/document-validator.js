import { evaluateWillShareIntegrity } from '../legal/will/share-integrity.js';

const REQUIRED_WILL_FIELDS = Object.freeze([
  'persons','testator','jurisdiction','domicile','executors','substituteExecutors','guardians','substituteGuardians','beneficiaries',
  'properties','businessInterests','bankAssets','investments','insurance','epf','prs','vehicles','jewellery','digitalAssets','otherAssets',
  'specificGifts','residuaryDistribution','trustInstructions','digitalAssetInstructions','language','translatorRequired'
]);
const PLACEHOLDER_PATTERNS = Object.freeze([
  /\[[A-Za-z][^\]\r\n]{0,80}\]/g,
  /【[^】\r\n]{1,120}】/g,
  /@\d+clause\b/gi,
  /\{\{field:[^}]+\}\}/g
]);
const ASSET_ARRAYS = Object.freeze(['properties','businessInterests','bankAssets','investments','insurance','epf','prs','vehicles','jewellery','digitalAssets','otherAssets']);

function issue(code, path, detail = null) { return Object.freeze({ code, path, ...(detail == null ? {} : { detail }) }); }
function asArray(value) { return Array.isArray(value) ? value : []; }
function collectPlaceholders(value, path = '$', out = []) {
  if (typeof value === 'string') {
    for (const pattern of PLACEHOLDER_PATTERNS) {
      pattern.lastIndex = 0;
      for (const match of value.matchAll(pattern)) out.push(issue('UNRESOLVED_PLACEHOLDER', path, match[0]));
    }
    return out;
  }
  if (Array.isArray(value)) value.forEach((entry, index) => collectPlaceholders(entry, `${path}[${index}]`, out));
  else if (value && typeof value === 'object') for (const [key, entry] of Object.entries(value)) collectPlaceholders(entry, `${path}.${key}`, out);
  return out;
}

export function validateDocument({ ir = {}, input = {}, clauseRegistry = {}, jurisdictionRegistry = {} } = {}) {
  const issues = [];
  for (const field of REQUIRED_WILL_FIELDS) if (!Object.prototype.hasOwnProperty.call(input, field)) issues.push(issue('MISSING_FIELD', `input.${field}`));
  if (asArray(input.executors).length === 0) issues.push(issue('MISSING_EXECUTOR', 'input.executors'));

  const persons = new Set(asArray(input.persons).map((person) => person?.personId).filter(Boolean));
  for (const field of ['testator']) if (input[field] && !persons.has(input[field])) issues.push(issue('INVALID_PERSON_REFERENCE', `input.${field}`, input[field]));
  for (const field of ['executors','substituteExecutors','guardians','substituteGuardians','beneficiaries','witnesses','digitalFacilitators','translators']) {
    for (const personId of asArray(input[field])) if (!persons.has(personId)) issues.push(issue('INVALID_PERSON_REFERENCE', `input.${field}`, personId));
  }

  const assetIds = new Set();
  for (const field of ASSET_ARRAYS) for (const asset of asArray(input[field])) if (asset?.assetId) assetIds.add(asset.assetId);
  for (const gift of asArray(input.specificGifts)) if (gift?.assetId && !assetIds.has(gift.assetId)) issues.push(issue('INVALID_ASSET_REFERENCE', 'input.specificGifts', gift.assetId));

  const share = evaluateWillShareIntegrity({ beneficiaryPersonIds: asArray(input.beneficiaries), residuaryDistribution: asArray(input.residuaryDistribution), distributions: asArray(input.specificGifts) });
  if (share.status !== 'VALID') for (const shareIssue of share.issues) issues.push(issue(`SHARE_${shareIssue.code}`, `input.${shareIssue.path}`, shareIssue.detail ?? null));

  const jurisdiction = asArray(jurisdictionRegistry.jurisdictions).find((entry) => entry.jurisdiction === input.jurisdiction);
  if (!jurisdiction || jurisdiction.status !== 'PRODUCTION_APPROVED') issues.push(issue('UNSUPPORTED_JURISDICTION', 'input.jurisdiction', input.jurisdiction ?? null));

  const seenClauses = new Set();
  const clauseById = new Map(asArray(clauseRegistry.clauses).map((clause) => [clause.clauseId, clause]));
  for (const section of asArray(ir.sections)) {
    const signature = `${section?.clauseId ?? 'UNKNOWN'}@${section?.clauseVersion ?? 'UNKNOWN'}`;
    if (seenClauses.has(signature)) issues.push(issue('DUPLICATE_CLAUSE', 'ir.sections', signature));
    seenClauses.add(signature);
    const clause = clauseById.get(section?.clauseId);
    if (!clause) issues.push(issue('INVALID_CLAUSE_REFERENCE', 'ir.sections', section?.clauseId ?? null));
    else {
      if (clause.version !== section.clauseVersion) issues.push(issue('INVALID_CLAUSE_VERSION_REFERENCE', 'ir.sections', signature));
      for (const incompatibleId of asArray(clause.incompatibleWith)) {
        if (asArray(ir.sections).some((candidate) => candidate?.clauseId === incompatibleId)) issues.push(issue('ILLEGAL_CLAUSE_COMBINATION', 'ir.sections', `${clause.clauseId}<->${incompatibleId}`));
      }
    }
  }

  issues.push(...collectPlaceholders(ir));
  if (ir.assemblyStatus !== 'DOCUMENT_CANDIDATE') issues.push(issue('ASSEMBLY_NOT_DOCUMENT_CANDIDATE', 'ir.assemblyStatus', ir.assemblyStatus ?? null));
  return Object.freeze({ status: issues.length === 0 ? 'PASS' : 'FAIL', repaired: false, issues: Object.freeze(issues), shareIntegrity: share });
}

export { REQUIRED_WILL_FIELDS, PLACEHOLDER_PATTERNS };
export default Object.freeze({ validateDocument, REQUIRED_WILL_FIELDS, PLACEHOLDER_PATTERNS });
