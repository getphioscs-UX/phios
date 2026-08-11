import fs from 'node:fs';
const file='package.json'; const pkg=JSON.parse(fs.readFileSync(file,'utf8')); pkg.scripts ||= {};
const required={
  'check:mpa-w26-w27':'node scripts/check-mpa-w26-w27-production-eligibility-execution-gate.mjs',
  'check:mpa-production-gate':'npm run check:mpa-w26-w27'
};
for(const [k,v] of Object.entries(required)){if(pkg.scripts[k]&&pkg.scripts[k]!==v)throw new Error(`SCRIPT_CONFLICT:${k}`);pkg.scripts[k]=v;}
const segment='npm run check:mpa-production-gate'; const current=String(pkg.scripts['check:mpa']||'').split(' && ').filter(Boolean);
if(!current.includes(segment)) current.push(segment); pkg.scripts['check:mpa']=current.join(' && ');
fs.writeFileSync(file,JSON.stringify(pkg,null,2)+'\n','utf8');
console.log('✓ MPA-W26/W27 package scripts registered.');
console.log('✓ Conditional eligibility remains fail-closed; no current Method production dispatch is activated.');
