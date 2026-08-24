import fs from 'node:fs';
import path from 'node:path';

export const root = process.cwd();
export const base = 'content/customer-experience-rebuild';

export function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

export function walk(dir, accept = () => true) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  const stack = [abs];
  while (stack.length) {
    const current = stack.pop();
    for (const ent of fs.readdirSync(current, { withFileTypes: true })) {
      const p = path.join(current, ent.name);
      if (ent.isDirectory()) stack.push(p);
      else {
        const rel = path.relative(root, p).replaceAll(path.sep, '/');
        if (accept(rel)) out.push(rel);
      }
    }
  }
  return out.sort();
}

export function cxHtmlSurfaces() {
  return walk('.', (rel) => rel.endsWith('.html') && !rel.startsWith('node_modules/'))
    .filter((rel) => fs.readFileSync(path.join(root, rel), 'utf8').includes('data-cx-surface'));
}

export function customerUiSourceFiles() {
  return walk('assets/customer-ui', (rel) => /\.(?:html|css|js|mjs)$/.test(rel));
}

export function cxImplementationFiles() {
  return [...new Set([...cxHtmlSurfaces(), ...customerUiSourceFiles()])].sort();
}

export function normalizedLocalAsset(ref) {
  const bare = String(ref || '').split('#', 1)[0].split('?', 1)[0].trim();
  if (!bare || /^https?:\/\//i.test(bare) || bare.startsWith('//') || bare.startsWith('data:')) return null;
  return bare.replace(/^\.\//, '').replace(/^\//, '');
}

export function stylesheetRefs(html) {
  const refs = [];
  for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
    if (!/\brel\s*=\s*["']stylesheet["']/i.test(tag)) continue;
    const m = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i);
    if (m) refs.push(m[1]);
  }
  return refs;
}

export function legacyNamespaceHits(text, prefixes) {
  return prefixes.filter((prefix) => {
    const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:^|[^A-Za-z0-9_-])${escaped}`).test(text);
  });
}

export function signatureHits(text, signatures) {
  return signatures.filter((sig) => sig.forbiddenOnCx && sig.requiredTokens.every((token) => text.includes(token)));
}
