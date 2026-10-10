import fs from 'node:fs/promises';
import path from 'node:path';
import {
  DEFAULT_READINESS_LOCALE,
  READINESS_INDEX_PATH,
  READINESS_INDEX_SCHEMA_VERSION,
  READINESS_INVENTORY_PATH
} from './readiness-config.mjs';
import {
  readReadinessRecord,
  validateReadinessRecord
} from './readiness-record.mjs';

function registeredRow(authority, node, locale, result, error = null) {
  const membership = authority.membership.get(node.nodeCode);
  const localized = authority.localizedByNode.get(node.nodeCode)?.locales?.[locale];
  const normalized = result?.normalized;
  const boundary = normalized?.articleBoundary;
  const thesisReady = Boolean(normalized?.canonicalThesis?.statement);
  const mustNotClaim = boundary ? [
    ...(boundary.mustNotClaim?.global ?? []),
    ...(boundary.mustNotClaim?.partSpecific ?? []),
    ...(boundary.mustNotClaim?.nodeSpecific ?? [])
  ] : [];
  const boundaryReady = Boolean(
    boundary?.mustEstablish?.length &&
    mustNotClaim.length &&
    boundary?.includedScope?.length &&
    boundary?.excludedScope?.length
  );
  const blocking = [
    ...(result?.structuralErrors ?? []),
    ...(result?.findings ?? []),
    ...(error ? [{ code: error.code, message: error.message }] : [])
  ];
  return {
    bookCode: node.bookCode ?? membership?.bookCode ?? null,
    partCode: node.partCode ?? membership?.blueprintNode.partCode ?? null,
    partTitle: membership?.part?.title ?? null,
    nodeCode: node.nodeCode,
    canonicalTitle: membership?.blueprintNode.titleZhHans ?? localized?.displayQuestion ?? null,
    canonicalQuestion: localized?.displayQuestion ?? null,
    nodeType: node.nodeType,
    registryStatus: node.registryStatus,
    productionPriority: membership?.blueprintNode.productionPriority ?? null,
    previousNode: node.relationships?.prerequisiteNodeCodes?.[0] ?? null,
    nextNode: node.relationships?.nextNodeCodes ?? [],
    supportingQuestionCount: node.supportingQuestionCodes?.length ?? 0,
    localizedContentStatus: localized?.contentStatus ?? 'not_ready',
    canonicalThesisStatus: thesisReady ? 'ready' : 'not_ready',
    boundaryStatus: boundaryReady ? 'ready' : 'not_ready',
    readinessFileStatus: result ? (result.legacy ? 'legacy_preserved' : 'present') : 'missing',
    reviewStatus: normalized?.review?.status ?? 'not_assessed',
    productionStatus: result?.productionStatus ?? 'production_blocked',
    exportability: result?.exportability ?? 'blocked',
    blockingReason: [...new Set(blocking.map(item => item.code))],
    missingFields: normalized?.productionReadiness?.missingFields ?? []
  };
}

function plannedRows(authority) {
  return [...authority.planned.values()].map(entry => ({
    bookCode: entry.bookCode,
    partCode: entry.blueprintNode.partCode,
    partTitle: entry.part?.title ?? null,
    nodeCode: entry.blueprintNode.nodeCode,
    canonicalTitle: entry.blueprintNode.titleZhHans,
    blueprintStatus: entry.blueprintNode.status,
    registryStatus: 'not_registered',
    readinessStatus: 'not_created',
    exportability: 'not_registered'
  }));
}

function countBy(rows, key) {
  return Object.fromEntries([...new Set(rows.map(row => row[key] ?? 'null'))]
    .sort()
    .map(value => [value, rows.filter(row => (row[key] ?? 'null') === value).length]));
}

