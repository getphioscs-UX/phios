import fs from 'node:fs';
const names={registry:'bazi-section-registry',familyRegistry:'report-page-families',visualAssets:'bazi-visual-assets'};
const output='// Generated from config/reports/*.json by scripts/sync-report-section-config.mjs.\n// Browser and Pages Functions share this data; JSON files remain canonical.\n'+Object.entries(names).map(([key,file])=>`export const ${key} = ${JSON.stringify(JSON.parse(fs.readFileSync(`config/reports/${file}.json`)),null,2)};\n`).join('\n');
const target='functions/canonical-presentation-runtime/report-section-config.generated.js';
if(process.argv.includes('--check')){if(fs.readFileSync(target,'utf8')!==output)throw Error('REPORT_SECTION_CONFIG_STALE');}else fs.writeFileSync(target,output);
