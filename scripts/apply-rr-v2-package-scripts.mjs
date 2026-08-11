import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(), p=path.join(root,'package.json'); const pkg=JSON.parse(fs.readFileSync(p,'utf8'));
pkg.scripts??={};
const wanted={
 'check:rr-w0-w12':'node scripts/check-rr-w0-w12-customer-report-runtime-v2.mjs',
 'check:rr':'npm run check:rr-w0-w12',
 'check:rr-v2':'npm run check:rr'
};
for(const [k,v] of Object.entries(wanted)){if(pkg.scripts[k]&&pkg.scripts[k]!==v)throw new Error(`RR_PACKAGE_ALIAS_CONFLICT:${k}:${pkg.scripts[k]}`); pkg.scripts[k]=v;}
const post=String(pkg.scripts.postcheck??'').trim(); if(!post)throw new Error('RR_POSTCHECK_MISSING'); const commands=post.split(/\s*&&\s*/).map(x=>x.trim()).filter(Boolean); const rreIndex=commands.indexOf('npm run check:rre'); if(rreIndex<0)throw new Error('RR_REQUIRES_RRE_POSTCHECK_PREDECESSOR'); const rrIndex=commands.indexOf('npm run check:rr'); if(rrIndex>=0&&rrIndex<rreIndex)throw new Error('RR_POSTCHECK_ORDER_INVALID'); if(rrIndex<0){commands.push('npm run check:rr'); pkg.scripts.postcheck=commands.join(' && ');}
fs.writeFileSync(p,JSON.stringify(pkg,null,2)+'\n','utf8');
console.log('✓ RR v2 package aliases applied.');
console.log('✓ check:rr now covers RR-W0-W12.');
console.log('✓ RR v2 freeze validation is appended after existing RRE validation in default postcheck.');
