# PHI OS KIR-R2 Composer Bake-off

Baseline: `9a804e070dc422532c2a6dbcf743ecb2b2c2159a`

This pack compares the same 24 W16R evidence packs across:

- OpenAI GPT-5.6 Luna (`gpt-5.6-luna`)
- Mistral Small 4 (`mistral-small-2603`)
- Gemini 2.5 Flash-Lite (`gemini-2.5-flash-lite`)
- DeepSeek V4 Flash (`deepseek-v4-flash`)

The 24 cases are deliberately balanced between 12 W16R controls previously accepted by human review and 12 challenge cases previously rejected for weak/template-heavy composition. The evidence pack, question, language, target length, and PHI OS authority constraints are identical for all providers.

## Important

No API credentials are included in this package. The runner fails closed if any required key is missing. It never substitutes simulated model output.

Set credentials in the current PowerShell session only, then run `run-kir-r2-composer-bakeoff.ps1`.

The low-cost T1 comparison disables/minimizes reasoning on all four models where supported. This isolates grounded composition quality and keeps token cost comparable.

After execution, the review builder creates a blinded Provider A/B/C/D HTML. Review before opening the separate provider key.
