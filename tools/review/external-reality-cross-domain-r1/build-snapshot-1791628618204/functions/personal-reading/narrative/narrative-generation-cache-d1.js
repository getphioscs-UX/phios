import {sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
function fail(code){const e=new Error(code);e.code=code;throw e;}
export function createNarrativeD1CacheAdapter(db,{subjectRef,now=()=>new Date().toISOString()}={}){if(!db||typeof db.prepare!=='function'||typeof db.batch!=='function')fail('W54N7_D1_REQUIRED');const userId=String(subjectRef||'').trim();if(!userId)fail('W54N7_D1_SUBJECT_REQUIRED');async function ids(key){const h=await sha256Stable({userId,key});return {runtimeId:`NARR-${h.slice(0,24).toUpperCase()}`,artifactId:`NARRA-${h.slice(24,48).toUpperCase()}`};}return Object.freeze({
 async get(key){const {runtimeId,artifactId}=await ids(key);const row=await db.prepare('SELECT a.payload FROM runtimes r JOIN runtime_artifacts a ON a.runtime_id=r.runtime_id WHERE r.user_id=?1 AND r.runtime_id=?2 AND a.artifact_id=?3 AND a.artifact_type=?4 LIMIT 1').bind(userId,runtimeId,artifactId,'NARRATIVE_READING_IR').first();return row?.payload?JSON.parse(row.payload):null;},
 async put(key,narrative){const {runtimeId,artifactId}=await ids(key),ts=now(),payload=JSON.stringify(narrative);await db.batch([
  db.prepare('INSERT OR IGNORE INTO runtime_users (user_id,status,created_at,updated_at) VALUES (?1,?2,?3,?3)').bind(userId,'active',ts),
  db.prepare('INSERT OR IGNORE INTO runtimes (runtime_id,user_id,status,current_stage,schema_version,state,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?7)').bind(runtimeId,userId,'active','narrative_ready','phi-os.narrative-cache-runtime.v1','{}',ts),
  db.prepare('INSERT INTO runtime_artifacts (artifact_id,runtime_id,artifact_type,stage,payload,schema_version,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?7) ON CONFLICT(artifact_id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at').bind(artifactId,runtimeId,'NARRATIVE_READING_IR','narrative_ready',payload,'phi-os.narrative-reading-ir.v1',ts)
 ]);return narrative;}
 });}
