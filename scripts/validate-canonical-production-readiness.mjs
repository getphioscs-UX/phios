import fs from 'node:fs/promises';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import { loadKnowledgeAuthority } from './lib/knowledge-readiness/authority-loader.mjs';
import {
  READINESS_SCHEMA_PATH,
  formatReadinessError,
  parseReadinessArgs
} from './lib/knowledge-readiness/readiness-config.mjs';
import {
  auditAuthorityIntegrity,
  auditThesisDuplication,
  readReadinessRecord,
  validateReadinessRecord
} from './lib/knowledge-readiness/readiness-record.mjs';
import { resolveKnowledgeScope } from './lib/knowledge-readiness/scope-resolver.mjs';

const root = process.cwd();

async function main() {
  const args = parseReadinessArgs(process.argv.slice(2));
  const authority = await loadKnowledgeAuthority(root);
  const resolved = resolveKnowledgeScope(authority, args);
  const schema = JSON.parse(await fs.readFile(
    path.join(root, READINESS_SCHEMA_PATH),
    'utf8'
  ));
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    strictRequired: false,
    strictTypes: false
  });
  const validateSchema = ajv.compile(schema);
  const results = [];
  for (const node of resolved.nodes) {
    try {
      const record = await readReadinessRecord(
        authority,
        node.nodeCode,
        args.locale
      );
      const schemaErrors = [];
      if (!record.legacy && !validateSchema(record.raw)) {
        schemaErrors.push({
          code: 'READINESS_SCHEMA_INVALID',
          message: ajv.errorsText(validateSchema.errors),
          field: null,
          severity: 'blocking'
        });
      }
      const result = validateReadinessRecord(authority, record);
      result.structuralErrors.push(...schemaErrors);
      if (schemaErrors.length) {
        result.structurallyValid = false;
        result.productionReady = false;
        result.productionStatus = 'production_blocked';
        result.exportability = 'blocked';
      }
      results.push(result);
    } catch (error) {
      results.push({
        nodeCode: node.nodeCode,
        locale: args.locale,
        structurallyValid: false,
        structuralErrors: [{
          code: error.code ?? 'READINESS_SCHEMA_INVALID',
          message: error.message,
          field: null,
          severity: 'blocking'
        }],
        findings: [],
        productionReady: false,
        productionStatus: 'production_blocked',
        exportability: 'blocked'
      });
    }
  }
  const authorityFindings = auditAuthorityIntegrity(authority);
  const duplicationFindings = auditThesisDuplication(results);
  const report = {
    selector: resolved.selector,
    selectorType: resolved.selectorType,
    registrationState: resolved.registrationState,
    locale: args.locale,
    registeredValidated: results.length,
    blueprintPlannedNotRegistered: resolved.plannedNodes.length,
    productionReady: results.filter(result => result.productionReady).length,
    readyForEditorialReview: results.filter(
      result => result.productionStatus === 'ready_for_editorial_review'
    ).length,
    blocked: results.filter(result => !result.productionReady).length,
    structurallyInvalid: results.filter(result => !result.structurallyValid).length,
    authorityFindings,
    duplicationFindings,
    results: results.map(result => ({
      nodeCode: result.nodeCode,
      locale: result.locale,
      productionStatus: result.productionStatus,
      exportability: result.exportability,
      structurallyValid: result.structurallyValid,
      blockingReason: [...new Set([
        ...(result.structuralErrors ?? []),
        ...(result.findings ?? [])
      ].map(item => item.code))]
    }))
  };
  if (args.options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`READINESS VALIDATION: ${resolved.selector}`);
    for (const result of report.results) {
      console.log(
        `  ${result.nodeCode}  ${result.productionStatus.toUpperCase()}  ` +
        `${result.blockingReason.join(', ') || 'NONE'}`
      );
    }
    if (!resolved.nodes.length) {
      console.log('  Registered Canonical Nodes: 0 (NOT_REGISTERED)');
    }
    console.log(`  Blueprint-planned, not registered: ${report.blueprintPlannedNotRegistered}`);
    console.log(`  Production Ready: ${report.productionReady}`);
    console.log(`  Blocked: ${report.blocked}`);
  }
  if (
    report.structurallyInvalid ||
    authorityFindings.length ||
    duplicationFindings.length
  ) {
    process.exitCode = 2;
  }
}

main().catch(error => {
  console.error(formatReadinessError(error));
  process.exitCode = 2;
});
