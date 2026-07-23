# M3A-W1 Visual Acceptance Fixes

## Baselines

- Round 2 code baseline: `main` at `a17e5276c7010f45b1da1b8e0ad4fe1b25a8ff14`
- Production visual baseline: `ad5de1cd11a72ef71550d165d444436b81a99314`
- Audited pages: Home, About, Atlas, Entry, Reading, Navigation

## Closure

This patch adds a final compatibility stylesheet to the six audited pages. It:

- keeps skip links off-screen until keyboard focus;
- converts the Entry stage indicator to five bounded grid tracks;
- gives the Runtime sidebar an explicit high-contrast dark-surface palette;
- enforces a 44px minimum target on the audited compact controls.
- explicitly covers the page-specific About language buttons after the
  1363px Production retest found them at approximately 24–31px by 33px.

The patch does not change Runtime JavaScript, APIs, storage keys, state,
element IDs, or translation keys.

## Verification

Run:

```sh
node scripts/check-m3a-visual-acceptance-fixes.mjs
npm run check
```

After deployment, repeat the six-page Production visual check at 360px,
768px, and 1440px. Confirm keyboard focus visibility and both UI languages.
Production visual acceptance remains pending until that read-only retest.
