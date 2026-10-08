import fs from 'node:fs';
const p=JSON.parse(fs.readFileSync('package.json')),z=JSON.parse(fs.readFileSync('config/reports/zero-cost-check-commands.json'));
for(const name of ['accepted-manuscript','visual-assets','diagrams','page-plan','publication-completeness','accepted-copy','three-call-architecture']){const key='check:ast-vfr-r1:'+name;z[key]='node scripts/check-ast-vfr-r1.mjs '+name;p.scripts[key]='node scripts/run-zero-cost-regression.mjs '+key;}
for(const name of ['accepted-manuscript','diagram-data','publication-ir','page-plan','review'])p.scripts['build:ast-vfr-r1:'+name]='node scripts/build-ast-vfr-r1.mjs';
p.scripts['build:ast-vfr-r1:visual-assets']='node scripts/build-ast-vfr-r1-assets.mjs';
fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n');fs.writeFileSync('config/reports/zero-cost-check-commands.json',JSON.stringify(z,null,2)+'\n');
