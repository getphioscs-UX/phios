import assert from 'node:assert/strict';

// PWS-I2's historical baseline remains required; unrelated later migrations
// may extend the runtime without changing that baseline.
const baselineNames = [
  'platform_foundation', 'initial_runtime',
  'financial_professional_infrastructure', 'book_commerce',
  'pws_universal_registry', 'commerce_stripe_r1', 'account_oidc_sessions',
  'financial_will_encrypted_drafts', 'canonical_account_person',
  'account_method_report_material', 'report_context_sequence_reservation',
  'report_context_admission', 'method_delivery_cache'
];

export function assertPwsMigrationBaseline(migrations) {
  assert.deepEqual(
    migrations.slice(0, baselineNames.length).map(({version, name, file}) => ({version, name, file})),
    baselineNames.map((name, index) => ({
      version: index + 1, name,
      file: `db/migrations/${String(index + 1).padStart(4, '0')}_${name}.sql`
    })),
    'PWS historical migration baseline must remain intact'
  );
  assert.deepEqual(
    migrations.map(migration => migration.version),
    Array.from({length: migrations.length}, (_, index) => index + 1),
    'Later runtime migrations must append in contiguous version order'
  );
}
