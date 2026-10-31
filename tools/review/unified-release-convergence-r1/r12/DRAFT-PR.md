Preview R1.2: isolate accepted customer views and gate report delivery

Base: main d15ae4c8480cf46f81152fb8c87e623f1b8fb13c
Source branch: codex/unified-release-preview-r12
Exact source: d305a6ada24e770082762d860758cc88402d537c

The source candidate preserves the existing 18-file report delivery handoff and latest main's R1.2 review evidence. Pending R1.2 publication source, ECR R4, World PR14 and 11 cross-window owner deltas are explicitly excluded. Only the named Cloudflare Preview branch receives READ_ONLY/closed commerce flags; Production and existing World branch behavior remain unchanged. Fifteen pending method HTML files and five hub links are omitted from Preview; account, paid APIs and review paths are denied even by direct URL.

Validation: 53 bounded policy checks; Functions JSON invariant; final-source Functions/Worker and static boundary; incremental local compiled Worker browser and real public R2 bytes. Existing 57 report checks inherited by unchanged source. No full local npm check. GitHub candidate CI and deployed Cloud QA still require authorization; no production admission.

Only 26 scoped paths differ from main; exact inventory in RELEASE-MANIFEST.json. Draft PR only. Do not merge or publish Production. Current Cloudflare all-branch auto Preview requires branch exclusion before push if CI must precede deployment.
