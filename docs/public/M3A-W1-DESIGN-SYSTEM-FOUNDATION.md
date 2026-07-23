# M3A-W1 Design System Foundation

## Baseline

- Repository: `getphioscs-UX/phios`
- Branch: `main`
- Commit: `1df74566174ee18457ce8a095fd7a61b14da649f`
- Baseline checks: passing

The six public and Runtime-facing pages are frozen by their pre-migration
SHA-256 values in `content/registry/m3a-design-foundation.json`.

Production screenshots could not be captured in this workspace because the
browser session has an explicit policy preventing access to
`phios-github.pages.dev`. The checksum baseline is complete; visual capture
remains a deployed acceptance item and must not be represented as completed.

## Design layers

The new Design System loads before each legacy page stylesheet. This makes the
new primitives available without changing the ownership of existing page
presentation:

1. `tokens.css`
2. `design/foundation.css`
3. `design/typography.css`
4. `design/layout.css`
5. `design/components.css`
6. `design/motion.css`
7. existing page CSS

## Compatibility contract

`.phi-button` is the canonical new component. Existing `.btn` controls retain
their page-specific presentation while sharing minimum target size, disabled
state, cursor and touch behavior.

Design migration must not rename or remove HTML element IDs, translation keys,
storage keys, API routes, or Runtime states. The M3A-W1 check compares the
current pages with the frozen Git baseline and validates the protected Runtime
contracts explicitly.

## Acceptance command

```bash
npm run check
node scripts/check-m3a-design-foundation.mjs
```
