import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const assert=(condition,message)=>{if(!condition)throw new Error(`CX_R6_HOME_CHECK_FAILED:${message}`)};
const count=(text,pattern)=>(text.match(pattern)||[]).length;

const html=read('index.html');
const css=read('assets/customer-ui/surfaces/home.css');
const js=read('assets/customer-ui/js/surfaces/home.js');
const composition=json('content/customer-experience-rebuild/authority/homepage-customer-composition-v1.json');
const visual=json('content/customer-experience-rebuild/authority/customer-visual-asset-registry-v3.json');
const methodRegistry=json('content/professional/method-production-activation/registries/method-registry-v5.json');

assert(html.includes('data-cx-surface="HOME"'),'HOME_SURFACE_MARKER_MISSING');
assert(count(html,/data-cx-header/g)===1,'ONE_HEADER_MOUNT_REQUIRED');
assert(count(html,/data-cx-footer/g)===1,'ONE_FOOTER_MOUNT_REQUIRED');
assert(count(html,/\/assets\/customer-ui\/js\/shell\.js/g)===1,'ONE_CUSTOMER_SHELL_REQUIRED');
assert(html.includes('/assets/customer-ui/surfaces/home.css'),'HOME_STYLESHEET_MISSING');
assert(html.includes('/assets/customer-ui/js/surfaces/home.js'),'HOME_RUNTIME_MISSING');

const sectionIds=[...html.matchAll(/data-cx-home-section="(H\d{2})"/g)].map(match=>match[1]);
const expected=['H01','H02','H03','H04','H05','H06','H07','H08','H09'];
assert(JSON.stringify(sectionIds)===JSON.stringify(expected),`SECTIONS_MUST_BE_H01_H09_ONCE:${sectionIds.join(',')}`);
assert(JSON.stringify(composition.invariants?.allowedSectionIds)===JSON.stringify(expected),'COMPOSITION_ALLOWED_SECTIONS_DRIFT');
assert(composition.baselineCommit==='543998ca51acad9a57eb9098a7aadafee2caf0f8','BASELINE_COMMIT_DRIFT');

