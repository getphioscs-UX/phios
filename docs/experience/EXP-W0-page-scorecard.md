# EXP-W0｜Page Experience Scorecard

Baseline: `main@4b06288a764462713453c9cc42cbba03747a84f7`  
Scale: 0 = absent/contradictory, 1 = materially obstructed, 2 = understandable with friction, 3 = production-complete. Automated checks do not contribute points.

| Page | Purpose | Next step | Customer language | Hierarchy | Journey continuity | Product finish | Total /18 |
|---|---:|---:|---:|---:|---:|---:|---:|
| Home | 2 | 1 | 1 | 2 | 2 | 2 | 10 |
| Discover | 2 | 1 | 1 | 2 | 2 | 2 | 10 |
| About | 2 | 2 | 1 | 2 | 2 | 2 | 11 |
| Reality Journey Overview | 2 | 1 | 1 | 2 | 2 | 2 | 10 |
| Demo | 3 | 2 | 2 | 3 | 2 | 3 | 15 |
| Entry | 2 | 2 | 1 | 2 | 2 | 2 | 11 |
| Reconstruction | 1 | 1 | 0 | 1 | 1 | 1 | 5 |
| Reading | 1 | 1 | 0 | 1 | 1 | 1 | 5 |
| Navigation | 1 | 1 | 1 | 1 | 1 | 1 | 6 |
| Review | 1 | 1 | 1 | 1 | 1 | 1 | 6 |
| Memory | 1 | 1 | 0 | 1 | 1 | 1 | 5 |
| Continuity | 1 | 1 | 0 | 1 | 1 | 1 | 5 |
| Knowledge Hub | 2 | 2 | 1 | 2 | 2 | 2 | 11 |
| Book I | 2 | 2 | 2 | 2 | 2 | 2 | 12 |
| Atlas | 2 | 2 | 1 | 2 | 2 | 2 | 11 |
| Thesis | 2 | 1 | 0 | 1 | 1 | 2 | 7 |
| Figures | 2 | 1 | 2 | 2 | 2 | 2 | 11 |
| Professional | 2 | 1 | 0 | 1 | 1 | 1 | 6 |
| Financial Services | 2 | 1 | 1 | 1 | 1 | 1 | 7 |

Average: **8.89/18 (49.4%)**. Highest: Demo, 15/18. Lowest: Reconstruction, Reading, Memory and Continuity, 5/18.

## Evidence by page

| Page | Concrete evidence supporting the score |
|---|---|
| Home / Discover | Production hero states the category clearly, but immediately offers Demo and Knowledge while the header offers five peer destinations and a separate Journey CTA. `index.html:104-137` adds three more entry cards. “Runtime”, “Evidence” and “Reading” appear before plain-language orientation (`index.html:125,156-183,246`). Home and Discover have no separate identity. |
| About | Production has a strong six-section on-page map and visible Thesis/Demo actions. The first-screen promise is understandable, but “Runtime”, “Unified Runtime Framework” and “reference implementation” remain customer-facing. |
| Journey Overview | Production renders both the PDS six-stage shell and a seven-stage content model. It exposes three competing hero actions (start, resume, demo) at `reality-journey.html:50-61`, while the shared shell adds another “Go to the main action”. |
| Demo | Production gives a fixed case, evidence toggles, a lightweight input and explicit no-save boundary. The remaining friction is the choice among Watch, Try, Free Observation and Full Journey rather than one dominant completion route. |
| Entry | The customer task is present, but `reality-entry.html:59-94` exposes “Runtime Journey”, Reading, Memory and Continuity; `:486-496` exposes “Live Runtime Representation / Runtime Entry”. The page therefore mixes description with system representation. |
| Reconstruction | Default state says no Runtime Entry exists (`reality-reconstruction.html:116`). The main document exposes “Canonical Runtime Reconstruction”, “Evidence acquisition”, figure codes and an inspector (`:121-175,222-224,540-546`), contrary to the customer-first four-layer rule. |
| Reading | Default state says no Reading is available (`reality-reading.html:212-213`). Before the customer reading, the DOM contains Figure 13B, Runtime Coordinates, Capability, Interfaces and Canonical Runtime Interpretation (`:230-350`); technical terminology dominates the product frame. |
| Navigation | The state is dependent on a completed Reading, and the page combines path comparison, evidence log, execution preparation, readiness and review gating. This prevents one clear default task even though the intended task is “choose one observable direction”. |
| Review | The state depends on Navigation and combines outcome capture, next-state selection, Memory preparation and lineage handoff. “Prepare Runtime Memory” (`reality-review.html:172`) is an internal-object action rather than the PDS customer task of comparing change. |
| Memory / Continuity | Both are implemented in `my-reality.html`, whose empty state says Runtime Memory is not ready (`:39-40`). Customer-visible fields include “Memory ID” and “Memory contract” (`:61,122`); Continuity presents its own contract/state language (`:164-235`). Separate customer tasks are merged into one technical workspace. |
| Knowledge Hub | A distinct hub exists and is globally linked. Its category, articles, book and atlas routes are findable, but PHI OS architecture terms remain the organizing language rather than user questions. |
| Book I | The product is identifiable and offers preview/purchase/read routes. It feels more finished than the Hub, though it remains connected to multiple overlapping Book I summaries elsewhere. |
| Atlas | The 14-part map is substantial and navigable. The page is called Atlas in content/footer but “Explore” in the header, weakening location and return-path recognition. |
| Thesis | It presents category, framework, Runtime layer, books, implementation, related articles and embedded/full PDF in one route (`thesis.html:175-264`). The research terminology is appropriate to the artifact but not sufficiently progressively disclosed for a first-time public route. |
| Figures | The gallery has a clear title and part filter (`figures.html:24-45`). It lacks a strong next action from a figure to the relevant plain-language article/book section. |
| Professional | Six service concepts, six comparison rows, external readers, booking, interpretation boundary, three operating layers and professional boundary compete on one page (`services.html:41-123`). Price, delivery time and availability are absent. |
| Financial Services | The route explains scope and process, but eleven equal-weight sections plus a second service comparison flatten hierarchy. “The fee is confirmed before booking” (`professional/financial/index.html:21`) withholds the decision-critical price. |

## Five user-task results

| User task | Result | Evidence |
|---|---|---|
| First encounter with PHI OS | **Failed** | Category statement is visible, but the first screen and next section do not resolve whether the visitor should learn, demo, explore or start; internal vocabulary appears before a plain example. |
| Start Reality Journey | **Conditional failure** | A global Journey CTA and overview exist, but the overview offers Start, Resume and Demo concurrently and conflicts between six customer stages and seven product stages. |
| Understand Reading | **Failed** | Demo provides a useful lightweight example, but formal Reading foregrounds Runtime/coordinate/interface terminology and does not provide a standalone customer explanation before the stateful page. |
| Find Knowledge | **Conditional pass** | Knowledge Hub is globally findable and Atlas/Thesis/Book/Figures exist, but “Knowledge”, “Explore” and “Atlas” split one mental model and duplicate Book I entry content. |
| Find Professional Service | **Failed** | Services is findable, but product choice cannot be completed because price, turnaround, availability and included deliverables are not stated; internal evidence/governance language dominates comparison. |
