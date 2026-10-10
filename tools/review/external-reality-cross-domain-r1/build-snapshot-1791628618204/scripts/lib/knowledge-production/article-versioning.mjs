import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  ARTICLE_PACKAGE_FILES,
  ARTICLE_PACKAGE_ROOT,
  slugifyCode
} from './article-package.mjs';
import { ProductionError } from './production-errors.mjs';

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

function compareVersions(left, right) {
  const a = left.split('.').map(Number);
  const b = right.split('.').map(Number);
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return 0;
}

function bumpPatch(version) {
  const match = version.match(SEMVER);
  if (!match) return '1.0.0';
  return `${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
}

export function articleLocaleDirectory(
  root,
  nodeCode,
  locale,
  outputRoot = ARTICLE_PACKAGE_ROOT
) {
  return path.join(root, outputRoot, slugifyCode(nodeCode), locale);
}

export async function listArticleVersions(localeDirectory) {
  let entries = [];
  try {
    entries = await fs.readdir(localeDirectory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  return entries
    .filter(entry => entry.isDirectory() && SEMVER.test(entry.name))
    .map(entry => entry.name)
    .sort(compareVersions);
}

async function readManifest(directory) {
  try {
    return JSON.parse(
      await fs.readFile(path.join(directory, 'package-manifest.json'), 'utf8')
    );
  } catch {
    throw new ProductionError(
      'ARTICLE_PACKAGE_INVALID',
      `Existing Article Package Manifest is invalid: ${directory}.`
    );
  }
}

async function readArticle(directory) {
  try {
    return JSON.parse(
      await fs.readFile(path.join(directory, 'article.json'), 'utf8')
    );
  } catch {
    throw new ProductionError(
      'ARTICLE_PACKAGE_INVALID',
      `Existing Article Draft is invalid: ${directory}.`
    );
  }
}

export async function resolveArticleVersion({
  root,
  nodeCode,
  locale,
  productionBriefHash,
  outputRoot = ARTICLE_PACKAGE_ROOT
}) {
  const localeDirectory = articleLocaleDirectory(
    root,
    nodeCode,
    locale,
    outputRoot
  );
  const versions = await listArticleVersions(localeDirectory);
  if (!versions.length) {
    return {
      articleVersion: '1.0.0',
      localeDirectory,
      targetDirectory: path.join(localeDirectory, '1.0.0'),
      existingSameInput: false
    };
  }
  const latest = versions.at(-1);
  const latestDirectory = path.join(localeDirectory, latest);
  const manifest = await readManifest(latestDirectory);
  if (manifest.productionBriefHash === productionBriefHash) {
    return {
      articleVersion: latest,
      localeDirectory,
      targetDirectory: latestDirectory,
      existingSameInput: true,
      existingManifest: manifest,
      existingArticle: await readArticle(latestDirectory)
    };
  }
  const next = bumpPatch(latest);
  return {
    articleVersion: next,
    localeDirectory,
    targetDirectory: path.join(localeDirectory, next),
    existingSameInput: false,
    priorVersion: latest
  };
}

export async function writeArticlePackage(target, files, {
  force = false,
  existingSameInput = false,
  existingArticle = null
} = {}) {
  if (files.size !== ARTICLE_PACKAGE_FILES.length ||
    ARTICLE_PACKAGE_FILES.some(file => !files.has(file))) {
    throw new ProductionError(
      'ARTICLE_PACKAGE_INVALID',
      'Generated Article Package file set is incomplete.'
    );
  }
  const exists = await fs.access(target).then(() => true, () => false);
  if (exists && !existingSameInput) {
    throw new ProductionError(
      'ARTICLE_DRAFT_ALREADY_EXISTS',
      `Article Package already exists: ${target}.`
    );
  }
  if (exists && !force) {
    throw new ProductionError(
      'ARTICLE_DRAFT_ALREADY_EXISTS',
      'The same Production Brief already has a Draft Package.',
      'Use --force only for an intentional deterministic rebuild of a not_reviewed Draft.'
    );
  }
  if (
    exists &&
    existingArticle?.reviewState !== 'not_reviewed'
  ) {
    throw new ProductionError(
      'ARTICLE_REVIEWED_DRAFT_PROTECTED',
      'A reviewed or in-review Article Draft cannot be overwritten.'
    );
  }
  const parent = path.dirname(target);
  const staging = path.join(parent, `.pja-w2f-b2-${randomUUID()}.staging`);
  const backup = path.join(parent, `.pja-w2f-b2-${randomUUID()}.backup`);
  let backupCreated = false;
  let targetCreated = false;
  try {
    await fs.mkdir(parent, { recursive: true });
    await fs.mkdir(staging);
    for (const file of ARTICLE_PACKAGE_FILES) {
      await fs.writeFile(path.join(staging, file), files.get(file), {
        flag: 'wx'
      });
    }
    if (exists) {
      await fs.rename(target, backup);
      backupCreated = true;
    }
    await fs.rename(staging, target);
    targetCreated = true;
    if (backupCreated) {
      await fs.rm(backup, { recursive: true, force: true });
      backupCreated = false;
    }
  } catch (error) {
    if (targetCreated) {
      await fs.rm(target, { recursive: true, force: true });
      targetCreated = false;
    }
    if (backupCreated) {
      await fs.rename(backup, target);
      backupCreated = false;
    }
    if (error instanceof ProductionError) throw error;
    throw new ProductionError(
      'ARTICLE_PACKAGE_WRITE_FAILED',
      'Atomic Article Package creation failed.',
      null,
      error.message
    );
  } finally {
    await fs.rm(staging, { recursive: true, force: true });
    if (backupCreated) await fs.rm(backup, { recursive: true, force: true });
  }
}

export async function latestArticlePackage(
  root,
  nodeCode,
  locale,
  outputRoot = ARTICLE_PACKAGE_ROOT
) {
  const localeDirectory = articleLocaleDirectory(
    root,
    nodeCode,
    locale,
    outputRoot
  );
  const versions = await listArticleVersions(localeDirectory);
  if (!versions.length) return null;
  return path.join(localeDirectory, versions.at(-1));
}

