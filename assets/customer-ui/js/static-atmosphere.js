const REGISTRY_URL='/content/product-visual-platform-r1/static-assets/pvp-r1-vis-w30-static-production-asset-registry-v1.json';
const EVIDENCE_URL='/content/product-visual-platform-r1/static-assets/evidence/pvp-r1-vis-w31-remote-verification-v1.json';

const CSS_VAR_BY_ID=Object.freeze({
  'VIS-TEX-001':'--pvp-vis-tex-001',
  'VIS-TEX-002':'--pvp-vis-tex-002',
  'VIS-TEX-003':'--pvp-vis-tex-003',
  'VIS-TEX-004':'--pvp-vis-tex-004',
  'VIS-DEC-001':'--pvp-vis-dec-001',
  'VIS-DEC-002':'--pvp-vis-dec-002',
  'VIS-DEC-003':'--pvp-vis-dec-003',
  'VIS-DEC-004':'--pvp-vis-dec-004'
});

async function getJson(url){
  const response=await fetch(url,{cache:'force-cache'});
  if(!response.ok)throw new Error(`PVP_STATIC_ASSET_${response.status}:${url}`);
  return response.json();
}

function verifiedIds(evidence){
  if(evidence?.status!=='REMOTE_VERIFIED_ALL_SELECTED')return new Set();
  return new Set((evidence.results||[]).filter(x=>x.ok===true&&x.httpStatus===200).map(x=>x.assetId));
}

export async function installStaticAtmosphere(scope=document){
  try{
    const [registry,evidence]=await Promise.all([getJson(REGISTRY_URL),getJson(EVIDENCE_URL)]);
    const verified=verifiedIds(evidence);
    let active=0;
    for(const item of registry?.backgroundBindings||[]){
      if(!verified.has(item.assetId))continue;
      const cssVar=CSS_VAR_BY_ID[item.assetId];
      if(!cssVar||!item.publicUrl)continue;
      scope.documentElement?.style?.setProperty(cssVar,`url("${item.publicUrl}")`);
      active+=1;
    }
    if(active===8){
      scope.documentElement.dataset.pvpStaticAtmosphere='remote-verified';
      scope.body?.setAttribute('data-pvp-static-atmosphere','active');
    }
  }catch(error){
    scope.documentElement.dataset.pvpStaticAtmosphere='fail-closed';
    console.info('[PVP static atmosphere] inactive until W31 remote verification',error.message);
  }
}
