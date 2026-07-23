# M1-W5 Bug Fix Closure

Status: **Closed**

The Bug Register uses P0 Blocker, P1 Critical, P2 Major, P3 Minor, and P4 Cosmetic. All registered M1 bugs are closed; there are no open P0–P4 items.

## Entry

Adaptive target tracking and `answerBindings` prevent duplicate questions and bind each answer to the question target active at submission. Home input enters the same submission path and becomes round one. Date precision remains unknown unless supported by an explicit expression. Locale is forwarded through the language contract. Entry state, messages and bindings are restored when returning from Reconstruction. “Correct or clarify” reopens the Entry input and is distinct from “End for now”. Reconstruction edit links can now target the relevant Entry evidence field.

## Reconstruction

The Continue button is permanently present and enabled only by Reading readiness. Five customer-view cards expose source-edit controls. Source extraction and Evidence Mapping remain in the reconstruction renderer and Reading bridge. Returning to Entry uses revision mode and preserves prior conversation and Runtime IDs. System-derived Unknown Reality placeholders follow the selected UI language while user-authored source evidence remains unchanged.

## Reading

Reading Input accepts only canonical or registered compatible schema identifiers. The renderer consumes the current integrated Reading instead of a separate legacy map. Customer fields, bilingual labels, language refresh and loading cleanup remain covered by existing checks. System-derived Unknown Reality placeholders are localized again whenever the UI language changes; user-authored evidence remains unchanged.

## Navigation

Each actionable path now records a Reading source and an explicit evidence-to-action link, both rendered to the customer. Navigation state persists before rendering or Review. “Continue to Review” prepares the Review Gate, saves it, and then navigates to `/reality-review.html`. An evidence-backed Reading may enter an observation-first Navigation path when the pattern, reported experience, user direction, or Runtime Region remains unresolved; those optional gaps are advisories rather than hard blockers. Insufficient observed evidence remains a hard blocker. System-derived missing fields become bounded Evidence Watch items without being used as inference data. When the UI language changes after Reading, the Navigation API forwards the requested Runtime language and regenerates canonical Grammar labels, transition copy, Evidence Watch prompts, Unknown Reality placeholders, and the rule-generated Alternative Reading summary. Original user-authored evidence remains in its source language.

## Continuity

`functions/runtime/continuity/reality-continuity-contract.js` remains the canonical contract and is covered by `npm run check`.

Future defects must be entered in the Bug Register before being closed. A Freeze Ready build cannot contain an open P0, P1, or P2 item.
