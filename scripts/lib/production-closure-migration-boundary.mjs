import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {sha256Hex,normalizeMigrationText,verifyMigrationChecksums}from'../../functions/runtime/migrations/migration-runner.js';
export const methodCacheSuccessor={sourceCommit:'4a1c1930bc53b92a0a7478a264eb72c7fbc32789',version:13,name:'method_delivery_cache',file:'db/migrations/0013_method_delivery_cache.sql',checksum:'60bb3141e17295e85c1e289098f5a5435fce433078e305db311ccb8bd5963892',schema_id:'phi-os.method-delivery-cache.v1',immutable:true};
export async function assertCurrentMigrationBoundary({files,historicalFiles,registry,sql,committedSql}) {
  assert.equal(registry.checksum_algorithm,'sha256-sql-canonical-v1');
  // Keep the historical boundary intact while admitting registered append-only
  // successors. Extra disk files must never be treated as registered migrations.
  const registeredFiles=registry.migrations.map(entry=>{
    const expectedFile=`db/migrations/${String(entry.version).padStart(4,'0')}_${entry.name}.sql`;
    assert.match(entry.name,/^[a-z][a-z0-9_]*$/);
    assert.equal(entry.file,expectedFile,'PJA_W0_MIGRATION_PATH_DRIFT');
    return entry.file.slice('db/migrations/'.length);
  });
  assert.deepEqual(registeredFiles.slice(0,13),[...historicalFiles,'0013_method_delivery_cache.sql'],'PJA_W0_HISTORICAL_MIGRATION_TOPOLOGY_DRIFT');
  assert.deepEqual(files,registeredFiles,'PJA_W0_UNREGISTERED_OR_HISTORICAL_MIGRATION_TOPOLOGY_DRIFT');
  const entry=registry.migrations.find(x=>x.version===13),{sourceCommit,...expected}=methodCacheSuccessor;
  assert.deepEqual(entry,expected,'PJA_W0_METHOD_CACHE_REGISTERED_SUCCESSOR_DRIFT');
  assert.equal(await sha256Hex(sql),entry.checksum,'PJA_W0_METHOD_CACHE_SQL_CHECKSUM_DRIFT');
  assert.equal(normalizeMigrationText(sql),normalizeMigrationText(committedSql),'PJA_W0_METHOD_CACHE_COMMITTED_SOURCE_DRIFT');
  await verifyMigrationChecksums(await Promise.all(registry.migrations.map(async migration=>({
    ...migration,sql:await fs.readFile(migration.file,'utf8')
  }))));
  return {status:'PASS',successor:methodCacheSuccessor,historicalMigrationNamesUnchanged:true,
    registeredMigrationCount:registry.migrations.length,registeredSuccessorVersions:registry.migrations.filter(x=>x.version>13).map(x=>x.version),
    remoteMigrationApplied:'UNKNOWN_NOT_AUTHORIZED_BY_CHECK'};
}
