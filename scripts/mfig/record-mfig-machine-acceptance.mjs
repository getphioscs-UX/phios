import {P,read,stable,sha,manifestPath,carPath,requestedIds,ids,writeFile,entryById} from './mfig-lib.mjs';
const selected=requestedIds();
for(const id of selected){
 const m=read(manifestPath(id)); const c=read(carPath(id)); const e=entryById(id); m.machineStatus='MACHINE_ACCEPTED'; m.stale=false; writeFile(manifestPath(id),stable(m)); c.machineAccepted=true; c.handoffStatus=e.carPublicationEligible?'CAR_CANDIDATE_ELIGIBLE':'BLOCKED_BY_CANONICAL_CAR_ELIGIBILITY'; c.productionManifestDigest=sha(manifestPath(id)); writeFile(carPath(id),stable(c)); console.log(`✓ ${id} machine acceptance recorded (${c.handoffStatus})`);
}
const rows=ids().map(id=>{const m=read(manifestPath(id)),c=read(carPath(id));return {mfigId:id,status:m.machineStatus,productionManifestDigest:sha(manifestPath(id)),stale:m.stale,carEligible:c.canonicalCarPublicationEligible,carHandoffStatus:c.handoffStatus};});
writeFile(`${P.prod}/mfig-machine-acceptance-registry-v1.json`,stable({schemaVersion:'PHI-OS-MFIG-MACHINE-ACCEPTANCE-REGISTRY-v1.0.0',status:'ACTIVE_MACHINE_GENERATED',entries:rows,summary:{count:50,machineAccepted:rows.filter(x=>x.status==='MACHINE_ACCEPTED').length,carEligible:rows.filter(x=>x.carEligible).length,carRestricted:rows.filter(x=>!x.carEligible).length}}));
