import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  REQUIRED_REVIEW_CHECKS,
  T05_SCHEMA_VERSION,
  reviewP5Candidate,
  uploadApprovedP5
} from './lib/knowledge-manuscripts/p5-human-review.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const coded = (code, details = null) => Object.assign(new Error(code), { code, details });

function takeValue(args, index, flag) {
  const argument = args[index];
  const prefix = `${flag}=`;
  if (argument.startsWith(prefix)) return { value: argument.slice(prefix.length), consumed: 0 };
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw coded('P5_REVIEW_ARGUMENT_VALUE_REQUIRED', { flag });
  return { value, consumed: 1 };
}

export function parseP5ReviewArgs(command, args) {
  if (command === 'review') {
    let mode = 'dry-run';
    let explicitMode = null;
    let expectedSha256 = null;
    let reviewerRole = null;
    let confirmations = [];
    for (let index = 0; index < args.length; index += 1) {
      const argument = args[index];
      if (argument === '--dry-run' || argument === '--approve') {
        if (explicitMode && explicitMode !== argument) throw coded('P5_REVIEW_MODE_CONFLICT');
        explicitMode = argument;
        mode = argument === '--approve' ? 'approve' : 'dry-run';
        continue;
      }
      const flag = ['--candidate-sha256', '--reviewer-role', '--confirm']
        .find(item => argument === item || argument.startsWith(`${item}=`));
      if (!flag) throw coded('P5_REVIEW_ARGUMENT_UNKNOWN', { argument });
      const { value, consumed } = takeValue(args, index, flag);
      index += consumed;
      if (flag === '--candidate-sha256') expectedSha256 = value.trim().toLowerCase();
      if (flag === '--reviewer-role') reviewerRole = value.trim();
      if (flag === '--confirm') confirmations = value.split(',').map(item => item.trim()).filter(Boolean);
    }
    if (mode === 'dry-run' && (expectedSha256 || reviewerRole || confirmations.length)) {
      throw coded('P5_REVIEW_APPROVAL_ARGUMENTS_REQUIRE_APPROVE');
    }
    return { command, mode, expectedSha256, reviewerRole, confirmations };
  }

  if (command === 'upload') {
    let mode = 'dry-run';
    let explicitMode = null;
    for (const argument of args) {
      if (!['--dry-run', '--apply'].includes(argument)) {
        throw coded('P5_UPLOAD_ARGUMENT_UNKNOWN', { argument });
      }
      if (explicitMode && explicitMode !== argument) throw coded('P5_UPLOAD_MODE_CONFLICT');
      explicitMode = argument;
      mode = argument === '--apply' ? 'apply' : 'dry-run';
    }
    return { command, mode };
  }
  throw coded('P5_REVIEW_COMMAND_REQUIRED', { allowed: ['review', 'upload'] });
}

export async function runP5ReviewCommand(command, args = [], options = {}) {
  const parsed = parseP5ReviewArgs(command, args);
  if (command === 'review') {
    return reviewP5Candidate({
      root: options.root || ROOT,
      mode: parsed.mode,
      expectedSha256: parsed.expectedSha256,
      reviewerRole: parsed.reviewerRole,
      confirmations: parsed.confirmations,
      now: options.now
    });
  }
  return uploadApprovedP5({
    root: options.root || ROOT,
    mode: parsed.mode,
    env: options.env || process.env,
    clientFactory: options.clientFactory,
    now: options.now
  });
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  try {
    console.log(JSON.stringify(await runP5ReviewCommand(command, args), null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      schemaVersion: T05_SCHEMA_VERSION,
      stage: 'KNR-W2R1-T09-P5',
      command: command || null,
      status: 'blocked',
      code: error.code || 'P5_HUMAN_REVIEW_FAILED',
      details: error.details || null,
      requiredReviewChecks: REQUIRED_REVIEW_CHECKS,
      writes: 0,
      manifestWrites: 0,
      r2UploadPerformed: false,
      productionModified: false,
      credentialsPersisted: false
    }, null, 2));
    process.exitCode = 2;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
