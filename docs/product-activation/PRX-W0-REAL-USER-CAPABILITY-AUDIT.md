# PRX-W0 | Real User Capability Audit

Baseline: `007fee6f24071d0653ce120be9ec832efc5c11a4`

## Audit conclusion

The repository is **not an empty backend**. It contains real executable capability, but product activation is inconsistent. The most important discovery is that `/personal-runtime` already contains a real input → governed execution → result flow, while the newer `/professional/personal-runtime/` page is presentation-only and has hidden the usable surface from the current PX2 navigation. Financial Runtime has substantial backend infrastructure but no general-user intake/result vertical slice. Ask PHI OS is wired end-to-end but its answer-state logic can classify weak retrieval/grounding as `NEEDS_CONTEXT`, causing ordinary knowledge questions to fail as if personal context were required.

## Capability status

| Capability | Input | Runtime binding | Result | Real-user status |
|---|---:|---:|---:|---|
| Ask PHI OS | yes | yes | yes | PRODUCT_WIRED_BUT_BEHAVIORALLY_BLOCKED |
| Personal Runtime `/personal-runtime` | yes | yes | yes | RUNTIME_AND_PRODUCT_SURFACE_EXIST_BUT_DISCOVERY_IS_BROKEN |
| PX2 Personal `/professional/personal-runtime/` | no | no | no | PRESENTATION_ONLY |
| Financial `/professional/financial/` | no | backend only | no public snapshot | RUNTIME_READY_NOT_PRODUCT_READY |
| Search `/search/` | yes | yes | yes | PUBLICLY_USABLE_STATIC_KNOWLEDGE_DISCOVERY |
| Reality `/reality/` | no | elsewhere | no | PRESENTATION_ONLY |

## Evidence that Personal Runtime is not vaporware

`personal-runtime.html` contains 1 form, 11 inputs, 5 selects and 8 buttons. `assets/js/pages/personal-runtime.js` builds canonical birth input, checks eligibility, requests execution and renders results. It calls `/api/method-execute`, which is implemented by `functions/api/method-execute.js`. The MCD-7 registry explicitly declares `/personal-runtime` and production tabs for Astrology, BaZi and Numeric.

The failure is product routing and presentation reconciliation: the newer `/professional/personal-runtime/` surface contains no user input and became the visible product entry. PRX must recover the already-wired route rather than rebuilding the runtime from scratch.

## Ask PHI OS failure mechanism

`functions/_lib/client-knowledge-ask-b.js::resolveCkaAnswerState()` currently returns `NEEDS_CONTEXT` when an answer is ungrounded and no guided context was supplied, and also when coverage is `INSUFFICIENT_COVERAGE` without guided context. That is safe but semantically wrong for many general knowledge questions: insufficient retrieval is not the same thing as missing personal case context. PRX-W2/W3 must introduce intent-aware separation between KNOWLEDGE and CASE questions.

## Financial Runtime status

The backend contains intake contracts, schema registry, calculation layer, formulas, assumptions, risks, evidence, analysis runtime, holistic planning and professional review. The existing M4A checker confirms this infrastructure. But `/professional/financial/` has no form/input/select and there is no general-user public financial execution endpoint in this baseline. PRX-W8–W11 must create the actual input → normalized state → calculation → snapshot → scenario vertical slice.

## Detour files

### Modify now

- `assets/js/public-shell-v2.js` — point first-class actions to executable product starts.
- `professional/personal-runtime/index.html` — reconcile/redirect to the real `/personal-runtime`; do not keep an explanation-only page as the primary runtime entry.
- `personal-runtime.html` — **keep**, modernize presentation and make discoverable.
- `assets/js/pages/personal-runtime.js` — **keep execution logic**, add real-user acceptance instrumentation later.
- `professional/financial/index.html` — convert from explanation page to intake/start product.
- `functions/_lib/client-knowledge-ask-b.js` — split weak knowledge grounding from missing case context.
- `assets/js/pages/knowledge-search-b.js` and `knowledge-search.html` — expose Knowledge vs Case behavior clearly.
- `readings/index.html`, `reality/index.html`, `index.html` — change CTA paths from explanation to execution.

### Successor first, then delete/archive

- `assets/css/pxr-public-experience.css`
- `assets/js/public-experience/pxr-public-experience.js`
- `assets/css/hpc2-pre-home-visuals.css`
- `assets/css/runtime-spine.css`
- `assets/js/pages/runtime-spine-visuals.js`
- `assets/css/service-continuity.css`
- `assets/js/pages/service-continuity-visuals.js`
- `assets/css/client-production-surfaces.css`
- `assets/js/pages/client-production-surfaces.js`
- `assets/js/pages/knowledge-spine-visuals.js`
- `assets/js/public-shell.js`

These are not all immediately deletable. Several still have live secondary-page consumers or frozen checker references. The correct sequence is migrate consumer → successor checker → zero-consumer audit → delete.

### Keep

Do **not** delete method execution/runtime, financial runtime, public knowledge authority or five-book registries. These are the valuable backend assets PRX will activate.

## New completion rule

A work item must state one of: `ARCHITECTURE_READY`, `RUNTIME_READY`, `PRODUCT_WIRED`, `USER_ACCEPTED`. Only `USER_ACCEPTED` means customer-production complete.
