RCA-R1 current-main audit

HEAD / local origin-main: f99d9c4e933763b1af826b475fa20d350e080a43. Latest local main is a main merge; no remote pull, deployment or push. Initial working tree only contained the prior BaZi C1 blocker audit. No AGENTS.md found.

Owners traced before implementation:

- Ask entry: knowledge/ask/index.html → assets/customer-ui/js/surfaces/contextual-ask.js → functions/api/customer-contextual-ask.js → functions/contextual-ask/contextual-ask-runtime.js and functions/api/ask-phios-orchestrated.js. Older assets/customer-ui/js/surfaces/ask.js uses customer-ask.js. Neither transcript nor answer is report authority.
- Account generation: assets/customer-ui/js/surfaces/account-persons.js → functions/api/account-method-reports.js → functions/account/ziwei-account-delivery.js.
- Frozen V1: functions/report-delivery/ziwei-canonical-person-binding.js; only personId, locale, targetContext. Keep bytes unchanged; successor required.
- Method authority: functions/report-delivery/ziwei-production-generation-v1.js loads owned canonical person, consent and entitlement; functions/personal-reading/narrative/ziwei-publication-adapter.js resolves calculated evidence; functions/zi-wei-full-production owns method facts.
- Authoring/composition: functions/personal-reading/narrative/ziwei-professional-synthesis-r5.js → report-section-brief.js → report-pro-composer-r1.js → report-publication-ir-v2.js. R5 generation owns admitted semantic snapshot. Context overlay will consume the completed canonical candidate, never alter its method claims, provider brief or accepted paragraphs.
- Current Reality: functions/current-reality/personal-current-reality-runtime.js and existing functions/api/customer-current-reality.js. Guided questions/summary/confirmation, canonical observations, comparison states and method probes remain owned there. Existing API is stateless/unowned; report-specific authenticated actions will extend that route, with bounded private storage rather than a second intake API.
- Profile: functions/profile/profile-context-runtime.js, profile-foundation-runtime.js and existing W7 correlation checks. No automatic writes.
- Memory/continuity: functions/runtime/memory/runtime-memory-contract.js and functions/runtime/continuity/reality-continuity-contract.js. Source classes and append-only guardrails remain unchanged.
- Private subject: functions/account/canonical-person-store.js uses AES-GCM, owner-scoped queries, associated data and digest. Report brief storage follows that protected pattern with a separate encryption binding; metadata has no text.
- Snapshot/release: report-section-snapshot.js → account/ziwei-controlled-report-material.js → PRIVATE_REPORTS and account_method_report_materials. Reopen is read-only and hashes released bytes.
- Browser: workers/method-report-renderer/index.js validates snapshot/composition/physical pages/assets/overflow/digest. Existing R5 contract is 39 pages; account delivery still hard-codes 33, a pre-existing mismatch. Successor account dispatch will retain canonical behavior and use an explicit contextual page contract. No forged browser receipt grants.
- Visual: ziwei-professional-publication-r5.js and canonical-presentation-runtime/ziwei-report-visuals.js, publication-report-pages.js. Context uses existing body asset, additional physical pages, original masters/copy preserved.
- Build: scripts/build-cloudflare-pages.mjs excludes docs/tools/fixtures/functions/scripts/workers from static publication. Never put private context into public assets or URLs.

Affected checks: reading-evidence-boundary, runtime-memory-contract, reality-continuity-contract, profile W7 and W7–W10, canonical-account-person, controlled Zi Wei delivery, renderer/admission checks, Pages check-only build. New focused RCA check stays outside global check until owner acceptance.

BASELINE.json records frozen files and hashes before editing. Mutable integration points: current-Reality API routing, account-method report dispatch, account generation UI, explicit Ask handoff, renderer successor version. Existing consent, comparison, chart, Profile, memory and commerce contracts are not reopened.

Page-count decision B: additional context pages, one page per admitted observation plus a bounded integration page; no compression of canonical prose. Maximum observations remains governed by existing collection limits. Context is self-report unless a server-resolved separately admitted stronger record supports a specific observation. Client source labels cannot grant R3.
