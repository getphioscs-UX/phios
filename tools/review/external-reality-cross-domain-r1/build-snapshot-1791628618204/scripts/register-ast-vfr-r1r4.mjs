import fs from 'node:fs';
const f='config/reports/zero-cost-check-commands.json',c=JSON.parse(fs.readFileSync(f)),p=JSON.parse(fs.readFileSync('package.json'));
for(const name of ['diagram-acceptance','no-large-panels','section-master-clean','page-consolidation','sparse-pages','bilingual-source-binding','accepted-zh-copy','diagram-sharing','desktop','mobile','print']){const key='check:ast-vfr-r1r4:'+name;c[key]='node scripts/check-ast-vfr-r1r4.mjs '+name;p.scripts[key]='node scripts/run-zero-cost-regression.mjs '+key;}
for(const [name,command] of [['browser','node scripts/check-ast-vfr-r1r4-browser.mjs'],['pdf-content','node scripts/verify-ast-vfr-r1r4-pdf.mjs']]){const key='check:ast-vfr-r1r4:'+name;c[key]=command;p.scripts[key]='node scripts/run-zero-cost-regression.mjs '+key;}
fs.writeFileSync(f,JSON.stringify(c,null,2)+'\n');fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n');
