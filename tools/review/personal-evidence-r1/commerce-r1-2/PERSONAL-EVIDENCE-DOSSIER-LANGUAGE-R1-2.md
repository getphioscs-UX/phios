# Dossier language and source identity

Local implementation candidate · PARTIAL · HUMAN_REVIEW_READY

HEAD: 883c41766072c7f8df3c83947ed9774906f8e35c
Actual uncommitted source digest: 592f492ef8e9becc48e841c9a85009dd3f37dc0e274b49d6d39f9de65c38e70d
Source scope: VERIFIED-SOURCE.json (586 imported/source dependencies). HEAD alone does not identify the tested candidate.


Common output identifiers: zh / en / bilingual; zh-Hans compatibility is retained. Existing commercial presentation locale remains zh-Hans. Source snapshot and language rendering identifiers are separate; reportId/source refs stay fixed on re-export. A new report number uses UUID identity.

Chinese/en exports require matching source-language customer accounts; unavailable translations return SOURCE_TRANSLATION_UNAVAILABLE. Bilingual means bilingual deterministic editorial/boundary text with original customer wording explicitly retained as quotations, not a claim that every private free-text source was translated. Customer names and original material are not rewritten. Full translated narratives remain unavailable without an approved resource. No AI fallback.

Existing encrypted runtime artifacts store the source snapshot, selected assessment objects, consent, name, section choices and output preference. Every reopen checks ownership, current eligibility, source expiry/revocation and exact report integrity. Corrected sources produce an historical-version notice without rewriting the old snapshot. Downloaded copies cannot be recalled.

Actual UI: /perspectives/profile/?evidence=1&locale=en or zh-Hans, local host only. Select specific records, optional saved assessments/sections, choose language, explicitly consent, Preview and save, Reopen, Download PDF. The local demo is a synthetic account and resets on server restart; it is not a real IdP/account persistence acceptance.

