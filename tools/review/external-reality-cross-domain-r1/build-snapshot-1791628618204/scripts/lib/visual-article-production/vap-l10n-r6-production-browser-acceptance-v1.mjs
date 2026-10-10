import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { normalizeArticleForRenderer } from '../../../assets/js/knowledge/article-blocks.js';

export const ROOT = process.cwd();
export const CONTRACT_PATH = 'content/production/visual-article/l10n/contracts/vap-l10n-r6-production-browser-acceptance-v1.json';
export const REVIEW_TEMPLATE_PATH = 'content/production/visual-article/l10n/acceptance/VAP-L10N-R6-browser-review.template.json';
export const REVIEW_PATH = 'content/production/visual-article/l10n/acceptance/VAP-L10N-R6-browser-review.json';
export const PREFLIGHT_PATH = 'content/production/visual-article/l10n/acceptance/VAP-L10N-R6-KN-PREFACE-001.preflight.json';
export const ACCEPTANCE_PATH = 'content/production/visual-article/l10n/acceptance/VAP-L10N-R6-KN-PREFACE-001.json';

const R5_ACCEPTANCE = 'content/production/visual-article/l10n/acceptance/VAP-L10N-R5-KN-PREFACE-001-EN.json';
const R5_FREEZE = 'content/production/visual-article/l10n/freeze/VAP-L10N-R5-KN-PREFACE-001-EN.json';
const RELEASE_MANIFEST = 'content/knowledge/public/visual-article-release.json';
const ZH_ARTICLE = 'content/knowledge/public/visual-articles/zh-Hans/ai-formation-from-civilizational-capability.json';
const EN_ARTICLE = 'content/knowledge/public/visual-articles/en/ai-formation-from-civilizational-capability.json';
const PUBLIC_SURFACE_MODULE = 'assets/js/web-production/public-surface-data.js';
const PUBLISHED_CONTENT_MODULE = 'assets/js/knowledge/published-content.js';
const FIGURE_PATH = '/assets/knowledge/KN-PREFACE-001/ASSET-KN-PREFACE-001-MECHANISM-ZH-HANS-002.webp';

const readJson = (relative, root = ROOT) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const readText = (relative, root = ROOT) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative, root = ROOT) => fs.existsSync(path.join(root, relative));
const canonical = value => Array.isArray(value)
  ? value.map(canonical)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]))
    : value;
export const digest = value => crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
export const fileDigest = (relative, root = ROOT) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relative))).digest('hex');

