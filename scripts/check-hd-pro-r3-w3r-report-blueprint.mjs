import assert from 'node:assert/strict';
import fs from 'node:fs';

const ROOT='content/customer-experience-rebuild/hd-pro-r2/hd-pro-r3';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const blueprint=read(`${ROOT}/report/hd-pro-r3-report-blueprint-authority-v1.json`);
const admission=read(`${ROOT}/source/HD-PRO-R3-W2A-user-authored-source-admission-v1.json`);
const md=fs.readFileSync(`${ROOT}/report/HD-PRO-R3-W3R-report-blueprint-authority.md`,'utf8');

assert.equal(blueprint.schemaVersion,'PHI-OS-HD-PRO-R3-W3R-REPORT-BLUEPRINT-AUTHORITY-v1.0.0');
assert.equal(blueprint.baselineCommit,'791e1a130750affa13831f248e89a8b921e54743');
assert.equal(blueprint.status,'REPORT_BLUEPRINT_AUTHORITY_ESTABLISHED_R3_SHADOW');
assert.equal(blueprint.publication.r2State,'CUSTOMER_PUBLISHED');
assert.equal(blueprint.publication.r3State,'SHADOW_CANDIDATE');
assert.equal(blueprint.publication.generatedR3ReportCustomerPublicationAllowed,false);
assert.equal(blueprint.templateAuthorities[0].sourceId,'HD-UA-REPORT-001');
assert.equal(blueprint.templateAuthorities[0].pageCount,58);
assert.equal(blueprint.templateAuthorities[0].sha256,admission.admittedSources.find(x=>x.sourceId==='HD-UA-REPORT-001').sha256);

assert.equal(blueprint.blueprintPolicy.fixedLegacyPageCount,false);
assert.equal(blueprint.blueprintPolicy.legacyPageCountForReference,58);
assert.equal(blueprint.blueprintPolicy.mailMergeTemplate,false);
assert.equal(blueprint.blueprintPolicy.modularCompositionRequired,true);
assert.equal(blueprint.blueprintPolicy.wholeChartPriorityRequiredBeforeModuleExpansion,true);
assert.equal(blueprint.blueprintPolicy.specialistModulesDefaultOff,true);

const modules=Object.fromEntries(blueprint.modules.map(x=>[x.moduleId,x]));
for(const id of ['COVER','CHART_OVERVIEW','CORE_READING','TYPE_STRATEGY','AUTHORITY','DEFINITION','CENTERS','PRIMARY_CHANNELS','PRIORITY_GATES','PROFILE','PHS_DETERMINATION','ADVANCED_VARIABLES','CAREER_BG5','DREAMRAVE','REALITY_COMPARISON','REFLECTION_PRACTICE','SOURCES_BOUNDARIES','LEGACY_COMMERCIAL_FOOTER']){
  assert(modules[id],`missing report module ${id}`);
}
assert.equal(modules.CAREER_BG5.stateDefault,'SUPPRESS');
assert.equal(modules.DREAMRAVE.stateDefault,'SUPPRESS');
assert.equal(modules.WORK_WEALTH_STRUCTURE.stateDefault,'SUPPRESS');
assert.equal(modules.REALITY_COMPARISON.origin,'PHI_OS_R3_SUCCESSOR_ADDITION');
assert.equal(modules.LEGACY_COMMERCIAL_FOOTER.activation,'NEVER');
assert.equal(modules.LEGACY_COMMERCIAL_FOOTER.disposition,'OMIT_FROM_GENERATED_REPORT');
assert.equal(blueprint.outputTargets.reportGenerationRuntimeImplementedInW3R,false);
assert.equal(blueprint.qualityGate.moduleMayPublishWithoutAdmittedClaims,false);
assert.equal(blueprint.qualityGate.r2MayBeOverwrittenBeforeR3HumanAccepted,false);

for(const token of ['58-page report','modular','R2 remains `CUSTOMER_PUBLISHED`','SHADOW_CANDIDATE']) assert(md.includes(token),`W3R authority note missing ${token}`);

console.log('✓ HD-PRO-R3-W3R Report Blueprint Authority passed.');
console.log('  The user-authored 58-page product is captured as modular editorial/visual authority, not a fixed mail-merge or semantic shortcut.');
