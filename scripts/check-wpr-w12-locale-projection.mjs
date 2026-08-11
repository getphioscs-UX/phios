import assert from 'node:assert/strict';import {readJson,BASELINE,W12} from './lib/web-production/wpr-composition-v1.mjs';import {resolveLocaleProjection,WebLocaleResolutionError} from '../assets/js/runtime/web-production/locale-resolver.js';
const c=readJson(W12);assert.equal(c.baselineCommit,BASELINE);assert.deepEqual(c.supportedLocales,['en','zh-Hans']);assert.equal(c.rules.fallbackPolicy,'EXPLICIT_ONLY');assert.equal(c.rules.wprMayNotInventTranslation,true);
const cpr=readJson(c.upstreamAuthorityReference);assert.deepEqual(cpr.supportedLocales,['en','zh-Hans']);assert.equal(cpr.fallbackPolicy,'explicit_only');
assert.deepEqual(resolveLocaleProjection({requestedLocale:'zh-CN',availableLocales:['zh-Hans','en']}),{requestedLocale:'zh-Hans',resolvedLocale:'zh-Hans',state:'AVAILABLE',fallbackUsed:false});
assert.throws(()=>resolveLocaleProjection({requestedLocale:'zh-Hans',availableLocales:['en']}),e=>e instanceof WebLocaleResolutionError&&e.code==='WPR_LOCALE_MISSING');
const fb=resolveLocaleProjection({requestedLocale:'zh-Hans',availableLocales:['en'],fallbackLocale:'en',allowExplicitFallback:true});assert.equal(fb.state,'EXPLICIT_FALLBACK');assert.equal(fb.resolvedLocale,'en');
console.log('✓ WPR-W12 Locale Projection passed.');console.log('✓ Locale fallback is explicit-only and missing canonical content never authorizes WPR translation.');
