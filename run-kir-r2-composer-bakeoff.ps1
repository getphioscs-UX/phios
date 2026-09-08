# Do NOT paste API keys into the script. Set them only in the current PowerShell session.
# $env:OPENAI_API_KEY="..."
# $env:MISTRAL_API_KEY="..."
# $env:GEMINI_API_KEY="..."
# $env:DEEPSEEK_API_KEY="..."
node .\run-kir-r2-composer-bakeoff.mjs .\PHIOS-KIR-R2-24-CASE-COMPOSER-BAKEOFF-PACK.json .\PHIOS-KIR-R2-24-CASE-COMPOSER-BAKEOFF-RESULTS.json
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
node .\build-kir-r2-composer-bakeoff-review.mjs .\PHIOS-KIR-R2-24-CASE-COMPOSER-BAKEOFF-RESULTS.json .\PHIOS-KIR-R2-24-CASE-COMPOSER-BAKEOFF-HUMAN-REVIEW.html
