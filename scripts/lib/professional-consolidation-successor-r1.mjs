import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const structure=node=>{
  if(node.nodeType===3){const text=node.textContent.replace(/\s+/g,' ').trim();return text?['text',text]:null;}
  if(node.nodeType!==1)return null;
  return [node.localName,[...node.attributes].map(a=>[a.name,a.value]).sort(([a],[b])=>a.localeCompare(b)),[...node.childNodes].map(structure).filter(Boolean)];
};
export function professionalConsolidationBytes(file,expected){
  assert.equal(file,'professional/index.html');
  const current=fs.readFileSync(file);if(hash(current)===expected)return current;
  const record=JSON.parse(fs.readFileSync('content/web/index-surfaces/professional-service-scope-successor-r1.json'));
  assert.equal(record.status,'ENGINEERING_RECONCILIATION');assert.equal(record.file,file);
  assert.equal(record.predecessor.path,'content/web/index-surfaces/pis-current-surface-followup-successor-v4.json');
  assert.equal(hash(fs.readFileSync(record.predecessor.path)),record.predecessor.sha256);
  for(const key of ['historicalRecordsRewritten','humanAcceptanceGranted','productionActivated','commercialAdmissionGranted','serviceActivationGranted','newVisualAuthorityCreated'])assert.equal(record[key],false);
  assert.equal(record.previousSha256,expected,file+': predecessor mismatch');
  const before=fs.readFileSync(record.previousPath);assert.equal(hash(before),expected,file+': predecessor snapshot drift');
  assert.equal(hash(current),record.sha256,file+': unregistered service-scope successor');
  const document=parseHTML(current.toString()).document,prior=parseHTML(before.toString()).document;
  assert.equal(document.querySelector('link[rel="canonical"]')?.getAttribute('href'),'/professional/');
  assert.equal(document.querySelectorAll('h1').length,1);
  const links=document.querySelectorAll('a[href="/professional/financial/#business-services"]');assert.equal(links.length,1);
  const link=links[0];assert(link.hasAttribute('data-pis-copy'));assert.equal(link.getAttribute('data-cx-en'),'Business financial service scope');assert.equal(link.getAttribute('data-cx-zh'),'企业财务服务范围');
  assert.equal(link.textContent,'Business financial service scope');
  assert(parseHTML(fs.readFileSync('professional/financial/index.html','utf8')).document.getElementById('business-services'),'Business service destination missing');
  link.remove();
  const skip=document.querySelector('a.cx-skip[href="#main"]');assert(skip);assert.equal(skip.getAttribute('data-cx-en'),'Skip to content');assert.equal(skip.getAttribute('data-cx-zh'),'跳转至主要内容');skip.removeAttribute('data-cx-en');skip.removeAttribute('data-cx-zh');
  assert.deepEqual(structure(document.documentElement),structure(prior.documentElement),'Professional content/visual/runtime changed beyond the declared navigation and accessibility additions');
  return before;
}

export function financialServiceScopeBytes(file,expected){
  assert.equal(file,'professional/financial/index.html');
  const current=fs.readFileSync(file);if(hash(current)===expected)return {before:current,sha256:expected};
  const record=JSON.parse(fs.readFileSync('content/web/index-surfaces/pis-financial-service-scope-successor-v7.json'));
  assert.equal(record.status,'ENGINEERING_RECONCILIATION');assert.equal(record.file,file);
  assert.equal(record.predecessor.path,'content/web/index-surfaces/pis-financial-local-receiver-successor-v6.json');
  assert.equal(hash(fs.readFileSync(record.predecessor.path)),record.predecessor.sha256);
  for(const key of ['historicalRecordsRewritten','humanAcceptanceGranted','productionActivated','commercialAdmissionGranted','serviceActivationGranted','newVisualAuthorityCreated'])assert.equal(record[key],false);
  assert.equal(record.previousSha256,expected);const before=fs.readFileSync(record.previousPath);assert.equal(hash(before),expected,'Financial predecessor snapshot drift');
  assert.equal(hash(current),record.sha256,'Unregistered financial service-scope markup');
  const document=parseHTML(current.toString()).document,prior=parseHTML(before.toString()).document;
  const sections=document.querySelectorAll('section#business-services');assert.equal(sections.length,1);const section=sections[0];
  assert.equal(hash(Buffer.from(section.outerHTML)),record.businessSectionSha256);assert.equal(section.querySelectorAll('form,input,textarea,select').length,0,'Public service section cannot collect private records');
  assert.deepEqual([...section.querySelectorAll('a')].map(a=>a.getAttribute('href')),['/professional/financial/report-preview/','/professional/appointments/','mailto:getphios.cs@gmail.com?subject=Business%20service%20enquiry']);
  const paragraph=document.querySelector('#finance-report-preview-title')?.parentElement.querySelector('p');assert(paragraph);
  assert.equal(hash(Buffer.from(paragraph.outerHTML)),record.previewParagraphSha256);assert(paragraph.textContent.includes('Paid generation is not available yet.'));assert(paragraph.textContent.includes('review candidates'));
  paragraph.replaceWith(prior.querySelector('#finance-report-preview-title').parentElement.querySelector('p').cloneNode(true));section.remove();
  const skip=document.querySelector('a.cx-skip[href="#main"]');assert(skip);assert.equal(skip.getAttribute('data-cx-en'),'Skip to content');assert.equal(skip.getAttribute('data-cx-zh'),'跳转至主要内容');skip.removeAttribute('data-cx-en');skip.removeAttribute('data-cx-zh');
  assert.deepEqual(structure(document.documentElement),structure(prior.documentElement),'Financial source changed beyond declared service section, candidate preview paragraph and bilingual skip link');
  return {before,sha256:record.sha256};
}
