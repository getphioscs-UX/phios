import fs from 'node:fs';import assert from 'node:assert/strict';
const wt='C:/phios/.worktrees/final-unified-production-r1',root='C:/phios';
function edit(p,a,b){const f=wt+'/'+p,s=fs.readFileSync(f,'utf8');assert.equal(s.split(a).length,2,p);fs.writeFileSync(f,s.replace(a,b));}
edit('assets/js/pages/civilization-atlas/world-question-outcome.js','observations=[],sourceUnavailable=false}={})','observations=[],sourceUnavailable=false,historicalRecords=undefined}={})');
edit('assets/js/pages/civilization-atlas/world-question-outcome.js','period:ctx.requestedPeriod,locale:ctx.locale});const ids=','period:ctx.requestedPeriod,locale:ctx.locale,records:historicalRecords});const ids=');
// Preserve the original no-source negative assertion with an explicit empty
// source fixture. The separate current-source campaign requires real bindings.
edit('scripts/check-world-question-outcome-r2.mjs',"test(value+' not generic history as answer',()=>assert.equal(worldQuestionEvidence(c,{cases,readings}).answerState,'NO_MATCHING_SOURCE'))","test(value+' no invented history with empty source bindings',()=>assert.equal(worldQuestionEvidence(c,{cases,readings,historicalRecords:[]}).answerState,'NO_MATCHING_SOURCE'))");
let history=fs.readFileSync(root+'/tools/review/country-history-closure-r1/check-history.mjs','utf8');
history=history.replace("const root='C:/phios/.worktrees/country-history-closure-r1',qa='C:/phios/tools/review/country-history-closure-r1';","const root=process.cwd(),qa=process.env.PHIOS_HISTORY_QA_DIR;");
history=history.replace("fs.writeFileSync(qa+'/TARGETED-TESTS.json',JSON.stringify(result,null,2));","if(qa)fs.writeFileSync(qa+'/TARGETED-TESTS.json',JSON.stringify(result,null,2));");
assert(!history.includes("root='C:/phios/.worktrees"));fs.writeFileSync(wt+'/scripts/check-country-history-coverage-r1.mjs',history);
const packagePath=wt+'/package.json',commandsPath=wt+'/config/reports/zero-cost-check-commands.json',pkg=JSON.parse(fs.readFileSync(packagePath)),commands=JSON.parse(fs.readFileSync(commandsPath));
for(const [key,file]of [['check:final-unified-release-r1','scripts/check-final-unified-release-r1.mjs'],['check:country-history-coverage-r1','scripts/check-country-history-coverage-r1.mjs']]){assert(!commands[key]);commands[key]='node --no-warnings '+file;pkg.scripts[key]='node scripts/run-zero-cost-regression.mjs '+key;commands.check+=' && npm run '+key;}
fs.writeFileSync(packagePath,JSON.stringify(pkg,null,2)+'\n');fs.writeFileSync(commandsPath,JSON.stringify(commands,null,2)+'\n');
console.log('Current-history30 campaign wired; original empty-source rejection retained, no expected status weakened.');
