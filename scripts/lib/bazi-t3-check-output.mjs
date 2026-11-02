import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
export const BAZI_T3_QA_ENV='PHIOS_BAZI_T3_QA_OUTPUT_DIR';
export const BAZI_T3_GENERATED_PATHS=Object.freeze(['functions/personal-reading/narrative/bazi-t3-preview-packs.generated.json','functions/personal-reading/narrative/bazi-t3-preview-baseline.generated.json','docs/guided-report-successor-r2/bazi-t3/shadow-matrix.json']);
export function baziT3CheckPath(canonical){
 assert(BAZI_T3_GENERATED_PATHS.includes(canonical),'Unsupported T3 generated output');const output=process.env[BAZI_T3_QA_ENV];if(!output)return canonical;
 const root=path.resolve(output),temporary=path.resolve('.tmp');assert(root.startsWith(temporary+path.sep),'T3 check outputs must stay inside this workspace .tmp');return path.join(root,canonical);
}
// Preserve the original ordering contract: before generation, readers use the
// committed corpus; afterwards every reader sees the same fresh check corpus.
export function baziT3ReadPath(canonical){const current=baziT3CheckPath(canonical);if(process.env.PHIOS_BAZI_T3_QA_REQUIRE_CURRENT==='true')assert(fs.existsSync(current),'Current T3 check corpus has not been generated');return fs.existsSync(current)?current:canonical;}
export function assertBaziT3DeployedBaselineUnchanged(canonical,content){if(process.env[BAZI_T3_QA_ENV]&&canonical===BAZI_T3_GENERATED_PATHS[1])assert.equal(fs.readFileSync(canonical,'utf8'),content,'Deployed baseline changed; an explicit Owner-approved regeneration is required, not a check-time source rewrite');}
