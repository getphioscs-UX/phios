import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { loadBookIManifest } from './book-i-manuscript.mjs';
import {
  EXTRACTION_TOOL_SCHEMA_VERSION,
  extractP5Candidate
} from './lib/knowledge-manuscripts/p5-searchable-pdf-extraction.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function coded(code, details = null) {
  return Object.assign(new Error(code), { code, details });
}

function pageNumber(value, flag) {
  if (!/^[1-9][0-9]*$/u.test(String(value || ''))) {
    throw coded('P5_PAGE_OVERRIDE_INVALID', { flag });
  }
  return Number(value);
}

export function parseExtractionArgs(args) {
  let mode = 'dry-run';
  let explicitMode = null;
  const overrides = {};
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--dry-run' || argument === '--apply') {
      if (explicitMode && explicitMode !== argument) throw coded('P5_EXTRACTION_MODE_CONFLICT');
      explicitMode = argument;
      mode = argument === '--apply' ? 'apply' : 'dry-run';
      continue;
    }
    const equals = argument.match(/^(--start-page|--end-page)=(.+)$/u);
    const flag = equals?.[1] || argument;
    if (flag === '--start-page' || flag === '--end-page') {
      const value = equals?.[2] ?? args[++index];
      const key = flag === '--start-page' ? 'startPage' : 'endPage';
      if (overrides[key] !== undefined) throw coded('P5_PAGE_OVERRIDE_DUPLICATE', { flag });
      overrides[key] = pageNumber(value, flag);
      continue;
    }
    throw coded('P5_EXTRACTION_ARGUMENT_UNKNOWN', { argument });
  }
  if (overrides.startPage && overrides.endPage && overrides.endPage < overrides.startPage) {
    throw coded('P5_PAGE_OVERRIDE_ORDER_INVALID');
  }
  return { mode, overrides };
}

export async function runExtraction(args = process.argv.slice(2), options = {}) {
  const parsed = parseExtractionArgs(args);
  const manifest = options.manifest || loadBookIManifest();
  return extractP5Candidate({
    root: options.root || ROOT,
    manifest,
    mode: parsed.mode,
    overrides: parsed.overrides
  });
}

async function main() {
  try {
    console.log(JSON.stringify(await runExtraction(), null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      schemaVersion: EXTRACTION_TOOL_SCHEMA_VERSION,
      stage: 'KNR-W2R1-T09-P5',
      command: 'extract-p5',
      status: 'blocked',
      code: error.code || 'P5_EXTRACTION_FAILED',
      details: error.details || null,
      extractionMethod: 'searchable_pdf_text_layer',
      ocrUsed: false,
      writes: 0,
      r2UploadPerformed: false,
      productionModified: false
    }, null, 2));
    process.exitCode = 2;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
