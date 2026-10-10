import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export const VAP_W5_BASELINE = 'cdcb11be3e2db494fa1c40c7814604e2de31f34e';
export const VAP_W5_CONTRACT = 'content/production/visual-article/contracts/vap-w5-pja-production-brief-export-v1.json';
export const VAP_W5_ACCEPTANCE = 'content/production/visual-article/activation/vap-w5-pja-production-brief-export-v1.json';
export const VAP_W4_ELIGIBILITY = 'content/production/visual-article/eligibility/visual-article-production-eligibility-v1.json';

export const VAP_W5_FROZEN_RUNTIME_SOURCES = [
  'scripts/export-knowledge-production-brief.mjs',
  'scripts/lib/knowledge-production/production-config.mjs',
  'scripts/check-pja-w2e-r1-production-brief-hardening.mjs'
];

const normalize = source => source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const sha = source => crypto.createHash('sha256').update(normalize(source), 'utf8').digest('hex');
export const stableValue = value => Array.isArray(value)
  ? value.map(stableValue)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]))
    : value;
export const stableJson = value => `${JSON.stringify(stableValue(value), null, 2)}\n`;

function gitAvailable(root) {
  try {
    execFileSync('git', ['rev-parse', '--git-dir'], { cwd: root, stdio: 'ignore', windowsHide: true });
    return true;
  } catch {
    return false;
  }
}

