# Unified knowledge + data answer contract
Status DESIGN_REVIEW. Gate2B A/B/C/D maps to mechanism/fact/multisource/insufficient claim types; answerability is MECHANISM_ANSWERABLE / FACT_ANSWERABLE / PARTIAL_CONTEXT / EVIDENCE_INSUFFICIENT.

Original question, language, country, period, topic, scale and explicit source context are mandatory. Direct natural-language answer comes first. Every claim has kind observed_fact / conditional_mechanism / hypothesis / definition / design_behavior, support IDs, conditions and uncertainty. Numeric claims require value, unit, country, observation period, publication date or explicit missing-date quality flag, retrieved time, original URL and source version/hash. Missing publication metadata prevents fresh/live classification.

Mechanism claims can be supported while local facts remain unknown. Published PHI OS interpretation never supplies a missing modern observation. Avoid empty sections and irrelevant fixed reading recommendations. Indicators must declare apples-to-apples eligibility; no universal mortgageapproval ranking.

Quality reasons: source_error, not_collected, not_licensed, out_of_scope, stale, no_comparable_data, publication_lag, metadata_incomplete. Never collapse all to a generic gap.

Scope change clears incompatible facts before rendering; preserve original public question during refresh/back/forward and explicit Ask handoff. Private text only after opt-in, not URL/storage/provider; clear on request and scope change. No identity/credit-report demand to obtain public explanation.

Prototype routes curated known questions only, transparently. Unknown question yields EVIDENCE_INSUFFICIENT with its original text, not a near-match answer. Ask handoff here produces a reviewable public context envelope, no submit or provider call; existing product transport remains INPUT_ONLY, missing the full scope bundle.

Machine schema WORLD-R3-GMCH-ANSWER-SCHEMA.json plus validate-contract.mjs enforce metadata/claim semantic guards and negative cases. SOURCE_READ_PASS, RETRIEVAL_PASS, bounded curated-answer checks, LIVE_DATA_PASS and PRODUCTION_PASS are reported separately. No curated-output test is a freeform ANSWER_PASS.
