
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadUniversalManuscriptRuntime } from './lib/knowledge-manuscripts/universal-manuscript-runtime.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const command = process.argv[2] || 'status';
const runtime = loadUniversalManuscriptRuntime(ROOT);

if (command === 'verify') {
  console.log(JSON.stringify({ status:'passed', manuscripts:runtime.manifests.size, nodes:runtime.nodeMap.size, profiles:runtime.profileMap.size }, null, 2));
} else if (command === 'inventory') {
  console.log(JSON.stringify([...runtime.inventories.entries()].map(([manuscriptCode, inventory]) => ({ manuscriptCode, sections:inventory.sections.length })), null, 2));
} else if (command === 'extract') {
  console.log(JSON.stringify({ status:'candidate_only', writes:0, humanReviewRequired:true }, null, 2));
} else if (command === 'review') {
  console.log(JSON.stringify({ status:'human_review_required', automaticApprovalAllowed:false }, null, 2));
} else if (command === 'map') {
  console.log(JSON.stringify({ candidates:runtime.candidateRegistry.candidates.length, approved:runtime.approvedRegistry.mappings.length, automaticApprovalAllowed:false }, null, 2));
} else if (command === 'status') {
  console.log(JSON.stringify({ stage:'KH-W4H', manuscripts:runtime.manifests.size, sections:[...runtime.inventories.values()].reduce((n,v)=>n+v.sections.length,0), candidates:runtime.candidateRegistry.candidates.length, approvedMappings:runtime.approvedRegistry.mappings.length }, null, 2));
} else {
  console.error(JSON.stringify({ status:'blocked', code:'MANUSCRIPT_COMMAND_UNKNOWN', command }, null, 2));
  process.exitCode = 2;
}
