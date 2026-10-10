import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  MAPPING_CANDIDATE_SCHEMA_VERSION,
  generatePartMappingCandidates
} from './lib/knowledge-manuscripts/part-mapping-candidate-generation.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const coded = (code, details = null) => Object.assign(new Error(code), { code, details });

export function parsePartMappingCandidateArgs(args) {
  let partCode = null;
  let mode = 'dry-run';
  let explicitMode = null;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--dry-run' || argument === '--apply') {
      if (explicitMode && explicitMode !== argument) throw coded('PART_MAPPING_CANDIDATE_MODE_CONFLICT');
      explicitMode = argument;
      mode = argument === '--apply' ? 'apply' : 'dry-run';
      continue;
    }
    if (argument === '--part' || argument.startsWith('--part=')) {
      if (partCode) throw coded('PART_MAPPING_CANDIDATE_PART_DUPLICATE');
      const value = argument.includes('=') ? argument.slice(argument.indexOf('=') + 1) : args[++index];
      if (!value) throw coded('PART_MAPPING_CANDIDATE_PART_REQUIRED');
      partCode = value.toUpperCase();
      continue;
    }
    throw coded('PART_MAPPING_CANDIDATE_ARGUMENT_UNKNOWN', { argument });
  }
  if (!partCode) throw coded('PART_MAPPING_CANDIDATE_PART_REQUIRED');
  return { partCode, mode };
}

export function runPartMappingCandidateCommand(args = process.argv.slice(2), options = {}) {
  const parsed = parsePartMappingCandidateArgs(args);
  return generatePartMappingCandidates({
    root: options.root || ROOT,
    partCode: parsed.partCode,
    mode: parsed.mode
  });
}

async function main() {
  try {
    console.log(JSON.stringify(runPartMappingCandidateCommand(), null, 2));
  } catch (error) {
    console.error(JSON.stringify({
      schemaVersion: MAPPING_CANDIDATE_SCHEMA_VERSION,
      stage: 'KNR-W2R1-T09',
      command: 'generate-part-mapping-candidates',
      status: 'blocked',
      code: error.code || 'PART_MAPPING_CANDIDATE_GENERATION_FAILED',
      details: error.details || null,
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
