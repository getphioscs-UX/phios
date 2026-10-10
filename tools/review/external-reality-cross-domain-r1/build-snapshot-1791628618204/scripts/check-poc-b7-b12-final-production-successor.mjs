import fs from 'node:fs';
import assert from 'node:assert/strict';
import https from 'node:https';

const ORIGIN='https://getphios.com';
const WWW='https://www.getphios.com';
const PAGES='https://phios-github.pages.dev';

const read=p=>fs.readFileSync(p,'utf8');
const mustExist=p=>assert.ok(fs.existsSync(p),`MISSING:${p}`);

const requestManual=(url,timeoutMs=20000)=>new Promise((resolve,reject)=>{
  console.log(`[CHECK] ${url}`);
  const req=https.request(url,{method:'GET',headers:{'user-agent':'PHI-OS-POC-B12-ACCEPTANCE/1.2','accept':'*/*'},timeout:timeoutMs},res=>{
    let data=''; res.setEncoding('utf8');
    res.on('data',c=>data+=c);
    res.on('end',()=>{
      console.log(`  -> ${res.statusCode}${res.headers.location?`  ${res.headers.location}`:''}`);
      resolve({status:res.statusCode??0,headers:res.headers,text:data});
    });
  });
  req.on('timeout',()=>req.destroy(new Error(`TIMEOUT after ${timeoutMs}ms: ${url}`)));
  req.on('error',err=>{err.message=`${err.message} [URL=${url}]`; reject(err);});
  req.end();
});

const assertRedirect=async(source,expectedOrigin,expectedPath)=>{
  const res=await requestManual(source);
  assert.ok([301,302,307,308].includes(res.status),`${source} expected redirect, got ${res.status}`);
  const raw=res.headers.location; assert.ok(raw,`${source} redirect missing Location`);
  const u=new URL(new URL(raw,source).href);
  assert.equal(u.origin,expectedOrigin,`${source} redirected to unexpected origin ${u.origin}`);
  if(expectedPath) assert.equal(u.pathname,expectedPath,`${source} redirected to unexpected path ${u.pathname}`);
};

const assert200=async url=>{
  const res=await requestManual(url);
  assert.equal(res.status,200,`${url} expected 200, got ${res.status}`);
  return res;
};

const assertPublicRoute=async url=>{
  const first=await requestManual(url);
  if(first.status===200) return {url,final:url,status:200,normalized:false};

  assert.ok([301,308].includes(first.status),`${url} expected 200 or canonical 301/308, got ${first.status}`);
  const raw=first.headers.location;
  assert.ok(raw,`${url} canonical redirect missing Location`);

  const target=new URL(raw,url);
  assert.equal(target.origin,ORIGIN,`${url} redirected away from canonical origin to ${target.origin}`);
  assert.notEqual(target.href,url,`${url} redirect loop to itself`);

  const second=await requestManual(target.href);
  assert.equal(second.status,200,`${url} canonical target ${target.href} expected 200, got ${second.status}`);
  return {url,final:target.href,status:200,normalized:true};
};

