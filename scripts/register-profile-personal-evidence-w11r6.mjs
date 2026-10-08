import fs from 'node:fs';
const pkg=JSON.parse(fs.readFileSync('package.json')),commands=JSON.parse(fs.readFileSync('config/reports/zero-cost-check-commands.json'));
const aliases={
 'check:profile:pfig-semantic-grammar':'node scripts/check-profile-personal-evidence-w11r6.mjs --mode=semantic-grammar',
 'check:profile:pfig-provenance-preservation':'node scripts/check-profile-personal-evidence-w11r6.mjs --mode=provenance-preservation',
 'check:profile:pfig-publication-legibility':'node scripts/check-profile-personal-evidence-w11r6-legibility.mjs',
 'check:profile:pfig-review-browser':'node scripts/check-profile-personal-evidence-w11r6-review-browser.mjs',
 'check:profile:prd-w11r6':'npm run check:profile:pfig-semantic-grammar && npm run check:profile:pfig-provenance-preservation && npm run check:profile:pfig-publication-legibility && npm run check:profile:pfig-review-browser'
};
for(const [key,command]of Object.entries(aliases)){if(commands[key]&&commands[key]!==command&&!(key==='check:profile:pfig-publication-legibility'&&commands[key]==='node scripts/check-profile-personal-evidence-w11r6-browser.mjs --no-pdf'))throw Error('W11R6_ALIAS_CONFLICT '+key);pkg.scripts[key]='node scripts/run-zero-cost-regression.mjs '+key;commands[key]=command;}
fs.writeFileSync('package.json',JSON.stringify(pkg,null,2)+'\n');fs.writeFileSync('config/reports/zero-cost-check-commands.json',JSON.stringify(commands,null,2)+'\n');
console.log('W11R6 focused aliases registered in existing zero-cost runner.');
