import fs from 'node:fs';
import assert from 'node:assert/strict';
import {publicationRoutes} from './lib/customer-publication-sitemap.mjs';
const routes=publicationRoutes().filter(p=>p.startsWith('/articles/')&&p!=='/articles/');
for(const route of routes){const html=fs.readFileSync(route.slice(1)+'.html','utf8');
 assert.equal((html.match(/data-cx-header/g)||[]).length,1);assert.equal((html.match(/data-cx-footer/g)||[]).length,1);
 assert.ok(html.includes('/assets/customer-ui/js/shell.js'));assert.ok(html.includes('/assets/customer-ui/js/surfaces/article.js'));assert.ok(html.includes('/assets/customer-ui/surfaces/article.css'));
 assert.doesNotMatch(html,/data-public-header-placeholder|assets\/js\/public-shell.js|href="\/assets\/css\//);
 assert.ok(html.includes('https://getphios.com'+route));
}
console.log(`PASS: ${routes.length} published article shells use current customer header/footer, styling and locale bridge.`);
