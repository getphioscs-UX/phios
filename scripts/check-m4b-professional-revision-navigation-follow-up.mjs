import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const read = relative => fs.readFile(path.join(root, relative), 'utf8');
const json = async relative => JSON.parse(await read(relative));
const load = relative => import(
  `${pathToFileURL(path.join(root, relative)).href}?w2c=${Date.now()}`
);

const [
  page,
  controller,
  css,
  enLocale,
  zhLocale,
  workspaceModule,
  consentModule,
  sourceModule,
  revisionModule,
  navigationModule,
  timelineModule,
  projectionModule
] = await Promise.all([
  read('professional-workspace.html'),
  read('assets/js/pages/professional-workspace.js'),
  read('assets/css/professional-workspace.css'),
  read('assets/js/locales/en/professional.js'),
  read('assets/js/locales/zh-Hans/professional.js'),
  load('functions/professional/workspace/professional-workspace-contract.js'),
  load('functions/professional/consent/professional-consent-contract.js'),
  load('functions/professional/workspace/professional-source-contract.js'),
  load('functions/professional/workspace/professional-reading-revision-contract.js'),
  load('functions/professional/workspace/professional-navigation-consideration-contract.js'),
  load('functions/professional/workspace/professional-follow-up-timeline-contract.js'),
  load('functions/professional/workspace/professional-w2c-projection.js')
]);

const waiting = workspaceModule.createProfessionalWorkspace({
  workspace_id: 'workspace_w2c',
  client_id: 'client_w2c',
  professional_id: 'professional_w2c',
  service_id: 'human_design_runtime_interpretation',
  current_runtime_id: 'runtime_w2c'
});
const consent = consentModule.createProfessionalConsent({
  consent_id: 'consent_w2c',
  client_id: waiting.client_id,
  professional_id: waiting.professional_id,
  service_id: waiting.service_id,
  purpose: 'Professional Reading, Navigation and follow-up review',
  consent_version: '1.0.0',
  duration: 'thirty_days',
  explicit_action: true,
  runtime_ids: [waiting.current_runtime_id],
  resource_scopes: ['reading', 'navigation'],
  human_design_scopes: [],
  acknowledgements: {
    scope_selected: true,
    data_accuracy: true,
    future_access_revocable: true,
    birth_data_voluntarily_submitted: false,
    birth_time_accuracy_affects_result: false,
    interpretive_not_diagnostic: true,
    future_access_revocation_understood: true
  }
}, {
  now: '2026-07-27T00:00:00.000Z'
});
const workspace = workspaceModule.activateProfessionalWorkspace(
  waiting,
  consent,
  { now: '2026-07-28T00:00:00.000Z' }
);

const ruleSource = sourceModule.createProfessionalSourceReference({
  source_reference_id: 'source_rule_w2c',
  source_type: 'rule_inference',
  source_record_id: 'reading_w2c'
});
const externalSource = sourceModule.createProfessionalSourceReference({
  source_reference_id: 'source_hd_w2c',
  source_type: 'external_reader_interpretation',
  source_record_id: 'hd_w2c',
  reader_type: 'human_design',
  limitations: ['Interpretation only']
});

