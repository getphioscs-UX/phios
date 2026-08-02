# EXP-W6 Navigation, Review, Memory and Continuity Acceptance

Baseline: `a59f2feb972b74aa6a877feaf0b3216e4d44b9a8`  
Freeze: `EXP-W6-v1.0.0-Frozen`

## Customer responsibility decision

The four customer states now have one distinct responsibility each:

| State | Customer responsibility | Primary action |
|---|---|---|
| Navigation | Choose one observable next step and understand how and when to test it. | Choose a direction |
| Review | Record what happened, decide whether the direction worked, and continue, revise or close. | Confirm this Review |
| Memory | See saved Journey, Reading and actions, what is returnable, and what remains in progress. | Return to saved work |
| Continuity | Continue, start a new version or topic, pause, resume, or end the current action. | Confirm how to continue |

Navigation path cards expose why to start now, the expected change, execution, valid and invalid signals, and Review timing. Operational record status is a supporting disclosure rather than the page purpose.

Review keeps the selected direction and evidence as optional supporting context. The detailed runtime-state selector remains as a controller compatibility field outside the customer layer. Saving the Journey is a post-Review handoff and no longer competes with the Review primary action.

Memory removes identifiers, contract and lineage from the default customer hierarchy. Browser data controls remain available but are described as downloading or removing the saved local copy. Technical history is explicitly collapsed.

Continuity no longer asks the customer to repeat changed conditions or the Review decision. It projects the existing bounded outcomes into customer choices without adding a Runtime state or changing transition execution.

## Post-W0 scorecard

| Page | Purpose | Next step | Customer language | Hierarchy | Continuity | Completion | Total |
|---|---:|---:|---:|---:|---:|---:|---:|
| Navigation | 3 | 3 | 3 | 2 | 2 | 2 | **15/18** |
| Review | 3 | 3 | 3 | 3 | 2 | 2 | **16/18** |
| Memory | 3 | 3 | 3 | 3 | 2 | 2 | **16/18** |
| Continuity | 3 | 3 | 3 | 3 | 3 | 2 | **17/18** |

These code-level comparison scores do not replace the historical EXP-W0 scores or its Failed decision. Production visual acceptance is required before Production Passed.

## Frozen boundaries

The registered PDS-W8 protected artifacts remain byte-identical. Runtime Contract, Review Contract, persistence, lineage, Registry authority, Schema, Migration, D1, Payment, Entitlement, Consent and Provider behavior are unchanged. No new Runtime state is introduced. The M3C Navigation operationalization evidence records the new customer-renderer hash; this is an acceptance hash update, not a Registry-authority or behavior expansion.

The PWS-W1 public-page integrity assertion is updated to the EXP-W6 Navigation HTML hash. This is acceptance evidence for an authorised presentation change; the professional authorisation loader, gate order, denied-read behavior and audit contract remain unchanged.

## Local verification

The EXP-W6 checker verifies the six Navigation decision fields, Review primary-action separation, Memory customer overview, restricted technical fields, six Continuity choices, responsive projection CSS and every registered protected-artifact SHA-256 hash. Existing PDS-W8, Navigation Review Gate, final-polish, public Journey and i18n checks remain required through `npm run check`.

Production acceptance remains pending deployment at 360px, 768px and 1440px in English and Chinese, including keyboard operation, visible focus, horizontal-overflow, console-error and stateful Journey checks.
