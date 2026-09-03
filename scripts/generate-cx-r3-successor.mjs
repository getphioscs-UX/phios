import fs from 'node:fs';
import path from 'node:path';

const BASELINE = '2cffbc97f9a72c3103780e78c3930f9233a41da0';
const R2_FREEZE_BASELINE = 'f6d31dafdc37dcf3d8f2ebd1236bfa500b7dc64c';
const RECORDED_AT = '2026-09-03T04:58:12Z';
const root = process.cwd();
const base = 'content/customer-experience-rebuild';
const checkMode = process.argv.includes('--check');
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const stable = (value) => JSON.stringify(value, null, 2) + '\n';
function write(rel, value) {
  const abs = path.join(root, rel);
  const text = stable(value);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  if (checkMode) {
    if (!fs.existsSync(abs)) throw new Error(`Missing CX-R3 successor artifact: ${rel}`);
    if (fs.readFileSync(abs, 'utf8') !== text) throw new Error(`Stale CX-R3 successor artifact: ${rel}`);
  } else fs.writeFileSync(abs, text);
}

const r2 = readJson(`${base}/acceptance/cx-r2-acceptance-v2.json`);
if (r2.baselineCommit !== R2_FREEZE_BASELINE || r2.status !== 'ACCEPTED_CUSTOMER_IA_AND_ROUTE_AUTHORITY' || r2.rules.readyForCxR3 !== true) {
  throw new Error('CX-R3 requires the accepted CX-R2 freeze from f6d31da before starting R3 at 2cffbc9.');
}

const design = {
  schemaVersion: 'PHI-OS-CX-R3-CUSTOMER-DESIGN-SYSTEM-v2.0.0',
  work: 'CX-R3',
  baselineCommit: BASELINE,
  recordedAt: RECORDED_AT,
  status: 'CUSTOMER_UI_SYSTEM_READY',
  role: 'PDS_CUSTOMER_IMPLEMENTATION_NOT_SECOND_PDS',
  upstreamAuthority: {
    pdsTokenContract: 'content/registry/pds-w2-design-token-contract.json',
    pdsComponentContract: 'content/registry/pds-w3-core-component-shell-contract.json',
    rule: 'PDS_REMAINS_UPSTREAM_DESIGN_AUTHORITY'
  },
  principles: ['quiet','editorial','spacious','precise','premium','human','evidence-aware','non-mystical','non-dashboard-heavy','non-SaaS-template'],
  cssAuthority: {
    root: 'assets/customer-ui/',
    layers: ['tokens.css','base.css','typography.css','layout.css','components.css','motion.css','utilities.css'],
    namespace: 'cx-',
    legacyCssDependencyAllowedOnMigratedCxRoute: false,
    pageSpecificDesignAuthorityAllowed: false
  },
  colorRoles: ['canvas','surface','surface-raised','ink','ink-muted','border','accent','accent-soft','success','warning','critical','unknown','professional'],
  typography: {
    fontRoles: ['Display','Body','Data optional'],
    scale: ['display-xl','display-lg','heading-1','heading-2','heading-3','body-lg','body','body-sm','label','caption'],
    rule: 'SURFACES_CONSUME_TOKENS_DO_NOT_INVENT_RESPONSIVE_TYPE_SCALES'
  },
  spacing: { scale: Array.from({ length: 12 }, (_, i) => `space-${i + 1}`), sharedRoles: ['section padding','card padding','grid gap','hero spacing','workspace spacing'] },
  layout: ['cx-container','cx-container--wide','cx-container--reading','cx-stack','cx-cluster','cx-grid','cx-split','cx-sidebar-layout'],
  shape: { radiusRoles: ['sm','md','lg','full'], shadowRoles: ['shadow-1','shadow-2'], borderAuthority: 'ONE_SEMANTIC_BORDER_SYSTEM' },
  buttons: ['Primary','Secondary','Quiet','Text','Critical','Icon'],
  buttonStates: ['default','hover','focus','disabled','loading'],
  cards: ['Content Card','Perspective Card','Reality Card','Navigation Option Card','Evidence Card','Unknown Card','Book Card','Professional Card','Report Card'],
  forms: ['input','textarea','select','date','time','segmented','radio','checkbox','consent','error','helper'],
  statuses: ['Available','Limited','Unavailable','In Review','Unknown','Needs Attention','Professional Required'],
  evidenceUi: ['Evidence','Source','Unknown','Confidence','Assumption','Limitation','Professional note'],
  resultPrimitives: ['cx-result-section','cx-result-finding','cx-result-context','cx-result-evidence','cx-result-unknown','cx-result-perspective','cx-result-action'],
  workspaceComponents: ['Workspace Header','Context Summary','Stage Rail','Progress','Tab Navigation','Side Context','Main Content','Continuation CTA'],
  motion: ['fade','reveal','expand','drawer','modal','stage transition'],
  accessibility: ['WCAG AA contrast target','keyboard','visible focus','reduced motion','semantic headings','labels','aria for interactive controls','minimum 44px control target','status not color-only'],
  preview: { route: '/customer-ui-preview/', htmlPath: 'customer-ui-preview/index.html', internalOnly: true, shellAuthorityActivated: false, visualAssetAuthorityActivated: false },
  phaseBoundaries: {
    backendAuthorityTouched: false,
    routeAuthorityChangedByR3: false,
    productionRouteCutoverPerformed: false,
    legacyPhysicalDeletePerformed: false,
    r4VisualAssetAuthorityPerformed: false,
    r5GlobalShellAuthorityPerformed: false,
    methodSpecificUiKingdomCreated: false
  }
};
write(`${base}/authority/customer-design-system-v2.json`, design);

