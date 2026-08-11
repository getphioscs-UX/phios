import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { buildCanonicalAssetBrief, digest as carBriefDigest } from '../canonical-asset-runtime/canonical-asset-brief-v1.mjs';
import { buildAssetReview, buildAssetApproval, buildMediaRecord, publishAsset, digest as lifecycleDigest } from '../canonical-asset-runtime/canonical-asset-lifecycle-v1.mjs';

export const ROOT = process.cwd();
export const CAR_PROD = 'content/production/car';
export const BRIEF_REGISTRY = `${CAR_PROD}/registries/canonical-asset-brief-production-registry-v1.json`;
export const CANDIDATE_REGISTRY = `${CAR_PROD}/registries/asset-candidate-production-registry-v1.json`;
export const REVIEW_REGISTRY = `${CAR_PROD}/registries/asset-review-production-registry-v1.json`;
export const APPROVAL_REGISTRY = `${CAR_PROD}/registries/asset-approval-production-registry-v1.json`;
export const MEDIA_REGISTRY = `${CAR_PROD}/registries/asset-media-production-registry-v1.json`;
export const PUBLISHED_REGISTRY = `${CAR_PROD}/registries/published-asset-production-registry-v1.json`;

const EXISTING = {
  briefSchema: 'content/professional/canonical-asset-runtime/schemas/canonical-asset-brief-v1.schema.json',
  assetTypes: 'content/professional/canonical-asset-runtime/registries/canonical-asset-type-registry-v1.json',
  meaningCodes: 'content/professional/canonical-meaning-runtime/registries/canonical-meaning-code-registry-v1.2.json',
  legacyMeaning: 'content/professional/canonical-meaning-runtime/fixtures/canonical-meaning.valid.json',
  nodes: 'content/knowledge/registry/nodes.json',
  fragments: 'content/knowledge/public/retrieval/fragments.json',
  assemblies: 'content/knowledge/intelligence/assembly/canonical-assembly.json',
  locales: 'content/knowledge/production/manifests/production-locale-manifest.json',
  pds: 'content/registry/pds-w2-design-token-contract.json',
  articleRefs: 'content/professional/canonical-asset-runtime/registries/canonical-article-reference-registry-v1.json',
  coveragePolicy: 'content/professional/canonical-asset-runtime/policies/canonical-asset-brief-coverage-policy-v1.json',
  bridge: `${CAR_PROD}/authority/car-production-meaning-bridge-v1.json`
};

export const stable = value => Array.isArray(value)
  ? value.map(stable)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]))
    : value;
export const digest = value => crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
export const fileDigest = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
const assert = (ok, code, details = '') => { if (!ok) { const error = new Error(details ? `${code}:${details}` : code); error.code = code; throw error; } };
export const readJson = (root, relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
export const exists = (root, relative) => fs.existsSync(path.join(root, relative));
export async function writeJson(root, relative, value) {
  const target = path.join(root, relative); await fsp.mkdir(path.dirname(target), { recursive: true });
  const text = `${JSON.stringify(value, null, 2)}\n`;
  if (fs.existsSync(target)) {
    const current = await fsp.readFile(target, 'utf8');
    if (current === text) return { path: relative, state: 'no_op' };
  }
  const temp = `${target}.tmp-${process.pid}`; await fsp.writeFile(temp, text, 'utf8'); await fsp.rename(temp, target);
  return { path: relative, state: 'written' };
}

export function parseArgs(argv) {
  const positional = []; const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (!value.startsWith('--')) positional.push(value);
    else {
      const key = value.slice(2); const next = argv[i + 1];
      if (next && !next.startsWith('--')) { options[key] = next; i += 1; }
      else options[key] = true;
    }
  }
  return { positional, options };
}

export const localeCode = locale => locale.toUpperCase().replace(/[^A-Z0-9]+/g, '-');
export const nodeCodeSegment = nodeCode => nodeCode.toUpperCase().replace(/[^A-Z0-9-]+/g, '-');
export function normalizeProductionKind(type) {
  const key = String(type || '').trim().toLowerCase();
  const map = {
    mechanism_diagram: { kind: 'mechanism_diagram', kindCode: 'MECHANISM', assetType: 'DIAGRAM', chatgptAsset: 'MECHANISM_DIAGRAM', mediaType: 'DIAGRAM' },
    diagram: { kind: 'mechanism_diagram', kindCode: 'MECHANISM', assetType: 'DIAGRAM', chatgptAsset: 'MECHANISM_DIAGRAM', mediaType: 'DIAGRAM' },
    hero_illustration: { kind: 'hero_illustration', kindCode: 'HERO', assetType: 'FIGURE', chatgptAsset: 'HERO_ILLUSTRATION', mediaType: 'FIGURE' },
    figure: { kind: 'hero_illustration', kindCode: 'HERO', assetType: 'FIGURE', chatgptAsset: 'HERO_ILLUSTRATION', mediaType: 'FIGURE' }
  };
  assert(map[key], 'CAR_PRODUCTION_ASSET_TYPE_ALIAS_UNSUPPORTED', key);
  return map[key];
}

