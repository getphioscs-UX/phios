import fs from 'node:fs';
const p=JSON.parse(fs.readFileSync('package.json')),c=JSON.parse(fs.readFileSync('config/reports/zero-cost-check-commands.json'));
const checks=['check:profile:personal-evidence:bilingual-publication',...['pfig-publication','pfig-primary-binding','pfig-state','no-duplicate-pfig','radar','semantic-drift'].map(x=>'check:profile:prd-w11r5:'+x)];
for(const name of checks){p.scripts[name]='node scripts/run-zero-cost-regression.mjs '+name;c[name]='node scripts/check-profile-personal-evidence-w11r5.mjs';}
for(const name of ['check:profile:prd-w11r5:print','check:profile:prd-w11r5:mobile']){p.scripts[name]='node scripts/run-zero-cost-regression.mjs '+name;c[name]='node scripts/check-profile-personal-evidence-w11r5-browser.mjs --no-pdf';}
p.scripts['check:profile:prd-w11r5']='node scripts/run-zero-cost-regression.mjs check:profile:prd-w11r5';c['check:profile:prd-w11r5']='node scripts/check-profile-personal-evidence-w11r5.mjs && node scripts/check-profile-personal-evidence-w11r5-browser.mjs --no-pdf';
p.scripts['build:profile:prd-w11r5']='node scripts/build-profile-personal-evidence-w11r3.mjs --w11r5';
fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n');fs.writeFileSync('config/reports/zero-cost-check-commands.json',JSON.stringify(c,null,2)+'\n');
const path='scripts/prepare-profile-personal-evidence-w11r5.mjs',s=fs.readFileSync(path,'utf8');fs.writeFileSync(path,s.slice(0,s.indexOf("const path='scripts/build")));
