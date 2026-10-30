# BaZi prelive — shared NUM successor reconciliation

2026-10-30. Acceptance-fix only. Current HEAD af44a78737fa8378fb4c5e284b2a6216d0364ea5.

Historical checker failure reproduced from HEAD in memory: current NUM P06 source aa94550b13768b04726e90a6d51ae91c2bc39825ed32b38e805fd73cf2329b95 differs from historical inactive appendix 88c7d35c21febb016667617a525ad742e1a6fe2d8f02417359088a1bfbdcab4f. No frozen hash or old receipt changed.

The new exact successor record covers only existing NUM P06 three-field change, NUM inventory/section order, and exact retention of the nine historical NUM R20 section rows. Current hashes and NUM provenance must match. Previous bytes are reconstructed in memory, then the original historical guards run unchanged on them. Other methods, unregistered code/fields, unknown bytes and customer-publication escalation remain rejected.

Actual checks: prelive 46 groups PASS; new positive/negative checks17 PASS; historical final-closure9 groups PASS. The first candidate guard exposed two stricter-than-source assumptions (NUM-only historical archive and absent publicationEligibility on owner-selected posters); those were corrected to the exact existing shapes, without changing shared source.

Content repair and Human ACCEPT remain PENDING. currentRendererFitAccepted=false. No provider/production/commit/push/deploy. Next: user may rerun their interrupted npm sequence; this task did not run the global suite.
