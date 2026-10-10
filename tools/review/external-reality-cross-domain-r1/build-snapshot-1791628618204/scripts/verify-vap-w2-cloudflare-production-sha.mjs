import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  EVIDENCE_PATH,
  buildVerificationRecord,
  loadVapW2Contract,
  normalizeCloudflareDeployments,
  selectProductionDeployment,
  stable
} from './lib/visual-article-production/cloudflare-production-sha-verification-v1.mjs';

const root = process.cwd();
const contract = loadVapW2Contract(root);
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const fail = (code, message) => Object.assign(new Error(`${code}: ${message}`), { code });

try {
  git('fetch', 'origin', '--quiet');
} catch (error) {
  throw fail('VAP_W2_GIT_FETCH_FAILED', error?.stderr?.toString?.().trim() || error.message);
}
const originMain = git('rev-parse', 'origin/main');
const head = git('rev-parse', 'HEAD');
if (originMain !== contract.implementationBaselineCommit) {
  throw fail('VAP_W2_BASELINE_DRIFT', `origin/main=${originMain}; expected=${contract.implementationBaselineCommit}. Rebase VAP-W2 on the new main before verifying Cloudflare.`);
}
if (head !== originMain) throw fail('VAP_W2_HEAD_NOT_AT_ORIGIN_MAIN', `HEAD=${head}; origin/main=${originMain}`);

const wrangler = localWrangler(root);
const whoami = runWranglerJson(wrangler, ['whoami', '--json'], 'VAP_W2_CLOUDFLARE_WHOAMI_UNAVAILABLE');
if (whoami?.loggedIn !== true || !Array.isArray(whoami.accounts) || whoami.accounts.length === 0) {
  throw fail('VAP_W2_CLOUDFLARE_AUTH_UNAVAILABLE', 'Wrangler is not authenticated or returned no Cloudflare accounts. Run npx wrangler login, then retry.');
}
const auth = runWranglerJson(wrangler, ['auth', 'token', '--json'], 'VAP_W2_CLOUDFLARE_AUTH_TOKEN_UNAVAILABLE');
const headers = cloudflareAuthHeaders(auth);

let selectedAccount = null;
let apiPayload = null;
let lastApiError = null;
for (const account of whoami.accounts) {
  try {
    const payload = await fetchDeploymentsForAccount({ accountId: account.id, projectName: contract.cloudflare.projectName, environment: contract.cloudflare.environment, headers });
    selectedAccount = account;
    apiPayload = payload;
    break;
  } catch (error) {
    lastApiError = error;
    if (error?.code !== 'VAP_W2_CLOUDFLARE_PROJECT_NOT_FOUND') throw error;
  }
}
if (!selectedAccount || !apiPayload) {
  throw fail('VAP_W2_CLOUDFLARE_PROJECT_NOT_FOUND', lastApiError?.message || `Project ${contract.cloudflare.projectName} was not found in any authenticated Cloudflare account.`);
}

const deployments = normalizeCloudflareDeployments(apiPayload);
const { deployment, selectionMode } = selectProductionDeployment(deployments, contract);
if (!deployment) throw fail('VAP_W2_NO_PRODUCTION_DEPLOYMENT', `No production deployment returned for ${contract.cloudflare.projectName}.`);

const reachability = await probe(contract.cloudflare.productionUrl);
const verifiedAt = new Date().toISOString();
const record = buildVerificationRecord({
  contract,
  repository: { originMain, head, branch: git('branch', '--show-current') || 'DETACHED' },
  deployment,
  selectionMode,
  reachability,
  verifiedAt,
  rawDeploymentCount: deployments.length,
  metadataContext: {
    accountId: selectedAccount.id,
    accountName: selectedAccount.name ?? null,
    authenticationType: auth.type ?? whoami.authType ?? null,
    apiOperation: `GET /accounts/${selectedAccount.id}/pages/projects/${contract.cloudflare.projectName}/deployments?env=${contract.cloudflare.environment}`
  }
});
const target = path.join(root, EVIDENCE_PATH);
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, stable(record), 'utf8');

console.log(`VAP-W2 status: ${record.status}`);
console.log(`origin/main:     ${originMain}`);
console.log(`Cloudflare SHA:  ${record.alignment.deployedCommit ?? 'missing'}`);
console.log(`branch:          ${deployment.branch ?? 'missing'}`);
console.log(`stage:           ${deployment.stageStatus ?? 'missing'}`);
console.log(`deployment URL:  ${deployment.url ?? 'missing'}`);
console.log(`production URL:  ${contract.cloudflare.productionUrl} (${reachability.status ?? 'network_error'})`);
console.log(`metadata:        Cloudflare Pages REST API via Wrangler ${auth.type ?? 'authenticated session'}`);
console.log(`evidence:        ${EVIDENCE_PATH}`);
if (!record.alignment.verified) process.exitCode = 2;

