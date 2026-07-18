import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import en from '../assets/js/locales/en.js';
import zhHans from '../assets/js/locales/zh-Hans.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ignoredDirectories = new Set(['.git', 'node_modules']);

function flatten(value, prefix = '', output = new Set()) {
  for (const [key, child] of Object.entries(value || {})) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof child === 'string') output.add(fullKey);
    else if (child && typeof child === 'object' && !Array.isArray(child)) flatten(child, fullKey, output);
  }
  return output;
}

async function walk(directory) {
  const output = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walk(absolute));
    else output.push(absolute);
  }
  return output;
}

function collectMatches(source, expression) {
  const keys = [];
  for (const match of source.matchAll(expression)) keys.push(match[2] || match[1]);
  return keys.filter(Boolean);
}

function collectTranslationMapKeys(source) {
  const keys = [];
  const maps = source.matchAll(
    /const\s+\w*TRANSLATION_KEYS\w*\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\);/g
  );
  for (const map of maps) {
    keys.push(...collectMatches(map[1], /:\s*(["'])([^"']+)\1/g));
  }
  return keys;
}

const enKeys = flatten(en);
const zhKeys = flatten(zhHans);
const errors = [];

for (const key of enKeys) if (!zhKeys.has(key)) errors.push(`Missing in zh-Hans: ${key}`);
for (const key of zhKeys) if (!enKeys.has(key)) errors.push(`Missing in en: ${key}`);

const files = await walk(root);
for (const file of files) {
  const relative = path.relative(root, file).replaceAll(path.sep, '/');
  const extension = path.extname(file);
  if (extension !== '.html' && extension !== '.js') continue;
  if (relative.startsWith('assets/js/locales/')) continue;

  const source = await fs.readFile(file, 'utf8');
  const keys = extension === '.html'
    ? collectMatches(source, /data-i18n(?:-[\w-]+)?\s*=\s*(["'])([^"']+)\1/g)
    : [
        ...collectMatches(source, /\bt\(\s*(["'])([^"']+)\1/g),
        ...collectTranslationMapKeys(source)
      ];

  for (const key of new Set(keys)) {
    if (!enKeys.has(key)) errors.push(`${relative}: missing translation key ${key}`);
  }
}

if (errors.length) {
  console.error(`PHI OS i18n check failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`PHI OS i18n OK (${enKeys.size} aligned keys; HTML and JavaScript references verified).`);
