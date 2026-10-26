import fs from 'node:fs';import {fileURLToPath} from 'node:url';import {chromium} from 'file:///C:/Users/Guest%20Account/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const out='tools/review/phi-configuration-deep-reading-r2-integrated/r31-author-publication',master='C:/phios/content/production-closure/live-customer-commercial-convergence/MASTER-HUMAN-REVIEW.html';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--no-proxy-server']}),page=await browser.newPage({viewport:{width:1300,height:1100}});
await page.goto('file:///'+master+'#ecr-r31-author-led-publication',{waitUntil:'domcontentloaded'});const section=page.locator('#ecr-r31-author-led-publication');await section.waitFor();await section.screenshot({path:out+'/master-r31-section.png'});
const links=await section.locator('a').evaluateAll(xs=>xs.map(a=>a.href));const checks=links.map(url=>({exists:fs.existsSync(fileURLToPath(url)),url}));
const count=await section.count();if(count!==1||checks.some(c=>!c.exists))throw Error('MASTER_ANCHOR_OR_LINK_FAILED');
fs.writeFileSync(out+'/master-browser-evidence.json',JSON.stringify({mode:'ACTUAL_EDGE_FILE_ENTRY',uniqueSection:count,links:checks,status:'PASS_LOCAL',providerCalls:0},null,2));await browser.close();console.log(JSON.stringify({uniqueSection:count,links:checks.length,status:'PASS_LOCAL'}));
