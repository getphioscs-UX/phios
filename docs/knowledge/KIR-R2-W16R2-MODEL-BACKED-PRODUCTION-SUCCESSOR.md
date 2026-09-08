# KIR-R2-W16R2｜Model-backed Answer Intelligence Production Successor

Baseline: `db794e5a22d8d0ecc36ebaab6420b3bca804a7ce`.

W16R2 is a successor, not a rewrite of W16R. Existing W15R/W16R evidence remains immutable. The provider is a composer only; PHI OS admitted article/manuscript/canonical evidence remains the knowledge authority.

## Runtime policy

- T1 default: OpenAI GPT-5.6 Luna, reasoning effort `none`.
- T2 complex/escalation: DeepSeek V4 Flash, thinking disabled.
- The gateway is disabled unless `PHIOS_KIR_R2_MODEL_GATEWAY_ENABLED=true`.
- If the W16R2 customer-language guard rejects a Luna answer and DeepSeek is configured, the same evidence is recomposed once with DeepSeek.
- No provider may add PHI meaning, method meaning, personal facts, unsupported examples, medical claims, scores, or external facts.

## Customer guard

In addition to the existing semantic guard, W16R2 rejects internal terminology leakage, knowledge-chain meta templates, unexpected writing-system contamination, and excessive node-style headings.

## Production status

Engineering is ready for a live 100-case campaign, but production admission is not claimed. The production gate remains closed until a new 100-case provider-backed campaign is run against current evidence and human review reaches at least 85/100 accepted with zero critical failures.

## Local live campaign

Required environment variables are secrets and must not be committed:

- `OPENAI_API_KEY`
- `DEEPSEEK_API_KEY`
- `PHIOS_KIR_R2_MODEL_GATEWAY_ENABLED=true`

Run `npm run run:kir-r2:w16r2-live`. Then run `npm run build:kir-r2:w16r2-review` and perform human review. The live output is intentionally not a machine acceptance artifact until the human gate is complete.
