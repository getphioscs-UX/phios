import {sha256Stable} from '../../interpretation-runtime/mir7-utils.js';
function fail(code){const e=new Error(code);e.code=code;throw e;}
function dbok(db){if(!db||typeof db.prepare!=='function')fail('CONTINUITY_D1_REQUIRED');return db;}
async function ids(subjectRef,type,key){const h=await sha256Stable({subjectRef,type,key});return {runtimeId:`CONT-${h.slice(0,24).toUpperCase()}`,artifactId:`CONTA-${h.slice(24,48).toUpperCase()}`};}
export function createContinuityD1Store(db,{now=()=>new Date().toISOString()}={}){dbok(db);return Object.freeze({
 async put({subjectRef,type,key,payload}){const {runtimeId,artifactId}=await ids(subjectRef,type,key),ts=now();const state=JSON.stringify({continuity:true,type,key});const body=JSON.stringify(payload);await db.batch([
  db.prepare('INSERT OR IGNORE INTO runtime_users (user_id,status,created_at,updated_at) VALUES (?1,?2,?3,?3)').bind(subjectRef,'active',ts),
  db.prepare('INSERT OR IGNORE INTO runtimes (runtime_id,user_id,status,current_stage,schema_version,state,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?7)').bind(runtimeId,subjectRef,'active','continuity','phi-os.continuity-runtime.v1',state,ts),
  db.prepare('INSERT INTO runtime_artifacts (artifact_id,runtime_id,artifact_type,stage,payload,schema_version,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?7) ON CONFLICT(artifact_id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at').bind(artifactId,runtimeId,type,'continuity',body,'phi-os.continuity-artifact.v1',ts)
 ]);return {runtimeId,artifactId};},
 async get({subjectRef,type,key}){const {runtimeId,artifactId}=await ids(subjectRef,type,key);const row=await db.prepare('SELECT a.payload FROM runtimes r JOIN runtime_artifacts a ON a.runtime_id=r.runtime_id WHERE r.user_id=?1 AND r.runtime_id=?2 AND a.artifact_id=?3 AND a.artifact_type=?4 LIMIT 1').bind(subjectRef,runtimeId,artifactId,type).first();return row?.payload?JSON.parse(row.payload):null;}
 });}
