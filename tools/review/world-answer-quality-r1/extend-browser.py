from pathlib import Path
p=Path('tools/review/world-answer-quality-r1/browser.mjs');s=p.read_text(encoding='utf-8')
s=s.replace("const values={'reality-question'", """await p.locator('#ric-selection summary').first().click();await p.locator('[data-claim]').first().check();await p.locator('#ric-consent').check();await p.locator('#ric-select').click();await p.waitForFunction(()=>window.ricL1Reality?.permission?.decision==='ALLOW');const selected=await p.evaluate(()=>window.ricL1Reality.workspace.currentReality.evidence[0]);assert.equal(selected.personSpecificFact,false);assert.equal(selected.sources[0].publisher,'IMF');assert.equal(selected.sources[0].language,'en');assert.ok(selected.sources[0].limitations.length);await p.locator('#ric-revoke').click();await p.waitForFunction(()=>window.ricL1Reality?.state==='SESSION_REVOKED');await p.locator('#ric-selection summary').first().click();
 const values={'reality-question'""")
s=s.replace("records.push({locale,width,answerFirst:true", """await c.route('**/api/local-ric/answer',r=>r.fulfill({status:503,contentType:'application/json',body:'{}'}));await p.locator('#ric-ask').click();await p.waitForFunction(()=>document.querySelector('#ric-status').textContent.includes('失败')||document.querySelector('#ric-status').textContent.includes('failed'));assert.equal(await p.locator('#ric-answer').textContent(),'');
 records.push({locale,width,publicSourceSelection:true,publicSourceRevocation:true,sourceFailureClearsAnswer:true,answerFirst:true""")
p.write_bytes(s.encode())
p=Path('tools/review/world-answer-quality-r1/world-browser.mjs');s=p.read_text(encoding='utf-8')
start=s.index("await p.locator('#globalSearch').fill(");end=s.index('results.push(',start)
s=s[:start]+"""const cases=JSON.parse(fs.readFileSync('tools/review/world-answer-quality-r1/QUESTION-RESULTS.json')).filter(x=>x.locale===locale);const answers=[];for(const item of cases){await p.locator('#globalSearch').fill(item.question);await p.locator('#globalSearch').press('Enter');await p.waitForFunction(expected=>document.querySelector('[data-customer-direct]')?.textContent.includes(expected),item.product.directAnswer,{timeout:15000});assert.ok(!/[a-f0-9]{64}/.test(await p.locator('#worldEvidenceAnswer').innerText()));answers.push({question:item.question,direct:await p.locator('[data-customer-direct]').textContent(),citations:await p.locator('[data-evidence-source]').count()});}
 """+s[end:]
s=s.replace("import fs from 'node:fs';", "import fs from 'node:fs';import assert from 'node:assert/strict';")
s=s.replace("results.push({locale,width,answer:","results.push({locale,width,tenAnswers:answers,answer:")
p.write_bytes(s.encode())
