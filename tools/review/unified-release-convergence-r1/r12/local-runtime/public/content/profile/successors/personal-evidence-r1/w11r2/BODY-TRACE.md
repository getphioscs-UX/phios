# Profile body trace — W11R2

Baseline receipt: `baseline-receipt.json` (captured before presentation edits).

| Stage | Actual owner / path |
|---|---|
| BODY_VISUAL_REGISTRY | personal-evidence-shared-visual-binding-v1.json; section-master-binding-v1.json |
| BODY_VISUAL_R2_KEY | images/reports/profile/editorial/VIS-REPORT-PROFILE-BODY.webp |
| BODY_VISUAL_RESOLVER | functions/profile/personal-evidence-visual-assets.js → resolvePersonalEvidenceSharedVisual('BODY') |
| BODY_VISUAL_PUBLIC_URL | https://pub-1967bc5812ee4164b19a806fb1427021.r2.dev/images/reports/profile/editorial/VIS-REPORT-PROFILE-BODY.webp |
| BODY_RENDERER | functions/canonical-presentation-runtime/personal-evidence-dossier-presentation.js |
| BODY_TEMPLATE | Prior `page()` produced plain `pub-page pe-body` articles, with no background image |
| BODY_CSS | assets/customer-ui/surfaces/personal-evidence-dossier.css |
| PRINT_RENDERER | assets/customer-ui/surfaces/report-print-shell-v2.css; browser A4 print of the same dossier DOM |
| NARRATIVE_SOURCE | Prior source-card values and precisionBoundary; no chapter narrative layer |
| EVIDENCE_CARD_SOURCE | ProgressiveProfileView.signalCards; source identifiers/date/provenance remain upstream |
| REVIEW_GENERATOR | scripts/build-profile-personal-evidence-r1-human-review.mjs; portable-review.mjs |

The API carries the evidence view through `buildPersonalEvidencePublicationProjection`, RR assembly and `buildPersonalEvidencePublicationIr`. IR currently carries source-bound JSON blocks; it does not author the chapter reading. CPR renders from the same source view and dossier projection. The client bundle uses that same CPR renderer; review generation imports it directly. No separate PDF renderer restores an omitted image.

**Root cause:** the dossier projection resolves BODY correctly and passes it into every section, but the CPR renderer ignores `section.body`. Its `page()` inserts only a figure or raw evidence rows; CSS supplies an opaque pale background. Therefore BODY is absent from the final HTML DOM and from print/PDF. A registry entry and a successful GET cannot prove projection.

W11R2 repairs this at the CPR composition layer: source-bound narrative units, canonical BODY image on every body article, distinct chapter jobs, compact supporting figures, and bilingual reflow. RR lifecycle, IR source claims, scoring, source-class contracts and PFIG projection remain unchanged. Missing body resolution blocks composition; broken images block review printing.