function localWrangler(rootDir) {
  const js = path.join(rootDir, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
  if (!fs.existsSync(js)) throw fail('VAP_W2_WRANGLER_NOT_INSTALLED', 'Local Wrangler is missing. Run npm ci before VAP-W2 verification.');
  return { command: process.execPath, prefixArgs: [js] };
}

function runWranglerJson(wranglerInfo, args, code) {
  let stdout;
  try {
    stdout = execFileSync(wranglerInfo.command, [...wranglerInfo.prefixArgs, ...args], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
      windowsHide: true
    });
  } catch (error) {
    const detail = [error?.stderr?.toString?.().trim(), error?.stdout?.toString?.().trim()].filter(Boolean).join('\n');
    throw fail(code, detail || `Wrangler command failed: ${args.join(' ')}`);
  }
  try { return parseJsonOutput(stdout); }
  catch { throw fail(`${code}_JSON_INVALID`, String(stdout).slice(0, 500)); }
}

function cloudflareAuthHeaders(authPayload) {
  if ((authPayload?.type === 'oauth' || authPayload?.type === 'api_token') && typeof authPayload.token === 'string' && authPayload.token.length) {
    return { Authorization: `Bearer ${authPayload.token}` };
  }
  if (authPayload?.type === 'api_key' && typeof authPayload.key === 'string' && typeof authPayload.email === 'string') {
    return { 'X-Auth-Key': authPayload.key, 'X-Auth-Email': authPayload.email };
  }
  throw fail('VAP_W2_CLOUDFLARE_AUTH_FORMAT_UNSUPPORTED', `Wrangler auth token returned unsupported credential type: ${authPayload?.type ?? 'missing'}`);
}

async function fetchDeploymentsForAccount({ accountId, projectName, environment, headers }) {
  const url = new URL(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/pages/projects/${encodeURIComponent(projectName)}/deployments`);
  url.searchParams.set('env', environment);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { ...headers, Accept: 'application/json', 'user-agent': 'PHI-OS-VAP-W2/1.0.1' }
    });
    let payload;
    try { payload = await response.json(); }
    catch { throw fail('VAP_W2_CLOUDFLARE_API_JSON_INVALID', `HTTP ${response.status} from Pages deployments API.`); }
    if (response.status === 404 || apiErrorLooksLikeProjectNotFound(payload)) {
      throw fail('VAP_W2_CLOUDFLARE_PROJECT_NOT_FOUND', `Project ${projectName} was not found in account ${accountId}.`);
    }
    if (!response.ok || payload?.success === false) {
      const message = (payload?.errors ?? []).map(item => item?.message || item?.code).filter(Boolean).join('; ') || `HTTP ${response.status}`;
      throw fail('VAP_W2_CLOUDFLARE_METADATA_UNAVAILABLE', message);
    }
    if (!Array.isArray(payload?.result)) throw fail('VAP_W2_CLOUDFLARE_API_RESULT_INVALID', 'Pages deployments API did not return a result array.');
    return payload;
  } catch (error) {
    if (error?.code) throw error;
    throw fail('VAP_W2_CLOUDFLARE_METADATA_UNAVAILABLE', error?.name === 'AbortError' ? 'Cloudflare Pages API request timed out.' : error.message);
  } finally {
    clearTimeout(timer);
  }
}

function apiErrorLooksLikeProjectNotFound(payload) {
  return Array.isArray(payload?.errors) && payload.errors.some(error => /not found|unknown project/i.test(String(error?.message ?? '')));
}

function parseJsonOutput(value) {
  const text = String(value).replace(/^\uFEFF/, '').trim();
  try { return JSON.parse(text); } catch {}
  const starts = [text.indexOf('['), text.indexOf('{')].filter(index => index >= 0).sort((a,b)=>a-b);
  for (const start of starts) {
    try { return JSON.parse(text.slice(start)); } catch {}
  }
  throw new Error('invalid json');
}

async function probe(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal, headers: { 'user-agent': 'PHI-OS-VAP-W2/1.0.1' } });
    const result = {
      reachable: response.status >= 200 && response.status < 400,
      status: response.status,
      finalUrl: response.url,
      server: response.headers.get('server'),
      cfRayObserved: Boolean(response.headers.get('cf-ray'))
    };
    try { await response.body?.cancel(); } catch {}
    return result;
  } catch (error) {
    return { reachable: false, status: null, finalUrl: null, server: null, cfRayObserved: false, error: error.name || 'network_error' };
  } finally { clearTimeout(timer); }
}
