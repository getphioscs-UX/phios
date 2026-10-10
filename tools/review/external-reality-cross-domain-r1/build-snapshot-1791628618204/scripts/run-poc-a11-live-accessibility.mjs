import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import crypto from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';

const CONTRACT_PATH = 'content/web-production/production-operational-closure/poc-a/contracts/poc-a11-live-accessibility-contract-v1.json';
const EVIDENCE_PATH = 'content/web-production/production-operational-closure/poc-a/evidence/poc-a11-live-accessibility-evidence-v1.json';
const ACCEPTANCE_PATH = 'content/web-production/production-operational-closure/poc-a/acceptance/poc-a11-live-accessibility-acceptance-v1.json';

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
  return [...new Set([
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
  ].filter(Boolean))];
}

function resolveBrowser(explicit) {
  if (explicit) {
    if (!fsSync.existsSync(explicit)) throw new Error(`Browser executable not found: ${explicit}`);
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
        for (const { reject: pendingReject } of this.pending.values()) pendingReject(new Error('CDP connection closed'));
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

function browserAccessibilityEvaluation(config) {
  const { expectedLocale, expectedSelector, surfaceFamily, touchTargetMinimumCssPx, contrast } = config;
  const root = document.documentElement;
  const body = document.body;
  const style = el => getComputedStyle(el);
  const rect = el => el.getBoundingClientRect();
  const textOf = el => (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
  const label = el => {
    if (!el) return '(none)';
    const id = el.id ? `#${el.id}` : '';
    const classes = [...(el.classList || [])].slice(0, 3).map(c => `.${c}`).join('');
    return `${String(el.tagName || 'node').toLowerCase()}${id}${classes}`.slice(0, 180);
  };
  const hiddenByAncestor = el => {
    let current = el;
    while (current && current.nodeType === 1) {
      if (current.hidden || current.getAttribute('aria-hidden') === 'true' || current.hasAttribute('inert')) return true;
      const s = style(current);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return true;
      current = current.parentElement;
    }
    return false;
  };
  const visible = el => {
    if (!el || hiddenByAncestor(el)) return false;
    const r = rect(el);
    return r.width > 1 && r.height > 1;
  };
  const accessibleName = el => {
    const aria = (el.getAttribute('aria-label') || '').trim();
    if (aria) return aria;
    const labelledBy = (el.getAttribute('aria-labelledby') || '').trim();
    if (labelledBy) {
      const value = labelledBy.split(/\s+/).map(id => textOf(document.getElementById(id))).filter(Boolean).join(' ').trim();
      if (value) return value;
    }
    if (el.labels && el.labels.length) {
      const value = [...el.labels].map(textOf).filter(Boolean).join(' ').trim();
      if (value) return value;
    }
    const title = (el.getAttribute('title') || '').trim();
    if (title) return title;
    const alt = (el.getAttribute('alt') || '').trim();
    if (alt) return alt;
    return textOf(el);
  };
  const outcome = (status, details = {}) => ({ status, pass: status !== 'FAIL', details });
  const pass = details => outcome('PASS', details);
  const fail = details => outcome('FAIL', details);
  const na = details => outcome('NOT_APPLICABLE', details);

  const interactiveSelector = 'a[href],button,input:not([type="hidden"]),select,textarea,summary,[role="button"],[role="link"],[tabindex]';
  const interactive = [...document.querySelectorAll(interactiveSelector)].filter(visible).slice(0, 600);
  const positiveTabIndex = interactive.filter(el => Number(el.getAttribute('tabindex')) > 0);
  const inaccessibleInteractive = interactive.filter(el => {
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') return false;
    if (['A','BUTTON','INPUT','SELECT','TEXTAREA','SUMMARY'].includes(el.tagName)) return false;
    return Number(el.getAttribute('tabindex')) < 0 || !el.hasAttribute('tabindex');
  });
  const unnamedInteractive = interactive.filter(el => {
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') return false;
    if (!['A','BUTTON','SUMMARY'].includes(el.tagName) && !['button','link'].includes((el.getAttribute('role') || '').toLowerCase())) return false;
    return !accessibleName(el);
  });

  const mains = [...document.querySelectorAll('main,[role="main"]')].filter(visible);
  const ids = [...document.querySelectorAll('[id]')].map(el => el.id).filter(Boolean);
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  const brokenAriaRefs = [];
  for (const el of [...document.querySelectorAll('[aria-labelledby],[aria-describedby]')].slice(0, 600)) {
    for (const attr of ['aria-labelledby','aria-describedby']) {
      const refs = (el.getAttribute(attr) || '').trim().split(/\s+/).filter(Boolean);
      for (const id of refs) if (!document.getElementById(id)) brokenAriaRefs.push({ element: label(el), attribute: attr, target: id });
    }
  }
  const landmarkFailures = [];
  if (mains.length !== 1) landmarkFailures.push({ reason: 'MAIN_LANDMARK_COUNT', mainCount: mains.length, mains: mains.map(label) });
  if (duplicateIds.length) landmarkFailures.push({ reason: 'DUPLICATE_IDS', ids: duplicateIds.slice(0, 12) });
  if (brokenAriaRefs.length) landmarkFailures.push({ reason: 'BROKEN_ARIA_REFERENCE', refs: brokenAriaRefs.slice(0, 12) });
  const semanticLandmarks = landmarkFailures.length
    ? fail({ failures: landmarkFailures })
    : pass({ mainCount: mains.length, main: label(mains[0]), duplicateIds: 0, brokenAriaReferences: 0 });

  const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"][aria-level]')].filter(visible);
  const headingRows = headings.map(el => ({
    element: label(el),
    level: el.matches('h1,h2,h3,h4,h5,h6') ? Number(el.tagName.slice(1)) : Number(el.getAttribute('aria-level')),
    text: textOf(el).slice(0, 160)
  }));
  const headingFailures = [];
  if (headingRows.filter(row => row.level === 1).length !== 1) headingFailures.push({ reason: 'H1_COUNT', count: headingRows.filter(row => row.level === 1).length });
  for (const row of headingRows) if (!row.text) headingFailures.push({ reason: 'EMPTY_HEADING', element: row.element, level: row.level });
  for (let i = 1; i < headingRows.length; i += 1) {
    if (headingRows[i].level - headingRows[i - 1].level > 1) {
      headingFailures.push({ reason: 'HEADING_LEVEL_JUMP', from: headingRows[i - 1], to: headingRows[i] });
    }
  }
  const headingHierarchy = headingFailures.length ? fail({ failures: headingFailures.slice(0, 12), headings: headingRows.slice(0, 40) }) : pass({ headingCount: headingRows.length, h1Count: 1 });

  const images = [...document.querySelectorAll('img')].filter(visible).slice(0, 500);
  const altFailures = images.filter(img => !img.hasAttribute('alt')).map(img => ({ element: label(img), src: img.currentSrc || img.src || '' }));
  const altCriterion = altFailures.length ? fail({ failures: altFailures.slice(0, 12), inspected: images.length }) : pass({ inspected: images.length });

  const renderedFigures = [...document.querySelectorAll('figure')].filter(visible).slice(0, 200);
  const meaningfulFigures = renderedFigures.filter(fig => [...fig.querySelectorAll('img,svg,canvas,video')].some(asset => visible(asset) && (asset.tagName !== 'IMG' || (asset.getAttribute('alt') || '').trim() !== '')));
  const figureCaptionFailures = meaningfulFigures.filter(fig => {
    if (fig.querySelector('figcaption')) return false;
    const described = (fig.getAttribute('aria-describedby') || '').trim();
    const labelled = (fig.getAttribute('aria-labelledby') || '').trim();
    if (described || labelled) return false;
    const next = fig.nextElementSibling;
    if (next && visible(next) && (/caption/i.test(next.className || '') || textOf(next).length >= 8)) return false;
    const parentCaption = fig.parentElement?.querySelector(':scope > [class*=\"caption\"], :scope > p');
    if (parentCaption && visible(parentCaption) && textOf(parentCaption).length >= 8) return false;
    return true;
  }).map(fig => ({ element: label(fig), text: textOf(fig).slice(0, 120) }));
  const figureCaption = meaningfulFigures.length === 0
    ? na({ reason: 'NO_RENDERED_MEANINGFUL_FIGURE' })
    : figureCaptionFailures.length
      ? fail({ failures: figureCaptionFailures.slice(0, 12), meaningfulFigures: meaningfulFigures.length })
      : pass({ meaningfulFigures: meaningfulFigures.length });

  const figureRoot = document.querySelector('#figure-main,.figure-detail,[data-figure-detail]');
  let longDescription = na({ reason: 'NO_COMPLEX_FIGURE_SCOPE' });
  if (surfaceFamily === 'Figure' && figureRoot) {
    const visual = figureRoot.querySelector('img,svg,canvas,video');
    const description = figureRoot.querySelector('figcaption,[data-figure-description],[aria-describedby],.figure-description,.knowledge-boundary,p,details');
    longDescription = visual
      ? (description && textOf(description).length >= 8
          ? pass({ visual: label(visual), description: label(description), descriptionLength: textOf(description).length })
          : fail({ reason: 'FIGURE_TEXTUAL_DESCRIPTION_MISSING', visual: label(visual) }))
      : na({ reason: 'STATIC_DETAIL_HAS_NO_RENDERED_VISUAL' });
  }

  function parseColor(value) {
    if (!value) return null;
    const m = String(value).match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)/i);
    if (!m) return null;
    return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: m[4] === undefined ? 1 : Number(m[4]) };
  }
  function blend(fg, bg) {
    const a = Math.max(0, Math.min(1, fg.a));
    return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
  }
  function channel(v) {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  }
  function luminance(c) { return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b); }
  function ratio(a, b) {
    const l1 = luminance(a); const l2 = luminance(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  function effectiveBackground(el) {
    let current = el;
    let bg = { r: 255, g: 255, b: 255, a: 1 };
    const stack = [];
    while (current && current.nodeType === 1) {
      const s = style(current);
      if (s.backgroundImage && s.backgroundImage !== 'none') return { complex: true };
      const c = parseColor(s.backgroundColor);
      if (c && c.a > 0) stack.push(c);
      current = current.parentElement;
    }
    for (let i = stack.length - 1; i >= 0; i -= 1) bg = blend(stack[i], bg);
    return { complex: false, color: bg };
  }
  const textCandidates = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,label,button,a,summary,dt,dd,th,td,span,strong,small,output')]
    .filter(visible)
    .filter(el => textOf(el).length > 0)
    .filter(el => ![...el.children].some(child => visible(child) && textOf(child).length > 0))
    .slice(0, 700);
  const contrastFailures = [];
  let contrastMeasured = 0;
  let contrastComplexSkipped = 0;
  for (const el of textCandidates) {
    const s = style(el);
    const fgRaw = parseColor(s.color);
    const bgInfo = effectiveBackground(el);
    if (!fgRaw || bgInfo.complex) { contrastComplexSkipped += 1; continue; }
    const fg = blend(fgRaw, bgInfo.color);
    const cr = ratio(fg, bgInfo.color);
    const fontSize = Number.parseFloat(s.fontSize || '0');
    const fontWeight = Number.parseFloat(s.fontWeight || '400');
    const large = fontSize >= contrast.largeTextPx || (fontSize >= contrast.largeBoldTextPx && fontWeight >= 700);
    const required = large ? contrast.largeTextMinimum : contrast.normalTextMinimum;
    contrastMeasured += 1;
    if (cr + 0.02 < required) contrastFailures.push({ element: label(el), text: textOf(el).slice(0, 80), ratio: Number(cr.toFixed(2)), required, fontSize, fontWeight });
    if (contrastFailures.length >= 12) break;
  }
  const contrastCriterion = contrastFailures.length
    ? fail({ failures: contrastFailures, measured: contrastMeasured, skippedComplexBackground: contrastComplexSkipped })
    : pass({ measured: contrastMeasured, skippedComplexBackground: contrastComplexSkipped, humanVisualContrastAcceptance: false });

  const motionFailures = [];
  for (const el of [...document.querySelectorAll('body *')].filter(visible).slice(0, 2500)) {
    const s = style(el);
    const durations = String(s.animationDuration || '').split(',').map(x => Number.parseFloat(x) || 0);
    const names = String(s.animationName || '').split(',').map(x => x.trim());
    const transitionDurations = String(s.transitionDuration || '').split(',').map(x => Number.parseFloat(x) || 0);
    if (durations.some((d, i) => d > 0.05 && names[i] && names[i] !== 'none')) motionFailures.push({ element: label(el), reason: 'ANIMATION_REMAINS_UNDER_REDUCED_MOTION', animationName: s.animationName, animationDuration: s.animationDuration });
    if (transitionDurations.some(d => d > 0.25)) motionFailures.push({ element: label(el), reason: 'LONG_TRANSITION_REMAINS_UNDER_REDUCED_MOTION', transitionDuration: s.transitionDuration });
    if (motionFailures.length >= 12) break;
  }
  const reducedMotion = motionFailures.length ? fail({ failures: motionFailures }) : pass({ prefersReducedMotion: true });

  const touchFailures = [];
  const touchCandidates = interactive.filter(el => {
    if (el.matches?.('.skip-link,.phi-skip-link')) return false;
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') return false;
    if (el.tagName === 'A' && style(el).display === 'inline' && el.parentElement && textOf(el.parentElement).length > textOf(el).length + 10) return false;
    return true;
  });
  for (const el of touchCandidates) {
    const r = rect(el);
    if (r.width < touchTargetMinimumCssPx || r.height < touchTargetMinimumCssPx) {
      touchFailures.push({ element: label(el), width: Number(r.width.toFixed(1)), height: Number(r.height.toFixed(1)), name: accessibleName(el).slice(0, 100) });
      if (touchFailures.length >= 12) break;
    }
  }
  const touchTarget = touchFailures.length ? fail({ failures: touchFailures, minimumCssPx: touchTargetMinimumCssPx, inspected: touchCandidates.length }) : pass({ inspected: touchCandidates.length, minimumCssPx: touchTargetMinimumCssPx });

  const formControls = [...document.querySelectorAll('input:not([type="hidden"]),select,textarea')].filter(visible).slice(0, 400);
  const formLabelFailures = formControls.filter(el => !accessibleName(el)).map(el => ({ element: label(el), type: el.getAttribute('type') || el.tagName.toLowerCase() }));
  const formLabels = formLabelFailures.length ? fail({ failures: formLabelFailures.slice(0, 12), inspected: formControls.length }) : pass({ inspected: formControls.length });

  const invalidControls = [...document.querySelectorAll('[aria-invalid="true"],[data-invalid="true"],.is-invalid')].filter(visible).filter(el => ['INPUT','SELECT','TEXTAREA'].includes(el.tagName));
  const visibleErrors = [...document.querySelectorAll('[role="alert"],[data-error],[class*="error"]')].filter(visible).filter(el => textOf(el).length > 0);
  const errorFailures = [];
  for (const control of invalidControls) {
    const ids = `${control.getAttribute('aria-describedby') || ''} ${control.getAttribute('aria-errormessage') || ''}`.trim().split(/\s+/).filter(Boolean);
    const described = ids.some(id => {
      const node = document.getElementById(id);
      return node && visible(node) && textOf(node).length > 0;
    });
    if (!described && visibleErrors.length === 0) errorFailures.push({ element: label(control), reason: 'INVALID_CONTROL_WITHOUT_PROGRAMMATIC_ERROR_DESCRIPTION' });
  }
  const errorIdentification = invalidControls.length === 0 && visibleErrors.length === 0
    ? na({ reason: 'NO_RENDERED_ERROR_OR_INVALID_STATE' })
    : errorFailures.length
      ? fail({ failures: errorFailures.slice(0, 12), invalidControls: invalidControls.length, visibleErrors: visibleErrors.length })
      : pass({ invalidControls: invalidControls.length, visibleErrors: visibleErrors.length });

  const currentItems = [...document.querySelectorAll('[aria-current]')].filter(visible);
  const invalidCurrent = currentItems.filter(el => !['page','step','location','date','time','true','false'].includes((el.getAttribute('aria-current') || '').toLowerCase()));
  const ariaCurrent = currentItems.length === 0
    ? na({ reason: 'NO_RENDERED_ARIA_CURRENT_STATE' })
    : invalidCurrent.length
      ? fail({ failures: invalidCurrent.map(el => ({ element: label(el), value: el.getAttribute('aria-current') })).slice(0, 12) })
      : pass({ inspected: currentItems.length });

  const expanded = [...document.querySelectorAll('[aria-expanded]')].filter(visible);
  const expandedFailures = [];
  for (const el of expanded) {
    const value = (el.getAttribute('aria-expanded') || '').toLowerCase();
    if (!['true','false'].includes(value)) expandedFailures.push({ element: label(el), reason: 'INVALID_ARIA_EXPANDED', value });
    const controls = (el.getAttribute('aria-controls') || '').trim();
    if (controls) {
      for (const id of controls.split(/\s+/)) if (!document.getElementById(id)) expandedFailures.push({ element: label(el), reason: 'ARIA_CONTROLS_TARGET_MISSING', target: id });
    }
  }
  const ariaExpanded = expanded.length === 0 ? na({ reason: 'NO_RENDERED_DISCLOSURE_CONTROL' }) : expandedFailures.length ? fail({ failures: expandedFailures.slice(0, 12) }) : pass({ inspected: expanded.length });

  const dialogs = [...document.querySelectorAll('[role="dialog"],[role="alertdialog"],dialog')].filter(visible);
  const dialogFailures = dialogs.filter(el => !accessibleName(el)).map(el => ({ element: label(el), reason: 'DIALOG_ACCESSIBLE_NAME_MISSING' }));
  const dialogSemantics = dialogs.length === 0 ? na({ reason: 'NO_RENDERED_DIALOG' }) : dialogFailures.length ? fail({ failures: dialogFailures.slice(0, 12) }) : pass({ inspected: dialogs.length });

  const skipLinks = [...document.querySelectorAll('a.skip-link,a.phi-skip-link,a[href^="#"]')].filter(el => /skip/i.test(textOf(el)) || /skip/i.test(el.className || ''));
  const skipFailures = [];
  for (const el of skipLinks) {
    const href = (el.getAttribute('href') || '').trim();
    if (!href.startsWith('#') || href.length < 2) skipFailures.push({ element: label(el), reason: 'SKIP_LINK_TARGET_INVALID', href });
    else if (!document.getElementById(href.slice(1))) skipFailures.push({ element: label(el), reason: 'SKIP_LINK_TARGET_MISSING', href });
    if (el.tabIndex < 0) skipFailures.push({ element: label(el), reason: 'SKIP_LINK_NOT_KEYBOARD_FOCUSABLE' });
  }
  const skipNavigation = skipLinks.length === 0 ? fail({ reason: 'SKIP_LINK_MISSING' }) : skipFailures.length ? fail({ failures: skipFailures.slice(0, 12), inspected: skipLinks.length }) : pass({ inspected: skipLinks.length });

  const stateSignals = [...document.querySelectorAll('[data-state],[data-status],[class*="status"],[class*="warning"],[class*="unknown"],[class*="badge"],[class*="pill"]')].filter(visible).slice(0, 300);
  const colorOnlyFailures = stateSignals.filter(el => !accessibleName(el) && !textOf(el)).map(el => ({ element: label(el) }));
  const visualNotColorOnly = stateSignals.length === 0 ? na({ reason: 'NO_RENDERED_STATE_SIGNAL' }) : colorOnlyFailures.length ? fail({ failures: colorOnlyFailures.slice(0, 12) }) : pass({ inspected: stateSignals.length });

  let volumeIdentity = na({ reason: 'NO_VOLUME_IDENTITY_SCOPE' });
  if (['Homepage','Library','Book'].includes(surfaceFamily)) {
    const volumeSignals = [...document.querySelectorAll('[data-book-id],[data-volume],[class*="volume"],[class*="book"]')].filter(visible).slice(0, 300);
    const named = volumeSignals.filter(el => accessibleName(el) || textOf(el));
    const fallbackHeading = headings.some(el => /book|volume|reality/i.test(textOf(el)));
    volumeIdentity = named.length > 0 || fallbackHeading
      ? pass({ renderedSignals: volumeSignals.length, namedSignals: named.length, fallbackHeading })
      : fail({ reason: 'VOLUME_IDENTITY_HAS_NO_NON_COLOR_TEXT_SIGNAL', renderedSignals: volumeSignals.length });
  }

  const unknownSignals = [...document.querySelectorAll('[class*="unknown"],[data-unknown],[data-state*="UNKNOWN"],[data-status*="UNKNOWN"]')].filter(visible).slice(0, 200);
  const unknownFailures = unknownSignals.filter(el => !accessibleName(el) && !textOf(el)).map(el => ({ element: label(el) }));
  const unknownNotColorOnly = unknownSignals.length === 0 ? na({ reason: 'NO_RENDERED_UNKNOWN_WARNING' }) : unknownFailures.length ? fail({ failures: unknownFailures.slice(0, 12) }) : pass({ inspected: unknownSignals.length });

  let interactiveFigure = na({ reason: 'NO_INTERACTIVE_FIGURE_CONTROLS' });
  if (surfaceFamily === 'Figure') {
    const scope = document.querySelector('#figure-main') || document;
    const controls = [...scope.querySelectorAll('button,a[href],input,select,textarea,[role="button"],[tabindex]')].filter(visible).slice(0, 200);
    const failures = controls.filter(el => {
      if (el.disabled || el.getAttribute('aria-disabled') === 'true') return false;
      return el.tabIndex < 0 || !accessibleName(el);
    }).map(el => ({ element: label(el), tabIndex: el.tabIndex, name: accessibleName(el) }));
    interactiveFigure = controls.length === 0 ? na({ reason: 'STATIC_FIGURE_NO_INTERACTIVE_CONTROLS' }) : failures.length ? fail({ failures: failures.slice(0, 12), inspected: controls.length }) : pass({ inspected: controls.length });
  }

  let askComposer = na({ reason: 'NOT_ASK_PHI_OS_SURFACE' });
  let answerExpandable = na({ reason: 'NOT_ASK_PHI_OS_SURFACE' });
  if (surfaceFamily === 'Ask PHI OS') {
    const composer = document.querySelector('[data-cka-composer]');
    const question = document.querySelector('[data-cka-question]');
    const submit = composer?.querySelector('button[type="submit"]');
    const failures = [];
    if (!composer) failures.push({ reason: 'ASK_COMPOSER_MISSING' });
    if (!question || !visible(question) || question.tabIndex < 0 || !accessibleName(question)) failures.push({ reason: 'ASK_QUESTION_NOT_KEYBOARD_ACCESSIBLE_OR_NAMED' });
    if (!submit || !visible(submit) || submit.tabIndex < 0 || !accessibleName(submit)) failures.push({ reason: 'ASK_SUBMIT_NOT_KEYBOARD_ACCESSIBLE_OR_NAMED' });
    askComposer = failures.length ? fail({ failures }) : pass({ question: label(question), submit: label(submit) });

    const expandables = [...document.querySelectorAll('details:where(:not([hidden])) > summary,[aria-expanded]')].filter(visible);
    const expandableFailures = [];
    for (const el of expandables) {
      if (el.tabIndex < 0) expandableFailures.push({ element: label(el), reason: 'EXPANDABLE_NOT_KEYBOARD_FOCUSABLE' });
      if (!accessibleName(el)) expandableFailures.push({ element: label(el), reason: 'EXPANDABLE_NAME_MISSING' });
    }
    answerExpandable = expandables.length === 0 ? na({ reason: 'NO_RENDERED_EXPANDABLE_ANSWER_REGION' }) : expandableFailures.length ? fail({ failures: expandableFailures.slice(0, 12) }) : pass({ inspected: expandables.length });
  }

  const criteria = {
    KEYBOARD_NAVIGATION: positiveTabIndex.length || inaccessibleInteractive.length || unnamedInteractive.length
      ? fail({ positiveTabIndex: positiveTabIndex.map(label).slice(0, 12), inaccessibleInteractive: inaccessibleInteractive.map(label).slice(0, 12), unnamedInteractive: unnamedInteractive.map(label).slice(0, 12), browserTraversalPending: true })
      : pass({ focusableCount: interactive.filter(el => el.tabIndex >= 0 && !el.disabled).length, unnamedInteractive: 0, browserTraversalPending: true }),
    VISIBLE_FOCUS: pass({ browserTraversalPending: true }),
    SEMANTIC_LANDMARKS: semanticLandmarks,
    HEADING_HIERARCHY: headingHierarchy,
    ALT: altCriterion,
    FIGURE_CAPTION: figureCaption,
    LONG_DESCRIPTION_WHERE_NEEDED: longDescription,
    CONTRAST: contrastCriterion,
    REDUCED_MOTION: reducedMotion,
    TOUCH_TARGET: touchTarget,
    FORM_LABELS: formLabels,
    ERROR_IDENTIFICATION: errorIdentification,
    ARIA_CURRENT: ariaCurrent,
    ARIA_EXPANDED: ariaExpanded,
    DIALOG_SEMANTICS: dialogSemantics,
    SKIP_NAVIGATION: skipNavigation,
    VISUAL_INFORMATION_NOT_COLOR_ONLY: visualNotColorOnly,
    VOLUME_IDENTITY_NOT_COLOR_ONLY: volumeIdentity,
    UNKNOWN_WARNING_NOT_COLOR_ONLY: unknownNotColorOnly,
    INTERACTIVE_FIGURE_KEYBOARD_ACCESSIBILITY: interactiveFigure,
    ASK_COMPOSER_KEYBOARD_ACCESSIBILITY: askComposer,
    ANSWER_EXPANDABLE_REGIONS_ACCESSIBLE: answerExpandable
  };

  return {
    document: {
      title: document.title,
      lang: (root.lang || '').trim(),
      readyState: document.readyState,
      selectorResolved: Boolean(document.querySelector(expectedSelector)),
      expectedSelector,
      expectedLocale,
      activePath: location.pathname
    },
    interactive: {
      total: interactive.length,
      keyboardFocusable: interactive.filter(el => el.tabIndex >= 0 && !el.disabled && el.getAttribute('aria-disabled') !== 'true').length,
      positiveTabIndex: positiveTabIndex.length,
      inaccessibleInteractive: inaccessibleInteractive.length
    },
    criteria
  };
}

function activeFocusSnapshot() {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) return { kind: 'document', focusVisible: false };
  const s = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const text = (el.innerText || el.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
  const id = el.id ? `#${el.id}` : '';
  const classes = [...(el.classList || [])].slice(0, 3).map(c => `.${c}`).join('');
  const outlineWidth = Number.parseFloat(s.outlineWidth || '0') || 0;
  const hasOutline = s.outlineStyle !== 'none' && outlineWidth > 0;
  const hasBoxShadow = Boolean(s.boxShadow && s.boxShadow !== 'none');
  const focusVisible = typeof el.matches === 'function' ? el.matches(':focus-visible') : false;
  return {
    kind: 'element',
    element: `${String(el.tagName || 'node').toLowerCase()}${id}${classes}`.slice(0, 180),
    text: text.slice(0, 120),
    tabIndex: el.tabIndex,
    disabled: Boolean(el.disabled),
    ariaDisabled: el.getAttribute('aria-disabled'),
    focusVisible,
    focusIndicator: hasOutline || hasBoxShadow,
    outlineStyle: s.outlineStyle,
    outlineWidth: s.outlineWidth,
    boxShadow: s.boxShadow,
    rect: { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height },
    viewport: { width: innerWidth, height: innerHeight },
    inViewport: r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth
  };
}

async function evaluateFunction(client, fn, args = []) {
  const expression = `(${fn.toString()})(...${JSON.stringify(args)})`;
  const result = await client.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Browser evaluation failed');
  return result.result?.value;
}

async function keyboardTraversal(client, maxSteps) {
  await client.send('Runtime.evaluate', { expression: 'document.body && document.body.focus(); document.activeElement && document.activeElement.blur && document.activeElement.blur(); true;', returnByValue: true });
  const snapshots = [];
  for (let i = 0; i < maxSteps; i += 1) {
    await client.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
    await client.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
    await sleep(30);
    const snap = await evaluateFunction(client, activeFocusSnapshot);
    snapshots.push(snap);
    if (snap?.kind === 'document' && i > 1) break;
  }
  const elements = snapshots.filter(s => s?.kind === 'element');
  const unique = new Set(elements.map(s => `${s.element}|${s.text}`));
  const offscreen = elements.filter(s => !s.inViewport);
  const invisibleFocus = elements.filter(s => s.focusVisible && !s.focusIndicator);
  let repeatedStreak = 0;
  let maxRepeatedStreak = 0;
  let previous = null;
  for (const s of elements) {
    const key = `${s.element}|${s.text}`;
    if (key === previous) repeatedStreak += 1;
    else repeatedStreak = 1;
    maxRepeatedStreak = Math.max(maxRepeatedStreak, repeatedStreak);
    previous = key;
  }
  return {
    attemptedSteps: maxSteps,
    sampledSteps: snapshots.length,
    focusedElements: elements.length,
    uniqueFocusedElements: unique.size,
    offscreenFocus: offscreen.slice(0, 12),
    focusVisibleWithoutIndicator: invisibleFocus.slice(0, 12),
    maxRepeatedStreak,
    snapshots: elements.slice(0, 18)
  };
}

function mergeKeyboardCriteria(criteria, traversal, focusableCount) {
  const staticKeyboardPass = criteria.KEYBOARD_NAVIGATION.status !== 'FAIL';
  const traversalRequired = focusableCount > 0;
  const traversalPass = !traversalRequired || (traversal.focusedElements > 0 && traversal.uniqueFocusedElements >= Math.min(2, focusableCount) && traversal.offscreenFocus.length === 0 && traversal.maxRepeatedStreak < 4);
  criteria.KEYBOARD_NAVIGATION = {
    status: staticKeyboardPass && traversalPass ? 'PASS' : 'FAIL',
    pass: staticKeyboardPass && traversalPass,
    details: {
      ...(criteria.KEYBOARD_NAVIGATION.details || {}),
      traversal,
      traversalRequired
    }
  };

  const focusApplicable = traversal.focusedElements > 0;
  const focusPass = !focusApplicable || traversal.focusVisibleWithoutIndicator.length === 0;
  criteria.VISIBLE_FOCUS = {
    status: focusApplicable ? (focusPass ? 'PASS' : 'FAIL') : 'NOT_APPLICABLE',
    pass: focusPass,
    details: focusApplicable
      ? { sampledFocusedElements: traversal.focusedElements, failures: traversal.focusVisibleWithoutIndicator }
      : { reason: 'NO_KEYBOARD_FOCUS_TARGET_SAMPLED' }
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const contractRaw = await fs.readFile(CONTRACT_PATH, 'utf8');
  const contract = JSON.parse(contractRaw.replace(/^\uFEFF/, ''));
  const h14Raw = await fs.readFile(contract.authority.bfrH14AccessibilityCriteria.path, 'utf8');
  const wprRaw = await fs.readFile(contract.authority.wprPdsAccessibilityIntegration.path, 'utf8');
  const a10Raw = await fs.readFile(contract.authority.a10RepresentativeSurfaceContract.path, 'utf8');
  const readinessRaw = await fs.readFile(contract.authority.surfaceReadinessBoundary.path, 'utf8');
  const h14 = JSON.parse(h14Raw.replace(/^\uFEFF/, ''));
  const wpr = JSON.parse(wprRaw.replace(/^\uFEFF/, ''));
  const a10 = JSON.parse(a10Raw.replace(/^\uFEFF/, ''));

  const origin = String(args.origin || contract.productionOrigin).replace(/\/$/, '');
  if (!/^https:\/\//i.test(origin) && !/^http:\/\/127\.0\.0\.1(?::\d+)?$/i.test(origin) && !/^http:\/\/localhost(?::\d+)?$/i.test(origin)) {
    throw new Error(`Origin must be HTTPS production or localhost test origin: ${origin}`);
  }

  const head = gitHead();
  const candidateSha = args['candidate-sha'] || head;
  if (!isFullSha(candidateSha)) throw new Error('A full 40-character --candidate-sha is required when git HEAD cannot be resolved.');
  if (head && args['candidate-sha'] && candidateSha !== head) {
    console.warn(`WARNING: supplied production candidate ${candidateSha} differs from local git HEAD ${head}. Use only when POC-A2 has reconciled the deployed candidate.`);
  }

  const authorityCriteria = h14.criteria.map(item => item.code);
  if (JSON.stringify(authorityCriteria) !== JSON.stringify(contract.criteria)) throw new Error('A11 criteria drift from BFR-H14 authority.');
  if (JSON.stringify(wpr.rules.productionRevalidationViewports) !== JSON.stringify(contract.matrix.viewports)) throw new Error('A11 viewport scope drift from WPR-W27/PDS accessibility authority.');
  if (JSON.stringify(wpr.rules.locales) !== JSON.stringify(contract.matrix.locales)) throw new Error('A11 locale scope drift from WPR-W27/PDS accessibility authority.');
  if (JSON.stringify(a10.matrix.surfaceFamilies) !== JSON.stringify(contract.matrix.surfaceFamilies)) throw new Error('A11 surface-family scope drift from accepted A10 representative set.');

  const expectedCount = contract.matrix.viewports.length * contract.matrix.locales.length * contract.matrix.surfaceFamilies.length;
  if (expectedCount !== 78 || contract.matrix.requiredStateCount !== 78) throw new Error(`A11 matrix must be exactly 78 states; found ${expectedCount}.`);
  const representatives = new Map(a10.representativeSurfaces.map(item => [item.surfaceFamily, item]));
  for (const family of contract.matrix.surfaceFamilies) if (!representatives.has(family)) throw new Error(`Missing representative surface: ${family}`);

  const browser = resolveBrowser(args.browser);
  const settleMs = Number(args['settle-ms'] || contract.execution.defaultSettleMs || 700);
  const maxTabSteps = Number(args['tab-steps'] || contract.execution.keyboardTraversalMaxSteps || 18);
  const screenshots = Boolean(args.screenshots);
  const screenshotDir = args['screenshot-dir'] || '.tmp/poc-a11-accessibility-failures';
  const port = await freePort();
  const profileDir = await fs.mkdtemp(path.join(os.tmpdir(), 'phios-poc-a11-'));

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
  console.log('POC-A11 | LIVE ACCESSIBILITY REVALIDATION');
  console.log(`Candidate: ${candidateSha}`);
  console.log(`Origin:    ${origin}`);
  console.log(`Browser:   ${browser}`);
  console.log(`States:    ${expectedCount} (3 PDS viewports × 2 locales × 13 surface families)`);
  console.log(`Criteria:  ${contract.criteria.length} BFR-H14 criteria per state, conditional criteria explicit`);
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
    await Promise.all([client.send('Page.enable'), client.send('Runtime.enable'), client.send('Network.enable')]);

    let completed = 0;
    for (const family of contract.matrix.surfaceFamilies) {
      const representative = representatives.get(family);
      for (const locale of contract.matrix.locales) {
        for (const viewport of contract.matrix.viewports) {
          completed += 1;
          const height = Number(contract.execution.viewportHeightsByWidth[String(viewport)] || 900);
          const routeWithLocale = addLocale(representative.route, locale);
          const url = new URL(routeWithLocale, origin).toString();
          const consoleErrors = [];
          const exceptions = [];
          let documentStatus = null;
          let loaderId = null;

          const offConsole = client.on('Runtime.consoleAPICalled', params => {
            if (params.type === 'error') consoleErrors.push((params.args || []).map(arg => arg.value ?? arg.description ?? '').join(' ').slice(0, 500));
          });
          const offException = client.on('Runtime.exceptionThrown', params => {
            exceptions.push(params.exceptionDetails?.text || params.exceptionDetails?.exception?.description || 'Uncaught exception');
          });
          const offResponse = client.on('Network.responseReceived', params => {
            if (params.type === 'Document' && (!loaderId || params.loaderId === loaderId)) documentStatus = params.response?.status ?? documentStatus;
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
            await client.send('Emulation.setTouchEmulationEnabled', { enabled: viewport <= 768, maxTouchPoints: viewport <= 768 ? 5 : 1 });
            await client.send('Emulation.setEmulatedMedia', { media: '', features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });

            const loadPromise = client.once('Page.loadEventFired', 25000);
            const navigation = await client.send('Page.navigate', { url });
            loaderId = navigation.loaderId || null;
            if (navigation.errorText) throw new Error(`Navigation failed: ${navigation.errorText}`);
            await loadPromise;
            await sleep(settleMs);

            const metrics = await evaluateFunction(client, browserAccessibilityEvaluation, [{
              expectedLocale: locale,
              expectedSelector: representative.expectedSelector,
              surfaceFamily: family,
              touchTargetMinimumCssPx: contract.execution.touchTargetMinimumCssPx,
              contrast: contract.execution.contrast
            }]);
            if (!metrics) throw new Error('Browser accessibility evaluation returned no metrics.');

            const traversal = await keyboardTraversal(client, maxTabSteps);
            mergeKeyboardCriteria(metrics.criteria, traversal, metrics.interactive.keyboardFocusable);

            const invalidOutcomes = Object.entries(metrics.criteria)
              .filter(([, criterion]) => !contract.acceptanceGate.allowedCriterionOutcomes.includes(criterion.status))
              .map(([code]) => code);
            const responseStatus = documentStatus;
            const selectorPass = metrics.document.selectorResolved === true;
            const httpPass = responseStatus === 200 || responseStatus === null;
            const readyPass = metrics.document.readyState === 'complete';
            const langPass = metrics.document.lang === locale;
            const statePass = invalidOutcomes.length === 0 && selectorPass && httpPass && readyPass && langPass;

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
              criteria: metrics.criteria,
              keyboardTraversal: traversal,
              consoleErrors: consoleErrors.slice(0, 10),
              uncaughtExceptions: exceptions.slice(0, 10),
              result: statePass ? 'PASS' : 'FAIL',
              failures: [
                ...invalidOutcomes,
                ...(selectorPass ? [] : ['REPRESENTATIVE_SELECTOR_MISSING']),
                ...(httpPass ? [] : [`DOCUMENT_HTTP_${responseStatus}`]),
                ...(readyPass ? [] : ['DOCUMENT_NOT_COMPLETE']),
                ...(langPass ? [] : [`DOCUMENT_LANG_${metrics.document.lang || 'EMPTY'}_EXPECTED_${locale}`])
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
            console.log(`[${String(completed).padStart(3, '0')}/78] ${statePass ? 'PASS' : 'FAIL'} | ${family} | ${locale} | ${viewport}px${record.failures.length ? ` | ${record.failures.join(', ')}` : ''}`);
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
            console.log(`[${String(completed).padStart(3, '0')}/78] FAIL | ${family} | ${locale} | ${viewport}px | RUNNER_STATE_ERROR: ${error.message}`);
          } finally {
            offConsole(); offException(); offResponse();
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

  const authorityFiles = Object.fromEntries(await Promise.all(Object.entries(contract.authority).map(async ([key, ref]) => {
    if (!ref.path) return [key, null];
    const raw = await fs.readFile(ref.path, 'utf8');
    return [key, sha256(raw)];
  })));

  const summaryByCriterion = Object.fromEntries(contract.criteria.map(code => {
    let pass = 0; let na = 0; let failCount = 0;
    for (const state of stateResults) {
      const c = state.criteria?.[code];
      if (!c) continue;
      if (c.status === 'PASS') pass += 1;
      else if (c.status === 'NOT_APPLICABLE') na += 1;
      else failCount += 1;
    }
    return [code, { pass, notApplicable: na, fail: failCount }];
  }));

  const evidence = {
    schemaVersion: 'PHI-OS-POC-A11-LIVE-ACCESSIBILITY-EVIDENCE-v1.0.0',
    work: 'POC-A11',
    status: failed || stateResults.length !== 78 ? 'LIVE_BROWSER_ACCESSIBILITY_REVALIDATION_FAILED' : 'LIVE_BROWSER_ACCESSIBILITY_REVALIDATION_PASSED',
    candidateCommit: candidateSha,
    productionOrigin: origin,
    deploymentShaReconciliation: 'OUT_OF_SCOPE_REQUIRES_POC_A2_EXACT_DEPLOYMENT_EVIDENCE',
    startedAt,
    finishedAt,
    browser: {
      executable: browser,
      version: browserVersion,
      headless: !args.headed,
      protocol: 'CHROME_DEVTOOLS_PROTOCOL',
      emulatedMedia: { prefersReducedMotion: 'reduce' }
    },
    authorityDigests: { contract: sha256(contractRaw), ...authorityFiles },
    matrix: {
      viewports: contract.matrix.viewports,
      locales: contract.matrix.locales,
      surfaceFamilies: contract.matrix.surfaceFamilies,
      requiredStateCount: 78,
      executedStateCount: stateResults.length,
      passedStateCount: passedCount,
      failedStateCount: failedCount
    },
    criteriaCodes: contract.criteria,
    allowedCriterionOutcomes: contract.acceptanceGate.allowedCriterionOutcomes,
    results: stateResults,
    summaryBySurfaceFamily: Object.fromEntries(contract.matrix.surfaceFamilies.map(family => {
      const rows = stateResults.filter(item => item.surfaceFamily === family);
      return [family, { total: rows.length, passed: rows.filter(item => item.result === 'PASS').length, failed: rows.filter(item => item.result !== 'PASS').length }];
    })),
    summaryByCriterion,
    interpretationBoundary: {
      machineBrowserAccessibilityAcceptanceOnly: true,
      wcagConformanceCertification: false,
      screenReaderHumanAcceptance: false,
      assistiveTechnologyHumanAcceptance: false,
      humanVisualContrastAcceptance: false,
      pageCompletionAccepted: false,
      surfaceCompletionAccepted: false,
      contentCompletionAccepted: false,
      featureCompletionAccepted: false,
      productionStatePromoted: false,
      deploymentShaAccepted: false,
      customDomainAccepted: false,
      globalProductionAccepted: false
    }
  };

  await fs.mkdir(path.dirname(EVIDENCE_PATH), { recursive: true });
  const evidenceRaw = JSON.stringify(evidence, null, 2) + '\n';
  await fs.writeFile(EVIDENCE_PATH, evidenceRaw, 'utf8');

  if (!failed && stateResults.length === 78 && passedCount === 78) {
    const acceptance = {
      schemaVersion: 'PHI-OS-POC-A11-LIVE-ACCESSIBILITY-ACCEPTANCE-v1.0.0',
      work: 'POC-A11',
      status: 'LIVE_ACCESSIBILITY_78_STATE_MATRIX_ACCEPTED_MACHINE_BROWSER_SCOPE',
      accepted: true,
      candidateCommit: candidateSha,
      productionOrigin: origin,
      evidence: {
        path: EVIDENCE_PATH,
        sha256: sha256(evidenceRaw),
        executedStateCount: 78,
        passedStateCount: 78,
        failedStateCount: 0
      },
      criteria: {
        bfrH14RequiredCriteria: contract.criteria,
        allowedOutcomes: contract.acceptanceGate.allowedCriterionOutcomes,
        allStatesAccepted: true,
        summaryByCriterion
      },
      historicalAuthority: {
        bfrH14Path: contract.authority.bfrH14AccessibilityCriteria.path,
        bfrH14Rewritten: false,
        pdsAccessibilityAuthorityRewritten: false,
        cprAccessibilityAuthorityRewritten: false,
        a10AcceptanceRewritten: false,
        surfaceReadinessBoundaryRewritten: false
      },
      interpretationBoundary: { ...contract.interpretationBoundary }
    };
    await fs.mkdir(path.dirname(ACCEPTANCE_PATH), { recursive: true });
    await fs.writeFile(ACCEPTANCE_PATH, JSON.stringify(acceptance, null, 2) + '\n', 'utf8');
  } else {
    await fs.rm(ACCEPTANCE_PATH, { force: true });
  }

  console.log('');
  console.log('POC-A11 SUMMARY');
  console.log(`Executed: ${stateResults.length}/78`);
  console.log(`Passed:   ${passedCount}/78`);
  console.log(`Failed:   ${failedCount}/78`);
  console.log(`Evidence: ${EVIDENCE_PATH}`);
  if (!failed && passedCount === 78) {
    console.log(`Acceptance: ${ACCEPTANCE_PATH}`);
    console.log('✓ POC-A11 Live Accessibility passed 78/78 production browser states in machine-browser scope.');
    console.log('  This is not WCAG certification, screen-reader human acceptance, page completion, or global production acceptance.');
  } else {
    console.log('✗ POC-A11 remains open. Fix failures and rerun; no acceptance artifact was emitted.');
    if (browserStderr.trim()) console.log(`Browser stderr tail: ${browserStderr.trim().slice(-1200)}`);
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error(`POC-A11 runner failed: ${error.stack || error.message}`);
  process.exitCode = 1;
});
