import { addNode, completeWave, createWave, dashboard, generateWave, removeNode, waveStatus } from './lib/knowledge-production/wave-orchestration.mjs';

const args = process.argv.slice(2), command = args[0], waveCode = args[1], nodeCode = args[2] && !args[2].startsWith('--') ? args[2] : null, root = process.cwd(), apply = args.includes('--apply');
try {
  if (!waveCode) throw coded('WAVE_CODE_REQUIRED');
  let result;
  if (command === 'create') result = createWave(root, waveCode, { apply, bookCode: option('--book') || 'BOOK-I', language: option('--language') || 'zh-Hans', at: option('--at') });
  else if (command === 'add') { if (!nodeCode) throw coded('NODE_CODE_REQUIRED'); result = addNode(root, waveCode, nodeCode, { apply, at: option('--at') }); }
  else if (command === 'remove') { if (!nodeCode) throw coded('NODE_CODE_REQUIRED'); result = removeNode(root, waveCode, nodeCode, { apply, at: option('--at') }); }
  else if (command === 'status') result = waveStatus(root, waveCode);
  else if (command === 'generate') result = generateWave(root, waveCode, { apply, at: option('--at') });
  else if (command === 'dashboard') result = dashboard(root, waveCode);
  else if (command === 'complete') result = completeWave(root, waveCode, { apply, at: option('--at') });
  else throw coded('UNKNOWN_WAVE_COMMAND');
  if (command === 'dashboard') console.log(`${result.title}\n${result.progress}\nCandidate ${result.totals.candidate} · Review ${result.totals.review} · Blocked ${result.totals.blocked} · Figure Missing ${result.totals.figureMissing} · Ready ${result.totals.ready}`);
  console.log(JSON.stringify(result, null, 2));
} catch (error) { console.error(JSON.stringify({ command, waveCode, nodeCode, status: 'blocked', code: error.code || error.message, writes: 0, authorityWrites: 0, productionExportGenerated: false, published: false }, null, 2)); process.exit(2); }
function option(name) { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : null; }
function coded(code) { return Object.assign(new Error(code), { code }); }