export function loadAuthorities(root = ROOT) {
  const assetTypes = readJson(root, EXISTING.assetTypes);
  const meaningCodes = readJson(root, EXISTING.meaningCodes);
  const legacyMeaning = readJson(root, EXISTING.legacyMeaning);
  const nodes = readJson(root, EXISTING.nodes);
  const fragments = readJson(root, EXISTING.fragments);
  const assemblies = readJson(root, EXISTING.assemblies);
  const locales = readJson(root, EXISTING.locales);
  const pds = readJson(root, EXISTING.pds);
  const articleRefs = readJson(root, EXISTING.articleRefs);
  const policy = readJson(root, EXISTING.coveragePolicy);
  const bridge = readJson(root, EXISTING.bridge);
  return {
    assetTypes: assetTypes.assetTypes,
    meanings: [...meaningCodes.meaningCodes, legacyMeaning],
    meaningCodes: meaningCodes.meaningCodes,
    legacyMeaning,
    nodes: nodes.nodes,
    fragments: fragments.records,
    assemblies: assemblies.assemblies,
    supportedLocales: locales.supportedLocales,
    minimumPublishedFragmentCount: policy.minimumPublishedFragmentCount,
    pdsReferences: [pds.source.canonicalFile, EXISTING.pds],
    articleReferences: articleRefs.references || articleRefs.records || [],
    bridge
  };
}

export function resolveMeaningReferences(nodeCode, authorities) {
  const direct = authorities.meaningCodes.filter(record => {
    const ka = record.knowledgeAuthority || {};
    return [...(ka.primaryNodeCodes || []), ...(ka.supportingNodeCodes || [])].includes(nodeCode);
  }).map(record => record.meaningCode);
  if (direct.length) return { references: [...new Set(direct)].sort(), mode: 'canonical_meaning_knowledge_map' };
  const bridge = authorities.bridge.bindings.find(item => item.nodeCode === nodeCode);
  if (bridge) {
    assert(bridge.createsNewMeaning === false, 'CAR_PRODUCTION_MEANING_BRIDGE_MAY_NOT_CREATE_MEANING');
    assert(bridge.sourceMeaningPath === EXISTING.legacyMeaning, 'CAR_PRODUCTION_MEANING_BRIDGE_SOURCE_INVALID');
    assert(authorities.legacyMeaning.meaningCode === bridge.meaningCode, 'CAR_PRODUCTION_MEANING_BRIDGE_CODE_INVALID');
    const refs = authorities.legacyMeaning.knowledgeReferences || {};
    assert([...(refs.primaryNodeCodes || []), ...(refs.supportingNodeCodes || [])].includes(nodeCode), 'CAR_PRODUCTION_MEANING_BRIDGE_NODE_INVALID');
    return { references: [bridge.meaningCode], mode: bridge.authorityMode };
  }
  assert(false, 'CAR_PRODUCTION_MEANING_AUTHORITY_NOT_RESOLVED', nodeCode);
}

