import {releaseR5Predecessor,currentR5ProtectedCheckerPredecessor} from './lib/pr22-release-r5-exact-successor-r1.mjs';
// Current-source integration checks. Historical H5/PDS checks remain enabled
// and are reported separately. Registered source-only topic retirements use exact
// accepted ancestry; all current Home, navigation and permissions below execute actual bytes.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {CX_NAVIGATION} from '../assets/customer-ui/js/navigation.js';
const record=JSON.parse(fs.readFileSync('content/web/homepage/homepage-r5-pr22-integration.json','utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
for(const row of record.sourceFiles)assert.equal(sha(currentR5ProtectedCheckerPredecessor(row.path,fs.readFileSync(row.path))),row.sha256,'R5_CURRENT_SOURCE_DRIFT:'+row.path);
for(const row of record.protectedOriginalSeven)assert.equal(sha(releaseR5Predecessor(row.path,fs.readFileSync(row.path))),row.sha256,'PR22_PREEXISTING_PATH_DRIFT:'+row.path);
for(const row of record.sixSubjects)assert.equal(sha(fs.readFileSync(row.path)),row.sourceSHA256,'R5_SIX_SUBJECT_DRIFT:'+row.path);
const home=fs.readFileSync('index.html','utf8'),hero=home.match(/<section class="r3-home-hero[\s\S]*?<\/section>/)?.[0];assert.equal(sha(hero||''),record.r4HeroHTMLSHA256,'ACCEPTED_R4_HERO_DRIFT');
assert.deepEqual([...home.matchAll(/data-cx-home-section="(H\d+)"/g)].map(x=>x[1]),Array.from({length:10},(_,i)=>'H'+String(i+1).padStart(2,'0')));
assert.deepEqual(CX_NAVIGATION.primary.map(x=>x.id),['SUBJECTS','WORLD','KNOWLEDGE','METHODS','PROFESSIONAL']);
assert.equal(CX_NAVIGATION.utilities.find(x=>x.id==='ACCOUNT')?.href,'/account/');
for(const id of ['r3-continue','r3-support','six-perspectives'])assert(home.includes(`id="${id}"`),'LEGACY_HOME_FRAGMENT_MISSING:'+id);
assert.doesNotMatch(home,/<(?:a|form)[^>]+(?:href|action)="[^\"]*(?:checkout|payment|unlock-video)/i,'UNADMITTED_HOMEPAGE_PURCHASE_ACTION');
const shell=fs.readFileSync('assets/customer-ui/js/shell.js','utf8'),publicShell=fs.readFileSync('assets/js/public-shell.js','utf8');
assert(shell.includes('class="r5-mobile-account" href="/account/"'));assert(publicShell.includes("import {CX_NAVIGATION}"));assert(publicShell.includes('window.innerWidth <= 1199'));
assert.doesNotMatch(shell+publicShell,/localStorage[^\n]*(?:entitlement|membership)/i);
const consumer=JSON.parse(fs.readFileSync('content/web-production/registries/client-visual-consumer-map-v1.json')).records.find(x=>x.surfaceCode==='HOME');assert.equal(consumer.hero.assetCode,'PHIOS-HERO-HOMEPAGE-D-v1');assert.equal(consumer.hero.mobileAssetCode,'PHIOS-HERO-HOMEPAGE-M-v1');assert.equal(consumer.hero.mode,'EXISTING_MANAGED');
if(process.argv.includes('--artifact'))for(const row of record.sourceFiles.filter(x=>!x.path.startsWith('scripts/')&&!x.path.startsWith('content/web/homepage/')))assert.equal(sha(fs.readFileSync(path.join('.pages-output',row.path))),row.sha256,'R5_PUBLISHED_BYTES_DRIFT:'+row.path);
console.log('PASS R5 current source: original PR22 seven paths, R4 Hero, six subjects, ten sections, common navigation, legacy fragments and no new commercial CTA'+(process.argv.includes('--artifact')?'; exact Pages public bytes':'')+'. Historical/full CI gates remain separate.');