for(const stylesheet of ['/assets/css/phios-public-v2.css','/assets/css/client-intent-router.css','/assets/css/tokens.css','/assets/css/public-experience.css','/assets/css/runtime-spine.css','/assets/css/client-production-surfaces.css','/assets/css/wpr-public-production.css']){
  assert(!html.includes(stylesheet),`LEGACY_STYLESHEET:${stylesheet}`);
}
for(const script of ['/assets/js/public-shell-v2.js','/assets/js/home-v2.js','/assets/js/client-intent-router.js'])assert(!html.includes(script),`LEGACY_SCRIPT:${script}`);
for(const prefix of ['puxr-','public-','rs-','pr-','px2-','wpr-','phi-public-']){
  assert(!html.includes(`class="${prefix}`)&&!html.includes(` ${prefix}`),`LEGACY_CLASS_NAMESPACE:${prefix}`);
  assert(!css.includes(`.${prefix}`),`LEGACY_CSS_NAMESPACE:${prefix}`);
}
assert(!css.includes('!important'),'HOME_CSS_IMPORTANT_FORBIDDEN');
assert(!/font-size\s*:\s*clamp\(/i.test(css),'HOME_PAGE_SPECIFIC_CLAMP_FORBIDDEN');

for(const phrase of ['Reality keeps changing.','Understand where you are.','See what matters.','Choose what comes next.','现实一直在变化。','看清你在哪里。','理解什么正在发生。','决定下一步怎样走。'])assert(html.includes(phrase),`H01_COPY_MISSING:${phrase}`);
assert(html.includes('data-cx-asset="HERO-001"'),'H01_CANONICAL_HERO_MISSING');
assert(count(html,/href="\/reality\/"/g)>=3,'MY_REALITY_CANONICAL_CTA_MISSING');
assert(count(html,/href="\/knowledge\/ask\/"/g)>=3,'ASK_CANONICAL_CTA_MISSING');

for(const oldHref of ['/ask','/ask.html','/personal-runtime','/personal-runtime.html','/financial-reality','/financial-reality.html','/my-reality','/my-reality.html','/reality-journey']){
  assert(!html.includes(`href="${oldHref}"`),`LEGACY_ROUTE_REFERENCE:${oldHref}`);
}

assert(html.includes('data-cx-asset="HERO-012"'),'PERSONAL_FLAGSHIP_VISUAL_MISSING');
assert(html.includes('href="/perspectives/personal/"'),'PERSONAL_FLAGSHIP_ROUTE_MISSING');
assert(html.includes('data-cx-asset="HERO-015"'),'FINANCIAL_FLAGSHIP_VISUAL_MISSING');
assert(html.includes('href="/professional/financial/"'),'FINANCIAL_FLAGSHIP_ROUTE_MISSING');

assert(html.includes('data-cx-home-perspectives'),'PERSPECTIVE_RUNTIME_MOUNT_MISSING');
assert(js.includes("METHOD_AUTHORITY_URL='/content/professional/method-production-activation/registries/method-registry-v5.json'"),'METHOD_AUTHORITY_SOURCE_MISSING');
assert(js.includes("fetch(METHOD_AUTHORITY_URL"),'METHOD_AUTHORITY_NOT_READ_AT_RUNTIME');
assert(js.includes('method?.productionEligible===true'),'PRODUCTION_ELIGIBILITY_NOT_DERIVED');
assert(js.includes('method.blockingReasons.length===0'),'BLOCKING_REASONS_NOT_HONORED');
assert(!/productionEligible\s*:\s*true/.test(js),'HOME_JS_MUST_NOT_CREATE_METHOD_ELIGIBILITY');
assert(composition.sections.find(section=>section.id==='H05')?.hardCodedAvailability===false,'COMPOSITION_H05_HARDCODED');
const eligibleMethods=(methodRegistry.methods||[]).filter(method=>method.productionEligible===true&&Array.isArray(method.blockingReasons)&&method.blockingReasons.length===0).map(method=>method.methodCode).sort();
assert(eligibleMethods.includes('TAROT')&&eligibleMethods.includes('ZI_WEI_DOU_SHU'),'CURRENT_ELIGIBLE_METHOD_AUTHORITY_UNEXPECTED');

for(const id of ['BOOK-1-HARDCOVER','BOOK-2-HARDCOVER','BOOK-3-HARDCOVER','BOOK-4-HARDCOVER','BOOK-5-HARDCOVER'])assert(count(html,new RegExp(`data-cx-asset="${id}"`,'g'))===1,`BOOK_COVER_BINDING:${id}`);
assert(html.includes('data-cx-asset="ILL-001"'),'KNOWLEDGE_LANDSCAPE_VISUAL_MISSING');
const requiredAssets=['HERO-001','HERO-012','HERO-015','ILL-001','BOOK-1-HARDCOVER','BOOK-2-HARDCOVER','BOOK-3-HARDCOVER','BOOK-4-HARDCOVER','BOOK-5-HARDCOVER'];
for(const id of requiredAssets){const entry=(visual.entries||[]).find(item=>item.assetId===id);assert(entry?.available===true&&entry?.publicUrl,`CANONICAL_ASSET_UNAVAILABLE:${id}`)}

for(const phrase of ['should be visible','should not be hidden','bring runtime back to front','Reality Journey should not','现在应该一眼就能看见','前台保持简单，后台继续复杂'])assert(!html.includes(phrase),`INTERNAL_REPAIR_COPY:${phrase}`);
for(const token of ['production runtime','canonical registry','frozen','authority']){
  const visibleText=html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<[^>]+>/g,' ');
  assert(!visibleText.toLowerCase().includes(token.toLowerCase()),`DEVELOPER_COPY_VISIBLE:${token}`);
}

assert(count(html,/data-cx-en=/g)>40&&count(html,/data-cx-zh=/g)>40,'BILINGUAL_COPY_COVERAGE_TOO_LOW');
assert(css.includes('@media (max-width: 72rem)')&&css.includes('@media (max-width: 52rem)')&&css.includes('@media (max-width: 30rem)'),'RESPONSIVE_BREAKPOINTS_MISSING');
assert(css.includes('@media (prefers-reduced-motion: reduce)'),'REDUCED_MOTION_MISSING');
assert(html.includes('href="/articles/"')&&html.includes('href="/figures/"')&&html.includes('href="/knowledge/concepts/"'),'KNOWLEDGE_LANDSCAPE_LINKS_MISSING');
for(const step of ['Understand','Read','Choose','Act','Observe','Review','Continue'])assert(html.includes(`data-cx-en="${step}"`),`H08_STEP_MISSING:${step}`);
for(const phrase of ['Reality will keep changing.','Your understanding should be able to change with it.'])assert(html.includes(phrase),`H09_COPY_MISSING:${phrase}`);

console.log('✓ CX-R6 Homepage Total Rebuild passed.');
console.log(`  H01-H09 only; ${eligibleMethods.join(', ')} are surfaced from current production-eligibility authority.`);
console.log('  Canonical CX shell/assets/routes, EN/zh-Hans copy, responsive composition and legacy-removal gates passed.');