const components = {
  schemaVersion: 'PHI-OS-CX-R3-COMPONENT-REGISTRY-v1.0.0',
  work: 'CX-R3-W6-W12',
  baselineCommit: BASELINE,
  status: 'SHARED_CUSTOMER_COMPONENT_PRIMITIVES_FROZEN',
  groups: {
    buttons: {
      base: 'cx-button',
      variants: ['cx-button--primary','cx-button--secondary','cx-button--quiet','cx-button--text','cx-button--critical','cx-button--icon'],
      states: ['hover','focus-visible','disabled','aria-disabled','aria-busy']
    },
    cards: {
      base: 'cx-card',
      variants: ['cx-card--content','cx-card--perspective','cx-card--reality','cx-card--navigation-option','cx-card--evidence','cx-card--unknown','cx-card--book','cx-card--professional','cx-card--report']
    },
    forms: ['cx-field','cx-input','cx-textarea','cx-select','cx-date','cx-time','cx-segmented','cx-radio','cx-checkbox','cx-consent','cx-field-error','cx-field-helper'],
    statuses: ['cx-status--available','cx-status--limited','cx-status--unavailable','cx-status--in-review','cx-status--unknown','cx-status--needs-attention','cx-status--professional-required'],
    evidence: ['cx-evidence','cx-source','cx-unknown','cx-confidence','cx-assumption','cx-limitation','cx-professional-note'],
    results: design.resultPrimitives,
    workspace: ['cx-workspace-header','cx-context-summary','cx-stage-rail','cx-progress','cx-tab-navigation','cx-side-context','cx-main-content','cx-continuation-cta']
  },
  rules: {
    allNewCustomerComponentsUseCxNamespace: true,
    methodMayConsumePrimitives: true,
    methodMayCreateOwnGlobalUiArchitecture: false,
    semanticVariantsMustNotCollapseIntoOneGenericCard: true,
    availabilityStateIsPresentedNotCalculatedByCss: true
  }
};
write(`${base}/registries/customer-component-registry-v1.json`, components);

const acceptance = {
  schemaVersion: 'PHI-OS-CX-R3-ACCEPTANCE-v2.0.0',
  work: 'CX-R3',
  baselineCommit: BASELINE,
  recordedAt: RECORDED_AT,
  status: 'ACCEPTED_CUSTOMER_DESIGN_SYSTEM',
  requiredExitStates: ['CUSTOMER_UI_SYSTEM_READY','NO_PAGE_SPECIFIC_DESIGN_AUTHORITY'],
  evidence: [
    `${base}/authority/customer-design-system-v2.json`,
    `${base}/registries/customer-component-registry-v1.json`,
    'assets/customer-ui/tokens.css',
    'assets/customer-ui/base.css',
    'assets/customer-ui/typography.css',
    'assets/customer-ui/layout.css',
    'assets/customer-ui/components.css',
    'assets/customer-ui/motion.css',
    'assets/customer-ui/utilities.css',
    'customer-ui-preview/index.html'
  ],
  rules: {
    backendAuthorityTouched: false,
    routeCutoverPerformed: false,
    legacyPhysicalDeletePerformed: false,
    r4VisualAssetAuthorityPerformed: false,
    r5GlobalShellAuthorityPerformed: false,
    readyForCxR4: true
  }
};
write(`${base}/acceptance/cx-r3-acceptance-v2.json`, acceptance);

if (checkMode) console.log('✓ CX-R3 successor design-system artifacts are current for baseline 2cffbc9.');
else console.log('Generated CX-R3 successor customer design-system authority and component registry.');