const firstRevision = revisionModule.createProfessionalReadingRevision(
  workspace,
  {
    revision_id: 'professional_revision_1',
    original_reading_id: 'reading_w2c',
    target: 'runtime_reading',
    action: 'remove_unsupported_inference',
    original_version: 1,
    revised_version: 2,
    original_text: 'A certain causal conclusion.',
    revised_text: 'A pattern that remains unverified.',
    reason: 'The source does not support causation.',
    client_visible: true,
    source_reference: ruleSource
  },
  { now: '2026-07-28T02:00:00.000Z' }
);
const secondRevision = revisionModule.reviseProfessionalReadingRevision(
  workspace,
  firstRevision,
  {
    revision_id: 'professional_revision_2',
    action: 'add_clarification',
    revised_version: 3,
    revised_text: 'A pattern that remains unverified pending observation.',
    reason: 'Clarified what remains unknown.',
    client_visible: true,
    source_reference: ruleSource
  },
  { now: '2026-07-29T02:00:00.000Z' }
);
assert.equal(firstRevision.runtime_reading_overwritten, false);
assert.equal(firstRevision.professional_overlay_only, true);
assert.equal(secondRevision.previous_revision_id, firstRevision.revision_id);
assert.equal(secondRevision.original_text, firstRevision.revised_text);
assert.equal(firstRevision.revised_text, 'A pattern that remains unverified.');
assert.throws(() => revisionModule.createProfessionalReadingRevision(
  workspace,
  {
    revision_id: 'invalid_external_revision',
    original_reading_id: 'reading_w2c',
    target: 'runtime_reading',
    action: 'revise',
    original_version: 1,
    revised_version: 2,
    original_text: 'Original',
    revised_text: 'Revised',
    reason: 'Invalid source merge',
    source_reference: externalSource
  }
), /independent layer/);

const consideration =
  navigationModule.createProfessionalNavigationConsideration(
    workspace,
    {
      consideration_id: 'consideration_w2c',
      navigation_reference_id: 'navigation_w2c',
      current_runtime_position: 'Choice remains open.',
      available_paths: ['Pause and observe', 'Proceed with a reversible step'],
      constraints: ['Current financial responsibility'],
      required_evidence: ['Observe decision stability over one week'],
      low_risk_next_step: 'Record the decision after emotional clarity.',
      review_point: 'Review after seven days.',
      stop_condition: 'Stop if financial safety declines.',
      escalation_condition: 'Seek regulated advice for financial decisions.',
      source_references: [ruleSource, externalSource]
    },
    { now: '2026-07-28T03:00:00.000Z' }
  );
assert.equal(consideration.includes_external_reader, true);
assert.equal(
  consideration.external_reader_role,
  'navigation_consideration_only'
);
assert.equal(consideration.required_action, null);
assert.equal(consideration.user_choice_required, true);
assert.equal(consideration.navigation_contract_overwritten, false);
assert.throws(
  () => navigationModule.createProfessionalNavigationConsideration(
    workspace,
    {
      consideration_id: 'invalid_action',
      navigation_reference_id: 'navigation_w2c',
      current_runtime_position: 'Open',
      available_paths: ['One'],
      constraints: [],
      required_evidence: [],
      low_risk_next_step: 'Observe',
      review_point: 'Tomorrow',
      stop_condition: 'Risk',
      escalation_condition: 'Professional help',
      required_action: 'You must resign.',
      source_references: [externalSource]
    }
  ),
  /required action/
);

let timeline = timelineModule.createProfessionalFollowUpTimeline(workspace);
timeline = timelineModule.appendProfessionalFollowUpEvent(
  workspace,
  timeline,
  {
    event_id: 'event_access',
    event_type: 'professional_access_granted',
    event_label: 'Professional access granted',
    occurred_at: '2026-07-28T01:00:00.000Z',
    source_record_id: consent.consent_id,
    client_visible: true
  }
);
timeline = timelineModule.appendProfessionalFollowUpEvent(
  workspace,
  timeline,
  {
    event_id: 'event_revision',
    event_type: 'report_revised',
    event_label: 'Reading revised',
    occurred_at: '2026-07-29T02:00:00.000Z',
    source_record_id: secondRevision.revision_id,
    client_visible: true
  }
);
assert.equal(timeline.events.length, 2);
assert.equal(timeline.events[0].event_id, 'event_access');
assert.equal(timeline.runtime_timeline_overwritten, false);
assert.equal(timeline.append_only, true);
assert.throws(
  () => timelineModule.appendProfessionalFollowUpEvent(
    workspace,
    timeline,
    {
      event_id: 'event_revision',
      event_type: 'service_completed',
      event_label: 'Completed',
      source_record_id: 'service_w2c'
    }
  ),
  /unique/
);

