import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import crypto from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';

const CONTRACT_PATH = 'content/web-production/production-operational-closure/poc-a/contracts/poc-a10-live-responsive-matrix-contract-v1.json';
const EVIDENCE_PATH = 'content/web-production/production-operational-closure/poc-a/evidence/poc-a10-live-responsive-matrix-evidence-v1.json';
const ACCEPTANCE_PATH = 'content/web-production/production-operational-closure/poc-a/acceptance/poc-a10-live-responsive-matrix-acceptance-v1.json';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    if (['screenshots', 'headed'].includes(key)) {
      args[key] = true;
      continue;
    }
    args[key] = argv[i + 1];
    i += 1;
  }
  return args;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function readJson(file) {
  return JSON.parse((await fs.readFile(file, 'utf8')).replace(/^\uFEFF/, ''));
}

function gitHead() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function isFullSha(value) {
  return /^[0-9a-f]{40}$/i.test(String(value || ''));
}

function browserCandidates() {
  const home = os.homedir();
  const env = process.env;
  const candidates = [
    env.PHIOS_BROWSER_PATH,
    env.CHROME_PATH,
    env.EDGE_PATH,
    process.platform === 'win32' ? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' : null,
    process.platform === 'win32' ? 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe' : null,
    process.platform === 'win32' ? `${home}\\AppData\\Local\\Microsoft\\Edge\\Application\\msedge.exe` : null,
    process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : null,
    process.platform === 'win32' ? 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe' : null,
    process.platform === 'win32' ? `${home}\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe` : null,
    process.platform === 'darwin' ? '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge' : null,
    process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : null,
    process.platform === 'linux' ? '/usr/bin/microsoft-edge' : null,
    process.platform === 'linux' ? '/usr/bin/google-chrome' : null,
    process.platform === 'linux' ? '/usr/bin/chromium' : null,
    process.platform === 'linux' ? '/usr/bin/chromium-browser' : null
  ].filter(Boolean);
  return [...new Set(candidates)];
}

function resolveBrowser(explicit) {
  if (explicit) {
    if (!fsSync.existsSync(explicit)) {
      throw new Error(`Browser executable not found: ${explicit}`);
    }
    return explicit;
  }
  for (const candidate of browserCandidates()) {
    if (fsSync.existsSync(candidate)) return candidate;
  }
  throw new Error('No Chromium browser found. Pass --browser <path> or set PHIOS_BROWSER_PATH.');
}

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

