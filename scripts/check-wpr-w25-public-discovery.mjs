import assert from 'node:assert/strict';
import {BASELINE,readJson,readText,exists,routeFile} from './lib/web-production/wpr-integrity-v1.mjs';

const FIVE_VOLUME_BASELINE='1cbc50f7590759774944a577d3082c13ef59c40b';
const c=readJson('content/web-production/contracts/wpr-public-discovery-v1.json');
assert.equal(c.baselineCommit,BASELINE);assert.equal(c.work,'WPR-W25');assert.equal(c.deploymentOrigin,'https://phios-github.pages.dev');assert.equal(c.futureCanonicalOrigin,'https://getphios.com');assert.equal(c.futureCanonicalOriginState,'DOMAIN_RESERVED_DEPLOYMENT_VERIFICATION_REQUIRED');

// WPR-W25 v1 remains historical authority at 16 routes. Post-freeze public discovery
// is read only through the accepted WPR-5V successor registry; this does not rewrite v1.
const predecessor=readJson('content/web-production/registries/wpr-public-discovery-registry-v1.json');
assert.equal(predecessor.baselineCommit,BASELINE);assert.equal(predecessor.entries.length,16);assert.equal(predecessor.origin,c.deploymentOrigin);assert.equal(predecessor.rules.privateRouteCountInSitemap,0);
const reg=readJson('content/web-production/registries/wpr-public-discovery-registry-v1.1.json');
assert.equal(reg.baselineCommit,FIVE_VOLUME_BASELINE);assert.equal(reg.origin,c.deploymentOrigin);assert.equal(reg.entries.length,17);assert.equal(reg.rules.expectedStableRouteCount,17);assert.equal(reg.rules.privateRouteCountInSitemap,0);

const paths=reg.entries.map(x=>x.path);assert.equal(new Set(paths).size,paths.length);assert.ok(reg.entries.every(x=>x.indexable===true&&x.sitemap===true));assert.ok(paths.includes('/books/reality-continuity'));
for(const p of ['/reality-dashboard','/personal-runtime','/professional-workspace','/professional-reports','/books/reality-maintenance'])assert.equal(paths.includes(p),false,p);

const published=readJson('content/knowledge/public/published-articles.json');assert.equal(published.recordCount,6);const hrefs=[...new Set(published.records.filter(x=>x.publicationStatus==='published').map(x=>x.href))];assert.equal(hrefs.length,3);for(const href of hrefs){assert.ok(paths.includes(href),`PUBLISHED_ROUTE_NOT_DISCOVERABLE:${href}`);const file=`articles/${href.split('/').pop()}.html`;assert.ok(exists(file),file);}
const routeFileSuccessor=p=>p==='/books/reality-continuity'?'books/reality-continuity/index.html':routeFile(p);
const staticPaths=paths.filter(p=>!p.startsWith('/articles/')||p==='/articles');for(const p of staticPaths){const f=routeFileSuccessor(p);assert.ok(f,`NO_ROUTE_FILE:${p}`);assert.ok(exists(f),f);const h=readText(f);assert.match(h,/<title(?:\s|>)/i,`TITLE:${f}`);assert.match(h,/<meta\s+name=["']description["']/i,`DESCRIPTION:${f}`);}

const robots=readText('robots.txt');assert.ok(robots.includes('Sitemap: https://phios-github.pages.dev/sitemap.xml'));for(const p of ['/reality-dashboard','/personal-runtime','/professional-workspace','/professional-reports'])assert.ok(robots.includes(`Disallow: ${p}`),p);
const sitemap=readText('sitemap.xml');const locs=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);assert.equal(locs.length,paths.length);assert.equal(new Set(locs).size,locs.length);for(const p of paths)assert.ok(locs.includes(`${c.deploymentOrigin}${p}`),p);for(const p of ['/reality-dashboard','/personal-runtime','/professional-workspace','/professional-reports','/books/reality-maintenance'])assert.equal(sitemap.includes(p),false,p);

// Frozen W25 audit/acceptance stay tied to the 16-route predecessor.
const audit=readJson('content/web-production/audits/wpr-w25-public-discovery-audit-v1.json');assert.equal(audit.indexableRouteCount,predecessor.entries.length);assert.equal(audit.privateRouteCountInSitemap,0);assert.equal(audit.authorityExpansionGranted,false);
const a=readJson('content/web-production/acceptance/wpr-w25-public-discovery-acceptance-v1.json');assert.equal(a.baselineCommit,BASELINE);for(const v of Object.values(a.nonActivation))assert.equal(v,false);

const fiveVolumeAcceptance=readJson('content/web-production/acceptance/wpr-five-volume-production-successor-acceptance-v1.json');assert.equal(fiveVolumeAcceptance.accepted,true);assert.equal(fiveVolumeAcceptance.result.wprV1Authority,'UNCHANGED');assert.equal(fiveVolumeAcceptance.result.wprV2Created,false);assert.equal(fiveVolumeAcceptance.result.stableSitemapRoutes,17);
const pkg=readJson('package.json');assert.equal(pkg.scripts['check:wpr-w25'],'node scripts/check-wpr-w25-public-discovery.mjs');assert.equal(pkg.scripts['check:wpr-discovery'],'npm run check:wpr-w25');assert.ok(pkg.scripts['check:wpr'].includes('npm run check:wpr-discovery'));assert.equal(pkg.scripts.postcheck.includes('check:wpr'),false);
console.log('✓ WPR-W25 SEO / Public Discovery passed through WPR-5V successor reconciliation.');console.log(`  ${paths.length} stable public routes are discoverable; frozen W25 remains 16-route historical authority and private/compatibility routes remain outside the sitemap.`);
