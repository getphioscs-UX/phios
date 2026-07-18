# PHI OS Rebuild Handoff

This package is a deployable snapshot of the PHI OS website and Cloudflare Pages Functions. It deliberately excludes Git history, credentials, caches, and account-specific deployment state.

## Experience language

1. Entry — Describe the Change / 描述变化
2. Reconstruction — Clarify What Happened / 理清过程
3. Reading — Understand Where You Are / 看见当前位置
4. Navigation — Choose Your Next Direction / 选择下一步
5. Review — Review What Changed / 检视结果
6. Continuity — Continue or Adjust / 继续或调整

## Included runtime flow

- Entry supports Quick (3–4), Guided (5–7), and Deep (7–10) evidence depth. Guided is the default. The rule engine records coverage as `not_asked`, `partial`, `answered`, `no_change`, `uncertain`, or `skipped`, and does not select an already asked target again.
- Reconstruction separates reported evidence, interpretation, professional assessment, and unresolved reality.
- Reading prepares a bounded Reading-to-Navigation contract.
- Navigation presents comparable paths and never selects one for the user. A selection records `selectedPath`, `selectedAt`, and `selectionSource`. Financial Professional Path is visible as a planned professional boundary; Financial Intake is not implemented.
- Review preparation is shown after path selection. Full Review and Continuity runtimes remain later milestones.

## Safety boundaries

- No diagnosis, prediction, automatic path selection, or replacement of professional judgment.
- Relative dates remain in the user's words unless an exact date is supplied.
- Biological or carrier questions must be framed as reported experience, not DNA change or medical assessment.
- OpenAI is optional. The rule engine remains the primary runtime provider.

## Deploy

Cloudflare Pages project settings:

- Framework preset: None
- Build command: leave blank
- Build output directory: `.`
- Functions directory: `functions`

Run `npm run check` before deployment. A new GitHub account may still be treated as restriction evasion; use a permitted account only after GitHub approval, or upload this package directly to Cloudflare Pages / use another Git provider.
