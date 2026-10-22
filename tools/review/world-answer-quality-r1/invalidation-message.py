from pathlib import Path
p=Path('assets/customer-ui/js/surfaces/ric-world-session-panel.js');s=p.read_text(encoding='utf-8')
s=s.replace("function renderReality(r){host.dataset.permissionState=r.state;const items=r.workspace.currentReality.evidence;", "function renderReality(r){const hadSelection=host.dataset.permissionState==='SESSION_SELECTED';host.dataset.permissionState=r.state;const items=r.workspace.currentReality.evidence;if(hadSelection&&!items.length)status(t('所选资料已过期、撤销或来源已改变，请重新选择。','Selected evidence expired, was revoked or changed; select again.'));")
p.write_bytes(s.encode())
p=Path('tools/review/world-answer-quality-r1/world-browser.mjs');s=p.read_text(encoding='utf-8')
target='results.push({locale,width,tenAnswers:answers'
insert="""const missing=JSON.parse(fs.readFileSync('tools/review/world-answer-quality-r1/UNSEEN-RESULTS.json')).find(x=>x.id===9&&x.locale===locale);await p.locator('#globalSearch').fill(missing.question);await p.locator('#globalSearch').press('Enter');await p.waitForFunction(expected=>document.querySelector('[data-customer-direct]')?.textContent.includes(expected),missing.product.directAnswer,{timeout:15000});assert.equal(await p.locator('[data-evidence-source]').count(),0);
 """
s=s.replace(target,insert+target)
p.write_bytes(s.encode())
