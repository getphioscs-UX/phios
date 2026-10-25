# Tarot / I Ching language contract

Local implementation candidate · PARTIAL · HUMAN_REVIEW_READY

HEAD: 883c41766072c7f8df3c83947ed9774906f8e35c
Actual uncommitted source digest: 592f492ef8e9becc48e841c9a85009dd3f37dc0e274b49d6d39f9de65c38e70d
Source scope: VERIFIED-SOURCE.json (586 imported/source dependencies). HEAD alone does not identify the tested candidate.


One product, one purchase, three presentation choices. New quotes use PERSONAL-EVIDENCE-READING-R1.2 with no surcharge. Original persisted quotes remain validated under their old pricing version. Legacy PDFs are never rewritten. Existing underlying draw/cast store is read-only during export.

Local product pages: /perspectives/tarot/?readingExport=1 and /perspectives/iching/?readingExport=1, with locale=en or zh-Hans. The new local-only account export adapter uses the existing symbolic D1 store and an exact purchase context.readingId, not merely any purchase of that method. Cross-account, unpaid, expired/revoked source or entitlement is denied. Source digest/reading ID stay fixed through all languages and re-downloads. No payment/provider/card draw/casting operation is invoked.

Persisted bilingual corpus fields may be selected deterministically. Unsupported language strings return READ-ING_TRANSLATION_UNAVAILABLE (actual code READING_TRANSLATION_UNAVAILABLE); no translation is fabricated. Actual tests cover both small synthetic stored narratives and real current Tarot/I Ching owner outputs for synthetic questions, with all three languages and unchanged reading identities. This is NOT a new acceptance of the full corpus. Tarot emits admitted paired commentary, never arbitrary metadata strings. I Ching reuses the existing admitted 448-unit language owner only after exact original-language content/provenance/unit identity match; a simulated changed source rejects the opposite-language request. NATIVE-READING-EVIDENCE.json records the actual native owner proof. Production full paid-release adapter admission remains separate: current P8 account method registry admits only BZR and readable ZWR. This local export is not promoted into that release registry.

Remote RM19/RM39 prices verified; old BILINGUAL_ONLY product metadata still needs separate authorized reconciliation. Per-reading USD1/USD2 protections remain.

