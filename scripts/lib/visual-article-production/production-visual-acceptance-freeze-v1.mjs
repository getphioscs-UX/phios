import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { normalizeArticleForRenderer } from '../../../assets/js/knowledge/article-blocks.js';

const root = process.cwd();
const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const digest = value => crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
export const acceptancePath = 'content/production/visual-article/release/acceptance/VAP-W28-KN-PREFACE-001-ZH-HANS.json';
export const reviewPath = 'content/production/visual-article/release/acceptance/VAP-W28-browser-review.json';
export const freezePath = 'content/production/visual-article/release/freeze/VAP-W29-KN-PREFACE-001-ZH-HANS.json';

function rendererValid() {
  try { normalizeArticleForRenderer(read('content/knowledge/public/visual-articles/zh-Hans/ai-formation-from-civilizational-capability.json')); return true; }
  catch { return false; }
}
async function fetchProduction(url, kind) {
  try {
    const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { accept: kind === 'json' ? 'application/json' : '*/*' } });
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok) return { http200: false, status: response.status, contentType, error: `HTTP_${response.status}` };
    if (kind === 'json') {
      const value = await response.json();
      normalizeArticleForRenderer(value);
      return { http200: true, status: response.status, contentType, rendererContractValid: true };
    }
    if (kind === 'webp') {
      const bytes = new Uint8Array(await response.arrayBuffer());
      const riff = bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
      return { http200: riff, status: response.status, contentType, webpSignatureValid: riff, byteLength: bytes.length };
    }
    const html = await response.text();
    return { http200: /data-article-slug=["']ai-formation-from-civilizational-capability["']/.test(html), status: response.status, contentType, articleRouteShellValid: /data-article-slug=/.test(html) };
  } catch (error) { return { http200: false, status: null, contentType: '', error: error?.message || String(error) }; }
}
async function productionEvidence(w27) {
  const origin = new URL(w27.productionUrl).origin;
  const articleUrl = new URL('/content/knowledge/public/visual-articles/zh-Hans/ai-formation-from-civilizational-capability.json', origin).href;
  const figureUrl = new URL('/assets/knowledge/KN-PREFACE-001/ASSET-KN-PREFACE-001-MECHANISM-ZH-HANS-002.webp', origin).href;
  const [route, article, figure] = await Promise.all([fetchProduction(w27.productionUrl, 'html'), fetchProduction(articleUrl, 'json'), fetchProduction(figureUrl, 'webp')]);
  return { checkedAt: new Date().toISOString(), routeUrl: w27.productionUrl, articleUrl, figureUrl, routeHttp200: route.http200, articleJsonHttp200: article.http200, figureHttp200: figure.http200, rendererContractValid: article.rendererContractValid === true, route, article, figure, localRendererContractValid: rendererValid() };
}
export async function buildW28() {
  const w27 = read('content/production/visual-article/release/website/VAP-W27-KN-PREFACE-001-ZH-HANS.json');
  const evidence = await productionEvidence(w27);
  const review = fs.existsSync(path.join(root, reviewPath)) ? read(reviewPath) : null;
  const reviewAccepted = review && ['articleVisible','figureVisible','figureCorrect','figurePlacementCorrect','altCorrect','pdsCorrect','mobileCorrect','chineseCorrect','noConsoleErrors','noBrokenAsset','noUnpublishedAssetLeakage','noFixtureLeakage'].every(key => review[key] === true);
  const productionPassed = evidence.routeHttp200 && evidence.articleJsonHttp200 && evidence.figureHttp200 && evidence.rendererContractValid;
  const status = !productionPassed ? 'BLOCKED_BY_PRODUCTION_EVIDENCE' : reviewAccepted ? 'ACCEPTED' : 'AWAITING_TL_INTERACTIVE_BROWSER_ACCEPTANCE';
  const body = { schemaVersion:'PHI-OS-VAP-PRODUCTION-VISUAL-ACCEPTANCE-v1.0.0', work:'VAP-W28', nodeCode:w27.nodeCode, locale:w27.locale, slug:w27.slug, href:w27.href, productionUrl:w27.productionUrl, status, executionPerformed:reviewAccepted === true, automatedEvidence:evidence, browserReviewPath:reviewPath, governance:{ checkerWritesState:false, interactiveHumanAcceptanceRequired:true, automaticApprovalForbidden:true, automaticDeploymentForbidden:true } };
  return { ...body, acceptanceDigest:digest(body) };
}
export async function writeW28() { const value=await buildW28(); fs.mkdirSync(path.dirname(path.join(root,acceptancePath)),{recursive:true}); fs.writeFileSync(path.join(root,acceptancePath),`${JSON.stringify(value,null,2)}\n`); return value; }
export function buildW29() {
  const w28=read(acceptancePath); const accepted=w28.status==='ACCEPTED';
  const body={ schemaVersion:'PHI-OS-VAP-FIRST-VISUAL-ARTICLE-FREEZE-v1.0.0', work:'VAP-W29', nodeCode:w28.nodeCode, locale:w28.locale, slug:w28.slug, href:w28.href, status:accepted?'FROZEN':'BLOCKED_BY_W28', executionPerformed:accepted, frozenVerticalSlice:accepted?['PJA','CAR','CPR','PDS','Website']:[], upstreamAcceptanceDigest:w28.acceptanceDigest, governance:{ checkerWritesState:false, freezeRequiresAcceptedW28:true, automaticApprovalForbidden:true } };
  return {...body,freezeDigest:digest(body)};
}
export function writeW29(){const value=buildW29();fs.mkdirSync(path.dirname(path.join(root,freezePath)),{recursive:true});fs.writeFileSync(path.join(root,freezePath),`${JSON.stringify(value,null,2)}\n`);return value;}