const projection = projectionModule.buildProfessionalW2CProjection(
  workspace,
  {
    reading_revisions: [firstRevision, secondRevision],
    navigation_considerations: [consideration],
    follow_up_timeline: timeline
  }
);
assert.equal(projection.read_only, true);
assert.equal(projection.professional_actions_enabled, false);
assert.equal(projection.reading_revisions.length, 2);
assert.equal(projection.api_called, false);
assert.throws(
  () => projectionModule.buildProfessionalW2CProjection(workspace, {
    reading_revisions: [{ workspace_id: 'other', client_id: 'other' }]
  }),
  /outside/
);

for (const token of [
  'data-professional-view="revisions"',
  'data-professional-view="considerations"',
  'data-professional-view="timeline"',
  'id="professionalReadingRevisions"',
  'id="professionalNavigationConsiderations"',
  'id="professionalFollowUpTimeline"'
]) {
  assert.ok(page.includes(token), `Workspace page missing: ${token}`);
}
for (const boundary of [
  'reading_revisions',
  'navigation_considerations',
  'follow_up_timeline',
  'readingOverlayBoundary',
  'navigationChoiceBoundary',
  'timelineBoundary'
]) {
  assert.ok(
    controller.includes(boundary),
    `Workspace controller missing: ${boundary}`
  );
}
for (const forbidden of [
  'fetch(',
  'sessionStorage',
  'localStorage',
  '/api/',
  'runtime-persistence',
  'required_action ='
]) {
  assert.equal(
    controller.includes(forbidden),
    false,
    `W2C controller crossed its read-only boundary: ${forbidden}`
  );
}
for (const key of [
  'readingRevisions',
  'navigationConsiderations',
  'followUpTimeline',
  'readingOverlayBoundary',
  'navigationChoiceBoundary',
  'timelineBoundary'
]) {
  assert.ok(enLocale.includes(`${key}:`), `English locale missing ${key}`);
  assert.ok(zhLocale.includes(`${key}:`), `Chinese locale missing ${key}`);
}
assert.ok(css.includes('.professional-comparison'));
assert.ok(css.includes('.professional-consideration-grid'));
assert.ok(css.includes('.professional-follow-up-list'));
assert.ok(css.includes('grid-template-columns: repeat(2'));
assert.ok(css.includes('max-width: 768px'));
assert.ok(css.includes('max-width: 520px'));
assert.ok(css.includes('width: min(1440px'));

const registry = await json(
  'content/registry/m4b-w2c-professional-revision-navigation-follow-up.json'
);
assert.equal(
  registry.baseline.commit,
  '6dc1dce5ef9918d155074c82ba08d274c9e75dbb'
);
assert.equal(registry.boundaries.runtimeReadingOverwriteAllowed, false);
assert.equal(registry.boundaries.navigationContractOverwriteAllowed, false);
assert.equal(registry.boundaries.runtimeTimelineOverwriteAllowed, false);
assert.equal(registry.boundaries.externalReaderRequiredActionAllowed, false);
assert.deepEqual(registry.responsiveAcceptance, [360, 768, 1440]);

const packageJson = await json('package.json');
assert.equal(
  packageJson.scripts[
    'check:m4b-professional-revision-navigation-follow-up'
  ],
  'node scripts/check-m4b-professional-revision-navigation-follow-up.mjs'
);
assert.ok(packageJson.scripts.precheck.includes(
  'scripts/check-m4b-professional-revision-navigation-follow-up.mjs'
));

console.log('✓ M4B-W2C passed: immutable Reading Revision overlays, non-prescriptive Navigation Considerations and append-only Professional Follow-up Timeline are aligned.');
console.log('  Runtime Reading, Navigation Contract, Runtime Timeline and Runtime Evidence remain unchanged; API, browser Runtime storage, D1 persistence and real client data remain disabled.');