async function waitForJson(url, timeoutMs = 15000) {
  const started = Date.now();
  let lastError;
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch (error) {
      lastError = error;
    }
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${url}${lastError ? `: ${lastError.message}` : ''}`);
}

class CdpClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
  }

  async connect() {
    await new Promise((resolve, reject) => {
      const ws = new WebSocket(this.url);
      this.ws = ws;
      const onOpen = () => {
        ws.removeEventListener('error', onError);
        resolve();
      };
      const onError = event => reject(new Error(`CDP WebSocket error: ${event.message || 'connection failed'}`));
      ws.addEventListener('open', onOpen, { once: true });
      ws.addEventListener('error', onError, { once: true });
      ws.addEventListener('message', event => this.#onMessage(event.data));
      ws.addEventListener('close', () => {
        for (const { reject: pendingReject } of this.pending.values()) {
          pendingReject(new Error('CDP connection closed'));
        }
        this.pending.clear();
      });
    });
  }

  #onMessage(raw) {
    const message = JSON.parse(String(raw));
    if (message.id) {
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(`${message.error.code}: ${message.error.message}`));
      else pending.resolve(message.result || {});
      return;
    }
    if (message.method) {
      const listeners = this.listeners.get(message.method) || [];
      for (const listener of [...listeners]) listener(message.params || {});
    }
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, handler) {
    const list = this.listeners.get(method) || [];
    list.push(handler);
    this.listeners.set(method, list);
    return () => {
      const next = (this.listeners.get(method) || []).filter(item => item !== handler);
      this.listeners.set(method, next);
    };
  }

  once(method, timeoutMs = 20000) {
    return new Promise((resolve, reject) => {
      let timer;
      const off = this.on(method, params => {
        clearTimeout(timer);
        off();
        resolve(params);
      });
      timer = setTimeout(() => {
        off();
        reject(new Error(`Timed out waiting for CDP event ${method}`));
      }, timeoutMs);
    });
  }

  close() {
    try { this.ws?.close(); } catch {}
  }
}

function addLocale(route, locale) {
  const url = new URL(route, 'https://placeholder.invalid');
  url.searchParams.set('lang', locale);
  return `${url.pathname}${url.search}${url.hash}`;
}

function safeName(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function browserEvaluationSource({ expectedLocale, expectedSelector, tolerance }) {
  return `(() => {
    const expectedLocale = ${JSON.stringify(expectedLocale)};
    const expectedSelector = ${JSON.stringify(expectedSelector)};
    const tolerance = ${Number(tolerance)};
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const root = document.documentElement;
    const body = document.body;

    const style = el => getComputedStyle(el);
    const rect = el => el.getBoundingClientRect();
    const isHiddenByAncestor = el => {
      let current = el;
      while (current && current.nodeType === 1) {
        if (current.hidden || current.getAttribute('aria-hidden') === 'true') return true;
        const s = style(current);
        if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return true;
        current = current.parentElement;
      }
      return false;
    };
    const visible = el => {
      if (!el || isHiddenByAncestor(el)) return false;
      const r = rect(el);
      return r.width > 1 && r.height > 1;
    };
    const scrollableX = el => {
      const s = style(el);
      return ['auto','scroll'].includes(s.overflowX) && el.scrollWidth > el.clientWidth + tolerance;
    };
    const hasScrollableAncestor = el => {
      let current = el.parentElement;
      while (current && current !== body && current !== root) {
        if (scrollableX(current)) return true;
        current = current.parentElement;
      }
      return false;
    };
    const label = el => {
      const id = el.id ? '#' + el.id : '';
      const classes = [...el.classList].slice(0, 3).map(c => '.' + c).join('');
      const data = el.getAttribute('data-wpr-production-surface') || el.getAttribute('data-page') || '';
      return (el.tagName.toLowerCase() + id + classes + (data ? '[' + data + ']' : '')).slice(0, 180);
    };
    const textOf = el => (el.innerText || el.textContent || '').replace(/\\s+/g, ' ').trim();
    const leafTextElements = () => {
      const candidates = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,label,button,a,summary,dt,dd,th,td,[role="button"]')]
        .filter(visible)
        .filter(el => textOf(el).length > 0)
        .filter(el => ![...el.children].some(child => visible(child) && textOf(child).length > 0));
      return candidates.slice(0, 500);
    };
    const clippedText = el => {
      if (!visible(el)) return false;
      const s = style(el);
      if (s.display === 'inline') return false;
      if (s.textOverflow === 'ellipsis') return false;
      if (scrollableX(el) || hasScrollableAncestor(el)) return false;
      return el.scrollWidth > el.clientWidth + tolerance;
    };
    const result = (pass, details = {}) => ({ pass: Boolean(pass), details });

    const documentWidth = Math.max(root.scrollWidth, body ? body.scrollWidth : 0);
    const horizontalOverflow = documentWidth > vw + tolerance;

    const navs = [...document.querySelectorAll('header nav,[role="navigation"],.public-nav,.site-nav,[data-public-header-placeholder] nav')].filter(visible);
    const navFailures = [];
    for (const nav of navs) {
      const r = rect(nav);
      if (r.left < -tolerance || r.right > vw + tolerance) {
        navFailures.push({ element: label(nav), reason: 'NAV_OUTSIDE_VIEWPORT', rect: { left:r.left, right:r.right, width:r.width } });
      }
      if (!scrollableX(nav) && nav.scrollWidth > nav.clientWidth + tolerance) {
        navFailures.push({ element: label(nav), reason: 'NAV_CONTENT_CLIPPED', clientWidth:nav.clientWidth, scrollWidth:nav.scrollWidth });
      }
      for (const item of [...nav.querySelectorAll('a,button,[role="button"]')].filter(visible)) {
        if (clippedText(item)) navFailures.push({ element: label(item), reason: 'NAV_LABEL_CLIPPED' });
      }
    }

    const gridFailures = [];
    const grids = [...document.querySelectorAll('body *')].filter(el => visible(el) && style(el).display === 'grid').slice(0, 200);
    for (const grid of grids) {
      if (scrollableX(grid)) continue;
      const gr = rect(grid);
      for (const child of [...grid.children].filter(visible)) {
        const cs = style(child);
        if (['absolute','fixed'].includes(cs.position)) continue;
        const cr = rect(child);
        if (cr.left < gr.left - tolerance || cr.right > gr.right + tolerance) {
          gridFailures.push({ grid:label(grid), child:label(child), gridRect:{left:gr.left,right:gr.right}, childRect:{left:cr.left,right:cr.right} });
          if (gridFailures.length >= 12) break;
        }
      }
      if (gridFailures.length >= 12) break;
    }

    const cardFailures = [];
    const cards = [...document.querySelectorAll('[class*="card"],[data-card],[class*="tile"],[class*="panel"]')].filter(visible).slice(0, 200);
    for (const card of cards) {
      const texts = [...card.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,label,button,a')].filter(visible).slice(0, 80);
      for (const text of texts) {
        const s = style(text);
        const fontSize = Number.parseFloat(s.fontSize || '0');
        const lineHeight = s.lineHeight === 'normal' ? fontSize * 1.2 : Number.parseFloat(s.lineHeight || '0');
        if (fontSize > 0 && fontSize < 12) cardFailures.push({ element:label(text), reason:'FONT_TOO_SMALL', fontSize });
        if (lineHeight > 0 && lineHeight < 14) cardFailures.push({ element:label(text), reason:'LINE_HEIGHT_TOO_SMALL', lineHeight });
        if (clippedText(text)) cardFailures.push({ element:label(text), reason:'CARD_TEXT_CLIPPED' });
        if (cardFailures.length >= 12) break;
      }
      if (cardFailures.length >= 12) break;
    }

    const overlapFailures = [];
    const textEls = leafTextElements();
    for (let i = 0; i < textEls.length && overlapFailures.length < 12; i += 1) {
      const a = textEls[i];
      const ar = rect(a);
      for (let j = i + 1; j < textEls.length && overlapFailures.length < 12; j += 1) {
        const b = textEls[j];
        if (a.contains(b) || b.contains(a)) continue;
        const br = rect(b);
        const overlapW = Math.min(ar.right, br.right) - Math.max(ar.left, br.left);
        const overlapH = Math.min(ar.bottom, br.bottom) - Math.max(ar.top, br.top);
        if (overlapW <= 2 || overlapH <= 2) continue;
        const area = overlapW * overlapH;
        const smaller = Math.min(ar.width * ar.height, br.width * br.height);
        if (area < Math.min(40, smaller * 0.12)) continue;
        const as = style(a); const bs = style(b);
        if (as.position === 'static' && bs.position === 'static' && a.parentElement === b.parentElement && as.display === 'inline' && bs.display === 'inline') continue;
        overlapFailures.push({ a:label(a), b:label(b), overlap:{width:overlapW,height:overlapH} });
      }
    }

    const fixedWidthFailures = [];
    const allVisible = [...document.querySelectorAll('body *')].filter(visible).slice(0, 2500);
    for (const el of allVisible) {
      if (hasScrollableAncestor(el) || scrollableX(el)) continue;
      const r = rect(el);
      const s = style(el);
      const minWidth = Number.parseFloat(s.minWidth || '0');
      if (r.width > vw + tolerance || (s.minWidth.endsWith('px') && minWidth > vw + tolerance)) {
        fixedWidthFailures.push({ element:label(el), rectWidth:r.width, minWidth:s.minWidth, viewport:vw });
        if (fixedWidthFailures.length >= 12) break;
      }
    }

    const formFailures = [];
    const controls = [...document.querySelectorAll('input:not([type="hidden"]),select,textarea,button')].filter(visible).slice(0, 300);
    for (const control of controls) {
      const r = rect(control);
      const type = (control.getAttribute('type') || '').toLowerCase();
      const compactNative = ['checkbox','radio'].includes(type);
      if (!compactNative && (r.width < 24 || r.height < 24)) {
        formFailures.push({ element:label(control), reason:'CONTROL_TOO_SMALL', width:r.width, height:r.height });
      }
      if (r.left < -tolerance || r.right > vw + tolerance) {
        formFailures.push({ element:label(control), reason:'CONTROL_OUTSIDE_VIEWPORT', left:r.left, right:r.right });
      }
      if (clippedText(control)) formFailures.push({ element:label(control), reason:'CONTROL_TEXT_CLIPPED' });
      if (formFailures.length >= 12) break;
    }

    const visualFailures = [];
    const visuals = [...document.querySelectorAll('img,svg,video,canvas,picture')].filter(visible).slice(0, 400);
    for (const asset of visuals) {
      const r = rect(asset);
      const parent = asset.parentElement;
      const pr = parent ? rect(parent) : null;
      if (!hasScrollableAncestor(asset) && (r.left < -tolerance || r.right > vw + tolerance)) {
        visualFailures.push({ element:label(asset), reason:'ASSET_OUTSIDE_VIEWPORT', left:r.left, right:r.right, viewport:vw });
      }
      if (parent && visible(parent) && !scrollableX(parent) && pr && (r.left < pr.left - tolerance || r.right > pr.right + tolerance)) {
        const ps = style(parent);
        if (!['hidden','clip'].includes(ps.overflowX)) {
          visualFailures.push({ element:label(asset), parent:label(parent), reason:'ASSET_OUTSIDE_PARENT', assetRect:{left:r.left,right:r.right}, parentRect:{left:pr.left,right:pr.right} });
        }
      }
      if (visualFailures.length >= 12) break;
    }

    const localeFailures = [];
    const actualLang = (root.lang || '').trim();
    const expectedLang = expectedLocale;
    if (actualLang !== expectedLang) localeFailures.push({ reason:'DOCUMENT_LANG_MISMATCH', expected:expectedLang, actual:actualLang });
    for (const el of leafTextElements()) {
      const s = style(el);
      if (s.whiteSpace === 'nowrap') continue;
      if (clippedText(el)) {
        localeFailures.push({ element:label(el), reason:'LOCALE_TEXT_CLIPPED', text:textOf(el).slice(0,120) });
        if (localeFailures.length >= 12) break;
      }
    }

    const selectorResolved = Boolean(document.querySelector(expectedSelector));
    const main = document.querySelector('main');
    const title = document.title;
    const navEntry = performance.getEntriesByType('navigation')[0];
    const responseStatus = navEntry && 'responseStatus' in navEntry ? navEntry.responseStatus : null;

    return {
      viewport: { width:vw, height:vh, documentWidth, documentHeight:Math.max(root.scrollHeight, body ? body.scrollHeight : 0) },
      document: { readyState:document.readyState, title, lang:actualLang, expectedSelector, selectorResolved, hasMain:Boolean(main), responseStatus },
      criteria: {
        NO_HORIZONTAL_OVERFLOW: result(!horizontalOverflow, { viewportWidth:vw, documentWidth, tolerance }),
        NO_CLIPPED_NAVIGATION: result(navFailures.length === 0, { inspected:navs.length, failures:navFailures }),
        NO_BROKEN_GRID: result(gridFailures.length === 0, { inspected:grids.length, failures:gridFailures }),
        NO_UNREADABLE_CARDS: result(cardFailures.length === 0, { inspected:cards.length, failures:cardFailures }),
        NO_OVERLAPPING_TEXT: result(overlapFailures.length === 0, { inspectedTextNodes:textEls.length, failures:overlapFailures }),
        NO_FIXED_WIDTH_DESKTOP_LEAKAGE: result(fixedWidthFailures.length === 0, { failures:fixedWidthFailures }),
        NO_UNUSABLE_FORM_CONTROLS: result(formFailures.length === 0, { inspected:controls.length, failures:formFailures }),
        NO_VISUAL_ASSET_OVERFLOW: result(visualFailures.length === 0, { inspected:visuals.length, failures:visualFailures }),
        NO_BROKEN_LOCALE_WRAPPING: result(localeFailures.length === 0, { expectedLocale, actualLang, failures:localeFailures })
      }
    };
  })()`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const contractRaw = await fs.readFile(CONTRACT_PATH, 'utf8');
  const contract = JSON.parse(contractRaw.replace(/^\uFEFF/, ''));
  const matrixRaw = await fs.readFile(contract.authority.responsiveMatrix.path, 'utf8');
  const criteriaRaw = await fs.readFile(contract.authority.responsiveCriteria.path, 'utf8');
  const inventoryRaw = await fs.readFile(contract.authority.frontendSurfaceInventory.path, 'utf8');
  const matrix = JSON.parse(matrixRaw.replace(/^\uFEFF/, ''));
  const criteriaAuthority = JSON.parse(criteriaRaw.replace(/^\uFEFF/, ''));

  const origin = String(args.origin || contract.productionOrigin).replace(/\/$/, '');
  if (!/^https:\/\//i.test(origin) && !/^http:\/\/127\.0\.0\.1(?::\d+)?$/i.test(origin) && !/^http:\/\/localhost(?::\d+)?$/i.test(origin)) {
    throw new Error(`Origin must be HTTPS production or localhost test origin: ${origin}`);
  }

  const head = gitHead();
  const candidateSha = args['candidate-sha'] || head;
  if (!isFullSha(candidateSha)) {
    throw new Error('A full 40-character --candidate-sha is required when git HEAD cannot be resolved.');
  }
  if (head && args['candidate-sha'] && candidateSha !== head) {
    console.warn(`WARNING: supplied production candidate ${candidateSha} differs from local git HEAD ${head}. This is allowed only when POC-A2 has reconciled the live Cloudflare deployment to the supplied SHA.`);
  }

  const expectedCount = matrix.viewports.length * matrix.locales.length * matrix.surfaceFamilies.length;
  if (expectedCount !== matrix.primaryCheckCount || expectedCount !== 182) {
    throw new Error(`Responsive matrix authority drift: expected 182, found ${expectedCount}/${matrix.primaryCheckCount}`);
  }
  if (contract.matrix.requiredStateCount !== 182) throw new Error('A10 contract must require exactly 182 states.');

  const authorityCriteria = criteriaAuthority.criteria.map(item => item.code);
  if (JSON.stringify(authorityCriteria) !== JSON.stringify(contract.criteria)) {
    throw new Error('A10 criteria drift from BFR-H13 authority.');
  }

  const representatives = new Map(contract.representativeSurfaces.map(item => [item.surfaceFamily, item]));
  for (const family of matrix.surfaceFamilies) {
    if (!representatives.has(family)) throw new Error(`Missing representative surface for family: ${family}`);
  }

  const browser = resolveBrowser(args.browser);
  const settleMs = Number(args['settle-ms'] || contract.execution.defaultSettleMs || 700);
  const screenshots = Boolean(args.screenshots);
  const screenshotDir = args['screenshot-dir'] || '.tmp/poc-a10-responsive-failures';
  const port = await freePort();
  const profileDir = await fs.mkdtemp(path.join(os.tmpdir(), 'phios-poc-a10-'));

  const browserArgs = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-default-apps',
    '--disable-sync',
    '--metrics-recording-only',
    '--mute-audio',
    '--disable-features=Translate,MediaRouter',
    '--window-position=0,0',
    'about:blank'
  ];
  if (!args.headed) browserArgs.unshift('--headless=new', '--hide-scrollbars');
  if (process.platform === 'linux') browserArgs.unshift('--no-sandbox');

  console.log('');
  console.log('POC-A10 | LIVE RESPONSIVE MATRIX');
  console.log(`Candidate: ${candidateSha}`);
  console.log(`Origin:    ${origin}`);
  console.log(`Browser:   ${browser}`);
  console.log(`States:    ${expectedCount}`);
  console.log(`Settle:    ${settleMs}ms`);
  console.log('');

  const child = spawn(browser, browserArgs, { stdio: ['ignore', 'ignore', 'pipe'] });
  let browserStderr = '';
  child.stderr?.on('data', chunk => { browserStderr += String(chunk); });

  let client;
  const startedAt = new Date().toISOString();
  const stateResults = [];
  let failed = false;

  try {
    await waitForJson(`http://127.0.0.1:${port}/json/version`);
    const target = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' }).then(response => {
      if (!response.ok) throw new Error(`Unable to create browser target: HTTP ${response.status}`);
      return response.json();
    });
    client = new CdpClient(target.webSocketDebuggerUrl);
    await client.connect();
    await Promise.all([
      client.send('Page.enable'),
      client.send('Runtime.enable'),
      client.send('Network.enable')
    ]);

    let completed = 0;
    for (const family of matrix.surfaceFamilies) {
      const representative = representatives.get(family);
      for (const locale of matrix.locales) {
        for (const viewport of matrix.viewports) {
          completed += 1;
          const height = Number(contract.execution.viewportHeightsByWidth[String(viewport)] || 900);
          const routeWithLocale = addLocale(representative.route, locale);
          const url = new URL(routeWithLocale, origin).toString();
          const consoleErrors = [];
          const exceptions = [];
          let documentStatus = null;
          let loaderId = null;

          const offConsole = client.on('Runtime.consoleAPICalled', params => {
            if (params.type === 'error') {
              consoleErrors.push((params.args || []).map(arg => arg.value ?? arg.description ?? '').join(' ').slice(0, 500));
            }
          });
          const offException = client.on('Runtime.exceptionThrown', params => {
            exceptions.push(params.exceptionDetails?.text || params.exceptionDetails?.exception?.description || 'Uncaught exception');
          });
          const offResponse = client.on('Network.responseReceived', params => {
            if (params.type === 'Document' && (!loaderId || params.loaderId === loaderId)) {
              documentStatus = params.response?.status ?? documentStatus;
            }
          });

          try {
            await client.send('Emulation.setDeviceMetricsOverride', {
              width: viewport,
              height,
              deviceScaleFactor: 1,
              mobile: viewport <= 768,
              screenWidth: viewport,
              screenHeight: height
            });
            await client.send('Emulation.setTouchEmulationEnabled', {
              enabled: viewport <= 768,
              maxTouchPoints: viewport <= 768 ? 5 : 1
            });

            const loadPromise = client.once('Page.loadEventFired', 25000);
            const navigation = await client.send('Page.navigate', { url });
            loaderId = navigation.loaderId || null;
            if (navigation.errorText) throw new Error(`Navigation failed: ${navigation.errorText}`);
            await loadPromise;
            await sleep(settleMs);

            const evaluation = await client.send('Runtime.evaluate', {
              expression: browserEvaluationSource({
                expectedLocale: locale,
                expectedSelector: representative.expectedSelector,
                tolerance: contract.execution.horizontalTolerancePx
              }),
              returnByValue: true,
              awaitPromise: true
            });
            if (evaluation.exceptionDetails) throw new Error(evaluation.exceptionDetails.text || 'Browser evaluation failed');
            const metrics = evaluation.result?.value;
            if (!metrics) throw new Error('Browser evaluation returned no metrics.');

            const criterionFailures = Object.entries(metrics.criteria)
              .filter(([, criterion]) => criterion.pass !== true)
              .map(([code]) => code);
            const responseStatus = documentStatus ?? metrics.document.responseStatus;
            const selectorPass = metrics.document.selectorResolved === true;
            const httpPass = responseStatus === 200 || responseStatus === null;
            const readyPass = metrics.document.readyState === 'complete';
            const statePass = criterionFailures.length === 0 && selectorPass && httpPass && readyPass;

            const record = {
              surfaceFamily: family,
              locale,
              viewport,
              viewportHeight: height,
              route: representative.route,
              requestedUrl: url,
              responseStatus,
              selector: representative.expectedSelector,
              selectorResolved: selectorPass,
              readyState: metrics.document.readyState,
              title: metrics.document.title,
              documentLang: metrics.document.lang,
              documentWidth: metrics.viewport.documentWidth,
              documentHeight: metrics.viewport.documentHeight,
              criteria: metrics.criteria,
              consoleErrors: consoleErrors.slice(0, 10),
              uncaughtExceptions: exceptions.slice(0, 10),
              result: statePass ? 'PASS' : 'FAIL',
              failures: [
                ...criterionFailures,
                ...(selectorPass ? [] : ['REPRESENTATIVE_SELECTOR_MISSING']),
                ...(httpPass ? [] : [`DOCUMENT_HTTP_${responseStatus}`]),
                ...(readyPass ? [] : ['DOCUMENT_NOT_COMPLETE'])
              ]
            };

            if (!statePass && screenshots) {
              await fs.mkdir(screenshotDir, { recursive: true });
              const captured = await client.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
              const filename = `${String(completed).padStart(3, '0')}-${safeName(family)}-${safeName(locale)}-${viewport}.png`;
              const screenshotPath = path.join(screenshotDir, filename);
              await fs.writeFile(screenshotPath, Buffer.from(captured.data, 'base64'));
              record.failureScreenshot = screenshotPath.replaceAll('\\', '/');
            }

            stateResults.push(record);
            if (!statePass) failed = true;
            console.log(`[${String(completed).padStart(3, '0')}/182] ${statePass ? 'PASS' : 'FAIL'} | ${family} | ${locale} | ${viewport}px${record.failures.length ? ` | ${record.failures.join(', ')}` : ''}`);
          } catch (error) {
            failed = true;
            stateResults.push({
              surfaceFamily: family,
              locale,
              viewport,
              viewportHeight: height,
              route: representative.route,
              requestedUrl: url,
              result: 'FAIL',
              failures: ['RUNNER_STATE_ERROR'],
              error: error.message,
              consoleErrors: consoleErrors.slice(0, 10),
              uncaughtExceptions: exceptions.slice(0, 10)
            });
            console.log(`[${String(completed).padStart(3, '0')}/182] FAIL | ${family} | ${locale} | ${viewport}px | RUNNER_STATE_ERROR: ${error.message}`);
          } finally {
            offConsole();
            offException();
            offResponse();
          }
        }
      }
    }
  } finally {
    client?.close();
    try { child.kill('SIGTERM'); } catch {}
    await sleep(200);
    try { if (!child.killed) child.kill('SIGKILL'); } catch {}
    await fs.rm(profileDir, { recursive: true, force: true });
  }

  const passedCount = stateResults.filter(item => item.result === 'PASS').length;
  const failedCount = stateResults.length - passedCount;
  const finishedAt = new Date().toISOString();
  const browserVersion = await (async () => {
    try { return execFileSync(browser, ['--version'], { encoding: 'utf8' }).trim(); } catch { return path.basename(browser); }
  })();

  const evidence = {
    schemaVersion: 'PHI-OS-POC-A10-LIVE-RESPONSIVE-MATRIX-EVIDENCE-v1.0.0',
    work: 'POC-A10',
    status: failed || stateResults.length !== 182 ? 'LIVE_BROWSER_REVALIDATION_FAILED' : 'LIVE_BROWSER_REVALIDATION_PASSED',
    candidateCommit: candidateSha,
    productionOrigin: origin,
    deploymentShaReconciliation: 'OUT_OF_SCOPE_REQUIRES_POC_A2_EXACT_DEPLOYMENT_EVIDENCE',
    startedAt,
    finishedAt,
    browser: {
      executable: browser,
      version: browserVersion,
      headless: !args.headed,
      protocol: 'CHROME_DEVTOOLS_PROTOCOL'
    },
    authorityDigests: {
      contract: sha256(contractRaw),
      responsiveMatrix: sha256(matrixRaw),
      responsiveCriteria: sha256(criteriaRaw),
      frontendSurfaceInventory: sha256(inventoryRaw)
    },
    matrix: {
      viewports: matrix.viewports,
      locales: matrix.locales,
      surfaceFamilies: matrix.surfaceFamilies,
      requiredStateCount: 182,
      executedStateCount: stateResults.length,
      passedStateCount: passedCount,
      failedStateCount: failedCount
    },
    criteriaCodes: contract.criteria,
    results: stateResults,
    summaryBySurfaceFamily: Object.fromEntries(matrix.surfaceFamilies.map(family => {
      const rows = stateResults.filter(item => item.surfaceFamily === family);
      return [family, {
        total: rows.length,
        passed: rows.filter(item => item.result === 'PASS').length,
        failed: rows.filter(item => item.result !== 'PASS').length
      }];
    })),
    authorityBoundary: {
      browserRevalidationOnly: true,
      screenshotsAreSupplementalOnly: true,
      humanVisualAcceptanceInferred: false,
      accessibilityAcceptanceInferred: false,
      breakpointAuthorityChanged: false,
      pdsMutated: false,
      historicalBfrMatrixRewritten: false,
      deploymentShaAccepted: false,
      customDomainAccepted: false,
      globalProductionAccepted: false
    }
  };

  await fs.mkdir(path.dirname(EVIDENCE_PATH), { recursive: true });
  const evidenceRaw = JSON.stringify(evidence, null, 2) + '\n';
  await fs.writeFile(EVIDENCE_PATH, evidenceRaw, 'utf8');

  if (!failed && stateResults.length === 182 && passedCount === 182) {
    const acceptance = {
      schemaVersion: 'PHI-OS-POC-A10-LIVE-RESPONSIVE-MATRIX-ACCEPTANCE-v1.0.0',
      work: 'POC-A10',
      status: 'LIVE_RESPONSIVE_182_STATE_MATRIX_ACCEPTED_MACHINE_BROWSER_SCOPE',
      accepted: true,
      candidateCommit: candidateSha,
      productionOrigin: origin,
      evidence: {
        path: EVIDENCE_PATH,
        sha256: sha256(evidenceRaw),
        executedStateCount: 182,
        passedStateCount: 182,
        failedStateCount: 0
      },
      criteria: {
        requiredPerState: contract.criteria,
        allCriteriaPassedPerState: true
      },
      historicalAuthority: {
        responsiveMatrixPath: contract.authority.responsiveMatrix.path,
        responsiveMatrixRewritten: false,
        responsiveCriteriaPath: contract.authority.responsiveCriteria.path,
        responsiveCriteriaRewritten: false
      },
      authorityBoundary: {
        machineBrowserResponsiveAcceptanceOnly: true,
        humanVisualAcceptance: false,
        accessibilityAcceptance: false,
        deploymentShaAcceptance: false,
        customDomainAcceptance: false,
        globalProductionAccepted: false
      }
    };
    await fs.mkdir(path.dirname(ACCEPTANCE_PATH), { recursive: true });
    await fs.writeFile(ACCEPTANCE_PATH, JSON.stringify(acceptance, null, 2) + '\n', 'utf8');
  } else {
    await fs.rm(ACCEPTANCE_PATH, { force: true });
  }

  console.log('');
  console.log('POC-A10 SUMMARY');
  console.log(`Executed: ${stateResults.length}/182`);
  console.log(`Passed:   ${passedCount}/182`);
  console.log(`Failed:   ${failedCount}/182`);
  console.log(`Evidence: ${EVIDENCE_PATH}`);
  if (!failed && passedCount === 182) {
    console.log(`Acceptance: ${ACCEPTANCE_PATH}`);
    console.log('✓ POC-A10 Live Responsive Matrix passed 182/182 production browser states.');
  } else {
    console.log('✗ POC-A10 remains open. Fix failures and rerun; no acceptance artifact was emitted.');
    if (browserStderr.trim()) console.log(`Browser stderr tail: ${browserStderr.trim().slice(-1200)}`);
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error(`POC-A10 runner failed: ${error.stack || error.message}`);
  process.exitCode = 1;
});
