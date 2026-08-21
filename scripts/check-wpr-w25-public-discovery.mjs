import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {BASELINE,readJson,readText,exists,routeFile} from './lib/web-production/wpr-integrity-v1.mjs';
const sha256=p=>'sha256:'+crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

const FIVE_VOLUME_BASELINE='1cbc50f7590759774944a577d3082c13ef59c40b';
const c=readJson('content/web-production/contracts/wpr-public-discovery-v1.json');
assert.equal(c.baselineCommit,BASELINE);assert.equal(c.work,'WPR-W25');assert.equal(c.deploymentOrigin,'https://phios-github.pages.dev');assert.equal(c.futureCanonicalOrigin,'https://getphios.com');assert.equal(c.futureCanonicalOriginState,'DOMAIN_RESERVED_DEPLOYMENT_VERIFICATION_REQUIRED');

// Historical WPR-W25 remains a 16-route observation. The mutable registry path later
// advanced through accepted five-volume + BOOK-W1E/W1F successors, so current bytes
// must be validated through that lineage rather than mistaken for the historical snapshot.
const audit=readJson('content/web-production/audits/wpr-w25-public-discovery-audit-v1.json');
const acceptance=readJson('content/web-production/acceptance/wpr-w25-public-discovery-acceptance-v1.json');
assert.equal(audit.indexableRouteCount,16);assert.equal(audit.sitemapRouteCount,16);assert.equal(audit.privateRouteCountInSitemap,0);assert.equal(audit.authorityExpansionGranted,false);
assert.equal(acceptance.baselineCommit,BASELINE);for(const v of Object.values(acceptance.nonActivation))assert.equal(v,false);

const fiveVolume=readJson('content/web-production/registries/wpr-public-discovery-registry-v1.1.json');
assert.equal(fiveVolume.baselineCommit,FIVE_VOLUME_BASELINE);assert.equal(fiveVolume.origin,c.deploymentOrigin);assert.equal(fiveVolume.entries.length,17);assert.equal(fiveVolume.rules.expectedStableRouteCount,17);assert.equal(fiveVolume.rules.privateRouteCountInSitemap,0);
const fiveVolumeAcceptance=readJson('content/web-production/acceptance/wpr-five-volume-production-successor-acceptance-v1.json');assert.equal(fiveVolumeAcceptance.accepted,true);assert.equal(fiveVolumeAcceptance.result.wprV1Authority,'UNCHANGED');assert.equal(fiveVolumeAcceptance.result.wprV2Created,false);assert.equal(fiveVolumeAcceptance.result.stableSitemapRoutes,17);

const materialization=readJson('content/knowledge/migrations/book-w1e/book-w1e-public-assets-materialization-reconciliation-v1.json');
const currentSuccessor=readJson('content/knowledge/migrations/book-w1f/wpr-book-w1-current-successor-v2.json');
const current=readJson('content/web-production/registries/wpr-public-discovery-registry-v1.json');
const materialized=materialization.publicDiscoveryRegistry;
const currentRecord=currentSuccessor.currentSources.find(item=>item.path==='content/web-production/registries/wpr-public-discovery-registry-v1.json');
assert.equal(materialization.boundaries.historicalPDSOrWPRFreezeRewritten,false);assert.equal(currentSuccessor.authority.historicalWprFreezeRewritten,false);assert.equal(currentSuccessor.authority.newWebProductionAuthorityCreated,false);
assert.equal(materialized.restoredSha256,sha256('content/web-production/registries/wpr-public-discovery-registry-v1.json').replace('sha256:',''));
assert.equal(currentRecord.currentSha256,materialized.restoredSha256);assert.equal(current.entries.length,18);assert.equal(current.rules.privateRouteCountInSitemap,0);

const maintenance=current.entries.find(x=>x.path==='/books/reality-maintenance/');assert.ok(maintenance);assert.equal(maintenance.indexable,false);assert.equal(maintenance.sitemap,false);assert.equal(maintenance.redirectTarget,'/books/reality-continuity/');assert.equal(maintenance.canonicalAuthority,false);
const stableEntries=current.entries.filter(x=>x.indexable===true&&x.sitemap===true);const paths=stableEntries.map(x=>x.path);assert.equal(paths.length,17);assert.equal(new Set(paths).size,paths.length);assert.ok(paths.includes('/books/reality-continuity'));
for(const p of ['/reality-dashboard','/personal-runtime','/professional-workspace','/professional-reports','/books/reality-maintenance','/books/reality-maintenance/'])assert.equal(paths.includes(p),false,p);

const published=readJson('content/knowledge/public/published-articles.json');assert.equal(published.recordCount,6);const hrefs=[...new Set(published.records.filter(x=>x.publicationStatus==='published').map(x=>x.href))];assert.equal(hrefs.length,3);for(const href of hrefs){assert.ok(paths.includes(href),`PUBLISHED_ROUTE_NOT_DISCOVERABLE:${href}`);const file=`articles/${href.split('/').pop()}.html`;assert.ok(exists(file),file);}
const routeFileSuccessor=p=>p==='/books/reality-continuity'?'books/reality-continuity/index.html':routeFile(p);
const staticPaths=paths.filter(p=>!p.startsWith('/articles/')||p==='/articles');for(const p of staticPaths){const f=routeFileSuccessor(p);assert.ok(f,`NO_ROUTE_FILE:${p}`);assert.ok(exists(f),f);const h=readText(f);assert.match(h,/<title(?:\s|>)/i,`TITLE:${f}`);assert.match(h,/<meta\s+name=["']description["']/i,`DESCRIPTION:${f}`);}

const robots=readText('robots.txt');assert.ok(robots.includes('Sitemap: https://phios-github.pages.dev/sitemap.xml'));for(const p of ['/reality-dashboard','/personal-runtime','/professional-workspace','/professional-reports'])assert.ok(robots.includes(`Disallow: ${p}`),p);
const sitemap=readText('sitemap.xml');const locs=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);assert.equal(locs.length,paths.length);assert.equal(new Set(locs).size,locs.length);for(const p of paths)assert.ok(locs.includes(`${c.deploymentOrigin}${p}`),p);for(const p of ['/reality-dashboard','/personal-runtime','/professional-workspace','/professional-reports','/books/reality-maintenance'])assert.equal(sitemap.includes(p),false,p);

const pkg=readJson('package.json');assert.equal(pkg.scripts['check:wpr-w25'],'node scripts/check-wpr-w25-public-discovery.mjs');assert.equal(pkg.scripts['check:wpr-discovery'],'npm run check:wpr-w25');assert.ok(pkg.scripts['check:wpr'].includes('npm run check:wpr-discovery'));assert.equal(pkg.scripts.postcheck.includes('check:wpr'),false);
console.log('✓ WPR-W25 SEO / Public Discovery passed through five-volume + BOOK-W1E/W1F current successor reconciliation.');console.log(`  Historical W25 remains 16-route evidence; ${paths.length} current stable public routes are discoverable and the maintenance compatibility route remains non-indexable.`);
