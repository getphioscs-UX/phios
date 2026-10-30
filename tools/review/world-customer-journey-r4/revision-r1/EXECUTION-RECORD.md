# World R4 Human Review Revision R1

Status: REVISE_PENDING_RECHECK. Original PR14, branch and Master reused.

- Confirmed default landing gave all four tabs tabindex=-1. The first unselected direction now remains reachable; selection still corresponds only to the active panel. Native Enter/Space and existing arrow/Home/End behavior preserved.
- Added stable per-workspace headings, localized live loading/ready/failure states and aria-busy. Explicit navigation only reveals the heading and retains tab focus. Back, reload, initial deep links and locale updates do not invoke this reveal.
- Real rapid-switch testing caught an ordinary-motion smooth-scroll failure. It is preserved in SMOOTH-SCROLL-REGRESSION.json. Immediate positioning now applies consistently, including reduced-motion preference. Keyboard activations use minimal scroll margin to keep navigation focus visible.
- Native module failures are reported as recoverable, not successful; explicit retry reloads the actual module. Only negative delay/failure is intercepted; success uses the real owners.
- Local interaction58 PASS, original browser42 PASS, Home14 PASS, routing30 and W16 PASS. Tests include actual viewport/focus bounds and actual back/reload departure coordinates. Harness selector/locale-menu corrections did not change product expectations.
- v21 registers the exact previous shell and validation hashes. v20 and every historical W16 assertion remain byte-identical. No financial fact, 26-metric calculation, R2 image, route interpreter, Ask or navigation owner changed.
- Original Ask five main differences plus one R4 Compare difference remain separately recorded; no expected result was silently rewritten.
- No new worktree/PR/Master, no main merge, production deployment, production data writes or paid Provider calls.

Final: same29d2a31a GitHub run41053551898 PASS including full npm check and git diff. Exact Preview b06b462a source/read-only PASS; new58/58, original42/42, Home14/14 PASS. Current 360px screenshots visually inspected; default keyboard entry and each workspace title visible. Original Master current revision entry updated, historical baseline retained. PR14 remains Draft, main not merged, Production not deployed, Provider0. R4_HUMAN_ACCEPTANCE remains REVISE_PENDING_RECHECK.
