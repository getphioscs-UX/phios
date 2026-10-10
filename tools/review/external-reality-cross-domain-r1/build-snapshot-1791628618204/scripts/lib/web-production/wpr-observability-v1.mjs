import fs from 'node:fs';
import path from 'node:path';
export const BASELINE='021007b80fa20739a726fb28bcda4a9369af48e4';
export const readJson=(file,root=process.cwd())=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
export const exists=(file,root=process.cwd())=>fs.existsSync(path.join(root,file));
export function deriveWprObservation(root=process.cwd()){
  const web=readJson('content/web-production/registries/canonical-web-production-registry-v1.json',root);
  const routes=readJson('content/web-production/registries/wpr-route-registry-v1.json',root);
  const surfaces=readJson('content/web-production/registries/wpr-surface-registry-v1.json',root);
  const deploy=readJson('content/production/visual-article/deployment/vap-w2-cloudflare-production-sha-verification-v1.json',root);
  const assets=readJson('content/registry/public-assets.json',root);
  const cpr=readJson('content/professional/canonical-presentation-runtime/registries/canonical-presentation-registry-v1.json',root);
  const car=readJson('content/professional/canonical-asset-runtime/registries/published-asset-registry-v1.json',root);
  return {
    baselineCommit:BASELINE,
    productionRecordCount:web.productionRecords.length,
    productionStates:[...new Set(web.productionRecords.map(x=>x.productionState))].sort(),
    routeEntryCount:routes.entries.length,
    surfaceEntryCount:surfaces.entries.length,
    lastVerifiedDeploymentCommit:deploy.alignment?.deployedCommit??null,
    deploymentMatchesBaseline:deploy.alignment?.deployedCommit===BASELINE,
    publicAssetBaseUrl:assets.public_base_url??null,
    publicAssetDomainStatus:assets.public_domain_status??null,
    cprProductionRecordCount:cpr.productionRecords?.length??0,
    carPublicationCount:car.publications?.length??0
  };
}
