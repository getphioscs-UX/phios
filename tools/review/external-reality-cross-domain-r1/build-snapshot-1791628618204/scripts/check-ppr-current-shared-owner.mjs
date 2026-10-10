import {assertPprCurrentSharedOwnerRegistry} from './lib/ppr-current-shared-owner.mjs';
const registry=assertPprCurrentSharedOwnerRegistry();
console.log(`✓ PPR current shared-owner registry ${Object.keys(registry.files).length}/${Object.keys(registry.files).length} passed.`);
console.log('  Historical freezes remain audit evidence; current runtime bytes are owned and checked once, with semantic and forbidden-behaviour gates.');
