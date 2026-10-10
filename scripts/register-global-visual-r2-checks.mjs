import fs from 'node:fs';
const names=['approved-r2-visual-inventory','approved-r2-visual-resolution','visual-route-consumption','no-orphan-approved-visuals','no-production-visual-placeholders','hero-binding','figure-binding','state-illustrations','visual-responsive-contract','visual-alt-contract','visual-lazy-loading','visual-route-role-contract','visual-function-preservation'];
const packagePath='package.json',commandsPath='config/reports/zero-cost-check-commands.json';
const pkg=JSON.parse(fs.readFileSync(packagePath)),commands=JSON.parse(fs.readFileSync(commandsPath));
for(const name of names){const key='check:'+name;pkg.scripts[key]=`node scripts/run-zero-cost-regression.mjs ${key}`;commands[key]=`node scripts/check-global-visual-r2.mjs ${key}`;}
pkg.scripts['check:global-visual-r2']='node scripts/run-zero-cost-regression.mjs check:global-visual-r2';commands['check:global-visual-r2']='node scripts/check-global-visual-r2.mjs';
fs.writeFileSync(packagePath,JSON.stringify(pkg,null,2)+'\n');fs.writeFileSync(commandsPath,JSON.stringify(commands,null,2)+'\n');console.log('Registered 13 zero-provider visual contracts and aggregate check.');
