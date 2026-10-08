import fs from 'node:fs';
import path from 'node:path';
const b=JSON.parse(fs.readFileSync('content/profile/successors/personal-evidence-r1/w11r6/targeted-r1/baseline.json'));
for(const p of ['scripts/check-profile-personal-evidence-w11r5-browser.mjs','scripts/check-profile-personal-evidence-w11r6-legibility.mjs','scripts/check-profile-personal-evidence-w11r6-review-browser.mjs','scripts/serve-profile-personal-evidence-w11r6-review.mjs']){
 fs.mkdirSync(path.dirname(b.backup+p),{recursive:true});if(!fs.existsSync(b.backup+p))fs.copyFileSync(p,b.backup+p);
 let s=fs.readFileSync(p,'utf8');s=s.replace("const dir='content/profile/successors","const dir=process.env.W11R6_REPAIR_AUDIT||'content/profile/successors").replace("out='content/profile/successors","out=(process.env.W11R6_REPAIR_AUDIT?process.env.W11R6_REPAIR_AUDIT+'legacy-w11r5/':null)||'content/profile/successors").replace("url='http://127.0.0.1:8806/w11r6/'","url=process.env.W11R6_REPAIR_URL||'http://127.0.0.1:8806/w11r6/'");
 if(p.includes('serve-profile'))s=s.replace("path.resolve('content/profile/successors/personal-evidence-r1/w11r6')","path.resolve(process.env.W11R6_REPAIR_AUDIT||'content/profile/successors/personal-evidence-r1/w11r6')").replace("path.resolve('output/pdf/w11r6/PRD-W11R6-CASE-01-PUBLICATION-REVIEW.pdf')","path.resolve(process.env.W11R6_REPAIR_PDF||'output/pdf/w11r6','PRD-W11R6-CASE-01-PUBLICATION-REVIEW.pdf')");
 fs.writeFileSync(p,s);
}
