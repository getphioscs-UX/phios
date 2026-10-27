// Test-process-only dependency replacement. Never imported by application code.
import {registerHooks} from 'node:module';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
if(process.env.REPORT_ZERO_COST_REPLAY!=='true'||!process.argv.includes('--isolated-checkout-fixture')||!process.argv[1]?.endsWith('check-commerce-stripe-r1.mjs'))throw Error('COMMERCE_FIXTURE_TEST_PROCESS_REQUIRED');
globalThis.fetch=async()=>{throw Error('COMMERCE_OFFLINE_FIXTURE_NETWORK_FORBIDDEN');};
const target=pathToFileURL(path.resolve('functions/pws/commercial/stripe-product-registry.js')).href;
registerHooks({load(url,context,next){const result=next(url,context);if(url!==target)return result;
 const source=typeof result.source==='string'?result.source:new TextDecoder().decode(result.source),anchor='export const STRIPE_PRODUCT_REGISTRY = Object.freeze(rows.map(row => Object.freeze(row)));';
 if(source.split(anchor).length!==2)throw Error('COMMERCE_FIXTURE_REGISTRY_ANCHOR_CHANGED');
 return{...result,source:source.replace(anchor,`for(const row of rows){if(!row.checkoutBlockedReason&&(row.qaPriceRebindRequired||row.qaPriceVerificationRequired)){row.qaPriceId='price_offline_fixture_'+row.productId.replaceAll('-','_');row.qaPriceRebindRequired=false;row.offlineCheckoutFixture=true;}}
${anchor}`)};
}});
