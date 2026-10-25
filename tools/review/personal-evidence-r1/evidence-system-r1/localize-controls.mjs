import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
const base=JSON.parse(fs.readFileSync('tools/review/personal-evidence-r1/evidence-system-r1/BASELINE.json'));
const p='assets/customer-ui/js/surfaces/profile-progressive.js';let s=fs.readFileSync(p,'utf8');
assert.equal(crypto.createHash('sha256').update(s).digest('hex'),base.files.find(x=>x.path===p).sha256,'SHARED_OWNER_CHANGED_STOP');
s=s.replace("button.textContent=item.mode+' · '+item.createdAt+' · APPROVED_UNRELEASED'","button.textContent=(labels[item.mode]?.[locale()==='zh-Hans'?1:0]||humanize(item.mode))+' · '+item.createdAt");
// Existing account result-list errors are customer messages, not internal state codes.
s=s.replaceAll('host.textContent=e.message;',"host.textContent=locale()==='zh-Hans'?'无法打开保存记录，请登录后重试。':'Unable to open saved records. Sign in and try again.';");
fs.writeFileSync(p,s);
const page='perspectives/profile/index.html';let html=fs.readFileSync(page,'utf8');
for(const [key,en,zh] of [['KEEP_EVIDENCE','Keep this evidence','保留证据'],['COMPARE_CURRENT_REALITY','Compare with Current Reality','对照当下现实'],['OBSERVATION_TARGET','Add as observation target','作为观察目标'],['OPEN_QUESTION','Keep an open question','保留开放问题']])html=html.replace(`<option value="${key}">${en} / ${zh}</option>`,`<option value="${key}" data-cx-en="${en}" data-cx-zh="${zh}">${en}</option>`);
html=html.replace('<label>Observation / 观察<textarea','<label><span data-cx-en="Observation" data-cx-zh="观察">Observation</span><textarea').replace('<label>Open question / 开放问题<textarea','<label><span data-cx-en="Open question" data-cx-zh="开放问题">Open question</span><textarea').replace('data-prf-dossier-print="">Print / 打印','data-prf-dossier-print="" data-cx-en="Print" data-cx-zh="打印">Print').replace('data-prf-dossier-close="">Close / 关闭','data-prf-dossier-close="" data-cx-en="Close" data-cx-zh="关闭">Close');
fs.writeFileSync(page,html);