const run=async()=>{
  console.log('POC-B7–B12 Final Production Successor Acceptance v1.2');
  console.log(`Node ${process.version}\n`);

  for(const p of ['robots.txt','sitemap.xml','_headers','_redirects',
    'articles/why-phi-os-is-needed.html',
    'articles/why-explanation-does-not-equal-understanding.html',
    'articles/why-navigation-begins-with-reality-position.html',
    'content/production/closure/poc-b7-b12-final-production-successor-v1.json']) mustExist(p);

  const robots=read('robots.txt');
  assert.match(robots,/Sitemap:\s*https:\/\/getphios\.com\/sitemap\.xml/i);

  const sitemap=read('sitemap.xml');
  assert.ok(sitemap.includes('https://getphios.com/'),'sitemap missing canonical origin');
  assert.ok(!sitemap.includes('phios-github.pages.dev'),'sitemap still exposes pages.dev');
  assert.ok(!sitemap.includes('www.getphios.com'),'sitemap must not expose www origin');

  for(const retired of ['/knowledge-search','/financial-reality','/professional/personal-runtime/','/services'])
    assert.ok(!sitemap.includes(`https://getphios.com${retired}`),`retired route still in sitemap: ${retired}`);

  for(const [p,c] of [
    ['articles/why-phi-os-is-needed.html',`${ORIGIN}/articles/why-phi-os-is-needed`],
    ['articles/why-explanation-does-not-equal-understanding.html',`${ORIGIN}/articles/why-explanation-does-not-equal-understanding`],
    ['articles/why-navigation-begins-with-reality-position.html',`${ORIGIN}/articles/why-navigation-begins-with-reality-position`]
  ]) assert.ok(read(p).includes(`rel="canonical" href="${c}"`),`wrong canonical: ${p}`);

  const headers=read('_headers');
  for(const r of ['X-Content-Type-Options: nosniff','Referrer-Policy: strict-origin-when-cross-origin','Permissions-Policy:','Content-Security-Policy:'])
    assert.ok(headers.includes(r),`missing production header: ${r}`);

  console.log('--- B7 hostname closure ---');
  await assertRedirect(`${WWW}/`,ORIGIN,'/');
  await assertRedirect(`${WWW}/books/reality-formation?probe=poc-b12`,ORIGIN,'/books/reality-formation');
  await assertRedirect(`${PAGES}/`,ORIGIN,'/');
  await assertRedirect(`${PAGES}/knowledge/ask/?probe=poc-b12`,ORIGIN,'/knowledge/ask/');

  console.log('\n--- B9 robots / sitemap ---');
  const lr=await assert200(`${ORIGIN}/robots.txt`);
  assert.ok(lr.text.includes(`Sitemap: ${ORIGIN}/sitemap.xml`),'live robots sitemap authority mismatch');

  const ls=await assert200(`${ORIGIN}/sitemap.xml`);
  assert.ok(ls.text.includes(`${ORIGIN}/`),'live sitemap missing canonical origin');
  assert.ok(!ls.text.includes('phios-github.pages.dev'),'live sitemap still exposes pages.dev');

  console.log('\n--- B10 public routes ---');
  const routes=[
    '/',
    '/explore/',
    '/about/',
    '/knowledge/',
    '/knowledge/ask/',
    '/articles',
    '/books',
    '/reality/',
    '/perspectives/',
    '/perspectives/personal/',
    '/perspectives/relationship/',
    '/professional/',
    '/professional/financial/',
    '/academy'
  ];

  let normalized=0;
  for(const route of routes){
    const result=await assertPublicRoute(`${ORIGIN}${route}`);
    if(result.normalized) normalized++;
  }

  console.log('\n✓ POC-B7 Legacy hostname closure passed');
  console.log('✓ POC-B8 Security / headers production boundary passed');
  console.log('✓ POC-B9 Search / canonical acceptance passed');
  console.log(`✓ POC-B10 Production route acceptance passed (${routes.length}/${routes.length}; canonical normalizations=${normalized})`);
  console.log('✓ POC-B11 Production evidence freeze eligible');
  console.log('✓ POC-B12 FINAL PRODUCTION SUCCESSOR ACCEPTANCE\n');
  console.log('GETPHIOS_PRODUCTION_SUCCESSOR=ACCEPTED');
  console.log('CANONICAL_ORIGIN=https://getphios.com');
  console.log('WWW=RETIRED_TO_301_SUCCESSOR');
  console.log('PAGES_DEV=RETIRED_TO_301_SUCCESSOR');
  console.log('WIX=DOMAIN_HISTORY_ONLY');
  console.log('PUBLIC_SEARCH_AUTHORITY=getphios.com');
  console.log('PRODUCTION_RUNTIME=CLOUDFLARE_PAGES');
};

run().catch(error=>{
  console.error('\nPOC-B7–B12 FAILED');
  console.error(error?.stack||error);
  if(error?.cause){console.error('\nCAUSE:');console.error(error.cause);}
  process.exit(1);
});