function markdownCell(value) {
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'None';
  if (value === null || value === undefined || value === '') return 'None';
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function matrix(rows) {
  const headers = [
    'Book',
    'Part',
    'Node Code',
    'Canonical Thesis',
    'Article Boundary',
    'Supporting Questions',
    'Sequence Boundary',
    'Source Boundary',
    'Review Status',
    'Production Status',
    'Exportability',
    'Blocking Reason'
  ];
  const lines = [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`
  ];
  for (const row of rows) {
    lines.push(`| ${[
      row.bookCode,
      row.partCode,
      row.nodeCode,
      row.canonicalThesisStatus,
      row.boundaryStatus,
      row.supportingQuestionCount,
      `${row.previousNode ?? 'ENTRY'} → ${row.nextNode.length ? row.nextNode.join(', ') : 'END'}`,
      row.blockingReason.includes('SOURCE_BOUNDARY_NOT_READY') ? 'not_ready' : 'ready',
      row.reviewStatus,
      row.productionStatus,
      row.exportability,
      row.blockingReason
    ].map(markdownCell).join(' | ')} |`);
  }
  return lines.join('\n');
}

function plannedMatrix(rows) {
  const lines = [
    '| Book | Part | Node Code | Blueprint Status | Registry Status | Readiness |',
    '| --- | --- | --- | --- | --- | --- |'
  ];
  for (const row of rows) {
    lines.push(`| ${[
      row.bookCode,
      row.partCode,
      row.nodeCode,
      row.blueprintStatus,
      row.registryStatus,
      row.readinessStatus
    ].map(markdownCell).join(' | ')} |`);
  }
  return lines.join('\n');
}

export async function buildReadinessInventory(
  authority,
  locale = DEFAULT_READINESS_LOCALE
) {
  const registeredNodes = [];
  for (const node of authority.registeredNodes) {
    try {
      const record = await readReadinessRecord(authority, node.nodeCode, locale);
      const result = validateReadinessRecord(authority, record);
      registeredNodes.push(registeredRow(authority, node, locale, result));
    } catch (error) {
      registeredNodes.push(registeredRow(authority, node, locale, null, error));
    }
  }
  const plannedNodes = plannedRows(authority);
  const locales = [...new Set(authority.localizedContent.localizedContent.flatMap(
    record => Object.keys(record.locales ?? {})
  ))].sort();
  const summary = {
    booksDetected: [...new Set(authority.blueprints.map(
      entry => entry.value.bookCode
    ).filter(Boolean))].sort(),
    blueprintPartsDetected: [...new Set(authority.blueprints.flatMap(
      entry => entry.value.parts.map(part => part.partCode)
    ))].sort(),
    registeredPartsDetected: [...new Set(
      registeredNodes.map(row => row.partCode).filter(Boolean)
    )].sort(),
    canonicalNodesDetected: registeredNodes.length,
    blueprintPlannedNodesDetected: plannedNodes.length,
    localesDetected: locales,
    supportingQuestionsDetected: authority.supportingQuestions.supportingQuestions.length,
    readinessRecordsPresent: registeredNodes.filter(
      row => row.readinessFileStatus !== 'missing'
    ).length,
    existingLegacyReadinessRecordsPreserved: registeredNodes.filter(
      row => row.readinessFileStatus === 'legacy_preserved'
    ).length,
    productionReady: registeredNodes.filter(
      row => row.productionStatus === 'production_ready'
    ).length,
    readyForEditorialReview: registeredNodes.filter(
      row => row.productionStatus === 'ready_for_editorial_review'
    ).length,
    blocked: registeredNodes.filter(row => row.exportability === 'blocked').length,
    registeredNodeDistribution: countBy(registeredNodes, 'partCode'),
    blueprintPlannedDistribution: countBy(plannedNodes, 'partCode')
  };
  return {
    readinessIndexSchemaVersion: READINESS_INDEX_SCHEMA_VERSION,
    locale,
    authority: {
      registryPath: 'content/knowledge/registry/nodes.json',
      registryVersion: authority.versions.registryVersion,
      registryHash: authority.versions.registryHash,
      blueprintPaths: authority.blueprints.map(entry => entry.relativePath)
    },
    summary,
    registeredNodes,
    blueprintPlannedNodes: plannedNodes,
    futurePartPolicy: {
      part6ThroughPart14:
        'Not Registered. Infrastructure accepts future Registry and Blueprint records without a Book- or Part-specific Schema.',
      canonicalIdentityCreationByInventory: false
    }
  };
}

export function renderReadinessInventory(inventory) {
  const summary = inventory.summary;
  return `# PJA-W2F-A Canonical Readiness Inventory

## Authority

- Canonical identity: \`${inventory.authority.registryPath}\`
- Registry version: \`${inventory.authority.registryVersion}\`
- Registry hash: \`${inventory.authority.registryHash}\`
- Blueprint coverage: ${inventory.authority.blueprintPaths.map(value => `\`${value}\``).join(', ')}
- Locale: \`${inventory.locale}\`

## Universal Coverage

- Books detected from Blueprint: ${summary.booksDetected.join(', ') || 'None'}
- Parts detected from Blueprint: ${summary.blueprintPartsDetected.join(', ') || 'None'}
- Parts with registered Canonical Nodes: ${summary.registeredPartsDetected.join(', ') || 'None'}
- Registered Canonical Nodes: ${summary.canonicalNodesDetected}
- Blueprint-planned, not registered Nodes: ${summary.blueprintPlannedNodesDetected}
- Supporting Questions: ${summary.supportingQuestionsDetected}
- Production Ready: ${summary.productionReady}
- Ready for Editorial Review: ${summary.readyForEditorialReview}
- Blocked: ${summary.blocked}

## Registered Canonical Node Matrix

${matrix(inventory.registeredNodes)}

## Blueprint-planned Nodes Not Yet Registered

These entries are planning records, not Canonical Registry identities. No Readiness file is created for them.

${plannedMatrix(inventory.blueprintPlannedNodes)}

## Parts 6–14

Not Registered in the current Canonical Node Registry or Book I Blueprint. This is not an error.
The Resolver, Readiness Schema, Initializer, Validator and Exporter integration accept future
Registry-driven Book and Part identifiers without changing the Contract or adding a Book-specific Schema.

## Human Authority Boundary

The Initializer writes deterministic identity, hierarchy, sequence, localization references,
Supporting Question references, version bindings and missing-field findings only. It does not
write or approve Canonical Thesis, Must Establish, Must Not Claim, Part Thesis, scientific
accuracy, production approval, publication readiness or publication.
`;
}

export async function writeReadinessInventory(authority, locale) {
  const inventory = await buildReadinessInventory(authority, locale);
  const indexPath = path.join(authority.root, READINESS_INDEX_PATH);
  const documentPath = path.join(authority.root, READINESS_INVENTORY_PATH);
  await fs.mkdir(path.dirname(indexPath), { recursive: true });
  await fs.mkdir(path.dirname(documentPath), { recursive: true });
  await fs.writeFile(indexPath, `${JSON.stringify(inventory, null, 2)}\n`);
  await fs.writeFile(documentPath, renderReadinessInventory(inventory));
  return inventory;
}