function firstSentence(text) {
  const clean = String(text || '').replace(/^#+\s*/, '').trim();
  const match = clean.match(/^(.+?[。！？.!?])/u);
  return (match ? match[1] : clean).trim();
}
function unique(values) { return [...new Set(values.filter(Boolean))]; }

export function deriveBriefInput({ root = ROOT, nodeCode, type, locale = 'zh-Hans' }) {
  const authorities = loadAuthorities(root); const kind = normalizeProductionKind(type);
  assert(authorities.nodes.some(node => node.nodeCode === nodeCode), 'CAR_PRODUCTION_NODE_NOT_REGISTERED', nodeCode);
  assert(authorities.supportedLocales.includes(locale), 'CAR_PRODUCTION_LOCALE_NOT_SUPPORTED', locale);
  assert(authorities.assetTypes.some(item => item.assetType === kind.assetType), 'CAR_PRODUCTION_ASSET_TYPE_NOT_REGISTERED', kind.assetType);
  const meaning = resolveMeaningReferences(nodeCode, authorities);
  const fragments = authorities.fragments.filter(item => item.nodeCode === nodeCode && item.locale === locale).sort((a,b) => a.ordinal - b.ordinal);
  const assemblies = authorities.assemblies.filter(item => item.locale === locale && item.publishedFragmentsOnly === true && item.nodeCodes?.includes(nodeCode));
  assert(fragments.length >= authorities.minimumPublishedFragmentCount, 'CAR_PRODUCTION_PUBLISHED_COVERAGE_INSUFFICIENT', nodeCode);
  assert(assemblies.length > 0, 'CAR_PRODUCTION_CANONICAL_ASSEMBLY_REQUIRED', nodeCode);
  const paragraphs = fragments.filter(item => item.kind !== 'heading' && String(item.text || '').trim());
  const establishCount = kind.kind === 'mechanism_diagram' ? 5 : 3;
  const mustEstablish = unique(paragraphs.map(item => firstSentence(item.text))).slice(0, establishCount);
  assert(mustEstablish.length > 0, 'CAR_PRODUCTION_MUST_ESTABLISH_SOURCE_EMPTY');
  const mechanismCodes = unique(assemblies.flatMap(item => [...(item.mechanismCodes || []), ...(item.domainCodes || [])])).sort();
  const mustInclude = kind.kind === 'mechanism_diagram'
    ? mechanismCodes.slice(0, 8)
    : unique([...(assemblies.find(item => item.assemblyType === 'theme')?.domainCodes || []), ...mechanismCodes]).slice(0, 6);
  const localeZh = locale.toLowerCase().startsWith('zh');
  const mustNotInclude = localeZh
    ? ['新增或推断未发布的知识主张', '专业结论或专业判断', '把 AI 或视觉资产表现为 Meaning / Knowledge / Publication Authority', '未在 Published Knowledge 中出现的因果关系', '未经明确允许的图中文字']
    : ['new or inferred unpublished knowledge claims', 'professional conclusions or professional judgment', 'AI or the visual asset represented as Meaning / Knowledge / Publication Authority', 'causal relationships absent from Published Knowledge', 'text inside the image unless explicitly permitted'];
  const purpose = localeZh
    ? `将 ${nodeCode} 已发布知识转化为受治理的${kind.kind === 'mechanism_diagram' ? '机制图候选' : '主视觉候选'}，不得增加新主张。`
    : `Translate published knowledge for ${nodeCode} into a governed ${kind.kind.replaceAll('_',' ')} candidate without adding new claims.`;
  const visualOrNarrativeContract = {
    mode: 'visual',
    productionKind: kind.kind,
    objective: localeZh ? '只表达 Published Knowledge 已建立的结构与关系，不补充未发布信息。' : 'Represent only structures and relationships already established by Published Knowledge.',
    relationshipPolicy: 'do_not_add_unstated_causality',
    textPolicy: 'no_text_unless_explicitly_permitted',
    sourceAssemblyCodes: assemblies.map(item => item.assemblyCode).sort()
  };
  const briefCode = `CAB-${nodeCodeSegment(nodeCode)}-${kind.kindCode}-${localeCode(locale)}-001`;
  return {
    input: { briefCode, assetType: kind.assetType, nodeCode, meaningReferences: meaning.references, knowledgeReferences: [nodeCode], locale, audience: 'public_reader', purpose, mustEstablish, mustInclude, mustNotInclude, visualOrNarrativeContract, accessibilityRequirements: localeZh ? ['提供简洁、非装饰性的替代文字。', '不得只依赖颜色表达差异。', '关键关系必须在无颜色条件下仍可理解。'] : ['Provide concise non-decorative alternative text.', 'Do not rely on color alone.', 'Key relationships must remain understandable without color.'] },
    authorities,
    kind,
    meaningMode: meaning.mode,
    source: { fragments, assemblies }
  };
}

export function buildProductionBrief(params) {
  const derived = deriveBriefInput(params);
  const brief = buildCanonicalAssetBrief(derived.input, derived.authorities);
  return { ...derived, brief };
}

export function validateBriefSchema(root, brief) {
  const schema = readJson(root, EXISTING.briefSchema);
  const actualKeys = Object.keys(brief).sort(); const allowed = Object.keys(schema.properties).sort();
  assert(schema.required.every(key => Object.hasOwn(brief, key)), 'CAR_BRIEF_SCHEMA_REQUIRED_FIELD_MISSING');
  assert(actualKeys.every(key => allowed.includes(key)), 'CAR_BRIEF_SCHEMA_ADDITIONAL_PROPERTY');
  assert(/^CAB-[A-Z0-9-]+$/.test(brief.briefCode), 'CAR_BRIEF_SCHEMA_CODE_INVALID');
  assert(/^\d+\.\d+\.\d+$/.test(brief.briefVersion), 'CAR_BRIEF_SCHEMA_VERSION_INVALID');
  assert(/^KN-[A-Z0-9-]+$/.test(brief.nodeCode), 'CAR_BRIEF_SCHEMA_NODE_INVALID');
  assert(Array.isArray(brief.meaningReferences) && brief.meaningReferences.length > 0 && brief.meaningReferences.every(x => /^CM-[A-Z0-9-]+$/.test(x)), 'CAR_BRIEF_SCHEMA_MEANING_INVALID');
  assert(Array.isArray(brief.knowledgeReferences) && brief.knowledgeReferences.length > 0, 'CAR_BRIEF_SCHEMA_KNOWLEDGE_INVALID');
  assert(Array.isArray(brief.sourceFragmentDigests) && brief.sourceFragmentDigests.length > 0 && brief.sourceFragmentDigests.every(x => /^[a-f0-9]{64}$/.test(x)), 'CAR_BRIEF_SCHEMA_SOURCE_DIGEST_INVALID');
  assert(brief.factualBoundary?.publishedOnly === true && brief.factualBoundary?.newClaimsAllowed === false && brief.factualBoundary?.professionalConclusionAllowed === false, 'CAR_BRIEF_SCHEMA_FACTUAL_BOUNDARY_INVALID');
  assert(brief.brandConstraints?.authority === 'PDS' && brief.brandConstraints?.mustNotInferRuntimeState === true && Array.isArray(brief.brandConstraints?.pdsReferences) && brief.brandConstraints.pdsReferences.length > 0, 'CAR_BRIEF_SCHEMA_BRAND_INVALID');
  assert(brief.outputContract?.candidateOnly === true && brief.outputContract?.publicationAllowed === false && brief.outputContract?.assetIsBrief === false, 'CAR_BRIEF_SCHEMA_OUTPUT_INVALID');
  assert(Object.values(brief.authorityValidation || {}).every(value => value === true), 'CAR_BRIEF_SCHEMA_AUTHORITY_VALIDATION_INVALID');
  assert(/^[a-f0-9]{64}$/.test(brief.briefDigest), 'CAR_BRIEF_SCHEMA_DIGEST_INVALID');
  return true;
}

export function validateProductionBrief({ root = ROOT, brief }) {
  validateBriefSchema(root, brief);
  const authorities = loadAuthorities(root);
  const meaning = resolveMeaningReferences(brief.nodeCode, authorities);
  const checks = {
    meaningAuthorityValid: brief.meaningReferences.every(ref => meaning.references.includes(ref)),
    knowledgeReferencesValid: brief.knowledgeReferences.includes(brief.nodeCode) && brief.knowledgeReferences.every(ref => authorities.nodes.some(node => node.nodeCode === ref)),
    publishedCoverageSufficient: brief.knowledgeReferences.every(ref => authorities.fragments.some(fragment => fragment.nodeCode === ref && fragment.locale === brief.locale)) && authorities.assemblies.some(assembly => assembly.locale === brief.locale && assembly.publishedFragmentsOnly === true && brief.knowledgeReferences.every(ref => assembly.nodeCodes.includes(ref))),
    localeSupported: authorities.supportedLocales.includes(brief.locale),
    assetTypeRegistered: authorities.assetTypes.some(item => item.assetType === brief.assetType),
    pdsReferenceValid: brief.brandConstraints.pdsReferences.every(ref => exists(root, ref)),
    sourceDigestValid: brief.sourceFragmentDigests.every(d => authorities.fragments.some(fragment => fragment.nodeCode === brief.nodeCode && fragment.locale === brief.locale && fragment.digest === d)),
    noUnsupportedClaims: brief.mustEstablish.every(statement => authorities.fragments.some(fragment => fragment.nodeCode === brief.nodeCode && fragment.locale === brief.locale && String(fragment.text || '').includes(statement))),
    briefDigestValid: brief.briefDigest === carBriefDigest(Object.fromEntries(Object.entries(brief).filter(([key]) => key !== 'briefDigest')))
  };
  const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
  assert(failed.length === 0, 'CAR_PRODUCTION_BRIEF_VALIDATION_FAILED', failed.join(','));
  return { valid: true, checks, meaningAuthorityMode: meaning.mode };
}

function registryTemplate(code, collection) {
  return { registryCode: code, registryVersion: '1.0.0', productionStatus: 'active', authority: 'CAR Production Activation', [collection]: [] };
}
export async function ensureRegistries(root = ROOT) {
  const defs = [
    [BRIEF_REGISTRY, registryTemplate('PHI-OS-CAR-PRODUCTION-BRIEF-REGISTRY-v1','briefs')],
    [CANDIDATE_REGISTRY, registryTemplate('PHI-OS-CAR-PRODUCTION-CANDIDATE-REGISTRY-v1','candidates')],
    [REVIEW_REGISTRY, registryTemplate('PHI-OS-CAR-PRODUCTION-REVIEW-REGISTRY-v1','reviews')],
    [APPROVAL_REGISTRY, registryTemplate('PHI-OS-CAR-PRODUCTION-APPROVAL-REGISTRY-v1','approvals')],
    [MEDIA_REGISTRY, registryTemplate('PHI-OS-CAR-PRODUCTION-MEDIA-REGISTRY-v1','media')],
    [PUBLISHED_REGISTRY, registryTemplate('PHI-OS-CAR-PRODUCTION-PUBLISHED-ASSET-REGISTRY-v1','publications')]
  ];
  for (const [relative, value] of defs) if (!exists(root, relative)) await writeJson(root, relative, value);
}
async function upsertRegistry(root, relative, collection, key, entry) {
  await ensureRegistries(root); const registry = readJson(root, relative); const items = registry[collection];
  const index = items.findIndex(item => item[key] === entry[key]);
  if (index >= 0) {
    assert(JSON.stringify(stable(items[index])) === JSON.stringify(stable(entry)), 'CAR_PRODUCTION_REGISTRY_CONFLICT', `${relative}:${entry[key]}`);
    return { state: 'no_op' };
  }
  items.push(entry); items.sort((a,b) => String(a[key]).localeCompare(String(b[key]))); await writeJson(root, relative, registry); return { state: 'written' };
}

export async function persistBrief({ root = ROOT, brief, validation = null }) {
  await ensureRegistries(root); validateBriefSchema(root, brief);
  const relative = `${CAR_PROD}/briefs/${brief.briefCode}.json`; await writeJson(root, relative, brief);
  const registry = readJson(root, BRIEF_REGISTRY); const existing = registry.briefs.find(item => item.briefCode === brief.briefCode);
  if (existing) {
    assert(existing.briefDigest === brief.briefDigest && existing.nodeCode === brief.nodeCode && existing.assetType === brief.assetType && existing.locale === brief.locale && existing.path === relative, 'CAR_PRODUCTION_REGISTRY_CONFLICT', `${BRIEF_REGISTRY}:${brief.briefCode}`);
    if (validation && existing.state !== 'validated_frozen') existing.state = 'validated_frozen';
    await writeJson(root, BRIEF_REGISTRY, registry); return relative;
  }
  registry.briefs.push({ briefCode: brief.briefCode, briefDigest: brief.briefDigest, nodeCode: brief.nodeCode, assetType: brief.assetType, locale: brief.locale, path: relative, state: validation ? 'validated_frozen' : 'built' });
  registry.briefs.sort((a,b)=>a.briefCode.localeCompare(b.briefCode)); await writeJson(root, BRIEF_REGISTRY, registry); return relative;
}

export async function freezeBrief({ root = ROOT, brief }) {
  const validation = validateProductionBrief({ root, brief });
  const freeze = { schemaVersion: 'PHI-OS-CAR-PRODUCTION-BRIEF-FREEZE-v1.0.0', briefCode: brief.briefCode, briefDigest: brief.briefDigest, frozen: true, authorityValidation: validation.checks, meaningAuthorityMode: validation.meaningAuthorityMode, publicationAuthorityCreated: false };
  const relative = `${CAR_PROD}/freezes/${brief.briefCode}.freeze.json`; await writeJson(root, relative, freeze);
  const registry = readJson(root, BRIEF_REGISTRY); const item = registry.briefs.find(x => x.briefCode === brief.briefCode); assert(item, 'CAR_PRODUCTION_BRIEF_REGISTRY_ENTRY_MISSING'); item.state = 'validated_frozen'; item.freezePath = relative; await writeJson(root, BRIEF_REGISTRY, registry);
  return { freeze, relative };
}

export function resolveBriefByCode(root, briefCode) {
  const relative = `${CAR_PROD}/briefs/${briefCode}.json`; assert(exists(root, relative), 'CAR_PRODUCTION_BRIEF_NOT_FOUND', briefCode); return { brief: readJson(root, relative), relative };
}

export function articleAuthorityForBrief(brief, authorities) {
  return authorities.articleReferences.find(item => item.nodeCode === brief.nodeCode && item.locale === brief.locale) || null;
}

export async function exportChatGptBrief({ root = ROOT, briefCode, outputRoot = 'dist/car-production' }) {
  const { brief } = resolveBriefByCode(root, briefCode); const validation = validateProductionBrief({ root, brief });
  const kind = brief.briefCode.includes('-MECHANISM-') ? normalizeProductionKind('mechanism_diagram') : normalizeProductionKind('hero_illustration');
  const authorities = loadAuthorities(root); const article = articleAuthorityForBrief(brief, authorities);
  const target = path.join(root, outputRoot, briefCode); await fsp.mkdir(target, { recursive: true });
  const canonicalPath = path.join(target, 'canonical-asset-brief.json'); await fsp.writeFile(canonicalPath, `${JSON.stringify(brief,null,2)}\n`, 'utf8');
  const lines = [
    '# PHI OS Canonical Asset Production','',`Asset:\n${kind.chatgptAsset}`,'',`Node:\n${brief.nodeCode}`,'',`Locale:\n${brief.locale}`,'',`Purpose:\n${brief.purpose}`,'',
    'Knowledge Authority:', ...brief.knowledgeReferences.map(ref => `- ${ref}`), ...(article ? [`- Published Article Authority: ${article.publishedAuthorityReference?.authorityPath || article.assetReferenceCode}`] : []), '',
    'Meaning Authority:', ...brief.meaningReferences.map(ref => `- ${ref}`), `- Resolution mode: ${validation.meaningAuthorityMode}`,'',
    'The visual must establish:', ...brief.mustEstablish.map((item,i)=>`${i+1}. ${item}`),'',
    'Must include:', ...(brief.mustInclude.length ? brief.mustInclude.map((item,i)=>`${i+1}. ${item}`) : ['1. No additional mandatory concept beyond mustEstablish.']),'',
    'Must not include:', ...brief.mustNotInclude.map((item,i)=>`${i+1}. ${item}`),'',
    'Factual boundaries:','- No new claims','- No professional conclusion','- Published knowledge only','',
    'Visual contract:','```json',JSON.stringify(brief.visualOrNarrativeContract,null,2),'```','',
    'PDS constraints:',...brief.brandConstraints.pdsReferences.map(item=>`- ${item}`),'',
    'Accessibility:',...brief.accessibilityRequirements.map(item=>`- ${item}`),'',
    'Output:','- candidate image only','- no publication authority','- do not invent missing content','- do not add text unless explicitly permitted',''
  ];
  const markdown = `${lines.join('\n')}\n`; const markdownPath = path.join(target,'chatgpt-figure-brief.md'); await fsp.writeFile(markdownPath, markdown, 'utf8');
  const intake = {
    schemaVersion: 'PHI-OS-CAR-CHATGPT-INTAKE-CONTRACT-v1.0.0', briefCode: brief.briefCode, briefDigest: brief.briefDigest, nodeCode: brief.nodeCode, assetType: brief.assetType, productionKind: kind.kind, locale: brief.locale,
    providerLineage: { mode: 'external_manual', providerCode: 'OPENAI_CHATGPT', modelCode: 'user_recorded_or_null' },
    allowedExtensions: ['.webp','.avif','.svg'], candidateOnly: true, publicationAuthority: false,
    chatgptBriefDigest: crypto.createHash('sha256').update(markdown,'utf8').digest('hex')
  };
  await fsp.writeFile(path.join(target,'intake-contract.json'), `${JSON.stringify(intake,null,2)}\n`, 'utf8');
  return { outputDirectory: path.relative(root,target).replaceAll('\\','/'), intake, markdown };
}

function inferMime(file) { const ext = path.extname(file).toLowerCase(); return ({'.webp':'image/webp','.avif':'image/avif','.svg':'image/svg+xml'})[ext] || null; }
export function inferDimensions(buffer, ext, supplied = {}) {
  if (supplied.width && supplied.height) return { width: Number(supplied.width), height: Number(supplied.height) };
  if (ext === '.svg') {
    const text = buffer.toString('utf8'); const w = text.match(/\bwidth=["']([0-9.]+)(?:px)?["']/i); const h = text.match(/\bheight=["']([0-9.]+)(?:px)?["']/i); const vb = text.match(/\bviewBox=["'][^"']*?([0-9.]+)\s+([0-9.]+)["']/i);
    return { width: Math.round(Number(w?.[1] || vb?.[1] || 0)) || null, height: Math.round(Number(h?.[1] || vb?.[2] || 0)) || null };
  }
  if (ext === '.webp' && buffer.length > 30 && buffer.toString('ascii',0,4)==='RIFF' && buffer.toString('ascii',8,12)==='WEBP') {
    let offset = 12; while (offset + 8 <= buffer.length) {
      const chunk = buffer.toString('ascii',offset,offset+4); const size = buffer.readUInt32LE(offset+4); const data = offset+8;
      if (chunk === 'VP8X' && data+10 <= buffer.length) return { width: 1 + buffer.readUIntLE(data+4,3), height: 1 + buffer.readUIntLE(data+7,3) };
      if (chunk === 'VP8L' && data+5 <= buffer.length) { const bits = buffer.readUInt32LE(data+1); return { width: (bits & 0x3fff)+1, height: ((bits >> 14)&0x3fff)+1 }; }
      if (chunk === 'VP8 ' && data+10 <= buffer.length && buffer[data+3]===0x9d && buffer[data+4]===0x01 && buffer[data+5]===0x2a) return { width: buffer.readUInt16LE(data+6)&0x3fff, height: buffer.readUInt16LE(data+8)&0x3fff };
      offset = data + size + (size % 2);
    }
  }
  return { width: null, height: null };
}

function candidatePaths(candidateCode) { return { record: `${CAR_PROD}/candidates/${candidateCode}/candidate.v1.json`, directory: `${CAR_PROD}/candidates/${candidateCode}` }; }
export function resolveCandidate(root, candidateCode) { const p=candidatePaths(candidateCode).record; assert(exists(root,p),'CAR_PRODUCTION_CANDIDATE_NOT_FOUND',candidateCode); return readJson(root,p); }
export function resolveReview(root, candidateCode) { const registry=readJson(root,REVIEW_REGISTRY); const refs=registry.reviews.filter(x=>x.candidateCode===candidateCode); assert(refs.length,'CAR_PRODUCTION_REVIEW_NOT_FOUND',candidateCode); const latest=refs.at(-1); return readJson(root,latest.path); }
export function resolveApproval(root, candidateCode) { const registry=readJson(root,APPROVAL_REGISTRY); const refs=registry.approvals.filter(x=>x.candidateCode===candidateCode); assert(refs.length,'CAR_PRODUCTION_APPROVAL_NOT_FOUND',candidateCode); return readJson(root,refs.at(-1).path); }
export function resolveMedia(root, candidateCode) { const registry=readJson(root,MEDIA_REGISTRY); const refs=registry.media.filter(x=>x.candidateCode===candidateCode); assert(refs.length,'CAR_PRODUCTION_MEDIA_NOT_FOUND',candidateCode); return readJson(root,refs.at(-1).path); }

export async function importCandidate({ root = ROOT, briefCode, file, modelCode = null, createdAt = new Date().toISOString() }) {
  const { brief }=resolveBriefByCode(root,briefCode); validateProductionBrief({root,brief}); assert(exists(root,`${CAR_PROD}/freezes/${briefCode}.freeze.json`),'CAR_PRODUCTION_BRIEF_MUST_BE_FROZEN');
  const kind=briefCode.includes('-MECHANISM-')?normalizeProductionKind('mechanism_diagram'):normalizeProductionKind('hero_illustration'); const ext=path.extname(file).toLowerCase(); assert(['.webp','.avif','.svg'].includes(ext),'CAR_PRODUCTION_CANDIDATE_FILE_TYPE_UNSUPPORTED',ext);
  const bytes=fs.readFileSync(file); const mime=inferMime(file); const dims=inferDimensions(bytes,ext,{}); const suffix=`${kind.kindCode}-${localeCode(brief.locale)}-001`; const assetCode=`ASSET-${brief.nodeCode}-${suffix}`; const candidateCode=`CAR-CAND-${brief.nodeCode}-${suffix}`;
  const payload={ fileName:path.basename(file), contentType:mime, fileDigest:fileDigest(bytes), byteLength:bytes.length, width:dims.width, height:dims.height };
  const providerLineage={ mode:'external_manual', providerCode:'OPENAI_CHATGPT', modelCode:modelCode||null, invocationDigest:null, source:'chatgpt_figure_brief_manual_handoff' };
  const body={ candidateCode,candidateVersion:'1.0.0',assetCode,assetType:brief.assetType,nodeCode:brief.nodeCode,assetBriefCode:brief.briefCode,assetBriefDigest:brief.briefDigest,meaningReferences:[...brief.meaningReferences].sort(),knowledgeReferences:[...brief.knowledgeReferences].sort(),sourceFragmentDigests:[...brief.sourceFragmentDigests].sort(),locale:brief.locale,candidatePayload:payload,providerLineage,candidateState:'candidate',createdAt };
  const candidate={...body,candidateDigest:digest(body)}; const p=candidatePaths(candidateCode); const dir=path.join(root,p.directory); await fsp.mkdir(dir,{recursive:true}); const stored=path.join(dir,`candidate${ext}`); if(fs.existsSync(stored)) assert(fileDigest(fs.readFileSync(stored))===payload.fileDigest,'CAR_PRODUCTION_CANDIDATE_BINARY_CONFLICT'); else await fsp.copyFile(file,stored); await writeJson(root,p.record,candidate); await upsertRegistry(root,CANDIDATE_REGISTRY,'candidates','candidateCode',{candidateCode,candidateDigest:candidate.candidateDigest,assetCode,nodeCode:brief.nodeCode,briefCode,briefDigest:brief.briefDigest,providerMode:'external_manual',path:p.record,binaryPath:path.relative(root,stored).replaceAll('\\','/')}); return candidate;
}

export async function reviewCandidate({ root=ROOT,candidateCode,reviewerCode,decision,dimensions,reviewNotes=[],reviewedAt=new Date().toISOString() }) {
  assert(['accept','changes_required','reject'].includes(decision),'CAR_PRODUCTION_REVIEW_DECISION_UNSUPPORTED',decision);
  const candidate=resolveCandidate(root,candidateCode); const seq=String(readJson(root,REVIEW_REGISTRY).reviews.filter(x=>x.candidateCode===candidateCode).length+1).padStart(3,'0'); const reviewCode=`CAR-REV-${candidateCode.replace(/^CAR-CAND-/,'')}-${seq}`;
  if(decision==='accept') assert(Object.values(dimensions).every(v=>v==='pass'),'CAR_PRODUCTION_ACCEPT_REVIEW_REQUIRES_ALL_DIMENSIONS_PASS');
  const review=buildAssetReview({candidate,reviewerCode,reviewerIndependent:true,dimensions,decision,reviewNotes,reviewedAt,reviewCode}); const relative=`${CAR_PROD}/reviews/${reviewCode}.json`; await writeJson(root,relative,review); await upsertRegistry(root,REVIEW_REGISTRY,'reviews','reviewCode',{reviewCode,reviewDigest:review.reviewDigest,candidateCode,candidateDigest:candidate.candidateDigest,decision,path:relative}); return review;
}

export async function approveCandidate({root=ROOT,candidateCode,approverCode,decision='approved',conditions=[],approvedAt=new Date().toISOString()}) {
  const candidate=resolveCandidate(root,candidateCode); const review=resolveReview(root,candidateCode); assert(review.decision==='accept','CAR_APPROVAL_ACCEPTED_REVIEW_REQUIRED'); const seq=String(readJson(root,APPROVAL_REGISTRY).approvals.filter(x=>x.candidateCode===candidateCode).length+1).padStart(3,'0'); const approvalCode=`CAR-APP-${candidateCode.replace(/^CAR-CAND-/,'')}-${seq}`;
  const carApprovalRecord=buildAssetApproval({candidate,review,approverCode,approverIndependent:true,decision,conditions,approvedAt,approvalCode});
  const approval={schemaVersion:'PHI-OS-CAR-PRODUCTION-ASSET-APPROVAL-v1.0.0',approvalCode,approver:approverCode,candidateCode,candidateDigest:candidate.candidateDigest,reviewCode:review.reviewCode,reviewDigest:review.reviewDigest,decision,conditions,approvedAt,approvalDigest:carApprovalRecord.approvalDigest,carApprovalRecord};
  const relative=`${CAR_PROD}/approvals/${approvalCode}.json`; await writeJson(root,relative,approval); await upsertRegistry(root,APPROVAL_REGISTRY,'approvals','approvalCode',{approvalCode,approvalDigest:approval.approvalDigest,approver:approverCode,candidateCode,candidateDigest:candidate.candidateDigest,reviewCode:review.reviewCode,reviewDigest:review.reviewDigest,decision,path:relative}); return approval;
}

export async function materializeMedia({root=ROOT,candidateCode,altText,rightsStatus,accessibilityStatus,file=null,width=null,height=null}) {
  const candidate=resolveCandidate(root,candidateCode); const review=resolveReview(root,candidateCode); const approval=resolveApproval(root,candidateCode); assert(review.decision==='accept','CAR_MEDIA_REVIEW_ACCEPT_REQUIRED'); assert(approval.decision==='approved','CAR_MEDIA_APPROVAL_REQUIRED'); assert(['cleared','owned','licensed'].includes(rightsStatus),'CAR_MEDIA_RIGHTS_MUST_BE_CLEARED'); assert(accessibilityStatus==='passed','CAR_MEDIA_ACCESSIBILITY_MUST_PASS'); assert(String(altText||'').trim(),'CAR_MEDIA_ALT_TEXT_REQUIRED');
  const registryEntry=readJson(root,CANDIDATE_REGISTRY).candidates.find(x=>x.candidateCode===candidateCode); const sourceFile=file?path.resolve(file):path.join(root,registryEntry.binaryPath); const bytes=fs.readFileSync(sourceFile); assert(fileDigest(bytes)===candidate.candidatePayload.fileDigest,'CAR_MEDIA_BINARY_MUST_MATCH_CANDIDATE'); const ext=path.extname(sourceFile).toLowerCase(); assert(['.webp','.avif','.svg'].includes(ext),'CAR_MEDIA_PUBLIC_EXTENSION_UNSAFE'); const dims=inferDimensions(bytes,ext,{width,height}); assert(dims.width&&dims.height,'CAR_MEDIA_DIMENSIONS_REQUIRED');
  const kind=candidate.assetType==='DIAGRAM'?normalizeProductionKind('mechanism_diagram'):normalizeProductionKind('hero_illustration'); const publicRelative=`assets/knowledge/${candidate.nodeCode}/${candidate.assetCode}${ext}`; const publicAbs=path.join(root,publicRelative); await fsp.mkdir(path.dirname(publicAbs),{recursive:true}); if(fs.existsSync(publicAbs)) assert(fileDigest(fs.readFileSync(publicAbs))===candidate.candidatePayload.fileDigest,'CAR_MEDIA_PUBLIC_BINARY_CONFLICT'); else await fsp.copyFile(sourceFile,publicAbs);
  const mediaCode=`CAR-MEDIA-${candidateCode.replace(/^CAR-CAND-/,'')}-001`; const carMediaRecord=buildMediaRecord({candidate,assetType:candidate.assetType,mediaCode,mediaType:kind.mediaType,storageAuthority:'PUBLIC_REPOSITORY_ASSET_PATH',contentType:inferMime(sourceFile),width:dims.width,height:dims.height,duration:null,locale:candidate.locale,accessibilityText:altText,accessibilityStatus,rightsStatus,sourceDigest:candidate.candidateDigest,fixtureOnly:false});
  const body={schemaVersion:'PHI-OS-CAR-PRODUCTION-MEDIA-v1.0.0',mediaCode,assetCode:candidate.assetCode,candidateCode,candidateDigest:candidate.candidateDigest,contentType:carMediaRecord.contentType,width:dims.width,height:dims.height,sourceDigest:candidate.candidateDigest,binaryDigest:candidate.candidatePayload.fileDigest,storageAuthority:'PUBLIC_REPOSITORY_ASSET_PATH',publicSrc:`/${publicRelative.replaceAll('\\','/')}`,altText,accessibilityStatus,rightsStatus,carMediaRecord}; const record={...body,productionMediaDigest:digest(body)}; const relative=`${CAR_PROD}/media/${mediaCode}.json`; await writeJson(root,relative,record); await upsertRegistry(root,MEDIA_REGISTRY,'media','mediaCode',{mediaCode,productionMediaDigest:record.productionMediaDigest,assetCode:candidate.assetCode,candidateCode,candidateDigest:candidate.candidateDigest,publicSrc:record.publicSrc,rightsStatus,accessibilityStatus,path:relative}); return record;
}

export async function publishProductionAsset({root=ROOT,candidateCode,surface='WEBSITE',publishedAt=new Date().toISOString()}) {
  const candidate=resolveCandidate(root,candidateCode); const review=resolveReview(root,candidateCode); const approval=resolveApproval(root,candidateCode); const media=resolveMedia(root,candidateCode); assert(media.rightsStatus&&['cleared','owned','licensed'].includes(media.rightsStatus),'CAR_PUBLICATION_RIGHTS_GATE_FAILED'); assert(media.accessibilityStatus==='passed','CAR_PUBLICATION_ACCESSIBILITY_GATE_FAILED'); const publicationCode=`CAR-PUB-${candidateCode.replace(/^CAR-CAND-/,'')}-001`;
  const carPublicationRecord=publishAsset({candidate,review,approval,media:[media.carMediaRecord],surface,rightsStatus:media.rightsStatus,accessibilityStatus:media.accessibilityStatus,publishedAt,publicationCode}); const publishedAssetCode=`PUBLISHED-${candidate.assetCode}`; const body={schemaVersion:'PHI-OS-CAR-PUBLISHED-ASSET-PRODUCTION-v1.0.0',publishedAssetCode,assetCode:candidate.assetCode,mediaCode:media.mediaCode,surface,publicSrc:media.publicSrc,width:media.width,height:media.height,altText:media.altText,rightsStatus:media.rightsStatus,accessibilityStatus:media.accessibilityStatus,publicationState:'published',publishedAt,carPublicationRecord}; const record={...body,publicationDigest:digest(body)}; const relative=`${CAR_PROD}/published/${publishedAssetCode}.json`; await writeJson(root,relative,record); await upsertRegistry(root,PUBLISHED_REGISTRY,'publications','publishedAssetCode',{publishedAssetCode,assetCode:candidate.assetCode,mediaCode:media.mediaCode,surface,publicSrc:media.publicSrc,publicationDigest:record.publicationDigest,path:relative}); return record;
}

export const lifecycleBuilders = { buildAssetReview, buildAssetApproval, buildMediaRecord, publishAsset, lifecycleDigest };
