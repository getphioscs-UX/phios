import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { loadCanonicalContext, readJson, repositoryCommit } from './repository-loader.mjs';
import { assertLocaleBriefReady } from '../knowledge-l10n/locale-readiness.mjs';

const stable = value => {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])]));
  return value;
};
const serialize = value => `${JSON.stringify(stable(value), null, 2)}\n`;
const digest = value => crypto.createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) || value instanceof Uint8Array ? value : serialize(value)).digest('hex');
const digestTextSource = value => digest(Buffer.from(value).toString('utf8')
  .replace(/^\uFEFF/, '')
  .replace(/\r\n?/g, '\n'));

async function digestInputs(root, files) {
  const entries=[];
  for (const relative of [...new Set(files)].filter(Boolean).sort()) {
    const bytes=await fs.readFile(path.join(root,relative));
    entries.push({path:relative,sha256:digestTextSource(bytes)});
  }
  return digest(entries);
}

function selectTerms(registry, text) {
  return registry.terms.filter(term => term.status==='approved' && term.translationLock===true && text.includes(term['zh-Hans']))
    .map(({termCode,key,...locales}) => ({termCode,key,'zh-Hans':locales['zh-Hans'],en:locales.en,translationLock:true}));
}

export async function buildCanonicalBriefV2(root,nodeCode,{commit}={}) {
  const locale='zh-Hans';
  assertLocaleBriefReady(root,nodeCode,locale);
  const [context, terminology, resolvedCommit] = await Promise.all([
    loadCanonicalContext(root,nodeCode,locale),
    readJson(root,'content/knowledge/l10n/bilingual-terminology-registry.json'),
    commit ? Promise.resolve(commit) : repositoryCommit(root)
  ]);
  const {node,localizedIdentity,blueprintNode,readiness}=context;
  const inputFiles=[...context.inputFiles,
    'content/knowledge/l10n/bilingual-terminology-registry.json',
    'content/knowledge/l10n/multilingual-node-projection-registry.json',
    'content/knowledge/l10n/locale-readiness-gate.json',
    'content/knowledge/l10n/knr-l10n-w1-freeze-v1.json'
  ];
  const text=[blueprintNode.titleZhHans,readiness.canonicalQuestion,readiness.centralThesis,...(readiness.includedScope||[]),...(readiness.requiredMechanisms||[]).map(x=>x.requirement||x.label||'')].join('\n');
  const payload={
    briefType:'canonical_article_production_brief',
    briefSchemaVersion:'PHI-OS-CANONICAL-PRODUCTION-BRIEF-v2.0.0',
    briefCode:`BRIEF-${nodeCode}-ZH-HANS-V1`,
    nodeCode, locale, repositoryCommit:resolvedCommit,
    authority:{canonicalMeaning:'TL',localizedIdentity:'KNR-L10N-W1',review:'independent_human_review',approval:'independent_human_approval',publication:'independent_publication'},
    canonicalMeaning:{canonicalTitle:blueprintNode.titleZhHans,canonicalQuestion:readiness.canonicalQuestion,centralThesis:readiness.centralThesis,nodeType:node.nodeType,domainCode:node.domainCode??null,themeCode:node.themeCode,relationships:node.relationships},
    localizedIdentity:{displayQuestion:localizedIdentity.displayQuestion,localizedSummary:localizedIdentity.localizedSummary??null,searchAliases:localizedIdentity.searchAliases||[],slug:localizedIdentity.slug},
    articleBoundary:{mustEstablish:readiness.requiredMechanisms||[],requiredDistinctions:readiness.requiredDistinctions||[],mustNotClaim:readiness.prohibitedClaims||[],includedScope:readiness.includedScope||readiness.articleBoundary||[],excludedScope:readiness.excludedScope||[]},
    governance:{registryMutationAllowed:false,reviewInheritanceAllowed:false,approvalInheritanceAllowed:false,publicationInheritanceAllowed:false,generatedContentAuthority:'candidate_only',publishedContentAllowed:false},
    terminologyProjection:{registryVersion:terminology.version,terms:selectTerms(terminology,text)},
    sourceSnapshot:{inputFiles:[...new Set(inputFiles)].filter(Boolean).sort(),inputDigest:await digestInputs(root,inputFiles)},
    outputContract:{candidateLocale:'zh-Hans',allowedCandidateStates:['draft','ready_for_human_review','changes_required'],forbiddenCandidateStates:['approved','publication_ready','published','human_approved'],requiredIndependentReview:true,requiredIndependentApproval:true,requiredIndependentPublication:true}
  };
  return {...payload,briefDigest:digest(payload)};
}
export { serialize, digest, digestTextSource };