function git(root, ...args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

function gitState(root = ROOT) {
  return {
    head: git(root, 'rev-parse', 'HEAD'),
    originMain: git(root, 'rev-parse', 'origin/main')
  };
}

function isAncestor(root, ancestor, descendant = 'HEAD') {
  if (!/^[0-9a-f]{40}$/.test(ancestor || '')) return false;
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', ancestor, descendant], { cwd: root, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function containsHan(value) {
  return /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/u.test(String(value || ''));
}

function localEvidence(root = ROOT) {
  const contract = readJson(CONTRACT_PATH, root);
  const r5 = readJson(R5_ACCEPTANCE, root);
  const r5Freeze = readJson(R5_FREEZE, root);
  const manifest = readJson(RELEASE_MANIFEST, root);
  const zh = readJson(ZH_ARTICLE, root);
  const en = readJson(EN_ARTICLE, root);
  const records = manifest.records || [];
  const zhRecord = records.find(record => record.nodeCode === 'KN-PREFACE-001' && record.locale === 'zh-Hans' && record.status === 'published');
  const enRecord = records.find(record => record.nodeCode === 'KN-PREFACE-001' && record.locale === 'en' && record.status === 'published');
  let zhRendererValid = false;
  let enRendererValid = false;
  try { normalizeArticleForRenderer(zh); zhRendererValid = true; } catch {}
  try { normalizeArticleForRenderer(en); enRendererValid = true; } catch {}
  const surfaceSource = readText(PUBLIC_SURFACE_MODULE, root);
  const publishedSource = readText(PUBLISHED_CONTENT_MODULE, root);
  const requiredExports = [
    'loadFiveVolumePublicationContextRegistry',
    'resolvePublicationContextForNode',
    'resolveFigurePublicationContext',
    'readingPathVolumeTransition'
  ];
  const requiredImports = ['loadFiveVolumePublicationContextRegistry', 'resolvePublicationContextForNode'];
  const moduleContractValid = requiredExports.every(name => new RegExp(`export\\s+(?:async\\s+)?function\\s+${name}\\b`).test(surfaceSource)) &&
    requiredImports.every(name => publishedSource.includes(name));
  const zhFigure = zh.visualAssets?.find(asset => asset.assetCode === 'ASSET-KN-PREFACE-001-MECHANISM-ZH-HANS-002');
  const enFigure = en.visualAssets?.find(asset => asset.assetCode === 'ASSET-KN-PREFACE-001-MECHANISM-ZH-HANS-002');
  return {
    contractBaseline: contract.upstreamBaselineCommit,
    r5Accepted: r5.status === 'ACCEPTED_SAME_ROUTE_LOCALE_RUNTIME',
    r5Frozen: r5Freeze.status === 'FROZEN' && r5Freeze.governance?.productionBrowserAcceptanceIncluded === false,
    sameRouteManifest: Boolean(zhRecord && enRecord && zhRecord.slug === enRecord.slug && zhRecord.href === enRecord.href),
    zhRendererValid,
    enRendererValid,
    zhLocaleCorrect: zh.locale === 'zh-Hans' && containsHan(`${zh.title} ${zh.summary}`),
    enLocaleCorrect: en.locale === 'en' && !containsHan(`${en.title} ${en.summary} ${JSON.stringify(en.sections)}`),
    samePhysicalFigure: Boolean(zhFigure && enFigure && zhFigure.publicSrc === enFigure.publicSrc && zhFigure.publicSrc === FIGURE_PATH),
    englishFigureAccessibilityLocalized: Boolean(enFigure?.altText && enFigure?.caption && !containsHan(`${enFigure.altText} ${enFigure.caption}`)),
    moduleContractValid,
    authorityDigests: {
      r5Acceptance: fileDigest(R5_ACCEPTANCE, root),
      r5Freeze: fileDigest(R5_FREEZE, root),
      manifest: fileDigest(RELEASE_MANIFEST, root),
      zhVisualArticle: fileDigest(ZH_ARTICLE, root),
      enVisualArticle: fileDigest(EN_ARTICLE, root)
    }
  };
}

async function fetchResource(url, kind) {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
      headers: { accept: kind === 'json' ? 'application/json' : '*/*' }
    });
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok) return { ok: false, status: response.status, contentType, error: `HTTP_${response.status}` };
    if (kind === 'json') {
      const value = await response.json();
      return { ok: true, status: response.status, contentType, value };
    }
    if (kind === 'webp') {
      const bytes = new Uint8Array(await response.arrayBuffer());
      const signatureValid = bytes.length >= 12 &&
        String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
        String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
      return { ok: signatureValid, status: response.status, contentType, signatureValid, byteLength: bytes.length };
    }
    const text = await response.text();
    return { ok: true, status: response.status, contentType, text };
  } catch (error) {
    return { ok: false, status: null, contentType: '', error: error?.message || String(error) };
  }
}

