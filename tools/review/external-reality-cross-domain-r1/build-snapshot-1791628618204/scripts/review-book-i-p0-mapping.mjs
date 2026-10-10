import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  REQUIRED_MAPPING_REVIEW_CHECKS,
  T08_SCHEMA_VERSION,
  applyP0NodeMappingReview,
  reviewP0NodeMapping
} from './lib/knowledge-manuscripts/p0-mapping-review.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const coded = (code, details = null) => Object.assign(new Error(code), { code, details });

export function parseP0MappingReviewArgs(command, args) {
  if (command === 'review') {
    let mode = 'dry-run';
    let explicit = null;
    for (const argument of args) {
      if (!['--dry-run', '--prepare'].includes(argument)) {
        throw coded('P0_MAPPING_REVIEW_ARGUMENT_UNKNOWN', { argument });
      }
      if (explicit && explicit !== argument) throw coded('P0_MAPPING_REVIEW_MODE_CONFLICT');
      explicit = argument;
      mode = argument === '--prepare' ? 'prepare' : 'dry-run';
    }
    return { command, mode };
  }
  if (command === 'apply') {
    let mode = 'dry-run';
    let explicit = null;
    for (const argument of args) {
      if (!['--dry-run', '--apply'].includes(argument)) {
        throw coded('P0_MAPPING_APPLY_ARGUMENT_UNKNOWN', { argument });
      }
      if (explicit && explicit !== argument) throw coded('P0_MAPPING_APPLY_MODE_CONFLICT');
      explicit = argument;
      mode = argument === '--apply' ? 'apply' : 'dry-run';
    }
    return { command, mode };
  }
  throw coded('P0_MAPPING_REVIEW_COMMAND_REQUIRED', { allowed: ['review', 'apply'] });
}

export function runP0MappingReviewCommand(command, args = [], options = {}) {
  const parsed = parseP0MappingReviewArgs(command, args);
  if (parsed.command === 'review') {
    return reviewP0NodeMapping({
      root: options.root || ROOT,
      mode: parsed.mode,
      now: options.now
    });
  }
  return applyP0NodeMappingReview({
    root: options.root || ROOT,
    mode: parsed.mode,
    now: options.now
  });
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  try {
    console.log(JSON.stringify(runP0MappingReviewCommand(command, args), null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      schemaVersion: T08_SCHEMA_VERSION,
      stage: 'KNR-W2R1-T08',
      command: command || null,
      status: 'blocked',
      code: error.code || 'P0_MAPPING_REVIEW_FAILED',
      details: error.details || null,
      requiredReviewChecks: REQUIRED_MAPPING_REVIEW_CHECKS,
      writes: 0,
      mappingWrites: 0,
      productionModified: false,
      remoteRequestPerformed: false,
      credentialsRequired: false
    }, null, 2));
    process.exitCode = 2;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
