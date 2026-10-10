import fs from 'node:fs';
import {sitemapXml} from './lib/customer-publication-sitemap.mjs';
fs.writeFileSync('sitemap.xml',sitemapXml());
console.log('Published-manifest sitemap generated.');
