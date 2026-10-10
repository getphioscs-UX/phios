import fs from 'node:fs';
import path from 'node:path';
import { createRuntimeReadingReportCandidate } from '../functions/runtime-reading/report-candidate-runtime.js';

const registry = JSON.parse(fs.readFileSync('content/products/runtime-reading/fixtures/runtime-reading-fixture-registry-v1.json','utf8'));
for (const fixture of registry.positiveFixtures) {
  const input = JSON.parse(fs.readFileSync(fixture.inputFile,'utf8'));
  const candidate = await createRuntimeReadingReportCandidate(input);
  fs.mkdirSync(path.dirname(fixture.expectedCandidateFile), { recursive:true });
  fs.writeFileSync(fixture.expectedCandidateFile, JSON.stringify(candidate,null,2)+'\n');
}
console.log(`Generated ${registry.positiveFixtures.length} RRP W26 golden candidates.`);
