// Same RUNTIME_DB owner as Commerce, grants, cost ledger and existing answer
// storage. Missing schema never implies zero balance or grants authorization.
export const MEMBERSHIP_STORAGE_TABLES=Object.freeze({
 commerce_subscriptions:'db/migrations/0006_commerce_stripe_r1.sql',
 commerce_checkout_attempts:'db/migrations/0006_commerce_stripe_r1.sql',
 commerce_purchases:'db/migrations/0006_commerce_stripe_r1.sql',
 provider_product_cost_envelopes:'db/migrations/0015_product_cost_envelopes.sql',
 provider_product_cost_entries:'db/migrations/0015_product_cost_envelopes.sql',
 continuity_quota_units:'db/migration-candidates/0019_continuity_quota_units_successor.sql',
 continuity_ask_tasks:'db/migration-candidates/0020_continuity_ask_credit_allocations_successor.sql',
 continuity_ask_allocations:'db/migration-candidates/0019_continuity_ask_credit_allocations.sql',
 continuity_ask_zero_call_outcomes:'db/migration-candidates/0021_continuity_zero_call_outcomes_successor.sql'
});
export async function inspectMembershipStorage(env){
 if(!env.RUNTIME_DB?.prepare)return {state:'STORAGE_BINDING_UNAVAILABLE',binding:'RUNTIME_DB',missing:Object.keys(MEMBERSHIP_STORAGE_TABLES),balanceState:'UNVERIFIED'};
 const rows=(await env.RUNTIME_DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()).results||[],names=new Set(rows.map(r=>r.name)),missing=Object.keys(MEMBERSHIP_STORAGE_TABLES).filter(n=>!names.has(n));
 return {state:missing.length?'STORAGE_SCHEMA_NOT_READY':'READY',binding:'RUNTIME_DB',missing,balanceState:missing.length?'UNVERIFIED':'REQUIRES_OWNER_BALANCE_READ',createsGrants:false,productionMigrationAuthorized:false};
}
export async function requireMembershipStorage(env){const state=await inspectMembershipStorage(env);if(state.state!=='READY')throw Object.assign(Error(state.state),{code:state.state,status:503});return state;}
