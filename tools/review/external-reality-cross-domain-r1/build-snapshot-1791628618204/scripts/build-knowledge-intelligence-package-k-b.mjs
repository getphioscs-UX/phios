import {writePackageKB} from './lib/knowledge-intelligence/package-k-b-v1.mjs';
const {relationshipMechanism,crossDomain}=await writePackageKB();
console.log(`Knowledge Intelligence Package K-B rebuilt: ${relationshipMechanism.recordCount} relationship/mechanism records, ${crossDomain.recordCount} domain records, ${crossDomain.linkCount} cross-domain links.`);