function readBaselineText(root, relative) {
  if (gitAvailable(root)) {
    try {
      return execFileSync('git', ['show', `${VAP_W5_BASELINE}:${relative}`], {
        cwd: root,
        encoding: 'utf8',
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });
    } catch (error) {
      throw new Error(`VAP_W5_BASELINE_SOURCE_UNAVAILABLE: ${relative}: ${error.message}`);
    }
  }
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function extractConstant(source, name) {
  const match = source.match(new RegExp(`export const ${name} = ['\"]([^'\"]+)['\"]`));
  return match?.[1] || null;
}

export function buildVapW5Acceptance(root) {
  const exporter = readBaselineText(root, VAP_W5_FROZEN_RUNTIME_SOURCES[0]);
  const config = readBaselineText(root, VAP_W5_FROZEN_RUNTIME_SOURCES[1]);
  const hardening = readBaselineText(root, VAP_W5_FROZEN_RUNTIME_SOURCES[2]);
  const eligibility = JSON.parse(fs.readFileSync(path.join(root, VAP_W4_ELIGIBILITY), 'utf8'));
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

  const defaultOutput = extractConstant(config, 'DEFAULT_BRIEF_OUTPUT');
  const defaultLocale = extractConstant(config, 'DEFAULT_LOCALE');
  const briefSchemaVersion = extractConstant(config, 'BRIEF_SCHEMA_VERSION');
  const productionToolVersion = extractConstant(config, 'PRODUCTION_TOOL_VERSION');

  const markers = [
    '# ${nodeCode} Canonical Article Production Brief',
    '## 1. Brief Identity',
    '## 2. Canonical Node Identity',
    '## 4. Canonical Thesis',
    '## 5. Article Boundary',
    '## 6. Editorial Contract',
    '## 7. Structured Article Contract',
    '## 8. Claim Governance',
    '## 9. Source Governance',
    '## 10. Review Governance',
    '## 11. Node-specific Inputs',
    '## 12. Package Output Contract',
    '## 13. Forbidden Actions'
  ];
  const markerChecks = Object.fromEntries(markers.map(marker => [marker, exporter.includes(marker)]));
  const allMarkersPresent = Object.values(markerChecks).every(Boolean);

  if (packageJson.scripts?.['knowledge:export-brief'] !== 'node scripts/export-knowledge-production-brief.mjs') {
    throw new Error('VAP_W5_EXISTING_EXPORT_COMMAND_CHANGED');
  }
  if (defaultOutput !== 'dist/knowledge-production-briefs') throw new Error('VAP_W5_DEFAULT_OUTPUT_CHANGED');
  if (defaultLocale !== 'zh-Hans') throw new Error('VAP_W5_DEFAULT_LOCALE_CHANGED');
  if (!allMarkersPresent) throw new Error('VAP_W5_BRIEF_CONTRACT_MARKERS_INCOMPLETE');
  if (!exporter.includes("briefType: 'canonical_article_production_brief'")) throw new Error('VAP_W5_BRIEF_TYPE_NOT_ARTICLE');
  if (!exporter.includes('Controlled input snapshot only. This document is not a Source of Truth')) throw new Error('VAP_W5_AUTHORITY_BOUNDARY_MISSING');
  if (!exporter.includes('Do not commit, push, deploy, invoke an AI API, or write to Runtime.')) throw new Error('VAP_W5_FORBIDDEN_ACTIONS_MISSING');
  if (!hardening.includes('The generated package remains draft-only')) throw new Error('VAP_W5_HARDENING_ACCEPTANCE_MISSING');

  const eligible = eligibility.entries.filter(entry => entry.articleProductionEligible === true);
  const wave1StandardPjaTargets = eligible.filter(entry =>
    entry.dispatchTarget === 'PJA' &&
    entry.executionBoundary?.standardPjaArticleDraftExporterAllowed === true
  );
  const wave1PjaAdapterGated = eligible.filter(entry =>
    entry.dispatchTarget === 'PJA' &&
    entry.executionBoundary?.standardPjaArticleDraftExporterAllowed !== true
  );
  const wave1NonPjaEligible = eligible.filter(entry => entry.dispatchTarget !== 'PJA');

  const result = {
    schemaVersion: 'PHI-OS-VAP-W5-PJA-PRODUCTION-BRIEF-EXPORT-ACCEPTANCE-v1.0.0',
    acceptanceCode: 'PHI-OS-VAP-W5-PJA-PRODUCTION-BRIEF-EXPORT-ACCEPTANCE-v1',
    acceptanceVersion: '1.0.0',
    work: 'VAP-W5',
    phase: 'VAP-B_ARTICLE_PRODUCTION_ACTIVATION',
    status: 'EXISTING_PJA_PRODUCTION_BRIEF_EXPORT_ACCEPTED_NO_REIMPLEMENTATION',
    baselineCommit: VAP_W5_BASELINE,
    contractReference: VAP_W5_CONTRACT,
    existingRuntime: {
      npmScript: 'knowledge:export-brief',
      npmCommand: 'npm run knowledge:export-brief -- <NODE_CODE>',
      npmCommandWithLocaleAndReport: 'npm run knowledge:export-brief -- <NODE_CODE> --locale zh-Hans --json-report',
      exporterPath: VAP_W5_FROZEN_RUNTIME_SOURCES[0],
      defaultLocale,
      defaultOutputDirectory: defaultOutput,
      outputPattern: `${defaultOutput}/<NODE_CODE>-production-brief.md`,
      localizedOutputPattern: `${defaultOutput}/<NODE_CODE>.<locale>-production-brief.md`,
      jsonReportPattern: `${defaultOutput}/<brief-name>.report.json`,
      briefSchemaVersion,
      productionToolVersion,
      briefType: 'canonical_article_production_brief',
      runtimeReimplementedByVapW5: false
    },
    briefContract: {
      sections: [
        'Identity',
        'Canonical Node Identity',
        'Localized Identity',
        'Canonical Thesis',
        'Article Boundary',
        'Editorial Contract',
        'Structured Article Contract',
        'Claim Governance',
        'Source Governance',
        'Review Governance',
        'Node-specific Inputs',
        'Package Output Contract',
        'Forbidden Actions'
      ],
      markerChecks,
      allRequiredMarkersPresent: allMarkersPresent,
      controlledInputSnapshotOnly: true,
      sourceOfTruth: false,
      approvalRecord: false,
      publicationRecord: false,
      publicArticleBody: false
    },
    vapEligibilityIntegration: {
      eligibilityReference: VAP_W4_ELIGIBILITY,
      requiresVapW4ArticleProductionEligibility: true,
      wave1ArticleEligibleNodeCodes: eligible.map(entry => entry.nodeCode),
      wave1StandardPjaExporterTargetNodeCodes: wave1StandardPjaTargets.map(entry => entry.nodeCode),
      wave1PjaAdapterGatedNodeCodes: wave1PjaAdapterGated.map(entry => entry.nodeCode),
      wave1NonPjaEligibleNodeCodes: wave1NonPjaEligible.map(entry => entry.nodeCode),
      noWave1StandardPjaExportExecutedByVapW5: true,
      reason: 'VAP-W5 accepts the existing PJA Article brief exporter without overriding VAP-W3 execution-mode and adapter boundaries. Current Wave 1 ARTICLE eligibility is reconciliation-gated at PJA, while MULTI_ASSET is dispatched to CAR.'
    },
    effects: {
      productionBriefGeneratedByAcceptance: false,
      exporterSourceModified: false,
      candidateCreated: false,
      providerInvoked: false,
      networkGenerationCallMade: false,
      publicationCreated: false
    },
    sourceDigests: Object.fromEntries(VAP_W5_FROZEN_RUNTIME_SOURCES.map(relative => [
      relative,
      `sha256:${sha(readBaselineText(root, relative))}`
    ]))
  };

  const digestInput = { ...result };
  delete digestInput.acceptanceDigest;
  result.acceptanceDigest = `sha256:${sha(stableJson(digestInput))}`;
  return result;
}