export async function collectProductionEvidence(root = ROOT) {
  const contract = readJson(CONTRACT_PATH, root);
  const origin = contract.scope.productionOrigin;
  const slug = contract.scope.slug;
  const urls = {
    zhRoute: `${origin}/articles/${slug}?lang=zh-Hans`,
    enRoute: `${origin}/articles/${slug}?lang=en`,
    manifest: `${origin}/content/knowledge/public/visual-article-release.json`,
    zhArticle: `${origin}/content/knowledge/public/visual-articles/zh-Hans/${slug}.json`,
    enArticle: `${origin}/content/knowledge/public/visual-articles/en/${slug}.json`,
    figure: `${origin}${FIGURE_PATH}`,
    publicSurfaceModule: `${origin}/${PUBLIC_SURFACE_MODULE}`,
    publishedContentModule: `${origin}/${PUBLISHED_CONTENT_MODULE}`
  };
  const [zhRoute, enRoute, manifest, zhArticle, enArticle, figure, publicSurfaceModule, publishedContentModule] = await Promise.all([
    fetchResource(urls.zhRoute, 'html'),
    fetchResource(urls.enRoute, 'html'),
    fetchResource(urls.manifest, 'json'),
    fetchResource(urls.zhArticle, 'json'),
    fetchResource(urls.enArticle, 'json'),
    fetchResource(urls.figure, 'webp'),
    fetchResource(urls.publicSurfaceModule, 'text'),
    fetchResource(urls.publishedContentModule, 'text')
  ]);
  let zhRendererContractValid = false;
  let enRendererContractValid = false;
  if (zhArticle.ok) { try { normalizeArticleForRenderer(zhArticle.value); zhRendererContractValid = true; } catch {} }
  if (enArticle.ok) { try { normalizeArticleForRenderer(enArticle.value); enRendererContractValid = true; } catch {} }
  const shellValid = result => result.ok &&
    /data-article-slug=["']ai-formation-from-civilizational-capability["']/.test(result.text || '') &&
    /assets\/js\/pages\/article\.js/.test(result.text || '');
  const liveModuleContractValid = publicSurfaceModule.ok && publishedContentModule.ok &&
    ['loadFiveVolumePublicationContextRegistry', 'resolvePublicationContextForNode', 'resolveFigurePublicationContext', 'readingPathVolumeTransition']
      .every(name => (publicSurfaceModule.text || '').includes(name)) &&
    ['loadFiveVolumePublicationContextRegistry', 'resolvePublicationContextForNode']
      .every(name => (publishedContentModule.text || '').includes(name));
  const liveManifestRecords = manifest.value?.records || [];
  const zhManifest = liveManifestRecords.find(record => record.nodeCode === 'KN-PREFACE-001' && record.locale === 'zh-Hans' && record.status === 'published');
  const enManifest = liveManifestRecords.find(record => record.nodeCode === 'KN-PREFACE-001' && record.locale === 'en' && record.status === 'published');
  const zhFigure = zhArticle.value?.visualAssets?.find(asset => asset.assetCode === 'ASSET-KN-PREFACE-001-MECHANISM-ZH-HANS-002');
  const enFigure = enArticle.value?.visualAssets?.find(asset => asset.assetCode === 'ASSET-KN-PREFACE-001-MECHANISM-ZH-HANS-002');
  return {
    checkedAt: new Date().toISOString(),
    urls,
    routeShell: { zhHans: shellValid(zhRoute), en: shellValid(enRoute) },
    manifestHttp200: manifest.ok,
    zhArticleHttp200: zhArticle.ok,
    enArticleHttp200: enArticle.ok,
    figureHttp200: figure.ok,
    figureWebpSignatureValid: figure.signatureValid === true,
    zhRendererContractValid,
    enRendererContractValid,
    sameRouteManifest: Boolean(zhManifest && enManifest && zhManifest.slug === enManifest.slug && zhManifest.href === enManifest.href),
    samePhysicalFigure: Boolean(zhFigure && enFigure && zhFigure.publicSrc === enFigure.publicSrc && zhFigure.publicSrc === FIGURE_PATH),
    liveModuleContractValid,
    responses: {
      zhRoute: { status: zhRoute.status, contentType: zhRoute.contentType },
      enRoute: { status: enRoute.status, contentType: enRoute.contentType },
      manifest: { status: manifest.status, contentType: manifest.contentType },
      zhArticle: { status: zhArticle.status, contentType: zhArticle.contentType },
      enArticle: { status: enArticle.status, contentType: enArticle.contentType },
      figure: { status: figure.status, contentType: figure.contentType, byteLength: figure.byteLength },
      publicSurfaceModule: { status: publicSurfaceModule.status, contentType: publicSurfaceModule.contentType },
      publishedContentModule: { status: publishedContentModule.status, contentType: publishedContentModule.contentType }
    }
  };
}

function requiredHumanChecks(review) {
  return [
    review?.sameRoute?.sameSlugPreserved,
    review?.sameRoute?.localeSwitchPreservesRoute,
    review?.desktop?.zhHansArticleVisible,
    review?.desktop?.zhHansContentChineseOnly,
    review?.desktop?.zhHansFigureVisible,
    review?.desktop?.zhHansFigureAltCaptionCorrect,
    review?.desktop?.englishArticleVisible,
    review?.desktop?.englishContentEnglishOnly,
    review?.desktop?.englishFigureVisible,
    review?.desktop?.englishFigureAltCaptionCorrect,
    review?.desktop?.publishedArticleFormatMatches,
    review?.desktop?.readingWidthConsistentAcrossLocales,
    review?.desktop?.noScreenWidthParagraphDrift,
    review?.mobile?.zhHansCorrect,
    review?.mobile?.englishCorrect,
    review?.mobile?.figureResponsive,
    review?.mobile?.noHorizontalOverflow,
    review?.runtime?.noConsoleErrors,
    review?.runtime?.noBrokenNetworkRequests,
    review?.runtime?.noBlankArticleMain,
    review?.runtime?.headerFooterRemainFunctional,
    review?.assetBoundary?.samePhysicalFigureObserved,
    review?.assetBoundary?.noUnpublishedAssetLeakage,
    review?.assetBoundary?.noFixtureLeakage
  ];
}

export function buildR6Preflight({ root = ROOT } = {}) {
  const contract = readJson(CONTRACT_PATH, root);
  const local = localEvidence(root);
  const gates = {
    upstreamR5Accepted: local.r5Accepted,
    upstreamR5Frozen: local.r5Frozen,
    sameRouteManifest: local.sameRouteManifest,
    bothLocalRendererContractsValid: local.zhRendererValid && local.enRendererValid,
    localePurityValid: local.zhLocaleCorrect && local.enLocaleCorrect,
    samePhysicalFigure: local.samePhysicalFigure,
    englishFigureAccessibilityLocalized: local.englishFigureAccessibilityLocalized,
    articleModuleContractValid: local.moduleContractValid
  };
  const ready = Object.values(gates).every(Boolean);
  const body = {
    schemaVersion: 'PHI-OS-VAP-L10N-R6-PRODUCTION-BROWSER-PREFLIGHT-v1.0.0',
    work: 'VAP-L10N-R6',
    status: ready ? 'READY_FOR_PRODUCTION_BROWSER_REVIEW' : 'BLOCKED_BY_LOCAL_RUNTIME_PRECONDITION',
    nodeCode: contract.scope.nodeCode,
    slug: contract.scope.slug,
    href: contract.scope.href,
    productionOrigin: contract.scope.productionOrigin,
    upstreamBaselineCommit: contract.upstreamBaselineCommit,
    git: gitState(root),
    gates,
    localEvidence: local,
    browserReviewPath: REVIEW_PATH,
    governance: contract.governance
  };
  return { ...body, preflightDigest: digest(body) };
}

export function writeR6Preflight({ root = ROOT } = {}) {
  const value = buildR6Preflight({ root });
  const target = path.join(root, PREFLIGHT_PATH);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  return value;
}

export async function buildR6Acceptance({ root = ROOT } = {}) {
  const contract = readJson(CONTRACT_PATH, root);
  const preflight = buildR6Preflight({ root });
  const production = await collectProductionEvidence(root);
  const review = exists(REVIEW_PATH, root) ? readJson(REVIEW_PATH, root) : null;
  const deploymentSha = review?.deployment?.deploymentCommitSha || '';
  const humanChecksPassed = Boolean(review && review.decision === 'ACCEPT' && requiredHumanChecks(review).every(value => value === true));
  const deploymentShaValid = /^[0-9a-f]{40}$/.test(deploymentSha) && isAncestor(root, deploymentSha, 'HEAD');
  const productionChecksPassed = [
    production.routeShell.zhHans,
    production.routeShell.en,
    production.manifestHttp200,
    production.zhArticleHttp200,
    production.enArticleHttp200,
    production.figureHttp200,
    production.figureWebpSignatureValid,
    production.zhRendererContractValid,
    production.enRendererContractValid,
    production.sameRouteManifest,
    production.samePhysicalFigure,
    production.liveModuleContractValid
  ].every(Boolean);
  const status = preflight.status !== 'READY_FOR_PRODUCTION_BROWSER_REVIEW'
    ? 'BLOCKED_BY_LOCAL_RUNTIME_PRECONDITION'
    : !productionChecksPassed
      ? 'BLOCKED_BY_PRODUCTION_EVIDENCE'
      : !review
        ? 'AWAITING_TL_INTERACTIVE_BROWSER_ACCEPTANCE'
        : !deploymentShaValid
          ? 'AWAITING_VALID_CLOUDFLARE_DEPLOYMENT_SHA'
          : !humanChecksPassed
            ? 'PRESENT_NOT_ACCEPTED'
            : 'ACCEPTED_PRODUCTION_BROWSER';
  const body = {
    schemaVersion: 'PHI-OS-VAP-L10N-R6-PRODUCTION-BROWSER-ACCEPTANCE-v1.0.0',
    work: 'VAP-L10N-R6',
    status,
    nodeCode: contract.scope.nodeCode,
    locales: contract.scope.locales,
    slug: contract.scope.slug,
    href: contract.scope.href,
    productionOrigin: contract.scope.productionOrigin,
    testedDeployment: {
      commitSha: deploymentSha || null,
      fullShaValid: /^[0-9a-f]{40}$/.test(deploymentSha),
      ancestorOfAcceptanceHead: deploymentShaValid
    },
    upstream: {
      r5AcceptancePath: R5_ACCEPTANCE,
      r5AcceptanceDigest: fileDigest(R5_ACCEPTANCE, root),
      r5FreezePath: R5_FREEZE,
      r5FreezeDigest: fileDigest(R5_FREEZE, root),
      r5FreezeMutated: false
    },
    automatedEvidence: production,
    browserReviewPath: REVIEW_PATH,
    browserReviewDigest: review ? fileDigest(REVIEW_PATH, root) : null,
    humanReviewAccepted: humanChecksPassed,
    acceptance: {
      sameCanonicalRoute: production.sameRouteManifest && review?.sameRoute?.sameSlugPreserved === true && review?.sameRoute?.localeSwitchPreservesRoute === true,
      zhHansProductionVisible: review?.desktop?.zhHansArticleVisible === true,
      englishProductionVisible: review?.desktop?.englishArticleVisible === true,
      bothLocaleFiguresVisible: review?.desktop?.zhHansFigureVisible === true && review?.desktop?.englishFigureVisible === true,
      localizedFigureAccessibility: review?.desktop?.zhHansFigureAltCaptionCorrect === true && review?.desktop?.englishFigureAltCaptionCorrect === true,
      consistentPublishedArticleFormat: review?.desktop?.publishedArticleFormatMatches === true && review?.desktop?.readingWidthConsistentAcrossLocales === true && review?.desktop?.noScreenWidthParagraphDrift === true,
      responsiveBothLocales: review?.mobile?.zhHansCorrect === true && review?.mobile?.englishCorrect === true && review?.mobile?.figureResponsive === true && review?.mobile?.noHorizontalOverflow === true,
      runtimeHealthy: review?.runtime?.noConsoleErrors === true && review?.runtime?.noBrokenNetworkRequests === true && review?.runtime?.noBlankArticleMain === true,
      sharedPhysicalFigure: production.samePhysicalFigure && review?.assetBoundary?.samePhysicalFigureObserved === true,
      noLeakage: review?.assetBoundary?.noUnpublishedAssetLeakage === true && review?.assetBoundary?.noFixtureLeakage === true
    },
    governance: {
      checkerWritesState: false,
      interactiveHumanAcceptanceRequired: true,
      automaticApprovalForbidden: true,
      r1ToR5AuthorityMutationAllowed: false,
      r5FreezeMutationAllowed: false,
      browserAcceptanceCreatesPublicationAuthority: false
    }
  };
  return { ...body, acceptanceDigest: digest(body) };
}

export async function writeR6Acceptance({ root = ROOT } = {}) {
  const value = await buildR6Acceptance({ root });
  const target = path.join(root, ACCEPTANCE_PATH);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  return value;
}
