import { writeReleasePhase } from './lib/visual-article-production/release-phases-v1.mjs';
for (const work of ['w26','w27','w28','w29']) { const out = await writeReleasePhase({ work }); console.log(JSON.stringify({ work: out.record.work, status: out.record.status, output: out.path })); }
