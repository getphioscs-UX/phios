import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {parseHTML} from 'linkedom';
const recordPath='docs/ziwei-customer-copy-r2-20261124/SOURCESET.json';
const digest=b=>createHash('sha256').update(b).digest('hex');
const bytes=fs.readFileSync(recordPath);
assert.equal(digest(bytes),'495955b0039e8f92cb8e650774c8fd836f2b7b2468e35fde33a8661ca6d559d3','Exact copy candidate record');
const record=JSON.parse(bytes),rows=[];
assert.equal(record.status,'COPY_IMPLEMENTED_SOURCE_GOVERNANCE_PENDING');
assert.equal(record.sourceGovernance.readerRegistrationImplemented,false);
for(const flag of Object.values(record.boundaries))assert.equal(flag,false);
for(const f of record.files){assert.equal(digest(fs.readFileSync(f.path)),f.sha256);const old=execFileSync('git',['show',record.base+':'+f.path],{env:{...process.env,GIT_NO_LAZY_FETCH:'1',GIT_OPTIONAL_LOCKS:'0'},maxBuffer:4e6});assert.equal(digest(old),f.previousSHA256);rows.push({path:f.path,current:true,predecessor:true});}
for(const f of record.unchanged){assert.equal(digest(fs.readFileSync(f.path)),f.sha256,'Other owner/asset drift: '+f.path);assert.equal(digest(execFileSync('git',['show',record.base+':'+f.path],{env:{...process.env,GIT_NO_LAZY_FETCH:'1',GIT_OPTIONAL_LOCKS:'0'},maxBuffer:4e6})),f.sha256,'Other owner baseline drift: '+f.path);}
const html=fs.readFileSync(record.files[0].path,'utf8'),guide=JSON.parse(fs.readFileSync(record.files[1].path));
const {document:d}=parseHTML('<html><body><main>'+html+'</main></body></html>');
assert.equal(d.querySelectorAll('[data-zwr-copy-section]').length,10);
assert.equal(d.querySelectorAll('h1').length,1);
assert.equal(d.querySelectorAll('#faq details').length,13);
assert.equal(d.querySelectorAll('[data-palace]').length,12);
assert.equal(d.querySelectorAll('[data-pe5-figure]').length,3);
assert.equal(d.querySelectorAll('script,form,iframe').length,0,'No new executor or private form owner');
assert(!html.includes('你的免费阅读已经准备好'));
assert(!html.includes('查看完整报告内页</a>'));
assert(html.includes('不会把完整私人报告或商品展示图当作免费个人结果'));
assert(html.includes('当前页面不宣称匿名会话自动恢复'));
for(const a of d.querySelectorAll('a'))assert(/^(#|\/account\/|\/perspectives\/personal\/|\/subjects\/|\/professional\/financial\/|\/knowledge\/)/.test(a.getAttribute('href')),'Unregistered action');
const catalog=JSON.parse(fs.readFileSync('content/web-production/registries/commerce-product-visuals-v1.json'));
assert.equal(d.querySelector('.zwr-r2-product img').getAttribute('src'),catalog.assets.find(x=>x.productId==='COM-REPORT-ZIWEI-FULL').publicUrl);
const oldGuide=JSON.parse(execFileSync('git',['show',record.base+':'+record.files[1].path],{maxBuffer:4e6}));
assert.deepEqual(guide.en,oldGuide.en,'English guide preserved');
assert.equal(guide['zh-Hans'].palaces.length,12);assert.equal(guide['zh-Hans'].hints.length,12);
for(const row of record.files){const changed=Buffer.concat([fs.readFileSync(row.path),Buffer.from(' ')]);assert.notEqual(digest(changed),row.sha256,'Unknown bytes remain rejected');}
console.log(JSON.stringify({status:'PASS_COPY_CANDIDATE_ONLY',rows,chapters:10,palaces:12,faq:13,originalFigures:3,unchangedOwners:record.unchanged.length,historicalFrozenGateNotOverridden:true,commercialAdmission:false}));
